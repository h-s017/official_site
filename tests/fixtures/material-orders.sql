create schema if not exists shop_private;
revoke all on schema shop_private from public;
create table public.material_catalog (
 option_id bigint primary key, product_id text not null, name text not null,
 specification text not null, price bigint not null check(price>=0), available boolean not null
);
alter table public.material_catalog enable row level security;
create policy catalog_read on public.material_catalog for select to anon,authenticated using(true);
grant select on public.material_catalog to anon,authenticated;
create table public.material_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 request_id uuid not null, email text not null, customer_name text not null,
 note text not null default '', items jsonb not null, total bigint not null,
 currency text not null default 'KRW', status text not null default 'pending_confirmation',
 created_at timestamptz not null default now(), unique(user_id,request_id)
);
alter table public.material_orders enable row level security;
create policy own_orders on public.material_orders for select to authenticated using(user_id=(select auth.uid()));
grant select on public.material_orders to authenticated;
revoke insert,update,delete on public.material_orders from anon,authenticated;
create function shop_private.submit_material_order(p_request_id uuid,p_name text,p_note text,p_items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); mail text; result uuid; snapshot jsonb; amount bigint;
begin
 if uid is null then raise exception 'Login required'; end if;
 select email into mail from auth.users where id=uid and email_confirmed_at is not null;
 if mail is null then raise exception 'Verified email required'; end if;
 if p_request_id is null or length(trim(p_name)) not between 1 and 100 or length(coalesce(p_note,''))>2000 then raise exception 'Invalid order fields'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Invalid cart'; end if;
 select id into result from public.material_orders where user_id=uid and request_id=p_request_id;
 if result is not null then return result; end if;
 if exists(select 1 from jsonb_to_recordset(p_items) as x(option_id bigint,qty integer)
 left join public.material_catalog c on c.option_id=x.option_id
 where c.option_id is null or not c.available or x.qty is null or x.qty not between 1 and 999)
 then raise exception 'Invalid or unavailable item'; end if;
 if (select count(distinct x.option_id) from jsonb_to_recordset(p_items) as x(option_id bigint,qty integer))<>jsonb_array_length(p_items) then raise exception 'Duplicate item'; end if;
 select jsonb_agg(jsonb_build_object('option_id',c.option_id,'product_id',c.product_id,'name',c.name,'specification',c.specification,'price',c.price,'qty',x.qty) order by c.option_id),sum(c.price*x.qty)
 into snapshot,amount from jsonb_to_recordset(p_items) as x(option_id bigint,qty integer) join public.material_catalog c using(option_id);
 insert into public.material_orders(user_id,request_id,email,customer_name,note,items,total)
 values(uid,p_request_id,mail,trim(p_name),coalesce(p_note,''),snapshot,amount)
 on conflict(user_id,request_id) do nothing returning id into result;
 if result is null then select id into result from public.material_orders where user_id=uid and request_id=p_request_id; end if;
 return result;
end $$;
revoke all on function shop_private.submit_material_order(uuid,text,text,jsonb) from public,anon;
grant usage on schema shop_private to authenticated;
grant execute on function shop_private.submit_material_order(uuid,text,text,jsonb) to authenticated;
create function public.submit_material_order(p_request_id uuid,p_name text,p_note text,p_items jsonb)
returns uuid language sql security invoker set search_path='' as $$ select shop_private.submit_material_order(p_request_id,p_name,p_note,p_items) $$;
revoke all on function public.submit_material_order(uuid,text,text,jsonb) from public,anon;
grant execute on function public.submit_material_order(uuid,text,text,jsonb) to authenticated;
