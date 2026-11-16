/**
 * @file src/games/pasture-fence-hopper.js
 * @description Kinematic Action & Physics Module (K-03): Pasture Fence Hopper.
 *              100% pure ASCII source with Unicode escapes so Windows clipboard never garbles icons.
 */

const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

const SKY_THEMES = [
  {
    name: 'day',
    top: '#bae6fd',
    bottom: '#e0f2fe',
    sunColor: '#facc15',
    starsOpacity: '0'
  },
  {
    name: 'sunset',
    top: '#fdba74',
    bottom: '#fef08a',
    sunColor: '#f97316',
    starsOpacity: '0.25'
  },
  {
    name: 'night',
    top: '#1e293b',
    bottom: '#334155',
    sunColor: '#f8fafc',
    starsOpacity: '0.9'
  }
];

const OBSTACLE_TEMPLATES = {
  fence: {
    type: 'fence',
    points: 1,
    width: 58,
    height: 76,
    yOffsetFromGround: 0,
    svg:
      '<svg viewBox="0 0 64 84" width="64" height="84">' +
      '<path d="M10 18 L18 6 L26 18 V80 H10 Z" fill="#ffffff" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M38 18 L46 6 L54 18 V80 H38 Z" fill="#ffffff" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="4" y="28" width="56" height="12" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="3.5"/>' +
      '<rect x="4" y="52" width="56" height="12" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="3.5"/>' +
      '</svg>'
  },
  bale: {
    type: 'bale',
    points: 1,
    width: 68,
    height: 64,
    yOffsetFromGround: 0,
    svg:
      '<svg viewBox="0 0 76 70" width="76" height="70">' +
      '<rect x="6" y="10" width="64" height="54" rx="10" fill="#facc15" stroke="#0f172a" stroke-width="4"/>' +
      '<line x1="24" y1="10" x2="24" y2="64" stroke="#ca8a04" stroke-width="4"/>' +
      '<line x1="52" y1="10" x2="52" y2="64" stroke="#ca8a04" stroke-width="4"/>' +
      '<line x1="14" y1="28" x2="62" y2="28" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
  },
  puddle: {
    type: 'puddle',
    points: 1,
    width: 82,
    height: 36,
    yOffsetFromGround: 0,
    svg:
      '<svg viewBox="0 0 92 42" width="92" height="42">' +
      '<ellipse cx="46" cy="26" rx="42" ry="12" fill="#38bdf8" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="36" cy="23" rx="18" ry="5" fill="#bae6fd"/>' +
      '<path d="M22 14 Q26 4 30 14" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M64 12 Q68 2 72 12" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>'
  },
  doubleBale: {
    type: 'doubleBale',
    points: 2,
    width: 88,
    height: 108,
    yOffsetFromGround: 0,
    svg:
      '<svg viewBox="0 0 96 116" width="96" height="116">' +
      '<rect x="4" y="62" width="44" height="48" rx="8" fill="#eab308" stroke="#0f172a" stroke-width="4"/>' +
      '<rect x="48" y="62" width="44" height="48" rx="8" fill="#facc15" stroke="#0f172a" stroke-width="4"/>' +
      '<rect x="24" y="14" width="48" height="50" rx="8" fill="#fde047" stroke="#0f172a" stroke-width="4"/>' +
      '<rect x="34" y="24" width="28" height="28" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<text x="48" y="45" text-anchor="middle" font-size="18" font-weight="900" fill="#ffffff" font-family="system-ui, sans-serif">+2</text>' +
      '</svg>'
  },
  barnOwl: {
    type: 'barnOwl',
    points: 2,
    width: 68,
    height: 56,
    yOffsetFromGround: 118,
    svg:
      '<svg viewBox="0 0 84 68" width="84" height="68">' +
      '<path d="M6 34 Q24 8 42 28 Q60 8 78 34 Q60 28 42 42 Q24 28 6 34 Z" fill="#b45309" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="42" cy="36" rx="18" ry="20" fill="#fde68a" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="35" cy="32" r="5" fill="#0f172a"/>' +
      '<circle cx="49" cy="32" r="5" fill="#0f172a"/>' +
      '<polygon points="39,38 45,38 42,45" fill="#f97316"/>' +
      '<rect x="28" y="2" width="28" height="20" rx="6" fill="#2563eb" stroke="#0f172a" stroke-width="2.5"/>' +
      '<text x="42" y="17" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff" font-family="system-ui, sans-serif">+2</text>' +
      '</svg>'
  }
};

