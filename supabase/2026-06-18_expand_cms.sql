-- HANA CMS：頁面內容與預約設定擴充

create table if not exists public.page_contents (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  field_key text not null,
  label text not null,
  content_type text not null default 'text' check (content_type in ('text','multiline','image','url')),
  value text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (page_key, field_key)
);

create table if not exists public.booking_settings (
  id smallint primary key default 1 check (id = 1),
  booking_start_at timestamptz not null,
  booking_end_date date not null,
  open_weekdays integer[] not null default array[0,1,2,3,4,5],
  closed_weekdays integer[] not null default array[6],
  closed_dates date[] not null default array[]::date[],
  special_date_times jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists page_contents_touch_updated_at on public.page_contents;
create trigger page_contents_touch_updated_at before update on public.page_contents
for each row execute procedure public.touch_updated_at();
drop trigger if exists booking_settings_touch_updated_at on public.booking_settings;
create trigger booking_settings_touch_updated_at before update on public.booking_settings
for each row execute procedure public.touch_updated_at();

alter table public.page_contents enable row level security;
alter table public.booking_settings enable row level security;

drop policy if exists "public reads page contents" on public.page_contents;
create policy "public reads page contents" on public.page_contents for select to anon, authenticated using (true);
drop policy if exists "editors update page contents" on public.page_contents;
create policy "editors update page contents" on public.page_contents for update to authenticated
using (public.can_edit_cms()) with check (public.can_edit_cms());

drop policy if exists "public reads booking settings" on public.booking_settings;
create policy "public reads booking settings" on public.booking_settings for select to anon, authenticated using (true);
drop policy if exists "editors update booking settings" on public.booking_settings;
create policy "editors update booking settings" on public.booking_settings for update to authenticated
using (public.can_edit_cms()) with check (public.can_edit_cms());

insert into public.page_contents (page_key, field_key, label, content_type, value, sort_order) values
('home','hero_tagline','首頁｜主標副句','text','氣味敘事空間',10),
('home','hero_intro','首頁｜主視覺說明','multiline','把一個人、一個記憶、一個場域，轉譯成一種被氣味記錄的形式。',20),
('home','hero_image','首頁｜主視覺圖片','image','/assets/homepage-cover.png',30),
('home','entrance_title','首頁｜三大入口標題','text','關於你，和氣味的連結',40),
('home','entrance_intro','首頁｜三大入口說明','multiline','初次接觸調香，可以從 HELORI 香氣探索所開始；想深入學習的人進入專業調香課程；品牌、空間與企業團體合作，進入嗅覺設計服務。',50),
('home','about_title','首頁｜關於 Hana 標題','text','嗅覺藝術設計師 Hana 沈秉儀',60),
('home','about_signature','首頁｜關於 Hana 引言','multiline','我相信氣味是一種創作語言，可以被體驗、被學習、被記住。',70),
('helori','hero_title','HELORI｜頁首標題','multiline','HELORI\n香氣探索所',10),
('helori','hero_subtitle','HELORI｜頁首副標','text','探索，此刻屬於你的香氣夥伴',20),
('helori','experience_title','HELORI｜體驗標題','text','心村限定的香氣探索體驗。',30),
('helori','experience_intro','HELORI｜體驗說明','multiline','適合第一次接觸調香、想快速理解自己香氣偏好，或想在北投中心新村帶走一份氣味記憶的人。',40),
('courses','hero_title','專業課程｜頁首標題','multiline','HANA SCENT ARTIST\n專業調香課程系列',10),
('courses','hero_intro_1','專業課程｜頁首說明一','multiline','如果氣味是流動的音符，調香就是感知譜成樂章的過程。',20),
('courses','hero_intro_2','專業課程｜頁首說明二','multiline','氣味是載體，乘載著我們的記憶，透過系統化訓練，學會將嗅覺轉化成記憶，將想留下的那一刻轉化為香氣。',30),
('courses','learning_title','專業課程｜學習架構標題','multiline','獨創賦格式調香技巧，建立可以判斷與創作的嗅覺結構。',40),
('courses','learning_intro','專業課程｜學習架構說明','multiline','課程會從聞香、描述、分類、比例、修香與配方紀錄開始，讓學員逐步理解一支香氣如何被搭建，而不是只照著配方完成作品。',50),
('scent_design','hero_title','嗅覺設計｜頁首標題','text','嗅覺設計服務',10),
('scent_design','hero_intro','嗅覺設計｜頁首說明','multiline','為品牌、空間、企業活動與團體體驗建立可被記住的氣味語言。不是直接挑一個香味，而是從記憶、材料、空間與受眾開始設計。',20),
('atelier','hero_intro','H.FUGUE｜頁首說明','multiline','香氣的呈現形式有很多種，在這裡，承接了 HANA SCENT ARTIST 的嗅覺敘事方法，將記憶、場域與情緒轉化為可以被收藏、使用與帶走的香氣作品。',10),
('atelier','statement_title','H.FUGUE｜品牌宣言標題','multiline','氣味不只是一昧的流行，而是千年來記憶被直接保存的方式。',20),
('atelier','statement_intro','H.FUGUE｜品牌宣言說明','multiline','在 H.FUGUE ATELIER，先理解你想被如何記得，再將記憶轉譯成可以被聞見的結構。',30),
('visit','hero_title','聯繫我們｜頁首標題','text','聯繫我們',10),
('visit','hero_intro','聯繫我們｜頁首說明','multiline','心村所採預約制。課程預約可前往預約頁；品牌氣味、空間氣味、企業工作坊或其他合作需求，請填寫下方表單。',20),
('journal','hero_title','氣味誌｜頁首標題','text','氣味誌',10),
('journal','hero_subtitle','氣味誌｜頁首副標','text','從閱讀，進入氣味。',20)
on conflict (page_key, field_key) do nothing;

insert into public.booking_settings (
  id, booking_start_at, booking_end_date, open_weekdays, closed_weekdays, closed_dates, special_date_times
) values (
  1,
  '2026-07-09T10:00:00+08:00',
  '2027-05-30',
  array[0,1,2,3,4,5],
  array[6],
  array['2027-02-05','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-02-10','2027-02-11','2027-02-12','2027-02-13','2027-02-14']::date[],
  '{"2026-07-17":["09:00–12:00"]}'::jsonb
) on conflict (id) do nothing;
