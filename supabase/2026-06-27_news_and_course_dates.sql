-- HANA CMS：消息分類與開課日期管理
-- 執行後，後台可管理：
-- 1. 氣味誌 posts（既有設定不變）
-- 2. 最新消息 / 香氣發布 / 課程發布 announcements.category
-- 3. 開課日期 course_dates

alter table public.announcements
  add column if not exists category text not null default 'news';

alter table public.announcements
  drop constraint if exists announcements_category_check;

alter table public.announcements
  add constraint announcements_category_check
  check (category in ('news', 'fragrance', 'course'));

create index if not exists announcements_category_starts_at_idx
  on public.announcements (category, starts_at desc, updated_at desc);

create table if not exists public.course_dates (
  id uuid primary key default gen_random_uuid(),
  course_title text not null,
  course_date date not null,
  time_label text not null default '',
  status text not null default 'open' check (status in ('open', 'full', 'closed')),
  link_url text not null default '',
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists course_dates_touch_updated_at on public.course_dates;
create trigger course_dates_touch_updated_at before update on public.course_dates
for each row execute procedure public.touch_updated_at();

alter table public.course_dates enable row level security;

drop policy if exists "public reads open course dates" on public.course_dates;
create policy "public reads open course dates" on public.course_dates for select to anon, authenticated
using (status in ('open', 'full'));

drop policy if exists "editors read all course dates" on public.course_dates;
create policy "editors read all course dates" on public.course_dates for select to authenticated
using (public.can_edit_cms());

drop policy if exists "editors create course dates" on public.course_dates;
create policy "editors create course dates" on public.course_dates for insert to authenticated
with check (public.can_edit_cms());

drop policy if exists "editors update course dates" on public.course_dates;
create policy "editors update course dates" on public.course_dates for update to authenticated
using (public.can_edit_cms()) with check (public.can_edit_cms());

drop policy if exists "editors delete course dates" on public.course_dates;
create policy "editors delete course dates" on public.course_dates for delete to authenticated
using (public.can_edit_cms());

create index if not exists course_dates_date_status_idx
  on public.course_dates (course_date, status, sort_order);
