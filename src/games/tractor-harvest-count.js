/**
 * @file src/games/tractor-harvest-count.js
 * @description Launch Module 2 (L-02): Tractor Harvest Counting (1–10).
 *              Pedagogical Basis: Montessori Spindle Box & Number Rods (One-to-One Correspondence).
 *              Motor Ergonomics: >= 96x96px harvest items, +24px magnetic wagon bed snap, spoken count on each drop.
 */

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
  'Ten'
];

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

const CROPS = [
  {
    id: 'pumpkin',
    singular: 'pumpkin',
    plural: 'pumpkins',
    svg: `
      <svg viewBox="0 0 96 96" width="92" height="92">
        <path d="M44 14 C44 8, 54 8, 54 18 L52 28 L44 28 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>
        <ellipse cx="32" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>
        <ellipse cx="64" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>
        <ellipse cx="48" cy="56" rx="22" ry="28" fill="#f97316" stroke="#0f172a" stroke-width="4"/>
      </svg>
    `
  },
  {
    id: 'apple',
    singular: 'apple',
    plural: 'apples',
    svg: `
      <svg viewBox="0 0 96 96" width="92" height="92">
        <path d="M48 24 L52 10" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="60" cy="18" rx="10" ry="5" transform="rotate(-20 60 18)" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>
        <circle cx="48" cy="56" r="28" fill="#dc2626" stroke="#0f172a" stroke-width="4"/>
        <circle cx="38" cy="46" r="6" fill="#fca5a5"/>
      </svg>
    `
  },
  {
    id: 'corn',
    singular: 'ear of corn',
    plural: 'ears of corn',
    svg: `
      <svg viewBox="0 0 96 96" width="92" height="92">
        <ellipse cx="48" cy="48" rx="18" ry="32" fill="#f59e0b" stroke="#0f172a" stroke-width="4"/>
        <path d="M30 56 Q22 78 48 84 Q38 66 32 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
        <path d="M66 56 Q74 78 48 84 Q58 66 64 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
      </svg>
    `
  }
];

