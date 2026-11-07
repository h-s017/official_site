-- Published layouts only; drafts stay in the editor browser.
create table if not exists public.site_page_layouts (
  page_key text primary key,
  layout jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_page_layouts enable row level security;
revoke all on public.site_page_layouts from anon, authenticated;
grant select on public.site_page_layouts to anon, authenticated;
grant update (layout) on public.site_page_layouts to authenticated;
create policy "public reads published page layouts" on public.site_page_layouts
  for select to anon, authenticated using (true);
create policy "CMS editors update page layouts" on public.site_page_layouts
  for update to authenticated
  using ((select public.can_edit_cms())) with check ((select public.can_edit_cms()));
create trigger page_layouts_touch_updated_at before update on public.site_page_layouts
  for each row execute function public.touch_updated_at();
insert into public.site_page_layouts (page_key) values
('/courses/'),
('/overture-series/'),
('/overture/'),
('/accord-etude/'),
('/KPIA/'),
('/helori/'),
('/practice/'),
('/incubation/'),
('/business/'),
('/product-development/'),
('/pif/'),
('/h-fugue-atelier/'),
('/journal/'),
('/journal/all/'),
('/projects/olfactory-culture/'),
('/projects/scent-creation/'),
('/projects/heart-village-notes/'),
('/news/'),
('/member/'),
('/shop/'),
('/visit.html'),
('/business/inquiry/'),
('/pif/inquiry/'),
('/course-info/'),
('/terms/'),
('/privacy/'),
('/refund/')
on conflict (page_key) do nothing;
