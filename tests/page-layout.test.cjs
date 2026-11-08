const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const model = require('../assets/page-layout-model.js');
const pages = require('../assets/page-layout-catalog.js');
const descriptor = { hero: { id: 'hero', images: [] }, sections: [
  { id: 'section-1', images: [{ id: 'image-1', url: '/assets/original.webp', alt: '原圖' }] },
  { id: 'section-2', images: [] }
] };
test('copy overrides retain deliberate empty text and filter unknown targets by page', () => {
  const home = require('../assets/home-layout-model.js');
  const fields = [{ id: 'text-title', kind: 'text' }, { id: 'href-book', kind: 'href' }];
  assert.deepEqual(home.sanitizeCopy({ 'text-title': '', 'text-forged': 'wrong page', 'href-book': '/courses/' }, fields), { 'text-title': '', 'href-book': '/courses/' });
});
test('text stays plain text while link fields reject executable schemes and control characters', () => {
  const home = require('../assets/home-layout-model.js');
  const fields = [{ id: 'text-body', kind: 'text' }, { id: 'href-link', kind: 'href' }];
  assert.equal(home.sanitizeCopy({ 'text-body': '<script>literal</script>\n第二行', 'href-link': 'javascript:alert(1)' }, fields)['text-body'], '<script>literal</script>\n第二行');
  for (const v of ['javascript:alert(1)', 'data:text/html,test', '//example.com', '/\\example.com', 'mailto:a@example.com\nBcc:test']) assert.equal(home.linkUrl(v), null);
  for (const v of ['/courses/', '#schedule', 'https://example.com/', 'mailto:a@example.com', 'tel:+886-2-12345678', '']) assert.equal(home.linkUrl(v), v);
});
test('legacy headings migrate into registered text fields without losing newer edits', () => {
  const desc = { sections: [{ id: 'section-1', fields: [{ id: 'text-heading', kind: 'text', heading: true }] }] };
  assert.equal(model.normalize({ sections: [{ id: 'section-1', title: '舊版標題' }] }, desc).sections[0].copy['text-heading'], '舊版標題');
  assert.equal(model.normalize({ sections: [{ id: 'section-1', title: '舊版標題', copy: { 'text-heading': '新版標題' } }] }, desc).sections[0].copy['text-heading'], '新版標題');
});
test('homepage hero and built-in sections keep their own registered copy overrides', () => {
  const home = require('../assets/home-layout-model.js');
  const desc = { hero: { fields: [{ id: 'text-hero', kind: 'text' }] }, sections: [{ id: 'about', fields: [{ id: 'text-about', kind: 'text' }] }] };
  const value = home.normalize({ hero: { copy: { 'text-hero': '首頁文案' } }, sections: [{ id: 'about', copy: { 'text-about': '老師介紹', 'text-hero': 'wrong section' } }] }, desc);
  assert.equal(value.hero.copy['text-hero'], '首頁文案');
  assert.deepEqual(value.sections[0].copy, { 'text-about': '老師介紹' });
});
test('all canonical public pages have a renderer and a unique catalog entry', () => {
  assert.equal(pages.length, 28);
  assert.equal(new Set(pages.map(p => p.path)).size, pages.length);
  for (const page of pages.slice(1)) {
    const file = page.path.endsWith('/') ? page.path.slice(1) + 'index.html' : page.path.slice(1);
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(html, /assets\/page-layout.js/); assert.doesNotMatch(html, /http-equiv="refresh"/);
  }
});
test('new page defaults include only that page sections and existing photo slots', () => {
  const result = model.normalize(null, descriptor);
  assert.deepEqual(result.sections.map(b => b.id), ['section-1', 'section-2']);
  assert.equal(result.sections[0].images[0].url, '/assets/original.webp');
  assert.equal(model.normalize(null, { sections: [] }).hero, null);
});
test('legacy custom course drafts inherit the matching native card group without losing content', () => {
  const desc = { ...descriptor, cardGroups: [
    { id: 'section-1:series', count: 3, links: ['/overture/'], labels: ['VOL. 1'] },
    { id: 'section-2:other', count: 2, links: ['/helori/','/KPIA/'], labels: ['HELORI','KPIA'] }
  ] };
  const draft = { sections: [{ id: 'custom-kpia', title: 'KPIA 專業調香導師證書',
    body: '系統進修\n課後資源', label: '查看 KPIA →', link: '/KPIA/', visible: false, image: '/assets/example.webp' }] };
  const saved = model.normalize(draft, desc), custom = saved.sections[0];
  assert.equal(custom.template, 'card'); assert.equal(custom.cardGroup, 'section-2:other');
  assert.equal(custom.cardIndex, 2); assert.equal(custom.eyebrow, 'KPIA');
  for (const key of ['title','body','label','link','visible','image']) assert.equal(custom[key], draft.sections[0][key]);
  assert.deepEqual(model.normalize(JSON.parse(JSON.stringify(saved)), desc), saved);
});
test('card placement only uses registered groups and independent sections remain independent', () => {
  const desc = { ...descriptor, cardGroups: [{ id: 'section-1:series', count: 3 }] };
  const layout = model.normalize({ sections: [
    { id: 'custom-card', template: 'card', cardGroup: 'body', cardIndex: 999, eyebrow: '<script>' },
    { id: 'custom-section', template: 'section', title: '獨立內容' }
  ] }, desc);
  assert.equal(layout.sections[0].cardGroup, 'section-1:series');
  assert.equal(layout.sections[0].cardIndex, 3); assert.equal(layout.sections[0].eyebrow, '<script>');
  assert.equal(layout.sections[1].template, 'section');
  assert.equal(model.normalize(layout, descriptor).sections[0].template, 'section');
});
test('normalization retains order, hidden sections, custom text and per-photo edits', () => {
  const result = model.normalize({ sections: [{ id: 'section-2', visible: false },
    { id: 'custom-demo', title: '<script>', body: '一\n二' },
    { id: 'section-1', images: [{ id: 'image-1', url: 'https://example.com/new.webp', alt: '新圖', fit: 'contain' }] }
  ] }, descriptor);
  assert.deepEqual(result.sections.map(b => b.id), ['section-2', 'custom-demo', 'section-1']);
  assert.equal(result.sections[0].visible, false); assert.equal(result.sections[2].images[0].fit, 'contain');
  assert.deepEqual(model.normalize(JSON.parse(JSON.stringify(result)), descriptor), result);
});
test('unknown page sections and forged photo slots cannot target other DOM nodes', () => {
  const result = model.normalize({ sections: [{ id: 'section-999' }, { id: '__proto__' },
    { id: 'section-1', images: [{ id: 'image-999', url: 'https://example.com/forged' }] }
  ] }, descriptor);
  assert.deepEqual(result.sections.map(b => b.id), ['section-1', 'section-2']);
  assert.deepEqual(result.sections[0].images.map(x => x.id), ['image-1']);
});
test('existing page photos keep crop, zoom and placement independently of block banners', () => {
  const layout = model.normalize({ sections: [{ id: 'section-1', crop: { x: 10, y: 20 }, images: [{ id: 'image-1', crop: { x: 80, y: 60 }, zoom: 1.8, placement: { width: 60, x: 70, y: 8 } }] }] }, descriptor);
  assert.deepEqual(layout.sections[0].crop, { x: 10, y: 20 });
  assert.deepEqual(layout.sections[0].images[0].crop, { x: 80, y: 60 });
  assert.equal(layout.sections[0].images[0].zoom, 1.8);
  assert.deepEqual(model.normalize(JSON.parse(JSON.stringify(layout)), descriptor), layout);
});
test('published page rows enforce editor authorization and isolate versions by page', async () => {
  const { PGlite } = require('@electric-sql/pglite'), db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create function public.can_edit_cms() returns boolean language sql as $$ select coalesce(current_setting('test.cms_editor', true), '') = 'yes' $$;
      create function public.touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at = clock_timestamp(); return new; end$$;`);
    const name = fs.readdirSync(path.join(__dirname, '../supabase/migrations')).find(x => x.endsWith('_all_page_layouts.sql'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', name), 'utf8'));
    await db.exec('set role anon');
    assert.equal((await db.query('select * from public.site_page_layouts')).rows.length, 27);
    await assert.rejects(db.query("update public.site_page_layouts set layout='{}'"), /permission denied/);
    await db.exec('reset role; set role authenticated');
    assert.equal((await db.query("update public.site_page_layouts set layout='{}' returning page_key")).rows.length, 0);
    await db.exec("set test.cms_editor = 'yes'");
    const initial = (await db.query("select updated_at from public.site_page_layouts where page_key='/courses/'")).rows[0].updated_at;
    const changed = await db.query("update public.site_page_layouts set layout='{\"sections\":[]}' where page_key='/courses/' and updated_at=$1 returning page_key", [initial]);
    assert.equal(changed.rows.length, 1);
    assert.equal((await db.query("select layout from public.site_page_layouts where page_key='/overture/'")).rows[0].layout, null);
    assert.equal((await db.query("update public.site_page_layouts set layout='{}' where page_key='/courses/' and updated_at=$1 returning page_key", [initial])).rows.length, 0);
    await assert.rejects(db.query("update public.site_page_layouts set page_key='/forged/' where page_key='/courses/'"), /permission denied/);
    await assert.rejects(db.query("insert into public.site_page_layouts(page_key) values('/forged/')"), /permission denied/);
  } finally { await db.close(); }
});
