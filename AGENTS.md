# `zero-telemetry-kids` — Agentic Engineering & Human-Factors Governance (`AGENTS.md`)

This repository is governed by strict architectural, security, and human-factors invariants. Every coding agent, auditing pipeline, and contributor operating in `endean-eng/zero-telemetry-kids` MUST enforce the rules below without exception.

---

## 1. Zero-Telemetry & Air-Gapped Security Invariants

1. **Strict Content Security Policy (CSP):**
   * The application operates under a locked, air-gapped CSP header defined in `index.html`:
     ```html
     default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';
     ```
   * **DO NOT** introduce external font CDNs (e.g., Google Fonts), external stylesheets, analytics scripts, telemetry beacons, or remote API calls.
2. **Zero External Dependencies:**
   * Write 100% vanilla ES6+ JavaScript Modules (`type="module"`), native HTML5, and inline SVG.
   * **DO NOT** introduce `package.json`, `node_modules`, bundlers (Webpack/Vite/Rollup), or third-party runtime frameworks (React/Vue/Phaser/PixiJS).
3. **100% Offline Execution (Cache-First Service Worker):**
   * Every new mini-game module added to `src/games/<game-slug>.js` MUST be registered in both `src/registry.js` and the `PRECACHE_ASSETS` array in `sw.js` so the application functions in Airplane Mode after initial load.

---

## 2. Procedural Vector & Zero-MP3 Audio Architecture

1. **Procedural Inline SVGs Only (`Zero Raster Bloat`):**
   * Render all game sprites, backgrounds, UI icons, and interactive pieces using scalable inline `<svg>` markup (`viewBox` coordinate systems).
   * **DO NOT** reference external `.png`, `.jpg`, or `.webp` raster files.
2. **Synthesized Web Audio & Native Speech Only (`Zero Audio Bloat`):**
   * **Tactile Sound Effects:** All chimes, reward chords, and gentle bounce-back thuds MUST use the `audioApi` (`AudioSynth` instance passed into `mount()`) powered by native `AudioContext` oscillators. **DO NOT** bundle or fetch `.mp3`, `.wav`, or `.ogg` files.
   * **Spoken Prompts:** All voice instructions MUST use the `speechApi` (`VoicePrompt` instance passed into `mount()`) wrapping `window.speechSynthesis` with playback rate clamped to `[0.85, 0.90]` for 3-to-4-year-old comprehension.

---

## 3. Preschool Motor & Cognitive Ergonomics (Ages 3–4 Guardrails)

1. **Oversized Touch Targets ($\ge 96 \times 96\text{ CSS px}$):**
   * Every interactive button, draggable piece, or tap target MUST have an effective bounding-box hitbox of at least `96px` by `96px`.
2. **Magnetic Drop-Target Snap Radius ($+24\text{ px}$):**
   * Drag-and-drop receptacle targets MUST evaluate Euclidean distance from the dragged item's center to the target's center and snap-accept drops within `targetRadius + 24` CSS pixels.
3. **Independent `pointerId` Multi-Touch Debouncing (Palm-Rest Forgiveness):**
   * 3-to-4-year-olds routinely rest a thumb or palm on the screen bezel while dragging with their index finger.
   * **NEVER** use legacy mouse/touch events that abort drags when a second touch occurs. Always lock onto the initial active `event.pointerId` on `pointerdown` and ignore secondary `pointerId` events until the active pointer is released (`pointerup` / `pointercancel`).
4. **Zero Failure Punishment & Zero Dark Patterns:**
   * **NO** countdown timers, **NO** fail states or "Game Over" screens, **NO** harsh error buzzers, and **NO** points/coin stores.
   * Incorrect drops MUST gently animate back to their home staging coordinates accompanied by a soft, non-punitive low-frequency thud (`audioApi.playGentleThud()`).
5. **Dual-Corner Parent Gate ($2.0\text{ Seconds}$):**
   * Navigating back to the main launcher or opening parent controls from inside an active game requires holding both the top-left and top-right corner zones simultaneously for `2000ms` (managed automatically by the shell's `ParentGate` service).

---

## 4. Epistemic Synchronization (`TOKENME.txt`)

* Whenever files are created, modified, or deleted, execute `python3 tokenme-sync.py` to synchronize structural line coordinates and Merkle `STATE_ROOT` hashes, and hydrate any `[AGENT_POPULATE_SYMBOLS]` markers before committing.
