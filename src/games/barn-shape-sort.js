/**
 * @file src/games/barn-shape-sort.js
 * @description Launch Module 1 (L-01): Shape & Color Barn Sort with Level 1 (Color+Shape)
 *              and Level 2 (Shape-Only / Mismatched Colors -- Montessori Isolation of Quality).
 *              100% pure ASCII with Unicode escapes and zero template literals.
 */

const SHAPES = [
  {
    id: 'circle',
    name: 'Circle',
    renderToken: (color) =>
      '<circle cx="52" cy="52" r="40" fill="' + color + '" stroke="#0f172a" stroke-width="5"/>',
    renderHole: (strokeColor) =>
      '<circle cx="52" cy="52" r="42" fill="#1e293b" stroke="' + strokeColor + '" stroke-width="5" stroke-dasharray="8 6"/>'
  },
  {
    id: 'square',
    name: 'Square',
    renderToken: (color) =>
      '<rect x="14" y="14" width="76" height="76" rx="10" fill="' + color + '" stroke="#0f172a" stroke-width="5"/>',
    renderHole: (strokeColor) =>
      '<rect x="12" y="12" width="80" height="80" rx="10" fill="#1e293b" stroke="' + strokeColor + '" stroke-width="5" stroke-dasharray="8 6"/>'
  },
  {
    id: 'triangle',
    name: 'Triangle',
    renderToken: (color) =>
      '<polygon points="52,12 92,88 12,88" fill="' + color + '" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>',
    renderHole: (strokeColor) =>
      '<polygon points="52,10 94,90 10,90" fill="#1e293b" stroke="' + strokeColor + '" stroke-width="5" stroke-dasharray="8 6" stroke-linejoin="round"/>'
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    renderToken: (color) =>
      '<polygon points="52,10 90,31 90,73 52,94 14,73 14,31" fill="' + color + '" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>',
    renderHole: (strokeColor) =>
      '<polygon points="52,8 92,30 92,74 52,96 12,74 12,30" fill="#1e293b" stroke="' + strokeColor + '" stroke-width="5" stroke-dasharray="8 6" stroke-linejoin="round"/>'
  }
];

