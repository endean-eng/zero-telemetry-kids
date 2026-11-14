/**
 * @file src/app.js
 * @description Core PWA launcher featuring a 2-Card Roguelike Featured Draft + Full Library Drawer,
 *              Web Audio pentatonic synthesizer, clamped SpeechSynthesis wrapper,
 *              Dual-Corner / PC-Mouse / Escape-Key 2.0s Parent Gate, and palm-rest multi-touch PointerManager.
 */

import { initInstallHelper } from './install-helper.js';
import { GAME_REGISTRY } from './registry.js';

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

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

class KidsCommonsApp {
  constructor() {
    this.audio = new AudioSynth();
    this.speech = new VoicePrompt();
    this.activeInstance = null;

    this.launcherView = document.getElementById('launcher-view');
    this.stageView = document.getElementById('stage-view');
    this.featuredGrid = document.getElementById('featured-grid');
    this.gameGrid = document.getElementById('game-grid');
    this.rerollBtn = document.getElementById('btn-reroll-featured');
    this.gameMount = document.getElementById('game-mount');

    this.featuredCount = 2;
    this.lastFeaturedKey = '';

    this.parentGate = new ParentGate(
      document.getElementById('gate-left'),
      document.getElementById('gate-right'),
      document.getElementById('gate-progress-left'),
      document.getElementById('gate-progress-right'),
      document.getElementById('parent-gate-hint'),
      () => this.exitActiveGame()
    );
  }

  init() {
    this._registerServiceWorker();
    initInstallHelper(document.getElementById('install-banner'));
    if (this.rerollBtn) {
      this.rerollBtn.addEventListener('click', () => {
        this.audio.playNote(587.33, 0.14);
        setTimeout(() => this.audio.playNote(783.99, 0.18), 80);
        this.renderFeaturedPicks();
      });
    }
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

  /**
   * Deals 2 random featured games into the prominent top Hero Draft section.
   * Ensures clicking "Spin New Picks" always deals a fresh pair combination.
   */
  renderFeaturedPicks() {
    if (!this.featuredGrid) return;
    this.featuredGrid.innerHTML = '';

    const count = Math.min(this.featuredCount, GAME_REGISTRY.length);
    let picks = shuffleArray(GAME_REGISTRY).slice(0, count);
    let currentKey = picks.map((p) => p.id).join('|');

    if (GAME_REGISTRY.length > 2 && currentKey === this.lastFeaturedKey) {
      picks = shuffleArray(GAME_REGISTRY).slice(0, count);
      currentKey = picks.map((p) => p.id).join('|');
    }
    this.lastFeaturedKey = currentKey;

    picks.forEach((entry) => {
      const card = document.createElement('button');
      card.className = 'game-card hero-card';
      card.style.borderColor = entry.accentColor || '#0f172a';
      card.setAttribute('aria-label', 'Featured Game: ' + entry.title);
      card.innerHTML =
        '<div class="game-card-icon">' +
        entry.iconSvg +
        '</div>' +
        '<div class="game-card-title">' +
        entry.title +
        '</div>';
      card.addEventListener('click', () => this.launchGame(entry));
      this.featuredGrid.appendChild(card);
    });
  }

  renderLauncher() {
    this.renderFeaturedPicks();

    if (!this.gameGrid) return;
    this.gameGrid.innerHTML = '';
    GAME_REGISTRY.forEach((entry) => {
      const card = document.createElement('button');
      card.className = 'game-card compact-card';
      card.style.borderColor = entry.accentColor || '#cbd5e1';
      card.setAttribute('aria-label', entry.title);
      card.innerHTML =
        '<div class="game-card-icon">' +
        entry.iconSvg +
        '</div>' +
        '<div class="game-card-title">' +
        entry.title +
        '</div>';
      card.addEventListener('click', () => this.launchGame(entry));
      this.gameGrid.appendChild(card);
    });
  }

  async launchGame(entry) {
    this.audio.playNote(523.25, 0.15);
    this.launcherView.style.display = 'none';
    this.stageView.classList.add('active');
    this.gameMount.innerHTML = '';

    try {
      const module = await entry.loader();
      const GameClass = module.default;
      this.activeInstance = new GameClass();
      this.activeInstance.mount(this.gameMount, this.audio, this.speech, {
        PointerManager
      });
    } catch (err) {
      console.error('Failed to load game module:', entry.id, err);
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
    // Deal a fresh 2-game Roguelike Draft whenever returning to the home screen
    this.renderFeaturedPicks();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new KidsCommonsApp();
  app.init();
});