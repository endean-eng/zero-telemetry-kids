/**
 * @file src/games/tractor-harvest-count.js
 * @description Launch Module 2 (L-02): Tractor Harvest Counting (Levels 1, 2, & 3).
 *              - Level 1 (Single Crop): Marble-Bag 1-9 of a single crop type; exact count spawned in field.
 *              - Level 2 (Mixed Load): Visual recipe of 2 different crop types (e.g., 3 Pumpkins + 2 Apples)
 *                with graphical crop-icon counters on the wagon side and exact counts spawned in field.
 *              - Level 3 (Extra Crops): Mixed 2-crop visual recipe on the wagon side, but the field spawns
 *                extra distractor items of each crop so the child must stop loading a crop once its icon badge is full!
 *              100% pure ASCII with Unicode escapes and zero template literals.
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
  'Nine'
];

const PENTATONIC_SCALE = [
  261.63,
  293.66,
  329.63,
  392.0,
  440.0,
  523.25,
  587.33,
  659.25,
  783.99,
  880.0
];

const CROPS = [
  {
    id: 'pumpkin',
    singular: 'pumpkin',
    plural: 'pumpkins',
    svg:
      '<svg viewBox="0 0 96 96" width="100%" height="100%">' +
      '<path d="M44 14 C44 8, 54 8, 54 18 L52 28 L44 28 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="32" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="64" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/>' +
      '<ellipse cx="48" cy="56" rx="22" ry="28" fill="#f97316" stroke="#0f172a" stroke-width="4"/>' +
      '</svg>'
  },
  {
    id: 'apple',
    singular: 'apple',
    plural: 'apples',
    svg:
      '<svg viewBox="0 0 96 96" width="100%" height="100%">' +
      '<path d="M48 24 L52 10" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="18" rx="10" ry="5" transform="rotate(-20 60 18)" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="48" cy="56" r="28" fill="#dc2626" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="38" cy="46" r="6" fill="#fca5a5"/>' +
      '</svg>'
  },
  {
    id: 'corn',
    singular: 'ear of corn',
    plural: 'ears of corn',
    svg:
      '<svg viewBox="0 0 96 96" width="100%" height="100%">' +
      '<ellipse cx="48" cy="48" rx="18" ry="32" fill="#f59e0b" stroke="#0f172a" stroke-width="4"/>' +
      '<path d="M30 56 Q22 78 48 84 Q38 66 32 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M66 56 Q74 78 48 84 Q58 66 64 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '</svg>'
  }
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default class TractorHarvestCountGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.PointerManager = null;
    this.cleanups = [];
    this.timers = [];

    this.level = 1; // 1 = Single Crop | 2 = Mixed Load (2 Crops) | 3 = Mixed Load + Extra Field Crops
    this.marbleBag = [];
    this.lastNumber = null;
    this.roundCounter = 0;

    // Recipe tracking: array of { crop, target, current }
    this.orders = [];
    this.totalLoaded = 0;
    this.totalTarget = 1;
  }

  mount(containerEl, audioApi, speechApi, { PointerManager }) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.PointerManager = PointerManager;
    this.level = 1;
    this.marbleBag = [];
    this.lastNumber = null;
    this.roundCounter = 0;
    this.startRound();
  }

  _drawNextNumberFromMarbleBag() {
    if (this.marbleBag.length === 0) {
      const freshBag = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      if (this.lastNumber !== null && freshBag[0] === this.lastNumber) {
        [freshBag[0], freshBag[1]] = [freshBag[1], freshBag[0]];
      }
      this.marbleBag = freshBag;
    }
    const nextNum = this.marbleBag.shift();
    this.lastNumber = nextNum;
    return nextNum;
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  _buildRoundOrdersAndField() {
    if (this.level === 1) {
      const target = this._drawNextNumberFromMarbleBag();
      const crop = CROPS[this.roundCounter % CROPS.length];
      this.orders = [{ crop, target, current: 0 }];
      this.totalTarget = target;

      const fieldItems = Array.from({ length: target }).map(() => crop);
      return { fieldItems };
    }

    // Level 2 & Level 3: Pick 2 distinct crops with total sum between 2 and 9
    const pickedCrops = shuffle(CROPS).slice(0, 2);
    const countA = Math.floor(Math.random() * 4) + 1; // 1..4
    const maxB = Math.min(5, 9 - countA);
    const countB = Math.floor(Math.random() * maxB) + 1; // 1..5 (so countA + countB <= 9)

    this.orders = [
      { crop: pickedCrops[0], target: countA, current: 0 },
      { crop: pickedCrops[1], target: countB, current: 0 }
    ];
    this.totalTarget = countA + countB;

    const fieldItems = [];
    const extraA = this.level === 3 ? Math.floor(Math.random() * 2) + 1 : 0;
    const extraB = this.level === 3 ? Math.floor(Math.random() * 2) + 1 : 0;

    for (let i = 0; i < countA + extraA; i++) {
      fieldItems.push(pickedCrops[0]);
    }
    for (let i = 0; i < countB + extraB; i++) {
      fieldItems.push(pickedCrops[1]);
    }

    return { fieldItems: shuffle(fieldItems) };
  }

  _getPromptText() {
    if (this.orders.length === 1) {
      const o = this.orders[0];
      const label = o.target === 1 ? o.crop.singular : o.crop.plural;
      return 'Load ' + NUMBER_WORDS[o.target] + ' ' + label + ' into the wagon!';
    }
    const o1 = this.orders[0];
    const o2 = this.orders[1];
    const label1 = o1.target === 1 ? o1.crop.singular : o1.crop.plural;
    const label2 = o2.target === 1 ? o2.crop.singular : o2.crop.plural;
    return (
      'Load ' +
      NUMBER_WORDS[o1.target] +
      ' ' +
      label1 +
      ' and ' +
      NUMBER_WORDS[o2.target] +
      ' ' +
      label2 +
      '!'
    );
  }

  _renderWagonBadgeHtml() {
    return this.orders
      .map((order, idx) => {
        const isDone = order.current >= order.target;
        return (
          '<div class="thc-order-pill' +
          (isDone ? ' done' : '') +
          '" id="thc-order-pill-' +
          idx +
          '">' +
          '<span class="thc-order-icon">' +
          order.crop.svg +
          '</span>' +
          '<span class="thc-order-text" id="thc-order-text-' +
          idx +
          '">' +
          order.current +
          '/' +
          order.target +
          '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  startRound() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.totalLoaded = 0;

    const { fieldItems } = this._buildRoundOrdersAndField();
    this.roundCounter += 1;

    const promptText = this._getPromptText();

    const visualPromptHtml = this.orders
      .map((o) => {
        return (
          '<span class="thc-inline-recipe">' +
          '<span class="thc-inline-icon">' +
          o.crop.svg +
          '</span>' +
          '<strong>' +
          o.target +
          '</strong>' +
          '</span>'
        );
      })
      .join('<span style="margin:0 4px; font-weight:900;">+</span>');

    const levelLabels = {
      1: '\u2B50 Level 1: Single Crop',
      2: '\uD83C\uDF1F Level 2: Mixed Load',
      3: '\uD83C\uDFC6 Level 3: Extra Crops'
    };
    const levelColors = {
      1: '#fef08a',
      2: '#ddd6fe',
      3: '#fed7aa'
    };

    const cropsHtml = fieldItems
      .map(
        (crop, i) =>
          '<div class="thc-crop-item" data-idx="' +
          i +
          '" data-crop-id="' +
          crop.id +
          '">' +
          crop.svg +
          '</div>'
      )
      .join('');

    const bottomSlotsHtml = [0, 1, 2, 3, 4]
      .map((slotIdx) => '<div class="thc-slot" id="thc-slot-' + slotIdx + '"></div>')
      .join('');

    const topValleySlotsHtml = [5, 6, 7, 8]
      .map((slotIdx) => '<div class="thc-slot" id="thc-slot-' + slotIdx + '"></div>')
      .join('');

    this.container.innerHTML =
      '<style>' +
      '.thc-stage {' +
      '  width: 100%; height: 100%; display: flex; flex-direction: column;' +
      '  justify-content: space-between; align-items: center;' +
      '  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 52%, #fef08a 52%, #fde047 100%);' +
      '  padding: 10px 110px 16px 110px; overflow: hidden; position: relative;' +
      '}' +
      '.thc-top-bar {' +
      '  display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; z-index: 20;' +
      '}' +
      '.thc-prompt-btn {' +
      '  min-width: 96px; min-height: 82px; padding: 8px 22px; border-radius: 999px;' +
      '  background: #ffffff; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.15rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 12px; cursor: pointer;' +
      '}' +
      '.thc-inline-recipe {' +
      '  display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9;' +
      '  border: 2px solid #0f172a; border-radius: 999px; padding: 2px 10px; font-size: 1.3rem;' +
      '}' +
      '.thc-inline-icon { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }' +
      '.thc-inline-icon svg { width: 30px; height: 30px; }' +
      '.thc-level-btn {' +
      '  min-height: 82px; padding: 8px 18px; border-radius: 999px;' +
      '  background: ' +
      levelColors[this.level] +
      '; border: 4px solid #0f172a; box-shadow: 0 5px 0 #0f172a;' +
      '  font-size: 1.05rem; font-weight: 800; color: #0f172a; cursor: pointer;' +
      '}' +
      '.thc-rig-scale-wrap {' +
      '  display: flex; justify-content: center; align-items: flex-end;' +
      '  transform-origin: bottom center;' +
      '}' +
      '.thc-rig-row {' +
      '  display: flex; align-items: flex-end; justify-content: center; gap: 0px; margin-top: 10px;' +
      '  transition: transform 3.4s cubic-bezier(0.35, 0, 0.25, 1);' +
      '}' +
      '.thc-rig-row.drive-away { transform: translateX(115vw); }' +
      '@keyframes thcChug {' +
      '  0%, 100% { transform: translateY(0px); }' +
      '  25% { transform: translateY(-6px); }' +
      '  50% { transform: translateY(0px); }' +
      '  75% { transform: translateY(-4px); }' +
      '}' +
      '.thc-rig-row.chug-bounce { animation: thcChug 0.6s ease-in-out 2; }' +
      '@keyframes thcSmokePuff {' +
      '  0% { transform: translate(0px, 0px) scale(0.4); opacity: 0.85; }' +
      '  60% { opacity: 0.6; }' +
      '  100% { transform: translate(-28px, -42px) scale(1.65); opacity: 0; }' +
      '}' +
      '.thc-smoke { opacity: 0; transform-origin: center; }' +
      '.thc-rig-row.chug-bounce .thc-smoke-1,' +
      '.thc-rig-row.drive-away .thc-smoke-1 {' +
      '  animation: thcSmokePuff 0.9s ease-out infinite;' +
      '}' +
      '.thc-rig-row.chug-bounce .thc-smoke-2,' +
      '.thc-rig-row.drive-away .thc-smoke-2 {' +
      '  animation: thcSmokePuff 0.9s ease-out 0.3s infinite;' +
      '}' +
      '.thc-rig-row.chug-bounce .thc-smoke-3,' +
      '.thc-rig-row.drive-away .thc-smoke-3 {' +
      '  animation: thcSmokePuff 0.9s ease-out 0.6s infinite;' +
      '}' +
      '.thc-wagon-zone {' +
      '  position: relative; width: 340px; height: 196px;' +
      '  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;' +
      '}' +
      '.thc-tractor-svg {' +
      '  margin-left: -28px; position: relative; z-index: 12; overflow: visible;' +
      '}' +
      '.thc-wagon-loaded {' +
      '  position: absolute; bottom: 108px; left: 16px; width: 280px;' +
      '  display: flex; flex-direction: column-reverse; align-items: center; justify-content: center;' +
      '  pointer-events: none; z-index: 5;' +
      '}' +
      '.thc-wagon-row {' +
      '  display: flex; align-items: center; justify-content: center; gap: 4px; height: 36px;' +
      '}' +
      '.thc-wagon-row.row-top { margin-bottom: -10px; z-index: 4; }' +
      '.thc-wagon-row.row-bottom { z-index: 6; }' +
      '.thc-slot { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }' +
      '.thc-slot svg { width: 42px; height: 42px; }' +
      '.thc-wagon-svg { position: relative; z-index: 10; }' +
      '.thc-badge {' +
      '  position: absolute; bottom: 48px; left: 46%; transform: translateX(-50%);' +
      '  background: #ffffff; border: 4px solid #0f172a;' +
      '  border-radius: 16px; padding: 3px 10px; display: flex; align-items: center; gap: 10px;' +
      '  pointer-events: none; z-index: 15; white-space: nowrap;' +
      '}' +
      '.thc-order-pill {' +
      '  display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 10px;' +
      '  transition: background-color 0.2s ease;' +
      '}' +
      '.thc-order-pill.done { background: #dcfce7; }' +
      '.thc-order-icon { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; }' +
      '.thc-order-icon svg { width: 34px; height: 34px; }' +
      '.thc-order-text { font-size: 1.45rem; font-weight: 900; color: #0f172a; }' +
      '.thc-field-grid {' +
      '  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px;' +
      '  max-width: 920px; min-height: 168px; padding: 10px 22px; background: rgba(255, 255, 255, 0.85);' +
      '  border: 4px solid #0f172a; border-radius: 26px;' +
      '}' +
      '.thc-crop-item {' +
      '  width: 92px; height: 92px; display: flex; align-items: center; justify-content: center;' +
      '  cursor: grab; touch-action: none; transition: transform 0.2s ease; filter: drop-shadow(0 5px 6px rgba(15, 23, 42, 0.2));' +
      '}' +
      '.thc-crop-item svg { width: 100%; height: 100%; display: block; }' +
      '.thc-crop-item.dragging { transition: none; z-index: 100; }' +
      '.thc-crop-item.loaded { visibility: hidden; pointer-events: none; }' +
      /* Mobile Landscape Compact Rig & Field Scaling */
      '@media (max-height: 520px) {' +
      '  .thc-stage { padding: 6px 68px 8px 68px; }' +
      '  .thc-inline-recipe { font-size: 0.92rem; padding: 1px 8px; }' +
      '  .thc-inline-icon { width: 22px; height: 22px; }' +
      '  .thc-inline-icon svg { width: 20px; height: 20px; }' +
      '  .thc-rig-scale-wrap {' +
      '    height: 138px;' +
      '    transform: scale(0.72);' +
      '    transform-origin: bottom center;' +
      '  }' +
      '  .thc-rig-row { margin-top: 0; }' +
      '  .thc-field-grid {' +
      '    min-height: 0;' +
      '    max-width: 820px;' +
      '    padding: 6px 14px;' +
      '    gap: 8px;' +
      '    border-width: 3px;' +
      '    border-radius: 18px;' +
      '  }' +
      '  .thc-crop-item {' +
      '    width: clamp(50px, 14.5vh, 64px);' +
      '    height: clamp(50px, 14.5vh, 64px);' +
      '  }' +
      '}' +
      '</style>' +
      '<div class="thc-stage">' +
      '<div class="thc-top-bar">' +
      '<button type="button" class="thc-prompt-btn" id="thc-repeat-btn">' +
      '<span style="font-size:1.45rem;">\uD83D\uDD0A</span>' +
      '<span>Load:</span>' +
      visualPromptHtml +
      '</button>' +
      '<button type="button" class="thc-level-btn" id="thc-level-btn">' +
      levelLabels[this.level] +
      '</button>' +
      '</div>' +
      '<div class="thc-rig-scale-wrap">' +
      '<div class="thc-rig-row" id="thc-rig">' +
      '<div class="thc-wagon-zone" id="thc-wagon-drop">' +
      '<div class="thc-wagon-loaded">' +
      '<div class="thc-wagon-row row-bottom">' +
      bottomSlotsHtml +
      '</div>' +
      '<div class="thc-wagon-row row-top">' +
      topValleySlotsHtml +
      '</div>' +
      '</div>' +
      '<svg class="thc-wagon-svg" viewBox="0 0 340 140" width="340" height="136">' +
      '<line x1="268" y1="82" x2="338" y2="82" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="332" cy="82" r="7" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>' +
      '<polygon points="16,24 296,24 268,98 44,98" fill="#ea580c" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="84" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>' +
      '<circle cx="84" cy="108" r="10" fill="#f59e0b"/>' +
      '<circle cx="228" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>' +
      '<circle cx="228" cy="108" r="10" fill="#f59e0b"/>' +
      '</svg>' +
      '<div class="thc-badge" id="thc-counter-badge">' +
      this._renderWagonBadgeHtml() +
      '</div>' +
      '</div>' +
      '<svg class="thc-tractor-svg" viewBox="0 -30 160 170" width="154" height="156">' +
      '<circle class="thc-smoke thc-smoke-1" cx="117" cy="18" r="9" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>' +
      '<circle class="thc-smoke thc-smoke-2" cx="117" cy="18" r="11" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>' +
      '<circle class="thc-smoke thc-smoke-3" cx="117" cy="18" r="8" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>' +
      '<rect x="28" y="20" width="54" height="46" rx="8" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>' +
      '<rect x="38" y="28" width="34" height="26" rx="4" fill="#bae6fd" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="20" y="54" width="112" height="44" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>' +
      '<rect x="112" y="26" width="10" height="30" rx="3" fill="#334155" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="46" cy="98" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>' +
      '<circle cx="46" cy="98" r="14" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="112" cy="106" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>' +
      '<circle cx="112" cy="106" r="9" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>' +
      '</svg>' +
      '</div>' +
      '</div>' +
      '<div class="thc-field-grid">' +
      cropsHtml +
      '</div>' +
      '</div>';

    const repeatBtn = this.container.querySelector('#thc-repeat-btn');
    const levelBtn = this.container.querySelector('#thc-level-btn');

    repeatBtn.addEventListener('click', () => {
      this.audio.playNote(523.25, 0.12);
      this.speech.speak(promptText);
    });

    levelBtn.addEventListener('click', () => {
      this.level = (this.level % 3) + 1;
      this.audio.playNote(659.25, 0.15);
      this.startRound();
    });

    this._schedule(() => this.speech.speak(promptText), 200);

    const wagonDropEl = this.container.querySelector('#thc-wagon-drop');
    const badgeEl = this.container.querySelector('#thc-counter-badge');
    const rigEl = this.container.querySelector('#thc-rig');

    const SLOT_FILL_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    const cropEls = this.container.querySelectorAll('.thc-crop-item');
    cropEls.forEach((cropEl) => {
      const cropId = cropEl.getAttribute('data-crop-id');

      const cleanup = this.PointerManager.attachDrag(cropEl, {
        onStart: () => {
          cropEl.classList.add('dragging');
          this.audio.playNote(440, 0.1);
        },
        onMove: (_x, _y, dx, dy) => {
          cropEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.15)';
        },
        onEnd: (clientX, clientY) => {
          cropEl.classList.remove('dragging');
          const matchingOrder = this.orders.find((o) => o.crop.id === cropId);

          if (
            this.PointerManager.isWithinSnapRadius(clientX, clientY, wagonDropEl, 28) &&
            matchingOrder &&
            matchingOrder.current < matchingOrder.target
          ) {
            cropEl.classList.add('loaded');
            const targetSlotIdx = SLOT_FILL_ORDER[this.totalLoaded];
            this.totalLoaded += 1;
            matchingOrder.current += 1;

            const slotEl = this.container.querySelector('#thc-slot-' + targetSlotIdx);
            if (slotEl) {
              slotEl.innerHTML = matchingOrder.crop.svg;
            }

            badgeEl.innerHTML = this._renderWagonBadgeHtml();

            const noteHz =
              PENTATONIC_SCALE[Math.min(this.totalLoaded, PENTATONIC_SCALE.length - 1)];
            this.audio.playNote(noteHz, 0.22);

            const spokenItemName =
              matchingOrder.current === 1
                ? matchingOrder.crop.singular
                : matchingOrder.crop.plural;
            this.speech.speak(
              NUMBER_WORDS[matchingOrder.current] + ' ' + spokenItemName
            );

            if (this.totalLoaded >= this.totalTarget) {
              this._completeRound(rigEl);
            }
          } else {
            cropEl.style.transform = 'translate(0px, 0px)';
            this.audio.playGentleThud();
            if (
              this.PointerManager.isWithinSnapRadius(clientX, clientY, wagonDropEl, 28) &&
              matchingOrder &&
              matchingOrder.current >= matchingOrder.target
            ) {
              const remainingOrder = this.orders.find((o) => o.current < o.target);
              if (remainingOrder) {
                this.speech.speak(
                  'All done with ' +
                    matchingOrder.crop.plural +
                    '! Look for ' +
                    remainingOrder.crop.plural +
                    '!'
                );
              }
            }
          }
        }
      });

      this.cleanups.push(cleanup);
    });
  }

  _completeRound(rigEl) {
    const isDriveOffEvent = Math.random() < 0.10;

    this._schedule(() => {
      this.audio.playSuccessChord();
      if (isDriveOffEvent) {
        setTimeout(() => this.audio.playNote(349.23, 0.24), 250);
        setTimeout(() => this.audio.playNote(440.0, 0.38), 520);
        this.speech.speak('Wagon full! Beep beep! Off to the silo goes the tractor!');
        if (rigEl) rigEl.classList.add('drive-away');
      } else {
        this.speech.speak('Wagon full! Great counting!');
        if (rigEl) rigEl.classList.add('chug-bounce');
      }
    }, 650);

    this._schedule(
      () => {
        this.startRound();
      },
      isDriveOffEvent ? 4300 : 2200
    );
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