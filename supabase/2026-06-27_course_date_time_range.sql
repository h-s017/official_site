-- HANA CMS：開課日期時間區間
-- 將開課時間拆成 start_time / end_time，保留 time_label 作為前台顯示相容欄位。

alter table public.course_dates
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.course_dates
  drop constraint if exists course_dates_time_range_check;

alter table public.course_dates
  add constraint course_dates_time_range_check
  check (
    start_time is null
    or end_time is null
    or end_time > start_time
  );

create index if not exists course_dates_date_time_idx
  on public.course_dates (course_date, start_time, end_time);
