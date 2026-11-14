/**
 * @file src/games/phonics-bubble-pop.js
 * @description Launch Module 3 (L-03): Letter & Phonics Bubble Pop.
 *              Pedagogical Basis: Montessori Sandpaper Letters & Phonemic Awareness (Ages 3.0–4.5).
 *              Uses dictionary-validated English interjections/syllables ('ssss', 'mmmm', 'aaah', 'tuhh',
 *              'buhh', 'kuhh', 'puhh', 'gah') so Windows/Chrome/Safari SpeechSynthesis never spells
 *              3-letter strings aloud as acronyms like "G-U-H".
 */

const PHONICS_DECK = [
  { letter: 'S', phonemeSpeech: 'ssss', displaySound: '/s/', example: 'Sun', color: '#dc2626' },
  { letter: 'M', phonemeSpeech: 'mmmm', displaySound: '/m/', example: 'Moon', color: '#2563eb' },
  { letter: 'A', phonemeSpeech: 'aaah', displaySound: '/a/', example: 'Apple', color: '#16a34a' },
  { letter: 'T', phonemeSpeech: 'tuhh', displaySound: '/t/', example: 'Tractor', color: '#ea580c' },
  { letter: 'B', phonemeSpeech: 'buhh', displaySound: '/b/', example: 'Barn', color: '#7c3aed' },
  { letter: 'C', phonemeSpeech: 'kuhh', displaySound: '/k/', example: 'Corn', color: '#d97706' },
  { letter: 'P', phonemeSpeech: 'puhh', displaySound: '/p/', example: 'Pumpkin', color: '#db2777' },
  { letter: 'G', phonemeSpeech: 'gah', displaySound: '/g/', example: 'Goat', color: '#059669' }
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default class PhonicsBubblePopGame {
  constructor() {
    this.container = null;
    this.audio = null;
    this.speech = null;
    this.timers = [];
    this.marbleBag = [];
    this.lastLetter = null;
    this.targetItem = null;
    this.roundResolved = false;
  }

  mount(containerEl, audioApi, speechApi) {
    this.container = containerEl;
    this.audio = audioApi;
    this.speech = speechApi;
    this.marbleBag = [];
    this.lastLetter = null;
    this.startNewRound();
  }

  _drawNextTarget() {
    if (this.marbleBag.length === 0) {
      const fresh = shuffle(PHONICS_DECK);
      if (this.lastLetter && fresh[0].letter === this.lastLetter) {
        [fresh[0], fresh[1]] = [fresh[1], fresh[0]];
      }
      this.marbleBag = fresh;
    }
    const next = this.marbleBag.shift();
    this.lastLetter = next.letter;
    return next;
  }

  _schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  startNewRound() {
    this.roundResolved = false;
    this.targetItem = this._drawNextTarget();

    const distractors = shuffle(
      PHONICS_DECK.filter((item) => item.letter !== this.targetItem.letter)
    ).slice(0, 3);
    const pool = shuffle([this.targetItem, ...distractors]);

    const promptText =
      'Pop the bubble that says... ' +
      this.targetItem.phonemeSpeech +
      '! ' +
      this.targetItem.phonemeSpeech +
      ', like ' +
      this.targetItem.example +
      '!';

    const bubblesHtml = pool
      .map(
        (item) =>
          '<button type="button" class="pbp-bubble" data-letter="' +
          item.letter +
          '" aria-label="Sound ' +
          item.phonemeSpeech +
          '">' +
          '<svg viewBox="0 0 144 144" width="148" height="148">' +
          '<circle cx="72" cy="72" r="64" fill="#ffffff" fill-opacity="0.85" stroke="' +
          item.color +
          '" stroke-width="7"/>' +
          '<ellipse cx="48" cy="40" rx="16" ry="9" transform="rotate(-30 48 40)" fill="#ffffff"/>' +
          '<text x="72" y="88" text-anchor="middle" font-size="56" font-weight="900" fill="' +
          item.color +
          '" font-family="system-ui, sans-serif">' +
          item.letter +
          item.letter.toLowerCase() +
          '</text>' +
          '</svg>' +
          '</button>'
      )
      .join('');

    this.container.innerHTML =
      '<style>' +
      '.pbp-stage {' +
      '  width: 100%;' +
      '  height: 100%;' +
      '  display: flex;' +
      '  flex-direction: column;' +
      '  justify-content: space-between;' +
      '  align-items: center;' +
      '  background: radial-gradient(circle at 50% 20%, #f0f9ff 0%, #bae6fd 65%, #7dd3fc 100%);' +
      '  padding: 16px 110px 32px 110px;' +
      '  overflow: hidden;' +
      '  position: relative;' +
      '}' +
      '.pbp-prompt-btn {' +
      '  min-width: 96px;' +
      '  min-height: 92px;' +
      '  padding: 10px 28px;' +
      '  border-radius: 999px;' +
      '  background: #ffffff;' +
      '  border: 4px solid #0f172a;' +
      '  box-shadow: 0 6px 0 #0f172a;' +
      '  font-size: 1.25rem;' +
      '  font-weight: 800;' +
      '  color: #0f172a;' +
      '  display: flex;' +
      '  align-items: center;' +
      '  gap: 14px;' +
      '  cursor: pointer;' +
      '  z-index: 20;' +
      '}' +
      '.pbp-bubble-arena {' +
      '  flex: 1;' +
      '  width: 100%;' +
      '  max-width: 940px;' +
      '  display: flex;' +
      '  justify-content: space-around;' +
      '  align-items: center;' +
      '  flex-wrap: wrap;' +
      '  gap: 28px;' +
      '}' +
      '@keyframes pbpFloat {' +
      '  0%, 100% { transform: translateY(0px); }' +
      '  50% { transform: translateY(-16px); }' +
      '}' +
      '@keyframes pbpWobble {' +
      '  0%, 100% { transform: scale(1); }' +
      '  30% { transform: scale(1.12, 0.9); }' +
      '  60% { transform: scale(0.92, 1.08); }' +
      '}' +
      '@keyframes pbpPopBurst {' +
      '  0% { transform: scale(1); opacity: 1; }' +
      '  100% { transform: scale(1.75); opacity: 0; }' +
      '}' +
      '.pbp-bubble {' +
      '  width: 148px;' +
      '  height: 148px;' +
      '  border-radius: 50%;' +
      '  background: transparent;' +
      '  border: none;' +
      '  padding: 0;' +
      '  cursor: pointer;' +
      '  animation: pbpFloat 3.2s ease-in-out infinite;' +
      '  filter: drop-shadow(0 10px 16px rgba(37, 99, 235, 0.22));' +
      '}' +
      '.pbp-bubble:nth-child(2) { animation-delay: 0.5s; }' +
      '.pbp-bubble:nth-child(3) { animation-delay: 1.1s; }' +
      '.pbp-bubble:nth-child(4) { animation-delay: 1.7s; }' +
      '.pbp-bubble.wobble { animation: pbpWobble 0.42s ease; }' +
      '.pbp-bubble.popped {' +
      '  animation: pbpPopBurst 0.35s ease-out forwards;' +
      '  pointer-events: none;' +
      '}' +
      '</style>' +
      '<div class="pbp-stage">' +
      '<button type="button" class="pbp-prompt-btn" id="pbp-repeat-btn">' +
      '<span style="font-size:1.8rem;">🔊</span>' +
      '<span>Find sound <strong style="color:' +
      this.targetItem.color +
      '; font-size:1.55rem;">' +
      this.targetItem.displaySound +
      ' (' +
      this.targetItem.letter +
      this.targetItem.letter.toLowerCase() +
      ')</strong> — ' +
      this.targetItem.example +
      '</span>' +
      '</button>' +
      '<div class="pbp-bubble-arena">' +
      bubblesHtml +
      '</div>' +
      '</div>';

    const repeatBtn = this.container.querySelector('#pbp-repeat-btn');
    repeatBtn.addEventListener('click', () => {
      this.audio.playNote(523.25, 0.12);
      this.speech.speak(promptText);
    });

    this._schedule(() => this.speech.speak(promptText), 220);

    const bubbleBtns = this.container.querySelectorAll('.pbp-bubble');
    bubbleBtns.forEach((btn) => {
      const letter = btn.getAttribute('data-letter');
      const item = pool.find((p) => p.letter === letter);

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.roundResolved || !item) return;

        if (item.letter === this.targetItem.letter) {
          this.roundResolved = true;
          btn.classList.add('popped');
          this.audio.playSuccessChord();
          this.speech.speak(
            item.phonemeSpeech + '! ' + item.phonemeSpeech + ', for ' + item.example + '!'
          );
          this._schedule(() => this.startNewRound(), 1900);
        } else {
          btn.classList.remove('wobble');
          void btn.offsetWidth;
          btn.classList.add('wobble');
          this.audio.playGentleThud();
          this.speech.speak(
            'That says ' +
              item.phonemeSpeech +
              ', like ' +
              item.example +
              '. Listen for ' +
              this.targetItem.phonemeSpeech +
              '!'
          );
        }
      });
    });
  }

  unmount() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (this.speech) this.speech.cancel();
    if (this.container) this.container.innerHTML = '';
  }
}