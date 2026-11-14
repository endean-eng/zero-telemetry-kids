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

### 2.1 Red Barn Target (`viewBox="0 0 200 210"`)
<svg viewBox="0 0 200 210" width="180" height="190">
  <path d="M100 14 L16 82 V198 H184 V82 Z" fill="#dc2626" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M100 14 L8 86 M100 14 L192 86" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <rect x="38" y="80" width="124" height="118" rx="10" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>
  <circle cx="100" cy="52" r="14" fill="#fef08a" stroke="#0f172a" stroke-width="4"/>
</svg>

### 2.2 Green Row-Crop Tractor with Animated Exhaust Smoke (`viewBox="0 -30 160 170"`)
<!-- CSS keyframes for exhaust puffs:
@keyframes smokePuff {
  0% { transform: translate(0px, 0px) scale(0.4); opacity: 0.85; }
  60% { opacity: 0.6; }
  100% { transform: translate(-28px, -42px) scale(1.65); opacity: 0; }
}
-->
<svg viewBox="0 -30 160 170" width="154" height="156" style="overflow:visible;">
  <circle class="smoke-puff-1" cx="117" cy="18" r="9" fill="#cbd5e1" stroke="#64748b" stroke-width="2" opacity="0"/>
  <circle class="smoke-puff-2" cx="117" cy="18" r="11" fill="#e2e8f0" stroke="#64748b" stroke-width="2" opacity="0"/>
  <circle class="smoke-puff-3" cx="117" cy="18" r="8" fill="#f1f5f9" stroke="#64748b" stroke-width="2" opacity="0"/>
  <rect x="28" y="20" width="54" height="46" rx="8" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
  <rect x="38" y="28" width="34" height="26" rx="4" fill="#bae6fd" stroke="#0f172a" stroke-width="3"/>
  <rect x="20" y="54" width="112" height="44" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>
  <rect x="112" y="26" width="10" height="30" rx="3" fill="#334155" stroke="#0f172a" stroke-width="3"/>
  <circle cx="46" cy="98" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="46" cy="98" r="14" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
  <circle cx="112" cy="106" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="112" cy="106" r="9" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
</svg>

### 2.3 Coupled Grain Wagon with Hitch Drawbar & Pin (`viewBox="0 0 340 140"`)
<!-- Pair with Tractor using margin-left: -28px on the tractor SVG so the clevis pin (cx="332") locks onto the rear axle -->
<svg viewBox="0 0 340 140" width="340" height="136">
  <line x1="268" y1="82" x2="338" y2="82" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/>
  <circle cx="332" cy="82" r="7" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
  <polygon points="16,24 296,24 268,98 44,98" fill="#ea580c" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="84" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="84" cy="108" r="10" fill="#f59e0b"/>
  <circle cx="228" cy="108" r="24" fill="#1e293b" stroke="#0f172a" stroke-width="5"/>
  <circle cx="228" cy="108" r="10" fill="#f59e0b"/>
</svg>

### 2.4 Corrugated Grain Bin / Silo (`viewBox="0 0 140 180"`)
<svg viewBox="0 0 140 180" width="120" height="154">
  <polygon points="70,14 18,54 122,54" fill="#cbd5e1" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
  <rect x="22" y="54" width="96" height="114" rx="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="5"/>
  <line x1="22" y1="82" x2="118" y2="82" stroke="#94a3b8" stroke-width="4"/>
  <line x1="22" y1="110" x2="118" y2="110" stroke="#94a3b8" stroke-width="4"/>
  <line x1="22" y1="138" x2="118" y2="138" stroke="#94a3b8" stroke-width="4"/>
</svg>

### 2.5 Harvest Crop Tokens (`viewBox="0 0 96 96"`)
* **Pumpkin:**
  <svg viewBox="0 0 96 96" width="92" height="92"><path d="M44 14 C44 8, 54 8, 54 18 L52 28 L44 28 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4"/><ellipse cx="32" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/><ellipse cx="64" cy="56" rx="20" ry="26" fill="#ea580c" stroke="#0f172a" stroke-width="4"/><ellipse cx="48" cy="56" rx="22" ry="28" fill="#f97316" stroke="#0f172a" stroke-width="4"/></svg>
* **Apple:**
  <svg viewBox="0 0 96 96" width="92" height="92"><path d="M48 24 L52 10" stroke="#78350f" stroke-width="6" stroke-linecap="round"/><ellipse cx="60" cy="18" rx="10" ry="5" transform="rotate(-20 60 18)" fill="#16a34a" stroke="#0f172a" stroke-width="3"/><circle cx="48" cy="56" r="28" fill="#dc2626" stroke="#0f172a" stroke-width="4"/><circle cx="38" cy="46" r="6" fill="#fca5a5"/></svg>
* **Ear of Corn:**
  <svg viewBox="0 0 96 96" width="92" height="92"><ellipse cx="48" cy="48" rx="18" ry="32" fill="#f59e0b" stroke="#0f172a" stroke-width="4"/><path d="M30 56 Q22 78 48 84 Q38 66 32 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/><path d="M66 56 Q74 78 48 84 Q58 66 64 52 Z" fill="#16a34a" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/></svg>

### 2.6 Geometric Shape Primitives (`viewBox="0 0 104 104"`)
* **Circle:** `<circle cx="52" cy="52" r="40" fill="#dc2626" stroke="#0f172a" stroke-width="5"/>`
* **Square:** `<rect x="14" y="14" width="76" height="76" rx="10" fill="#16a34a" stroke="#0f172a" stroke-width="5"/>`
* **Triangle:** `<polygon points="52,12 92,88 12,88" fill="#f59e0b" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`
* **Hexagon:** `<polygon points="52,10 90,31 90,73 52,94 14,73 14,31" fill="#2563eb" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`