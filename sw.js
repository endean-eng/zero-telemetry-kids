/**
 * @file sw.js
 * @description Service Worker guaranteeing 100% offline Airplane Mode execution in production,
 *              while using network-first on localhost so local edits appear immediately on refresh.
 */

const CACHE_NAME = 'zero-telemetry-kids-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/install-helper.js',
  './src/registry.js',
  './src/games/barn-shape-sort.js',
  './src/games/tractor-harvest-count.js',
  './src/games/phonics-bubble-pop.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((staleKey) => caches.delete(staleKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isLocalhost =
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1';

  // Local development: Network-First so code edits show up on normal browser refresh
  if (isLocalhost) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Production (GitHub Pages / deaninno.com): Cache-First for instant Airplane Mode
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});