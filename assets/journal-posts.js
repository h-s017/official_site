(() => {
  'use strict';

  const latestRoot = document.querySelector('[data-journal-latest]');
  const featuredRoot = document.querySelector('[data-journal-featured]');
  const allRoot = document.querySelector('[data-hana-blog]');
  const cfg = window.HANA_CMS_CONFIG || {};
  if ((!latestRoot && !featuredRoot && !allRoot) || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
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

  const postUrl = (post) => `/blog.html?slug=${encodeURIComponent(post.slug || '')}`;

  const meta = (post) => {
    const direction = getDirection(post.body);
    const date = formatDate(post.published_at);
    return `<div class="journal-meta"><a href="${esc(directionUrls[direction])}">${esc(directionLabels[direction])}</a>${date ? `<span>·</span><time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}</div>`;
  };

  function renderLatest(posts) {
    if (!latestRoot || !posts.length) return;
    const [main, ...side] = posts.slice(0, 3);
    const mainImage = main.cover_url ? `<a href="${postUrl(main)}"><img src="${esc(main.cover_url)}" alt="" loading="eager"></a>` : '';
    const sideHtml = side.map((post) => {
      const image = post.cover_url ? `<a href="${postUrl(post)}"><img src="${esc(post.cover_url)}" alt="" loading="lazy"></a>` : '';
      return `<article>${image}<div>${meta(post)}<h3><a href="${postUrl(post)}">${esc(post.title || '')}</a></h3></div></article>`;
    }).join('');

    latestRoot.hidden = false;
    latestRoot.innerHTML = `<div class="wrap">
      <div class="journal-section-head"><div><span class="eyebrow">Latest Stories</span><h2>最新文章</h2></div><a class="journal-view-all" href="#all-articles">VIEW ALL ARTICLES →</a></div>
      <div class="journal-latest-grid">
        <article class="journal-latest-main">${mainImage}${meta(main)}<h3><a href="${postUrl(main)}">${esc(main.title || '')}</a></h3>${main.summary ? `<p>${esc(main.summary)}</p>` : ''}</article>
        <div class="journal-latest-side">${sideHtml}</div>
      </div>
    </div>`;
  }

  function renderFeatured(posts) {
    if (!featuredRoot || !posts.length) return;
    const rows = posts.slice(0, 5).map((post, index) => `<article class="journal-featured-item">
      <span class="journal-featured-no">${String(index + 1).padStart(2, '0')}</span>
      <div>${meta(post)}<h3><a href="${postUrl(post)}">${esc(post.title || '')}</a></h3></div>
      <a class="journal-featured-arrow" href="${postUrl(post)}" aria-label="閱讀 ${esc(post.title || '')}">→</a>
    </article>`).join('');

    featuredRoot.hidden = false;
    featuredRoot.innerHTML = `<div class="wrap"><div class="journal-section-head"><div><span class="eyebrow">Selected Reading</span><h2>精選文章</h2></div></div><div class="journal-featured-list">${rows}</div></div>`;
  }

  function renderAll(posts) {
    if (!allRoot) return;
    const limit = Number(allRoot.dataset.hanaBlogLimit || 6);
    const visible = posts.slice(0, limit || 6);
    if (!visible.length) {
      allRoot.hidden = false;
      allRoot.innerHTML = '<div class="hana-section-head"><h2>全部文章</h2></div><div class="empty">目前尚無文章。</div>';
      return;
    }
    const cards = visible.map((post) => {
      const direction = getDirection(post.body);
      const tag = `<a class="hana-direction" href="${esc(directionUrls[direction])}">${esc(directionLabels[direction])}</a>`;
      const image = post.cover_url ? `<img src="${esc(post.cover_url)}" alt="" loading="lazy">` : '';
      const url = postUrl(post);
      const date = formatDate(post.published_at);
      return `<article class="hana-post">${image}${tag}<h3><a href="${url}">${esc(post.title || '')}</a></h3><p>${esc(post.summary || '')}</p>${date ? `<time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}<a class="text-link" href="${url}">繼續閱讀 →</a></article>`;
    }).join('');

    allRoot.hidden = false;
    allRoot.innerHTML = `<div class="hana-section-head"><h2>全部文章</h2></div><div class="hana-blog-grid">${cards}</div>`;
  }

  async function init() {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await client
      .from('posts')
      .select('title,slug,summary,cover_url,published_at,body,status,featured')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;
    const posts = Array.isArray(data) ? data : [];
    renderLatest(posts);
    renderFeatured(posts.filter((post) => post.featured === true));
    renderAll(posts);
  }

  init().catch(() => {
    if (latestRoot) {
      latestRoot.hidden = false;
      latestRoot.innerHTML = '<div class="wrap"><div class="empty">文章暫時無法載入，請稍後再試。</div></div>';
    }
  });
})();