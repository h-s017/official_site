(function (root) {
  'use strict';
  const base = root.HanaHomeLayout || (typeof require === 'function' ? require('./home-layout-model.js') : null);
  const text = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
  function block(value, fallback = {}) {
    const v = value && typeof value === 'object' ? value : {};
    const result = base.normalize({ sections: [{ ...v, id: 'entrances' }] }).sections[0];
    result.id = fallback.id || v.id;
    result.images = (fallback.images || []).map(image => {
      const saved = Array.isArray(v.images) ? v.images.find(x => x?.id === image.id) : null;
      return { id: image.id, url: base.imageUrl(saved?.url || image.url), alt: text(saved?.alt ?? image.alt, 500),
        fit: saved?.fit === 'contain' ? 'contain' : 'cover',
        position: ['top', 'bottom'].includes(saved?.position) ? saved.position : 'center' };
    });
    return result;
  }
  function normalize(input, descriptor = {}) {
    const source = input && typeof input === 'object' ? input : {};
    const originals = descriptor.sections || [], known = new Map(originals.map(b => [b.id, b])), seen = new Set(), sections = [];
    const max = Math.max(30, originals.length);
    for (const value of Array.isArray(source.sections) ? source.sections : []) {
      if (!value || typeof value.id !== 'string' || seen.has(value.id)) continue;
      if (!known.has(value.id) && !/^custom-[a-z0-9-]{1,60}$/.test(value.id)) continue;
      if (sections.length >= max && !known.has(value.id)) continue;
      sections.push(block(value, known.get(value.id))); seen.add(value.id);
    }
    for (const item of originals) if (!seen.has(item.id)) sections.push(block({}, item));
    return { version: 1, hero: descriptor.hero ? block(source.hero, descriptor.hero) : null, sections };
  }
  const api = { normalize, block };
  root.HanaPageLayout = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
