const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const model = require('../assets/page-layout-model.js');
const pages = require('../assets/page-layout-catalog.js');
const descriptor = { hero: { id: 'hero', images: [] }, sections: [
  { id: 'section-1', images: [{ id: 'image-1', url: '/assets/original.webp', alt: '原圖' }] },
  { id: 'section-2', images: [] }
] };
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
