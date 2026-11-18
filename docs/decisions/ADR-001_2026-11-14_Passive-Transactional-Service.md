# ADR-001: Passive Execution Posture and Transactional Service Worker Cache Updates

* **Status:** Proposed
* **Date:** 2026-11-14
* **Author:** Elijah N. Dean, BSME (`endean-eng` / Dean Innovative Design LLC)
* **Target Specification:** `zero-telemetry-kids` v1.0 PWA Engine (`sw.js`, `src/app.js`, `TOKENME.txt` Integration)
* **Supersedes / Refines:** None (Foundational)

---

## 1. Context & Problem Statement

An offline-first Progressive Web App (PWA) designed for 3-to-4-year-olds (`endean-eng/zero-telemetry-kids`) must maintain an unbreakable offline execution guarantee once installed to a tablet's Home Screen while strictly honoring a zero-telemetry, zero-background-activity posture.

Standard browser Service Worker (`sw.js`) and `CacheStorage` implementations exhibit four structural failure modes under intermittent residential or mobile Wi-Fi conditions:

1. **Mid-Stream Network Drop & Partial Payload Corruption:** In the standard Fetch API specification, `fetch(request)` resolves its Promise as soon as the HTTP response headers (`200 OK`) arrive from the server—before the response body stream finishes transferring. If a tablet loses Wi-Fi connectivity halfway through streaming a JavaScript module during `cache.addAll()`, a naive Service Worker can pipe a truncated stream or fail without deterministic staging cleanup.
2. **HTTP Disk Cache Poisoning ("Frankenstein" Releases):** Calling `cache.addAll(PRECACHE_ASSETS)` with default request parameters allows the browser to satisfy some asset requests from its transient HTTP disk cache while pulling others from the network. Immediately following a deployment, this produces mixed-version asset buckets where an updated `src/app.js` shell attempts to invoke a stale cached mini-game module.
3. **Unattended Background Wake & Polling Hazards:** Many PWA templates register Periodic Background Sync (`periodicSync`), Push API listeners, or `setInterval(() => registration.update(), ...)` timers to poll for updates every 24 hours. Any background network activity when the application is not actively in use violates the system's strict passive-unless-interacted-with invariant.
4. **Silent Sub-Resource Staleness:** Browsers only trigger a Service Worker `install` lifecycle when the byte payload of `./sw.js` itself changes. Modifying a downstream ES6 module (e.g., `src/games/tractor-harvest-count.js`) without mutating `./sw.js` results in installed clients never detecting or downloading the updated game logic.

---

## 2. Decision & Governing Mechanics

We enforce a **Strictly Passive, RAM-Verified Transactional Service Worker Architecture** governed by four mechanical invariants across `src/app.js`, `sw.js`, and the `TOKENME.txt` synchronization pipeline:

### 2.1 Strictly Passive Execution Posture (Zero Background Polling)

* The application registers **zero** `periodicSync`, `sync`, `push`, or timer-driven `registration.update()` hooks. When closed or sitting idle on a device Home Screen, the application remains 100% inert.
* Service Worker registration in `src/app.js` executes strictly once per active user launch on the `window` `load` event with `{ updateViaCache: 'none' }`:

```javascript
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js', { updateViaCache: 'none' })
          .catch(() => {});
      });
    }
  }
```

### 2.2 Two-Phase In-Memory Asset Verification (`stageCompleteReleaseAtomically`)

Instead of delegating pre-caching to bare `cache.addAll()`, `sw.js` executes a strict two-phase in-memory verification transaction during the `install` event:

1. **Phase 1 — Cache-Busted Fetch & Full-Body RAM Materialization:** Iterates sequentially through `PRECACHE_ASSETS`, issuing `new Request(url, { cache: 'reload' })` to bypass the browser's HTTP disk cache. Each response must satisfy `res.ok && res.status === 200` and materialize its complete payload into an in-memory buffer via `await res.clone().arrayBuffer()` with `bodyBuffer.byteLength > 0`.
2. **Phase 2 — Atomic Bucket Commit or Rollback:** Only after 100% of assets in `PRECACHE_ASSETS` have been verified in RAM does `sw.js` open the new `CACHE_NAME` bucket in `CacheStorage` and commit the verified `Request`/`Response` pairs. If Wi-Fi drops at any byte prior to completion, the `catch` block executes `await caches.delete(CACHE_NAME)` and re-throws the error, forcing the browser to abort the new Service Worker installation and leave the prior offline-ready version untouched.

$$\text{CommitAllowed} \iff \forall u_i \in \text{PRECACHE\_ASSETS}: \left(\text{Status}(u_i) = 200\right) \land \left(\left\|\text{ArrayBuffer}(u_i)\right\|_{\text{bytes}} > 0\right)$$

