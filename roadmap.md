# `zero-telemetry-kids` — Implementation Roadmap & Pedagogical Queue

> **Status:** Active Repository Initialization  
> **Target Budget:** $2.3\text{ hrs}$ Human Time / $1.6\text{ hrs}$ Agent Time ($\approx \$140\text{ EV cost at } C_{\text{opp}} = \$60/\text{hr}$)  
> **Canonical Repo:** `endean-eng/zero-telemetry-kids`  
> **Parent Mirror:** `deaninno.com/kids`

---

## Phase 1: Repository & Context Triad Scaffolding (`15m Human` / `5m Agent`)
- [x] **1.1** Decide on canonical repository slug (`endean-eng/zero-telemetry-kids`).
- [x] **1.2** Generate initial Two-Tier `README.md`, dual MIT/CC-BY 4.0 `LICENSE.md`, and `To Do.md`.
- [ ] **1.3** Author root `AGENTS.md` enforcing:
  - Strict air-gapped Content Security Policy (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';`).
  - Zero external `npm` dependencies, font CDNs, or telemetry SDKs.
  - Procedural inline `<svg>` rendering and zero-MP3 audio (`window.speechSynthesis` at $0.85\text{–}0.90\times$ rate + `AudioContext` pentatonic oscillator chords).
  - Motor-ergonomic guardrails: $\ge 96 \times 96\text{ CSS px}$ touch targets, $+24\text{ px}$ magnetic snap radius, independent `pointerId` palm-rest debouncing, zero failure timers/buzzers, and the $2.0\text{-second}$ Dual-Corner Parent Gate.
- [ ] **1.4** Request Mode 1 Roo Inbox Active Brief (`/dev-archivist`) to generate `.roo/inbox/active-brief.md` for Argon/Carbon.
- [ ] **1.5** Execute `python3 tokenme-sync.py --init` to establish the root `TOKENME.txt` v2.1 index.

---

## Phase 2: PWA Shell, Audio Synth, & Offline Cache (`20m Human` / `20m Agent`)
- [ ] **2.1** Build `index.html` with locked `<meta http-equiv="Content-Security-Policy">`, responsive landscape viewport lock, and game launcher grid.
- [ ] **2.2** Build `manifest.json` configured with `"display": "standalone"` and `"orientation": "landscape"`.
- [ ] **2.3** Build `sw.js` cache-first Service Worker that pre-caches $100\%$ of HTML, JS, and SVG assets in `CacheStorage` for instant Airplane Mode execution.
- [ ] **2.4** Implement `src/app.js` core services:
  - `AudioSynth`: Web Audio API pentatonic marimba/chime reward chords and gentle low-frequency miss thuds.
  - `VoicePrompt`: Offline `window.speechSynthesis` wrapper with rate clamped to $0.85\text{–}0.90\times$.
  - `ParentGate`: Simultaneous top-left + top-right corner hold detector ($2.0\text{ seconds}$) to unlock parent settings and exits.
  - `PointerManager`: Multi-touch debouncer that isolates active drag `pointerId` from palm/thumb bezel resting.
- [ ] **2.5** Implement `src/install-helper.js` smart OS-aware onboarding bar (hidden when `display-mode: standalone` matches):
  - **Android (Chrome/Edge/Samsung):** Intercept `beforeinstallprompt` for a 1-tap **`[📲 Tap Here to Install App for Offline Play]`** button.
  - **iPadOS / iOS (Safari):** Detect `/iPad|iPhone|iPod/` (and `navigator.maxTouchPoints > 1`) to render the visual **Share `[⍐]` $\rightarrow$ Add to Home Screen `[➕]`** callout.

---

## Phase 3: Initial 3 Launch Mini-Game Modules (`45m Human` / `45m Agent`)
- [ ] **3.1** Create `src/registry.js` and enforce the standardized ES6 module contract (`mount(containerEl, audioApi, speechApi)`, `unmount()`).
- [ ] **3.2** **Launch Module 1 (`src/games/barn-shape-sort.js`):** *Shape & Color Barn Sort* — Dragging high-contrast geometric shapes and farm produce into matching barn doors ($96\text{ px}$ hitboxes, $+24\text{ px}$ magnetic snap).
- [ ] **3.3** **Launch Module 2 (`src/games/tractor-harvest-count.js`):** *Tractor Harvest Counting ($1\text{–}10$)* — One-to-one correspondence counting by loading harvests into numbered grain wagons with spoken count feedback on each drop.
- [ ] **3.4** **Launch Module 3 (`src/games/phonics-bubble-pop.js`):** *Letter & Phonics Bubble Pop* — Oversized floating letters and phonetic voice prompts for stress-free tap recognition.

---

## Phase 4: `deaninno.com/kids` Parent Portal & Backlog Intake (`45m Human` / `15m Agent`)
- [ ] **4.1** Configure static submodule or automated build mirror from `endean-eng/zero-telemetry-kids` to `deaninno.com/kids`.
- [ ] **4.2** Build the parent-facing landing section with clear "Why" messaging (*100% Free, Zero Ads, Works Offline on Flights & Road Trips*) and visual install steps.
- [ ] **4.3** Wire up the serverless 3-field **"Parent Idea $\rightarrow$ Agent Prompt"** form (via Cloudflare Pages Functions, Web3Forms, or Formspree with honeypot anti-spam):
  1. **Child's Age Bracket:** `[ 2–3 yrs | 3–4 yrs | 4–5 yrs ]`
  2. **Target Skill or Theme:** *(Free text)*
  3. **What frustrates you or your child in existing apps that try to teach this?** *(Free text)*

---

## Phase 5: Epistemic Sync, Verification, & Dual-Track Launch (`15m Human` / `10m Agent`)
- [ ] **5.1** Execute `python3 tokenme-sync.py` to index all `DOMAIN_CODE` ES6 modules and `OPAQUE_ASSET` SVGs.
- [ ] **5.2** Hydrate all `[AGENT_POPULATE_SYMBOLS]` slots in `TOKENME.txt` and verify zero drift via `python3 tokenme-sync.py --check`.
- [ ] **5.3** Enable GitHub Pages deployment and verify Airplane Mode standalone execution on physical Android and iPad tablets.
- [ ] **5.4** Run `/comms-craft` to generate the bifurcated launch posts:
  - **Parenting / Community Channels:** Warm utility announcement highlighting `deaninno.com/kids` and the parent game-request form.
  - **LinkedIn / Engineering Feed:** Systems engineering teardown on Google Play unit economics, zero-telemetry CSP invariants, and `TOKENME` v2.1 agentic compilation velocity.

---

## Phase 6: "Montessori-in-a-Notebook" Foundry & Expansion Queue (Spare Token Sink)

To compile additional clean-room modules using expiring monthly compute quota with zero third-party IP contamination, initialize a dedicated Gemini Notebook with four pinned specification files:

- [ ] **6.1** Generate Pinned File 1: `1_AGENTS.md` (Hard architectural, CSP, and 3-year-old ergonomic guardrails).
- [ ] **6.2** Generate Pinned File 2: `2_ENGINE_CONTRACT.md` (Plug-and-play ES6 `GameModule` lifecycle interface).
- [ ] **6.3** Generate Pinned File 3: `3_VISUAL_PRIMITIVES.md` (Reusable parametric inline SVG library: Red Barn, Green Tractor, Grain Bin, Excavator, Geometric Shapes, Friendly Animals).
- [ ] **6.4** Generate Pinned File 4: `4_MONTESSORI_QUEUE.md` (Public-domain Montessori Sensorial & Practical Life seed specifications):
  - [ ] **M-01 (`src/games/silo-cylinder-fit.js`):** *Knobbed Cylinders Adaptation* — Visual discrimination of diameter/height by fitting 4 differently sized grain bins or machinery pins into matching cutouts.
  - [ ] **M-02 (`src/games/barn-color-tablets.js`):** *Color Tablets (Box 1 & 2) Adaptation* — Chromatic pairing of primary and secondary colored tractors/harvests into matching barn stalls.
  - [ ] **M-03 (`src/games/hay-bale-seriation.js`):** *Pink Tower / Brown Stair Adaptation* — Dimensional seriation by stacking 5 graduated hay bales or excavator buckets from largest to smallest.
  - [ ] **M-04 (`src/games/grain-cart-spindles.js`):** *Spindle Box Adaptation* — Numeracy ($0\text{–}10$) and the concept of zero by loading exact counts of corn/pumpkins into numbered grain carts.
  - [ ] **M-05 (`src/games/tractor-letter-trace.js`):** *Sandpaper Letters Adaptation* — Phonemic awareness and directional motor tracing by driving a tractor along oversized high-contrast letter paths (`s`, `m`, `a`, `t`).
  - [ ] **M-06 (`src/games/machine-patch-shapes.js`):** *Geometric Cabinet Adaptation* — Shape recognition (circle, square, triangle, hexagon, trapezoid) by patching geometric metal plates onto farm machinery silhouettes.
  - [ ] **M-07 (`src/games/acoustic-bale-match.js`):** *Sound Cylinders / Bells Adaptation* — Auditory discrimination and pitch matching using Web Audio API synthesized tones and farm calls.
