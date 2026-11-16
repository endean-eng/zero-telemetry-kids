/**
 * @file src/games/hay-bale-bounce.js
 * @description Kinematic Action & Physics Module (K-01): Hay Bale Bounce (Barn Loft Rally).
 *              Cooperative, non-punitive Pong/Breakout adaptation teaching predictive trajectory
 *              tracking, hand-eye interception timing, and rhythmic rally counting.
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

const CROP_SPRITES = [
  {
    name: 'apple',
    svg:
      '<path d="M0 -24 L4 -36" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="10" cy="-30" rx="9" ry="4.5" transform="rotate(-20 10 -30)" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="0" cy="0" r="26" fill="#dc2626" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="-9" cy="-9" r="6" fill="#fca5a5"/>'
  },
  {
    name: 'pumpkin',
    svg:
      '<path d="M-4 -24 L4 -34 L6 -22 Z" fill="#16a34a" stroke="#0f172a" stroke-width="3.5"/>' +
      '<ellipse cx="-12" cy="0" rx="16" ry="22" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="12" cy="0" rx="16" ry="22" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="0" cy="0" rx="18" ry="24" fill="#f97316" stroke="#0f172a" stroke-width="4"/>'
  },
  {
    name: 'melon',
    svg:
      '<circle cx="0" cy="0" r="26" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>' +
      '<path d="M-14 -21 Q0 0 -14 21" fill="none" stroke="#86efac" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M0 -25 Q10 0 0 25" fill="none" stroke="#86efac" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M14 -21 Q22 0 14 21" fill="none" stroke="#86efac" stroke-width="4" stroke-linecap="round"/>'
  }
];

export default class HayBaleBounceGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.PointerManager = null;
    this.cleanups = [];
    this.timers = [];
    this.rafId = null;

    // Virtual 1000 x 560 landscape coordinate system
    this.worldWidth = 1000;
    this.worldHeight = 560;

    this.level = 1;
    this.score = 0;
    this.bestScore = 0;
    this.cropIndex = 0;

    // Hay Wagon Paddle state
    this.paddleWidth = 240;
    this.paddleHeight = 42;
    this.paddleY = 472;
    this.paddleX = 500 - 120;
    this.paddleSquash = 0;

    // Bouncing Crop Ball state
    this.ballRadius = 26;
    this.ballX = 500;
    this.ballY = 210;
    this.ballVx = 135;
    this.ballVy = 225;
    this.ballRotation = 0;
    this.loftCooldownMs = 0;

    // Tracks whether the current upward flight was legitimately bounced off the Hay Wagon
    // (Prevents scoring if the ball bounced off the grass floor instead of the cart)
    this.isCartBounceActive = false;

    // Level 2 Target Baskets
    this.baskets = [
      { id: 0, x: 185, y: 102, width: 170, height: 68, points: 1, color: '#dc2626' },
      { id: 1, x: 415, y: 102, width: 170, height: 68, points: 2, color: '#2563eb' },
      { id: 2, x: 645, y: 102, width: 170, height: 68, points: 3, color: '#16a34a' }
    ];
    this.bonusBasketIndex = 1;

    // Keyboard state
    this.keysHeld = { left: false, right: false };
    this.lastFrameTime = 0;
  }

  mount(containerEl, audioApi, speechApi, helpers) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = helpers && helpers.PointerManager ? helpers.PointerManager : null;

    this.level = 1;
    this.score = 0;
    this.bestScore = 0;

    // Always configure level dimensions BEFORE renderStage so paddleWidth & SVG match 1-to-1
    this._configureLevelDimensions();
    this.renderStage();
    this._resetBallAndHud(true);
    this._bindInputs();

    this.lastFrameTime = performance.now();
    this._loop(this.lastFrameTime);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  _configureLevelDimensions() {
    this.score = 0;
    this.paddleWidth = this.level === 1 ? 240 : 160;
    this.paddleX = (this.worldWidth - this.paddleWidth) / 2;
    this.paddleSquash = 0;
    this.bonusBasketIndex = Math.floor(Math.random() * 3);
  }

  _resetBallAndHud(announce) {
    this._serveBallFromLoft();
    this._updateHud();

    const paddleGroup = this.container.querySelector('#hbb-paddle-group');
    if (paddleGroup) {
      paddleGroup.innerHTML = this._buildPaddleSvg(this.paddleWidth, this.paddleHeight);
    }

    if (announce) {
      const msg =
        this.level === 1
          ? 'Slide the hay wagon to bounce the apples up into the barn loft!'
          : 'Stage Two! Aim your bounce into the numbered harvest baskets!';
      this._schedule(() => this.speech.speak(msg), 180);
    }
  }

  _serveBallFromLoft() {
    this.ballX = 500 + (Math.random() * 140 - 70);
    this.ballY = 185;
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.ballVx = dir * (110 + Math.random() * 65);
    this.ballVy = this.level === 1 ? 225 : 265;
    this.loftCooldownMs = 350;
    this.isCartBounceActive = false;

    this.cropIndex = (this.cropIndex + 1) % CROP_SPRITES.length;
    const cropContentEl = this.container.querySelector('#hbb-ball-content');
    if (cropContentEl) {
      cropContentEl.innerHTML = CROP_SPRITES[this.cropIndex].svg;
    }
  }

  renderStage() {
    const levelBtnLabel =
      this.level === 1
        ? '\u2605 Stage 1: Wide Wagon'
        : '\u2605\u2605 Stage 2: Aim Baskets';

    const loftTargetsSvg =
      this.level === 1
        ? /* Level 1: Single Wide Cooperative Barn Loft Target */
          '<g id="hbb-loft-single">' +
          '  <path d="M270 96 L500 58 L730 96 V176 H270 Z" fill="#dc2626" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>' +
          '  <rect x="310" y="104" width="380" height="68" rx="14" fill="#fef08a" stroke="#0f172a" stroke-width="4"/>' +
          '  <path d="M322 168 Q410 132 500 162 Q590 132 678 168 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>' +
          '  <text x="500" y="146" text-anchor="middle" font-size="26" font-weight="900" fill="#92400e" font-family="system-ui, sans-serif">BARN LOFT (+1)</text>' +
          '</g>'
        : /* Level 2: Three Numbered Harvest Baskets (+1, +2, +3) */
          '<g id="hbb-loft-baskets">' +
          this.baskets
            .map((b, idx) => {
              const isBonus = idx === this.bonusBasketIndex;
              const fillBg = isBonus ? '#fef08a' : '#ffffff';
              const strokeW = isBonus ? '6' : '4';
              const label = isBonus ? '\u2605 +' + b.points : '+' + b.points;
              return (
                '<g id="hbb-basket-' +
                idx +
                '" transform="translate(' +
                b.x +
                ', ' +
                b.y +
                ')">' +
                '<rect x="0" y="0" width="' +
                b.width +
                '" height="' +
                b.height +
                '" rx="16" fill="' +
                fillBg +
                '" stroke="#0f172a" stroke-width="' +
                strokeW +
                '"/>' +
                '<rect x="10" y="8" width="' +
                (b.width - 20) +
                '" height="14" rx="6" fill="' +
                b.color +
                '"/>' +
                '<text id="hbb-basket-text-' +
                idx +
                '" x="' +
                b.width / 2 +
                '" y="52" text-anchor="middle" font-size="28" font-weight="900" fill="#0f172a" font-family="system-ui, sans-serif">' +
                label +
                '</text>' +
                '</g>'
              );
            })
            .join('') +
          '</g>';

    this.container.innerHTML =
      '<style>' +
      '.hbb-root {' +
      '  width: 100%; height: 100%; position: relative; overflow: hidden;' +
      '  touch-action: none; user-select: none; background: #bae6fd;' +
      '}' +
      '.hbb-top-bar {' +
      '  position: relative; z-index: 40; display: flex; align-items: center;' +
      '  justify-content: center; gap: 14px; padding: 10px 110px 0 110px; flex-wrap: wrap;' +
      '}' +
      '.hbb-btn {' +
      '  min-height: 70px; padding: 6px 20px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.05rem; font-weight: 800; color: #0f172a;' +
      '  display: flex; align-items: center; gap: 10px; cursor: pointer;' +
      '}' +
      '.hbb-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #0f172a; }' +
      '.hbb-level-btn { background: #fef08a; }' +
      '.hbb-score-pill {' +
      '  min-height: 70px; padding: 6px 22px; border-radius: 999px;' +
      '  background: #dcfce7; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.45rem; font-weight: 900; color: #166534;' +
      '  display: flex; align-items: center; gap: 8px; transition: transform 0.15s ease, background-color 0.2s ease;' +
      '}' +
      '.hbb-score-pill.pop { transform: scale(1.18); background: #fef08a; color: #92400e; }' +
      '.hbb-score-pill.reset-bump { transform: scale(0.92); background: #fee2e2; color: #991b1b; }' +
      '.hbb-world-svg {' +
      '  position: absolute; inset: 0; width: 100%; height: 100%; z-index: 10;' +
      '}' +
      '</style>' +
      '<div class="hbb-root" id="hbb-stage">' +
      '  <div class="hbb-top-bar">' +
      '    <button type="button" class="hbb-btn" id="hbb-repeat-btn">' +
      '      <span style="font-size:1.4rem;">\u266B</span>' +
      '      <span>Slide the Hay Wagon!</span>' +
      '    </button>' +
      '    <button type="button" class="hbb-btn hbb-level-btn" id="hbb-level-btn">' +
      levelBtnLabel +
      '    </button>' +
      '    <div class="hbb-score-pill" id="hbb-score-pill">Rally: 0 (\u2605 Best: ' +
      this.bestScore +
      ')</div>' +
      '  </div>' +
      '  <svg class="hbb-world-svg" id="hbb-svg" viewBox="0 0 1000 560" preserveAspectRatio="none">' +
      '    <defs>' +
      '      <linearGradient id="hbb-sky" x1="0" y1="0" x2="0" y2="1">' +
      '        <stop offset="0%" stop-color="#bae6fd" />' +
      '        <stop offset="100%" stop-color="#e0f2fe" />' +
      '      </linearGradient>' +
      '    </defs>' +
      /* Sky & Barn Wall Pillars */
      '    <rect x="0" y="0" width="1000" height="490" fill="url(#hbb-sky)" />' +
      '    <rect x="0" y="88" width="46" height="405" fill="#dc2626" stroke="#0f172a" stroke-width="4" />' +
      '    <rect x="954" y="88" width="46" height="405" fill="#dc2626" stroke="#0f172a" stroke-width="4" />' +
      /* Soft Bouncy Pasture Grass Floor (Resets Rally to 0 on miss, but keeps game going!) */
      '    <rect x="0" y="490" width="1000" height="70" fill="#22c55e" stroke="#0f172a" stroke-width="5" />' +
      '    <line x1="46" y1="494" x2="954" y2="494" stroke="#86efac" stroke-width="4" stroke-dasharray="18 14" />' +
      /* Top Barn Loft / Baskets */
      loftTargetsSvg +
      /* Particle Burst Layer */
      '    <g id="hbb-particles"></g>' +
      /* Bouncing Harvest Crop Ball */
      '    <g id="hbb-ball-group" transform="translate(500, 210)">' +
      '      <g id="hbb-ball-content">' +
      CROP_SPRITES[0].svg +
      '      </g>' +
      '    </g>' +
      /* Draggable Springy Hay Bale Wagon Paddle */
      '    <g id="hbb-paddle-group" transform="translate(' +
      this.paddleX +
      ', ' +
      this.paddleY +
      ')" style="cursor: grab;">' +
      this._buildPaddleSvg(this.paddleWidth, this.paddleHeight) +
      '    </g>' +
      '  </svg>' +
      '</div>';
  }

  _buildPaddleSvg(w, h) {
    const wheelLeftX = Math.max(24, Math.round(w * 0.2));
    const wheelRightX = Math.min(w - 24, Math.round(w * 0.8));
    const twine1 = Math.round(w * 0.33);
    const twine2 = Math.round(w * 0.67);

    return (
      /* Golden Hay Bale Top Cushion (Exact 0..w width) */
      '<rect x="0" y="0" width="' +
      w +
      '" height="' +
      (h - 10) +
      '" rx="12" fill="#facc15" stroke="#0f172a" stroke-width="4.5"/>' +
      '<line x1="' +
      twine1 +
      '" y1="2" x2="' +
      twine1 +
      '" y2="' +
      (h - 12) +
      '" stroke="#ca8a04" stroke-width="4"/>' +
      '<line x1="' +
      twine2 +
      '" y1="2" x2="' +
      twine2 +
      '" y2="' +
      (h - 12) +
      '" stroke="#ca8a04" stroke-width="4"/>' +
      /* Orange Wagon Bed Frame */
      '<rect x="6" y="' +
      (h - 14) +
      '" width="' +
      (w - 12) +
      '" height="12" rx="5" fill="#ea580c" stroke="#0f172a" stroke-width="3.5"/>' +
      /* Wagon Wheels */
      '<circle cx="' +
      wheelLeftX +
      '" cy="' +
      (h + 2) +
      '" r="13" fill="#1e293b" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="' +
      wheelLeftX +
      '" cy="' +
      (h + 2) +
      '" r="5" fill="#f59e0b"/>' +
      '<circle cx="' +
      wheelRightX +
      '" cy="' +
      (h + 2) +
      '" r="13" fill="#1e293b" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="' +
      wheelRightX +
      '" cy="' +
      (h + 2) +
      '" r="5" fill="#f59e0b"/>'
    );
  }

  _bindInputs() {
    const repeatBtn = this.container.querySelector('#hbb-repeat-btn');
    const levelBtn = this.container.querySelector('#hbb-level-btn');
    const stageEl = this.container.querySelector('#hbb-stage');
    const svgEl = this.container.querySelector('#hbb-svg');

    if (repeatBtn) {
      repeatBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.audio.playNote(523.25, 0.12);
        this.speech.speak(
          this.level === 1
            ? 'Slide the hay wagon under the bouncing crop!'
            : 'Stage Two! Bounce the crop into the numbered baskets!'
        );
      });
    }

    if (levelBtn) {
      levelBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.level = this.level === 1 ? 2 : 1;
        this.audio.playSuccessChord();
        // Set new level dimensions FIRST so renderStage draws the exact matching SVG width!
        this._configureLevelDimensions();
        this.renderStage();
        this._resetBallAndHud(true);
        this._bindInputs();
      });
    }

    let activePointerId = null;

    const movePaddleToClientX = (clientX) => {
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      if (rect.width <= 0) return;
      const worldX = ((clientX - rect.left) / rect.width) * this.worldWidth;
      const minX = 50;
      const maxX = this.worldWidth - 50 - this.paddleWidth;
      this.paddleX = Math.max(minX, Math.min(maxX, worldX - this.paddleWidth / 2));
    };

    const onPointerDown = (e) => {
      if (e.clientY < 96) return;
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      movePaddleToClientX(e.clientX);
    };

    const onPointerMove = (e) => {
      if (
        e.pointerId === activePointerId ||
        (e.pointerType === 'mouse' && e.buttons === 1 && e.clientY >= 96)
      ) {
        movePaddleToClientX(e.clientX);
      }
    };

    const onPointerUp = (e) => {
      if (e.pointerId === activePointerId) {
        activePointerId = null;
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
    };
    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keysHeld.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keysHeld.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });
  }

  _spawnParticles(cx, cy, colorHex, count) {
    const pGroup = this.container.querySelector('#hbb-particles');
    if (!pGroup) return;

    for (let i = 0; i < count; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const angle = (Math.PI * 2 * i) / count;
      const px = cx + Math.cos(angle) * 32;
      const py = cy + Math.sin(angle) * 28;
      circle.setAttribute('cx', String(Math.round(px)));
      circle.setAttribute('cy', String(Math.round(py)));
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', colorHex);
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

  _updateHud(animClass) {
    const pill = this.container.querySelector('#hbb-score-pill');
    if (pill) {
      pill.textContent = 'Rally: ' + this.score + ' (\u2605 Best: ' + this.bestScore + ')';
      pill.classList.remove('pop', 'reset-bump');
      if (animClass) {
        pill.classList.add(animClass);
        this._schedule(() => pill.classList.remove(animClass), 220);
      }
    }

    if (this.level === 2) {
      this.baskets.forEach((b, idx) => {
        const rectEl = this.container.querySelector('#hbb-basket-' + idx + ' rect');
        const textEl = this.container.querySelector('#hbb-basket-text-' + idx);
        const isBonus = idx === this.bonusBasketIndex;
        if (rectEl) {
          rectEl.setAttribute('fill', isBonus ? '#fef08a' : '#ffffff');
          rectEl.setAttribute('stroke-width', isBonus ? '6' : '4');
        }
        if (textEl) {
          textEl.textContent = isBonus ? '\u2605 +' + b.points : '+' + b.points;
        }
      });
    }
  }

  _scoreLoftHit(pointsAdded, hitX, hitY) {
    this.loftCooldownMs = 450;
    // Consume the cart bounce token so a single bounce can only score once
    this.isCartBounceActive = false;

    this.score += pointsAdded;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }

    const noteIdx = this.score % PENTATONIC_SCALE.length;
    this.audio.playNote(PENTATONIC_SCALE[noteIdx], 0.22);

    if (this.score % 5 === 0 || pointsAdded >= 3) {
      this._schedule(() => this.audio.playSuccessChord(), 80);
      this._spawnParticles(hitX, hitY, '#facc15', 8);
    } else {
      this._spawnParticles(hitX, hitY, '#86efac', 5);
    }

    this.speech.speak(String(this.score));

    if (this.level === 2) {
      this.bonusBasketIndex = (this.bonusBasketIndex + 1) % this.baskets.length;
    }

    if (this.score % 3 === 0) {
      this.cropIndex = (this.cropIndex + 1) % CROP_SPRITES.length;
      const cropContentEl = this.container.querySelector('#hbb-ball-content');
      if (cropContentEl) {
        cropContentEl.innerHTML = CROP_SPRITES[this.cropIndex].svg;
      }
    }

    this._updateHud('pop');
  }

  _loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    if (this.loftCooldownMs > 0) {
      this.loftCooldownMs = Math.max(0, this.loftCooldownMs - dt * 1000);
    }
    if (this.paddleSquash > 0) {
      this.paddleSquash = Math.max(0, this.paddleSquash - dt * 4);
    }

    // Keyboard movement support
    const keySpeed = 520;
    if (this.keysHeld.left) {
      this.paddleX = Math.max(50, this.paddleX - keySpeed * dt);
    }
    if (this.keysHeld.right) {
      this.paddleX = Math.min(
        this.worldWidth - 50 - this.paddleWidth,
        this.paddleX + keySpeed * dt
      );
    }

    // Gentle gravity
    const gravity = this.level === 1 ? 95 : 130;
    this.ballVy += gravity * dt;

    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;
    this.ballRotation += this.ballVx * dt * 0.25;

    // 1. Left & Right Barn Wall Bounces
    const leftWallX = 46 + this.ballRadius;
    const rightWallX = 954 - this.ballRadius;

    if (this.ballX < leftWallX) {
      this.ballX = leftWallX;
      this.ballVx = Math.abs(this.ballVx);
      this.audio.playNote(329.63, 0.08);
    } else if (this.ballX > rightWallX) {
      this.ballX = rightWallX;
      this.ballVx = -Math.abs(this.ballVx);
      this.audio.playNote(329.63, 0.08);
    }

    // 2. Top Ceiling & Barn Loft / Basket Scoring (ONLY scores if this.isCartBounceActive is true!)
    if (this.level === 1) {
      if (
        this.loftCooldownMs <= 0 &&
        this.ballVy < 0 &&
        this.ballY - this.ballRadius <= 176 &&
        this.ballX >= 290 &&
        this.ballX <= 710
      ) {
        this.ballY = 176 + this.ballRadius;
        this.ballVy = Math.max(210, Math.abs(this.ballVy) * 0.92);
        if (this.isCartBounceActive) {
          this._scoreLoftHit(1, this.ballX, 160);
        }
      } else if (this.ballY - this.ballRadius < 96) {
        this.ballY = 96 + this.ballRadius;
        this.ballVy = Math.abs(this.ballVy);
      }
    } else {
      let hitBasket = false;
      if (this.loftCooldownMs <= 0 && this.ballVy < 0 && this.ballY - this.ballRadius <= 172) {
        for (let i = 0; i < this.baskets.length; i++) {
          const b = this.baskets[i];
          if (this.ballX >= b.x - 6 && this.ballX <= b.x + b.width + 6) {
            this.ballY = 172 + this.ballRadius;
            this.ballVy = Math.max(245, Math.abs(this.ballVy) * 0.94);
            if (this.isCartBounceActive) {
              const pts = i === this.bonusBasketIndex ? b.points + 1 : b.points;
              this._scoreLoftHit(pts, this.ballX, 160);
            }
            hitBasket = true;
            break;
          }
        }
      }
      if (!hitBasket && this.ballY - this.ballRadius < 96) {
        this.ballY = 96 + this.ballRadius;
        this.ballVy = Math.abs(this.ballVy);
      }
    }

    // 3. Hay Bale Wagon Paddle Interception (True visual hitbox: paddleX - 6 to paddleX + paddleWidth + 6)
    const paddleTop = this.paddleY;
    const paddleLeft = this.paddleX - 6;
    const paddleRight = this.paddleX + this.paddleWidth + 6;

    if (
      this.ballVy > 0 &&
      this.ballY + this.ballRadius >= paddleTop &&
      this.ballY - this.ballRadius <= paddleTop + this.paddleHeight &&
      this.ballX >= paddleLeft &&
      this.ballX <= paddleRight
    ) {
      this.ballY = paddleTop - this.ballRadius;

      const paddleCenter = this.paddleX + this.paddleWidth / 2;
      const normalizedOffset = Math.max(
        -1,
        Math.min(1, (this.ballX - paddleCenter) / (this.paddleWidth / 2))
      );

      if (this.level === 1) {
        this.ballVx = normalizedOffset * 190 + (500 - this.ballX) * 0.22;
        this.ballVy = -360;
      } else {
        this.ballVx = normalizedOffset * 340;
        this.ballVy = -415;
      }

      // Arm scoring because the player legitimately bounced the crop off the Hay Wagon!
      this.isCartBounceActive = true;
      this.paddleSquash = 1.0;
      this.audio.playNote(440.0, 0.14);
      this._spawnParticles(this.ballX, paddleTop, '#facc15', 5);
    }

    // 4. Grass Floor Miss Bounce (Resets Rally to 0 and disarms loft scoring!)
    const grassFloorY = 490 - this.ballRadius;
    if (this.ballY >= grassFloorY) {
      this.ballY = grassFloorY;
      // Gentle hop up to mid-screen (cannot reach loft, and disarms scoring until bounced off cart)
      this.ballVy = -265;
      this.isCartBounceActive = false;

      if (this.score > 0) {
        this.score = 0;
        this._updateHud('reset-bump');
      }

      this.audio.playGentleThud();
      this._spawnParticles(this.ballX, 490, '#86efac', 4);
    }

    // Render SVG transforms (Translate paddle without scaling from x=0 origin so right edge never shifts!)
    const ballGroup = this.container.querySelector('#hbb-ball-group');
    if (ballGroup) {
      ballGroup.setAttribute(
        'transform',
        'translate(' +
          Math.round(this.ballX) +
          ', ' +
          Math.round(this.ballY) +
          ') rotate(' +
          Math.round(this.ballRotation) +
          ')'
      );
    }

    const paddleGroup = this.container.querySelector('#hbb-paddle-group');
    if (paddleGroup) {
      const bounceOffsetY = Math.round(this.paddleSquash * 6);
      paddleGroup.setAttribute(
        'transform',
        'translate(' +
          Math.round(this.paddleX) +
          ', ' +
          Math.round(this.paddleY + bounceOffsetY) +
          ')'
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