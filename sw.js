/**
 * @file sw.js
 * @description Hardened Transactional Service Worker for Zero-Telemetry Kids.
 *              Guarantees 100% of a new version's assets are downloaded and verified (HTTP 200)
 *              with cache-busting before replacing the existing stable offline version.
 */

const CACHE_NAME = 'zero-telemetry-kids-v4';

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
  './src/games/pasture-fence-hopper.js'
];

async function stageCompleteReleaseAtomically() {
  const verifiedPairs = [];

  try {
    for (let i = 0; i < PRECACHE_ASSETS.length; i++) {
      const url = PRECACHE_ASSETS[i];
      const req = new Request(url, { cache: 'reload' });
      const res = await fetch(req);

      if (!res || !res.ok || res.status !== 200) {
        throw new Error('Asset verification failed for: ' + url);
      }

      const bodyBuffer = await res.clone().arrayBuffer();
      if (bodyBuffer.byteLength === 0) {
        throw new Error('Empty payload received for: ' + url);
      }

      verifiedPairs.push({ url: url, response: res });
    }

    const cache = await caches.open(CACHE_NAME);
    for (let j = 0; j < verifiedPairs.length; j++) {
      await cache.put(verifiedPairs[j].url, verifiedPairs[j].response);
    }
  } catch (err) {
    await caches.delete(CACHE_NAME);
    throw err;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    stageCompleteReleaseAtomically().then(() => {
      return self.skipWaiting();
    })
  );
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isLocalhost =
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1';

  // Local development: Network-First so code edits show up immediately on refresh
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

  // Production (GitHub Pages / deaninno.com): Strict Cache-First for instant Airplane Mode
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});