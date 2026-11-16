/**
 * @file src/app.js
 * @description Core PWA launcher with persistent localStorage Favorites ("ztk_favorites"),
 *              "1 Favorite + 1 Discovery" Hero Draft, Web Audio pentatonic synthesizer,
 *              clamped SpeechSynthesis wrapper, Dual-Corner / PC-Mouse / Escape-Key Parent Gate,
 *              and self-healing card layout styles.
 */

import { initInstallHelper } from './install-helper.js';
import { GAME_REGISTRY } from './registry.js';

const FAVORITES_STORAGE_KEY = 'ztk_favorites';

export class AudioSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freqHz = 523.25, durationSec = 0.18) {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  playSuccessChord() {
    if (this.muted) return;
    const pentatonicHz = [523.25, 587.33, 659.25, 783.99, 1046.5];
    pentatonicHz.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.28), idx * 75);
    });
  }

  playGentleThud() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export class VoicePrompt {
  constructor() {
    this.synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.rate = 0.88;
    this.pitch = 1.05;
  }

  speak(text, customRate = 0.88) {
    if (!this.synth || !text) return;
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.85, Math.min(0.90, customRate));
      utterance.pitch = this.pitch;
      utterance.lang = 'en-US';
      this.synth.speak(utterance);
    } catch (_) {}
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export class PointerManager {
  static attachDrag(el, { onStart, onMove, onEnd }) {
    let activePointerId = null;
    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e) => {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      try {
        el.setPointerCapture(activePointerId);
      } catch (_) {}
      if (onStart) onStart(e.clientX, e.clientY, e);
    };

    const handlePointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (onMove) onMove(e.clientX, e.clientY, dx, dy, e);
    };

    const handlePointerUpOrCancel = (e) => {
      if (e.pointerId !== activePointerId) return;
      try {
        el.releasePointerCapture(activePointerId);
      } catch (_) {}
      activePointerId = null;
      if (onEnd) onEnd(e.clientX, e.clientY, e);
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUpOrCancel);
    el.addEventListener('pointercancel', handlePointerUpOrCancel);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUpOrCancel);
      el.removeEventListener('pointercancel', handlePointerUpOrCancel);
    };
  }

  static isWithinSnapRadius(x, y, targetEl, snapBonusPx = 24) {
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const baseRadius = Math.max(rect.width, rect.height) / 2;
    const dist = Math.hypot(x - centerX, y - centerY);
    return dist <= baseRadius + snapBonusPx;
  }
}

class ParentGate {
  constructor(leftEl, rightEl, progLeftEl, progRightEl, hintEl, onUnlock) {
    this.leftEl = leftEl;
    this.rightEl = rightEl;
    this.progLeftEl = progLeftEl;
    this.progRightEl = progRightEl;
    this.hintEl = hintEl;
    this.onUnlock = onUnlock;

    this.leftHeld = false;
    this.rightHeld = false;
    this.mouseSingleCornerHold = false;
    this.escHeld = false;

    this.holdStartMs = 0;
    this.rafId = null;
    this.holdDurationMs = 2000;
    this.circumference = 150.8;

    this._bindCorner(this.leftEl, 'left');
    this._bindCorner(this.rightEl, 'right');
    this._bindKeyboard();
  }

