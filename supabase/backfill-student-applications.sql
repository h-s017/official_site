-- Preserve valid signup applications submitted before the review backend was enabled.
-- Metadata is input only: every imported application starts pending, never approved/admin.
with raw as (
 select u.id,u.email,u.created_at,u.raw_user_meta_data->'student_application' as a
 from auth.users u
 where u.raw_user_meta_data ? 'student_application'
), candidates as (
 select id,email,created_at,btrim(a->>'full_name') as full_name,
 regexp_replace(a->>'phone','[ ()-]','','g') as phone,a->>'consent_version' as consent_version,
 case when jsonb_typeof(a->'courses')='array'
 then array(select distinct jsonb_array_elements_text(a->'courses')) else array[]::text[] end as courses
 from raw where jsonb_typeof(a)='object'
), imported as (
 insert into shop_private.student_applications(user_id,application_email,full_name,phone,courses,status,consent_version,consent_at,created_at,updated_at)
 select id,email,full_name,phone,courses,'pending',consent_version,created_at,created_at,now()
 from candidates where length(full_name) between 1 and 80 and phone ~ '^\+?[0-9]{8,15}$'
 and cardinality(courses) between 1 and 3 and courses <@ array['KPIA','KDCA','氣味藝術序曲']
 and consent_version='2026-10-28'
 on conflict(user_id) do nothing returning user_id
)
select count(*)::integer as imported_pending_applications from imported;
