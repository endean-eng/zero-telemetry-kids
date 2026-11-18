# ADR-001: Launcher Touch-Action Pan-Y Unblocking and 450ms Radial Long-Press Game Activation

* **Status:** Proposed
* **Date:** 2026-11-18
* **Author:** Elijah N. Dean, BSME (`endean-eng` / Dean Innovative Design LLC)
* **Target Specification:** `zero-telemetry-kids` PWA Shell (`index.html`, `src/app.js`, `sw.js`)
* **Supersedes / Refines:** `None (Foundational)`

---

## 1. Context & Problem Statement

On mobile touchscreens (phones and tablets), scrolling the `#launcher-view` game library was restricted almost entirely to the narrow outer screen margins. Two interacting mechanisms caused this defect:

1. **Global CSS `touch-action: none` Inheritance:** To prevent viewport rubber-banding and browser pull-to-refresh gestures during active mini-game play (`#stage-view`), `index.html` applied `touch-action: none` via the universal selector (`*`). Although `#launcher-view` declared `touch-action: pan-y`, its child elements (`.game-card`, `.hero-section`, SVG icons, and titles) inherited `touch-action: none` from the `*` rule. Because `.game-card` tiles occupy approximately $85\%$ of the viewport area on mobile screens, any vertical drag gesture initiated on a card was rejected by the browser's native scroll compositor.
2. **Accidental Game Launches During Scroll Initiation:** When `click` handlers are bound directly to large card surfaces, tentative touch-and-drag gestures by young children or parents scrolling through the game grid risk triggering unintended game transitions (including Fullscreen / Landscape orientation locks).

---

## 2. Decision & Governing Mechanics

We adopt a two-part human-factors and CSS touch-action architecture for `#launcher-view`:

1. **Explicit Descendant `touch-action: pan-y` Scope:**
   * All elements inside `#launcher-view` (`#launcher-view, #launcher-view *`) are explicitly assigned `touch-action: pan-y !important`, while `touch-action: none` remains strictly enforced on `#stage-view, #stage-view *`.
   * This guarantees that the browser's compositor thread can initiate native vertical scrolling from any $(x, y)$ coordinate on the launcher screen, including directly over `.game-card` elements.

2. **`450ms` Stationary Long-Press Activation with Visual Radial Progress Feedback:**
   * Launching a mini-game from a `.game-card` requires holding a pointer stationary on the card for $T_{\text{hold}} = 450\text{ ms}$ (`CARD_LONG_PRESS_MS = 450`).
   * **Euclidean Drift Cancellation Guard ($10\text{ px}$):** On `pointerdown`, the initial coordinates $(x_0, y_0)$ and `pointerId` are latched. On every subsequent `pointermove` for that `pointerId`, Euclidean displacement is evaluated:
     $$\Delta d = \sqrt{(x - x_0)^2 + (y - y_0)^2}$$
     If $\Delta d > 10\text{ CSS px}$ (`SCROLL_CANCEL_PX = 10`) or the browser emits `pointercancel` upon taking over a native `pan-y` scroll gesture, the hold timer is immediately aborted (`cancelHold()`).
   * **Deterministic Visual & Tactile Feedback:** Upon `pointerdown`, the card plays a soft $440\text{ Hz}$ pickup tick (`60ms`), scales to $1.035\times$, and animates a high-contrast SVG radial progress ring ($r = 32\text{ px}$, circumference $C = 2\pi r \approx 201.06\text{ px}$) over $450\text{ ms}$ via `requestAnimationFrame`:
     $$\text{strokeDashoffset}(t) = 201.06 \times \left(1 - \min\left(1, \frac{t - t_0}{450}\right)\right)$$
   * **Sub-Control Isolation:** The Favorite heart toggle button (`.fav-toggle-btn`) calls `e.stopPropagation()` on `pointerdown` and executes `toggleFavorite(entry.id)` on a standard single `click`, preserving instant 1-tap favoriting.

---

## 3. Rejected Alternatives & Technical Postmortems (DO NOT RE-IMPLEMENT)

* **Rejected Option 1 (Universal `* { touch-action: none; }` Without Descendant Override):** Blocking `touch-action` globally forces users to hunt for narrow gutter margins around cards to scroll the page on mobile viewports.
* **Rejected Option 2 (Un-Guarded Instant `click` Launch on Large Card Tiles):** While pairing `touch-action: pan-y` with a `12px` movement-threshold `click` guard allows native scrolling, it still launches games on brief accidental taps when a toddler touches the screen to steady a tablet or begins an aborted scroll gesture. Requiring a `450ms` stationary hold with an explicit radial progress ring eliminates accidental launches while providing clear visual cause-and-effect feedback.
* **Rejected Option 3 (Silent Long-Press Without Radial Progress Indicator):** Requiring a `450ms+` hold without immediate visual progress and audio pickup feedback violates preschool human-factors ergonomics, as users perceive the button as unresponsive and repeatedly tap instead of holding.

---

## 4. Consequences & Engineering Trade-Offs

* **Positive:** $100\%$ of the `#launcher-view` viewport is now a valid target for vertical touch scrolling (`tap + move`), and accidental game launches during scrolling or tablet handling are eliminated.
* **Trade-Off & Mitigation:** Intentional game launches require a `450ms` stationary hold rather than an instantaneous tap. This latency is mitigated by immediate `pointerdown` feedback (card scale elevation, $440\text{ Hz}$ audio tick, and smooth 60 FPS radial SVG ring completion) and by updating the header prompt to `"Hold a picture to play! Tap a heart to favorite."`
* **Browser Context Menu Suppression:** Because holding a finger stationary on mobile browsers can trigger the native OS context menu after $\sim 500\text{ ms}$, `.game-card` suppresses `contextmenu` (`e.preventDefault()`) so the `450ms` launch completes cleanly without OS callout popups.
