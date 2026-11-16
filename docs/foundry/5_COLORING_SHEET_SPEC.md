# `5_COLORING_SHEET_SPEC.md` — Toddler Coloring Sheet & Printable Worksheet Foundry Spec



Use this specification whenever generating standalone printable `.svg` files for `kids.deaninno.com/printables/` (to be dropped into `src/assets/printables/`). Every generated file MUST be a single, self-contained vector `.svg` document engineered for standard US Letter paper ($8.5 \times 11\text{ in}$) and 2-to-4-year-old crayon motor ergonomics.



---



## 1. Mandatory Root `<svg>` Canvas & US Letter Safe Margins



1. **Orientation & Root Tag:**

   * **Portrait (Default):**

     ```xml

     <svg xmlns="http://www.w3.org/2000/svg" width="8.5in" height="11in" viewBox="0 0 850 1100">

     ```

   * **Landscape (Wide Vehicles / Scenes):**

     ```xml

     <svg xmlns="http://www.w3.org/2000/svg" width="11in" height="8.5in" viewBox="0 0 1100 850">

     ```

2. **Printer Safe-Margin Frame ($0.5\text{ in} = 50\text{ units}$):**

   * Home inkjet and laser printers cannot print edge-to-edge without clipping. Every sheet MUST include a `50`-unit outer margin and draw a rounded outer coloring border at `x="50" y="50" width="750" height="1000" rx="24"` (or `width="1000" height="750"` for landscape) with `fill="none" stroke="#000000" stroke-width="6"`.

   * Keep all primary scene elements inside the safe inner artwork bounds (`x=[75..775]`, `y=[75..920]` for portrait), reserving the bottom `y=[930..1025]` band for the large block-letter title/tracing label.



---



## 2. Toddler Coloring Line-Art Invariants (Ages 2–4)



1. **Pure Black-and-White Toner-Saving Palette:**

   * **Strokes:** Use ONLY pure black (`stroke="#000000"`) with `stroke-linecap="round"` and `stroke-linejoin="round"`.

   * **Fills:** Use ONLY pure white (`fill="#ffffff"`) or transparent (`fill="none"`). Never use grayscale shading, gradients, halftones, or colored fills that waste printer ink or muddy toddler crayons.

   * **Small Solid Accents Exception:** Tiny pupils, nostrils, or wheel hub nuts (`radius <= 8` units) may use `fill="#000000"` so faces and wheels read clearly.

2. **Bold Stroke Hierarchy:**

   * **Outer Frame & Primary Silhouettes:** `stroke-width="7"` to `stroke-width="9"`.

   * **Major Sub-Parts (wheels, barn doors, windows, petals):** `stroke-width="5"` to `stroke-width="6"`.

   * **Interior Texture Lines (corrugated silo ribs, wood grain, tractor grille):** `stroke-width="3"` to `stroke-width="4"`.

3. **Chunky-Crayon Region Minimums:**

   * Every closed fillable region intended for coloring MUST have a minimum clear interior span of at least `45 x 45` viewBox units ($\approx 0.45\text{ in}$ on paper).

   * Avoid dense cross-hatching, tiny intricate filigree, or overlapping lines that create sliver pockets smaller than `25` units.



---



## 3. Reusable ZTK Visual Language & Typography



1. **Visual Continuity (`3_VISUAL_PRIMITIVES.md`):**

   * Reuse the recognizable proportions of the `zero-telemetry-kids` game sprites (the green row-crop tractor with large rear tire and front cab, the gambrel/gable barn with loft window, the corrugated grain silo, pumpkins, apples, and clouds) rendered in black-and-white line art.

2. **Hollow Block-Letter Tracing Footer:**

   * Include a large, hollow uppercase label at the bottom of the sheet (`y="995"` in portrait) so older toddlers/preschoolers can color inside the letters or trace the word:

     ```xml

     <text x="425" y="1000" text-anchor="middle"

           font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"

           font-size="68" font-weight="900" letter-spacing="8"

           fill="#ffffff" stroke="#000000" stroke-width="3.5">TRACTOR</text>

     ```

   * Keep a subtle footer credit inside the bottom border (`y="1038"`, `font-size="14"`, `fill="#000000"`, `stroke="none"`): `kids.deaninno.com • Free Ad-Free Printables`.



---



## 4. Strict Self-Contained Vector & Delivery Rules

1. **Zero External or System-Font Dependencies:**
   * **NO** `<image>` tags, **NO** `<foreignObject>`, **NO** external `<style>` imports or web fonts, and **NO** `<script>` tags inside the `.svg`.
   * **Pure `<path>` Typography:** Render all hollow tracing labels (e.g., `TRACTOR`, `BARN`) as pure geometric `<path>` outlines rather than `<text>` tags so every browser, OS, and printer renders letterforms identically without relying on installed fonts.

2. **Raw XML Output Delivery (No Raster Image Previews):**
   * **NEVER** render `.svg` outputs as inline image previews or rasterized image attachments (which cause browsers to save `.png` files instead of raw vector XML).
   * Always deliver generated `.svg` files as raw valid XML inside a fenced ```` ```xml ```` code block (or as a plain `.txt` download attachment) starting directly with `<?xml version="1.0" encoding="UTF-8"?>` and `<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" ...>` and ending with `</svg>`, with clean group comments (`<!-- Sky & Sun -->`, `<!-- Tractor -->`, `<!-- Label -->`) so coordinates are easy to inspect and save directly as `<slug>.svg`.