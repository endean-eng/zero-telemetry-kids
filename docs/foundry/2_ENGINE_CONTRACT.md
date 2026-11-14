# `2_ENGINE_CONTRACT.md` — Plug-and-Play ES6 Mini-Game Module Contract

Every mini-game in `endean-eng/zero-telemetry-kids` MUST be authored as a single, self-contained ES6 JavaScript file located at `src/games/<game-slug>.js` with zero external CSS or image file dependencies.

---

## 1. Required ES6 Class Export Signature

```javascript
/**
 * @file src/games/<game-slug>.js
 * @description Self-contained zero-telemetry mini-game module for 3-to-4-year-olds.
 */

export default class GameModule {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.cleanups = [];
    this.timers = [];
  }

  /**
   * Mounts the mini-game into the full-screen stage container.
   *
   * @param {HTMLElement} containerEl - Dedicated full-viewport stage (`100vw x 100vh`).
   * @param {AudioSynth} audioApi - Web Audio synthesizer (`playNote(hz, sec)`, `playSuccessChord()`, `playGentleThud()`).
   * @param {VoicePrompt} speechApi - Clamped offline speech wrapper (`speak(text, rate)`, `cancel()`).
   * @param {Object} helpers - `{ PointerManager }` providing `attachDrag()` and `isWithinSnapRadius()`.
   */
  mount(containerEl, audioApi, speechApi, { PointerManager }) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = PointerManager;

    this.render();
  }

  /**
   * Cleans up all active DOM nodes, pointer listeners, animation frames, and timers when exiting via the Parent Gate.
   */
  unmount() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (this.speech) this.speech.cancel();
    if (this.container) this.container.innerHTML = '';
  }
}
```

---

## 2. Mandatory Lifecycle & Ergonomic Invariants

1. **Top-Corner Clearance Zone (`96px x 96px`):**
   * The PWA shell renders the **Dual-Corner Parent Gate** in the top-left (`0,0` to `96px,96px`) and top-right (`calc(100vw - 96px),0` to `100vw,96px`) corners.
   * **NEVER** place interactive game pieces or drop targets inside the top `100px` left/right corner boxes.
2. **Audio & Voice Feedback Loop:**
   * Speak a warm, concise instruction via `this.speech.speak(...)` at the start of each round.
   * Provide a tap-to-repeat speaker button (`>= 96x96px`) at the top-center of the screen so the child can re-hear the prompt at any time.
   * On valid pick-up/tap: call `this.audio.playNote(523.25, 0.12)`.
   * On valid match/drop: call `this.audio.playSuccessChord()` and speak positive reinforcement (`"Green triangle!"`, `"Three pumpkins!"`).
   * On miss/bounce-back: smoothly transition the piece back to its staging slot (`transform: translate(0px, 0px)`) and call `this.audio.playGentleThud()`.
3. **Endless Calm Progression (Zero Game Over):**
   * When a round completes (e.g., 3 to 5 items matched), play a brief celebration animation (`1200ms`) and automatically deal the next randomized round.
