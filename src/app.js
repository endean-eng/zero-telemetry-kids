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
 * Unified Pointer Events helper passed to drag-and-drop Montessori modules[cite: 3].
 */
export const PointerManager = {
  attachDrag(el, callbacks = {}) {
    let activePointerId = null;
    let startX = 0;
    let startY = 0;

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

    const onPointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (callbacks.onMove) {
        callbacks.onMove(e.clientX, e.clientY, dx, dy, e);
      }
    };

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

  isWithinSnapRadius(clientX, clientY, targetEl, extraRadiusPx = 24) {
    if (!targetEl) return false;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hitRadius = Math.max(rect.width, rect.height) / 2 + extraRadiusPx;
    return Math.hypot(clientX - centerX, clientY - centerY) <= hitRadius;
  }
};

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
   * Drafts 1 Favorite Pick (if any favorited) + 1 Discovery Pick from remaining games[cite: 18].
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

  _buildCardHtml(game, isHero, slotMeta) {
    const isFav = this.favorites.includes(game.id);
    const heartChar = isFav ? '\u2665' : '\u2661';
    const cardClass = isHero ? 'game-card hero-card' : 'game-card compact-card';
    const borderStyle = isHero ? ' style="border-color:' + game.accentColor + ';"' : '';

    const badgeHtml =
      isHero && slotMeta
        ? '<span class="slot-badge ' +
          (slotMeta.isFavSlot ? 'fav-slot' : '') +
          '">' +
          slotMeta.badge +
          '</span>'
        : '';

    const subtitle = isHero
      ? game.category + ' \u2022 ' + game.ageBracket
      : game.category;

    return (
      '<div class="' +
      cardClass +
      '" data-game-id="' +
      game.id +
      '" role="button" tabindex="0"' +
      borderStyle +
      '>' +
      badgeHtml +
      '<button type="button" class="fav-toggle-btn ' +
      (isFav ? 'is-fav' : '') +
      '" data-fav-id="' +
      game.id +
      '" aria-label="Favorite ' +
      game.title +
      '">' +
      heartChar +
      '</button>' +
      '<div class="game-card-icon">' +
      game.iconSvg +
      '</div>' +
      '<div class="game-card-title">' +
      game.title +
      '</div>' +
      '<div class="game-card-category">' +
      subtitle +
      '</div>' +
      '</div>'
    );
  }

  renderLauncher() {
    const heroGrid = document.getElementById('hero-grid');
    const gameGrid = document.getElementById('game-grid');
    const totalCountEl = document.getElementById('total-games-count');

    if (totalCountEl) {
      totalCountEl.textContent = String(GAME_REGISTRY.length);
    }

    if (heroGrid) {
      heroGrid.innerHTML = this.heroSlots
        .map((slot) => this._buildCardHtml(slot.game, true, slot))
        .join('');
    }

    if (gameGrid) {
      gameGrid.innerHTML = GAME_REGISTRY.map((game) =>
        this._buildCardHtml(game, false, null)
      ).join('');
    }
  }

  _bindLauncherControls() {
    const launcherView = document.getElementById('launcher-view');
    const shuffleBtn = document.getElementById('btn-shuffle-hero');

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.audio.unlock();
        this.audio.playNote(587.33, 0.12);
        this.draftHeroPicks();
        this.renderLauncher();
      });
    }

    if (launcherView) {
      // Single delegated click listener prevents duplicate bindings across re-renders
      launcherView.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.fav-toggle-btn');
        if (favBtn) {
          e.stopPropagation();
          const favId = favBtn.getAttribute('data-fav-id');
          if (favId) this.toggleFavorite(favId);
          return;
        }

        const card = e.target.closest('.game-card');
        if (card) {
          const gameId = card.getAttribute('data-game-id');
          if (gameId) this.launchGame(gameId);
        }
      });
    }
  }

  async launchGame(gameId) {
    if (this.isLaunching) return;
    const entry = GAME_REGISTRY.find((g) => g.id === gameId);
    if (!entry) return;

    this.isLaunching = true;
    this.audio.unlock();
    this.audio.playNote(523.25, 0.12);

    // Trigger fullscreen + landscape orientation lock directly within the user tap gesture
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
        throw new Error('Missing default export for ' + gameId);
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
   * Dual-Corner Parent Gate[cite: 18]:
   * - Touch pointers ('touch' / 'pen'): Requires holding BOTH top-left AND top-right corners for 2s[cite: 18].
   * - Mouse pointer ('mouse'): Holding EITHER top corner for 2s exits[cite: 18].
   */
  _bindParentGate() {
    const leftCorner = document.getElementById('gate-left');
    const rightCorner = document.getElementById('gate-right');
    const progLeft = document.getElementById('gate-progress-left');
    const progRight = document.getElementById('gate-progress-right');
    const hintEl = document.getElementById('parent-gate-hint');

    if (!leftCorner || !rightCorner) return;

    let pointerMode = 'mouse';

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