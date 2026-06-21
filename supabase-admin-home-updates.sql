-- HANA SCENT ARTIST admin additions
-- Run in Supabase SQL Editor once.

alter table public.site_settings
  add column if not exists registration_open_date date,
  add column if not exists registration_open_text text;

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  page_type text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

drop policy if exists "Allow anonymous page view insert" on public.page_views;
create policy "Allow anonymous page view insert"
  on public.page_views
  for insert
  to anon
  with check (true);

drop policy if exists "Allow authenticated page view read" on public.page_views;
create policy "Allow authenticated page view read"
  on public.page_views
  for select
  to authenticated
  using (true);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_page_type_idx on public.page_views (page_type);
