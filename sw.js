const CACHE_NAME = 'jimat-v2';
const ASSETS = [
  '/JimatPRO/',
  '/JimatPRO/index.html',
  '/JimatPRO/manifest.json',
  '/JimatPRO/icon.png',
  '/JimatPRO/icon-192.png',
  '/JimatPRO/icon-512.png',
  '/JimatPRO/halal-db.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Network first for API calls
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.frankfurter.app') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/JimatPRO/'));
    })
  );
});
