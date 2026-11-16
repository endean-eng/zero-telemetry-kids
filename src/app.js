/**
 * @file src/games/tractor-hill-hauler.js
 * @description Kinematic Action & Physics Module (K-04): Tractor Hill Hauler.
 *              Side-scrolling agricultural terrain & Newtonian physics sandbox teaching
 *              slope/gravity momentum, crest hops & initial-acceleration torque wheelies,
 *              mud/water drag, trailer-only pumpkin catching, and split-in-half ground impacts.
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

export default class TractorHillHaulerGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.cleanups = [];
    this.timers = [];
    this.rafId = null;

    // Virtual 1000 x 560 landscape viewport
    this.worldWidth = 1000;
    this.worldHeight = 560;

    this.level = 1;
    this.barnsReached = 0;
    this.cropsDeliveredTotal = 0;

    // World scrolling & tractor airborne / wheelie kinematics
    this.worldX = 120;
    this.tractorScreenX = 350;
    this.wheelbase = 86;
    this.speed = 0;

    this.tractorY = 420;
    this.tractorVy = 0;
    this.isAirborne = false;

    this.wheelieRad = 0;
    this.wheelieVel = 0;
    this.airPitchRad = 0;

    this.trailerY = 420;
    this.trailerVy = 0;
    this.trailerAirborne = false;

    this.prevSlopeRad = 0;
    this.wheelRotationDeg = 0;
    this.exhaustTimerMs = 0;
    this.splashTimerMs = 0;

    // Checkpoint interval in world pixels (+40% further apart: 2000 -> 2800)
    this.barnSpacing = 2800;
    this.generatedUpToSegment = -1;

    // World props, particles, catchable loose pumpkins & split-in-half pumpkins
    this.props = [];
    this.particles = [];
    this.loosePumpkins = [];
    this.splitPumpkins = [];

    // Stage 2 Trailer Cargo State (3 bouncy pumpkins in the wagon bed)
    this.cargoItems = [];

    // Independent Multi-Touch Pedal & Keyboard States
    this.gasPointerId = null;
    this.leftPedalPointerId = null;
    this.keysHeld = { gas: false, leftPedal: false };

    this.lastFrameTime = 0;
  }

  mount(containerEl, audioApi, speechApi) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;

    this.level = 1;
    this.barnsReached = 0;
    this.cropsDeliveredTotal = 0;

    this.renderStage();
    this._resetCourse(true);
    this._bindInputs();

    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  /**
   * Deterministic smooth rolling hill terrain Y(wx).
   * Flattens smoothly around Barn Checkpoints so barns sit level.
   */
  _getTerrainY(wx) {
    const baseGround = 420;
    if (wx < 260) {
      return baseGround;
    }

    const nearestBarnIdx = Math.max(1, Math.round(wx / this.barnSpacing));
    const distToBarn = Math.abs(wx - nearestBarnIdx * this.barnSpacing);

    let hillBlend = 1.0;
    if (distToBarn < 260) {
      const t = distToBarn / 260;
      hillBlend = t * t * (3 - 2 * t);
    }

    let startBlend = 1.0;
    if (wx < 520) {
      const s = (wx - 260) / 260;
      startBlend = s * s * (3 - 2 * s);
    }

    const amp1 = this.level === 1 ? 50 : 62;
    const amp2 = this.level === 1 ? 24 : 32;
    const rawHill =
      Math.sin(wx * 0.0048) * amp1 + Math.sin(wx * 0.0112 + 1.1) * amp2;

    return baseGround - rawHill * hillBlend * startBlend;
  }

  _getTerrainSlopeDerivative(wx) {
    return (this._getTerrainY(wx + 6) - this._getTerrainY(wx - 6)) / 12;
  }

  _resetCargo() {
    this.cargoItems = [
      { slotX: -36, yOffset: 0, vy: 0, active: true },
      { slotX: 0, yOffset: 0, vy: 0, active: true },
      { slotX: 36, yOffset: 0, vy: 0, active: true }
    ];
  }

  _clearDynamicEntities() {
    this.props.forEach((p) => {
      if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
    });
    this.props = [];

    this.particles.forEach((pt) => {
      if (pt.el && pt.el.parentNode) pt.el.parentNode.removeChild(pt.el);
    });
    this.particles = [];

    this.loosePumpkins.forEach((lp) => {
      if (lp.el && lp.el.parentNode) lp.el.parentNode.removeChild(lp.el);
    });
    this.loosePumpkins = [];

    this.splitPumpkins.forEach((sp) => {
      if (sp.el && sp.el.parentNode) sp.el.parentNode.removeChild(sp.el);
    });
    this.splitPumpkins = [];
  }

  _resetCourse(announce) {
    this.worldX = 120;
    this.speed = 0;

    this.tractorY = this._getTerrainY(this.worldX);
    this.tractorVy = 0;
    this.isAirborne = false;

    this.wheelieRad = 0;
    this.wheelieVel = 0;
    this.airPitchRad = 0;

    this.trailerY = this._getTerrainY(this.worldX - 132);
    this.trailerVy = 0;
    this.trailerAirborne = false;

    this.prevSlopeRad = 0;
    this.wheelRotationDeg = 0;
    this.barnsReached = 0;
    this.cropsDeliveredTotal = 0;
    this.generatedUpToSegment = -1;

    this._clearDynamicEntities();
    this._resetCargo();
    this._ensureSegmentsGenerated();
    this._updateHud();

    if (announce) {
      const msg =
        this.level === 1
          ? 'Hold the big green GO pedal to hop over hills and smash hay bales!'
          : 'Stage Two! Keep your pumpkins in the trailer, or catch them in the wagon if they bounce up!';
      this._schedule(() => this.speech.speak(msg), 180);
    }
  }

  _ensureSegmentsGenerated() {
    const currentSeg = Math.floor((this.worldX + 1400) / this.barnSpacing);
    const propsBack = this.container.querySelector('#thh-props-back');
    const propsFront = this.container.querySelector('#thh-props-front');
    if (!propsBack || !propsFront) return;

    while (this.generatedUpToSegment < currentSeg) {
      this.generatedUpToSegment += 1;
      const segIdx = this.generatedUpToSegment;
      const segStart = segIdx * this.barnSpacing;

      // Spread valley puddle & breakable stacks across the wider 2800px barn interval
      const puddleWx = this._findLocalValley(segStart + 620, segStart + 1180);
      this._createProp('puddle', puddleWx, propsBack);

      const stack1Wx = segStart + 1420;
      this._createProp('hayStack', stack1Wx, propsFront);

      const stack2Wx = segStart + 1940;
      this._createProp('crateStack', stack2Wx, propsFront);

      const stack3Wx = segStart + 2360;
      this._createProp('hayStack', stack3Wx, propsFront);

      const barnWx = (segIdx + 1) * this.barnSpacing;
      this._createProp('barn', barnWx, propsBack, segIdx + 1);
    }
  }

  _findLocalValley(minWx, maxWx) {
    let bestWx = (minWx + maxWx) / 2;
    let deepestY = -9999;
    for (let wx = minWx; wx <= maxWx; wx += 25) {
      const y = this._getTerrainY(wx);
      if (y > deepestY) {
        deepestY = y;
        bestWx = wx;
      }
    }
    return bestWx;
  }

  _createProp(type, wx, parentLayer, checkpointNum) {
    const wy = this._getTerrainY(wx);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (type === 'puddle') {
      g.innerHTML =
        '<ellipse cx="0" cy="4" rx="78" ry="15" fill="#0ea5e9" stroke="#0f172a" stroke-width="4"/>' +
        '<ellipse cx="-18" cy="1" rx="34" ry="6" fill="#7dd3fc"/>' +
        '<ellipse cx="28" cy="5" rx="22" ry="4" fill="#bae6fd"/>';
    } else if (type === 'hayStack') {
      g.innerHTML =
        '<rect x="-38" y="-34" width="38" height="34" rx="6" fill="#eab308" stroke="#0f172a" stroke-width="3.5"/>' +
        '<rect x="0" y="-34" width="38" height="34" rx="6" fill="#facc15" stroke="#0f172a" stroke-width="3.5"/>' +
        '<rect x="-19" y="-66" width="38" height="34" rx="6" fill="#fde047" stroke="#0f172a" stroke-width="3.5"/>';
    } else if (type === 'crateStack') {
      g.innerHTML =
        '<rect x="-26" y="-44" width="52" height="44" rx="5" fill="#d97706" stroke="#0f172a" stroke-width="3.5"/>' +
        '<line x1="-22" y1="-40" x2="22" y2="-4" stroke="#92400e" stroke-width="4"/>' +
        '<line x1="22" y1="-40" x2="-22" y2="-4" stroke="#92400e" stroke-width="4"/>' +
        '<circle cx="0" cy="-58" r="16" fill="#f97316" stroke="#0f172a" stroke-width="3.5"/>' +
        '<path d="M-2 -74 L2 -80" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>';
    } else if (type === 'barn') {
      const label = String(checkpointNum || 1);
      g.innerHTML =
        '<path d="M-76 0 V-92 L0 -142 L76 -92 V0 Z" fill="#dc2626" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>' +
        '<rect x="-28" y="-68" width="56" height="68" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>' +
        '<line x1="-28" y1="-68" x2="28" y2="0" stroke="#dc2626" stroke-width="3.5"/>' +
        '<line x1="28" y1="-68" x2="-28" y2="0" stroke="#dc2626" stroke-width="3.5"/>' +
        '<circle cx="0" cy="-100" r="18" fill="#fef08a" stroke="#0f172a" stroke-width="3.5"/>' +
        '<text x="0" y="-93" text-anchor="middle" font-size="22" font-weight="900" fill="#0f172a" font-family="system-ui, sans-serif">' +
        label +
        '</text>';
    }

    parentLayer.appendChild(g);
    this.props.push({
      type: type,
      wx: wx,
      wy: wy,
      triggered: false,
      checkpointNum: checkpointNum || 0,
      el: g
    });
  }

  renderStage() {
    const levelBtnLabel =
      this.level === 1
        ? '\u2605 Stage 1: Free Drive & Hop'
        : '\u2605\u2605 Stage 2: Pumpkin Hauler';

    const leftPedalHtml =
      this.level === 1
        ? '<button type="button" class="thh-pedal thh-pedal-horn" id="thh-pedal-left" aria-label="Honk Horn">' +
          '  <span class="thh-pedal-big">HONK!</span>' +
          '  <span class="thh-pedal-sub">Beep Beep</span>' +
          '</button>'
        : '<button type="button" class="thh-pedal thh-pedal-brake" id="thh-pedal-left" aria-label="Brake and Slow Down">' +
          '  <span class="thh-pedal-big">SLOW</span>' +
          '  <span class="thh-pedal-sub">Catch / Brake</span>' +
          '</button>';

    this.container.innerHTML =
      '<style>' +
      '.thh-root {' +
      '  width: 100%; height: 100%; position: relative; overflow: hidden;' +
      '  touch-action: none; user-select: none; background: #bae6fd;' +
      '}' +
      '.thh-top-bar {' +
      '  position: relative; z-index: 40; display: flex; align-items: center;' +
      '  justify-content: center; gap: 14px; padding: 10px 110px 0 110px; flex-wrap: wrap;' +
      '}' +
      '.thh-btn {' +
      '  min-height: 70px; padding: 6px 20px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.05rem; font-weight: 800; color: #0f172a;' +
      '  display: flex; align-items: center; gap: 10px; cursor: pointer;' +
      '}' +
      '.thh-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #0f172a; }' +
      '.thh-level-btn { background: #fef08a; }' +
      '.thh-score-pill {' +
      '  min-height: 70px; padding: 6px 22px; border-radius: 999px;' +
      '  background: #dcfce7; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.35rem; font-weight: 900; color: #166534;' +
      '  display: flex; align-items: center; gap: 8px; transition: transform 0.16s ease;' +
      '}' +
      '.thh-score-pill.pop { transform: scale(1.18); background: #fef08a; color: #92400e; }' +
      '.thh-world-svg {' +
      '  position: absolute; inset: 0; width: 100%; height: 100%; z-index: 10;' +
      '}' +
      '.thh-pedal {' +
      '  position: absolute; bottom: 20px; width: 154px; height: 126px;' +
      '  border-radius: 28px; border: 5px solid #0f172a; box-shadow: 0 8px 0 #0f172a;' +
      '  display: flex; flex-direction: column; align-items: center; justify-content: center;' +
      '  gap: 4px; cursor: pointer; z-index: 45; font-family: inherit;' +
      '  transition: transform 0.08s ease, box-shadow 0.08s ease;' +
      '}' +
      '.thh-pedal.pressed {' +
      '  transform: translateY(6px); box-shadow: 0 2px 0 #0f172a;' +
      '}' +
      '.thh-pedal-go {' +
      '  right: 26px; background: #22c55e; color: #ffffff;' +
      '}' +
      '.thh-pedal-horn {' +
      '  left: 26px; background: #facc15; color: #0f172a;' +
      '}' +
      '.thh-pedal-brake {' +
      '  left: 26px; background: #ef4444; color: #ffffff;' +
      '}' +
      '.thh-pedal-big { font-size: 2rem; font-weight: 900; line-height: 1; }' +
      '.thh-pedal-sub { font-size: 0.95rem; font-weight: 800; opacity: 0.92; }' +
      '</style>' +
      '<div class="thh-root">' +
      '  <div class="thh-top-bar">' +
      '    <button type="button" class="thh-btn" id="thh-repeat-btn">' +
      '      <span style="font-size:1.4rem;">\u266B</span>' +
      '      <span>' +
      (this.level === 1 ? 'Hold GO to Hop Over Hills!' : 'Catch Bouncing Pumpkins in the Trailer!') +
      '      </span>' +
      '    </button>' +
      '    <button type="button" class="thh-btn thh-level-btn" id="thh-level-btn">' +
      levelBtnLabel +
      '    </button>' +
      '    <div class="thh-score-pill" id="thh-score-pill">Barns: 0</div>' +
      '  </div>' +
      leftPedalHtml +
      '  <button type="button" class="thh-pedal thh-pedal-go" id="thh-pedal-go" aria-label="Gas Pedal Go">' +
      '    <span class="thh-pedal-big">GO!</span>' +
      '    <span class="thh-pedal-sub">Hold Gas</span>' +
      '  </button>' +
      '  <svg class="thh-world-svg" id="thh-svg" viewBox="0 0 1000 560" preserveAspectRatio="none">' +
      '    <defs>' +
      '      <linearGradient id="thh-sky" x1="0" y1="0" x2="0" y2="1">' +
      '        <stop offset="0%" stop-color="#7dd3fc" />' +
      '        <stop offset="100%" stop-color="#e0f2fe" />' +
      '      </linearGradient>' +
      '    </defs>' +
      '    <rect x="0" y="0" width="1000" height="560" fill="url(#thh-sky)" />' +
      '    <circle cx="850" cy="110" r="44" fill="#fde047" stroke="#0f172a" stroke-width="4" />' +
      '    <g id="thh-bg-clouds" opacity="0.8">' +
      '      <circle cx="190" cy="125" r="24" fill="#ffffff"/>' +
      '      <circle cx="220" cy="120" r="30" fill="#ffffff"/>' +
      '      <circle cx="250" cy="126" r="22" fill="#ffffff"/>' +
      '      <circle cx="610" cy="150" r="22" fill="#ffffff"/>' +
      '      <circle cx="638" cy="144" r="28" fill="#ffffff"/>' +
      '      <circle cx="666" cy="150" r="20" fill="#ffffff"/>' +
      '    </g>' +
      '    <g id="thh-props-back"></g>' +
      /* Scrolling Soil Fill & Grass Top Ribbon */
      '    <path id="thh-terrain-soil" d="" fill="#92400e" stroke="#0f172a" stroke-width="4" />' +
      '    <path id="thh-terrain-grass" d="" fill="none" stroke="#22c55e" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />' +
      '    <path id="thh-terrain-outline" d="" fill="none" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" />' +
      /* Stage 2 Coupled Cargo Trailer (Only the trailer bed can catch loose pumpkins!) */
      '    <g id="thh-trailer-group" style="display:' +
      (this.level === 2 ? 'block' : 'none') +
      ';">' +
      '      <line x1="48" y1="-22" x2="132" y2="-26" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>' +
      '      <g id="thh-cargo-0">' +
      this._buildMiniPumpkinSvg() +
      '</g>' +
      '      <g id="thh-cargo-1">' +
      this._buildMiniPumpkinSvg() +
      '</g>' +
      '      <g id="thh-cargo-2">' +
      this._buildMiniPumpkinSvg() +
      '</g>' +
      '      <line x1="-68" y1="-68" x2="68" y2="-68" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>' +
      '      <polygon points="-68,-58 68,-58 54,-18 -54,-18" fill="#ea580c" stroke="#0f172a" stroke-width="4.5" stroke-linejoin="round"/>' +
      '      <g id="thh-trailer-wheel" transform="translate(0, -20)">' +
      '        <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '        <line x1="-12" y1="0" x2="12" y2="0" stroke="#facc15" stroke-width="4"/>' +
      '        <line x1="0" y1="-12" x2="0" y2="12" stroke="#facc15" stroke-width="4"/>' +
      '        <circle cx="0" cy="0" r="7" fill="#f59e0b"/>' +
      '      </g>' +
      '    </g>' +
      /* Coupled Green Row-Crop Tractor (Origin 0,0 = Rear Tire Ground Contact) */
      '    <g id="thh-tractor-group">' +
      '      <rect x="-18" y="-96" width="52" height="44" rx="8" fill="#16a34a" stroke="#0f172a" stroke-width="4.5"/>' +
      '      <rect x="-8" y="-88" width="32" height="24" rx="4" fill="#bae6fd" stroke="#0f172a" stroke-width="3"/>' +
      '      <rect x="68" y="-88" width="10" height="28" rx="3" fill="#334155" stroke="#0f172a" stroke-width="3"/>' +
      '      <rect x="-24" y="-62" width="118" height="40" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="4.5"/>' +
      '      <g id="thh-wheel-rear" transform="translate(0, -28)">' +
      '        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#0f172a" stroke-width="4.5"/>' +
      '        <line x1="-18" y1="0" x2="18" y2="0" stroke="#facc15" stroke-width="5"/>' +
      '        <line x1="0" y1="-18" x2="0" y2="18" stroke="#facc15" stroke-width="5"/>' +
      '        <circle cx="0" cy="0" r="11" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>' +
      '      </g>' +
      '      <g id="thh-wheel-front" transform="translate(86, -20)">' +
      '        <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#0f172a" stroke-width="4.5"/>' +
      '        <line x1="-12" y1="0" x2="12" y2="0" stroke="#facc15" stroke-width="4"/>' +
      '        <line x1="0" y1="-12" x2="0" y2="12" stroke="#facc15" stroke-width="4"/>' +
      '        <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>' +
      '      </g>' +
      '    </g>' +
      /* Catchable Airborne Loose Pumpkins & Split-in-Half Ground Pumpkins */
      '    <g id="thh-loose-pumpkins-layer"></g>' +
      '    <g id="thh-splits-layer"></g>' +
      /* Foreground Breakable Obstacles & Physics Particles */
      '    <g id="thh-props-front"></g>' +
      '    <g id="thh-particles-layer"></g>' +
      '  </svg>' +
      '</div>';
  }

  _buildMiniPumpkinSvg() {
    return (
      '<path d="M-2 -20 L2 -27" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="-7" cy="-6" rx="12" ry="15" fill="#ea580c" stroke="#0f172a" stroke-width="3"/>' +
      '<ellipse cx="7" cy="-6" rx="12" ry="15" fill="#ea580c" stroke="#0f172a" stroke-width="3"/>' +
      '<ellipse cx="0" cy="-6" rx="13" ry="16" fill="#f97316" stroke="#0f172a" stroke-width="3"/>'
    );
  }

  _buildLeftPumpkinHalfSvg() {
    return (
      '<path d="M-2 -21 L0 -27" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M0 -21 C-16 -21, -20 -8, -18 4 C-15 12, -6 12, 0 10 L-3 3 L2 -4 L-3 -12 Z" fill="#ea580c" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M-1 -17 C-9 -16, -11 -6, -9 3 C-7 7, -2 7, 0 6 L-3 2 L1 -4 L-2 -11 Z" fill="#fde047"/>'
    );
  }

  _buildRightPumpkinHalfSvg() {
    return (
      '<path d="M0 -21 C16 -21, 20 -8, 18 4 C15 12, 6 12, 0 10 L-2 3 L3 -4 L-2 -12 Z" fill="#f97316" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M1 -17 C9 -16, 11 -6, 9 3 C7 7, 2 7, 0 6 L-1 2 L3 -4 L0 -11 Z" fill="#fde047"/>'
    );
  }

  _bindInputs() {
    const repeatBtn = this.container.querySelector('#thh-repeat-btn');
    const levelBtn = this.container.querySelector('#thh-level-btn');
    const goPedal = this.container.querySelector('#thh-pedal-go');
    const leftPedal = this.container.querySelector('#thh-pedal-left');

    if (repeatBtn) {
      repeatBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.audio.playNote(523.25, 0.12);
        this.speech.speak(
          this.level === 1
            ? 'Hold the green GO pedal to hop over hills and smash hay bales!'
            : 'Keep your pumpkins in the trailer, or catch them in the trailer if they bounce up!'
        );
      });
    }

    if (levelBtn) {
      levelBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.level = this.level === 1 ? 2 : 1;
        this.gasPointerId = null;
        this.leftPedalPointerId = null;
        this.audio.playSuccessChord();
        this.renderStage();
        this._resetCourse(true);
        this._bindInputs();
      });
    }

    if (goPedal) {
      const releaseGas = (e) => {
        if (e.pointerId === this.gasPointerId) {
          this.gasPointerId = null;
          goPedal.classList.remove('pressed');
        }
      };
      goPedal.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.gasPointerId !== null) return;
        this.gasPointerId = e.pointerId;
        try {
          goPedal.setPointerCapture(e.pointerId);
        } catch (_) {}
        goPedal.classList.add('pressed');
        // Initial launch torque wheelie impulse ONLY when starting from low speed!
        if (!this.isAirborne && this.speed < 170) {
          this.wheelieVel -= 2.35;
        }
        this.audio.playNote(293.66, 0.08);
      });
      goPedal.addEventListener('pointerup', releaseGas);
      goPedal.addEventListener('pointercancel', releaseGas);
    }

    if (leftPedal) {
      const releaseLeft = (e) => {
        if (e.pointerId === this.leftPedalPointerId) {
          this.leftPedalPointerId = null;
          leftPedal.classList.remove('pressed');
        }
      };
      leftPedal.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.leftPedalPointerId !== null) return;
        this.leftPedalPointerId = e.pointerId;
        try {
          leftPedal.setPointerCapture(e.pointerId);
        } catch (_) {}
        leftPedal.classList.add('pressed');

        if (this.level === 1) {
          this._honkHorn();
        } else {
          this.audio.playNote(220.0, 0.08);
        }
      });
      leftPedal.addEventListener('pointerup', releaseLeft);
      leftPedal.addEventListener('pointercancel', releaseLeft);
    }

    const onKeyDown = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Space') {
        e.preventDefault();
        if (!this.keysHeld.gas && !this.isAirborne && this.speed < 170) {
          this.wheelieVel -= 2.35;
        }
        this.keysHeld.gas = true;
        if (goPedal) goPedal.classList.add('pressed');
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (!this.keysHeld.leftPedal && this.level === 1) {
          this._honkHorn();
        }
        this.keysHeld.leftPedal = true;
        if (leftPedal) leftPedal.classList.add('pressed');
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Space') {
        this.keysHeld.gas = false;
        if (goPedal) goPedal.classList.remove('pressed');
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowDown') {
        this.keysHeld.leftPedal = false;
        if (leftPedal) leftPedal.classList.remove('pressed');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });
  }

  _honkHorn() {
    this.audio.playNote(349.23, 0.18);
    this._schedule(() => this.audio.playNote(440.0, 0.28), 160);
    this._spawnParticle(this.tractorScreenX + 68, this.tractorY - 96, -35, -90, '#ffffff', 12);
    this._spawnParticle(this.tractorScreenX + 74, this.tractorY - 104, -20, -120, '#f1f5f9', 9);
  }

  _spawnParticle(sx, sy, vx, vy, colorHex, radius) {
    const layer = this.container.querySelector('#thh-particles-layer');
    if (!layer) return;

    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', String(radius || 7));
    c.setAttribute('fill', colorHex);
    c.setAttribute('stroke', '#0f172a');
    c.setAttribute('stroke-width', '2.5');
    c.setAttribute('cx', String(Math.round(sx)));
    c.setAttribute('cy', String(Math.round(sy)));
    layer.appendChild(c);

    this.particles.push({
      x: sx,
      y: sy,
      vx: vx,
      vy: vy,
      lifeSec: 0.65,
      el: c
    });
  }

  /**
   * Launches an ejected pumpkin into true world-space flight so the player can catch it in the trailer!
   */
  _spawnLooseAirbornePumpkin(wx, wy, vx, vy) {
    const layer = this.container.querySelector('#thh-loose-pumpkins-layer');
    if (!layer) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = this._buildMiniPumpkinSvg();
    layer.appendChild(g);

    this.loosePumpkins.push({
      wx: wx,
      wy: wy,
      vx: vx,
      vy: vy,
      rot: 0,
      vrot: (Math.random() - 0.5) * 200,
      graceMs: 240,
      el: g
    });
  }

  /**
   * Spawns a two-piece split pumpkin + seeds animation when a loose pumpkin hits the ground!
   */
  _spawnSplitPumpkinAnimation(wx, groundY) {
    const splitsLayer = this.container.querySelector('#thh-splits-layer');
    if (!splitsLayer) return;

    const containerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const leftG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rightG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    leftG.innerHTML = this._buildLeftPumpkinHalfSvg();
    rightG.innerHTML = this._buildRightPumpkinHalfSvg();

    containerG.appendChild(leftG);
    containerG.appendChild(rightG);
    splitsLayer.appendChild(containerG);

    const screenX = this.tractorScreenX + (wx - this.worldX);
    this._spawnParticle(screenX - 8, groundY - 14, -55, -145, '#fef08a', 5);
    this._spawnParticle(screenX, groundY - 18, 8, -175, '#fef9c3', 5.5);
    this._spawnParticle(screenX + 8, groundY - 14, 62, -140, '#fef08a', 5);

    this.splitPumpkins.push({
      wx: wx,
      groundY: groundY,
      leftX: -2,
      leftY: -6,
      leftVx: -52,
      leftVy: -135,
      leftRot: -8,
      rightX: 2,
      rightY: -6,
      rightVx: 58,
      rightVy: -125,
      rightRot: 8,
      lifeSec: 1.35,
      el: containerG,
      leftEl: leftG,
      rightEl: rightG
    });
  }

  _updateHud(popAnim) {
    const pill = this.container.querySelector('#thh-score-pill');
    if (!pill) return;

    if (this.level === 1) {
      pill.textContent = 'Barns: ' + this.barnsReached;
    } else {
      const inBed = this.cargoItems.filter((c) => c.active).length;
      pill.textContent =
        'Barns: ' +
        this.barnsReached +
        ' | Saved: ' +
        this.cropsDeliveredTotal +
        ' (In Bed: ' +
        inBed +
        ')';
    }

    pill.classList.remove('pop');
    if (popAnim) {
      pill.classList.add('pop');
      this._schedule(() => pill.classList.remove('pop'), 240);
    }
  }

  _handleBarnCheckpoint(prop) {
    prop.triggered = true;
    this.barnsReached += 1;

    this.audio.playSuccessChord();

    const barnScreenX = this.tractorScreenX + (prop.wx - this.worldX);
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      this._spawnParticle(
        barnScreenX,
        prop.wy - 95,
        Math.cos(ang) * 140,
        Math.sin(ang) * 130 - 60,
        i % 2 === 0 ? '#facc15' : '#4ade80',
        9
      );
    }

    if (this.level === 1) {
      const word = NUMBER_WORDS[this.barnsReached] || String(this.barnsReached);
      this.speech.speak('Barn ' + word + '!');
    } else {
      // Only count pumpkins actually inside the trailer bed when crossing the barn
      const deliveredNow = this.cargoItems.filter((c) => c.active).length;
      this.cropsDeliveredTotal += deliveredNow;

      if (deliveredNow > 0) {
        this.speech.speak(
          'Delivered ' + (NUMBER_WORDS[deliveredNow] || deliveredNow) + ' pumpkins! Reloading!'
        );
      } else {
        this.speech.speak('Here are three fresh pumpkins for the next hill!');
      }
      this._resetCargo();
    }

    this._updateHud(true);
  }

  _smashObstacle(prop) {
    prop.triggered = true;
    if (prop.el) {
      prop.el.setAttribute('opacity', '0');
    }

    const noteHz = PENTATONIC_SCALE[(this.barnsReached + 3) % PENTATONIC_SCALE.length];
    this.audio.playNote(noteHz, 0.18);

    const screenX = this.tractorScreenX + (prop.wx - this.worldX);
    const color1 = prop.type === 'hayStack' ? '#facc15' : '#f97316';
    const color2 = prop.type === 'hayStack' ? '#fde047' : '#d97306';

    for (let i = 0; i < 7; i++) {
      this._spawnParticle(
        screenX,
        prop.wy - 30,
        (Math.random() - 0.3) * 240,
        -120 - Math.random() * 160,
        i % 2 === 0 ? color1 : color2,
        8.5
      );
    }

    this.speed *= 0.9;
  }

  _loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    const isGas = this.gasPointerId !== null || this.keysHeld.gas;
    const isBrake =
      this.level === 2 && (this.leftPedalPointerId !== null || this.keysHeld.leftPedal);

    // 1. Evaluate Ground Slope at Current Position
    const preStepGroundY = this._getTerrainY(this.worldX);
    const preStepFrontGroundY = this._getTerrainY(this.worldX + this.wheelbase);
    const groundSlopeRad = Math.max(
      -0.52,
      Math.min(0.52, Math.atan2(preStepFrontGroundY - preStepGroundY, this.wheelbase))
    );
    const slopeRate = (groundSlopeRad - this.prevSlopeRad) / dt;
    this.prevSlopeRad = groundSlopeRad;

    // 2. Longitudinal Throttle, Gravity & Drag
    const maxSpeed = this.level === 1 ? 395 : 445;
    if (isGas) {
      this.speed += (this.isAirborne ? 180 : 475) * dt;
    }
    if (isBrake) {
      this.speed -= (this.isAirborne ? 220 : 530) * dt;
    }

    if (!this.isAirborne) {
      this.speed += Math.sin(groundSlopeRad) * 245 * dt;
    }

    const dragFactor = this.isAirborne ? 0.35 : isGas ? 0.82 : 1.75;
    this.speed -= this.speed * dragFactor * dt;

    const minSpeed = this.worldX <= 130 ? 0 : isBrake ? -110 : -40;
    this.speed = Math.max(minSpeed, Math.min(maxSpeed, this.speed));
    if (
      !this.isAirborne &&
      !isGas &&
      !isBrake &&
      Math.abs(this.speed) < 6 &&
      Math.abs(groundSlopeRad) < 0.06
    ) {
      this.speed = 0;
    }

    // Slope vertical velocity right before horizontal step (used for natural hill-crest launch!)
    const preSlopeDyDx = this._getTerrainSlopeDerivative(this.worldX);
    if (!this.isAirborne) {
      this.tractorVy = preSlopeDyDx * this.speed;
      if (slopeRate > 0.72 && this.speed > 245) {
        this.tractorVy = Math.min(
          this.tractorVy - 85 - (this.speed - 245) * 0.42,
          -145
        );
        this.isAirborne = true;
        this.airPitchRad = groundSlopeRad - 0.12;
        this.audio.playNote(440.0, 0.09);
      }
    }

    // Advance worldX
    this.worldX = Math.max(110, this.worldX + this.speed * dt);
    this.wheelRotationDeg = (this.wheelRotationDeg + this.speed * dt * 1.65) % 360;

    // 3. Vertical Airborne Hop Physics for Tractor
    const groundRearY = this._getTerrainY(this.worldX);
    const groundFrontY = this._getTerrainY(this.worldX + this.wheelbase);
    const newGroundSlopeRad = Math.max(
      -0.52,
      Math.min(0.52, Math.atan2(groundFrontY - groundRearY, this.wheelbase))
    );

    const tractorGravity = 860;
    const candidateY = this.tractorY + (this.tractorVy + tractorGravity * dt) * dt;

    if (this.isAirborne || candidateY < groundRearY - 2.2) {
      if (!this.isAirborne) {
        this.isAirborne = true;
        this.airPitchRad = newGroundSlopeRad + this.wheelieRad;
      }
      this.tractorVy += tractorGravity * dt;
      this.tractorY += this.tractorVy * dt;

      const targetAirPitch = Math.max(-0.42, Math.min(0.32, this.tractorVy * 0.0008));
      this.airPitchRad += (targetAirPitch - this.airPitchRad) * Math.min(1, dt * 3.2);

      if (this.tractorY >= groundRearY) {
        const impactVy = this.tractorVy;
        this.tractorY = groundRearY;
        this.tractorVy = 0;
        this.isAirborne = false;

        if (impactVy > 130) {
          this.audio.playGentleThud();
          this._spawnParticle(this.tractorScreenX, groundRearY - 4, -55, -65, '#d97706', 7);
          this._spawnParticle(this.tractorScreenX + 82, groundFrontY - 4, 45, -65, '#86efac', 7);
          this.wheelieVel += 0.75;
        }
      }
    } else {
      this.tractorY = groundRearY;
    }

    // 4. Initial-Acceleration-Only Torque Wheelie Spring-Damper
    // Pops the front tire up ONLY during initial launch acceleration (speed < 190 px/s),
    // then settles back down smoothly onto both tires during steady cruising!
    if (!this.isAirborne) {
      let targetWheelie = 0;
      if (isGas && !isBrake && this.speed > 10 && this.speed < 190) {
        const launchRatio = 1 - this.speed / 190;
        targetWheelie = -0.22 * launchRatio * launchRatio;
      }
      if (isBrake) {
        targetWheelie = 0.02;
      }

      const springK = 34;
      const damping = 8.2;
      const wheelieAccel =
        (targetWheelie - this.wheelieRad) * springK - this.wheelieVel * damping;
      this.wheelieVel += wheelieAccel * dt;
      this.wheelieRad += this.wheelieVel * dt;
      this.wheelieRad = Math.max(-0.32, Math.min(0.02, this.wheelieRad));
    } else {
      this.wheelieRad *= 1 - Math.min(1, dt * 4);
      this.wheelieVel = 0;
    }

    const activeTractorPitchRad = this.isAirborne
      ? this.airPitchRad
      : Math.max(-0.56, Math.min(0.52, newGroundSlopeRad + this.wheelieRad));

    // Exhaust smoke puffs
    if (isGas) {
      this.exhaustTimerMs -= dt * 1000;
      if (this.exhaustTimerMs <= 0) {
        this.exhaustTimerMs = 185;
        this._spawnParticle(
          this.tractorScreenX + 68,
          this.tractorY - 94,
          -40 - this.speed * 0.15,
          -65 - Math.random() * 35,
          '#e2e8f0',
          7
        );
      }
    }

    // 5. Stage 2 Trailer Hop, Forgiving Cargo Physics, Trailer-Only Catching & Split-in-Half Impacts
    const trailerDist = 132;
    const trailerWx = this.worldX - trailerDist;
    const trailerGroundY = this._getTerrainY(trailerWx);

    if (this.level === 2) {
      const trailerSlopeDyDx = this._getTerrainSlopeDerivative(trailerWx);
      if (!this.trailerAirborne) {
        this.trailerVy = trailerSlopeDyDx * this.speed;
      }
      const nextTrailerY = this.trailerY + (this.trailerVy + 920 * dt) * dt;
      if (this.trailerAirborne || nextTrailerY < trailerGroundY - 2.5) {
        this.trailerAirborne = true;
        this.trailerVy += 920 * dt;
        this.trailerY += this.trailerVy * dt;
        if (this.trailerY >= trailerGroundY) {
          this.trailerY = trailerGroundY;
          this.trailerVy = 0;
          this.trailerAirborne = false;
        }
      } else {
        this.trailerY = trailerGroundY;
      }

      const crestJolt =
        slopeRate > 1.02 && this.speed > 325
          ? (slopeRate - 1.02) * (this.speed - 300) * 0.62
          : 0;

      for (let i = 0; i < this.cargoItems.length; i++) {
        const c = this.cargoItems[i];
        if (!c.active) continue;

        if (crestJolt > 0 && c.yOffset > -12) {
          c.vy -= Math.min(285, crestJolt * (0.72 + i * 0.14));
        }

        c.vy += 640 * dt;
        c.yOffset += c.vy * dt;

        if (c.yOffset > 0) {
          c.yOffset = 0;
          c.vy = -c.vy * 0.22;
          if (Math.abs(c.vy) < 22) c.vy = 0;
        }

        if (c.yOffset < -54) {
          c.active = false;
          const launchWx = trailerWx + c.slotX;
          const launchWy = this.trailerY - 54 + c.yOffset;
          const launchVx = this.speed * 0.91;
          const launchVy = Math.max(-255, c.vy - 75);
          this._spawnLooseAirbornePumpkin(launchWx, launchWy, launchVx, launchVy);
          this.audio.playNote(392.0, 0.1);
          this._updateHud(false);
        }
      }

      // Update Loose Airborne Pumpkins (ONLY the Trailer Bed can catch them!)
      for (let i = this.loosePumpkins.length - 1; i >= 0; i--) {
        const lp = this.loosePumpkins[i];
        if (lp.graceMs > 0) {
          lp.graceMs = Math.max(0, lp.graceMs - dt * 1000);
        }

        lp.vy += 470 * dt;
        lp.wx += lp.vx * dt;
        lp.wy += lp.vy * dt;
        lp.rot += lp.vrot * dt;

        const screenX = this.tractorScreenX + (lp.wx - this.worldX);
        if (lp.el) {
          lp.el.setAttribute(
            'transform',
            'translate(' +
              Math.round(screenX) +
              ', ' +
              Math.round(lp.wy) +
              ') rotate(' +
              Math.round(lp.rot) +
              ')'
          );
        }

        // Trailer-Only Catch Zone: +/- 76px around the trailer center (never the tractor!)
        let caught = false;
        if (lp.graceMs <= 0 && lp.vy > -25) {
          const inTrailerCatchZone =
            Math.abs(lp.wx - trailerWx) <= 76 &&
            lp.wy >= this.trailerY - 76 &&
            lp.wy <= this.trailerY - 12;

          if (inTrailerCatchZone) {
            const freeSlot = this.cargoItems.find((slot) => !slot.active);
            if (freeSlot) {
              freeSlot.active = true;
              freeSlot.yOffset = -14;
              freeSlot.vy = 35;
              caught = true;

              this.audio.playNote(659.25, 0.12);
              this._schedule(() => this.audio.playNote(783.99, 0.16), 70);
              this._spawnParticle(screenX, lp.wy, -45, -90, '#fde047', 8);
              this._spawnParticle(screenX, lp.wy, 45, -90, '#4ade80', 8);
              this._updateHud(true);
            }
          }
        }

        if (caught) {
          if (lp.el && lp.el.parentNode) lp.el.parentNode.removeChild(lp.el);
          this.loosePumpkins.splice(i, 1);
          continue;
        }

        // Ground Impact -> Split Pumpkin in Half Animation!
        const groundAtPumpkin = this._getTerrainY(lp.wx);
        if (lp.wy >= groundAtPumpkin - 8) {
          this.audio.playGentleThud();
          this._spawnSplitPumpkinAnimation(lp.wx, groundAtPumpkin);
          if (lp.el && lp.el.parentNode) lp.el.parentNode.removeChild(lp.el);
          this.loosePumpkins.splice(i, 1);
        }
      }

      // Update Split-in-Half Pumpkin Halves Tumbling & Settling on the Grass
      for (let i = this.splitPumpkins.length - 1; i >= 0; i--) {
        const sp = this.splitPumpkins[i];
        sp.lifeSec -= dt;

        if (sp.lifeSec <= 0) {
          if (sp.el && sp.el.parentNode) sp.el.parentNode.removeChild(sp.el);
          this.splitPumpkins.splice(i, 1);
          continue;
        }

        sp.leftVy += 520 * dt;
        sp.leftX += sp.leftVx * dt;
        sp.leftY += sp.leftVy * dt;
        if (sp.leftY >= 0) {
          sp.leftY = 0;
          sp.leftVy = -sp.leftVy * 0.25;
          sp.leftVx *= 0.85;
        } else {
          sp.leftRot = Math.max(-72, sp.leftRot - 150 * dt);
        }

        sp.rightVy += 520 * dt;
        sp.rightX += sp.rightVx * dt;
        sp.rightY += sp.rightVy * dt;
        if (sp.rightY >= 0) {
          sp.rightY = 0;
          sp.rightVy = -sp.rightVy * 0.25;
          sp.rightVx *= 0.85;
        } else {
          sp.rightRot = Math.min(72, sp.rightRot + 150 * dt);
        }

        const splitScreenX = this.tractorScreenX + (sp.wx - this.worldX);
        sp.el.setAttribute(
          'transform',
          'translate(' + Math.round(splitScreenX) + ', ' + Math.round(sp.groundY - 4) + ')'
        );
        sp.el.setAttribute('opacity', Math.min(1, sp.lifeSec * 1.6).toFixed(2));

        sp.leftEl.setAttribute(
          'transform',
          'translate(' +
            sp.leftX.toFixed(1) +
            ', ' +
            sp.leftY.toFixed(1) +
            ') rotate(' +
            Math.round(sp.leftRot) +
            ')'
        );
        sp.rightEl.setAttribute(
          'transform',
          'translate(' +
            sp.rightX.toFixed(1) +
            ', ' +
            sp.rightY.toFixed(1) +
            ') rotate(' +
            Math.round(sp.rightRot) +
            ')'
        );
      }
    }

    // 6. Generate Upcoming Segments & Check Puddles / Crates / Barn Checkpoints
    this._ensureSegmentsGenerated();

    const tractorFrontWx = this.worldX + 95;
    const tractorCenterWx = this.worldX + 43;

    for (let i = this.props.length - 1; i >= 0; i--) {
      const prop = this.props[i];
      const screenX = this.tractorScreenX + (prop.wx - this.worldX);

      if (prop.el) {
        prop.el.setAttribute(
          'transform',
          'translate(' + Math.round(screenX) + ', ' + Math.round(prop.wy) + ')'
        );
      }

      if (prop.type === 'puddle') {
        if (
          !this.isAirborne &&
          Math.abs(tractorCenterWx - prop.wx) < 72 &&
          Math.abs(this.speed) > 35
        ) {
          this.speed *= 1 - 1.8 * dt;
          this.splashTimerMs -= dt * 1000;
          if (this.splashTimerMs <= 0) {
            this.splashTimerMs = 110;
            this.audio.playNote(587.33, 0.05);
            this._spawnParticle(
              this.tractorScreenX + 75,
              this.tractorY - 8,
              (Math.random() - 0.5) * 140,
              -130 - Math.random() * 90,
              '#38bdf8',
              6.5
            );
          }
        }
      } else if (
        (prop.type === 'hayStack' || prop.type === 'crateStack') &&
        !prop.triggered
      ) {
        if (
          Math.abs(tractorFrontWx - prop.wx) < 52 &&
          this.tractorY >= prop.wy - 76
        ) {
          this._smashObstacle(prop);
        }
      } else if (prop.type === 'barn' && !prop.triggered) {
        if (tractorCenterWx >= prop.wx) {
          this._handleBarnCheckpoint(prop);
        }
      }

      if (prop.wx < this.worldX - 650) {
        if (prop.el && prop.el.parentNode) prop.el.parentNode.removeChild(prop.el);
        this.props.splice(i, 1);
      }
    }

    // 7. Update Physics Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.lifeSec -= dt;
      pt.vy += 420 * dt;
      pt.x += (pt.vx - this.speed * 0.5) * dt;
      pt.y += pt.vy * dt;

      if (pt.lifeSec <= 0) {
        if (pt.el && pt.el.parentNode) pt.el.parentNode.removeChild(pt.el);
        this.particles.splice(i, 1);
      } else if (pt.el) {
        pt.el.setAttribute('cx', String(Math.round(pt.x)));
        pt.el.setAttribute('cy', String(Math.round(pt.y)));
        pt.el.setAttribute('opacity', Math.min(1, pt.lifeSec * 2).toFixed(2));
      }
    }

    // 8. Render Continuous SVG Terrain Ribbon
    let surfacePath = '';
    for (let sx = -25; sx <= 1025; sx += 25) {
      const wx = this.worldX + (sx - this.tractorScreenX);
      const wy = Math.round(this._getTerrainY(wx));
      surfacePath += (sx === -25 ? 'M ' : ' L ') + sx + ' ' + wy;
    }
    const soilPath = surfacePath + ' L 1025 580 L -25 580 Z';

    const soilEl = this.container.querySelector('#thh-terrain-soil');
    const grassEl = this.container.querySelector('#thh-terrain-grass');
    const outlineEl = this.container.querySelector('#thh-terrain-outline');
    if (soilEl) soilEl.setAttribute('d', soilPath);
    if (grassEl) grassEl.setAttribute('d', surfacePath);
    if (outlineEl) outlineEl.setAttribute('d', surfacePath);

    // 9. Render Tractor & Coupled Stage 2 Trailer
    const tractorDeg = (activeTractorPitchRad * 180) / Math.PI;
    const tractorGroup = this.container.querySelector('#thh-tractor-group');
    if (tractorGroup) {
      tractorGroup.setAttribute(
        'transform',
        'translate(' +
          this.tractorScreenX +
          ', ' +
          Math.round(this.tractorY) +
          ') rotate(' +
          tractorDeg.toFixed(1) +
          ')'
      );
    }

    const rearWheel = this.container.querySelector('#thh-wheel-rear');
    const frontWheel = this.container.querySelector('#thh-wheel-front');
    if (rearWheel) {
      rearWheel.setAttribute(
        'transform',
        'translate(0, -28) rotate(' + Math.round(this.wheelRotationDeg) + ')'
      );
    }
    if (frontWheel) {
      frontWheel.setAttribute(
        'transform',
        'translate(86, -20) rotate(' + Math.round(this.wheelRotationDeg * 1.35) + ')'
      );
    }

    if (this.level === 2) {
      const trailerScreenX = this.tractorScreenX - trailerDist;
      const trailerRad = Math.max(
        -0.55,
        Math.min(0.55, Math.atan2(this.tractorY - this.trailerY, trailerDist))
      );
      const trailerDeg = (trailerRad * 180) / Math.PI;

      const trailerGroup = this.container.querySelector('#thh-trailer-group');
      if (trailerGroup) {
        trailerGroup.setAttribute(
          'transform',
          'translate(' +
            trailerScreenX +
            ', ' +
            Math.round(this.trailerY) +
            ') rotate(' +
            trailerDeg.toFixed(1) +
            ')'
        );
      }

      const trailerWheel = this.container.querySelector('#thh-trailer-wheel');
      if (trailerWheel) {
        trailerWheel.setAttribute(
          'transform',
          'translate(0, -20) rotate(' + Math.round(this.wheelRotationDeg * 1.35) + ')'
        );
      }

      for (let i = 0; i < this.cargoItems.length; i++) {
        const cargoEl = this.container.querySelector('#thh-cargo-' + i);
        const c = this.cargoItems[i];
        if (cargoEl) {
          if (!c.active) {
            cargoEl.setAttribute('opacity', '0');
          } else {
            cargoEl.setAttribute('opacity', '1');
            cargoEl.setAttribute(
              'transform',
              'translate(' + c.slotX + ', ' + Math.round(-48 + c.yOffset) + ')'
            );
          }
        }
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