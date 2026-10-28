-- Provider-independent transactional outbox. Sending is enabled separately.
-- No historical backfill: do not unexpectedly email existing students.
create table shop_private.student_notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('application_received','application_approved')),
 application_revision bigint not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','cancelled','failed')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_token uuid, leased_at timestamptz, first_leased_at timestamptz,
 created_at timestamptz not null default now(), sent_at timestamptz,
 provider_message_id text, last_error_code text,
 unique(user_id,kind,application_revision)
);
alter table shop_private.student_notifications enable row level security;
revoke all on shop_private.student_notifications from public,anon,authenticated;
create index student_notifications_pending on shop_private.student_notifications(available_at,created_at)
 where status in ('pending','sending');

create function shop_private.enqueue_student_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status='pending' then
  insert into shop_private.student_notifications(user_id,kind,application_revision)
  values(new.user_id,'application_received',new.revision) on conflict do nothing;
 elsif new.status='approved' and old.status is distinct from new.status then
  insert into shop_private.student_notifications(user_id,kind,application_revision)
  values(new.user_id,'application_approved',new.revision) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function shop_private.enqueue_student_notification() from public,anon,authenticated;
create trigger student_notification_outbox after insert or update on shop_private.student_applications
for each row execute function shop_private.enqueue_student_notification();

-- Only the server worker can lease jobs. Never accept a recipient from a browser.
create function shop_private.claim_student_notifications() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 update shop_private.student_notifications n set status='cancelled',lease_token=null
 where n.status in ('pending','sending') and not exists (
  select 1 from shop_private.student_applications a join auth.users u on u.id=a.user_id
  where a.user_id=n.user_id and a.revision=n.application_revision
   and ((n.kind='application_received' and a.status='pending') or
    (n.kind='application_approved' and a.status='approved' and u.email_confirmed_at is not null and lower(a.application_email)=lower(u.email)))
 );
 update shop_private.student_notifications set status='failed',last_error_code='retry_limit',lease_token=null
 where (status='pending' or (status='sending' and leased_at<now()-interval '15 minutes'))
  and (attempts>=5 or first_leased_at<now()-interval '23 hours');
 with candidates as (
  select id from shop_private.student_notifications
  where attempts<5 and available_at<=now() and (status='pending' or (status='sending' and leased_at<now()-interval '15 minutes'))
  order by created_at for update skip locked limit 10
 ), leased as (
  update shop_private.student_notifications n set status='sending',attempts=attempts+1,
   lease_token=gen_random_uuid(),leased_at=now(),first_leased_at=coalesce(first_leased_at,now())
  from candidates c where n.id=c.id returning n.*
 ) select coalesce(jsonb_agg(jsonb_build_object(
  'id',n.id,'lease_token',n.lease_token,'kind',n.kind,
  'recipient',case when n.kind='application_received' then 'hanasscent@gmail.com' else a.application_email end,
  'full_name',a.full_name)), '[]'::jsonb) into result
 from leased n join shop_private.student_applications a on a.user_id=n.user_id;
 return result;
end $$;

create function shop_private.finish_student_notification(p_id uuid,p_lease uuid,p_sent boolean,p_provider_id text,p_error text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 update shop_private.student_notifications set
  status=case when p_sent then 'sent' when attempts>=5 then 'failed' else 'pending' end,
  sent_at=case when p_sent then now() else null end,
  provider_message_id=case when p_sent then left(p_provider_id,200) else null end,
  last_error_code=case when p_sent then null else left(p_error,80) end,
  available_at=now()+interval '5 minutes'*power(2,least(attempts,5)),lease_token=null
 where id=p_id and lease_token=p_lease and status='sending';
 return found;
end $$;
revoke all on function shop_private.claim_student_notifications(),shop_private.finish_student_notification(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant usage on schema shop_private to service_role;
grant execute on function shop_private.claim_student_notifications(),shop_private.finish_student_notification(uuid,uuid,boolean,text,text) to service_role;
create function public.claim_student_notifications() returns jsonb language sql security invoker set search_path='' as $$select shop_private.claim_student_notifications()$$;
create function public.finish_student_notification(p_id uuid,p_lease uuid,p_sent boolean,p_provider_id text,p_error text) returns boolean language sql security invoker set search_path='' as $$select shop_private.finish_student_notification(p_id,p_lease,p_sent,p_provider_id,p_error)$$;
revoke all on function public.claim_student_notifications(),public.finish_student_notification(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.claim_student_notifications(),public.finish_student_notification(uuid,uuid,boolean,text,text) to service_role;