  _bindCorner(el, side) {
    const setHeld = (state, isMouse = false) => {
      if (side === 'left') this.leftHeld = state;
      if (side === 'right') this.rightHeld = state;
      if (isMouse) {
        this.mouseSingleCornerHold = state;
      } else if (!this.leftHeld && !this.rightHeld) {
        this.mouseSingleCornerHold = false;
      }
      el.classList.toggle('holding', state);
      this._evaluateHoldState();
    };

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const isMouse = e.pointerType === 'mouse';
      setHeld(true, isMouse);
    });
    el.addEventListener('pointerup', () => setHeld(false, false));
    el.addEventListener('pointercancel', () => setHeld(false, false));
    el.addEventListener('pointerleave', () => setHeld(false, false));
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (e.shiftKey) {
          this.onUnlock();
          return;
        }
        if (!this.escHeld) {
          this.escHeld = true;
          this.leftEl.classList.add('holding');
          this.rightEl.classList.add('holding');
          this._evaluateHoldState();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Escape' && this.escHeld) {
        this.escHeld = false;
        this.leftEl.classList.remove('holding');
        this.rightEl.classList.remove('holding');
        this._evaluateHoldState();
      }
    });
  }

  _evaluateHoldState() {
    const isUnlockHoldActive =
      (this.leftHeld && this.rightHeld) ||
      this.mouseSingleCornerHold ||
      this.escHeld;

    if (isUnlockHoldActive) {
      this.holdStartMs = performance.now();
      this.hintEl.textContent = this.escHeld
        ? 'Keep holding ESC to exit to menu...'
        : 'Keep holding for 2 seconds to exit...';
      this.hintEl.classList.add('visible');
      this._tick();
    } else {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this._setProgress(0);
      if (this.leftHeld || this.rightHeld) {
        this.hintEl.textContent =
          'Touch: Hold BOTH top corners for 2s (PC: Hold corner with mouse or hold ESC)';
        this.hintEl.classList.add('visible');
      } else {
        this.hintEl.classList.remove('visible');
      }
    }
  }

  _tick() {
    const targetMs = this.escHeld ? 1200 : this.holdDurationMs;
    const elapsed = performance.now() - this.holdStartMs;
    const ratio = Math.min(1, elapsed / targetMs);
    this._setProgress(ratio);

    if (ratio >= 1) {
      this.leftHeld = false;
      this.rightHeld = false;
      this.mouseSingleCornerHold = false;
      this.escHeld = false;
      this.leftEl.classList.remove('holding');
      this.rightEl.classList.remove('holding');
      this.hintEl.classList.remove('visible');
      this._setProgress(0);
      this.onUnlock();
      return;
    }
    this.rafId = requestAnimationFrame(() => this._tick());
  }

  _setProgress(ratio) {
    const offset = this.circumference * (1 - ratio);
    this.progLeftEl.style.strokeDashoffset = String(offset);
    this.progRightEl.style.strokeDashoffset = String(offset);
  }
}

class KidsCommonsApp {
  constructor() {
    this.audio = new AudioSynth();
    this.speech = new VoicePrompt();
    this.activeInstance = null;

    this.launcherView = document.getElementById('launcher-view');
    this.stageView = document.getElementById('stage-view');
    // Support both #hero-grid and #hero-cards so any index.html version works!
    this.heroGrid =
      document.getElementById('hero-grid') ||
      document.getElementById('hero-cards');
    this.gameGrid = document.getElementById('game-grid');
    this.totalCountEl = document.getElementById('total-games-count');
    this.shuffleBtn =
      document.getElementById('btn-shuffle-hero') ||
      document.getElementById('shuffle-btn');
    this.gameMount = document.getElementById('game-mount');

    this.favoriteIds = this._loadFavorites();
    this.currentHeroPair = [];

    this._injectCardStyles();

    this.parentGate = new ParentGate(
      document.getElementById('gate-left'),
      document.getElementById('gate-right'),
      document.getElementById('gate-progress-left'),
      document.getElementById('gate-progress-right'),
      document.getElementById('parent-gate-hint'),
      () => this.exitActiveGame()
    );
  }

