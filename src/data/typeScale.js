// The type scale: continuing the size steps a project already has.
//
// Colour needed ramps built from scratch, because a project stored one flat colour per
// role. Typography is different — `brand.font.size.{xs,sm,base,lg,xl}` already *is* a
// scale, five steps of one. So the job here is to carry it further, not to build it.
//
// Which makes one rule absolute: an existing step is never recomputed. Rewriting `lg` to
// fit a tidier curve would resize every component mapped to it, and the value a designer
// typed is the value they meant.

import { normalizeTypeKey } from './tokenTypes.js';

/** Small to large. `base` is the step a scale is read outward from. */
export const SCALE_STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];

export const SCALE_BASE_STEP = 'base';

/** Named ratios, for the create-a-scale dialog. */
export const SCALE_RATIOS = [
  { id: 1.2, label: '1.200 — Minor third' },
  { id: 1.25, label: '1.250 — Major third' },
  { id: 1.333, label: '1.333 — Perfect fourth' },
  { id: 1.414, label: '1.414 — Augmented fourth' },
  { id: 1.5, label: '1.500 — Perfect fifth' },
];

export const isFontSizeToken = (token) => normalizeTypeKey(token?.type) === 'font-size';

/**
 * The scale step a name ends in, or null. `brand.font.size.lg` → `lg`, while
 * `text.size.ui` and `button.font-size` are not steps and get to keep their full names.
 */
export const scaleStepOf = (name) => {
  const parts = String(name || '').split('.');
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  return SCALE_STEPS.includes(last) ? last : null;
};

/** Where a step sorts. Unknown steps go last rather than being dropped. */
export const stepRank = (step) => {
  const i = SCALE_STEPS.indexOf(String(step));
  return i === -1 ? SCALE_STEPS.length : i;
};

/** `2xl` reads as `2xl`; the base step is titled, matching how a ramp shows `Main`. */
export const stepLabel = (step) =>
  step === SCALE_BASE_STEP ? 'Base' : String(step);

const LENGTH = /^(-?[0-9]*\.?[0-9]+)(rem|em|px|pt|%)?$/;

/** A size as a number and a unit, or null if it is not a plain length. */
export const parseLength = (value) => {
  const m = LENGTH.exec(String(value == null ? '' : value).trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n) || n <= 0) return null;
  return { n, unit: m[2] || '' };
};

const formatLength = (n, unit) => {
  // Sub-pixel font sizes are noise, so px and pt round to whole numbers; rem and em keep
  // three decimals with trailing zeros trimmed.
  const v = (unit === 'px' || unit === 'pt') ? Math.round(n) : Math.round(n * 1000) / 1000;
  return String(v) + unit;
};

/**
 * The ratio to continue a scale with, measured from the top two steps that share a unit.
 *
 * Hand-tuned scales are rarely uniform — the seed runs 1.167, 1.143, 1.250, 1.200 — so
 * there is no single "the" ratio to recover. The pair adjacent to where the scale is being
 * extended is the honest one to carry on from.
 *
 * Null when there is nothing to measure. Callers add nothing in that case: inventing a
 * ratio would be inventing the project's type scale.
 */
export const measureRatio = (entries) => {
  for (let i = entries.length - 1; i > 0; i--) {
    const hi = entries[i], lo = entries[i - 1];
    if (hi.len.unit !== lo.len.unit) continue;
    const ratio = hi.len.n / lo.len.n;
    // A flat or reversed pair says the scale is not geometric here; an enormous one is
    // almost certainly a typo rather than a step.
    if (ratio > 1.01 && ratio < 4) return { ratio, from: hi };
  }
  return null;
};

/**
 * The font-size tokens that are scale steps, smallest first, with their parsed lengths.
 * Aliases are excluded — a `{...}` reference cannot seed a scale, only a literal can.
 */
export const scaleEntriesOf = (typographyTokens) => {
  const out = [];
  for (const t of typographyTokens || []) {
    if (!isFontSizeToken(t)) continue;
    const step = scaleStepOf(t.name);
    if (!step) continue;
    const len = parseLength(t.value);
    if (!len) continue;
    out.push({ step, name: t.name, token: t, len });
  }
  out.sort((a, b) => stepRank(a.step) - stepRank(b.step));
  return out;
};

/**
 * A full scale from a base size and a ratio, for the create-a-scale dialog. The base size
 * is kept exactly as given and sits on the `base` step, the way a ramp keeps its Main.
 */
export const buildScale = (baseValue, ratio, namePrefix = 'brand.font.size.') => {
  const len = parseLength(baseValue);
  const r = Number(ratio);
  if (!len || !isFinite(r) || r <= 1) return [];
  const baseIndex = SCALE_STEPS.indexOf(SCALE_BASE_STEP);

  return SCALE_STEPS.map((step, i) => {
    const n = len.n * Math.pow(r, i - baseIndex);
    const value = i === baseIndex ? String(baseValue).trim() : formatLength(n, len.unit);
    return {
      name: namePrefix + step,
      value,
      type: 'fontSize',
      layer: 'Brand',
      description: i === baseIndex
        ? 'Type scale base'
        : 'Type scale ' + step + ', ' + formatLength(len.n, len.unit) + ' x ' + r.toFixed(3)
          + ' ^ ' + (i - baseIndex),
    };
  });
};

/**
 * Continues a project's type scale upward.
 *
 * Additive and idempotent: only steps above the highest one defined are added, existing
 * steps are left exactly as they are, and a project already holding `4xl` gains nothing on
 * the next load.
 */
export const addTypeScale = (tokens) => {
  const list = Array.isArray(tokens?.Typography) ? tokens.Typography : null;
  if (!list) return tokens;

  const entries = scaleEntriesOf(list);
  if (entries.length < 2) return tokens;

  const measured = measureRatio(entries);
  if (!measured) return tokens;

  const top = entries[entries.length - 1];
  const topIndex = stepRank(top.step);
  if (topIndex >= SCALE_STEPS.length - 1) return tokens;

  // The step names follow the top step's own name, so a project using `font.size.*` or
  // `type.scale.*` is extended in its own convention rather than ours.
  const prefix = top.name.slice(0, top.name.length - top.step.length);
  const have = new Set(list.map(t => t.name));

  const added = [];
  let n = top.len.n;
  for (let i = topIndex + 1; i < SCALE_STEPS.length; i++) {
    const step = SCALE_STEPS[i];
    const name = prefix + step;
    n *= measured.ratio;
    if (have.has(name)) continue;
    added.push({
      name,
      value: formatLength(n, top.len.unit),
      type: top.token.type,
      layer: top.token.layer || 'Brand',
      description: 'Type scale ' + step + ', derived from ' + top.step
        + ' (' + formatLength(top.len.n, top.len.unit) + ') x ' + measured.ratio.toFixed(3),
    });
  }

  if (added.length === 0) return tokens;
  return { ...tokens, Typography: [...list, ...added] };
};
