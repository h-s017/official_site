-- Additive only: a null layout leaves the existing homepage unchanged.
-- Existing site_settings editor RLS and site-media policies remain in force.
alter table public.site_settings
  add column if not exists home_layout jsonb,
  add column if not exists hero_image_alt text not null default '';

comment on column public.site_settings.home_layout is
  'Published homepage layout v1. Drafts stay in the editor browser until explicitly published.';
