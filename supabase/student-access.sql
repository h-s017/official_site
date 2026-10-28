-- Student access: run once through the Supabase migration tool. No personal records here.
create schema if not exists shop_private;
revoke all on schema shop_private from public,anon;
grant usage on schema shop_private to authenticated;

create table shop_private.student_applications (
 user_id uuid primary key references auth.users(id) on delete cascade, application_email text not null,
 full_name text not null check(length(btrim(full_name)) between 1 and 80),
 phone text not null check(phone ~ '^\+?[0-9]{8,15}$'),
 courses text[] not null check(cardinality(courses) between 1 and 3 and courses <@ array['KPIA','KDCA','氣味藝術序曲']),
 status text not null default 'pending' check(status in ('pending','approved','rejected','suspended')),
 consent_version text not null default '2026-10-28', consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id), revision bigint not null default 1
);
alter table shop_private.student_applications enable row level security;
revoke all on shop_private.student_applications from public,anon,authenticated;
create table shop_private.student_review_log (
 id bigint generated always as identity primary key,
 student_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 previous_status text, next_status text not null, reason text not null default '',
 created_at timestamptz not null default now()
);
alter table shop_private.student_review_log enable row level security;
revoke all on shop_private.student_review_log from public,anon,authenticated;

create function shop_private.student_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from public.profiles p join auth.users u on u.id=p.id
  where p.id=auth.uid() and p.role='admin' and u.email_confirmed_at is not null
 ) and coalesce(auth.jwt()->>'aal','')='aal2';
$$;
create function shop_private.student_access_allowed() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from auth.users u join shop_private.student_applications a on a.user_id=u.id
  where u.id=auth.uid() and u.email_confirmed_at is not null and a.status='approved' and lower(a.application_email)=lower(u.email)
 ) or shop_private.student_is_admin();
$$;
create function shop_private.student_application_on_signup() returns trigger
language plpgsql security definer set search_path='' as $$
declare a jsonb:=new.raw_user_meta_data->'student_application';
begin
 if a is not null then
  if a->>'consent_version' is distinct from '2026-10-28' then raise exception 'Consent required'; end if;
  insert into shop_private.student_applications(user_id,application_email,full_name,phone,courses)
  values(new.id,new.email,btrim(a->>'full_name'),regexp_replace(a->>'phone','[ ()-]','','g'),
   array(select distinct jsonb_array_elements_text(a->'courses')));
 end if;
 return new;
end $$;
create trigger student_application_signup after insert on auth.users
for each row execute function shop_private.student_application_on_signup();

create function shop_private.student_access_status() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare a shop_private.student_applications; uid uuid:=auth.uid(); verified boolean; admin boolean;
begin
 if uid is null then raise exception 'Login required' using errcode='42501'; end if;
 select email_confirmed_at is not null into verified from auth.users where id=uid;
 select exists(select 1 from public.profiles where id=uid and role='admin') into admin;
 select * into a from shop_private.student_applications where user_id=uid;
 return jsonb_build_object('status',coalesce(a.status,'not_applied'),'full_name',a.full_name,
  'phone',a.phone,'courses',a.courses,'verified',coalesce(verified,false),
  'allowed',shop_private.student_access_allowed(),'admin',admin,'revision',a.revision);
end $$;

create function shop_private.student_apply(p_name text,p_phone text,p_courses text[],p_consent text) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); prior shop_private.student_applications;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null)
 then raise exception 'Verified email required' using errcode='42501'; end if;
 if p_consent is distinct from '2026-10-28' then raise exception 'Consent required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into prior from shop_private.student_applications where user_id=uid for update;
 if prior.status in ('approved','suspended') then raise exception 'Contact HANA to change your application'; end if;
 if prior.updated_at>now()-interval '1 minute' then raise exception 'Please wait before resubmitting'; end if;
 insert into shop_private.student_applications(user_id,application_email,full_name,phone,courses,consent_version)
 values(uid,(select email from auth.users where id=uid),btrim(p_name),regexp_replace(p_phone,'[ ()-]','','g'),array(select distinct unnest(p_courses)),p_consent)
 on conflict(user_id) do update set application_email=excluded.application_email,full_name=excluded.full_name,phone=excluded.phone,courses=excluded.courses,
 status='pending',consent_at=now(),updated_at=now(),reviewed_at=null,reviewed_by=null,revision=student_applications.revision+1;
 insert into shop_private.student_review_log(student_id,actor_id,previous_status,next_status)
 values(uid,uid,prior.status,'pending');
end $$;

