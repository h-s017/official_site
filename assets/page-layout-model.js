(function (root) {
  'use strict';
  const base = root.HanaHomeLayout || (typeof require === 'function' ? require('./home-layout-model.js') : null);
  const text = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
  function block(value, fallback = {}) {
    const v = value && typeof value === 'object' ? value : {};
    const result = base.normalize({ sections: [{ ...v, id: 'entrances' }] }).sections[0];
    result.id = fallback.id || v.id;
    result.copy = base.sanitizeCopy(v.copy, fallback.fields);
    const heading = fallback.fields?.find(f => f.heading);
    if (heading && v.title && !Object.hasOwn(result.copy, heading.id)) result.copy[heading.id] = text(v.title, 160);
    result.images = (fallback.images || []).map(image => {
      const saved = Array.isArray(v.images) ? v.images.find(x => x?.id === image.id) : null;
      return { id: image.id, url: base.imageUrl(saved?.url || image.url), alt: text(saved?.alt ?? image.alt, 500),
        fit: saved?.fit === 'contain' ? 'contain' : 'cover',
        position: ['top', 'bottom'].includes(saved?.position) ? saved.position : 'center',
        crop: base.normalizeCrop(saved?.crop), zoom: base.clamp(saved?.zoom, 1, 3, 1), placement: base.normalizePlacement(saved?.placement) };
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
      const item = block(value, known.get(value.id));
      if (!known.has(value.id)) {
        const groups = descriptor.cardGroups || [];
        const matching = groups.find(g => g.links?.includes(item.link));
        const group = groups.find(g => g.id === value.cardGroup) || matching || groups[0];
        item.template = value.template === 'section' || !group ? 'section' : 'card';
        item.cardGroup = item.template === 'card' ? group.id : '';
        const labelIndex = group?.links?.indexOf(item.link) ?? -1;
        item.eyebrow = text(value.eyebrow ?? (labelIndex >= 0 ? group.labels?.[labelIndex] : ''), 80);
        item.cardIndex = Number.isInteger(value.cardIndex) && value.cardIndex >= 0
          ? Math.min(value.cardIndex, group?.count || 0) : group?.count || 0;
      }
      sections.push(item); seen.add(value.id);
    }
    for (const item of originals) if (!seen.has(item.id)) sections.push(block({}, item));
    return { version: 1, hero: descriptor.hero ? block(source.hero, descriptor.hero) : null, sections };
  }
  const api = { normalize, block };
  root.HanaPageLayout = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
