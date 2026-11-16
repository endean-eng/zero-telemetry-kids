/**
 * @file src/registry.js
 * @description Declarative registry of self-contained ES6 mini-game modules.
 */

export const GAME_REGISTRY = [
  {
    id: 'barn-shape-sort',
    title: 'Barn Shape Sort',
    category: 'Montessori Sensorial',
    ageBracket: '3-5 yrs',
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
    ageBracket: '3-5 yrs',
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
    ageBracket: '3-5 yrs',
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
    ageBracket: '3-6 yrs',
    accentColor: '#f59e0b',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<rect x="58" y="54" width="8" height="30" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="76" y="54" width="8" height="30" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="54" y="62" width="34" height="6" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>' +
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
  },
  {
    id: 'hay-bale-bounce',
    title: 'Hay Bale Bounce',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#eab308',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<path d="M48 44 Q48 22 48 18" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4 4"/>' +
      '<circle cx="48" cy="26" r="14" fill="#dc2626" stroke="#0f172a" stroke-width="3.5"/>' +
      '<path d="M48 12 L51 6" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>' +
      '<rect x="14" y="54" width="68" height="20" rx="7" fill="#facc15" stroke="#0f172a" stroke-width="3.5"/>' +
      '<line x1="36" y1="54" x2="36" y2="74" stroke="#ca8a04" stroke-width="3"/>' +
      '<line x1="60" y1="54" x2="60" y2="74" stroke="#ca8a04" stroke-width="3"/>' +
      '<circle cx="28" cy="78" r="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="68" cy="78" r="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '</svg>',
    loader: () => import('./games/hay-bale-bounce.js')
  },
  {
    id: 'sprinkler-sprout-defense',
    title: 'Sprinkler Sprouts',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#0284c7',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<circle cx="36" cy="26" r="11" fill="#e2e8f0" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="60" cy="26" r="11" fill="#e2e8f0" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="48" cy="20" r="13" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="48" cy="10" r="7" fill="#facc15" stroke="#0f172a" stroke-width="2.5"/>' +
      '<path d="M48 38 C53 45, 54 51, 48 54 C42 51, 43 45, 48 38 Z" fill="#0ea5e9" stroke="#0f172a" stroke-width="2.5"/>' +
      '<rect x="20" y="60" width="56" height="18" rx="7" fill="#0284c7" stroke="#0f172a" stroke-width="3.5"/>' +
      '<circle cx="32" cy="80" r="7" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="64" cy="80" r="7" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '</svg>',
    loader: () => import('./games/sprinkler-sprout-defense.js')
  },
  {
    id: 'tractor-hill-hauler',
    title: 'Tractor Hill Hauler',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#15803d',
    iconSvg:
      '<svg viewBox="0 0 96 96" width="88" height="88">' +
      '<path d="M8 78 Q48 52 88 38 L88 86 L8 86 Z" fill="#22c55e" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<g transform="translate(24, 58) rotate(-20)">' +
      '<rect x="2" y="-30" width="22" height="18" rx="4" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="0" y="-16" width="44" height="16" rx="4" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>' +
      '<rect x="34" y="-26" width="5" height="12" rx="1.5" fill="#334155" stroke="#0f172a" stroke-width="2"/>' +
      '<circle cx="10" cy="0" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="10" cy="0" r="4.5" fill="#facc15"/>' +
      '<circle cx="38" cy="2" r="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>' +
      '<circle cx="38" cy="2" r="3.5" fill="#facc15"/>' +
      '</g>' +
      '</svg>',
    loader: () => import('./games/tractor-hill-hauler.js')
  }
];