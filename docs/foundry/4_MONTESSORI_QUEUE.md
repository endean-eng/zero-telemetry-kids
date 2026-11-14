# `4_MONTESSORI_QUEUE.md` — Public-Domain Montessori & Early Childhood Seed Specifications

All modules in this queue derive directly from century-old, public-domain **Montessori Sensorial, Practical Life, Numeracy, and Language apparatuses** (1909–1914) combined with state Early Learning and Development Standards for 36-to-48-month-olds.

To compile any item below in a single pass, prompt the agent:
> *"Compile Queue Item `<ID>` (`<Target File>`) strictly obeying `1_AGENTS.md`, `2_ENGINE_CONTRACT.md`, and `3_VISUAL_PRIMITIVES.md`."*

---

## Launch Triad (Phase 3 Modules)

### `L-01` — Shape & Color Barn Sort (`src/games/barn-shape-sort.js`)
* **Pedagogical Basis:** Montessori Geometric Cabinet & Chromatic Pairing.
* **Target Age & Skill:** 3.0–4.5 yrs; visual discrimination of shape and primary/secondary color.
* **State Machine:**
  1. Render 2 or 3 barn doors across the top/middle stage, each displaying a high-contrast geometric cutout (`circle`, `square`, `triangle`, `hexagon`) and color tint.
  2. Spawn 3 matching geometric tokens ($104 \times 104\text{ px}$) in the bottom staging tray.
  3. Speak prompt: *"Put the shapes into their matching barn doors!"*
  4. On drag release within $+24\text{ px}$ snap radius of the matching barn door, snap into place, call `audio.playSuccessChord()`, and speak the shape + color name (*"Red circle!"*).

### `L-02` — Tractor Harvest Counting 1–10 (`src/games/tractor-harvest-count.js`)
* **Pedagogical Basis:** Montessori Spindle Box & Number Rods (One-to-One Correspondence).
* **Target Age & Skill:** 3.0–4.5 yrs; cardinality and counting $1\text{–}10$.
* **State Machine:**
  1. Render a green tractor pulling a grain wagon displaying a large numeral ($1$ through $10$).
  2. Spawn a patch of draggable harvest items (pumpkins, corn ears, apples) in the field below.
  3. On each valid drop into the wagon bed, increment the wagon counter, play an ascending pentatonic note, and speak the current count aloud (*"One... Two... Three!"*).
  4. Once the target count is reached, play `audio.playSuccessChord()`, animate the tractor driving across the screen, and spawn the next number round.

### `L-03` — Letter & Phonics Bubble Pop (`src/games/phonics-bubble-pop.js`)
* **Pedagogical Basis:** Phonemic awareness (associating letter glyphs with phonetic sounds).
* **Target Age & Skill:** 3.0–4.5 yrs; stress-free tap recognition of uppercase/lowercase letters and phonetic sounds.
* **State Machine:**
  1. Float 4 oversized translucent bubbles ($120 \times 120\text{ px}$) gently upward/across the screen containing high-contrast letters.
  2. Speak target prompt: *"Pop the bubble with the letter S... sss!"*
  3. Tapping the matching bubble bursts it with an SVG star particle ring and `audio.playSuccessChord()`; tapping a distractor bubble gently wobbles it and speaks its letter name so every tap is educational.

---

## Montessori Sensorial & Practical Life Expansion Queue (Phase 6)

### `M-01` — Silo & Pin Cylinder Fit (`src/games/silo-cylinder-fit.js`)
* **Apparatus:** Montessori Knobbed Cylinders (Blocks 1–3).
* **Skill:** Visual discrimination of diameter and height; 1-to-1 dimensional matching.
* **Mechanic:** 4 corrugated grain silos or machinery hitch pins of graduated widths/heights must be dragged into their exact matching concrete foundation sockets.

### `M-02` — Barn Stall Color Tablets (`src/games/barn-color-tablets.js`)
* **Apparatus:** Montessori Color Tablets (Box 1 Primary & Box 2 Secondary).
* **Skill:** Chromatic pairing and color vocabulary.
* **Mechanic:** Pair 4 colored tractors or harvest crates into matching painted barn stalls with spoken color confirmation.

### `M-03` — Hay Bale Tower Seriation (`src/games/hay-bale-seriation.js`)
* **Apparatus:** Montessori Pink Tower & Brown Stair.
* **Skill:** Dimensional seriation (ordering from largest base to smallest peak).
* **Mechanic:** Stack 5 graduated golden hay bales onto a flatbed trailer from widest (`200px`) at the bottom to narrowest (`84px`) at the top.

### `M-04` — Grain Cart Zero & Spindles (`src/games/grain-cart-spindles.js`)
* **Apparatus:** Montessori Spindle Box (introducing the concept of `0` as an empty set).
* **Skill:** Numeracy $0\text{–}5$ and understanding that `0` means leaving the cart empty.
* **Mechanic:** 3 numbered grain carts (`0`, `1`, `2` or `2`, `0`, `3`) appear on screen; child loads the exact count of corn ears into each cart and taps the green checkmark when `0` is left empty.

### `M-05` — Tractor Sandpaper Letter Trace (`src/games/tractor-letter-trace.js`)
* **Apparatus:** Montessori Sandpaper Letters (`s`, `m`, `a`, `t`, `c`, `p`).
* **Skill:** Directional stroke formation and phonetic sound reinforcement.
* **Mechanic:** Child drags a miniature green tractor along a wide, high-contrast dirt furrow shaped like a letter from the green start star to the checkered flag, uncovering crops along the path.

### `M-06` — Machinery Geometric Patch (`src/games/machine-patch-shapes.js`)
* **Apparatus:** Montessori Geometric Cabinet Insets.
* **Skill:** Plane geometry recognition (`circle`, `square`, `triangle`, `rectangle`, `trapezoid`, `hexagon`).
* **Mechanic:** Drag geometric sheet-metal patches onto matching cutouts on a friendly combine harvester or barn roof.

### `M-07` — Acoustic Hay Bale Match (`src/games/acoustic-bale-match.js`)
* **Apparatus:** Montessori Sound Cylinders & Montessori Bells.
* **Skill:** Auditory pitch discrimination and pairing.
* **Mechanic:** Tap hay bales on the left to hear a Web Audio pentatonic pitch, then drag it to the hay bale on the right that plays the identical frequency.
