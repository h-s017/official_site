const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/home-layout-model.js');

test('older settings preserve every built-in homepage section', () => {
  assert.deepEqual(model.normalize(null).sections.map(b => b.id), ['entrances', 'news', 'about']);
  assert.equal(model.normalize().hero.visible, true);
});
test('section order, hidden state, photos and valid custom sections survive a save round-trip', () => {
  const layout = model.normalize({ sections: [
    { id: 'about', visible: false, layout: 'right', image: '/assets/photo.webp', position: 'top' },
    { id: 'custom-test', title: '課程', body: '一\n二', link: 'https://reservation.hanascent.com/', label: '預約' },
    { id: 'entrances' }, { id: 'news' }
  ] });
  assert.deepEqual(model.normalize(JSON.parse(JSON.stringify(layout))), layout);
  assert.deepEqual(layout.sections.map(b => b.id), ['about', 'custom-test', 'entrances', 'news']);
  assert.equal(layout.sections[0].visible, false);
  assert.equal(layout.sections[1].body, '一\n二');
});
test('unknown or duplicate section IDs cannot replace the built-ins', () => {
  const layout = model.normalize({ sections: [null, { id: 'about' }, { id: 'about', visible: false }, { id: '__proto__' }, { id: 'custom-<svg>' }] });
  assert.deepEqual(layout.sections.map(b => b.id), ['about', 'entrances', 'news']);
  assert.equal(layout.sections[0].visible, true);
});
test('photo and button URLs reject executable, insecure and protocol-relative input', () => {
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml,<svg>', 'http://example.com/a', '//example.com/a', 'broken']) assert.equal(model.imageUrl(value), '');
  assert.equal(model.imageUrl('/assets/image.webp'), '/assets/image.webp');
  assert.equal(model.imageUrl('https://example.com/a.webp'), 'https://example.com/a.webp');
});
test('invalid display options and long input normalize into bounded values', () => {
  const b = model.normalize({ sections: [{ id: 'news', layout: 'bad', fit: 'bad', position: 'bad', title: 'a'.repeat(500), body: 'x'.repeat(6000) }] }).sections[0];
  assert.equal(b.layout, 'original'); assert.equal(b.fit, 'cover'); assert.equal(b.position, 'center');
  assert.equal(b.title.length, 160); assert.equal(b.body.length, 5000);
});
test('uploads match the existing bucket MIME and 8 MB size restrictions', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) model.validateImage({ type, size: 8 * 1024 * 1024 });
  assert.throws(() => model.validateImage({ type: 'image/svg+xml', size: 20 }), /JPG/);
  assert.throws(() => model.validateImage({ type: 'image/png', size: 8 * 1024 * 1024 + 1 }), /8 MB/);
});

test('the additive migration preserves existing settings and is safe to reapply', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const fs = require('node:fs'), path = require('node:path');
  const db = new PGlite();
  try {
    await db.exec("create table public.site_settings (id smallint primary key, hero_image_url text); insert into public.site_settings values (1, '/original.webp');");
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261107180142_home_layout_editor.sql'), 'utf8');
    await db.exec(sql); await db.exec(sql);
    const { rows } = await db.query('select * from public.site_settings');
    assert.deepEqual(rows, [{ id: 1, hero_image_url: '/original.webp', home_layout: null, hero_image_alt: '' }]);
  } finally { await db.close(); }
});
