(() => {
  'use strict';
  if (document.body.dataset.hanaPage !== 'home') return;
  const model = window.HanaHomeLayout;
  if (!model || !window.HanaLayoutText) return;
  const main = document.querySelector('main');
  const preview = window.parent !== window && new URLSearchParams(location.search).has('hana-layout-preview');
  let originals, contents, heroOriginal, portraitOriginal, descriptor, copyBindings, settings = {}, ready = false, pending;
  const imageAttributes = ['src', 'srcset', 'sizes', 'alt', 'style'];
  function restoreImage(image, original) {
    for (const key of imageAttributes) {
      if (original.hasAttribute(key)) image.setAttribute(key, original.getAttribute(key));
      else image.removeAttribute(key);
    }
  }
  function setImage(image, config) {
    if (config.image) {
      image.removeAttribute('srcset'); image.removeAttribute('sizes'); image.src = config.image;
    }
    if (config.alt) image.alt = config.alt;
    image.style.setProperty('object-fit', config.fit, 'important');
    image.style.setProperty('object-position', config.position, 'important');
  }
  function content(block) {
    const box = document.createElement('div'); box.className = 'hana-block-copy';
    if (block.title) { const h = document.createElement('h2'); h.textContent = block.title; box.append(h); }
    if (block.body) { const p = document.createElement('p'); p.textContent = block.body; p.style.whiteSpace = 'pre-line'; box.append(p); }
    if (block.link && block.label) { const a = document.createElement('a'); a.className = 'text-link'; a.href = block.link; a.textContent = block.label; box.append(a); }
    return box;
  }
  function apply(input) {
    if (!ready) { pending = input; return; }
    const config = model.normalize(input, descriptor);
    const hero = document.querySelector('[data-hana-hero-image]');
    restoreImage(hero, heroOriginal); setImage(hero, config.hero);
    copyBindings.get('hero').apply(config.hero.copy);
    main.querySelectorAll('[data-hana-section]').forEach(x => x.remove());
    for (const block of config.sections) {
      const original = originals.get(block.id);
      // Keep the original nodes so scroll observers and existing interactions survive edits.
      const section = original || document.createElement('section');
      if (original) {
        const wrap = section.querySelector('.wrap');
        wrap.replaceChildren(...contents.get(block.id));
        wrap.classList.remove('hana-photo-layout'); delete wrap.dataset.hanaLayout;
      }
      section.dataset.hanaSection = block.id;
      section.hidden = !block.visible;
      if (original) copyBindings.get(block.id).apply(block.copy);
      if (!original) { section.className = 'hana-custom-section'; const wrap = document.createElement('div'); wrap.className = 'wrap'; wrap.append(content(block)); section.append(wrap); }
      if (block.id === 'about') {
        const portrait = section.querySelector('.about-portrait img');
        restoreImage(portrait, portraitOriginal); setImage(portrait, block);
        section.querySelector('.about-profile').dataset.hanaLayout = block.layout;
      } else if (block.image) {
        const wrap = section.querySelector('.wrap');
        const copy = document.createElement('div'); copy.className = 'hana-block-copy';
        while (wrap.firstChild) copy.append(wrap.firstChild);
        const figure = document.createElement('figure'); figure.className = 'hana-block-photo';
        const image = document.createElement('img'); image.loading = 'lazy'; image.alt = block.alt; setImage(image, block); figure.append(image);
        wrap.dataset.hanaLayout = block.layout; wrap.classList.add('hana-photo-layout'); wrap.append(figure, copy);
      }
      main.append(section);
    }
  }
  document.addEventListener('hana:cms-ready', e => {
    window.HanaLayoutText.ready.then(() => {
    settings = e.detail || {};
    if (!ready) {
      originals = new Map([...main.querySelectorAll('[data-hana-section]')].map(x => [x.dataset.hanaSection, x]));
      contents = new Map([...originals].map(([id, section]) => [id, [...section.querySelector('.wrap').childNodes]]));
      heroOriginal = document.querySelector('[data-hana-hero-image]').cloneNode(true);
      portraitOriginal = document.querySelector('.about-portrait img').cloneNode(true);
      copyBindings = new Map([...originals].map(([id, section]) => [id, window.HanaLayoutText.capture(section)]));
      copyBindings.set('hero', window.HanaLayoutText.capture(document.querySelector('header.hero')));
      descriptor = { path: '/', hero: { id: 'hero', fields: copyBindings.get('hero').fields }, sections: [...originals].map(([id]) => ({ id, fields: copyBindings.get(id).fields })) };
      ready = true;
    }
    if (settings.home_layout || pending) apply(pending || settings.home_layout);
    if (preview) window.parent.postMessage({ type: 'hana-layout-ready', path: '/', descriptor }, location.origin);
    });
  });
  if (preview) {
    try { sessionStorage.setItem('hana-intro-restored-seen', '1'); } catch (_) {}
    document.addEventListener('click', event => { if (event.target.closest('a[href]')) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    window.addEventListener('message', e => {
      if (e.origin !== location.origin || e.source !== window.parent || e.data?.type !== 'hana-layout-preview') return;
      pending = e.data.layout; apply(pending);
    });
  }
})();
