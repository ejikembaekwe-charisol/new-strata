// Text styles: the named things a designer applies, rather than the ingredients they are
// made of.
//
// A style here is not a composite token. It is a set of ordinary tokens sharing a name
// prefix — `type.h1.size`, `type.h1.line-height`, `type.h1.weight`, `type.h1.family` —
// which the Tokens page draws as one summary row that expands.
//
// That shape is deliberate. Every token value in this app is a string: resolveTokenValue
// returns one, resolveMappedStyle turns one token into one CSS property, and the CSS export
// interpolates the value directly. A DTCG `typography` composite would need new handling in
// all of those plus a new inspector control. A named set needs none of it — a component
// maps `font-size` to `type.h1.size` with the controls that already exist.

import { SCALE_STEPS } from './typeScale.js';

/* ── the catalogue ── */

// `type.*` and not `text.*`: `text.heading` is already a font-family token, and nesting
// `text.heading.h1.size` beneath it would make one DTCG node both a token and a group,
// which the format does not allow and the exporter would emit as `{$value, $type, h1:{…}}`.
export const STYLE_PREFIX = 'type.';

/**
 * Every style, in the order the panel reads. `step` names the scale step the style sits on,
 * so a size is an alias and never a copied number.
 */
export const TEXT_STYLES = [
  { slug: 'h1', group: 'Heading', label: 'H1', step: '4xl', leading: 'tight', weight: 'bold', family: 'heading' },
  { slug: 'h2', group: 'Heading', label: 'H2', step: '3xl', leading: 'tight', weight: 'bold', family: 'heading' },
  { slug: 'h3', group: 'Heading', label: 'H3', step: '2xl', leading: 'tight', weight: 'bold', family: 'heading' },
  { slug: 'h4', group: 'Heading', label: 'H4', step: 'xl', leading: 'snug', weight: 'semibold', family: 'heading' },
  { slug: 'h5', group: 'Heading', label: 'H5', step: 'lg', leading: 'snug', weight: 'semibold', family: 'heading' },
  { slug: 'title-1', group: 'Title', label: 'Title 1', step: 'lg', leading: 'snug', weight: 'semibold', family: 'heading' },
  { slug: 'title-2', group: 'Title', label: 'Title 2', step: 'base', leading: 'snug', weight: 'semibold', family: 'heading' },
  { slug: 'body', group: 'Body', label: 'Body', step: 'base', leading: 'normal', weight: 'regular', family: 'body' },
  { slug: 'caption', group: 'Caption', label: 'Caption', step: 'xs', leading: 'normal', weight: 'regular', family: 'body' },
];

/** The style folders, in order, without duplicates. */
export const STYLE_GROUPS = TEXT_STYLES.reduce(
  (acc, s) => (acc.includes(s.group) ? acc : [...acc, s.group]), []
);

// The four tokens a style is made of, and the CSS property each one carries.
export const STYLE_PARTS = [
  { key: 'family', type: 'font-family' },
  { key: 'size', type: 'font-size' },
  { key: 'line-height', type: 'line-height' },
  { key: 'weight', type: 'font-weight' },
];

const BY_SLUG = Object.fromEntries(TEXT_STYLES.map(s => [s.slug, s]));

/**
 * The style a token name belongs to, plus which part of it. `type.h1.size` →
 * `{ style, part: 'size' }`, and null for anything that is not a style token.
 */
export const styleOf = (name) => {
  const parts = String(name || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'type') return null;
  const style = BY_SLUG[parts[1]];
  if (!style) return null;
  const part = STYLE_PARTS.find(p => p.key === parts[2]);
  return part ? { style, part: part.key } : null;
};

/** Parts sort as they are listed, not alphabetically. */
export const partRank = (part) => {
  const i = STYLE_PARTS.findIndex(p => p.key === part);
  return i === -1 ? STYLE_PARTS.length : i;
};

/* ── the shared values the styles point at ── */

// Line heights and weights are the one thing here that is NOT read out of the project:
// nothing in a Strata project defines them, so these are a stated convention. Each token
// says so in its description rather than passing 1.2 off as a measurement. They are
// ordinary editable tokens, and because every style aliases them, retuning one retunes
// every style that uses it.
const A_DEFAULT = ' — a default, not derived from your project';

