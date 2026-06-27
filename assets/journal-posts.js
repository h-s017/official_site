(() => {
  'use strict';

  const root = document.querySelector('[data-hana-blog]');
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!root || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  const directionLabels = {
    'olfactory-culture': '嗅覺文化',
    'scent-creation': '氣味創作',
    'heart-village-notes': '心村札記'
  };

  const directionUrls = {
    'olfactory-culture': '/projects/olfactory-culture/',
    'scent-creation': '/projects/scent-creation/',
    'heart-village-notes': '/projects/heart-village-notes/'
  };

  const getDirection = (body = '') => {
    const match = String(body).match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i);
    return match && directionLabels[match[1]] ? match[1] : 'olfactory-culture';
  };

  async function renderJournalPosts() {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const limit = Number(root.dataset.hanaBlogLimit || 3);
    const { data, error } = await client
      .from('posts')
      .select('title,slug,summary,cover_url,published_at,body,status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit || 3);

    const heading = root.dataset.hanaBlogTitle || '最新文章';

    if (error) {
      root.hidden = false;
      root.innerHTML = `<div class="hana-section-head"><h2>${esc(heading)}</h2></div><div class="empty">文章暫時無法載入，請稍後再試。</div>`;
      return;
    }

    const posts = Array.isArray(data) ? data : [];
    if (!posts.length) {
      root.hidden = false;
      root.innerHTML = `<div class="hana-section-head"><h2>${esc(heading)}</h2></div><div class="empty">目前尚無文章。</div>`;
      return;
    }

    const cards = posts.map((post) => {
      const direction = getDirection(post.body);
      const tag = `<a class="hana-direction" href="${esc(directionUrls[direction])}">${esc(directionLabels[direction])}</a>`;
      const image = post.cover_url ? `<img src="${esc(post.cover_url)}" alt="" loading="lazy">` : '';
      const url = `/blog.html?slug=${encodeURIComponent(post.slug || '')}`;
      const date = formatDate(post.published_at);
      return `<article class="hana-post">${image}${tag}<h3><a href="${url}">${esc(post.title || '')}</a></h3><p>${esc(post.summary || '')}</p>${date ? `<time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}<a class="text-link" href="${url}">繼續閱讀 →</a></article>`;
    }).join('');

    root.hidden = false;
    root.innerHTML = `<div class="hana-section-head"><h2>${esc(heading)}</h2></div><div class="hana-blog-grid">${cards}</div>`;
  }

  renderJournalPosts().catch(() => {
    root.hidden = false;
    root.innerHTML = '<div class="hana-section-head"><h2>最新文章</h2></div><div class="empty">文章暫時無法載入，請稍後再試。</div>';
  });
})();
