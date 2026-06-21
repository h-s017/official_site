(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {
    supabaseUrl: 'https://uzqaodfmnrjrsbvxhlmh.supabase.co',
    supabaseAnonKey: 'sb_publishable_3ukkjs-QtgauXjmOrcDAVg_XBWzh2rd'
  };
  if (navigator.doNotTrack === '1') return;
  if (location.pathname.startsWith('/admin')) return;
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
  const pageType = () => {
    const path = location.pathname;
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    if (path.includes('blog.html')) return 'blog';
    if (path.includes('courses') || path.includes('overture')) return 'course';
    if (path.includes('helori')) return 'helori';
    if (path.includes('projects')) return 'journal';
    return 'page';
  };
  async function track() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
    try {
      await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      if (!window.supabase) return;
      const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const path = `${location.pathname}${location.search || ''}`.slice(0, 500);
      await db.from('page_views').insert({
        path,
        page_type: pageType(),
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 500) : null
      });
    } catch (error) {
      console.warn('[HANA page views]', error?.message || error);
    }
  }
  if ('requestIdleCallback' in window) requestIdleCallback(track, { timeout: 2500 });
  else window.setTimeout(track, 1200);
})();