/**
 * @file src/app.js
 * @description Hardened SPA Launcher, Web Audio Synthesizer, Speech Engine,
 *              PointerManager, Dual-Corner Parent Gate, and Mobile Landscape Lock.
 *              100% pure ASCII with Unicode escapes and zero external dependencies.
 */

import { GAME_REGISTRY } from './registry.js';
import { initInstallHelper } from './install-helper.js';

const FAV_STORAGE_KEY = 'ztk_favorites_v1';
const GATE_HOLD_MS = 2000;
const GATE_CIRCUMFERENCE = 150.8;
const CARD_LONG_PRESS_MS = 450;
const SCROLL_CANCEL_PX = 10;
const HOLD_RING_CIRCUMFERENCE = 201.06;

/**
 * Zero-dependency Web Audio API synthesizer for warm Montessori feedback tones.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock() {
    this._ensureContext();
  }

  playNote(freqHz, durationSec = 0.16, type = 'triangle', peakGain = 0.16) {
    try {
      const ctx = this._ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqHz, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.04, durationSec));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + Math.max(0.05, durationSec) + 0.02);
    } catch (_) {}
  }

  playSuccessChord() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6 arpeggio
    notes.forEach((hz, idx) => {
      setTimeout(() => {
        this.playNote(hz, 0.24, 'triangle', 0.14);
      }, idx * 65);
    });
  }

  playGentleThud() {
    try {
      const ctx = this._ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.14);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (_) {}
  }
}

/**
 * Child-friendly Web Speech API wrapper with safe mobile cancellation guards.
 */
class SpeechEngine {
  speak(text) {
    try {
      if (!('speechSynthesis' in window) || !text) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text));
      utter.rate = 0.96;
      utter.pitch = 1.08;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  cancel() {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
  }
}

/**
 * Unified Pointer Events helper passed to drag-and-drop Montessori modules.
 * Locks onto a single active pointerId so palm/thumb rests on bezel edges never abort active drags.
 */
export const PointerManager = {
  /**
   * Attaches single-pointer drag lifecycle handlers to a DOM or SVG element.
   * @param {Element} el Target interactive element.
   * @param {Object} [callbacks] Lifecycle hooks ({ onStart, onMove, onEnd }).
   * @returns {Function} Teardown function that removes all attached pointer listeners.
   */
  attachDrag(el, callbacks = {}) {
    let activePointerId = null;
    let startX = 0;
    let startY = 0;

    /**
     * Latches the primary pointerId on initial contact and ignores secondary multi-touch pointers.
     * @param {PointerEvent} e Incoming pointerdown event.
     */
    const onPointerDown = (e) => {
      if (activePointerId !== null) return;
      e.preventDefault();
      e.stopPropagation();

      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;

      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}

      if (callbacks.onStart) {
        callbacks.onStart(e.clientX, e.clientY, e);
      }
    };

    /**
     * Streams pointer delta coordinates exclusively for the latched activePointerId.
     * @param {PointerEvent} e Incoming pointermove event.
     */
    const onPointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (callbacks.onMove) {
        callbacks.onMove(e.clientX, e.clientY, dx, dy, e);
      }
    };

    /**
     * Releases pointer capture and completes the drag transaction when the active pointer lifts or cancels.
     * @param {PointerEvent} e Incoming pointerup or pointercancel event.
     */
    const endDrag = (e) => {
      if (e.pointerId !== activePointerId) return;
      const endX = e.clientX;
      const endY = e.clientY;
      try {
        if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
      activePointerId = null;
      if (callbacks.onEnd) {
        callbacks.onEnd(endX, endY, e);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
    };
  },

  /**
   * Evaluates whether a drop coordinate falls within the target element's magnetic snap radius (+24px default).
   * @param {number} clientX Viewport X coordinate of the dropped item.
   * @param {number} clientY Viewport Y coordinate of the dropped item.
   * @param {Element} targetEl Drop receptacle DOM/SVG element.
   * @param {number} [extraRadiusPx=24] Forgiveness margin added to the target radius for preschool motor control.
   * @returns {boolean} True if within Euclidean snap distance.
   */
  isWithinSnapRadius(clientX, clientY, targetEl, extraRadiusPx = 24) {
    if (!targetEl) return false;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hitRadius = Math.max(rect.width, rect.height) / 2 + extraRadiusPx;
    return Math.hypot(clientX - centerX, clientY - centerY) <= hitRadius;
  }
};

