const CACHE_NAME = 'jona-franco-pwa-v11';

// Archivos esenciales (rutas relativas: funciona en la raíz o en una subcarpeta)
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './supabase-config.js',
  './supabase-client.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './img/hero-1.jpeg',
  './img/hero-2.jpeg',
  './img/hero-3.jpeg',
  './img/joase.png',
  './img/luis.jpg',
  './img/sinatra.jpg',
  './img/bruno.jpg',
  './img/michael.jpg',
  './img/weekend.jpg',
  './img/mora.jpg',
  './img/yan.jpg',
  './img/badBunny.jpg',
  './img/josean.jpg',
  './img/kevin.jpg',
  './img/ed.jpg',
  './img/queen.jpg',
  './img/soda.jpg',
  './img/a_ha.jpg',
  './img/FORTNITE.jpg',
  './img/MOBIL.jpg',
  './img/mine.jpg',
  './img/roblox.jpg',
  './img/shooter.webp',
  './img/warzone.jpg'
];

// Instalación: precarga de recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: elimina cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estrategia: caché primero; si no está, red y se guarda (incluye CDN de Bootstrap/FontAwesome)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Supabase: red primero (datos frescos); solo se usa caché si no hay conexión
  if (req.url.indexOf('.supabase.co') !== -1) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          // Solo guardamos respuestas válidas (o de CDN "opaque")
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Sin conexión y sin caché: si es una navegación, devolver la página principal
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});


// Hidratación del PWA: la página pregunta por la versión activa y el SW responde
self.addEventListener('message', event => {
  if (event.data === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'SW_VERSION', cache: CACHE_NAME });
  }
});
