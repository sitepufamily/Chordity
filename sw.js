const CACHE = 'chordity-v28';
const ASSETS = ['./', 'index.html', 'style.css', 'app.js', 'library.js', 'pdf.js', 'sync.js', 'auth.js', 'effects.js', 'pwa.js', 'config.js', 'manifest.webmanifest', 'bg.jpg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Halaman: jaringan dulu supaya update langsung terlihat, cache saat offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }
  // Kode & tampilan (js/css/html): jaringan dulu supaya semua perangkat selalu memakai versi terbaru, cache saat offline
  if (url.origin === location.origin && /\.(js|css|html|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  // Gambar & ikon: tampilkan dari cache, perbarui di belakang layar
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }
  // Font dan library dari CDN: cache dulu, simpan saat pertama diambil
  if (['googleapis.com', 'gstatic.com', 'jsdelivr.net'].some(h => url.hostname.endsWith(h))) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit))
    );
  }
});
