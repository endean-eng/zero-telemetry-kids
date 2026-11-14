/**
 * @file src/games/barn-shape-sort.js
 * @description Launch Module 1 (L-01): Shape & Color Barn Sort.
 *              Pedagogical Basis: Montessori Geometric Cabinet & Chromatic Pairing (Ages 3.0–4.5).
 *              Motor Ergonomics: >= 104x104px draggable tokens, +24px magnetic snap radius, palm-rest debouncing.
 */

const SHAPES = [
  {
    id: 'circle',
    name: 'Circle',
    renderToken: (color) =>
      `<circle cx="52" cy="52" r="40" fill="\${color}" stroke="#0f172a" stroke-width="5"/>`,
    renderHole: (color) =>
      `<circle cx="52" cy="52" r="42" fill="#1e293b" stroke="\${color}" stroke-width="5" stroke-dasharray="8 6"/>`
  },
  {
    id: 'square',
    name: 'Square',
    renderToken: (color) =>
      `<rect x="14" y="14" width="76" height="76" rx="10" fill="\${color}" stroke="#0f172a" stroke-width="5"/>`,
    renderHole: (color) =>
      `<rect x="12" y="12" width="80" height="80" rx="10" fill="#1e293b" stroke="\${color}" stroke-width="5" stroke-dasharray="8 6"/>`
  },
  {
    id: 'triangle',
    name: 'Triangle',
    renderToken: (color) =>
      `<polygon points="52,12 92,88 12,88" fill="\${color}" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`,
    renderHole: (color) =>
      `<polygon points="52,10 94,90 10,90" fill="#1e293b" stroke="\${color}" stroke-width="5" stroke-dasharray="8 6" stroke-linejoin="round"/>`
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    renderToken: (color) =>
      `<polygon points="52,10 90,31 90,73 52,94 14,73 14,31" fill="\${color}" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`,
    renderHole: (color) =>
      `<polygon points="52,8 92,30 92,74 52,96 12,74 12,30" fill="#1e293b" stroke="\${color}" stroke-width="5" stroke-dasharray="8 6" stroke-linejoin="round"/>`
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
  }

  mount(containerEl, audioApi, speechApi, { PointerManager }) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = PointerManager;
    this.startNewRound(true);
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  startNewRound(isFirstRound = false) {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.matchedCount = 0;

    const pickedShapes = shuffle(SHAPES).slice(0, 3);
    const pickedColors = shuffle(COLORS).slice(0, 3);

    this.roundItems = pickedShapes.map((shape, idx) => ({
      key: `${ pickedColors[idx].id }-${ shape.id }`,
      shape,
      color: pickedColors[idx],
      matched: false
    }));

    const trayOrder = shuffle(this.roundItems);

    this.container.innerHTML = `
      <style>
        .bss-stage {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(180deg, #bae6fd 0%, #e0f2fe 62%, #86efac 62%, #4ade80 100%);
          padding: 12px 110px 24px 110px;
          position: relative;
          overflow: hidden;
        }
        .bss-top-bar {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bss-Prompt-btn {
          min-width: 96px;
          min-height: 96px;
          padding: 10px 24px;
          border-radius: 999px;
          background: #ffffff;
          border: 4px solid #0f172a;
          box-shadow: 0 6px 0 #0f172a;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .bss-Prompt-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #0f172a;
        }
        .bss-barns-row {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: clamp(20px, 5vw, 64px);
          width: 100%;
          max-width: 920px;
        }
        .bss-barn-card {
          position: relative;
          width: clamp(160px, 22vw, 210px);
          height: clamp(170px, 24vw, 220px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bss-drop-zone {
          position: absolute;
          bottom: 14px;
          width: 104px;
          height: 104px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
        }
        .bss-tray-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(28px, 6vw, 72px);
          background: rgba(255, 255, 255, 0.85);
          border: 4px solid #0f172a;
          border-radius: 28px;
          padding: 14px 36px;
          min-height: 132px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
        }
        .bss-slot {
          width: 108px;
          height: 108px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .bss-token {
          width: 104px;
          height: 104px;
          cursor: grab;
          touch-action: none;
          will-change: transform;
          z-index: 20;
          transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
          filter: drop-shadow(0 6px 8px rgba(15, 23, 42, 0.25));
        }
        .bss-token.dragging {
          transition: none;
          z-index: 100;
          transform: scale(1.12);
          filter: drop-shadow(0 14px 18px rgba(15, 23, 42, 0.35));
        }
        .bss-token.locked {
          pointer-events: none;
          z-index: 10;
        }
      </style>

      <div class="bss-stage">
        <div class="bss-top-bar">
          <button type="button" class="bss-Prompt-btn" id="bss-repeat-btn" aria-label="Repeat Instructions">
            <span style="font-size:1.8rem;">🔊</span>
            <span>Match the Shapes to the Barns!</span>
          </button>
        </div>

        <div class="bss-barns-row">
          \${this.roundItems
            .map(
              (item) => `
            <div class="bss-barn-card">
              <svg viewBox="0 0 200 210" width="100%" height="100%">
                <path d="M100 14 L16 82 V198 H184 V82 Z" fill="${item.color.hex}" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
                <path d="M100 14 L8 86 M100 14 L192 86" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
                <rect x="38" y="80" width="124" height="118" rx="10" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>
                <circle cx="100" cy="52" r="14" fill="#fef08a" stroke="#0f172a" stroke-width="4"/>
              </svg>
              <div class="bss-drop-zone" data-target-key="${item.key}" id="drop-${item.key}">
                <svg viewBox="0 0 104 104" width="104" height="104">
                  ${item.shape.renderHole(item.color.hex)}
                </svg>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="bss-tray-row">
          \${trayOrder
            .map(
              (item) => `
            <div class="bss-slot">
              <div class="bss-token" data-item-key="${item.key}" data-spoken="${item.color.name} ${item.shape.name}">
                <svg viewBox="0 0 104 104" width="104" height="104">
                  ${item.shape.renderToken(item.color.hex)}
                </svg>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const repeatBtn = this.container.querySelector('#bss-repeat-btn');
    const speakPrompt = () => {
      this.speech.speak('Put the shapes into their matching barn doors!');
    };
    repeatBtn.addEventListener('click', () => {
      this.audio.playNote(523.25, 0.12);
      speakPrompt();
    });

    if (isFirstRound) {
      this._schedule(() => speakPrompt(), 250);
    }

    const tokens = this.container.querySelectorAll('.bss-token');
    tokens.forEach((tokenEl) => {
      const itemKey = tokenEl.getAttribute('data-item-key');
      const spokenLabel = tokenEl.getAttribute('data-spoken');
      const targetEl = this.container.querySelector(`#drop-${itemKey}`);  const cleanup = this.PointerManager.attachDrag(tokenEl, { onStart: () => { tokenEl.classList.add('dragging'); this.audio.playNote(523.25, 0.12); this.speech.speak(spokenLabel); }, onMove: (_x, _y, dx, dy) => { tokenEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`; }, onEnd: (clientX, clientY) => { tokenEl.classList.remove('dragging'); if ( targetEl && this.PointerManager.isWithinSnapRadius(clientX, clientY, targetEl, 24) ) { this._lockTokenToTarget(tokenEl, targetEl, spokenLabel); } else { tokenEl.style.transform = 'translate(0px, 0px)'; this.audio.playGentleThud(); } } });  this.cleanups.push(cleanup); }); }  _lockTokenToTarget(tokenEl, targetEl, spokenLabel) { tokenEl.classList.add('locked'); targetEl.innerHTML = tokenEl.innerHTML; tokenEl.style.visibility = 'hidden';  this.audio.playSuccessChord(); this.speech.speak(`${spokenLabel}!`);
    this.matchedCount += 1;

    if (this.matchedCount >= this.roundItems.length) {
      this._schedule(() => {
        this.speech.speak('Great job! Let us sort some more!');
      }, 900);
      this._schedule(() => {
        this.startNewRound(false);
      }, 2400);
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
