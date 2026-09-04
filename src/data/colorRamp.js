// Colour ramps: turning one brand colour into the 50–950 scale designers work in.
//
// A designer opening a colour panel expects Primary / Secondary / Accent, each a ramp of
// steps around a base. Strata stored one flat colour per role, so there was nothing to
// show them. This builds the scale.
//
// The maths comes from ColorPicker.jsx rather than being written again here. That is not
// only about duplication: the ramp and the colour editor have to agree about what a colour
// is, or a step would render one way in the picker and another in the table.

import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, contrastRatio } from '../components/ColorPicker';

/**
 * The steps, light to dark. `main` sits where 500 would and holds the designer's own
 * colour — the reference panels label that step rather than numbering it, because it is
 * the one you actually chose.
 */
export const RAMP_STEPS = [50, 100, 200, 300, 400, 'main', 600, 700, 800, 900, 950];

export const RAMP_BASE_STEP = 'main';

/** The roles a project starts with. Others can be added; nothing here is a closed set. */
export const DEFAULT_RAMP_ROLES = ['primary', 'secondary', 'accent'];

// How far each step travels from the base: toward white above `main`, toward a near-black
// of the same hue below it. Tuned so lightness moves in even-looking rather than even
// numeric increments — a linear walk bunches every light step up against white.
const MIX = {
  50: -0.95, 100: -0.88, 200: -0.72, 300: -0.52, 400: -0.28,
  main: 0,
  600: 0.16, 700: 0.34, 800: 0.52, 900: 0.70, 950: 0.83,
};

/**
 * One step of a ramp, as a hex string.
 *
 * Lighter steps lose saturation as they gain value, which is what stops a tint from
 * reading as a washed-out version of the same flat colour. Darker steps hold their
 * saturation so they stay recognisably the same hue rather than drifting to grey.
 *
 * Returns the base unchanged for `main`, and null if the base is not a colour we can read.
 */
export const rampStep = (baseHex, step) => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return null;
  const t = MIX[step];
  if (t === undefined) return null;
  // The chosen colour is handed straight back, never recomputed. See buildRamp.
  if (t === 0) return String(baseHex).trim().toUpperCase();

  const { h, s, v } = rgbToHsv(rgb);
  if (t < 0) {
    const k = -t;
    return rgbToHex(hsvToRgb({ h, s: s * (1 - k * 0.92), v: v + (1 - v) * k }));
  }
  return rgbToHex(hsvToRgb({ h, s: Math.min(1, s * (1 + t * 0.12)), v: v * (1 - t) }));
};

/** How a step is labelled in the table: `Main` for the base, the number otherwise. */
export const stepLabel = (step) =>
  step === RAMP_BASE_STEP ? 'Main' : String(step);

/**
 * A full ramp as project tokens, ready for handleAddTokens.
 *
 * `main` carries the base colour byte for byte — the ramp is built around the designer's
 * choice, never a nearby value that fits the curve better. Quietly shifting it would also
 * put the token out of step with the Brand Bible, which is where the colour came from.
 */
export const buildRamp = (baseHex, role, opts = {}) => {
  const base = hexToRgb(baseHex);
  if (!base) return [];
  const slug = String(role || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return [];
  const pretty = String(role).trim();

  return RAMP_STEPS.map(step => {
    const value = rampStep(baseHex, step);
    if (!value) return null;
    return {
      name: 'color.' + slug + '.' + step,
      value,
      type: 'color',
      // The raw palette a system is built from, which is what the Brand tier holds.
      layer: 'Brand',
      description: step === RAMP_BASE_STEP
        ? pretty + ' base colour'
        : pretty + ' ' + step + ', derived from ' + String(baseHex).trim().toUpperCase(),
      ...opts,
    };
  }).filter(Boolean);
};

/**
 * WCAG contrast of a step against a background, for the row to report. Uses the same
 * formula the colour picker shades its failing region with, so the two cannot disagree.
 * Null when either colour is unreadable — the caller shows nothing rather than a made-up
 * ratio.
 */
export const stepContrast = (hex, backgroundHex) => {
  const a = hexToRgb(hex), b = hexToRgb(backgroundHex);
  if (!a || !b) return null;
  return contrastRatio(a, b);
};

/**
 * Gives every brand role a 50–950 ramp, so the Tokens page has the scale a designer
 * expects to find instead of one flat colour per role.
 *
 * Additive and idempotent. A role whose ramp already exists is left alone, and the
 * original `brand.color.<role>` token keeps its name — its value becomes
 * `{color.<role>.main}`, so it now resolves *through* the ramp. That is what lets every
 * saved mapping and alias carry on resolving to the colour it always did:
 * `button.bg` → `color.action` → `brand.color.primary` → `{color.primary.main}` → the
 * same hex, one hop further along.
 *
 * Nothing is renamed and nothing is removed, because a rename here would silently unstyle
 * every component that referenced the old name.
 */
export const addColorRamps = (tokens) => {
  const colors = Array.isArray(tokens?.Color) ? tokens.Color : null;
  if (!colors) return tokens;

  const byName = new Map(colors.map(t => [t.name, t]));
  const added = [];
  let changed = false;
  const next = colors.slice();

  for (const role of DEFAULT_RAMP_ROLES) {
    // Already ramped — nothing to do, however many times a project is opened.
    if (byName.has('color.' + role + '.' + RAMP_BASE_STEP)) continue;

    const base = byName.get('brand.color.' + role);
    const baseHex = base && String(base.value || '').trim();
    // Only a literal colour can seed a ramp. A role that is itself an alias, or absent,
    // is skipped rather than guessed at.
    if (!baseHex || baseHex.startsWith('{')) continue;

    const ramp = buildRamp(baseHex, role);
    if (ramp.length !== RAMP_STEPS.length) continue;

    added.push(...ramp);
    // The old name survives as an alias of the ramp's base step.
    const i = next.findIndex(t => t.name === base.name);
    if (i !== -1) next[i] = { ...next[i], value: '{color.' + role + '.' + RAMP_BASE_STEP + '}' };
    changed = true;
  }

  if (!changed) return tokens;
  // Steps lead, so the ramp reads as the palette it is; the aliases keep their order.
  return { ...tokens, Color: [...added, ...next] };
};