  /**
   * Ensures favorite hearts, badges, and compact cards always have proper CSS
   * even if an older index.html stylesheet is cached or active.
   */
  _injectCardStyles() {
    if (document.getElementById('ztk-dynamic-card-styles')) return;
    const style = document.createElement('style');
    style.id = 'ztk-dynamic-card-styles';
    style.textContent =
      '#hero-grid, #hero-cards {' +
      '  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));' +
      '  gap: 20px; width: 100%;' +
      '}' +
      '.game-card {' +
      '  position: relative !important; display: flex !important;' +
      '  flex-direction: column !important; align-items: center !important;' +
      '  justify-content: center !important; overflow: hidden;' +
      '}' +
      '.game-card.hero-card {' +
      '  min-height: 215px !important; padding: 28px 18px 18px 18px !important;' +
      '}' +
      '.game-card.compact-card {' +
      '  min-height: 165px !important; padding: 26px 14px 14px 14px !important; gap: 6px !important;' +
      '}' +
      '.fav-toggle-btn {' +
      '  position: absolute; top: 10px; right: 10px; width: 42px; height: 42px;' +
      '  border-radius: 999px; background: #f8fafc; border: 2.5px solid #cbd5e1;' +
      '  color: #64748b; display: flex; align-items: center; justify-content: center;' +
      '  font-size: 1.3rem; line-height: 1; cursor: pointer; z-index: 15;' +
      '  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;' +
      '}' +
      '.fav-toggle-btn.is-fav {' +
      '  background: #fee2e2; border-color: #dc2626; color: #dc2626;' +
      '}' +
      '.fav-toggle-btn:active { transform: scale(0.88); }' +
      '.slot-badge {' +
      '  position: absolute; top: 12px; left: 12px; padding: 4px 10px;' +
      '  border-radius: 999px; font-size: 0.76rem; font-weight: 800;' +
      '  background: #f1f5f9; color: #334155; border: 2px solid #cbd5e1; z-index: 12;' +
      '}' +
      '.slot-badge.fav-slot {' +
      '  background: #fef3c7; color: #92400e; border-color: #f59e0b;' +
      '}' +
      '.game-card-category {' +
      '  font-size: 0.75rem; font-weight: 700; color: #475569;' +
      '  background: #f1f5f9; padding: 3px 10px; border-radius: 999px;' +
      '  text-align: center; white-space: nowrap;' +
      '}';
    document.head.appendChild(style);
  }

