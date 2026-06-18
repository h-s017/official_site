(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const date = v => v ? new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric' }).format(new Date(v)) : '';

  function applySettings(s) {
    document.documentElement.style.setProperty('--hana-accent', s.accent_color);
    document.documentElement.style.setProperty('--hana-content-width', `${s.content_width}px`);
    document.querySelectorAll('[data-hana-site-name]').forEach(x => { x.textContent = s.site_name; });
    document.querySelectorAll('[data-hana-hero-title]').forEach(x => { x.textContent = s.hero_title; });
    document.querySelectorAll('[data-hana-hero-subtitle]').forEach(x => { x.textContent = s.hero_subtitle; });
    document.querySelectorAll('[data-hana-hero-image]').forEach(x => {
      if (!s.hero_image_url) return;
      if (x.tagName === 'IMG') x.src = s.hero_image_url; else x.style.backgroundImage = `url("${s.hero_image_url.replace(/["\\]/g, '\\$&')}")`;
    });
  }
  function renderAnnouncements(items, settings) {
    document.querySelectorAll('[data-hana-announcements]').forEach(root => {
      root.hidden = !settings.show_announcements;
      if (!items.length) return;
      root.innerHTML = `<div class="hana-section-head"><h2>最新公告</h2></div><div class="hana-list">${items.map(x => `<article class="hana-announcement" data-priority="${esc(x.priority)}"><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p>${x.link_url ? `<p><a href="${esc(x.link_url)}">了解更多</a></p>` : ''}</article>`).join('')}</div>`;
    });
  }
  function renderPosts(items, settings) {
    document.querySelectorAll('[data-hana-blog]').forEach(root => {
      root.hidden = !settings.show_blog || !items.length;
      if (!items.length) return;
      root.innerHTML = `<div class="hana-section-head"><h2>氣味誌</h2></div><div class="hana-blog-grid">${items.map(x => `<article class="hana-post">${x.cover_url ? `<img src="${esc(x.cover_url)}" alt="" loading="lazy">` : ''}<h3><a href="/blog.html?slug=${encodeURIComponent(x.slug)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><time datetime="${esc(x.published_at || '')}">${date(x.published_at)}</time></article>`).join('')}</div>`;
    });
  }
  function applySectionOrder(settings) {
    const announcements = document.querySelector('[data-hana-announcements]');
    const blog = document.querySelector('[data-hana-blog]');
    if (!announcements || !blog || announcements.parentNode !== blog.parentNode) return;
    const order = settings.section_order || ['announcements','blog'];
    if (order[0] === 'blog') announcements.parentNode.insertBefore(blog, announcements);
    else announcements.parentNode.insertBefore(announcements, blog);
  }
  async function init() {
    const [settings, announcements, posts] = await Promise.all([
      db.from('site_settings').select('*').eq('id',1).single(),
      db.from('announcements').select('*').eq('status','published').order('priority').order('created_at',{ascending:false}),
      db.from('posts').select('title,slug,summary,cover_url,published_at').eq('status','published').order('published_at',{ascending:false})
    ]);
    if (settings.error) throw settings.error; applySettings(settings.data);
    if (!announcements.error) renderAnnouncements(announcements.data, settings.data);
    if (!posts.error) renderPosts(posts.data, settings.data);
    applySectionOrder(settings.data);
    document.dispatchEvent(new CustomEvent('hana:cms-ready', { detail: settings.data }));
  }
  init().catch(error => console.error('[HANA CMS]', error));
})();
