const CACHE_NAME = 'kabu-watch-ai-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback (開発中のJS不整合や404を防止)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Next.jsのHMRやAPI、静的チャンクは直接ネットワークから取得
  if (
    event.request.url.includes('/_next/') || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('webpack-hmr')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