const COLORS = [
  { id: 'red', name: 'Red', hex: '#dc2626' },
  { id: 'green', name: 'Green', hex: '#16a34a' },
  { id: 'yellow', name: 'Yellow', hex: '#f59e0b' },
  { id: 'blue', name: 'Blue', hex: '#2563eb' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed' },
  { id: 'orange', name: 'Orange', hex: '#ea580c' }
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default class BarnShapeSortGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.PointerManager = null;
    this.cleanups = [];
    this.timers = [];
    this.roundItems = [];
    this.matchedCount = 0;
    this.level = 1; // Level 1: Color + Shape match | Level 2: Shape-only (randomized colors)
    this.completedRoundsInLevel1 = 0;
  }

  mount(containerEl, audioApi, speechApi, { PointerManager }) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = PointerManager;
    this.level = 1;
    this.completedRoundsInLevel1 = 0;
    this.startNewRound(true);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  startNewRound(announcePrompt = false) {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.matchedCount = 0;

    const pickedShapes = shuffle(SHAPES).slice(0, 3);
    const shuffledColors = shuffle(COLORS);
    const barnColors = shuffledColors.slice(0, 3);
    // In Level 2, assign completely different colors to the tokens so child must match strictly by shape!
    const tokenColors =
      this.level === 1 ? barnColors : shuffledColors.slice(3, 6);

    this.roundItems = pickedShapes.map((shape, idx) => ({
      key: shape.id,
      shape,
      barnColor: barnColors[idx],
      tokenColor: tokenColors[idx],
      holeStrokeHex: this.level === 1 ? barnColors[idx].hex : '#94a3b8'
    }));

    const trayOrder = shuffle(this.roundItems);

    const barnsHtml = this.roundItems
      .map(
        (item) =>
          '<div class="bss-barn-card">' +
          '<svg viewBox="0 0 200 210" width="100%" height="100%">' +
          '<path d="M100 14 L16 82 V198 H184 V82 Z" fill="' +
          item.barnColor.hex +
          '" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>' +
          '<path d="M100 14 L8 86 M100 14 L192 86" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>' +
          '<rect x="38" y="80" width="124" height="118" rx="10" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>' +
          '<circle cx="100" cy="52" r="14" fill="#fef08a" stroke="#0f172a" stroke-width="4"/>' +
          '</svg>' +
          '<div class="bss-drop-zone" data-target-key="' +
          item.key +
          '" id="drop-' +
          item.key +
          '">' +
          '<svg viewBox="0 0 104 104" width="100%" height="100%">' +
          item.shape.renderHole(item.holeStrokeHex) +
          '</svg>' +
          '</div>' +
          '</div>'
      )
      .join('');

    const trayHtml = trayOrder
      .map(
        (item) =>
          '<div class="bss-slot">' +
          '<div class="bss-token" data-item-key="' +
          item.key +
          '" data-spoken="' +
          item.tokenColor.name +
          ' ' +
          item.shape.name +
          '">' +
          '<svg viewBox="0 0 104 104" width="100%" height="100%">' +
          item.shape.renderToken(item.tokenColor.hex) +
          '</svg>' +
          '</div>' +
          '</div>'
      )
      .join('');

    const levelBadgeText =
      this.level === 1
        ? '\u2B50 Level 1: Color + Shape'
        : '\uD83C\uDF1F Level 2: Shape Only!';

    this.container.innerHTML =
      '<style>' +
      '.bss-stage {' +
      '  width: 100%; height: 100%; display: flex; flex-direction: column;' +
      '  justify-content: space-between; align-items: center;' +
      '  background: linear-gradient(180deg, #bae6fd 0%, #e0f2fe 62%, #86efac 62%, #4ade80 100%);' +
      '  padding: 12px 110px 20px 110px; position: relative; overflow: hidden;' +
      '}' +
      '.bss-top-bar { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }' +
      '.bss-prompt-btn {' +
      '  min-width: 96px; min-height: 84px; padding: 10px 22px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 6px 0 #0f172a;' +
      '  font-size: 1.15rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; cursor: pointer;' +
      '}' +
      '.bss-level-btn {' +
      '  min-height: 84px; padding: 10px 20px; border-radius: 999px;' +
      '  background: ' +
      (this.level === 1 ? '#fef08a' : '#ddd6fe') +
      '; border: 4px solid #0f172a; box-shadow: 0 6px 0 #0f172a;' +
      '  font-size: 1.1rem; font-weight: 800; color: #0f172a; cursor: pointer;' +
      '}' +
      '.bss-barns-row {' +
      '  display: flex; justify-content: center; align-items: flex-end;' +
      '  gap: clamp(16px, 4.5vw, 64px); width: 100%; max-width: 920px;' +
      '}' +
      '.bss-barn-card {' +
      '  position: relative;' +
      '  width: clamp(118px, min(22vw, 41vh), 210px);' +
      '  height: clamp(124px, min(24vw, 43vh), 220px);' +
      '  display: flex; align-items: center; justify-content: center;' +
      '}' +
      '.bss-drop-zone {' +
      '  position: absolute; bottom: 7%; width: 50%; height: 48%;' +
      '  display: flex; align-items: center; justify-content: center; border-radius: 14px;' +
      '}' +
      '.bss-tray-row {' +
      '  display: flex; justify-content: center; align-items: center; gap: clamp(20px, 5vw, 72px);' +
      '  background: rgba(255, 255, 255, 0.88); border: 4px solid #0f172a; border-radius: 28px;' +
      '  padding: 12px 32px; min-height: 124px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);' +
      '}' +
      '.bss-slot {' +
      '  width: clamp(68px, 19vh, 108px); height: clamp(68px, 19vh, 108px);' +
      '  display: flex; align-items: center; justify-content: center; position: relative;' +
      '}' +
      '.bss-token {' +
      '  width: clamp(64px, 18vh, 104px); height: clamp(64px, 18vh, 104px);' +
      '  cursor: grab; touch-action: none; will-change: transform; z-index: 20;' +
      '  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); filter: drop-shadow(0 6px 8px rgba(15, 23, 42, 0.25));' +
      '}' +
      '.bss-token svg, .bss-drop-zone svg { width: 100%; height: 100%; display: block; }' +
      '.bss-token.dragging { transition: none; z-index: 100; filter: drop-shadow(0 14px 18px rgba(15, 23, 42, 0.35)); }' +
      '.bss-token.locked { pointer-events: none; z-index: 10; }' +
      '@media (max-height: 520px) {' +
      '  .bss-stage { padding: 6px 68px 8px 68px; }' +
      '  .bss-tray-row { min-height: 0; padding: 6px 24px; border-radius: 20px; border-width: 3px; }' +
      '}' +
      '</style>' +
      '<div class="bss-stage">' +
      '<div class="bss-top-bar">' +
      '<button type="button" class="bss-prompt-btn" id="bss-repeat-btn" aria-label="Repeat Instructions">' +
      '<span style="font-size:1.5rem;">\uD83D\uDD0A</span>' +
      '<span>Match the Shapes to the Barns!</span>' +
      '</button>' +
      '<button type="button" class="bss-level-btn" id="bss-level-btn">' +
      levelBadgeText +
      '</button>' +
      '</div>' +
      '<div class="bss-barns-row">' +
      barnsHtml +
      '</div>' +
      '<div class="bss-tray-row">' +
      trayHtml +
      '</div>' +
      '</div>';

    const repeatBtn = this.container.querySelector('#bss-repeat-btn');
    const levelBtn = this.container.querySelector('#bss-level-btn');

    const speakPrompt = () => {
      if (this.level === 1) {
        this.speech.speak('Put the shapes into their matching barn doors!');
      } else {
        this.speech.speak(
          'Level two! Look closely at the shape, even when the colors are different!'
        );
      }
    };

    repeatBtn.addEventListener('click', () => {
      this.audio.playNote(523.25, 0.12);
      speakPrompt();
    });

    levelBtn.addEventListener('click', () => {
      this.level = this.level === 1 ? 2 : 1;
      this.audio.playNote(659.25, 0.15);
      this.startNewRound(true);
    });

    if (announcePrompt) {
      this._schedule(() => speakPrompt(), 250);
    }

    const tokens = this.container.querySelectorAll('.bss-token');
    tokens.forEach((tokenEl) => {
      const itemKey = tokenEl.getAttribute('data-item-key');
      const spokenLabel = tokenEl.getAttribute('data-spoken');
      const targetEl = this.container.querySelector('#drop-' + itemKey);

      const cleanup = this.PointerManager.attachDrag(tokenEl, {
        onStart: () => {
          tokenEl.classList.add('dragging');
          this.audio.playNote(523.25, 0.12);
          this.speech.speak(spokenLabel);
        },
        onMove: (_x, _y, dx, dy) => {
          tokenEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.1)';
        },
        onEnd: (clientX, clientY) => {
          tokenEl.classList.remove('dragging');
          if (
            targetEl &&
            this.PointerManager.isWithinSnapRadius(clientX, clientY, targetEl, 24)
          ) {
            this._lockTokenToTarget(tokenEl, targetEl, spokenLabel);
          } else {
            tokenEl.style.transform = 'translate(0px, 0px)';
            this.audio.playGentleThud();
          }
        }
      });

      this.cleanups.push(cleanup);
    });
  }

  _lockTokenToTarget(tokenEl, targetEl, spokenLabel) {
    tokenEl.classList.add('locked');
    targetEl.innerHTML = tokenEl.innerHTML;
    tokenEl.style.visibility = 'hidden';

    this.audio.playSuccessChord();
    this.speech.speak(spokenLabel + '!');
    this.matchedCount += 1;

    if (this.matchedCount >= this.roundItems.length) {
      let autoPromoted = false;
      if (this.level === 1) {
        this.completedRoundsInLevel1 += 1;
        // Automatically introduce Level 2 after 3 completed Level 1 rounds
        if (this.completedRoundsInLevel1 >= 3) {
          this.level = 2;
          autoPromoted = true;
        }
      }

      this._schedule(() => {
        if (autoPromoted) {
          this.speech.speak('Awesome! Ready for Level Two? Match the shapes!');
        } else {
          this.speech.speak('Great job! Let us sort some more!');
        }
      }, 900);

      this._schedule(() => {
        this.startNewRound(false);
      }, 2500);
    }
  }

  unmount() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (this.speech) this.speech.cancel();
    if (this.container) this.container.innerHTML = '';
  }
}