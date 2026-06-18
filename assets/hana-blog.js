(() => {
  'use strict';
  const root = document.querySelector('#article');
  const cfg = window.HANA_CMS_CONFIG || {};
  const slug = new URLSearchParams(location.search).get('slug');
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const fallbackSlugs = ['olfactory-vulgarity-or-artistry','blooming-tears','from-perfume-product-to-scent-branding-system','proust-effect-fragrance-experience','taipei-corporate-fragrance-workshop'];
  const coverOverrides = { 'olfactory-vulgarity-or-artistry': '/assets/柏拉圖.jpg' };
  const fallbackCover = value => coverOverrides[value] || `/assets/${Math.max(fallbackSlugs.indexOf(value), 0) + 1}.png`;
  function cleanHtml(html) {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const allowed = new Set(['P','BR','H2','H3','H4','BLOCKQUOTE','UL','OL','LI','STRONG','EM','A','IMG','HR','FIGURE','FIGCAPTION']);
    [...doc.body.querySelectorAll('*')].forEach(el => {
      if (!allowed.has(el.tagName)) { el.replaceWith(...el.childNodes); return; }
      [...el.attributes].forEach(attr => {
        const okay = (el.tagName === 'A' && ['href','title'].includes(attr.name)) || (el.tagName === 'IMG' && ['src','alt','title','loading'].includes(attr.name));
        if (!okay || (/^(href|src)$/.test(attr.name) && !/^(https?:|\/)/i.test(attr.value))) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'A') { el.setAttribute('rel','noopener'); if (/^https?:/i.test(el.getAttribute('href') || '')) el.setAttribute('target','_blank'); }
      if (el.tagName === 'IMG') el.setAttribute('loading','lazy');
    });
    return doc.body.innerHTML;
  }
  async function init() {
    if (!slug || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('missing');
    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await db.from('posts').select('title,summary,body,cover_url,published_at').eq('slug',slug).eq('status','published').single();
    if (error || !data) throw error || new Error('not found');
    document.title = `${data.title}｜HANA SCENT ARTIST`;
    const published = data.published_at ? new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric'}).format(new Date(data.published_at)) : '';
    const cover = coverOverrides[slug] || data.cover_url || fallbackCover(slug);
    root.className = 'blog-article'; root.innerHTML = `<header><p>${esc(published)}</p><h1>${esc(data.title)}</h1>${data.summary ? `<p class="summary">${esc(data.summary)}</p>` : ''}</header><img class="blog-cover" src="${esc(cover)}" alt=""><div class="blog-body">${cleanHtml(data.body)}</div>`;
  }
  init().catch(() => { root.className = 'blog-state'; root.innerHTML = '<h1>找不到這篇文章</h1><p>文章可能尚未發布，或網址已變更。</p><p><a href="/">返回首頁</a></p>'; });
})();
