/**
 * @file src/registry.js
 * @description Declarative registry of self-contained ES6 mini-game modules.
 *              Each entry lazy-loads a module implementing `mount(containerEl, audioApi, speechApi, helpers)` and `unmount()`.
 */

export const GAME_REGISTRY = [
  {
    id: 'barn-shape-sort',
    title: 'Barn Shape Sort',
    ageBracket: '3–4 yrs',
    accentColor: '#dc2626',
    iconSvg: `
      <svg viewBox="0 0 96 96" width="88" height="88">
        <path d="M48 12 L12 42 V84 H84 V42 Z" fill="#dc2626" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
        <rect x="34" y="50" width="28" height="34" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
        <circle cx="48" cy="34" r="8" fill="#f59e0b"/>
      </svg>
    `,
    loader: () => import('./games/barn-shape-sort.js')
  },
  {
    id: 'tractor-harvest-count',
    title: 'Tractor Counting',
    ageBracket: '3–4 yrs',
    accentColor: '#16a34a',
    iconSvg: `
      <svg viewBox="0 0 96 96" width="88" height="88">
        <rect x="20" y="36" width="48" height="28" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>
        <rect x="44" y="18" width="22" height="22" rx="4" fill="#16a34a" stroke="#0f172a" stroke-width="4"/>
        <circle cx="30" cy="68" r="16" fill="#0f172a"/>
        <circle cx="30" cy="68" r="7" fill="#f59e0b"/>
        <circle cx="64" cy="72" r="12" fill="#0f172a"/>
        <circle cx="64" cy="72" r="5" fill="#f59e0b"/>
      </svg>
    `,
    loader: () => import('./games/tractor-harvest-count.js')
  },
  {
    id: 'phonics-bubble-pop',
    title: 'Phonics Bubbles',
    ageBracket: '3–4 yrs',
    accentColor: '#2563eb',
    iconSvg: `
      <svg viewBox="0 0 96 96" width="88" height="88">
        <circle cx="48" cy="48" r="34" fill="#dbeafe" stroke="#2563eb" stroke-width="5"/>
        <circle cx="34" cy="32" r="7" fill="#ffffff"/>
        <text x="48" y="60" text-anchor="middle" font-size="36" font-weight="900" fill="#1e3a8a" font-family="system-ui, sans-serif">A</text>
      </svg>
    `,
    loader: () => import('./games/phonics-bubble-pop.js')
  }
];
