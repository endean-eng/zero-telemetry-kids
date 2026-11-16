/**
 * @file src/app.js
 * @description Main SPA Router, Game Launcher, and Parent Gate Controller.
 */

import { GAME_REGISTRY } from './registry.js';
import { initInstallHelper } from './install-helper.js';

class AppController {
  constructor() {
    this.activeGameInstance = null;
    this.favorites = JSON.parse(localStorage.getItem('ztk_favs') || '[]');
    this.heroPicks = [];
    this.holdTimer = null;
    this.holdStartTime = 0;
    this.isHolding = false;
  }

  init() {
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
      initInstallHelper(installBanner);
    }

    this.selectNewHeroPicks();
    this.renderLauncher();
    this.bindParentGate();

    const shuffleBtn = document.getElementById('btn-shuffle-hero');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.selectNewHeroPicks();
        this.renderLauncher();
      });
    }
  }

  selectNewHeroPicks() {
    const shuffled = [...GAME_REGISTRY].sort(() => 0.5 - Math.random());
    this.heroPicks = shuffled.slice(0, 2);
  }

  toggleFavorite(gameId, e) {
    e.stopPropagation();
    if (this.favorites.includes(gameId)) {
      this.favorites = this.favorites.filter((id) => id !== gameId);
    } else {
      this.favorites.push(gameId);
    }
    localStorage.setItem('ztk_favs', JSON.stringify(this.favorites));
    this.renderLauncher();
  }

  renderLauncher() {
    const heroGrid = document.getElementById('hero-grid');
    const gameGrid = document.getElementById('game-grid');
    const totalCountSpan = document.getElementById('total-games-count');

    if (totalCountSpan) {
      totalCountSpan.textContent = GAME_REGISTRY.length;
    }

    if (heroGrid) {
      heroGrid.innerHTML = this.heroPicks
        .map((game, idx) => {
          const isFav = this.favorites.includes(game.id);
          const slotLabel = idx === 0 ? '⭐ Favorite' : '🎯 Discovery';
          return `
            <div class="game-card hero-card" data-game-id="${game.id}">
              <span class="slot-badge fav-slot">${slotLabel}</span>
              <button type="button" class="fav-toggle-btn ${isFav ? 'is-fav' : ''}" data-fav-id="${game.id}" aria-label="Toggle Favorite">
                ${isFav ? '❤️' : '🤍'}
              </button>
              <div class="game-card-icon">${game.iconSvg}</div>
              <div class="game-card-title">${game.title}</div>
              <div class="game-card-category">${game.category}</div>
            </div>
          `;
        })
        .join('');
    }

    if (gameGrid) {
      gameGrid.innerHTML = GAME_REGISTRY.map((game) => {
        const isFav = this.favorites.includes(game.id);
        return `
          <div class="game-card compact-card" data-game-id="${game.id}">
            <button type="button" class="fav-toggle-btn ${isFav ? 'is-fav' : ''}" data-fav-id="${game.id}" aria-label="Toggle Favorite">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <div class="game-card-icon">${game.iconSvg}</div>
            <div class="game-card-title">${game.title}</div>
            <div class="game-card-category">${game.ageBracket}</div>
          </div>
        `;
      }).join('');
    }

    // Attach click listeners safely
    document.querySelectorAll('.game-card').forEach((cardEl) => {
      const gameId = cardEl.getAttribute('data-game-id');
      cardEl.addEventListener('click', () => this.launchGame(gameId));
    });

    document.querySelectorAll('.fav-toggle-btn').forEach((btnEl) => {
      const gameId = btnEl.getAttribute('data-fav-id');
      btnEl.addEventListener('click', (e) => this.toggleFavorite(gameId, e));
    });
  }

  async launchGame(gameId) {
    const registryEntry = GAME_REGISTRY.find((g) => g.id === gameId);
    if (!registryEntry) return;

    const launcherEl = document.getElementById('launcher-view');
    const stageEl = document.getElementById('stage-view');
    const mountEl = document.getElementById('game-mount');

    if (launcherEl) launcherEl.style.display = 'none';
    if (stageEl) stageEl.classList.add('active');
    if (mountEl) mountEl.innerHTML = '';

    try {
      const module = await registryEntry.loader();
      const GameClass = module.default;
      const gameInstance = new GameClass();

      // Mock audio & speech APIs
      const audioApi = {
        playNote: (freq, dur) => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.stop(ctx.currentTime + dur);
          } catch (_) {}
        },
        playSuccessChord: () => {},
        playGentleThud: () => {}
      };

      const speechApi = {
        speak: (text) => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        },
        cancel: () => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        }
      };

      const pointerManagerMock = {
        attachDrag: (el, callbacks) => {
          let dragging = false;
          let startX = 0, startY = 0;
          const onDown = (e) => {
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            if (callbacks.onStart) callbacks.onStart(e);
            try { el.setPointerCapture(e.pointerId); } catch(_){}
          };
          const onMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (callbacks.onMove) callbacks.onMove(e.clientX, e.clientY, dx, dy);
          };
          const onUp = (e) => {
            if (!dragging) return;
            dragging = false;
            if (callbacks.onEnd) callbacks.onEnd(e.clientX, e.clientY);
          };
          el.addEventListener('pointerdown', onDown);
          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerup', onUp);
          el.addEventListener('pointercancel', onUp);
          return () => {
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onUp);
          };
        },
        isWithinSnapRadius: (x, y, targetEl, radius) => {
          const rect = targetEl.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.hypot(x - cx, y - cy);
          return dist <= radius + Math.max(rect.width, rect.height) / 2;
        }
      };

      this.activeGameInstance = gameInstance;
      if (typeof gameInstance.mount === 'function') {
        gameInstance.mount(mountEl, audioApi, speechApi, { PointerManager: pointerManagerMock });
      }
    } catch (err) {
      console.error('Failed to load game module:', err);
      if (mountEl) {
        mountEl.innerHTML = `<div style="padding:40px; text-align:center; font-size:1.2rem; color:#0f172a;">Failed to load game module. Please check network connection.</div>`;
      }
    }
  }

  exitToLauncher() {
    if (this.activeGameInstance && typeof this.activeGameInstance.unmount === 'function') {
      try {
        this.activeGameInstance.unmount();
      } catch (_) {}
      this.activeGameInstance = null;
    }

    const launcherEl = document.getElementById('launcher-view');
    const stageEl = document.getElementById('stage-view');
    const mountEl = document.getElementById('game-mount');

    if (mountEl) mountEl.innerHTML = '';
    if (stageEl) stageEl.classList.remove('active');
    if (launcherEl) launcherEl.style.display = 'flex';

    this.renderLauncher();
  }

  bindParentGate() {
    const leftCorner = document.getElementById('gate-left');
    const rightCorner = document.getElementById('gate-right');
    const hintEl = document.getElementById('parent-gate-hint');
    const progLeft = document.getElementById('gate-progress-left');
    const progRight = document.getElementById('gate-progress-right');

    const CIRCLE_LEN = 150.8;
    let touchCount = 0;

    const startHolding = () => {
      this.isHolding = true;
      this.holdStartTime = performance.now();
      if (hintEl) hintEl.classList.add('visible');
      if (leftCorner) leftCorner.classList.add('holding');
      if (rightCorner) rightCorner.classList.add('holding');

      const updateProgress = (now) => {
        if (!this.isHolding) return;
        const elapsed = now - this.holdStartTime;
        const progress = Math.min(1, elapsed / 2000);
        const offset = CIRCLE_LEN * (1 - progress);

        if (progLeft) progLeft.style.strokeDashoffset = offset;
        if (progRight) progRight.style.strokeDashoffset = offset;

        if (progress >= 1) {
          this.stopHolding();
          this.exitToLauncher();
          return;
        }
        this.holdTimer = requestAnimationFrame(updateProgress);
      };
      this.holdTimer = requestAnimationFrame(updateProgress);
    };

    const stopHolding = () => {
      this.isHolding = false;
      if (this.holdTimer) cancelAnimationFrame(this.holdTimer);
      if (hintEl) hintEl.classList.remove('visible');
      if (leftCorner) leftCorner.classList.remove('holding');
      if (rightCorner) rightCorner.classList.remove('holding');
      if (progLeft) progLeft.style.strokeDashoffset = CIRCLE_LEN;
      if (progRight) progRight.style.strokeDashoffset = CIRCLE_LEN;
    };
    this.stopHolding = stopHolding;

    const handleTouchStart = (e) => {
      touchCount = e.touches ? e.touches.length : 2;
      // On touch devices, require holding both top corners simultaneously
      if (touchCount >= 2 || e.type === 'mousedown') {
        startHolding();
      }
    };

    const handleTouchEnd = () => {
      stopHolding();
    };

    if (leftCorner && rightCorner) {
      leftCorner.addEventListener('touchstart', handleTouchStart, { passive: true });
      leftCorner.addEventListener('touchend', handleTouchEnd);
      rightCorner.addEventListener('touchstart', handleTouchStart, { passive: true });
      rightCorner.addEventListener('touchend', handleTouchEnd);

      // PC fallback
      leftCorner.addEventListener('mousedown', startHolding);
      window.addEventListener('mouseup', stopHolding);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});