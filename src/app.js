/**
 * @file src/app.js
 * @description Core PWA launcher, Web Audio pentatonic synthesizer, clamped SpeechSynthesis wrapper,
 *              Dual-Corner 2.0s Parent Gate, and palm-rest multi-touch PointerManager.
 */

import { initInstallHelper } from './install-helper.js';
import { GAME_REGISTRY } from './registry.js';

/**
 * Zero-MP3 Web Audio API Synthesizer for tactile preschool reward chimes and gentle thuds.
 */
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

  /**
   * Plays a warm single note (e.g., on piece pickup or tap).
   * @param {number} freqHz - Frequency in Hz (default C5 = 523.25 Hz).
   * @param {number} durationSec - Duration in seconds.
   */
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

  /**
   * Plays a cheerful C-major pentatonic ascending marimba arpeggio on successful match/round completion.
   */
  playSuccessChord() {
    if (this.muted) return;
    const pentatonicHz = [523.25, 587.33, 659.25, 783.99, 1046.5]; // C5, D5, E5, G5, C6
    pentatonicHz.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.28), idx * 75);
    });
  }

  /**
   * Plays a soft, non-punitive low-frequency wooden bounce sound when a piece returns to tray.
   */
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

/**
 * Offline Web Speech API wrapper with playback rate clamped to [0.85, 0.90] for 3-to-4-year-olds.
 */
export class VoicePrompt {
  constructor() {
    this.synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.rate = 0.88;
    this.pitch = 1.05;
  }

  /**
   * Speaks a short, deterministic prompt aloud, cancelling any overlapping speech.
   * @param {string} text - Prompt string to speak.
   * @param {number} customRate - Optional rate clamped strictly to [0.85, 0.90].
   */
  speak(text, customRate = 0.88) {
    if (!this.synth || !text) return;
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.85, Math.min(0.90, customRate));
      utterance.pitch = this.pitch;
      utterance.lang = 'en-US';
      this.synth.speak(utterance);
    } catch (_) {
      // Fallback silently if browser restricts un-gestured speech
    }
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

/**
 * Multi-touch palm-rest debouncer and +24px magnetic snap helper for 3-year-old motor ergonomics.
 */
export class PointerManager {
  /**
   * Attaches palm-rest-safe drag-and-drop behavior to an element.
   * Tracks only the initial active `pointerId` so a resting thumb or palm never aborts the drag.
   *
   * @param {HTMLElement|SVGElement} el - Draggable target element.
   * @param {Object} handlers - { onStart(x, y, e), onMove(x, y, dx, dy, e), onEnd(x, y, e) }
   * @returns {Function} Cleanup function to detach listeners.
   */
  static attachDrag(el, { onStart, onMove, onEnd }) {
    let activePointerId = null;
    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e) => {
      if (activePointerId !== null) return; // Ignore secondary palm/thumb touches
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

  /**
   * Evaluates whether a dragged coordinate is within a drop target's radius + 24px magnetic snap tolerance.
   * @param {number} x - Dragged item center X (clientX).
   * @param {number} y - Dragged item center Y (clientY).
   * @param {HTMLElement|SVGElement} targetEl - Receptacle DOM/SVG element.
   * @param {number} snapBonusPx - Extra magnetic tolerance in CSS pixels (default 24px).
   * @returns {boolean}
   */
  static isWithinSnapRadius(x, y, targetEl, snapBonusPx = 24) {
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const baseRadius = Math.max(rect.width, rect.height) / 2;
    const dist = Math.hypot(x - centerX, y - centerY);
    return dist <= baseRadius + snapBonusPx;
  }
}

/**
 * Simultaneous Dual-Corner Hold Detector (2000ms) to prevent accidental toddler exits.
 */
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
    this.holdStartMs = 0;
    this.rafId = null;
    this.holdDurationMs = 2000;
    this.circumference = 150.8;

    this._bindCorner(this.leftEl, 'left');
    this._bindCorner(this.rightEl, 'right');
  }

  _bindCorner(el, side) {
    const setHeld = (state) => {
      if (side === 'left') this.leftHeld = state;
      if (side === 'right') this.rightHeld = state;
      el.classList.toggle('holding', state);
      this._evaluateHoldState();
    };

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setHeld(true);
    });
    el.addEventListener('pointerup', () => setHeld(false));
    el.addEventListener('pointercancel', () => setHeld(false));
    el.addEventListener('pointerleave', () => setHeld(false));
  }

  _evaluateHoldState() {
    if (this.leftHeld && this.rightHeld) {
      this.holdStartMs = performance.now();
      this.hintEl.classList.remove('visible');
      this._tick();
    } else {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this._setProgress(0);
      if (this.leftHeld || this.rightHeld) {
        this.hintEl.classList.add('visible');
      } else {
        this.hintEl.classList.remove('visible');
      }
    }
  }

  _tick() {
    const elapsed = performance.now() - this.holdStartMs;
    const ratio = Math.min(1, elapsed / this.holdDurationMs);
    this._setProgress(ratio);

    if (ratio >= 1) {
      this.leftHeld = false;
      this.rightHeld = false;
      this.leftEl.classList.remove('holding');
      this.rightEl.classList.remove('holding');
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

/**
 * Main Application Shell Controller.
 */
class KidsCommonsApp {
  constructor() {
    this.audio = new AudioSynth();
    this.speech = new VoicePrompt();
    this.activeInstance = null;

    this.launcherView = document.getElementById('launcher-view');
    this.stageView = document.getElementById('stage-view');
    this.gameGrid = document.getElementById('game-grid');
    this.gameMount = document.getElementById('game-mount');

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
    this.renderLauncher();
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  renderLauncher() {
    this.gameGrid.innerHTML = '';
    GAME_REGISTRY.forEach((entry) => {
      const card = document.createElement('button');
      card.className = 'game-card';
      card.style.borderColor = entry.accentColor || '#cbd5e1';
      card.setAttribute('aria-label', entry.title);
      card.innerHTML = `
        <div class="game-card-icon">${entry.iconSvg}</div>
        <div class="game-card-title">${entry.title}</div>
      `;
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
      this.speech.speak('Let us pick another game!');
      this.exitActiveGame();
    }
  }

  exitActiveGame() {
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
