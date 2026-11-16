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
    ageBracket: '3-5 yrs',
    accentColor: '#dc2626',
    iconSvg: '...',
    loader: () => import('./games/barn-shape-sort.js')
  },
  {
    id: 'tractor-harvest-count',
    title: 'Tractor Counting',
    category: 'Montessori Numeracy',
    ageBracket: '3-5 yrs',
    accentColor: '#16a34a',
    iconSvg: '...',
    loader: () => import('./games/tractor-harvest-count.js')
  },
  {
    id: 'phonics-bubble-pop',
    title: 'Phonics Bubbles',
    category: 'Montessori Language',
    ageBracket: '3-5 yrs',
    accentColor: '#2563eb',
    iconSvg: '...',
    loader: () => import('./games/phonics-bubble-pop.js')
  },
  {
    id: 'pasture-fence-hopper',
    title: 'Pasture Fence Hopper',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#f59e0b',
    iconSvg: '...',
    loader: () => import('./games/pasture-fence-hopper.js')
  },
  {
    id: 'hay-bale-bounce',
    title: 'Hay Bale Bounce',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#eab308',
    iconSvg: '...',
    loader: () => import('./games/hay-bale-bounce.js')
  },
  {
    id: 'sprinkler-sprout-defense',
    title: 'Sprinkler Sprouts',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#0284c7',
    iconSvg: '...',
    loader: () => import('./games/sprinkler-sprout-defense.js')
  },
  {
    id: 'tractor-hill-hauler',
    title: 'Tractor Hill Hauler',
    category: 'Action & Physics',
    ageBracket: '3-6 yrs',
    accentColor: '#15803d',
    iconSvg: '...',
    loader: () => import('./games/tractor-hill-hauler.js')
  }
];