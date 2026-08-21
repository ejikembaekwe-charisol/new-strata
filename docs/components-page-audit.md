# Components page — defect report & implementation spec

**Target:** the Components page of the Next.js app at `strata.charisol.io`
**Audited:** project *Success Enterprise*, `/project/019eefc7-f192-7793-8c28-097928743c34`
**Reference implementation:** this repository (Vite prototype) — file paths below point into `src/`

Every finding was produced by driving the live page in a headless browser and capturing its API
traffic. Probe results are quoted so each item is reproducible rather than opinion. No live data
was modified during the audit (no Delete, Save, Publish, or Add submitted).

---

## A correction, stated up front

An earlier pass of this audit claimed the `button` component's nine property rows pointed at
tokens that did not exist. **That was wrong**, and the correction changes what needs fixing.

The mistake: the check searched the *Tokens tab UI*, which was filtered to Color / Brand at the
time, so those variables were simply not on screen. Absence from a filtered view is not absence
from the project.

Ground truth, from `GET /api/project/<id>` → `data.designSystemData`:

| Property | Mapped variable | Resolves to |
|---|---|---|
| `background-color` | `var(--color-button-bg)` | chained → another `var(--color-…)` |
| `display` | `var(--display)` | `flex` |
| `justify-content` | `var(--justify-content)` | `center` |
| `align-items` | `var(--align-items)` | `center` |
| `padding-top` | `var(--padding-top)` | `12px` |
| `padding-bottom` | `var(--padding-bottom)` | `12px` |
| `padding-right` | `var(--padding-right)` | `32px` |
| `padding-left` | `var(--padding-left)` | `32px` |
| `text-align` | `var(--text-align)` | `center` |

**0 of 9 variables are missing**, out of 166 in the project. The data is correct and complete.
The problem is presentational — see D1.

---

## Defects

### D1 — The Value column shows a variable's name, not its resolved value

**Observed.** Every row's Value pill shows the variable's `name` field: `display`,
`justify-content`, `padding-top`, and `color.button.bg`.

**Why it looks worse than it is.** These auto-generated variables are *named after the CSS
property they came from* — `--justify-content` has `name: "justify-content"`. So the column
appears to be echoing the property name back. It is not; it is showing a real token name that
coincidentally matches.

**Expected.** Show the **resolved value** as the primary text (`flex`, `center`, `12px`, `32px`,
and a hex swatch for `background-color`), with the token name as secondary context. A reader
needs to know what the property is actually set to.

**Must handle chained references.** The value of `--color-button-bg` is itself another
`var(--color-…)`, so resolution has to recurse until it reaches a literal, with cycle
protection.

**Reference:** `resolveTokenValue` in `src/pages/ProjectDetail.jsx` — recurses through both bare
names and `{braced}` references and returns the literal. The equivalent here must follow
`var(--x)` syntax instead.

---

### D2 — `Preview` does nothing

**Observed.** The button is present and enabled. After clicking:
`dialogs=0, imgs=0, iframes=0, canvas=0`, and no DOM mutation.

**Note.** This is *not* a data problem. Per the table above, the component fully specifies
`display:flex`, both centring axes, padding `12px`/`32px` and `text-align:center`, plus a
background colour. Everything needed to render is already present. The feature is simply
unimplemented.

**Reference:** `renderLivePreview` and `resolveMappedStyle` in `src/pages/ProjectDetail.jsx` —
turn a component's mapped properties into a style object and render the real element.

---

### D3 — Nothing renders the component, anywhere on the page

**Observed.** Page-wide: `img=0`, `canvas=0`, `iframe=0`.

**Expected.** A design-system tool should show the component it is describing. Suggested
placement: a preview in the detail header, and a thumbnail per row in the components list (D6).
A light/dark surface toggle is worth having, since a component can pass on one and fail on the
other.

---

### D4 — `Property Name` and `Name` are duplicate columns

**Observed.** Each row prints the same value twice: `display  display`,
`padding-top  padding-top`, `justify-content  justify-content`.

