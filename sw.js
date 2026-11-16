/**

 * @file sw.js

 * @description Hardened Service Worker (v9) for Zero-Telemetry Kids.

 *              Includes tractor-hill-hauler.js in PRECACHE_ASSETS, never caches 0-byte responses,

 *              and uses Network-First on all local dev addresses.

 */



const CACHE_NAME = 'zero-telemetry-kids-v9';



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

          fetch(new Request(url, { cache: 'reload' })).then(async (res) => {

            if (res && res.status === 200) {

              const buf = await res.clone().arrayBuffer();

              if (buf.byteLength > 0) {

                return cache.put(url, res);

              }

            }

          })

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



self.addEventListener('fetch', (event) => {

  if (event.request.method !== 'GET') return;



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

      fetch(new Request(event.request, { cache: 'no-store' }))

        .then(async (networkResponse) => {

          if (networkResponse && networkResponse.status === 200) {

            const buf = await networkResponse.clone().arrayBuffer();

            if (buf.byteLength > 0) {

              const clone = networkResponse.clone();

              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));

            }

          }

          return networkResponse;

        })

        .catch(() => caches.match(event.request, { ignoreSearch: true }))

    );

    return;

  }



  event.respondWith(

    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {

      if (cachedResponse) {

        return cachedResponse;

      }

      return fetch(event.request).then(async (networkResponse) => {

        if (networkResponse && networkResponse.status === 200) {

          const buf = await networkResponse.clone().arrayBuffer();

          if (buf.byteLength > 0) {

            const clone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));

          }

        }

        return networkResponse;

      });

    })

  );

});