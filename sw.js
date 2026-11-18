/**
 * @file sw.js
 * @description Hardened Service Worker (v15) for Zero-Telemetry Kids.
 *              Enforces 100% offline cache-first execution in production while preventing zero-byte cache poisoning.
 */

const CACHE_NAME = 'zero-telemetry-kids-v15';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/install-helper.js',
  './src/registry.js',
  './src/games/barn-shape-sort.js',
  './src/games/tractor-harvest-count.js',
  './src/games/phonics-bubble-pop.js',
  './src/games/pasture-fence-hopper.js',
  './src/games/hay-bale-bounce.js',
  './src/games/sprinkler-sprout-defense.js',
  './src/games/tractor-hill-hauler.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((url) =>
          fetch(new Request(url, { cache: 'reload' }))
            .then(async (res) => {
              if (res && res.status === 200) {
                const buf = await res.clone().arrayBuffer();
                if (buf.byteLength > 0) {
                  return cache.put(url, res);
                }
              }
            })
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Validates that a network HTTP 200 response contains a non-empty payload before storing it in CacheStorage.
 * Prevents transient dev-server or interrupted network responses from poisoning the offline PWA cache with 0-byte files.
 * @param {Request} request Normalized fetch Request key.
 * @param {Response} networkResponse Fresh network Response to validate and clone.
 * @returns {Promise<Response>} Original networkResponse passed through for immediate client consumption.
 */
async function cacheNetworkResponse(request, networkResponse) {
  if (networkResponse && networkResponse.status === 200) {
    const buf = await networkResponse.clone().arrayBuffer();
    if (buf.byteLength > 0) {
      const clone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
  }
  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let request = event.request;
  const url = new URL(request.url);

  // Normalize directory trailing slashes to load index.html cleanly
  if (url.pathname.endsWith('/')) {
    const targetUrl = url.origin + url.pathname + 'index.html';
    request = new Request(targetUrl, {
      method: event.request.method,
      headers: event.request.headers,
      mode: event.request.mode,
      credentials: event.request.credentials,
      redirect: event.request.redirect
    });
  }

  const host = self.location.hostname;
  const isLocalDev =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1' ||
    host.indexOf('192.168.') === 0 ||
    host.indexOf('10.') === 0;

  if (isLocalDev) {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .then((networkResponse) => cacheNetworkResponse(request, networkResponse))
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) =>
        cacheNetworkResponse(request, networkResponse)
      );
    })
  );
});