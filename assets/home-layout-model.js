(function (root) {
  'use strict';
  const builtins = [
    { id: 'entrances', name: '服務入口' },
    { id: 'news', name: '最新消息' },
    { id: 'about', name: 'About Hana' }
  ];
  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const s = value.trim();
    if (/^\/(?!\/)/.test(s)) return s;
    try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; }
  }
  const text = (v, max = 500) => typeof v === 'string' ? v.slice(0, max) : '';
  const clamp = (v, min, max, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(max, Math.max(min, v)) * 100) / 100 : fallback;
  function normalizeCrop(value) {
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: clamp(value.x, 0, 100, 50), y: clamp(value.y, 0, 100, 50) } : null;
  }
  function normalizePlacement(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? { width: clamp(value.width, 25, 100, 100), x: clamp(value.x, 0, 100, 50), y: clamp(value.y, 0, 50, 0) } : null;
  }
  function imageFocus(value) { return normalizeCrop(value.crop) || { x: 50, y: value.position === 'top' ? 0 : value.position === 'bottom' ? 100 : 50 }; }
  function imagePosition(value) { const p = imageFocus(value); return `${p.x}% ${p.y}%`; }
  function panCrop(start, dx, dy, width, height, naturalWidth, naturalHeight, zoom = 1, fit = 'cover') {
    if (![width, height, naturalWidth, naturalHeight].every(v => Number.isFinite(v) && v > 0)) return normalizeCrop(start) || { x: 50, y: 50 };
    const scale = (fit === 'contain' ? Math.min : Math.max)(width / naturalWidth, height / naturalHeight) * clamp(zoom, 1, 3, 1);
    const gapX = width - naturalWidth * scale, gapY = height - naturalHeight * scale;
    return normalizeCrop({ x: start.x + (Math.abs(gapX) > .5 ? dx / gapX * 100 : 0), y: start.y + (Math.abs(gapY) > .5 ? dy / gapY * 100 : 0) });
  }
  function panPlacement(start, dx, dy, width) {
    if (!(width > 0)) return normalizePlacement(start);
    const gap = width * (1 - start.width / 100);
    return normalizePlacement({ ...start, x: start.x + (gap > .5 ? dx / gap * 100 : 0), y: start.y + dy / width * 100 });
  }
  function linkUrl(value) {
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (!s) return '';
    if (/[\u0000-\u001f\\]/.test(s)) return null;
    if (/^\/(?!\/)/.test(s) || /^#[^\s]*$/.test(s)) return s;
    if (/^mailto:[^\s@]+@[^\s@]+$/i.test(s) || /^tel:\+?[0-9() -]+$/i.test(s)) return s;
    try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch (_) { return null; }
  }
  function sanitizeCopy(value, fields) {
    const result = {}, known = fields ? new Map(fields.map(f => [f.id, f])) : null;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    for (const [key, v] of Object.entries(value).slice(0, 1000)) {
      if (!/^(text|href|placeholder)-[a-z0-9-]{1,80}$/.test(key) || typeof v !== 'string') continue;
      if (known && !known.has(key)) continue;
      const field = known?.get(key);
      if (field?.kind === 'href' || key.startsWith('href-')) {
        const safe = linkUrl(v); if (safe !== null) result[key] = safe;
      } else result[key] = v.slice(0, 10000);
    }
    return result;
  }
  function block(value, fields) {
    return {
      id: value.id, visible: value.visible !== false,
      layout: ['original', 'left', 'right', 'top'].includes(value.layout) ? value.layout : 'original',
      image: imageUrl(value.image), alt: text(value.alt),
      position: ['center', 'top', 'bottom'].includes(value.position) ? value.position : 'center',
      fit: value.fit === 'contain' ? 'contain' : 'cover',
      crop: normalizeCrop(value.crop), zoom: clamp(value.zoom, 1, 3, 1), placement: normalizePlacement(value.placement),
      title: text(value.title, 160), body: text(value.body, 5000),
      link: imageUrl(value.link), label: text(value.label, 80), copy: sanitizeCopy(value.copy, fields)
    };
  }
  function normalize(input, descriptor) {
    const source = input && typeof input === 'object' ? input : {};
    const seen = new Set(), sections = [];
    for (const v of Array.isArray(source.sections) ? source.sections.slice(0, 30) : []) {
      if (!v || typeof v.id !== 'string' || seen.has(v.id)) continue;
      if (!builtins.some(b => b.id === v.id) && !/^custom-[a-z0-9-]{1,60}$/.test(v.id)) continue;
      seen.add(v.id); sections.push(block(v, descriptor?.sections?.find(b => b.id === v.id)?.fields));
    }
    for (const b of builtins) if (!seen.has(b.id)) sections.push(block(b));
    return { version: 1, hero: block({ ...(source.hero || {}), id: 'hero', visible: true }, descriptor?.hero?.fields), sections };
  }
  function validateImage(file) {
    if (!file) throw new Error('請先選擇照片。');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('請使用 JPG、PNG、WebP 或 GIF 照片。');
    if (file.size > 8 * 1024 * 1024) throw new Error('照片需小於 8 MB。');
  }
  const api = { builtins, normalize, imageUrl, validateImage, linkUrl, sanitizeCopy, clamp, normalizeCrop, normalizePlacement, imageFocus, imagePosition, panCrop, panPlacement };
  root.HanaHomeLayout = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
