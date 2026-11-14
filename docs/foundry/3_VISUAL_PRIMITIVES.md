# `3_VISUAL_PRIMITIVES.md` — High-Contrast Color Palette & Parametric Inline SVG Library

Use these canonical color tokens and inline SVG templates across all `zero-telemetry-kids` mini-games to maintain visual cohesion, high figure-ground contrast for 3-to-4-year-olds, and zero raster asset bloat.

---

## 1. Canonical High-Contrast Color Palette

| Semantic Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `BARN_RED` | `#dc2626` | Primary red shapes, barns, apples, strawberries |
| `TRACTOR_GREEN` | `#16a34a` | Primary green shapes, tractors, cabbages, pastures |
| `SUN_AMBER` | `#f59e0b` | Primary yellow/gold shapes, corn, sunflowers, grain |
| `SKY_BLUE` | `#2563eb` | Primary blue shapes, water tanks, blueberries, sky accents |
| `PLUM_PURPLE` | `#7c3aed` | Secondary purple shapes, plums, grapes |
| `PUMPKIN_ORANGE` | `#ea580c` | Secondary orange shapes, pumpkins, carrots, excavators |
| `SOIL_BROWN` | `#78350f` | Wagon beds, hay bale outlines, tree trunks, soil |
| `INK_OUTLINE` | `#0f172a` | Mandatory `3px–5px` high-contrast stroke around all foreground sprites |

---

## 2. Reusable Inline SVG Templates

### 2.1 Red Barn Target (`viewBox="0 0 200 200"`)
```html
<svg viewBox="0 0 200 200" width="180" height="180">
  <path d="M100 16 L20 82 V184 H180 V82 Z" fill="#dc2626" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M100 16 L12 86 M100 16 L188 86" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <rect x="65" y="104" width="70" height="80" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="5"/>
  <circle cx="100" cy="64" r="16" fill="#fef08a" stroke="#0f172a" stroke-width="4"/>
</svg>
```

### 2.2 Green Row-Crop Tractor (`viewBox="0 0 180 140"`)
```html
<svg viewBox="0 0 180 140" width="160" height="124">
  <rect x="78" y="20" width="54" height="46" rx="8" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
  <rect x="88" y="28" width="34" height="26" rx="4" fill="#bae6fd" stroke="#0f172a" stroke-width="3"/>
  <rect x="28" y="54" width="112" height="44" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
  <rect x="38" y="30" width="10" height="26" rx="3" fill="#334155" stroke="#0f172a" stroke-width="3"/>
  <circle cx="114" cy="98" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="114" cy="98" r="14" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
  <circle cx="48" cy="106" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="48" cy="106" r="9" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
</svg>
```

### 2.3 Corrugated Grain Bin / Silo (`viewBox="0 0 140 180"`)
```html
<svg viewBox="0 0 140 180" width="120" height="154">
  <polygon points="70,14 18,54 122,54" fill="#cbd5e1" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
  <rect x="22" y="54" width="96" height="114" rx="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="5"/>
  <line x1="22" y1="82" x2="118" y2="82" stroke="#94a3b8" stroke-width="4"/>
  <line x1="22" y1="110" x2="118" y2="110" stroke="#94a3b8" stroke-width="4"/>
  <line x1="22" y1="138" x2="118" y2="138" stroke="#94a3b8" stroke-width="4"/>
</svg>
```

### 2.4 Numbered Grain Wagon (`viewBox="0 0 220 140"`)
```html
<svg viewBox="0 0 220 140" width="200" height="128">
  <polygon points="16,28 204,28 184,96 36,96" fill="#ea580c" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="62" cy="108" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="62" cy="108" r="9" fill="#f59e0b"/>
  <circle cx="158" cy="108" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="158" cy="108" r="9" fill="#f59e0b"/>
</svg>
```

### 2.5 Geometric Shape Primitives (`viewBox="0 0 100 100"`)
* **Circle:** `<circle cx="50" cy="50" r="40" fill="${color}" stroke="#0f172a" stroke-width="5"/>`
* **Square:** `<rect x="14" y="14" width="72" height="72" rx="8" fill="${color}" stroke="#0f172a" stroke-width="5"/>`
* **Triangle:** `<polygon points="50,12 90,86 10,86" fill="${color}" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`
* **Hexagon:** `<polygon points="50,10 86,30 86,70 50,90 14,70 14,30" fill="${color}" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`