export const LEADING_TOKENS = [
  { name: 'brand.font.leading.tight', value: '1.2', description: 'Tight line height, for headings' + A_DEFAULT },
  { name: 'brand.font.leading.snug', value: '1.35', description: 'Snug line height, for titles' + A_DEFAULT },
  { name: 'brand.font.leading.normal', value: '1.5', description: 'Normal line height, for body text' + A_DEFAULT },
];

export const WEIGHT_TOKENS = [
  { name: 'brand.font.weight.regular', value: '400', description: 'Regular weight' + A_DEFAULT },
  { name: 'brand.font.weight.medium', value: '500', description: 'Medium weight' + A_DEFAULT },
  { name: 'brand.font.weight.semibold', value: '600', description: 'Semibold weight' + A_DEFAULT },
  { name: 'brand.font.weight.bold', value: '700', description: 'Bold weight' + A_DEFAULT },
];

/* ── generation ── */

const findScalePrefix = (list) => {
  // Follows whatever convention the project's own scale uses, so a project on
  // `type.scale.*` is pointed at its own steps rather than ours.
  for (const step of SCALE_STEPS) {
    const hit = (list || []).find(t => t.name.endsWith('.' + step));
    if (hit) return hit.name.slice(0, hit.name.length - step.length);
  }
  return null;
};

const findFamily = (list, which) => {
  const exact = (list || []).find(t => t.name === 'brand.font.' + which);
  if (exact) return exact.name;
  const loose = (list || []).find(t => new RegExp('\\bfont\\.' + which + '$').test(t.name));
  return loose ? loose.name : null;
};

/**
 * Adds the nine text styles, plus the shared line-height and weight tokens they point at.
 *
 * Additive and idempotent: a style already present is left alone, so this runs on every
 * load without accumulating anything.
 *
 * Refuses rather than guesses. Without a scale to alias there are no styles at all, and a
 * style whose step is missing from the project is skipped rather than handed an invented
 * size — the same rule the scale pass follows.
 */
export const addTextStyles = (tokens) => {
  const list = Array.isArray(tokens?.Typography) ? tokens.Typography : null;
  if (!list) return tokens;

  const scalePrefix = findScalePrefix(list);
  if (!scalePrefix) return tokens;

  const have = new Set(list.map(t => t.name));
  const stepNames = new Set(list.map(t => t.name));
  const headingFamily = findFamily(list, 'heading');
  const bodyFamily = findFamily(list, 'body');

  const added = [];
  const push = (token) => { if (!have.has(token.name)) { have.add(token.name); added.push(token); } };

  for (const t of LEADING_TOKENS) {
    push({ name: t.name, value: t.value, type: 'line-height', layer: 'Brand', description: t.description });
  }
  for (const t of WEIGHT_TOKENS) {
    push({ name: t.name, value: t.value, type: 'font-weight', layer: 'Brand', description: t.description });
  }

  for (const style of TEXT_STYLES) {
    const sizeTarget = scalePrefix + style.step;
    // No step, no style. An invented size would be worse than an absent one.
    if (!stepNames.has(sizeTarget)) continue;

    const family = style.family === 'heading' ? headingFamily : bodyFamily;
    const parts = {
      family: family ? '{' + family + '}' : null,
      size: '{' + sizeTarget + '}',
      'line-height': '{brand.font.leading.' + style.leading + '}',
      weight: '{brand.font.weight.' + style.weight + '}',
    };

    for (const part of STYLE_PARTS) {
      const value = parts[part.key];
      if (!value) continue;
      push({
        name: STYLE_PREFIX + style.slug + '.' + part.key,
        value,
        type: part.type,
        // A style is a composition of brand values, which is what the semantic tier is for.
        layer: 'Semantic',
        description: style.label + ' ' + part.key.replace('-', ' '),
      });
    }
  }

  if (added.length === 0) return tokens;
  return { ...tokens, Typography: [...list, ...added] };
};
