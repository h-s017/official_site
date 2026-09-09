(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const date = v => v ? new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric' }).format(new Date(v)) : '';
  const noCoverTitles = new Set(['HANA SCENT ARTIST 氣味敘事空間']);
  const pinnedAnnouncements = [
    { title:'香氣作品《夏日青》與 66冊香-01《Blooming Tears》已發表', content:'兩件香氣作品已發表在 H.FUGUE ATELIER。', category:'H.FUGUE', link_url:'/h-fugue-atelier/', link_label:'前往 H.FUGUE ATELIER →' }
  ];
  const defaultAnnouncements = [
    ...pinnedAnnouncements,
    { title:'心村限定調香體驗開放預約', content:'可預約探索調香體驗，完成一支屬於此刻狀態的氣味。', category:'2026.07', link_url:'https://reservation.hanascent.com/', link_label:'立即預約 →' },
    { title:'專業調香課程系列上線', content:'從氣味藝術序曲開始，可銜接 KPIA 或後續專業進修路線。', category:'COURSE', link_url:'/courses/', link_label:'查看課程 →' },
    { title:'HELORI 香氣探索所', content:'探索此刻屬於你的香氣夥伴。', category:'HELORI', link_url:'/helori/', link_label:'進入 HELORI →' }
  ];
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
  const directionFromBody = body => {
    const match = String(body || '').match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i);
    return match?.[1] && directionLabels[match[1]] ? match[1] : 'olfactory-culture';
  };
  const shouldShowCover = post => Boolean(post.cover_url) && !noCoverTitles.has(String(post.title || '').trim());
  const postUrl = post => post?.slug ? `/blog.html?slug=${encodeURIComponent(post.slug)}` : '/journal/';
  const settingValue = (settings, ...keys) => {
    for (const key of keys) {
      const value = settings?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value !== undefined && value !== null && typeof value !== 'string') return value;
    }
    return '';
  };

  function installHomeNewsMarqueeStyles() {
    if (document.getElementById('hana-home-news-marquee-styles')) return;
    const style = document.createElement('style');
    style.id = 'hana-home-news-marquee-styles';
    style.textContent = `
      .home-news{padding-top:52px!important;padding-bottom:56px!important;}
      .home-news .wrap{max-width:1100px!important;}
      .home-news .section-head{grid-template-columns:120px 1fr;gap:24px;}
      .home-news .news-list{border:0!important;}
      .home-news .news-marquee{position:relative;width:100%;overflow:hidden;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 5%,#000 95%,transparent 100%);mask-image:linear-gradient(to right,transparent 0,#000 5%,#000 95%,transparent 100%);}
      .home-news .news-track{display:flex;align-items:stretch;gap:18px;width:max-content;animation:hanaNewsMarquee 34s linear infinite;will-change:transform;}
      .home-news .news-set{display:flex;align-items:stretch;gap:18px;flex:0 0 auto;}
      .home-news .news-marquee:hover .news-track{animation-play-state:paused;}
      .home-news .news-row{flex:0 0 clamp(270px,28vw,340px);display:flex!important;flex-direction:column;justify-content:space-between;min-height:220px;padding:22px!important;margin:0!important;border:1px solid var(--line)!important;background:#fff;box-sizing:border-box;}
      .home-news .news-row:hover,.home-news .news-row:focus-within{background:var(--gray100);}
      .home-news .news-main{min-width:0;}
      .home-news .news-meta{display:flex;align-items:center;gap:10px;margin-bottom:10px;color:var(--gray500);font-size:11.5px!important;line-height:1.5!important;letter-spacing:.12em;}
      .home-news .news-category{color:var(--gray700);}
      .home-news .news-date{color:var(--gray500);white-space:nowrap;}
      .home-news .news-date::before{content:'·';margin-right:10px;}
      .home-news .news-row h3{margin:0 0 10px!important;font-size:17px!important;line-height:1.5!important;letter-spacing:.05em!important;font-weight:500!important;}
      .home-news .news-row p{margin:0!important;color:var(--gray700);font-size:14px!important;line-height:1.7!important;}
      .home-news .news-row>.text-link{margin-top:18px!important;font-size:11.5px!important;letter-spacing:.12em!important;white-space:nowrap;}
      .home-news .news-empty{margin:0;padding:18px 0;color:var(--gray500);font-size:13px!important;letter-spacing:.08em;}
      .home-news-more{display:flex;justify-content:flex-end;margin-top:18px;}
      @keyframes hanaNewsMarquee{from{transform:translateX(calc(-50% - 9px));}to{transform:translateX(0);}}
      @media(max-width:980px){.home-news .wrap{max-width:1100px!important;}.home-news .section-head{grid-template-columns:120px 1fr;gap:24px!important;}}
      @media(max-width:760px){
        .home-news .section-head{grid-template-columns:1fr;gap:10px!important;}
        .home-news .news-track,.home-news .news-set{gap:14px;}
        .home-news .news-track{animation-duration:28s;}
        .home-news .news-row{flex:0 0 78vw;min-height:200px;padding:18px!important;}
        .home-news .news-row h3{font-size:16px!important;}
        .home-news .news-row p{font-size:13.5px!important;}
        @keyframes hanaNewsMarquee{from{transform:translateX(calc(-50% - 7px));}to{transform:translateX(0);}}
      }
      @media(prefers-reduced-motion:reduce){
        .home-news .news-track{animation:none;}
        .home-news .news-marquee{overflow-x:auto;-webkit-mask-image:none;mask-image:none;}
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceHomeNewsMarquee(root, list) {
    if (!root.classList.contains('home-news')) return;
    installHomeNewsMarqueeStyles();
    let marquee = list.parentElement;
    if (!marquee?.classList.contains('news-marquee')) {
      marquee = document.createElement('div');
      marquee.className = 'news-marquee';
      list.parentNode.insertBefore(marquee, list);
      marquee.appendChild(list);
    }
    list.classList.add('news-track');
    const rows = [...list.querySelectorAll(':scope > [data-hana-announcement]')];
    if (!rows.length) return;
    const firstSet = document.createElement('div');
    firstSet.className = 'news-set';
    rows.forEach(row => firstSet.appendChild(row));
    const secondSet = firstSet.cloneNode(true);
    secondSet.setAttribute('aria-hidden', 'true');
    secondSet.querySelectorAll('a,button,[tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
    list.replaceChildren(firstSet, secondSet);
  }

  function applySettings(s = {}) {
    if (s.accent_color) document.documentElement.style.setProperty('--hana-accent', s.accent_color);
    if (s.content_width) document.documentElement.style.setProperty('--hana-content-width', `${s.content_width}px`);
    document.querySelectorAll('[data-hana-site-name]').forEach(x => { if (s.site_name) x.textContent = s.site_name; });
    document.querySelectorAll('[data-hana-hero-title]').forEach(x => { if (s.hero_title) x.textContent = s.hero_title; });
    document.querySelectorAll('[data-hana-hero-subtitle]').forEach(x => { if (s.hero_subtitle) x.textContent = s.hero_subtitle; });
    const heroImageUrl = settingValue(s, 'home_hero_image_url', 'hero_image_url');
    const heroImageAlt = settingValue(s, 'home_hero_image_alt', 'hero_image_alt');
    document.querySelectorAll('[data-hana-hero-image]').forEach(x => {
      if (heroImageAlt && x.tagName === 'IMG') x.alt = heroImageAlt;
      if (!heroImageUrl) return;
      if (x.tagName === 'IMG') {
        x.addEventListener('error', () => x.removeAttribute('data-hana-hero-image-loading'), { once: true });
        x.src = heroImageUrl;
      } else {
        x.style.backgroundImage = `url("${heroImageUrl.replace(/["\\]/g, '\\$&')}")`;
      }
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
  const pinnedNewsTitles = new Set(['亞洲香氛藝術大賽教室預約']);
  const isPinnedNews = item => pinnedNewsTitles.has(String(item?.title || '').trim().replace(/\s*→\s*$/, ''));
  function sortNewsItems(a, b) {
    const pinnedRank = Number(isPinnedNews(b)) - Number(isPinnedNews(a));
    if (pinnedRank) return pinnedRank;
    const priorityRank = { high: 0, normal: 1, low: 2 };
    const left = new Date(a.news_date || a.starts_at || a.date || a.created_at || 0).getTime() || 0;
    const right = new Date(b.news_date || b.starts_at || b.date || b.created_at || 0).getTime() || 0;
    if (right !== left) return right - left;
    return (priorityRank[a.priority] ?? Number(a.priority ?? 100) ?? 100) - (priorityRank[b.priority] ?? Number(b.priority ?? 100) ?? 100);
  }
  function postsAsNews(posts = []) {
    return posts
      .filter(post => post?.title && post?.slug)
      .map(post => ({
        title: post.title,
        summary: post.summary || '最新氣味誌文章已發布。',
        category: '氣味誌',
        news_date: post.published_at,
        link_url: postUrl(post),
        link_label: '閱讀文章 →',
        priority: 90
      }));
  }
  function renderAnnouncements(items = [], settings = {}, posts = []) {
    document.querySelectorAll('[data-hana-announcements]').forEach(root => {
      root.hidden = settings.show_announcements === false;
      const list = root.querySelector('.news-list');
      if (!list) return;
      if (root.hidden) {
        list.innerHTML = '';
        return;
      }
      const blogNews = postsAsNews(posts);
      const source = items.length
        ? [...items].sort(sortNewsItems)
        : blogNews.length
          ? blogNews.sort(sortNewsItems)
          : defaultAnnouncements;
      const months = Number(root.dataset.hanaAnnouncementsMonths || 0);
      const cutoff = new Date();
      if (months > 0) cutoff.setMonth(cutoff.getMonth() - months);
      const filteredSource = months > 0
        ? source.filter(x => {
            const sourceDate = x.news_date || x.starts_at || x.date || x.created_at || '';
            const timestamp = new Date(sourceDate).getTime();
            return Number.isFinite(timestamp) && timestamp >= cutoff.getTime();
          })
        : source;
      const rows = filteredSource.slice(0, Number(root.dataset.hanaAnnouncementsLimit || 5)).map(x => {
        const sourceDate = x.news_date || x.starts_at || x.date || x.created_at || '';
        const dateLabel = sourceDate && !isNaN(new Date(sourceDate).getTime())
          ? new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(sourceDate)).replaceAll('/', '.')
          : '日期未定';
        const categoryLabels = { news:'最新消息', fragrance:'氣味發布', course:'調香課程' };
        const categoryLabel = categoryLabels[x.category] || x.category || '最新消息';
        const body = x.summary || x.content || '';
        const content = body ? `<p>${esc(body)}</p>` : '';
        const linkLabel = x.link_label || '了解更多 →';
        return `<article class="news-row" data-hana-announcement><div class="news-main"><div class="news-meta"><span class="news-category">${esc(categoryLabel)}</span><time class="news-date" datetime="${esc(sourceDate)}">${esc(dateLabel)}</time></div><h3>${esc(x.title)}</h3>${content}</div>${x.link_url ? `<a class="text-link" href="${esc(x.link_url)}">${esc(linkLabel)}</a>` : ''}</article>`;
      }).join('');
      list.innerHTML = rows || '<p class="news-empty">目前尚無最新消息。</p>';
      enhanceHomeNewsMarquee(root, list);
    });
  }
  function renderPosts(items, settings) {
    document.querySelectorAll('[data-hana-blog]').forEach(root => {
      const direction = root.dataset.hanaBlogDirection || '';
      const filtered = direction ? items.filter(post => directionFromBody(post.body) === direction) : items;
      const limit = Number(root.dataset.hanaBlogLimit || 0);
      const rows = limit > 0 ? filtered.slice(0, limit) : filtered;
      const allowEmpty = root.dataset.hanaAllowEmpty === 'true';
      root.hidden = !settings.show_blog || (!rows.length && !allowEmpty);
      if (!rows.length) {
        root.innerHTML = `<div class="hana-section-head"><h2>${esc(root.dataset.hanaBlogTitle || '氣味誌')}</h2></div><div class="empty">目前尚無文章。</div>`;
        return;
      }
      const heading = root.dataset.hanaBlogTitle || '氣味誌';
      const showDirection = root.dataset.hanaShowDirection === 'true';
      root.innerHTML = `<div class="hana-section-head"><h2>${esc(heading)}</h2></div><div class="hana-blog-grid">${rows.map((x) => {
        const directionKey = directionFromBody(x.body);
        const directionTag = showDirection ? `<a class="hana-direction" href="${esc(directionUrls[directionKey] || '/projects/')}">${esc(directionLabels[directionKey] || '嗅覺文化')}</a>` : '';
        const image = shouldShowCover(x) ? `<img src="${esc(x.cover_url)}" alt="" loading="lazy">` : '';
        return `<article class="hana-post">${image}${directionTag}<h3><a href="/blog.html?slug=${encodeURIComponent(x.slug)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><time datetime="${esc(x.published_at || '')}">${date(x.published_at)}</time><a class="text-link" href="/blog.html?slug=${encodeURIComponent(x.slug)}">繼續閱讀 →</a></article>`;
      }).join('')}</div>`;
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
      db.from('announcements').select('*').eq('status','published').order('starts_at',{ascending:false, nullsFirst:false}).order('created_at',{ascending:false}),
      db.from('posts').select('title,slug,summary,cover_url,published_at,body').eq('status','published').order('published_at',{ascending:false}),
      pageKey ? db.from('page_contents').select('field_key,content_type,value').eq('page_key', pageKey) : Promise.resolve({ data: [], error: null })
    ]);
    if (settings.error) throw settings.error; applySettings(settings.data || {});
    if (!pageContents.error) applyPageContents(pageContents.data || []);
    if (!announcements.error) renderAnnouncements(announcements.data || [], settings.data || {}, posts.error ? [] : posts.data || []);
    if (!posts.error) renderPosts(posts.data || [], settings.data || {});
    applySectionOrder(settings.data || {});
    document.dispatchEvent(new CustomEvent('hana:cms-ready', { detail: settings.data || {} }));
  }
  init().catch(error => console.error('[HANA CMS]', error));
})();