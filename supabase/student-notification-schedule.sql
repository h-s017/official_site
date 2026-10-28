-- Internal scheduler token is generated and kept in Vault; never copied to a client.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='student_notification_worker_token') then
  perform vault.create_secret(gen_random_uuid()::text||gen_random_uuid()::text,'student_notification_worker_token');
 end if;
end $$;
create function shop_private.student_notification_worker_authorized(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
 select p_token is not null and length(p_token)>50 and exists(
  select 1 from vault.decrypted_secrets where name='student_notification_worker_token' and decrypted_secret=p_token
 );
$$;
revoke all on function shop_private.student_notification_worker_authorized(text) from public,anon,authenticated;
grant execute on function shop_private.student_notification_worker_authorized(text) to service_role;
create function public.student_notification_worker_authorized(p_token text) returns boolean language sql security invoker set search_path='' as $$select shop_private.student_notification_worker_authorized(p_token)$$;
revoke all on function public.student_notification_worker_authorized(text) from public,anon,authenticated;
grant execute on function public.student_notification_worker_authorized(text) to service_role;
-- The worker checks RESEND_API_KEY before leasing anything. Without it jobs stay pending.
select cron.schedule('hana-student-notifications','* * * * *', $schedule$
 select net.http_post(
  url:='https://uzqaodfmnrjrsbvxhlmh.supabase.co/functions/v1/student-notifications',
  headers:=jsonb_build_object('Content-Type','application/json','x-notification-token',
   (select decrypted_secret from vault.decrypted_secrets where name='student_notification_worker_token')),
  body:='{}'::jsonb,timeout_milliseconds:=60000
 ) where exists(select 1 from shop_private.student_notifications where status in ('pending','sending'));
$schedule$);
