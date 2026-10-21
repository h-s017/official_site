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

  const snapshot = document.getElementById('journal-snapshot-data');
  if (snapshot) document.querySelectorAll('main time[datetime]').forEach(time => { time.textContent = formatDate(time.dateTime); });
  const signature = (posts) => JSON.stringify(posts.map(post => [post.slug || '', post.title || '', post.summary || '', post.cover_url || '', post.published_at || '', getDirection(post.body), post.featured === true]));

  const meta = (post) => {
    const direction = getDirection(post.body);
    const date = formatDate(post.published_at);
    return `<div class="journal-meta"><a href="${esc(directionUrls[direction])}">${esc(directionLabels[direction])}</a>${date ? `<span>·</span><time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}</div>`;
  };

  // Immutable published cover; derivatives match the existing centered 4:3 CSS crop.
  // Other/new CMS images retain their original URL and are never mapped by title/slug.
  const latestImageSource = post => post.cover_url === 'https://uzqaodfmnrjrsbvxhlmh.supabase.co/storage/v1/object/public/site-media/posts/await-1790701115411.jpg'
    ? 'src="/assets/journal/await-1790701115411-main-720.webp" srcset="/assets/journal/await-1790701115411-main-480.webp 480w, /assets/journal/await-1790701115411-main-720.webp 720w" sizes="(max-width:980px) 88vw, 58vw"'
    : `src="${esc(post.cover_url)}"`;

  function renderLatest(posts) {
    if (!latestRoot) return;
    if (!posts.length) { latestRoot.hidden = true; latestRoot.innerHTML = ''; return; }
    const [main, ...side] = posts.slice(0, 4);
    const mainImage = main.cover_url ? `<a href="${postUrl(main)}" aria-label="閱讀 ${esc(main.title || '')}"><img ${latestImageSource(main)} alt="" width="1200" height="900" fetchpriority="high" decoding="async" loading="eager"></a>` : '';
    const sideHtml = side.map((post) => {
      const image = post.cover_url ? `<a href="${postUrl(post)}" aria-label="閱讀 ${esc(post.title || '')}"><img src="${esc(post.cover_url)}" alt="" width="118" height="118" decoding="async" loading="lazy"></a>` : '';
      return `<article>${image}<div>${meta(post)}<h3><a href="${postUrl(post)}">${esc(post.title || '')}</a></h3></div></article>`;
    }).join('');

    latestRoot.hidden = false;
    latestRoot.innerHTML = `<div class="wrap">
      <div class="journal-section-head"><div><span class="eyebrow">Latest Stories</span><h2>最新文章</h2></div><a class="journal-view-all" href="/journal/all/">VIEW ALL ARTICLES →</a></div>
      <div class="journal-latest-grid">
        <article class="journal-latest-main">${mainImage}${meta(main)}<h3><a href="${postUrl(main)}">${esc(main.title || '')}</a></h3>${main.summary ? `<p>${esc(main.summary)}</p>` : ''}</article>
        <div class="journal-latest-side">${sideHtml}</div>
      </div>
    </div>`;
  }

  function renderFeatured(posts) {
    if (!featuredRoot) return;
    if (!posts.length) { featuredRoot.hidden = true; featuredRoot.innerHTML = ''; return; }
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
      allRoot.innerHTML = '<div class="hana-section-head"><h2>近期文章</h2></div><div class="empty">目前尚無文章。</div>';
      return;
    }
    const cards = visible.map((post) => {
      const direction = getDirection(post.body);
      const tag = `<a class="hana-direction" href="${esc(directionUrls[direction])}">${esc(directionLabels[direction])}</a>`;
      const image = post.cover_url ? `<img src="${esc(post.cover_url)}" alt="" width="900" height="1200" decoding="async" loading="lazy">` : '';
      const url = postUrl(post);
      const date = formatDate(post.published_at);
      return `<article class="hana-post">${image}${tag}<h3><a href="${url}">${esc(post.title || '')}</a></h3><p>${esc(post.summary || '')}</p>${date ? `<time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}<a class="text-link" href="${url}">繼續閱讀 →</a></article>`;
    }).join('');

    allRoot.hidden = false;
    allRoot.innerHTML = `<div class="hana-section-head"><h2>近期文章</h2></div><div class="hana-blog-grid">${cards}</div><div style="text-align:center;margin-top:34px"><a class="text-link" href="/journal/all/">查看全部文章 →</a></div>`;
  }

  async function init() {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await (window.HANA_CMS_POSTS || client
      .from('posts')
      .select('title,slug,summary,cover_url,published_at,body,status,featured')
      .eq('status', 'published')
      .order('published_at', { ascending: false }));

    if (error) throw error;
    const posts = Array.isArray(data) ? data : [];
    if (snapshot && JSON.stringify(JSON.parse(snapshot.textContent)) === signature(posts)) return;
    renderLatest(posts);
    renderFeatured(posts.filter((post) => post.featured === true));
    renderAll(posts);
  }

  init().catch(() => {
    if (latestRoot && !snapshot) {
      latestRoot.hidden = false;
      latestRoot.innerHTML = '<div class="wrap"><div class="empty">文章暫時無法載入，請稍後再試。</div></div>';
    }
  });
})();