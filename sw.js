const CACHE = 'stock-app-v38';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './xlsx.mini.min.js'];
const SLOW_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first so updates show up. When the network is slow (weak shop Wi-Fi) the saved copy is shown after SLOW_MS instead of a
// blank screen; the network answer still refreshes the cache for next time. Offline falls back to the cache straight away.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const cached = () => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
  e.respondWith(new Promise(resolve => {
    let done = false;
    const give = r => { if (!done) { done = true; resolve(r); } };
    const slow = setTimeout(() => cached().then(r => { if (r) give(r); }), SLOW_MS);
    fetch(req).then(r => {
      clearTimeout(slow);
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      give(r);
    }, () => { clearTimeout(slow); cached().then(r => give(r || Response.error()), () => give(Response.error())); });
  }));
});