/**
 * Returns a shallow Fisher-Yates shuffled copy of an array for unbiased Hero Draft selection.
 * @param {Array} items Source array to shuffle without mutation.
 * @returns {Array} New shuffled array copy.
 */
function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Core SPA controller coordinating the launcher view, 450ms radial hold-to-launch cards,
 * Hero Draft favorites, Dual-Corner Parent Gate, and mini-game lifecycle mounting.
 */
class ZeroTelemetryApp {
  constructor() {
    this.audio = new SoundEngine();
    this.speech = new SpeechEngine();
    this.activeGame = null;
    this.isLaunching = false;
    this.favorites = this._loadFavorites();
    this.heroSlots = [];

    this.leftPointerId = null;
    this.rightPointerId = null;
    this.gateRafId = null;
    this.gateHoldStart = 0;
  }

  _loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  _saveFavorites() {
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(this.favorites));
    } catch (_) {}
  }

  init() {
    this._registerServiceWorker();

    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
      initInstallHelper(installBanner);
    }

    this.draftHeroPicks();
    this.renderLauncher();
    this._bindLauncherControls();
    this._bindParentGate();
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  /**
   * Attempts to lock mobile screens into landscape mode during active gameplay.
   * On Android Chrome browser tabs, orientation.lock() requires Fullscreen or installed PWA mode;
   * both are attempted gracefully inside the user gesture without throwing errors if declined.
   */
  async _engageMobileLandscape() {
    const isCoarseTouch =
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    if (!isCoarseTouch) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    try {
      if (!isStandalone && !document.fullscreenElement) {
        const rootEl = document.documentElement;
        if (rootEl.requestFullscreen) {
          await rootEl.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        } else if (rootEl.webkitRequestFullscreen) {
          rootEl.webkitRequestFullscreen();
        }
      }
    } catch (_) {}

    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}
  }

  async _releaseMobileLandscape() {
    try {
      if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        screen.orientation.unlock();
      }
    } catch (_) {}

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}
  }

  /**
   * Drafts 1 Favorite Pick (if any favorited) and 1 Discovery Pick from remaining games.
   */
  draftHeroPicks() {
    if (!GAME_REGISTRY.length) {
      this.heroSlots = [];
      return;
    }

    const favGames = shuffleArray(
      GAME_REGISTRY.filter((g) => this.favorites.includes(g.id))
    );
    const nonFavGames = shuffleArray(
      GAME_REGISTRY.filter((g) => !this.favorites.includes(g.id))
    );

    const slots = [];
    if (favGames.length > 0) {
      slots.push({ game: favGames[0], badge: '\u2605 Favorite Pick', isFavSlot: true });
      const pool = nonFavGames.length > 0 ? nonFavGames : favGames.slice(1);
      if (pool.length > 0) {
        slots.push({ game: pool[0], badge: '\u2728 Discovery Pick', isFavSlot: false });
      }
    } else {
      const pool = shuffleArray(GAME_REGISTRY);
      if (pool[0]) {
        slots.push({ game: pool[0], badge: '\u2605 Featured Pick', isFavSlot: true });
      }
      if (pool[1]) {
        slots.push({ game: pool[1], badge: '\u2728 Discovery Pick', isFavSlot: false });
      }
    }

    this.heroSlots = slots;
  }

  /**
   * Toggles a game's favorite status in localStorage and re-renders the launcher grid.
   * @param {string} gameId Registry identifier of the target mini-game.
   */
  toggleFavorite(gameId) {
    this.audio.unlock();
    const idx = this.favorites.indexOf(gameId);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      this.audio.playNote(392.0, 0.1);
    } else {
      this.favorites.push(gameId);
      this.audio.playNote(659.25, 0.14);
    }
    this._saveFavorites();
    this.draftHeroPicks();
    this.renderLauncher();
  }

  /**
   * Builds a launcher game card with a 450ms radial SVG long-press state machine and pan-y scroll handoff.
   * Intentionally omits setPointerCapture() and suppresses contextmenu so vertical touch drags (>10px)
   * cleanly transition to browser-composited pan-y scrolling without accidental game launches.
   * @param {Object} entry Game registry descriptor.
   * @param {boolean} isHero True when rendering inside the top Hero Draft section.
   * @param {Object|null} slotMeta Optional Hero slot badge metadata.
   * @returns {HTMLDivElement} Constructed interactive card element.
   */
  _createCardElement(entry, isHero, slotMeta) {
    const isFav = this.favorites.includes(entry.id);
    const heartChar = isFav ? '\u2665' : '\u2661';
    const card = document.createElement('div');
    card.className = isHero ? 'game-card hero-card' : 'game-card compact-card';
    card.setAttribute('data-game-id', entry.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    if (isHero && entry.accentColor) {
      card.style.borderColor = entry.accentColor;
    }

    const badgeHtml =
      isHero && slotMeta
        ? '<span class="slot-badge ' +
          (slotMeta.isFavSlot ? 'fav-slot' : '') +
          '">' +
          slotMeta.badge +
          '</span>'
        : '';

    const subtitle = isHero
      ? entry.category + ' \u2022 ' + entry.ageBracket
      : entry.category;

    card.innerHTML =
      badgeHtml +
      '<button type="button" class="fav-toggle-btn ' +
      (isFav ? 'is-fav' : '') +
      '" data-fav-id="' +
      entry.id +
      '" aria-label="Favorite ' +
      entry.title +
      '">' +
      heartChar +
      '</button>' +
      '<div class="game-card-icon">' +
      entry.iconSvg +
      '</div>' +
      '<div class="game-card-title">' +
      entry.title +
      '</div>' +
      '<div class="game-card-category">' +
      subtitle +
      '</div>' +
      '<div class="hold-ring-overlay" aria-hidden="true">' +
      '<svg class="hold-ring-svg" viewBox="0 0 80 80">' +
      '<circle cx="40" cy="40" r="32" fill="#0f172a" fill-opacity="0.78" />' +
      '<circle class="hold-ring-progress" cx="40" cy="40" r="32" fill="none" stroke="#22c55e" stroke-width="7" stroke-linecap="round" stroke-dasharray="' +
      HOLD_RING_CIRCUMFERENCE +
      '" stroke-dashoffset="' +
      HOLD_RING_CIRCUMFERENCE +
      '" transform="rotate(-90 40 40)" />' +
      '<polygon points="34,28 54,40 34,52" fill="#ffffff" />' +
      '</svg>' +
      '</div>';

    // Isolate the top-right favorite button so a quick tap toggles favorite without initiating a card hold.
    const favBtn = card.querySelector('.fav-toggle-btn');
    if (favBtn) {
      favBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      favBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFavorite(entry.id);
      });
    }

    const progressCircle = card.querySelector('.hold-ring-progress');
    let holdPointerId = null;
    let startX = 0;
    let startY = 0;
    let holdStartMs = 0;
    let rafId = null;

    /**
     * Aborts the active long-press timer and resets the radial SVG progress ring to zero.
     */
    const cancelHold = () => {
      holdPointerId = null;
      card.classList.remove('is-holding');
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (progressCircle) {
        progressCircle.style.strokeDashoffset = String(HOLD_RING_CIRCUMFERENCE);
      }
    };

    /**
     * Advances the radial SVG progress ring each animation frame until CARD_LONG_PRESS_MS (450ms) elapses.
     */
    const tickHold = () => {
      if (holdPointerId === null) return;
      const elapsed = performance.now() - holdStartMs;
      const ratio = Math.min(1, elapsed / CARD_LONG_PRESS_MS);
      if (progressCircle) {
        progressCircle.style.strokeDashoffset = String(
          HOLD_RING_CIRCUMFERENCE * (1 - ratio)
        );
      }
      if (ratio >= 1) {
        cancelHold();
        this.launchGame(entry);
        return;
      }
      rafId = requestAnimationFrame(tickHold);
    };

    // Do not call setPointerCapture() here so mobile compositors can claim vertical pan-y scroll drags.
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest('.fav-toggle-btn')) return;

      holdPointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      holdStartMs = performance.now();
      card.classList.add('is-holding');
      this.audio.playNote(440, 0.06);

      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tickHold);
    });

    // Cancel the hold if pointer drift exceeds SCROLL_CANCEL_PX (10px), handing off to native vertical scroll.
    card.addEventListener('pointermove', (e) => {
      if (e.pointerId !== holdPointerId) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > SCROLL_CANCEL_PX) {
        cancelHold();
      }
    });

    card.addEventListener('pointerup', (e) => {
      if (e.pointerId === holdPointerId) {
        cancelHold();
      }
    });

    card.addEventListener('pointercancel', (e) => {
      if (e.pointerId === holdPointerId) {
        cancelHold();
      }
    });

    // Suppress mobile OS long-press context menu callouts during stationary 450ms card holds.
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.launchGame(entry);
      }
    });

    return card;
  }

  /**
   * Populates the Hero Draft and All-Games Library grids using live DOM card elements.
   */
  renderLauncher() {
    const heroGrid = document.getElementById('hero-grid');
    const gameGrid = document.getElementById('game-grid');
    const totalCountEl = document.getElementById('total-games-count');

    if (totalCountEl) {
      totalCountEl.textContent = String(GAME_REGISTRY.length);
    }

    if (heroGrid) {
      heroGrid.innerHTML = '';
      this.heroSlots.forEach((slot) => {
        heroGrid.appendChild(this._createCardElement(slot.game, true, slot));
      });
    }

    if (gameGrid) {
      gameGrid.innerHTML = '';
      GAME_REGISTRY.forEach((game) => {
        gameGrid.appendChild(this._createCardElement(game, false, null));
      });
    }
  }

  /**
   * Binds single-tap click activation to the Hero Draft shuffle button (#btn-shuffle-hero).
   */
  _bindLauncherControls() {
    const shuffleBtn = document.getElementById('btn-shuffle-hero');

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.audio.unlock();
        this.audio.playNote(587.33, 0.12);
        this.draftHeroPicks();
        this.renderLauncher();
      });
    }
  }

  /**
   * Transitions from the launcher into the active game stage and mounts the selected module.
   * @param {Object|string} entryOrId Game registry entry object or string game ID.
   */
  async launchGame(entryOrId) {
    if (this.isLaunching) return;
    const entry =
      typeof entryOrId === 'object' && entryOrId !== null
        ? entryOrId
        : GAME_REGISTRY.find((g) => g.id === entryOrId);
    if (!entry) return;

    this.isLaunching = true;
    this.audio.unlock();
    this.audio.playNote(523.25, 0.12);

    this._engageMobileLandscape();

    const launcherEl = document.getElementById('launcher-view');
    const stageEl = document.getElementById('stage-view');
    const mountEl = document.getElementById('game-mount');
    const bannerEl = document.getElementById('install-banner');

    if (bannerEl) bannerEl.classList.remove('visible');
    if (launcherEl) launcherEl.style.display = 'none';
    if (stageEl) stageEl.classList.add('active');
    if (mountEl) mountEl.innerHTML = '';

    try {
      const mod = await entry.loader();
      const GameClass = mod && mod.default ? mod.default : null;
      if (!GameClass) {
        throw new Error('Missing default export for ' + entry.id);
      }

      const instance = new GameClass();
      this.activeGame = instance;
      instance.mount(mountEl, this.audio, this.speech, { PointerManager });
    } catch (err) {
      console.error('Game module load error:', err);
      this.exitToLauncher();
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Unmounts the active game module, releases orientation locks, and restores the launcher view.
   */
  exitToLauncher() {
    if (this.activeGame && typeof this.activeGame.unmount === 'function') {
      try {
        this.activeGame.unmount();
      } catch (_) {}
    }
    this.activeGame = null;
    this.speech.cancel();

    const launcherEl = document.getElementById('launcher-view');
    const stageEl = document.getElementById('stage-view');
    const mountEl = document.getElementById('game-mount');

    if (mountEl) mountEl.innerHTML = '';
    if (stageEl) stageEl.classList.remove('active');
    if (launcherEl) launcherEl.style.display = 'flex';

    this._releaseMobileLandscape();
    this.audio.playNote(392.0, 0.14);
    this.renderLauncher();
  }

  /**
   * Binds the Dual-Corner Parent Gate requiring a 2-second hold to exit active gameplay.
   * Touch/pen pointers require holding both top corners simultaneously; mouse pointers require holding either corner.
   */
  _bindParentGate() {
    const leftCorner = document.getElementById('gate-left');
    const rightCorner = document.getElementById('gate-right');
    const progLeft = document.getElementById('gate-progress-left');
    const progRight = document.getElementById('gate-progress-right');
    const hintEl = document.getElementById('parent-gate-hint');

    if (!leftCorner || !rightCorner) return;

    let pointerMode = 'mouse';

    /**
     * Cancels the parent-gate animation loop and resets corner progress rings.
     */
    const resetVisuals = () => {
      if (this.gateRafId) {
        cancelAnimationFrame(this.gateRafId);
        this.gateRafId = null;
      }
      this.gateHoldStart = 0;
      leftCorner.classList.toggle('holding', this.leftPointerId !== null);
      rightCorner.classList.toggle('holding', this.rightPointerId !== null);
      if (progLeft) progLeft.setAttribute('stroke-dashoffset', String(GATE_CIRCUMFERENCE));
      if (progRight) progRight.setAttribute('stroke-dashoffset', String(GATE_CIRCUMFERENCE));
      if (this.leftPointerId === null && this.rightPointerId === null && hintEl) {
        hintEl.classList.remove('visible');
      }
    };

    /**
     * Checks whether the required corner hold condition is met and drives the 2000ms countdown ring.
     */
    const evaluateGateState = () => {
      const anyHeld = this.leftPointerId !== null || this.rightPointerId !== null;
      const bothHeld = this.leftPointerId !== null && this.rightPointerId !== null;
      const satisfied = pointerMode === 'mouse' ? anyHeld : bothHeld;

      leftCorner.classList.toggle('holding', this.leftPointerId !== null);
      rightCorner.classList.toggle('holding', this.rightPointerId !== null);

      if (anyHeld && hintEl) {
        hintEl.textContent =
          pointerMode === 'mouse'
            ? 'Hold top corner for 2 seconds to exit to menu'
            : 'Hold BOTH top corners for 2 seconds to exit';
        hintEl.classList.add('visible');
      }

      if (!satisfied) {
        resetVisuals();
        return;
      }

      if (!this.gateHoldStart) {
        this.gateHoldStart = performance.now();
      }

      /**
       * Updates the parent-gate SVG stroke-dashoffset each frame until GATE_HOLD_MS (2000ms) completes.
       * @param {DOMHighResTimeStamp} now Frame timestamp from requestAnimationFrame.
       */
      const tick = (now) => {
        const stillSatisfied =
          pointerMode === 'mouse'
            ? this.leftPointerId !== null || this.rightPointerId !== null
            : this.leftPointerId !== null && this.rightPointerId !== null;

        if (!stillSatisfied) {
          resetVisuals();
          return;
        }

        const ratio = Math.min(1, (now - this.gateHoldStart) / GATE_HOLD_MS);
        const offset = (GATE_CIRCUMFERENCE * (1 - ratio)).toFixed(1);

        if (progLeft && (this.leftPointerId !== null || pointerMode === 'mouse')) {
          progLeft.setAttribute('stroke-dashoffset', offset);
        }
        if (progRight && (this.rightPointerId !== null || pointerMode === 'mouse')) {
          progRight.setAttribute('stroke-dashoffset', offset);
        }

        if (ratio >= 1) {
          this.leftPointerId = null;
          this.rightPointerId = null;
          resetVisuals();
          if (hintEl) hintEl.classList.remove('visible');
          this.exitToLauncher();
          return;
        }

        this.gateRafId = requestAnimationFrame(tick);
      };

      if (!this.gateRafId) {
        this.gateRafId = requestAnimationFrame(tick);
      }
    };

    leftCorner.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pointerMode = e.pointerType === 'mouse' ? 'mouse' : 'touch';
      this.leftPointerId = e.pointerId;
      try {
        leftCorner.setPointerCapture(e.pointerId);
      } catch (_) {}
      evaluateGateState();
    });

    rightCorner.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pointerMode = e.pointerType === 'mouse' ? 'mouse' : 'touch';
      this.rightPointerId = e.pointerId;
      try {
        rightCorner.setPointerCapture(e.pointerId);
      } catch (_) {}
      evaluateGateState();
    });

    /**
     * Clears the latched corner pointerId when either corner pointer lifts or cancels.
     * @param {PointerEvent} e Incoming pointerup or pointercancel event.
     */
    const releaseCorner = (e) => {
      if (e.pointerId === this.leftPointerId) {
        this.leftPointerId = null;
        evaluateGateState();
      }
      if (e.pointerId === this.rightPointerId) {
        this.rightPointerId = null;
        evaluateGateState();
      }
    };

    leftCorner.addEventListener('pointerup', releaseCorner);
    leftCorner.addEventListener('pointercancel', releaseCorner);
    rightCorner.addEventListener('pointerup', releaseCorner);
    rightCorner.addEventListener('pointercancel', releaseCorner);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new ZeroTelemetryApp();
    app.init();
  });
} else {
  const app = new ZeroTelemetryApp();
  app.init();
}