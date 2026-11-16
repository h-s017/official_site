-- HANA manual student approval: email confirmation is not an approval criterion.
-- Password authentication and admin MFA remain in Supabase Auth; the admin must
-- independently match the applicant to course records before approval.
-- This migration DOES NOT disable project-wide Supabase Auth 'Confirm email'.
-- Change that setting separately in Supabase > Authentication > Providers > Email.
-- Preserve existing applications, approval/rejection history and all audit logs.

create or replace function shop_private.student_access_allowed() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from auth.users u join shop_private.student_applications a on a.user_id=u.id
  where u.id=auth.uid() and a.status='approved' and lower(a.application_email)=lower(u.email)
 ) or shop_private.student_is_admin();
$$;

create or replace function shop_private.student_apply(p_name text,p_phone text,p_courses text[],p_consent text) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); prior shop_private.student_applications;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid)
 then raise exception 'Login required' using errcode='42501'; end if;
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

create or replace function shop_private.student_review(p_user uuid,p_status text,p_revision bigint,p_reason text) returns void
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
 update shop_private.student_applications set status=p_status,application_email=(select email from auth.users where id=p_user),updated_at=now(),reviewed_at=now(),reviewed_by=auth.uid(),revision=revision+1 where user_id=p_user;
 insert into shop_private.student_review_log(student_id,actor_id,previous_status,next_status,reason)
 values(p_user,auth.uid(),a.status,p_status,coalesce(p_reason,''));
end $$;
