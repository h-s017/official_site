-- Opted-in newsletter contacts: private, retryable Resend Segment sync.
-- No Broadcast sending and no contact deletion.
create table if not exists shop_private.newsletter_resend_queue (
  email text primary key check(email=lower(btrim(email)) and length(email) between 3 and 254),
  name text not null,
  consent_at timestamptz not null,
  desired boolean not null default true,
  state text not null default 'pending' check(state in ('pending','processing','synced','detached','suppressed')),
  attempts integer not null default 0,
  retry_at timestamptz not null default now(),
  locked_at timestamptz,
  synced_at timestamptz,
  suppressed_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
alter table shop_private.newsletter_resend_queue enable row level security;
revoke all on shop_private.newsletter_resend_queue from public,anon,authenticated;
create table if not exists shop_private.newsletter_resend_webhook_events (
  event_id text primary key check(length(event_id) between 8 and 200),
  processed_at timestamptz not null default now()
);
alter table shop_private.newsletter_resend_webhook_events enable row level security;
revoke all on shop_private.newsletter_resend_webhook_events from public,anon,authenticated;

create or replace function shop_private.newsletter_resend_track() returns trigger
language plpgsql security definer set search_path='' as $$
declare e text;
begin
  if tg_op='DELETE' then
    e:=lower(btrim(old.email));
    insert into shop_private.newsletter_resend_queue(email,name,consent_at,desired,state)
    values(e,old.name,old.consent_at,false,'pending')
    on conflict (email) do update
      set desired=false,
          state=case when shop_private.newsletter_resend_queue.suppressed_at is not null then 'suppressed' else 'pending' end,
          retry_at=now(),attempts=0,updated_at=now();
    return old;
  end if;
  if tg_op='UPDATE' and lower(btrim(old.email))<>lower(btrim(new.email)) then
    perform shop_private.newsletter_resend_enqueue_removal(old.email,old.name,old.consent_at);
  end if;
  e:=lower(btrim(new.email));
  insert into shop_private.newsletter_resend_queue(email,name,consent_at,desired,state)
    values(e,new.name,new.consent_at,true,'pending')
    on conflict (email) do update
      set name=excluded.name,consent_at=excluded.consent_at,desired=true,
          state=case when shop_private.newsletter_resend_queue.suppressed_at is not null
                         and excluded.consent_at<=shop_private.newsletter_resend_queue.suppressed_at
                     then 'suppressed' else 'pending' end,
          retry_at=now(),attempts=0,updated_at=now();
  return new;
end $$;
create or replace function shop_private.newsletter_resend_enqueue_removal(p_email text,p_name text,p_consent_at timestamptz)
returns void language sql security definer set search_path='' as $$
  insert into shop_private.newsletter_resend_queue(email,name,consent_at,desired,state)
  values(lower(btrim(p_email)),p_name,p_consent_at,false,'pending')
  on conflict(email) do update set desired=false,
    state=case when shop_private.newsletter_resend_queue.suppressed_at is not null then 'suppressed' else 'pending' end,
    retry_at=now(),attempts=0,updated_at=now()
$$;
drop trigger if exists newsletter_resend_subscriber_change on public.email_subscribers;
create trigger newsletter_resend_subscriber_change
after insert or update or delete on public.email_subscribers
for each row execute function shop_private.newsletter_resend_track();

-- Existing explicit-consent subscribers go to the pending queue, NOT to Resend yet.
insert into shop_private.newsletter_resend_queue(email,name,consent_at,desired,state)
select lower(btrim(email)),name,consent_at,true,'pending'
from public.email_subscribers
on conflict(email) do nothing;

create or replace function shop_private.newsletter_resend_claim(p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if p_limit not between 1 and 20 then raise exception 'invalid batch'; end if;
  with candidates as (
    select email from shop_private.newsletter_resend_queue
    where (state='pending' and retry_at<=now())
       or (state='processing' and locked_at<now()-interval '10 minutes')
    order by retry_at,email limit p_limit for update skip locked
  ), claimed as (
    update shop_private.newsletter_resend_queue q set
      state='processing',locked_at=now(),attempts=q.attempts+1,updated_at=now()
    from candidates c where q.email=c.email
    returning q.email,q.name,q.desired,q.consent_at,q.attempts
  )
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into result from claimed x;
  return result;
end $$;

create or replace function shop_private.newsletter_resend_finish(
 p_email text,p_desired boolean,p_success boolean,p_error text default null
) returns void language plpgsql security definer set search_path='' as $$
begin
 update shop_private.newsletter_resend_queue q set
 state=case when q.desired is distinct from p_desired then 'pending'
            when p_success then case when p_desired then 'synced' else 'detached' end
            else 'pending' end,
 retry_at=case when q.desired is distinct from p_desired then now()
               when p_success then now()
               else now()+least(power(2,least(q.attempts,7)),180)*interval '1 minute' end,
 locked_at=null,updated_at=now(),
 synced_at=case when p_success then now() else q.synced_at end,
 last_error=case when p_success then null else left(coalesce(p_error,'external request failed'),180) end
 where q.email=lower(btrim(p_email)) and q.state='processing';
end $$;

create or replace function shop_private.newsletter_resend_suppress(
 p_email text,p_event_id text default null
) returns boolean language plpgsql security definer set search_path='' as $$
declare e text:=lower(btrim(coalesce(p_email,''))); oldrow record;
begin
 if e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'bad email'; end if;
 if p_event_id is not null then
  insert into shop_private.newsletter_resend_webhook_events(event_id)
  values(p_event_id) on conflict do nothing;
  if not found then return false; end if;
 end if;
 update shop_private.student_newsletter_preferences
   set unsubscribed_at=coalesce(unsubscribed_at,now())
 where lower(btrim(email))=e;
 delete from public.email_subscribers where lower(btrim(email))=e;
 select * into oldrow from shop_private.newsletter_resend_queue where email=e;
 insert into shop_private.newsletter_resend_queue(email,name,consent_at,desired,state,suppressed_at)
 values(e,coalesce(oldrow.name,'(withdrawn)'),coalesce(oldrow.consent_at,now()),false,'suppressed',now())
 on conflict(email) do update
 set desired=false,state='suppressed',suppressed_at=now(),locked_at=null,updated_at=now(),last_error=null;
 return true;
end $$;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='newsletter_resend_worker_token') then
  perform vault.create_secret(gen_random_uuid()::text||gen_random_uuid()::text,'newsletter_resend_worker_token');
 end if;
end $$;
create or replace function shop_private.newsletter_resend_worker_authorized(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
 select p_token is not null and length(p_token)>50 and exists(
  select 1 from vault.decrypted_secrets
  where name='newsletter_resend_worker_token' and decrypted_secret=p_token
 )
$$;
-- Service-role-only wrappers for the Edge Functions; never expose subscriber data to anon.
create or replace function public.newsletter_resend_worker_authorized(p_token text) returns boolean
language sql stable security invoker set search_path='' as $$
 select shop_private.newsletter_resend_worker_authorized(p_token)
$$;
create or replace function public.newsletter_resend_claim(p_limit integer default 10) returns jsonb
language sql security invoker set search_path='' as $$
 select shop_private.newsletter_resend_claim(p_limit)
$$;
create or replace function public.newsletter_resend_finish(
 p_email text,p_desired boolean,p_success boolean,p_error text default null
) returns void language sql security invoker set search_path='' as $$
 select shop_private.newsletter_resend_finish(p_email,p_desired,p_success,p_error)
$$;
create or replace function public.newsletter_resend_suppress(
 p_email text,p_event_id text default null
) returns boolean language sql security invoker set search_path='' as $$
 select shop_private.newsletter_resend_suppress(p_email,p_event_id)
$$;
revoke all on function shop_private.newsletter_resend_track(),
 shop_private.newsletter_resend_enqueue_removal(text,text,timestamptz),
 shop_private.newsletter_resend_claim(integer),
 shop_private.newsletter_resend_finish(text,boolean,boolean,text),
 shop_private.newsletter_resend_suppress(text,text),
 shop_private.newsletter_resend_worker_authorized(text)
 from public,anon,authenticated;
revoke all on function public.newsletter_resend_claim(integer),
 public.newsletter_resend_finish(text,boolean,boolean,text),
 public.newsletter_resend_suppress(text,text),
 public.newsletter_resend_worker_authorized(text)
 from public,anon,authenticated;
grant execute on function public.newsletter_resend_claim(integer),
 public.newsletter_resend_finish(text,boolean,boolean,text),
 public.newsletter_resend_suppress(text,text),
 public.newsletter_resend_worker_authorized(text)
 to service_role;
grant execute on function shop_private.newsletter_resend_claim(integer),
 shop_private.newsletter_resend_finish(text,boolean,boolean,text),
 shop_private.newsletter_resend_suppress(text,text),
 shop_private.newsletter_resend_worker_authorized(text)
 to service_role;

-- Run every 30 minutes, only when work exists. The worker will refuse to sync
-- until marketing credentials and the newsletter segment are configured.
select cron.schedule('hana-newsletter-resend-sync','*/30 * * * *', $job$
 select net.http_post(
   url:='https://uzqaodfmnrjrsbvxhlmh.supabase.co/functions/v1/newsletter-resend-sync',
   headers:=jsonb_build_object('Content-Type','application/json',
     'x-newsletter-worker-token',(select decrypted_secret from vault.decrypted_secrets where name='newsletter_resend_worker_token')),
   body:='{}'::jsonb,
   timeout_milliseconds:=50000
 )
 where exists(select 1 from shop_private.newsletter_resend_queue
              where (state='pending' and retry_at<=now())
                 or (state='processing' and locked_at<now()-interval '10 minutes'));
$job$);
