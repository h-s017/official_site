const CACHE_NAME = 'hana-student-organ-ifra-20261102';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './config.js',
  './formula.css?v=20261102',
  './formula-engine.js?v=20261102',
  './formula-ui.js?v=20261102',
  './safety-data.js?v=20261102'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('hana-student-organ-') && key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAppShell = url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/config.js') ||
    url.pathname.endsWith('/manifest.json') ||
    /\/(formula-engine|formula-ui|safety-data)\.js$/.test(url.pathname) ||
    url.pathname.endsWith('/formula.css');

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) throw new Error('App asset unavailable');
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response.ok) return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
