(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const date = v => v ? new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric' }).format(new Date(v)) : '';
  const fallbackCover = index => `/assets/${(index % 5) + 1}.png`;

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
  function applyPageContents(items) {
    const fields = [...document.querySelectorAll('[data-hana-field]')];
    items.forEach(item => {
      if (typeof item.value !== 'string' || !item.value.trim()) return;
      fields.filter(el => el.dataset.hanaField === item.field_key).forEach(el => {
        if (item.content_type === 'image' && item.value) el.setAttribute('src', item.value);
        else if (item.content_type === 'url' && item.value) el.setAttribute('href', item.value);
        else el.textContent = item.value;
      });
    });
  }
  function renderAnnouncements(items, settings) {
    document.querySelectorAll('[data-hana-announcements]').forEach(root => {
      root.hidden = !settings.show_announcements;
      const list = root.querySelector('.news-list');
      if (!list || !items.length) return;
      list.querySelectorAll('[data-hana-announcement]').forEach(x => x.remove());
      const rows = items.map(x => {
        const sourceDate = x.starts_at || x.created_at || '';
        const label = sourceDate && !isNaN(new Date(sourceDate).getTime())
          ? new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'2-digit' }).format(new Date(sourceDate)).replace('/', '.')
          : 'NEWS';
        return `<article class="news-row" data-hana-announcement><div class="news-date">${esc(label)}</div><div><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p></div>${x.link_url ? `<a class="text-link" href="${esc(x.link_url)}">了解更多 →</a>` : ''}</article>`;
      }).join('');
      list.insertAdjacentHTML('afterbegin', rows);
    });
  }
  function renderPosts(items, settings) {
    document.querySelectorAll('[data-hana-blog]').forEach(root => {
      root.hidden = !settings.show_blog || !items.length;
      if (!items.length) return;
      const heading = root.dataset.hanaBlogTitle || '氣味誌';
      root.innerHTML = `<div class="hana-section-head"><h2>${esc(heading)}</h2></div><div class="hana-blog-grid">${items.map((x, index) => `<article class="hana-post"><img src="${esc(x.cover_url || fallbackCover(index))}" alt="" loading="lazy"><h3><a href="/blog.html?slug=${encodeURIComponent(x.slug)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><time datetime="${esc(x.published_at || '')}">${date(x.published_at)}</time></article>`).join('')}</div>`;
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
    const pageKey = document.body.dataset.hanaPage || '';
    const [settings, announcements, posts, pageContents] = await Promise.all([
      db.from('site_settings').select('*').eq('id',1).single(),
      db.from('announcements').select('*').eq('status','published').order('priority').order('created_at',{ascending:false}),
      db.from('posts').select('title,slug,summary,cover_url,published_at').eq('status','published').order('published_at',{ascending:false}),
      pageKey ? db.from('page_contents').select('field_key,content_type,value').eq('page_key', pageKey) : Promise.resolve({ data: [], error: null })
    ]);
    if (settings.error) throw settings.error; applySettings(settings.data);
    if (!pageContents.error) applyPageContents(pageContents.data || []);
    if (!announcements.error) renderAnnouncements(announcements.data, settings.data);
    if (!posts.error) renderPosts(posts.data, settings.data);
    applySectionOrder(settings.data);
    document.dispatchEvent(new CustomEvent('hana:cms-ready', { detail: settings.data }));
  }
  init().catch(error => console.error('[HANA CMS]', error));
})();
