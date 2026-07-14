/* ذِكْرَى service worker — offline-first for a fast, ad-free, private experience */
const CACHE = 'dhikra-v6';
const CORE = [
  './',
  './index.html',
  './adhkar.html',
  './tasbih.html',
  './tools.html',
  './favourites.html',
  './blog.html',
  './about.html',
  './faq.html',
  './privacy.html',
  './contact.html',
  './asma-allah.html',
  './duas-quran.html',
  './duas-nabawiyah.html',
  './offline.html',
  './404.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/modern.js',
  './assets/js/assistant.js',
  './assets/js/index.json',
  './assets/img/logo.svg',
  './assets/img/logo-mark-white.png',
  './assets/img/hero.webp',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // don't cache cross-origin (fonts CDN etc.)

  // HTML: network-first (fresh content), fallback to cache
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./offline.html')))
    );
    return;
  }
  // Assets: cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => cached))
  );
});