**Expected.** One column for the CSS property. If the second is meant to carry something else
(a human label, or the variable's `name`), populate it with that — otherwise remove it and give
the space to Value.

---

### D5 — The table looks editable but is not

**Observed.** In the property table there is no `<input>`, no `<select>`, and no
`[contenteditable]`. The cells that look like text fields are styled spans, e.g.
`<span class="inline-flex … w-[145px] h-[42px] border …">`. The only row actions are `Delete`
and `Change variable` (`aria-label="Change variable"`).

**Expected.** Either make the fields genuinely editable, or stop styling read-only text as input
boxes — the current styling promises an affordance that does not exist. Note that the
`Add Token` modal does have full pickers (see below), so the capability exists; it is the inline
row that misleads.

---

### D6 — No all-components overview

**Observed.** The landing state is *"Select a component — Pick a component from the sidebar to
view its details."* The `table` count is 0 until a component is chosen.

**Expected.** A list of every component with, per row: name, type, a rendered preview, and a
count of mapped properties. Clicking a row opens it. This gives a reader the shape of the whole
system at a glance instead of requiring them to click through the tree one item at a time.

**Reference:** the components list in `src/pages/ProjectDetail.jsx` — name, type, live preview,
"N mapped", per-row tools, single-click open, hover affordance, bulk select.

---

### D7 — No image / screenshot ingest

**Observed.** `input[type=file]` = 0 on the page **and** inside the `Add Token` modal.

**Expected.** Let a user upload a screenshot of a UI and derive real design data from it. See S3
to S5 — this is the largest absent capability and the one with the most working reference code.

---

### D8 — Smaller items

| Item | Observed |
|---|---|
| `Add Token` modal | Escape does not close it; requires clicking Cancel |
| Select-all checkbox | 10 checkboxes present; ticking the header exposes no bulk action |
| Toolbar undo / redo / save | Greyed out, and carry no `title` or `aria-label` |
| Tab and pill controls | No `role="tab"` / `aria-selected` / `aria-pressed` |
| Copy affordances | `onClick` on non-button elements, so no keyboard path |

---

## What already works

Worth stating so none of it gets regressed:

- **Sidebar search** filters the tree correctly.
- **`Add Token` modal** is well built: `Pick existing` / `Create new` tabs, a CSS-property
  picker, a token picker listing the project's real variables
  (`Action Primary BG --color-action-primary-bg`, …), and on `Create new`: Token Name, Layer
  (Brand / Semantic / Scoped), Token Value, and a visual preview.
- **Per-row `Delete` and `Change variable`.**
- **Sidebar group tree with counts** — `Button 2`, `Container / Layout 20`, `Fragment 1`,
  `Other 2`, `Text / Typography 4`.

---

## Specs for the missing capabilities

All of the below is implemented and working in this repository. Treat it as reference rather
than code to copy verbatim — this is Vite with inline styles, the target is Next.js.

### S1 — Resolved-value display

`resolveTokenValue` (`src/pages/ProjectDetail.jsx`). Given a value that may be a literal, a
token name, or a reference, recurse until a literal is reached. For the live app: parse
`var(--name)`, look `--name` up in `designSystemData.variables`, and recurse on its `value`.
Guard against cycles and cap depth. Render the resolved literal as primary text, the originating
token as secondary, plus a colour swatch when the literal is a hex.

### S2 — Component rendering and preview

`resolveMappedStyle` and `renderLivePreview` (`src/pages/ProjectDetail.jsx`). Map each mapped
property through S1 into a style object, converting kebab-case to camelCase, then render the
element for the component's type. Ours also offers a slide-in drawer showing the rendered
component over a switchable light/dark surface, with one card per property listing its resolved
value, originating token, and token category.

### S3 — Colour extraction from an image

`extractColorsFromImage(file, maxColors)` — `src/utils/colorExtract.js`.

Draw to a 120×120 canvas, discard transparent, near-white and near-black pixels, quantise RGB
into 32-step buckets, rank by frequency, then keep only mutually distinct colours (Euclidean RGB
distance > 75). Returns real sampled colours, never invented ones.

### S4 — Text-size measurement from an image

`extractFontSizesFromImage(file, maxSizes)` — `src/utils/colorExtract.js`.

Downscale to a maximum dimension of 600, grayscale, binarise with an Otsu threshold, then count
ink/background *transitions* per row: text rows show many small transitions (glyph strokes),
solid UI blocks show very few. Threshold is `max(6, width * 0.02)`. Group contiguous text rows
into bands, scale each band's height back to native resolution, discard anything under 6px as an
anti-aliasing artefact, cluster similar heights within ~20%, and return the most frequent
clusters.

This is a genuine geometric measurement — **not** OCR, and not font identification. Label it in
the UI as a measured text height, and never claim to have identified a typeface.

### S5 — Component-region detection from a screenshot

`detectComponentRegions(file, opts)` and `cropImageRegionToDataUrl(...)` —
`src/utils/colorExtract.js`. Defaults: `maxWorkingDim 900`, `maxRegions 20`,
`minFillRatio 0.75`, `maxAspectRatio 25`, `maxRegionFraction 0.6`, `edgeThreshold 20`,
`maxBlobs 5000`.

1. Downscale to a working canvas with a long edge of 900.
2. Quantise colour into 32-step buckets; treat alpha < 128 as its own bucket.
3. Compute a grayscale gradient and mark pixels at or above `edgeThreshold` as **edge
   barriers**. This is what allows a white card on an off-white page to be separated — colour
   quantisation alone cannot do it.
4. 4-connected flood fill over a `Uint8Array` visited grid, accumulating per blob: pixel count,
   bounding box, and running RGB sums (which gives a true averaged colour for free).
5. Filter on minimum size, `fillRatio >= 0.75` (this rejects text and noise, and self-rejects
   hollow outline artefacts), aspect ratio <= 25, and exclude the page background (touches all
   four edges, or covers at least 60% of the canvas).
6. If that yields nothing, retry with background exclusion disabled — otherwise a tightly
   cropped screenshot of a single element returns zero regions.
7. Sort by area, cap at 20, and report `truncated` honestly rather than silently dropping.
8. Scale boxes back to native resolution, pad by roughly 3%, and crop each with the 9-argument
   `drawImage` form.

Present the results as a review step — one tickable row per detected region with an editable
name and category — and create them in a single batch, rather than importing blindly.

---

## The constraint that governed all of this

**Never present a value the app did not actually compute or store.**

Concretely: show measured text heights, not inferred font names; show sampled colours, not a
plausible palette; say "no brand colours defined" rather than substituting a default; label a
detected region as a *region*, not as "a button". Where a control cannot work yet, disable it
and say why rather than leaving it looking functional — D2 and D8 are what the alternative
costs.

---

## Reproducing the audit

Log in, open the project, go to Components, expand `Button`, select `button`, then measure:

- `document.querySelectorAll('input, select, [contenteditable=true]')` within the property table
- click `Preview`, then count `img`, `canvas`, `iframe`, and any `div.fixed.inset-0`
- `input[type=file]` on the page and inside the `Add Token` modal
- `GET /api/project/<id>` → `data.designSystemData.components.button.properties`, cross-checked
  against `data.designSystemData.variables`