create function shop_private.student_list(p_status text,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not shop_private.student_is_admin() then raise exception 'Admin MFA required' using errcode='42501'; end if;
 if p_status not in ('pending','approved','rejected','suspended') or p_status is null or p_offset not between 0 and 100000 then raise exception 'Invalid filter'; end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (
  select a.user_id,a.full_name,a.phone,a.courses,a.status,a.created_at,a.revision,u.email,
   (u.email_confirmed_at is not null) as email_verified
  from shop_private.student_applications a join auth.users u on u.id=a.user_id
  where a.status=p_status order by a.created_at desc,a.user_id limit 50 offset p_offset
 )x),'[]'::jsonb);
end $$;

create function shop_private.student_review(p_user uuid,p_status text,p_revision bigint,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare a shop_private.student_applications;
begin
 if not shop_private.student_is_admin() then raise exception 'Admin MFA required' using errcode='42501'; end if;
 if p_user=auth.uid() then raise exception 'Self approval is not allowed'; end if;
 if p_status is null or p_status not in ('approved','rejected','suspended') or length(coalesce(p_reason,''))>500 then raise exception 'Invalid review'; end if;
 if p_status in ('rejected','suspended') and length(btrim(coalesce(p_reason,'')))=0 then raise exception 'Reason required'; end if;
 select * into a from shop_private.student_applications where user_id=p_user for update;
 if not found or a.revision is distinct from p_revision then raise exception 'Application changed; refresh first'; end if;
 if p_status=a.status then raise exception 'Already reviewed'; end if;
 if p_status='approved' and not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null)
 then raise exception 'Email not verified'; end if;
 update shop_private.student_applications set status=p_status,application_email=(select email from auth.users where id=p_user),updated_at=now(),reviewed_at=now(),reviewed_by=auth.uid(),revision=revision+1 where user_id=p_user;
 insert into shop_private.student_review_log(student_id,actor_id,previous_status,next_status,reason)
 values(p_user,auth.uid(),a.status,p_status,coalesce(p_reason,''));
end $$;

-- Exposed RPCs use invoker rights; privileged code stays in an unexposed schema.
create function public.student_access_status() returns jsonb language sql security invoker set search_path='' as $$select shop_private.student_access_status()$$;
create function public.student_apply(p_name text,p_phone text,p_courses text[],p_consent text) returns void language sql security invoker set search_path='' as $$select shop_private.student_apply(p_name,p_phone,p_courses,p_consent)$$;
create function public.student_list(p_status text,p_offset integer default 0) returns jsonb language sql security invoker set search_path='' as $$select shop_private.student_list(p_status,p_offset)$$;
create function public.student_review(p_user uuid,p_status text,p_revision bigint,p_reason text) returns void language sql security invoker set search_path='' as $$select shop_private.student_review(p_user,p_status,p_revision,p_reason)$$;
revoke all on function shop_private.student_application_on_signup() from public,anon,authenticated;
revoke all on function shop_private.student_is_admin(),shop_private.student_access_allowed(),shop_private.student_access_status(),shop_private.student_apply(text,text,text[],text),shop_private.student_list(text,integer),shop_private.student_review(uuid,text,bigint,text) from public,anon;
grant execute on function shop_private.student_is_admin(),shop_private.student_access_allowed(),shop_private.student_access_status(),shop_private.student_apply(text,text,text[],text),shop_private.student_list(text,integer),shop_private.student_review(uuid,text,bigint,text) to authenticated;
revoke all on function public.student_access_status(),public.student_apply(text,text,text[],text),public.student_list(text,integer),public.student_review(uuid,text,bigint,text) from public,anon;
grant execute on function public.student_access_status(),public.student_apply(text,text,text[],text),public.student_list(text,integer),public.student_review(uuid,text,bigint,text) to authenticated;

-- New public registration must not permit profile role writes or analytics reads.
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
drop policy if exists "Allow authenticated page view read" on public.page_views;
create policy "CMS reads page views" on public.page_views for select to authenticated using(public.can_edit_cms());
drop policy if exists analytics_events_authenticated_read on public.analytics_events;
create policy "CMS reads analytics" on public.analytics_events for select to authenticated using(public.can_edit_cms());

-- Enforce eligibility even when callers bypass the site and invoke the old order API.
create function shop_private.require_approved_student_order() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not shop_private.student_access_allowed() then raise exception 'Approved student required' using errcode='42501'; end if;
 if new.user_id is distinct from auth.uid() then raise exception 'Order owner mismatch' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function shop_private.require_approved_student_order() from public,anon,authenticated;
create trigger approved_student_order before insert on public.material_orders
for each row execute function shop_private.require_approved_student_order();
revoke all on public.material_orders from anon,authenticated;
grant select on public.material_orders to authenticated;
