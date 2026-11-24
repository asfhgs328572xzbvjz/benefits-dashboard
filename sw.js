// Service worker for the public (static) dashboard.
// Network-first for everything: online you always get the latest published version; offline you get the last one cached.
// publish.ps1 rewrites CACHE with a timestamp on every publish, so old caches are dropped.
const CACHE = 'benefits-202611242205';
const SHELL = ['./', 'index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', e => {
  // cache: 'reload' bypasses the browser's HTTP cache so a new publish never re-caches stale files
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })            // revalidate with the server (cheap 304 when unchanged)
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
