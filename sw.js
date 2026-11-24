// BloodHub PWA Service Worker - v1.0.0
const CACHE_NAME = 'bloodhub-pwa-v1';

// Essential assets to precache for offline availability
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  console.log('[BloodHub SW] Installing service worker and precaching assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[BloodHub SW] Failed to precache asset:', url, err);
          })
        )
      );
    }).then(() => {
      console.log('[BloodHub SW] Precaching completed. Activating immediately.');
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up legacy caches and take control
self.addEventListener('activate', (event) => {
  console.log('[BloodHub SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[BloodHub SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[BloodHub SW] Claiming clients for instant offline control.');
      return self.clients.claim();
    })
  );
});

// Fetch Event: Network-First for HTML navigation, Stale-While-Revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. HTML Page Navigation: Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[BloodHub SW] Navigation offline. Serving cached index.html for:', request.url);
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;

          return new Response(
            `<!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>BloodHub - অফলাইন মোড</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px 20px; background: #fff5f5; color: #333; }
                h1 { color: #e63946; }
                p { font-size: 16px; line-height: 1.6; }
                button { background: #e63946; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <h1>BloodHub অফলাইন</h1>
              <p>বর্তমানে ইন্টারনেট সংযোগ নেই। অ্যাপটি পূর্বে লোড করা থাকলে পুনরায় লোড করুন।</p>
              <button onclick="window.location.reload()">পুনরায় চেষ্টা করুন</button>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, JSON): Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetchPromise.then((networkResponse) => {
        if (networkResponse) return networkResponse;
        if (request.destination === 'image') {
          return caches.match('/icon.svg');
        }
        return new Response('Offline asset unavailable', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