export default class TractorHarvestCountGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.PointerManager = null;
    this.cleanups = [];
    this.timers = [];
    this.targetSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.seqIndex = 0;
    this.currentCount = 0;
    this.targetCount = 1;
    this.currentCrop = CROPS[0];
  }

  mount(containerEl, audioApi, speechApi, { PointerManager }) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = PointerManager;
    this.seqIndex = 0;
    this.startRound();
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  startRound() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.currentCount = 0;
    this.targetCount = this.targetSequence[this.seqIndex % this.targetSequence.length];
    this.currentCrop = CROPS[this.seqIndex % CROPS.length];

    const cropLabel =
      this.targetCount === 1 ? this.currentCrop.singular : this.currentCrop.plural;
    const promptText = `Load ${NUMBER_WORDS[this.targetCount]} ${cropLabel} into the wagon!`;

    this.container.innerHTML = `
      <style>
        .thc-stage {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 52%, #fef08a 52%, #fde047 100%);
          padding: 12px 110px 18px 110px;
          overflow: hidden;
          position: relative;
        }
        .thc-prompt-btn {
          min-width: 96px;
          min-height: 88px;
          padding: 8px 24px;
          border-radius: 999px;
          background: #ffffff;
          border: 4px solid #0f172a;
          box-shadow: 0 5px 0 #0f172a;
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .thc-rig-row {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .thc-rig-row.drive-away {
          transform: translateX(110vw);
        }
        .thc-wagon-zone {
          position: relative;
          width: clamp(280px, 42vw, 420px);
          height: 170px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }
        .thc-wagon-loaded {
          position: absolute;
          top: 6px;
          left: 24px;
          right: 24px;
          height: 64px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 2px;
          pointer-events: none;
        }
        .thc-wagon-loaded .mini-crop svg {
          width: 44px;
          height: 44px;
        }
        .thc-badge {
          position: absolute;
          top: 52px;
          background: #ffffff;
          border: 4px solid #0f172a;
          border-radius: 16px;
          padding: 2px 18px;
          font-size: 2rem;
          font-weight: 900;
          color: #0f172a;
          pointer-events: none;
        }
        .thc-field-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 14px;
          max-width: 880px;
          min-height: 196px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.78);
          border: 4px solid #0f172a;
          border-radius: 26px;
        }
        .thc-crop-item {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          touch-action: none;
          transition: transform 0.2s ease;
          filter: drop-shadow(0 5px 6px rgba(15, 23, 42, 0.2));
        }
        .thc-crop-item.dragging {
          transition: none;
          z-index: 100;
          transform: scale(1.15);
        }
        .thc-crop-item.loaded {
          visibility: hidden;
          pointer-events: none;
        }
      </style>

      <div class="thc-stage">
        <button type="button" class="thc-prompt-btn" id="thc-repeat-btn">
          <span style="font-size:1.7rem;">🔊</span>
          <span>${promptText}</span>
        </button>

        <div class="thc-rig-row" id="thc-rig">
          <!-- Numbered Grain Wagon Drop Zone -->
          <div class="thc-wagon-zone" id="thc-wagon-drop">
            <div class="thc-wagon-loaded" id="thc-loaded-tray"></div>
            <svg viewBox="0 0 320 140" width="100%" height="136">
              <polygon points="16,24 304,24 276,98 44,98" fill="#ea580c" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
              <line x1="290" y1="78" x2="320" y2="78" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
              <circle cx="84" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
              <circle cx="84" cy="108" r="10" fill="#f59e0b"/>
              <circle cx="236" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
              <circle cx="236" cy="108" r="10" fill="#f59e0b"/>
            </svg>
            <div class="thc-badge" id="thc-counter-badge">${this.currentCount} / ${this.targetCount}</div>
          </div>

          <!-- Green Row-Crop Tractor -->
          <svg viewBox="0 0 180 140" width="164" height="128">
            <rect x="48" y="20" width="54" height="46" rx="8" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
            <rect x="58" y="28" width="34" height="26" rx="4" fill="#bae6fd" stroke="#0f172a" stroke-width="3"/>
            <rect x="40" y="54" width="112" height="44" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
            <rect x="132" y="30" width="10" height="26" rx="3" fill="#334155" stroke="#0f172a" stroke-width="3"/>
            <circle cx="66" cy="98" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
            <circle cx="66" cy="98" r="14" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
            <circle cx="132" cy="106" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
            <circle cx="132" cy="106" r="9" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
          </svg>
        </div>

        <div class="thc-field-grid">
          ${Array.from({ length: this.targetCount })
            .map(
              (_, i) => `
            <div class="thc-crop-item" data-idx="${i}">
              ${this.currentCrop.svg}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const repeatBtn = this.container.querySelector('#thc-repeat-btn');
    repeatBtn.addEventListener('click', () => {
      this.audio.playNote(523.25, 0.12);
      this.speech.speak(promptText);
    });

    this._schedule(() => this.speech.speak(promptText), 200);

    const wagonDropEl = this.container.querySelector('#thc-wagon-drop');
    const loadedTrayEl = this.container.querySelector('#thc-loaded-tray');
    const badgeEl = this.container.querySelector('#thc-counter-badge');
    const rigEl = this.container.querySelector('#thc-rig');

    const cropEls = this.container.querySelectorAll('.thc-crop-item');
    cropEls.forEach((cropEl) => {
      const cleanup = this.PointerManager.attachDrag(cropEl, {
        onStart: () => {
          cropEl.classList.add('dragging');
          this.audio.playNote(440, 0.1);
        },
        onMove: (_x, _y, dx, dy) => {
          cropEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
        },
        onEnd: (clientX, clientY) => {
          cropEl.classList.remove('dragging');
          if (
            this.PointerManager.isWithinSnapRadius(clientX, clientY, wagonDropEl, 28) &&
            this.currentCount < this.targetCount
          ) {
            cropEl.classList.add('loaded');
            this.currentCount += 1;

            const mini = document.createElement('div');
            mini.className = 'mini-crop';
            mini.innerHTML = this.currentCrop.svg;
            loadedTrayEl.appendChild(mini);

            badgeEl.textContent = `${this.currentCount} / ${this.targetCount}`;

            const noteHz =
              PENTATONIC_SCALE[Math.min(this.currentCount, PENTATONIC_SCALE.length - 1)];
            this.audio.playNote(noteHz, 0.22);
            this.speech.speak(NUMBER_WORDS[this.currentCount]);

            if (this.currentCount >= this.targetCount) {
              this._completeRound(rigEl, cropLabel);
            }
          } else {
            cropEl.style.transform = 'translate(0px, 0px)';
            this.audio.playGentleThud();
          }
        }
      });

      this.cleanups.push(cleanup);
    });
  }

  _completeRound(rigEl, cropLabel) {
    this._schedule(() => {
      this.audio.playSuccessChord();
      this.speech.speak(
        `${NUMBER_WORDS[this.targetCount]} ${cropLabel}! Off goes the tractor!`
      );
      if (rigEl) rigEl.classList.add('drive-away');
    }, 650);

    this._schedule(() => {
      this.seqIndex += 1;
      this.startRound();
    }, 2300);
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
