(() => {
  'use strict';
  if (!window.HanaLayoutText) return;
  window.HanaLayoutText.ready.then(() => {
  const path = location.pathname.replace(/index\.html$/, '');
  if (path === '/' || !window.HanaLayoutPages?.some(p => p.path === path)) return;
  const model = window.HanaPageLayout, cfg = window.HANA_CMS_CONFIG, main = document.querySelector('main');
  if (!model || !cfg || !main) return;
  const preview = window.parent !== window && new URLSearchParams(location.search).has('hana-layout-preview');
  const snapshots = new Map(), cardGroups = new Map(); let pending, ready = false, observer, activeConfig;
  const imageAttrs = ['src', 'srcset', 'sizes', 'alt', 'style'];
  function snapshot(node, id) {
    node.dataset.pageLayoutSection = id;
    const root = [...node.children].find(x => x.classList.contains('wrap')) || node;
    const dynamic = node.matches('[data-hana-blog],[data-journal-latest],[data-journal-featured],.archive-wrap,.news-archive');
    const images = (dynamic ? [] : [...node.querySelectorAll('img[src]')]).map((image, i) => ({
      image, original: image.cloneNode(true), id: `image-${i + 1}`, url: new URL(image.src).origin === location.origin ? new URL(image.src).pathname + new URL(image.src).search : image.src, alt: image.alt
    }));
    const heading = node.querySelector('h1,h2');
    const copy = window.HanaLayoutText.capture(node, { dynamic });
    root.classList.remove('hana-page-photo-layout'); delete root.dataset.pageLayout;
    const result = { node, root, children: [...root.childNodes], originalClass: root.className, dynamic,
      heading, copy, images };
    snapshots.set(id, result);
    return { id, name: (heading?.textContent || node.getAttribute('aria-label') || `內容區塊 ${id.split('-').pop()}`).trim().slice(0, 60),
      images: images.map(({ id, url, alt }) => ({ id, url, alt })), fields: copy.fields, dynamic };
  }
  const heroNode = [...document.body.children].find(x => x.tagName === 'HEADER');
  const sections = [...main.children].filter(x => !['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(x.tagName));
  const descriptor = { path, hero: heroNode ? snapshot(heroNode, 'hero') : null,
    sections: sections.map((node, i) => snapshot(node, `section-${i + 1}`)) };
  descriptor.cardGroups = [];
  for (const [sectionId, saved] of snapshots) {
    for (const grid of saved.node.querySelectorAll('[data-layout-card-group]')) {
      const cards = [...grid.children].filter(node => node.matches('article') && node.querySelector('h2,h3,h4'));
      if (!cards.length) continue;
      const id = `${sectionId}:${grid.dataset.layoutCardGroup}`;
      cardGroups.set(id, { grid, cards });
      descriptor.cardGroups.push({ id, name: grid.dataset.layoutCardName || saved.heading?.textContent || '原有卡片',
        count: cards.length, links: cards.map(card => card.querySelector('a[href]')?.getAttribute('href') || ''),
        labels: cards.map(card => card.querySelector('small')?.textContent || '') });
    }
  }
  const anchor = document.createComment('page layout sections'); main.append(anchor);
  // Article feeds can refresh a whole section after the layout request has completed.
  observer = new MutationObserver(records => {
    const changed = [...snapshots].filter(([, saved]) => saved.dynamic && records.some(r => r.target === saved.node));
    if (!changed.length) return;
    for (const [id, saved] of changed) {
      const fresh = snapshot(saved.node, id);
      const index = descriptor.sections.findIndex(s => s.id === id);
      if (index !== -1) descriptor.sections[index] = fresh;
    }
    if (activeConfig) apply(activeConfig);
  });
  observer.observe(main, { childList: true, subtree: true });
  function setPhoto(image, photo, url) {
    if (url) { image.src = url; image.removeAttribute('srcset'); image.removeAttribute('sizes'); }
    image.alt = photo.alt || '';
    image.style.setProperty('object-fit', photo.fit, 'important');
    image.style.setProperty('object-position', window.HanaHomeLayout.imagePosition(photo), 'important');
  }
  function copy(block) {
    const root = document.createElement('div');
    if (block.title) { const h = document.createElement('h2'); h.textContent = block.title; root.append(h); }
    if (block.body) { const p = document.createElement('p'); p.textContent = block.body; p.style.whiteSpace = 'pre-line'; root.append(p); }
    if (block.link && block.label) { const a = document.createElement('a'); a.href = block.link; a.textContent = block.label; a.className = 'text-link'; root.append(a); }
    return root;
  }
  function card(block, group) {
    const sample = group.cards.find(node => node.querySelector('a[href]')?.getAttribute('href') === block.link) || group.cards[0];
    const node = document.createElement('article'); node.className = `${sample.className} hana-page-custom-card`.trim();
    node.dataset.pageCustomCard = block.id;
    const content = document.createElement('div');
    const small = document.createElement('small'); small.textContent = block.eyebrow; content.append(small);
    if (block.title) { const h = document.createElement(sample.querySelector('h2,h3,h4').tagName); h.textContent = block.title; content.append(h); }
    if (block.body) { const p = document.createElement('p'); p.textContent = block.body; content.append(p); }
    if (sample.firstElementChild?.tagName === 'DIV') node.append(content); else node.append(...content.childNodes);
    if (block.link && block.label) { const a = document.createElement('a'); a.href = block.link; a.className = sample.querySelector('a')?.className || 'text-link'; a.textContent = block.label; node.append(a); }
    decorate(node, block);
    return node;
  }
  function decorate(root, block) {
    if (!block.image) return;
    const content = document.createElement('div'); content.className = 'hana-page-copy';
    while (root.firstChild) content.append(root.firstChild);
    const figure = document.createElement('figure'); figure.className = 'hana-page-photo';
    const img = document.createElement('img'); img.loading = 'lazy'; setPhoto(img, block, block.image); figure.append(img);
    root.classList.add('hana-page-photo-layout'); root.dataset.pageLayout = block.layout;
    root.append(figure, content);
  }
  function apply(input) {
    if (!ready) { pending = input; return; }
    activeConfig = input; observer.disconnect();
    const config = model.normalize(input, descriptor);
    main.querySelectorAll('[data-page-custom],[data-page-custom-card]').forEach(x => x.remove());
    for (const { cards } of cardGroups.values()) for (const node of cards) node.removeAttribute('data-page-empty-card');
    const grouped = [];
    for (const block of [config.hero, ...config.sections].filter(Boolean)) {
      const saved = snapshots.get(block.id);
      let node;
      if (!saved && block.template === 'card' && cardGroups.has(block.cardGroup)) { grouped.push(block); continue; }
      if (saved) {
        node = saved.node; saved.root.replaceChildren(...saved.children); saved.root.className = saved.originalClass; delete saved.root.dataset.pageLayout;
        for (const original of saved.images) {
          window.HanaLayoutPhoto?.restore(original.image);
          for (const attr of imageAttrs) {
            if (original.original.hasAttribute(attr)) original.image.setAttribute(attr, original.original.getAttribute(attr));
            else original.image.removeAttribute(attr);
          }
          original.image.dataset.layoutPhotoId = original.id;
          const photo = block.images.find(p => p.id === original.id);
          if (photo) {
            if (photo.url !== original.url) setPhoto(original.image, photo, photo.url);
            else { original.image.alt = photo.alt; original.image.style.setProperty('object-fit', photo.fit, 'important'); original.image.style.setProperty('object-position', window.HanaHomeLayout.imagePosition(photo), 'important'); }
          }
        }
        saved.copy.apply(block.copy);
        decorate(saved.root, block);
      } else {
        node = document.createElement('section'); node.className = 'hana-page-custom'; node.dataset.pageCustom = block.id;
        const root = document.createElement('div'); root.className = 'wrap'; root.append(copy(block)); node.append(root); decorate(root, block);
      }
      node.hidden = !block.visible;
      if (block.id !== 'hero') main.insertBefore(node, anchor);
      if (saved) for (const original of saved.images) {
        const photo = block.images.find(p => p.id === original.id);
        if (photo) window.HanaLayoutPhoto?.apply(original.image, photo);
      }
      const banner = node.querySelector('.hana-page-photo');
      if (banner) window.HanaLayoutPhoto?.apply(banner.querySelector('img'), block, { ratio: 4 / 3, target: banner });
    }
    for (const { cards } of cardGroups.values()) for (const node of cards) {
      if (!node.textContent.trim() && !node.querySelector('img,video,iframe,form,input,svg,canvas')) node.setAttribute('data-page-empty-card', '');
    }
    for (const block of grouped) {
      const group = cardGroups.get(block.cardGroup), node = card(block, group);
      node.hidden = !block.visible;
      group.grid.insertBefore(node, group.cards[block.cardIndex] || null);
      const banner = node.querySelector('.hana-page-photo');
      if (banner) window.HanaLayoutPhoto?.apply(banner.querySelector('img'), block, { ratio: 4 / 3, target: banner });
    }
    observer.observe(main, { childList: true, subtree: true });
  }
  window.addEventListener('message', event => {
    if (!preview || event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'hana-layout-preview' || event.data.path !== path) return;
    pending = event.data.layout; apply(pending);
  });
  if (preview) {
    document.addEventListener('click', event => { if (event.target.closest('a[href]')) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
  }
  const params = new URLSearchParams({ page_key: `eq.${path}`, select: 'layout' });
  fetch(`${cfg.supabaseUrl}/rest/v1/site_page_layouts?${params}`, { headers: { apikey: cfg.supabaseAnonKey } })
    .then(response => { if (!response.ok) throw new Error('Page settings unavailable'); return response.json(); })
    .then(rows => { ready = true; if (pending || rows[0]?.layout) apply(pending || rows[0].layout); })
    .catch(error => { ready = true; console.warn('[HANA page layout]', error.message); if (pending) apply(pending); })
    .finally(() => { if (preview) window.parent.postMessage({ type: 'hana-layout-ready', path, descriptor }, location.origin); });
  });
})();
