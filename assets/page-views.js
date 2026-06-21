(() => {
  'use strict';

  const cfg = window.HANA_CMS_CONFIG || {
    supabaseUrl: 'https://uzqaodfmnrjrsbvxhlmh.supabase.co',
    supabaseAnonKey: 'sb_publishable_3ukkjs-QtgauXjmOrcDAVg_XBWzh2rd'
  };

  if (navigator.doNotTrack === '1') return;
  if (location.pathname.startsWith('/admin')) return;

  const ANALYTICS_TABLE = 'analytics_events';
  const LEGACY_PAGE_VIEWS_TABLE = 'page_views';
  const SESSION_KEY = 'hana_analytics_session_id';
  const SOURCE_KEY = 'hana_analytics_source';

  const load = src => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (crypto?.randomUUID?.() || `hana-${Date.now()}-${Math.random().toString(16).slice(2)}`);
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {
      return `hana-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }

  function sourceFromUrl() {
    const params = new URLSearchParams(location.search);
    const raw = `${params.get('utm_source') || ''} ${params.get('source') || ''} ${params.get('ref') || ''}`.toLowerCase();
    const ref = (document.referrer || '').toLowerCase();
    const haystack = `${raw} ${ref}`;

    if (/instagram|ig|l\.instagram/.test(haystack)) return 'Instagram';
    if (/line|lin\.ee|liff/.test(haystack)) return 'LINE';
    if (/google|gclid/.test(haystack)) return 'Google';
    if (!ref && !raw) return 'Direct';
    if (ref.includes(location.hostname)) {
      try { return localStorage.getItem(SOURCE_KEY) || 'Direct'; } catch (_) { return 'Direct'; }
    }
    return 'Other';
  }

  const source = sourceFromUrl();
  try { localStorage.setItem(SOURCE_KEY, source); } catch (_) {}

  function pageName() {
    const path = location.pathname.replace(/\/+$/, '/') || '/';
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    if (path.includes('/helori/') || path.includes('helori-scent-lab')) return 'helori_course';
    if (path.includes('/courses/') || path.includes('experiences.html') || path.includes('/overture/')) return 'course_page';
    if (path.includes('blog.html')) return 'blog';
    if (path.includes('projects')) return 'journal';
    return 'page';
  }

  function legacyPageType(page) {
    if (page === 'home') return 'home';
    if (page === 'helori_course') return 'helori';
    if (page === 'course_page') return 'course';
    if (page === 'blog') return 'blog';
    if (page === 'journal') return 'journal';
    return 'page';
  }

  function cleanPath() {
    const allowed = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'source', 'ref']);
    const params = new URLSearchParams(location.search);
    const kept = new URLSearchParams();
    allowed.forEach(key => {
      const value = params.get(key);
      if (value) kept.set(key, value);
    });
    const query = kept.toString();
    return `${location.pathname}${query ? `?${query}` : ''}`.slice(0, 500);
  }

  let db = null;
  async function getDb() {
    if (db) return db;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if (!window.supabase) return null;
    db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return db;
  }

  async function insertEvent(payload) {
    try {
      const client = await getDb();
      if (!client) return;
      const page = payload.page || pageName();
      const event = {
        created_at: new Date().toISOString(),
        page,
        event_type: payload.event_type || 'view',
        source,
        result_type: payload.result_type || null,
        session_id: sessionId(),
        path: cleanPath(),
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 500) : null,
        metadata: payload.metadata || {}
      };
      const { error } = await client.from(ANALYTICS_TABLE).insert(event);
      if (error) throw error;
    } catch (error) {
      console.warn('[HANA analytics]', error?.message || error);
    }
  }

  async function insertLegacyPageView() {
    try {
      const client = await getDb();
      if (!client) return;
      const page = pageName();
      await client.from(LEGACY_PAGE_VIEWS_TABLE).insert({
        path: cleanPath(),
        page_type: legacyPageType(page),
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 500) : null
      });
    } catch (error) {
      console.warn('[HANA page views]', error?.message || error);
    }
  }

  function classifyClick(anchor) {
    const href = anchor.getAttribute('href') || '';
    const text = (anchor.textContent || '').trim();
    const currentPage = pageName();

    if (currentPage === 'home' && /helori/i.test(href + text)) return { page: 'home', event_type: 'click_helori' };
    if (currentPage === 'home' && (/courses|experiences|overture/i.test(href) || text.includes('課程'))) return { page: 'home', event_type: 'click_course' };

    if (currentPage === 'helori_course') {
      if (/h-s017\.github\.io\/heloribyhana|findyourhelori/i.test(href)) return { page: 'helori_course', event_type: 'click_quiz' };
      if (/lin\.ee|line\.me/i.test(href)) return { page: 'helori_course', event_type: 'click_line' };
      if (/reservation\.hanascent\.com/i.test(href)) return { page: 'helori_course', event_type: 'click_booking' };
    }

    if (currentPage === 'course_page') {
      if (/reservation\.hanascent\.com/i.test(href)) return { page: 'course_page', event_type: 'click_booking' };
      if (/lin\.ee|line\.me/i.test(href)) return { page: 'course_page', event_type: 'click_line' };
    }

    return null;
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const payload = classifyClick(anchor);
    if (payload) insertEvent(payload);
  }, { capture: true });

  const trackView = () => {
    insertEvent({ event_type: 'view' });
    insertLegacyPageView();
  };

  if ('requestIdleCallback' in window) requestIdleCallback(trackView, { timeout: 2500 });
  else window.setTimeout(trackView, 1200);
})();
