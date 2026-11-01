-- HANA FOCUS read-only newsletter management.
-- The source of truth remains public.email_subscribers in the official-site Supabase project.
-- No new subscriber copies, mailing actions, or data writes are introduced.
create or replace function shop_private.newsletter_admin_list(
  p_query text, p_source text, p_offset integer, p_limit integer
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  result jsonb;
  q text := lower(btrim(coalesce(p_query,'')));
  src text := btrim(coalesce(p_source,''));
begin
  if not shop_private.student_is_admin() then
    raise exception 'Verified admin MFA required' using errcode='42501';
  end if;
  if length(q)>120 or length(src)>80 or p_offset is null or p_offset<0 or p_offset>100000
     or p_limit is null or p_limit<1 or p_limit>50 then
    raise exception 'Invalid newsletter list filter' using errcode='22023';
  end if;
  with filtered as (
    select id,name,email,source,created_at
    from public.email_subscribers
    where (q='' or position(q in lower(name))>0 or position(q in lower(email))>0)
      and (src='' or source=src)
  ),
  page as (
    select * from filtered order by created_at desc,id desc limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'total',(select count(*) from filtered),
    'offset',p_offset,'limit',p_limit,
    'items',coalesce((select jsonb_agg(
      jsonb_build_object('name',p.name,'email',p.email,'source',p.source,'created_at',p.created_at)
      order by p.created_at desc,p.id desc) from page p),'[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function shop_private.newsletter_admin_list(text,text,integer,integer) from public,anon,authenticated;
grant execute on function shop_private.newsletter_admin_list(text,text,integer,integer) to authenticated;

create or replace function public.newsletter_admin_list(
  p_query text default '',p_source text default '',p_offset integer default 0,p_limit integer default 50
) returns jsonb language sql stable security invoker set search_path=''
as $$select shop_private.newsletter_admin_list(p_query,p_source,p_offset,p_limit)$$;
revoke all on function public.newsletter_admin_list(text,text,integer,integer) from public,anon;
grant execute on function public.newsletter_admin_list(text,text,integer,integer) to authenticated;
