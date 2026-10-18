// Offline support: the app shell is cached at install; pages are network-first so a new
// deploy shows up on the next visit; Google Fonts are cached after first use.
const CACHE = 'king-__BUILD__';
const FONTS = 'king-fonts';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('king-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      // Only the game page is stored as the offline fallback; other pages (privacy, 404s)
      // are cached under their own URL, and error responses are never cached.
      const base = new URL('./', self.registration.scope).pathname;
      const isGame = url.pathname === base || url.pathname === base + 'index.html';
      const key = isGame ? 'index.html' : req;
      e.respondWith(fetch(req)
        .then(res => {
          if (res.ok && res.type === 'basic') { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(key, copy))); }
          return res;
        })
        .catch(() => caches.match(key).then(hit => hit || (isGame ? Response.error() : caches.match('index.html').then(r => r || Response.error())))));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') e.waitUntil(c.put(req, res.clone()));
      return res;
    }))));
  }
});