export default class PastureFenceHopperGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.cleanups = [];
    this.timers = [];
    this.rafId = null;

    this.level = 1;
    this.count = 0;
    this.bestCount = 0;

    this.groundY = 430;
    this.sheepX = 180;
    this.sheepY = 430;
    this.sheepVy = 0;
    this.sheepWidth = 78;
    this.sheepHeight = 68;

    this.jumpsRemaining = 1;
    this.jumpBufferMs = 0;
    this.bumpCooldownMs = 0;
    this.legPhase = 0;

    this.baseSpeed = 250;
    this.currentSpeed = 250;
    this.maxSpeed = 430;

    this.obstacles = [];
    this.spawnTimerSec = 1.2;
    this.lastFrameTime = 0;
  }

  mount(containerEl, audioApi, speechApi) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.level = 1;
    this.count = 0;
    this.bestCount = 0;

    this.renderStage();
    this._resetPhysicsState(true);
    this._bindInputs();

    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  _resetPhysicsState(announceStart) {
    this.count = 0;
    this.sheepY = this.groundY;
    this.sheepVy = 0;
    this.jumpsRemaining = this.level === 1 ? 1 : 2;
    this.jumpBufferMs = 0;

    if (this.level === 1) {
      this.baseSpeed = 245;
      this.maxSpeed = 425;
    } else {
      this.baseSpeed = 295;
      this.maxSpeed = 590;
    }
    this.currentSpeed = this.baseSpeed;

    this.obstacles.forEach((obs) => {
      if (obs.el && obs.el.parentNode) {
        obs.el.parentNode.removeChild(obs.el);
      }
    });
    this.obstacles = [];
    this.spawnTimerSec = 1.1;

    this._updateScoreUI();
    this._updateSkyTheme();

    if (announceStart) {
      const promptText =
        this.level === 1
          ? 'Tap anywhere to jump the sheep and count!'
          : 'Stage Two! Tap twice in the air for a big double jump!';
      this._schedule(() => this.speech.speak(promptText), 180);
    }
  }

  renderStage() {
    const levelBtnLabel =
      this.level === 1
        ? '\u2605 Stage 1: Single Hop (+1)'
        : '\u2605\u2605 Stage 2: Double Jump (+1 / +2)';

    this.container.innerHTML =
      '<style>' +
      '.pfh-root {' +
      '  width: 100%; height: 100%; position: relative; overflow: hidden;' +
      '  display: flex; flex-direction: column; justify-content: space-between;' +
      '  touch-action: none; user-select: none; background: #22c55e;' +
      '}' +
      '.pfh-top-bar {' +
      '  position: relative; z-index: 40; display: flex; align-items: center;' +
      '  justify-content: center; gap: 14px; padding: 12px 110px 0 110px; flex-wrap: wrap;' +
      '}' +
      '.pfh-btn {' +
      '  min-height: 74px; padding: 8px 20px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.08rem; font-weight: 800; color: #0f172a;' +
      '  display: flex; align-items: center; gap: 10px; cursor: pointer;' +
      '}' +
      '.pfh-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #0f172a; }' +
      '.pfh-level-btn { background: #fef08a; }' +
      '.pfh-best-pill {' +
      '  min-height: 74px; padding: 8px 20px; border-radius: 999px;' +
      '  background: #fef3c7; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.15rem; font-weight: 900; color: #92400e;' +
      '  display: flex; align-items: center; gap: 8px;' +
      '}' +
      '.pfh-sky-counter-wrap {' +
      '  position: absolute; top: 104px; left: 50%; transform: translateX(-50%);' +
      '  z-index: 25; display: flex; flex-direction: column; align-items: center;' +
      '  pointer-events: none;' +
      '}' +
      '.pfh-sky-counter {' +
      '  min-width: 150px; text-align: center; background: rgba(255, 255, 255, 0.92);' +
      '  border: 6px solid #0f172a; border-radius: 32px; padding: 6px 32px;' +
      '  font-size: clamp(3.2rem, 7vw, 5.2rem); font-weight: 900; color: #0f172a;' +
      '  box-shadow: 0 8px 0 #0f172a; transition: transform 0.16s ease, background-color 0.2s ease;' +
      '}' +
      '.pfh-sky-counter.pop { transform: scale(1.22); background: #dcfce7; }' +
      '.pfh-sky-counter.bump { transform: scale(0.9); background: #fee2e2; }' +
      '.pfh-tap-hint {' +
      '  margin-top: 8px; background: rgba(15, 23, 42, 0.78); color: #ffffff;' +
      '  padding: 5px 16px; border-radius: 999px; font-size: 0.95rem; font-weight: 700;' +
      '}' +
      '.pfh-world-svg {' +
      '  position: absolute; inset: 0; width: 100%; height: 100%; z-index: 10;' +
      '}' +
      '</style>' +
      '<div class="pfh-root" id="pfh-tap-stage">' +
      '  <div class="pfh-top-bar">' +
      '    <button type="button" class="pfh-btn" id="pfh-repeat-btn">' +
      '      <span style="font-size:1.4rem;">\u266B</span>' +
      '      <span>Tap Anywhere to Jump!</span>' +
      '    </button>' +
      '    <button type="button" class="pfh-btn pfh-level-btn" id="pfh-level-btn">' +
      levelBtnLabel +
      '    </button>' +
      '    <div class="pfh-best-pill" id="pfh-best-badge">\u2605 Best: 0</div>' +
      '  </div>' +
      '  <div class="pfh-sky-counter-wrap">' +
      '    <div class="pfh-sky-counter" id="pfh-counter-box">0</div>' +
      '    <div class="pfh-tap-hint" id="pfh-sub-hint">' +
      (this.level === 1
        ? 'Tap screen to hop over fences!'
        : 'Tap twice in mid-air for Double Jump!') +
      '    </div>' +
      '  </div>' +
      '  <svg class="pfh-world-svg" id="pfh-world" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet">' +
      '    <defs>' +
      '      <linearGradient id="pfh-sky-grad" x1="0" y1="0" x2="0" y2="1">' +
      '        <stop id="pfh-sky-top" offset="0%" stop-color="#bae6fd" />' +
      '        <stop id="pfh-sky-bot" offset="100%" stop-color="#e0f2fe" />' +
      '      </linearGradient>' +
      '    </defs>' +
      /* Wide bleed sky & ground (-500..1500) prevent side bars on 20:9 phones while keeping 1:1 round shapes */
      '    <rect x="-500" y="-300" width="2000" height="730" fill="url(#pfh-sky-grad)" />' +
      '    <g id="pfh-stars-group" opacity="0" style="transition: opacity 0.8s ease;">' +
      '      <circle cx="140" cy="80" r="3.5" fill="#fef08a"/>' +
      '      <circle cx="290" cy="120" r="4" fill="#ffffff"/>' +
      '      <circle cx="680" cy="90" r="3.5" fill="#fef08a"/>' +
      '      <circle cx="820" cy="140" r="4.5" fill="#ffffff"/>' +
      '      <circle cx="490" cy="60" r="3.5" fill="#fef08a"/>' +
      '    </g>' +
      '    <circle id="pfh-celestial" cx="860" cy="115" r="44" fill="#facc15" stroke="#0f172a" stroke-width="4"/>' +
      '    <path d="M-400 430 Q60 350 520 430 T1400 410 L1400 430 L-400 430 Z" fill="#86efac" opacity="0.65"/>' +
      '    <rect x="-500" y="430" width="2000" height="400" fill="#22c55e" stroke="#0f172a" stroke-width="5"/>' +
      '    <rect x="-500" y="446" width="2000" height="24" fill="#16a34a" opacity="0.45"/>' +
      '    <g id="pfh-obstacles-group"></g>' +
      '    <g id="pfh-particles-group"></g>' +
      '    <g id="pfh-sheep-group" transform="translate(180, 362)">' +
      '      <line id="pfh-leg-back" x1="22" y1="50" x2="18" y2="68" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>' +
      '      <line id="pfh-leg-front" x1="52" y1="50" x2="56" y2="68" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>' +
      '      <circle cx="20" cy="34" r="16" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
      '      <circle cx="52" cy="34" r="16" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
      '      <circle cx="36" cy="22" r="18" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
      '      <circle cx="36" cy="40" r="16" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
      '      <circle cx="64" cy="26" r="14" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '      <ellipse cx="56" cy="18" rx="7" ry="4" transform="rotate(-25 56 18)" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '      <circle cx="68" cy="23" r="3.5" fill="#ffffff"/>' +
      '      <path d="M63 32 Q68 36 73 31" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>' +
      '    </g>' +
      '  </svg>' +
      '</div>';
  }

  _bindInputs() {
    const repeatBtn = this.container.querySelector('#pfh-repeat-btn');
    const levelBtn = this.container.querySelector('#pfh-level-btn');
    const stageEl = this.container.querySelector('#pfh-tap-stage');

    if (repeatBtn) {
      repeatBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.audio.playNote(523.25, 0.12);
        this.speech.speak(
          this.level === 1
            ? 'Tap anywhere to jump over the fences and count!'
            : 'Stage Two! Tap twice in the air for a double jump!'
        );
      });
    }

    if (levelBtn) {
      levelBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.level = this.level === 1 ? 2 : 1;
        this.audio.playSuccessChord();
        this.renderStage();
        this._bindInputs();
        this._resetPhysicsState(true);
      });
    }

    const handleStageTap = (e) => {
      const gateSize = window.innerHeight <= 520 ? 64 : 96;
      if (e.clientY < gateSize && (e.clientX < gateSize || e.clientX > window.innerWidth - gateSize)) {
        return;
      }
      this._triggerJump();
    };

    if (stageEl) {
      stageEl.addEventListener('pointerdown', handleStageTap);
      this.cleanups.push(() => stageEl.removeEventListener('pointerdown', handleStageTap));
    }

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this._triggerJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    this.cleanups.push(() => window.removeEventListener('keydown', handleKeyDown));
  }

  _triggerJump() {
    const isGrounded = this.sheepY >= this.groundY - 2;

    if (isGrounded) {
      this.sheepVy = -650;
      this.jumpsRemaining = this.level === 1 ? 0 : 1;
      this.jumpBufferMs = 0;
      this.audio.playNote(440.0, 0.12);
      this._spawnParticles(this.sheepX + 24, this.groundY, '#ffffff', 4);
    } else if (this.level === 2 && this.jumpsRemaining > 0) {
      this.sheepVy = -590;
      this.jumpsRemaining = 0;
      this.audio.playNote(587.33, 0.14);
      this._spawnParticles(this.sheepX + 36, this.sheepY - 20, '#fef08a', 6);
    } else {
      this.jumpBufferMs = 160;
    }
  }

  _spawnObstacle() {
    const obsGroup = this.container.querySelector('#pfh-obstacles-group');
    if (!obsGroup) return;

    let pool = [
      OBSTACLE_TEMPLATES.fence,
      OBSTACLE_TEMPLATES.bale,
      OBSTACLE_TEMPLATES.puddle
    ];

    if (this.level === 2) {
      pool = [
        OBSTACLE_TEMPLATES.fence,
        OBSTACLE_TEMPLATES.bale,
        OBSTACLE_TEMPLATES.doubleBale,
        OBSTACLE_TEMPLATES.doubleBale,
        OBSTACLE_TEMPLATES.barnOwl
      ];
    }

    const template = pool[Math.floor(Math.random() * pool.length)];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = template.svg;

    // Spawn slightly further right (1220) so obstacles enter cleanly past ultra-wide mobile bleed edges
    const x = 1220;
    const y = this.groundY - template.height - template.yOffsetFromGround;
    g.setAttribute('transform', 'translate(' + x + ', ' + y + ')');
    obsGroup.appendChild(g);

    this.obstacles.push({
      template: template,
      x: x,
      y: y,
      width: template.width,
      height: template.height,
      passed: false,
      bumped: false,
      el: g
    });
  }

  _spawnParticles(cx, cy, fillHex, count) {
    const pGroup = this.container.querySelector('#pfh-particles-group');
    if (!pGroup) return;

    for (let i = 0; i < count; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const angle = (Math.PI * 2 * i) / count;
      const vx = Math.cos(angle) * 28;
      const vy = Math.sin(angle) * 24 - 14;
      circle.setAttribute('cx', String(cx + vx));
      circle.setAttribute('cy', String(cy + vy));
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', fillHex);
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', '2.5');
      pGroup.appendChild(circle);

      this._schedule(() => {
        if (circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      }, 320);
    }
  }

  _updateScoreUI(stateClass) {
    const counterBox = this.container.querySelector('#pfh-counter-box');
    const bestBadge = this.container.querySelector('#pfh-best-badge');

    if (counterBox) {
      counterBox.textContent = String(this.count);
      counterBox.classList.remove('pop', 'bump');
      if (stateClass) {
        counterBox.classList.add(stateClass);
        this._schedule(() => counterBox.classList.remove(stateClass), 220);
      }
    }

    if (bestBadge) {
      bestBadge.textContent = '\u2605 Best: ' + this.bestCount;
    }
  }

  _updateSkyTheme() {
    const themeIdx = Math.floor(this.count / 10) % SKY_THEMES.length;
    const theme = SKY_THEMES[themeIdx];

    const skyTop = this.container.querySelector('#pfh-sky-top');
    const skyBot = this.container.querySelector('#pfh-sky-bot');
    const celestial = this.container.querySelector('#pfh-celestial');
    const starsGroup = this.container.querySelector('#pfh-stars-group');

    if (skyTop) skyTop.setAttribute('stop-color', theme.top);
    if (skyBot) skyBot.setAttribute('stop-color', theme.bottom);
    if (celestial) celestial.setAttribute('fill', theme.sunColor);
    if (starsGroup) starsGroup.setAttribute('opacity', theme.starsOpacity);
  }

  _handleClearedObstacle(obs) {
    obs.passed = true;
    const pointsAdded = obs.template.points || 1;
    this.count += pointsAdded;
    if (this.count > this.bestCount) {
      this.bestCount = this.count;
    }

    const speedMultiplier = this.level === 1 ? 1.04 : 1.06;
    this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed * speedMultiplier);

    const noteIdx = this.count % PENTATONIC_SCALE.length;
    this.audio.playNote(PENTATONIC_SCALE[noteIdx], 0.2);

    if (this.count % 5 === 0) {
      this._schedule(() => this.audio.playSuccessChord(), 90);
      this._spawnParticles(this.sheepX + 40, this.sheepY - 50, '#facc15', 8);
    }

    this.speech.speak(String(this.count));
    this._updateScoreUI('pop');
    this._updateSkyTheme();
  }

  _handleObstacleBump(obs) {
    obs.bumped = true;
    this.bumpCooldownMs = 450;

    this.audio.playGentleThud();
    this.sheepVy = -340;
    this.count = 0;
    this.currentSpeed = this.baseSpeed;

    this._spawnParticles(obs.x + 20, obs.y + 20, '#f59e0b', 6);
    this._updateScoreUI('bump');
    this._updateSkyTheme();

    if (obs.el) {
      obs.el.setAttribute('opacity', '0.35');
    }
  }

  _loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    if (this.jumpBufferMs > 0) {
      this.jumpBufferMs = Math.max(0, this.jumpBufferMs - dt * 1000);
    }
    if (this.bumpCooldownMs > 0) {
      this.bumpCooldownMs = Math.max(0, this.bumpCooldownMs - dt * 1000);
    }

    const speedRatio = this.currentSpeed / this.baseSpeed;
    const gravity = 1520 * Math.min(1.35, Math.max(1.0, speedRatio * 0.92));

    this.sheepVy += gravity * dt;
    this.sheepY += this.sheepVy * dt;

    if (this.sheepY >= this.groundY) {
      this.sheepY = this.groundY;
      this.sheepVy = 0;
      this.jumpsRemaining = this.level === 1 ? 1 : 2;

      if (this.jumpBufferMs > 0) {
        this._triggerJump();
      }
    }

    const sheepGroup = this.container.querySelector('#pfh-sheep-group');
    const legBack = this.container.querySelector('#pfh-leg-back');
    const legFront = this.container.querySelector('#pfh-leg-front');

    if (sheepGroup) {
      const renderY = Math.round(this.sheepY - this.sheepHeight);
      const pitchDeg = Math.max(-18, Math.min(14, this.sheepVy * 0.025));
      sheepGroup.setAttribute(
        'transform',
        'translate(' +
          this.sheepX +
          ', ' +
          renderY +
          ') rotate(' +
          pitchDeg.toFixed(1) +
          ' 38 34)'
      );
    }

    if (legBack && legFront) {
      if (this.sheepY >= this.groundY - 2) {
        this.legPhase += dt * (this.currentSpeed * 0.045);
        const swing = Math.sin(this.legPhase) * 9;
        legBack.setAttribute('x2', String(20 + swing));
        legFront.setAttribute('x2', String(54 - swing));
      } else {
        legBack.setAttribute('x2', '12');
        legFront.setAttribute('x2', '62');
      }
    }

    this.spawnTimerSec -= dt;
    if (this.spawnTimerSec <= 0) {
      this._spawnObstacle();
      const minGapSec = Math.max(1.25, 2.35 - (this.currentSpeed - this.baseSpeed) * 0.0025);
      this.spawnTimerSec = minGapSec + Math.random() * 0.65;
    }

    const sheepBox = {
      left: this.sheepX + 16,
      right: this.sheepX + this.sheepWidth - 16,
      top: this.sheepY - this.sheepHeight + 14,
      bottom: this.sheepY - 8
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.currentSpeed * dt;

      if (obs.el) {
        obs.el.setAttribute(
          'transform',
          'translate(' + Math.round(obs.x) + ', ' + Math.round(obs.y) + ')'
        );
      }

      if (!obs.bumped && this.bumpCooldownMs <= 0) {
        const obsBox = {
          left: obs.x + 10,
          right: obs.x + obs.width - 10,
          top: obs.y + 10,
          bottom: obs.y + obs.height - 6
        };

        const overlaps =
          sheepBox.right > obsBox.left &&
          sheepBox.left < obsBox.right &&
          sheepBox.bottom > obsBox.top &&
          sheepBox.top < obsBox.bottom;

        if (overlaps) {
          this._handleObstacleBump(obs);
        }
      }

      if (!obs.passed && !obs.bumped && obs.x + obs.width < this.sheepX + 10) {
        this._handleClearedObstacle(obs);
      }

      if (obs.x < -340) {
        if (obs.el && obs.el.parentNode) {
          obs.el.parentNode.removeChild(obs.el);
        }
        this.obstacles.splice(i, 1);
      }
    }

    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  unmount() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (this.speech) this.speech.cancel();
    if (this.container) this.container.innerHTML = '';
  }
}