```mermaid
%%{init: {'theme': 'base', 'flowchart': {'wrappingWidth': 380, 'nodeSpacing': 40, 'rankSpacing': 45, 'curve': 'basis'}, 'themeVariables': { 'primaryColor': '#1e293b', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#64748b', 'lineColor': '#94a3b8', 'edgeLabelBackground': '#1e293b', 'fontFamily': 'Consolas, monospace', 'fontSize': '16px'}}}%%
flowchart TB
    Start(["💡 User Actively Launches Installed PWA"])

    subgraph Tier1["Tier 1: Passive Launch Check (src/app.js)"]
        DecNet{"Device Online &<br/>sw.js Byte-Diff Detected?"}
        ServeExisting["Serve Existing Verified Cache_vN<br/>(Zero Network Dependency)"]
    end

    subgraph Tier2["Tier 2: In-Memory Verification Staging (sw.js install)"]
        FetchLoop["Fetch Each Asset in PRECACHE_ASSETS<br/>with Request(url, { cache: 'reload' })"]
        DecVerify{"All Assets HTTP 200 &<br/>arrayBuffer().byteLength > 0?"}
        Rollback["Delete Partial Staging Bucket<br/>& Reject Install Promise"]
    end

    subgraph Tier3["Tier 3: Atomic Cache Cutover (sw.js activate)"]
        Commit["Open Cache_v(N+1) & Write Verified Blobs<br/>from RAM in Milliseconds"]
        PurgeOld["Delete Stale Cache_vN Bucket<br/>& Claim Active Client"]
        Done(["🚀 Stable Offline Release Active<br/>(Zero Partial-State Exposure)"])
        Abort(["🛡️ Update Aborted Cleanly -> Retain Existing Cache_vN"])
    end

    %% Lock Tier 1 -> Tier 2 -> Tier 3 Top-to-Bottom Hierarchy
    ServeExisting ~~~ FetchLoop
    Rollback ~~~ Commit & PurgeOld

    Start --> DecNet
    DecNet -- "NO (Offline or Identical)" ==> ServeExisting
    DecNet -- "YES (New Release on Server)" --> FetchLoop
    ServeExisting ==> Done

    FetchLoop --> DecVerify
    DecVerify -- "FAIL (Wi-Fi Drop / Truncated Stream)" --> Rollback
    DecVerify -- "PASS (100% Materialized in RAM)" ==> Commit
    Rollback ==> Abort
    Commit ==> PurgeOld
    PurgeOld ==> Done

    style DecNet fill:#2e2310,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style DecVerify fill:#2e2310,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style Done fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ecfdf5
    style Abort fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#eff6ff
```

### 2.3 Deterministic Cache Versioning via `TOKENME.txt` Merkle `STATE_ROOT`

To eliminate manual version bumping and guarantee that every code or SVG modification triggers an atomic client update on next online launch, `CACHE_NAME` in `sw.js` will bind to the repository's `TOKENME.txt` Merkle `STATE_ROOT` digest (`const CACHE_NAME = 'ztk-' + STATE_ROOT_SHORT`). Any mutation to any tracked file in `endean-eng/zero-telemetry-kids` alters `STATE_ROOT`, mutating `sw.js` by at least 8 bytes during `python3 tokenme-sync.py` and triggering the transactional staging loop upon next online launch.

### 2.4 Environment-Aware Fetch Routing (`localhost` vs. Production)

* **Production Origins (`kids.deaninno.com`, GitHub Pages):** Enforce strict **Cache-First** resolution (`caches.match(event.request, { ignoreSearch: true })`) so the application executes with zero network latency and 100% reliability in Airplane Mode.
* **Local Development Origins (`localhost`, `127.0.0.1`):** Enforce **Network-First** resolution with cache fallback so iterative engineering changes in VS Code render immediately upon standard browser refresh (`Ctrl + R`) without requiring manual Service Worker unregistration.

### 2.5 Reference Implementation (`sw.js`)

```javascript
/**
 * @file sw.js
 * @description Hardened Transactional Service Worker for Zero-Telemetry Kids.
 *              Guarantees 100% of a new version's assets are downloaded and verified (HTTP 200)
 *              with cache-busting before replacing the existing stable offline version.
 */

const CACHE_NAME = 'zero-telemetry-kids-v3';

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

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
```

---

## 3. Rejected Alternatives & Technical Postmortems (DO NOT RE-IMPLEMENT)

* **Rejected Option 1 (Periodic Background Polling / 24-Hour Update Daemons):** Allowing background wake triggers (`periodicSync` or timer-based `registration.update()` calls) violates the core architectural guarantee that an idle tablet application produces zero network packets and consumes zero background battery or compute.
* **Rejected Option 2 (Default `cache.addAll(PRECACHE_ASSETS)` Without Stream Verification):** `cache.addAll()` does not enforce `cache: 'reload'` by default and does not explicitly materialize full `ArrayBuffer` payloads in RAM prior to opening the target `CacheStorage` bucket, exposing clients on marginal rural/mobile Wi-Fi connections to HTTP disk-cache version mixing and stream truncation.
* **Rejected Option 3 (Cache-First Routing on `localhost`):** Enforcing Cache-First on `localhost` during initial prototyping caused edited ES6 modules (`src/app.js`, `src/games/tractor-harvest-count.js`) to remain masked behind the `v1` Service Worker cache until `CACHE_NAME` was manually incremented.

---

## 4. Consequences & Engineering Trade-Offs

* **RAM Overhead During Update Staging:** Materializing `res.clone().arrayBuffer()` for every asset in `PRECACHE_ASSETS` holds the full release payload in volatile memory during the `install` phase before writing to disk. Because the architecture strictly bans raster images (`.png`/`.jpg`) and audio binaries (`.mp3`/`.wav`) in favor of procedural inline SVGs and Web Audio synthesis (`AGENTS.md`), the entire repository runtime footprint remains $< 250\text{ KB}$—making in-memory staging instantaneous ($< 5\text{ MB}$ peak heap) even on budget tablets with $50+$ mini-game modules.
* **Mandatory `PRECACHE_ASSETS` & `STATE_ROOT` Discipline:** Every new mini-game added to `src/games/<game-slug>.js` must be appended to `PRECACHE_ASSETS` in `sw.js`, and `CACHE_NAME` must be updated via the `TOKENME` synchronization step prior to deployment so installed clients atomically stage the new module upon their next online launch.