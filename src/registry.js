/**
 * @file src/registry.js
 * @description Declarative registry of self-contained ES6 mini-game modules.
 *              Each entry lazy-loads a module implementing `mount(containerEl, audioApi, speechApi, helpers)` and `unmount()`.
 */

export const GAME_REGISTRY = [
  {
    id: 'barn-shape-sort',
    title: 'Barn Shape Sort',
    category: 'Montessori Sensorial',
    ageBracket: '3–5 yrs',
    accentColor: '#dc2626',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<path d="M48 12 L12 42 V84 H84 V42 Z" fill="#dc2626" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="34" y="50" width="28" height="34" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="48" cy="34" r="8" fill="#f59e0b"/>' +
      '</svg>',
    loader: () => import('./games/barn-shape-sort.js')
  },
  {
    id: 'tractor-harvest-count',
    title: 'Tractor Counting',
    category: 'Montessori Numeracy',
    ageBracket: '3–5 yrs',
    accentColor: '#16a34a',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<rect x="18" y="16" width="32" height="28" rx="5" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>' +
      '<rect x="24" y="21" width="20" height="16" rx="3" fill="#bae6fd" stroke="#0f172a" stroke-width="2.5"/>' +
      '<rect x="66" y="20" width="6" height="18" rx="2" fill="#334155" stroke="#0f172a" stroke-width="2.5"/>' +
      '<rect x="14" y="36" width="66" height="26" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="30" cy="64" r="18" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="30" cy="64" r="8" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>' +
      '<circle cx="68" cy="69" r="13" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>' +
      '<circle cx="68" cy="69" r="5.5" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>' +
      '</svg>',
    loader: () => import('./games/tractor-harvest-count.js')
  },
  {
    id: 'phonics-bubble-pop',
    title: 'Phonics Bubbles',
    category: 'Montessori Language',
    ageBracket: '3–5 yrs',
    accentColor: '#2563eb',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<circle cx="48" cy="48" r="34" fill="#dbeafe" stroke="#2563eb" stroke-width="5"/>' +
      '<circle cx="34" cy="32" r="7" fill="#ffffff"/>' +
      '<text x="48" y="60" text-anchor="middle" font-size="36" font-weight="900" fill="#1e3a8a" font-family="system-ui, sans-serif">A</text>' +
      '</svg>',
    loader: () => import('./games/phonics-bubble-pop.js')
  },
  {
    id: 'pasture-fence-hopper',
    title: 'Pasture Fence Hopper',
    category: 'Action & Physics',
    ageBracket: '3–6 yrs',
    accentColor: '#f59e0b',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      /* Mini White Fence at bottom-right */
      '<rect x="58" y="54" width="8" height="30" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="76" y="54" width="8" height="30" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="54" y="62" width="34" height="6" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>' +
      /* Fluffy Jumping Sheep */
      '<line x1="24" y1="54" x2="18" y2="68" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="42" y1="54" x2="48" y2="66" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="24" cy="38" r="12" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="42" cy="38" r="12" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="33" cy="30" r="13" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="33" cy="44" r="11" fill="#ffffff" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="52" cy="34" r="10" fill="#1e293b" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="55" cy="32" r="2.5" fill="#ffffff"/>' +
      '</svg>',
    loader: () => import('./games/pasture-fence-hopper.js')
  }
];