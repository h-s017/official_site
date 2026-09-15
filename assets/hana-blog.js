(() => {
  'use strict';
  const root = document.querySelector('#article');
  const cfg = window.HANA_CMS_CONFIG || {};
  const slug = new URLSearchParams(location.search).get('slug');
  const noCoverTitles = new Set(['HANA SCENT ARTIST 氣味敘事空間']);
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const publicCopy = value => typeof value === 'string' ? value
    .replace(/六、H[.]FUGUE ATELIER 的做法/g, '六、我們的做法')
    .replace(/在 H[.]FUGUE ATELIER，/g, '')
    .replace(/H[.]FUGUE ATELIER｜/g, '')
    .replace(/H[.]FUGUE ATELIER 新氣味發布。/g, '新氣味發布。')
    .replace(/HELORI 香氣探索所/g, 'HELORI 香氣探索體驗') : value;
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
  function postLink(post, label) {
    if (!post) return '<span></span>';
    return `<a href="/blog.html?slug=${encodeURIComponent(post.slug)}"><small>${label}</small><strong>${esc(publicCopy(post.title))}</strong></a>`;
  }
  function setMeta(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
  function setArticleSchema(post, canonicalUrl, imageUrl) {
    const direction = String(post.body || '').match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i)?.[1];
    const articleSections = {
      'olfactory-culture': '嗅覺文化',
      'scent-creation': '氣味創作',
      'heart-village-notes': '心村札記'
    };
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${canonicalUrl}#article`,
          headline: post.title,
          description: post.summary || undefined,
          url: canonicalUrl,
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
          image: imageUrl,
          datePublished: post.published_at || undefined,
          articleSection: articleSections[direction] || '氣味誌',
          author: { '@type': 'Person', '@id': 'https://hanascent.com/#hana', name: 'Hana 沈秉儀' },
          publisher: {
            '@type': 'Organization',
            '@id': 'https://hanascent.com/#organization',
            name: 'HANA SCENT ARTIST',
            url: 'https://hanascent.com/',
            logo: { '@type': 'ImageObject', url: 'https://hanascent.com/assets/logo黑.png' }
          },
          inLanguage: 'zh-Hant'
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://hanascent.com/' },
            { '@type': 'ListItem', position: 2, name: '氣味誌', item: 'https://hanascent.com/journal/' },
            { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl }
          ]
        }
      ]
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'hana-article-schema';
    script.textContent = JSON.stringify(graph);
    document.getElementById(script.id)?.remove();
    document.head.appendChild(script);
  }
  async function init() {
    if (!slug || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('missing');
    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await db.from('posts').select('title,summary,body,cover_url,published_at,slug').eq('slug',slug).eq('status','published').single();
    if (error || !data) throw error || new Error('not found');

    const { data: posts } = await db
      .from('posts')
      .select('title,slug,published_at')
      .eq('status','published')
      .order('published_at',{ ascending:false });

    const list = Array.isArray(posts) ? posts.filter(post => post && post.slug) : [];
    const currentIndex = list.findIndex(post => post.slug === slug);
    const newer = currentIndex > 0 ? list[currentIndex - 1] : null;
    const older = currentIndex >= 0 && currentIndex < list.length - 1 ? list[currentIndex + 1] : null;
    const adjacentNav = currentIndex >= 0 && list.length > 1
      ? `<nav class="post-nav" aria-label="文章導覽">${postLink(older, '上一篇')}${postLink(newer, '下一篇')}</nav>`
      : '';

    ['title', 'summary', 'body'].forEach(key => { data[key] = publicCopy(data[key]); });
    document.title = `${data.title}｜HANA SCENT ARTIST`;
    const description = document.querySelector('meta[name="description"]');
    if (description && data.summary) description.setAttribute('content', data.summary);
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalUrl = `https://hanascent.com/blog.html?slug=${encodeURIComponent(data.slug)}`;
    if (canonical) canonical.setAttribute('href', canonicalUrl);
    const published = data.published_at ? new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric'}).format(new Date(data.published_at)) : '';
    const showCover = data.cover_url && !noCoverTitles.has(String(data.title || '').trim());
    const cover = showCover ? `<img class="blog-cover" src="${esc(data.cover_url)}" alt="">` : '';
    const schemaImage = showCover ? data.cover_url : 'https://hanascent.com/assets/homepage-cover.png';
    setMeta('og:title', document.title);
    setMeta('og:description', data.summary || 'HANA SCENT ARTIST 氣味誌');
    setMeta('og:url', canonicalUrl);
    setMeta('og:type', 'article');
    setMeta('og:image', schemaImage);
    setArticleSchema(data, canonicalUrl, schemaImage);
    root.className = 'blog-article';
    root.innerHTML = `<header><p>${esc(published)}</p><h1>${esc(data.title)}</h1>${data.summary ? `<p class="summary">${esc(data.summary)}</p>` : ''}</header>${cover}<div class="blog-body">${cleanHtml(data.body)}</div>${adjacentNav}`;
  }
  init().catch(() => { root.className = 'blog-state'; root.innerHTML = '<h1>找不到這篇文章</h1><p>文章可能尚未發布，或網址已變更。</p><p><a href="/journal/">返回氣味誌</a></p>'; });
})();
