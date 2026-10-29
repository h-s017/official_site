-- New registrations explicitly accept the newsletter notice in the signup form.
-- Enrol only after Auth verifies the email. Never backfill existing students.
create table shop_private.student_newsletter_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null, consent_version text, consent_at timestamptz,
 subscribed_at timestamptz, unsubscribed_at timestamptz
);
alter table shop_private.student_newsletter_preferences enable row level security;
revoke all on shop_private.student_newsletter_preferences from public,anon,authenticated;

create function shop_private.enroll_student_newsletter(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare pref shop_private.student_newsletter_preferences; student record;
begin
 select * into pref from shop_private.student_newsletter_preferences where user_id=p_user for update;
 if not found or pref.consent_version is distinct from '2026-10-29' or pref.unsubscribed_at is not null then return; end if;
 select u.email,a.full_name into student from auth.users u
 join shop_private.student_applications a on a.user_id=u.id
 where u.id=p_user and u.email_confirmed_at is not null
  and lower(u.email)=lower(pref.email) and lower(a.application_email)=lower(u.email);
 if not found then return; end if;
 insert into public.email_subscribers(name,email,interests,source,path,consent_at)
 values(student.full_name,lower(student.email),array['調香課程','此域活動','氣味產品'],'student-registration','/student-tools/',pref.consent_at)
 on conflict (lower(btrim(email))) do nothing;
 update shop_private.student_newsletter_preferences set subscribed_at=coalesce(subscribed_at,now()) where user_id=p_user;
end $$;

create function shop_private.student_newsletter_on_application() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from auth.users where id=new.user_id
  and raw_user_meta_data->'student_application'->>'newsletter_consent_version'='2026-10-29') then
  insert into shop_private.student_newsletter_preferences(user_id,email,consent_version,consent_at)
  values(new.user_id,new.application_email,'2026-10-29',new.consent_at) on conflict do nothing;
  perform shop_private.enroll_student_newsletter(new.user_id);
 end if;
 return new;
end $$;
create trigger student_newsletter_application after insert on shop_private.student_applications
for each row execute function shop_private.student_newsletter_on_application();

create function shop_private.student_newsletter_on_verification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform shop_private.enroll_student_newsletter(new.id);
 return new;
end $$;
create trigger student_newsletter_verified after update of email_confirmed_at on auth.users
for each row when(old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function shop_private.student_newsletter_on_verification();

create function shop_private.student_newsletter_status() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare own_email text;
begin
 select email into own_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if not found then raise exception 'Verified login required' using errcode='42501'; end if;
 return exists(select 1 from public.email_subscribers where lower(btrim(email))=lower(own_email));
end $$;

create function shop_private.student_newsletter_unsubscribe() returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); own_email text;
begin
 select email into own_email from auth.users where id=uid and email_confirmed_at is not null;
 if not found then raise exception 'Verified login required' using errcode='42501'; end if;
 -- Lock the preference row before touching the subscriber list, as enrolment does.
 insert into shop_private.student_newsletter_preferences(user_id,email,unsubscribed_at)
 values(uid,own_email,now()) on conflict(user_id) do update set unsubscribed_at=now();
 delete from public.email_subscribers where lower(btrim(email))=lower(own_email);
end $$;

revoke all on function shop_private.enroll_student_newsletter(uuid),shop_private.student_newsletter_on_application(),shop_private.student_newsletter_on_verification(),shop_private.student_newsletter_status(),shop_private.student_newsletter_unsubscribe() from public,anon,authenticated;
grant execute on function shop_private.student_newsletter_status(),shop_private.student_newsletter_unsubscribe() to authenticated;
create function public.student_newsletter_status() returns boolean language sql security invoker set search_path='' as $$select shop_private.student_newsletter_status()$$;
create function public.student_newsletter_unsubscribe() returns void language sql security invoker set search_path='' as $$select shop_private.student_newsletter_unsubscribe()$$;
revoke all on function public.student_newsletter_status(),public.student_newsletter_unsubscribe() from public,anon;
grant execute on function public.student_newsletter_status(),public.student_newsletter_unsubscribe() to authenticated;