  init() {
    this._registerServiceWorker();
    initInstallHelper(document.getElementById('install-banner'));

    if (this.shuffleBtn) {
      this.shuffleBtn.addEventListener('click', () => {
        this.audio.playNote(659.25, 0.14);
        this.currentHeroPair = this._pickHeroPair();
        this.renderLauncher();
      });
    }

    this.currentHeroPair = this._pickHeroPair();
    this.renderLauncher();
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js', { updateViaCache: 'none' })
          .catch(() => {});
      });
    }
  }

  _loadFavorites() {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  _saveFavorites() {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(this.favoriteIds)
      );
    } catch (_) {}
  }

  toggleFavorite(gameId) {
    const idx = this.favoriteIds.indexOf(gameId);
    if (idx >= 0) {
      this.favoriteIds.splice(idx, 1);
      this.audio.playNote(392.0, 0.14);
    } else {
      this.favoriteIds.push(gameId);
      this.audio.playNote(783.99, 0.18);
    }
    this._saveFavorites();
    this.currentHeroPair = this._pickHeroPair();
    this.renderLauncher();
  }

  _shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  _pickHeroPair() {
    if (GAME_REGISTRY.length <= 2) {
      return GAME_REGISTRY.slice();
    }

    const favPool = GAME_REGISTRY.filter(
      (g) => this.favoriteIds.indexOf(g.id) !== -1
    );
    const nonFavPool = GAME_REGISTRY.filter(
      (g) => this.favoriteIds.indexOf(g.id) === -1
    );

    let firstPick = null;
    if (favPool.length > 0) {
      const shuffledFavs = this._shuffleArray(favPool);
      firstPick = shuffledFavs[0];
    } else {
      const shuffledAll = this._shuffleArray(GAME_REGISTRY);
      firstPick = shuffledAll[0];
    }

    let secondCandidates = nonFavPool.filter((g) => g.id !== firstPick.id);
    if (secondCandidates.length === 0) {
      secondCandidates = GAME_REGISTRY.filter((g) => g.id !== firstPick.id);
    }

    const secondPick = this._shuffleArray(secondCandidates)[0];
    return secondPick ? [firstPick, secondPick] : [firstPick];
  }

  _createCardElement(entry, isHero, slotIndex) {
    const isFav = this.favoriteIds.indexOf(entry.id) !== -1;
    const card = document.createElement('div');
    card.className = isHero ? 'game-card hero-card' : 'game-card compact-card';
    card.style.borderColor = entry.accentColor || '#cbd5e1';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', entry.title);

    let badgeHtml = '';
    if (isHero) {
      if (slotIndex === 0 && isFav) {
        badgeHtml = '<span class="slot-badge fav-slot">\u2665 Favorite Pick</span>';
      } else {
        badgeHtml = '<span class="slot-badge">\u2605 Discovery Pick</span>';
      }
    }

    const categoryLabel = entry.category || 'Montessori Sensorial';
    const favIcon = isFav ? '\u2665' : '\u2661';
    const favClass = isFav ? 'fav-toggle-btn is-fav' : 'fav-toggle-btn';

    card.innerHTML =
      badgeHtml +
      '<button type="button" class="' +
      favClass +
      '" aria-label="Toggle Favorite" title="Toggle Favorite">' +
      favIcon +
      '</button>' +
      '<div class="game-card-icon">' +
      entry.iconSvg +
      '</div>' +
      '<div class="game-card-title">' +
      entry.title +
      '</div>' +
      '<div class="game-card-category">' +
      categoryLabel +
      '</div>';

    const favBtn = card.querySelector('.fav-toggle-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFavorite(entry.id);
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('.fav-toggle-btn')) {
        return;
      }
      this.launchGame(entry);
    });

    return card;
  }

  renderLauncher() {
    if (this.totalCountEl) {
      this.totalCountEl.textContent = String(GAME_REGISTRY.length);
    }

    if (this.heroGrid) {
      this.heroGrid.innerHTML = '';
      this.currentHeroPair.forEach((entry, idx) => {
        this.heroGrid.appendChild(this._createCardElement(entry, true, idx));
      });
    }

    if (this.gameGrid) {
      this.gameGrid.innerHTML = '';
      GAME_REGISTRY.forEach((entry) => {
        this.gameGrid.appendChild(this._createCardElement(entry, false, -1));
      });
    }
  }

  async launchGame(entry) {
    this.audio.playNote(523.25, 0.15);
    this.launcherView.style.display = 'none';
    this.stageView.classList.add('active');
    this.gameMount.innerHTML = '';

    try {
      const module = await entry.loader();
      const GameClass =
        module.default ||
        module.PastureFenceHopperGame ||
        Object.values(module).find((exp) => typeof exp === 'function');

      if (typeof GameClass !== 'function') {
        throw new Error(
          'Module ./src/games/' +
            entry.id +
            '.js loaded as an empty object! Check that the file is saved (Ctrl+S) in VS Code.'
        );
      }

      this.activeInstance = new GameClass();
      this.activeInstance.mount(this.gameMount, this.audio, this.speech, {
        PointerManager: PointerManager
      });
    } catch (err) {
      console.error('Failed to load game module [' + entry.id + ']:', err);
      this.speech.speak('Let us pick another game!');
      this.exitActiveGame();
    }
  }

  exitActiveGame() {
    if (!this.stageView.classList.contains('active')) return;
    this.speech.cancel();
    this.audio.playNote(392.0, 0.15);
    if (this.activeInstance && typeof this.activeInstance.unmount === 'function') {
      try {
        this.activeInstance.unmount();
      } catch (_) {}
    }
    this.activeInstance = null;
    this.gameMount.innerHTML = '';
    this.stageView.classList.remove('active');
    this.launcherView.style.display = 'flex';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new KidsCommonsApp();
  app.init();
});