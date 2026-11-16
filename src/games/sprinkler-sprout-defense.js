/**
 * @file src/games/sprinkler-sprout-defense.js
 * @description Kinematic Action & Physics Module (K-02): Sprinkler Sprout Defense.
 *              Non-violent agricultural Space Invaders adaptation teaching 2D horizontal
 *              coordinate alignment (Stage 1) and selective color/attribute filtering (Stage 2).
 *              100% pure ASCII with Unicode escapes and zero template literals.
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

const NUMBER_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve'
];

const STAGE1_WATER_COLOR = {
  id: 'blue',
  label: 'BLUE',
  hex: '#0284c7',
  lightHex: '#7dd3fc',
  dropletHex: '#0ea5e9',
  dropletHighlightHex: '#bae6fd'
};

const STAGE2_COLORS = [
  {
    id: 'red',
    label: 'RED',
    hex: '#dc2626',
    lightHex: '#fecaca',
    dropletHex: '#ef4444',
    dropletHighlightHex: '#fecaca'
  },
  {
    id: 'yellow',
    label: 'YELLOW',
    hex: '#eab308',
    lightHex: '#fef08a',
    dropletHex: '#facc15',
    dropletHighlightHex: '#fef9c3'
  },
  {
    id: 'purple',
    label: 'PURPLE',
    hex: '#7c3aed',
    lightHex: '#ddd6fe',
    dropletHex: '#8b5cf6',
    dropletHighlightHex: '#ede9fe'
  }
];

export default class SprinklerSproutDefenseGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.cleanups = [];
    this.timers = [];
    this.rafId = null;

    // Virtual 1000 x 560 landscape coordinate system
    this.worldWidth = 1000;
    this.worldHeight = 560;

    this.level = 1;
    this.wateredCount = 0;
    this.targetGoal = 8;
    this.waveNumber = 1;
    this.waveCelebrating = false;

    // Stage 2 Selective Color Filter Rule
    this.targetColorObj = STAGE2_COLORS[0];

    // Bottom Water Sprinkler Cart State
    this.cartWidth = 136;
    this.cartHeight = 64;
    this.cartX = 500 - 68;
    this.cartY = 456;
    this.nozzlePulse = 0;

    // Auto-Firing Water Droplets State
    this.isSpraying = false;
    this.sprayTimerMs = 0;
    this.sprayIntervalMs = 350;
    this.droplets = [];

    // Drifting Sky Targets (Clouds / Sprouts / Bees) with independent row directions
    this.targets = [];
    this.rowDirs = [1, -1];
    this.rowSpeeds = [54, 68];

    // Keyboard state
    this.keysHeld = { left: false, right: false, spray: false };
    this.lastFrameTime = 0;
  }

  mount(containerEl, audioApi, speechApi) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;

    this.level = 1;
    this.waveNumber = 1;

    this.renderStage();
    this._startWave(true);
    this._bindInputs();

    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  _getActiveSprinklerPalette() {
    return this.level === 1 ? STAGE1_WATER_COLOR : this.targetColorObj;
  }

  _clearEntities() {
    this.droplets.forEach((d) => {
      if (d.el && d.el.parentNode) d.el.parentNode.removeChild(d.el);
    });
    this.droplets = [];

    this.targets.forEach((t) => {
      if (t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el);
    });
    this.targets = [];
  }

  _startWave(announce) {
    this._clearEntities();
    this.wateredCount = 0;
    this.waveCelebrating = false;

    this.rowDirs = [1, -1];
    this.rowSpeeds = this.level === 1 ? [52, 64] : [60, 78];

    const targetsLayer = this.container.querySelector('#ssd-targets-layer');
    if (!targetsLayer) return;

    if (this.level === 1) {
      this.targetGoal = 8;
      const cols = 4;
      const rows = 2;
      const spacingX = 185;
      const startY = 148;
      const spacingY = 98;

      let idCounter = 0;
      for (let r = 0; r < rows; r++) {
        const rowStartX = r === 0 ? 155 : 225;
        for (let c = 0; c < cols; c++) {
          const tx = rowStartX + c * spacingX;
          const ty = startY + r * spacingY;
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.innerHTML = this._buildThirstyCloudSvg();
          g.setAttribute('transform', 'translate(' + tx + ', ' + ty + ')');
          targetsLayer.appendChild(g);

          this.targets.push({
            id: idCounter++,
            row: r,
            type: 'cloud',
            isTarget: true,
            watered: false,
            x: tx,
            y: ty,
            radius: 44,
            wobbleMs: 0,
            el: g
          });
        }
      }
    } else {
      this.targetColorObj = STAGE2_COLORS[(this.waveNumber - 1) % STAGE2_COLORS.length];
      const otherColors = STAGE2_COLORS.filter((c) => c.id !== this.targetColorObj.id);
      this.targetGoal = 4;

      const topRowSpecs = [
        { type: 'cloud', colorObj: this.targetColorObj, isTarget: true },
        { type: 'cloud', colorObj: this.targetColorObj, isTarget: true },
        { type: 'cloud', colorObj: otherColors[0], isTarget: false },
        { type: 'bee', colorObj: null, isTarget: false }
      ];
      const bottomRowSpecs = [
        { type: 'cloud', colorObj: this.targetColorObj, isTarget: true },
        { type: 'cloud', colorObj: this.targetColorObj, isTarget: true },
        { type: 'cloud', colorObj: otherColors[1], isTarget: false },
        { type: 'bee', colorObj: null, isTarget: false }
      ];

      const shuffleRow = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
        }
      };
      shuffleRow(topRowSpecs);
      shuffleRow(bottomRowSpecs);

      const allRows = [topRowSpecs, bottomRowSpecs];
      const spacingX = 185;
      const startY = 148;
      const spacingY = 104;

      let idCounter = 0;
      for (let r = 0; r < allRows.length; r++) {
        const rowStartX = r === 0 ? 150 : 220;
        const rowSpecs = allRows[r];
        for (let c = 0; c < rowSpecs.length; c++) {
          const spec = rowSpecs[c];
          const tx = rowStartX + c * spacingX;
          const ty = startY + r * spacingY;

          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          if (spec.type === 'bee') {
            g.innerHTML = this._buildSleepyBeeSvg();
          } else {
            g.innerHTML = this._buildColoredBudCloudSvg(spec.colorObj);
          }
          g.setAttribute('transform', 'translate(' + tx + ', ' + ty + ')');
          targetsLayer.appendChild(g);

          this.targets.push({
            id: idCounter++,
            row: r,
            type: spec.type,
            colorObj: spec.colorObj,
            isTarget: spec.isTarget,
            watered: false,
            x: tx,
            y: ty,
            radius: 44,
            wobbleMs: 0,
            el: g
          });
        }
      }
    }

    const cartGroup = this.container.querySelector('#ssd-cart-group');
    if (cartGroup) {
      cartGroup.innerHTML = this._buildSprinklerCartSvg(this.cartWidth, this.cartHeight);
    }

    this._updateHud();

    if (announce) {
      const promptMsg =
        this.level === 1
          ? 'Slide the sprinkler cart to water all the thirsty clouds!'
          : 'Stage Two! Use the ' +
            this.targetColorObj.label +
            ' sprinkler to water the ' +
            this.targetColorObj.label +
            ' flower clouds!';
      this._schedule(() => this.speech.speak(promptMsg), 180);
    }
  }

  _buildThirstyCloudSvg() {
    return (
      '<path d="M0 -24 Q-12 -42 -2 -44 Q4 -34 0 -24" fill="#22c55e" stroke="#0f172a" stroke-width="3"/>' +
      '<path d="M0 -24 Q12 -42 2 -44 Q-4 -34 0 -24" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="-22" cy="4" r="20" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="22" cy="4" r="20" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="0" cy="-8" r="24" fill="#e2e8f0" stroke="#0f172a" stroke-width="4"/>' +
      '<rect x="-24" y="4" width="48" height="20" rx="8" fill="#e2e8f0"/>' +
      '<line x1="-22" y1="24" x2="22" y2="24" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="-9" cy="0" r="3.5" fill="#0f172a"/>' +
      '<circle cx="9" cy="0" r="3.5" fill="#0f172a"/>' +
      '<path d="M-6 9 Q0 14 6 9" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>'
    );
  }

  _buildColoredBudCloudSvg(colorObj) {
    return (
      '<circle cx="-12" cy="-28" r="11" fill="' +
      colorObj.hex +
      '" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="12" cy="-28" r="11" fill="' +
      colorObj.hex +
      '" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="0" cy="-34" r="13" fill="' +
      colorObj.hex +
      '" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="0" cy="-32" r="5" fill="#fef08a"/>' +
      '<circle cx="-22" cy="4" r="20" fill="' +
      colorObj.lightHex +
      '" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="22" cy="4" r="20" fill="' +
      colorObj.lightHex +
      '" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="0" cy="-8" r="23" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="-9" cy="0" r="3.5" fill="#0f172a"/>' +
      '<circle cx="9" cy="0" r="3.5" fill="#0f172a"/>' +
      '<path d="M-6 9 Q0 14 6 9" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>'
    );
  }

  _buildBloomedSunflowerSvg(petalColorHex) {
    const pColor = petalColorHex || '#facc15';
    return (
      '<path d="M-34 8 A34 34 0 0 1 34 8" fill="none" stroke="#ef4444" stroke-width="5"/>' +
      '<path d="M-29 8 A29 29 0 0 1 29 8" fill="none" stroke="#facc15" stroke-width="5"/>' +
      '<path d="M-24 8 A24 24 0 0 1 24 8" fill="none" stroke="#22c55e" stroke-width="5"/>' +
      '<circle cx="-20" cy="10" r="16" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="20" cy="10" r="16" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="0" cy="4" r="18" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<line x1="0" y1="-6" x2="0" y2="-28" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="-14" cy="-32" r="10" fill="' +
      pColor +
      '" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="14" cy="-32" r="10" fill="' +
      pColor +
      '" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="0" cy="-46" r="10" fill="' +
      pColor +
      '" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="0" cy="-18" r="10" fill="' +
      pColor +
      '" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="0" cy="-32" r="11" fill="#78350f" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="0" cy="-32" r="5" fill="#fde047"/>'
    );
  }

  _buildSleepyBeeSvg() {
    return (
      '<ellipse cx="-10" cy="-18" rx="12" ry="8" transform="rotate(-20 -10 -18)" fill="#e0f2fe" stroke="#0f172a" stroke-width="3"/>' +
      '<ellipse cx="10" cy="-18" rx="12" ry="8" transform="rotate(20 10 -18)" fill="#e0f1fe" stroke="#0f172a" stroke-width="3"/>' +
      '<ellipse cx="0" cy="0" rx="26" ry="18" fill="#facc15" stroke="#0f172a" stroke-width="4"/>' +
      '<path d="M-8 -16 V16 M6 -16 V16" stroke="#0f172a" stroke-width="6"/>' +
      '<circle cx="15" cy="-3" r="3.5" fill="#0f172a"/>' +
      '<path d="M12 6 Q16 10 20 6" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>'
    );
  }

  _buildSprinklerCartSvg(w, h) {
    const cx = Math.round(w / 2);
    const palette = this._getActiveSprinklerPalette();
    return (
      '<rect x="' +
      (cx - 12) +
      '" y="-16" width="24" height="20" rx="5" fill="' +
      palette.dropletHex +
      '" stroke="#0f172a" stroke-width="4"/>' +
      '<polygon points="' +
      (cx - 18) +
      ',-16 ' +
      (cx + 18) +
      ',-16 ' +
      (cx + 12) +
      ',-4 ' +
      (cx - 12) +
      ',-4" fill="' +
      palette.lightHex +
      '" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<rect x="0" y="0" width="' +
      w +
      '" height="' +
      (h - 14) +
      '" rx="18" fill="' +
      palette.hex +
      '" stroke="#0f172a" stroke-width="4.5"/>' +
      '<rect x="14" y="10" width="' +
      (w - 28) +
      '" height="14" rx="7" fill="' +
      palette.lightHex +
      '"/>' +
      '<rect x="8" y="' +
      (h - 18) +
      '" width="' +
      (w - 16) +
      '" height="12" rx="5" fill="#16a34a" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="28" cy="' +
      (h - 2) +
      '" r="14" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="28" cy="' +
      (h - 2) +
      '" r="6" fill="#facc15"/>' +
      '<circle cx="' +
      (w - 28) +
      '" cy="' +
      (h - 2) +
      '" r="14" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="' +
      (w - 28) +
      '" cy="' +
      (h - 2) +
      '" r="6" fill="#facc15"/>'
    );
  }

  renderStage() {
    const levelBtnLabel =
      this.level === 1
        ? '\u2605 Stage 1: Water All Clouds'
        : '\u2605\u2605 Stage 2: Color Match';

    this.container.innerHTML =
      '<style>' +
      '.ssd-root {' +
      '  width: 100%; height: 100%; position: relative; overflow: hidden;' +
      '  touch-action: none; user-select: none; background: #22c55e;' +
      '}' +
      '.ssd-top-bar {' +
      '  position: relative; z-index: 40; display: flex; align-items: center;' +
      '  justify-content: center; gap: 14px; padding: 10px 110px 0 110px; flex-wrap: wrap;' +
      '}' +
      '.ssd-btn {' +
      '  min-height: 70px; padding: 6px 20px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.05rem; font-weight: 800; color: #0f172a;' +
      '  display: flex; align-items: center; gap: 10px; cursor: pointer;' +
      '}' +
      '.ssd-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #0f172a; }' +
      '.ssd-level-btn { background: #fef08a; }' +
      '.ssd-swatch {' +
      '  display: inline-block; width: 20px; height: 20px; border-radius: 50%;' +
      '  border: 2.5px solid #0f172a; vertical-align: middle;' +
      '}' +
      '.ssd-score-pill {' +
      '  min-height: 70px; padding: 6px 22px; border-radius: 999px;' +
      '  background: #dcfce7; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.4rem; font-weight: 900; color: #166534;' +
      '  display: flex; align-items: center; gap: 8px; transition: transform 0.15s ease;' +
      '}' +
      '.ssd-score-pill.pop { transform: scale(1.18); background: #fef08a; color: #92400e; }' +
      '.ssd-world-svg {' +
      '  position: absolute; inset: 0; width: 100%; height: 100%; z-index: 10;' +
      '}' +
      '</style>' +
      '<div class="ssd-root" id="ssd-stage">' +
      '  <div class="ssd-top-bar">' +
      '    <button type="button" class="ssd-btn" id="ssd-repeat-btn">' +
      '      <span style="font-size:1.4rem;">\u266B</span>' +
      '      <span id="ssd-prompt-label">Slide to Water the Clouds!</span>' +
      '    </button>' +
      '    <button type="button" class="ssd-btn ssd-level-btn" id="ssd-level-btn">' +
      levelBtnLabel +
      '    </button>' +
      '    <div class="ssd-score-pill" id="ssd-score-pill">Bloomed: 0 / 8</div>' +
      '  </div>' +
      '  <svg class="ssd-world-svg" id="ssd-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet">' +
      '    <defs>' +
      '      <linearGradient id="ssd-sky" x1="0" y1="0" x2="0" y2="1">' +
      '        <stop offset="0%" stop-color="#bae6fd" />' +
      '        <stop offset="100%" stop-color="#f0f9ff" />' +
      '      </linearGradient>' +
      '    </defs>' +
      /* Wide bleed sky & pasture (-500..1500) prevent side bars while keeping clouds & wheels 1:1 round */
      '    <rect x="-500" y="-300" width="2000" height="795" fill="url(#ssd-sky)" />' +
      '    <g id="ssd-wave-rainbow" opacity="0" style="transition: opacity 0.45s ease;">' +
      '      <path d="M140 495 A360 320 0 0 1 860 495" fill="none" stroke="#ef4444" stroke-width="18" opacity="0.45"/>' +
      '      <path d="M158 495 A342 302 0 0 1 842 495" fill="none" stroke="#facc15" stroke-width="18" opacity="0.45"/>' +
      '      <path d="M176 495 A324 284 0 0 1 824 495" fill="none" stroke="#22c55e" stroke-width="18" opacity="0.45"/>' +
      '      <path d="M194 495 A306 266 0 0 1 806 495" fill="none" stroke="#3b82f6" stroke-width="18" opacity="0.45"/>' +
      '    </g>' +
      '    <rect x="-500" y="495" width="2000" height="350" fill="#22c55e" stroke="#0f172a" stroke-width="5"/>' +
      '    <line x1="-460" y1="518" x2="1460" y2="518" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>' +
      '    <g id="ssd-droplets-layer"></g>' +
      '    <g id="ssd-targets-layer"></g>' +
      '    <g id="ssd-particles-layer"></g>' +
      '    <g id="ssd-cart-group" transform="translate(' +
      this.cartX +
      ', ' +
      this.cartY +
      ')" style="cursor: grab;">' +
      this._buildSprinklerCartSvg(this.cartWidth, this.cartHeight) +
      '    </g>' +
      '  </svg>' +
      '</div>';
  }

  _updateHud(popAnim) {
    const promptLabel = this.container.querySelector('#ssd-prompt-label');
    const scorePill = this.container.querySelector('#ssd-score-pill');

    if (promptLabel) {
      if (this.level === 1) {
        promptLabel.innerHTML = 'Water All the Clouds!';
      } else {
        promptLabel.innerHTML =
          'Water <span class="ssd-swatch" style="background:' +
          this.targetColorObj.hex +
          ';"></span> ' +
          this.targetColorObj.label +
          ' Clouds!';
      }
    }

    if (scorePill) {
      scorePill.textContent =
        'Bloomed: ' + this.wateredCount + ' / ' + this.targetGoal;
      scorePill.classList.remove('pop');
      if (popAnim) {
        scorePill.classList.add('pop');
        this._schedule(() => scorePill.classList.remove('pop'), 220);
      }
    }
  }

  /**
   * Maps screen clientX directly into the 1000-unit SVG coordinate space via getScreenCTM()
   * so pointer tracking stays 1:1 locked under the child's finger on ultra-wide 20:9 phones.
   */
  _clientXToWorldX(svgEl, clientX) {
    if (!svgEl) return 500;
    try {
      const ctm = svgEl.getScreenCTM();
      if (ctm && ctm.a !== 0) {
        return (clientX - ctm.e) / ctm.a;
      }
    } catch (_) {}
    const rect = svgEl.getBoundingClientRect();
    return rect.width > 0 ? ((clientX - rect.left) / rect.width) * this.worldWidth : 500;
  }

  _bindInputs() {
    const repeatBtn = this.container.querySelector('#ssd-repeat-btn');
    const levelBtn = this.container.querySelector('#ssd-level-btn');
    const stageEl = this.container.querySelector('#ssd-stage');
    const svgEl = this.container.querySelector('#ssd-svg');

    if (repeatBtn) {
      repeatBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.audio.playNote(523.25, 0.12);
        this.speech.speak(
          this.level === 1
            ? 'Slide the sprinkler cart to water all the thirsty clouds!'
            : 'Use the ' +
                this.targetColorObj.label +
                ' sprinkler to water the ' +
                this.targetColorObj.label +
                ' flower clouds!'
        );
      });
    }

    if (levelBtn) {
      levelBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.level = this.level === 1 ? 2 : 1;
        this.waveNumber = 1;
        this.audio.playSuccessChord();
        this.renderStage();
        this._startWave(true);
        this._bindInputs();
      });
    }

    let activePointerId = null;

    const moveCartToClientX = (clientX) => {
      const worldX = this._clientXToWorldX(svgEl, clientX);
      const minX = 40;
      const maxX = this.worldWidth - 40 - this.cartWidth;
      this.cartX = Math.max(minX, Math.min(maxX, worldX - this.cartWidth / 2));
    };

    const onPointerDown = (e) => {
      const topDeadzone = window.innerHeight <= 520 ? 54 : 96;
      if (e.clientY < topDeadzone) return;
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      moveCartToClientX(e.clientX);
      this.isSpraying = true;
      this._fireWaterDroplet();
      this.sprayTimerMs = this.sprayIntervalMs;
    };

    const onPointerMove = (e) => {
      const topDeadzone = window.innerHeight <= 520 ? 54 : 96;
      if (e.pointerId === activePointerId) {
        moveCartToClientX(e.clientX);
      } else if (e.pointerType === 'mouse' && e.clientY >= topDeadzone) {
        moveCartToClientX(e.clientX);
        if (e.buttons === 1) {
          this.isSpraying = true;
        }
      }
    };

    const onPointerUp = (e) => {
      if (e.pointerId === activePointerId) {
        activePointerId = null;
        this.isSpraying = false;
      }
    };

    if (stageEl) {
      stageEl.addEventListener('pointerdown', onPointerDown);
      stageEl.addEventListener('pointermove', onPointerMove);
      stageEl.addEventListener('pointerup', onPointerUp);
      stageEl.addEventListener('pointercancel', onPointerUp);

      this.cleanups.push(() => {
        stageEl.removeEventListener('pointerdown', onPointerDown);
        stageEl.removeEventListener('pointermove', onPointerMove);
        stageEl.removeEventListener('pointerup', onPointerUp);
        stageEl.removeEventListener('pointercancel', onPointerUp);
      });
    }

    const onKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keysHeld.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keysHeld.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!this.keysHeld.spray) {
          this._fireWaterDroplet();
          this.sprayTimerMs = this.sprayIntervalMs;
        }
        this.keysHeld.spray = true;
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keysHeld.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keysHeld.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp') this.keysHeld.spray = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });
  }

  _fireWaterDroplet() {
    if (this.waveCelebrating) return;
    const dropletsLayer = this.container.querySelector('#ssd-droplets-layer');
    if (!dropletsLayer) return;

    const nozzleX = this.cartX + this.cartWidth / 2;
    const nozzleY = this.cartY - 18;
    const palette = this._getActiveSprinklerPalette();

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML =
      '<path d="M0 16 C-10 2, -12 -10, 0 -16 C12 -10, 10 2, 0 16 Z" fill="' +
      palette.dropletHex +
      '" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="-3" cy="-6" r="3.5" fill="' +
      palette.dropletHighlightHex +
      '"/>';
    g.setAttribute('transform', 'translate(' + Math.round(nozzleX) + ', ' + Math.round(nozzleY) + ')');
    dropletsLayer.appendChild(g);

    this.droplets.push({
      x: nozzleX,
      y: nozzleY,
      vy: -470,
      radius: 14,
      el: g
    });

    this.nozzlePulse = 1.0;
    this.audio.playNote(392.0, 0.07);
  }

  _spawnSplashParticles(cx, cy, colorHex, count) {
    const pLayer = this.container.querySelector('#ssd-particles-layer');
    if (!pLayer) return;

    for (let i = 0; i < count; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const angle = (Math.PI * 2 * i) / count;
      const px = cx + Math.cos(angle) * 34;
      const py = cy + Math.sin(angle) * 28;
      circle.setAttribute('cx', String(Math.round(px)));
      circle.setAttribute('cy', String(Math.round(py)));
      circle.setAttribute('r', '7.5');
      circle.setAttribute('fill', colorHex);
      circle.setAttribute('stroke', '#0f172a');
      circle.setAttribute('stroke-width', '2.5');
      pLayer.appendChild(circle);

      this._schedule(() => {
        if (circle.parentNode) circle.parentNode.removeChild(circle);
      }, 320);
    }
  }

  _handleDropletHitTarget(target) {
    const palette = this._getActiveSprinklerPalette();
    if (target.isTarget) {
      target.watered = true;
      this.wateredCount += 1;

      const petalHex =
        target.colorObj && target.colorObj.hex ? target.colorObj.hex : '#facc15';
      if (target.el) {
        target.el.innerHTML = this._buildBloomedSunflowerSvg(petalHex);
      }

      const noteHz = PENTATONIC_SCALE[this.wateredCount % PENTATONIC_SCALE.length];
      this.audio.playNote(noteHz, 0.22);
      this._spawnSplashParticles(target.x, target.y, palette.dropletHex, 6);

      const word = NUMBER_WORDS[this.wateredCount] || String(this.wateredCount);
      this.speech.speak(word);
      this._updateHud(true);

      if (this.wateredCount >= this.targetGoal) {
        this._completeWave();
      }
    } else {
      target.wobbleMs = 360;
      this.audio.playGentleThud();
      this._spawnSplashParticles(target.x, target.y, '#fef08a', 4);
    }
  }

  _completeWave() {
    this.waveCelebrating = true;
    const rainbowEl = this.container.querySelector('#ssd-wave-rainbow');
    if (rainbowEl) {
      rainbowEl.setAttribute('opacity', '1');
    }

    this._schedule(() => {
      this.audio.playSuccessChord();
      this.speech.speak('Hooray! All the matching flowers bloomed!');
    }, 350);

    this._schedule(() => {
      if (rainbowEl) {
        rainbowEl.setAttribute('opacity', '0');
      }
      this.waveNumber += 1;
      this._startWave(true);
    }, 2600);
  }

  _loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    if (this.nozzlePulse > 0) {
      this.nozzlePulse = Math.max(0, this.nozzlePulse - dt * 5);
    }

    const keySpeed = 480;
    if (this.keysHeld.left) {
      this.cartX = Math.max(40, this.cartX - keySpeed * dt);
    }
    if (this.keysHeld.right) {
      this.cartX = Math.min(
        this.worldWidth - 40 - this.cartWidth,
        this.cartX + keySpeed * dt
      );
    }

    if (this.isSpraying || this.keysHeld.spray) {
      this.sprayTimerMs -= dt * 1000;
      if (this.sprayTimerMs <= 0) {
        this._fireWaterDroplet();
        this.sprayTimerMs = this.sprayIntervalMs;
      }
    }

    const rowHitWall = [false, false];
    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];
      const r = t.row || 0;
      t.x += this.rowDirs[r] * this.rowSpeeds[r] * dt;
      if (t.wobbleMs > 0) {
        t.wobbleMs = Math.max(0, t.wobbleMs - dt * 1000);
      }
      if (t.x < 90 && this.rowDirs[r] < 0) rowHitWall[r] = true;
      if (t.x > 910 && this.rowDirs[r] > 0) rowHitWall[r] = true;
    }

    for (let r = 0; r < 2; r++) {
      if (rowHitWall[r]) {
        this.rowDirs[r] *= -1;
      }
    }

    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];
      if (t.el) {
        const wobbleDeg = t.wobbleMs > 0 ? Math.sin(t.wobbleMs * 0.05) * 14 : 0;
        t.el.setAttribute(
          'transform',
          'translate(' +
            Math.round(t.x) +
            ', ' +
            Math.round(t.y) +
            ') rotate(' +
            wobbleDeg.toFixed(1) +
            ')'
        );
      }
    }

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.y += d.vy * dt;

      if (d.el) {
        d.el.setAttribute(
          'transform',
          'translate(' + Math.round(d.x) + ', ' + Math.round(d.y) + ')'
        );
      }

      let consumed = false;
      for (let j = 0; j < this.targets.length; j++) {
        const t = this.targets[j];
        if (t.watered) continue;

        const dist = Math.hypot(d.x - t.x, d.y - t.y);
        if (dist <= d.radius + t.radius) {
          this._handleDropletHitTarget(t);
          consumed = true;
          break;
        }
      }

      if (consumed || d.y < 60) {
        if (d.el && d.el.parentNode) {
          d.el.parentNode.removeChild(d.el);
        }
        this.droplets.splice(i, 1);
      }
    }

    const cartGroup = this.container.querySelector('#ssd-cart-group');
    if (cartGroup) {
      const recoilY = Math.round(this.nozzlePulse * 4);
      cartGroup.setAttribute(
        'transform',
        'translate(' + Math.round(this.cartX) + ', ' + Math.round(this.cartY + recoilY) + ')'
      );
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