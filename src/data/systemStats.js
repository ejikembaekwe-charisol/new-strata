// What a design system actually contains, read off the design system itself.
//
// Every number the public page prints comes from here, and every one of them is counted
// from real tokens. Nothing in this file has a fallback: a value that cannot be derived is
// left out of the returned list entirely, so the page renders one fewer row rather than a
// `0` or a `—` that reads like a measurement.
//
// That rule is the whole point of the module. SharedProject already applies it in two
// places — `glanceSwatches` keeps only colours the project defines, and `versionsList`
// carries the comment "No invented '1.2.0' fallback" — and this generalises it.
//
// Pure, and unit-tested — but through the Vite dev server rather than bare Node. Unlike
// designDiff.js, this reaches `rampMemberOf` in tokenGroups.js, whose transitive import
// colorRamp.js pulls in ColorPicker.jsx, which Node cannot parse. Duplicating the ramp-name
// parse here to win a `node` invocation would be the wrong trade: two parsers disagreeing
// about what `color.primary.400` means is exactly the bug tokenGroups exists to prevent.

import { rampMemberOf } from './tokenGroups.js';
import { measureRatio, scaleEntriesOf, parseLength } from './typeScale.js';
import { buildUsageIndex, isDeadToken } from './tokenUsage.js';

/**
 * Token types arrive as `fontSize` from the editor and `font-size` from older stores, so
 * every comparison in here goes through this rather than matching one spelling.
 */
const typeKey = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** An alias points at another token; only a literal value can be counted or measured. */
const isAlias = (v) => {
  const s = String(v == null ? '' : v).trim();
  return s.startsWith('{') || s.startsWith('$');
};

/** Every token in the store as one flat list, each carrying the category it came from. */
export const flattenTokens = (tokensMap) => {
  const out = [];
  for (const cat in tokensMap || {}) {
    if (!Array.isArray(tokensMap[cat])) continue;
    for (const t of tokensMap[cat]) if (t && t.name) out.push({ ...t, category: cat });
  }
  return out;
};

/**
 * The literal radius values in use, most common first.
 *
 * Aliases are skipped rather than resolved: `button.radius -> {border.radius.md}` is the
 * same measurement counted twice, and counting it twice would turn a uniform system into
 * a "mixed" one purely because it aliases tidily.
 */
const radiusValues = (all) => {
  const counts = new Map();
  for (const t of all) {
    if (typeKey(t.type) !== 'borderradius') continue;
    if (isAlias(t.value)) continue;
    const v = String(t.value).trim();
    if (!v || !parseLength(v)) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

/** Ramp roles that genuinely have steps, with how many each carries. */
const rampRoles = (all) => {
  const roles = new Map();
  for (const t of all) {
    if (typeKey(t.type) !== 'color') continue;
    const m = rampMemberOf(t.name);
    if (!m) continue;
    if (!roles.has(m.role)) roles.set(m.role, new Set());
    roles.get(m.role).add(m.step);
  }
  // One step is a colour, not a ramp.
  return [...roles.entries()].filter(([, steps]) => steps.size > 1);
};

/**
 * The rail beside the description: label/value pairs, in reading order.
 *
 * `fallbackColor` is the project's own avatar colour, which is real — it is the one thing
 * every project has even before a brand is set. Everything else resolves or is dropped.
 */
export const statsFor = (tokensMap, components, brand, fallbackColor) => {
  const all = flattenTokens(tokensMap);
  const b = brand || {};
  const rows = [];
  const push = (label, value, kind) => {
    if (value === null || value === undefined || value === '' || value === 0) return;
    rows.push({ label, value, kind: kind || 'text' });
  };

  push('Primary', b.primaryColor || fallbackColor || null, 'color');
  push('Accent', b.accentColor || null, 'color');

  // One line when both are set, because that is the pairing; whichever exists otherwise.
  const faces = [b.headingFont, b.bodyFont].filter(Boolean);
  push('Typeface', faces.length === 2 && faces[0] !== faces[1]
    ? faces[0] + ' / ' + faces[1]
    : (faces[0] || null));

  push('Components', Array.isArray(components) ? components.length : 0);

  // Counted by category, not by token type, because the Explore tabs are categories and a
  // reader sees both numbers at once. Counting colour-typed tokens instead gave "Colours 12"
  // beside a Colours tab holding 8 — both true, since component-tier colours are filed
  // elsewhere, and impossible to reconcile from the page.
  const inCategory = (cat) => (Array.isArray(tokensMap?.[cat]) ? tokensMap[cat].length : 0);
  push('Colours', inCategory('Color'));
  push('Typography', inCategory('Typography'));
  push('Spacing', inCategory('Spacing'));

  const radii = radiusValues(all);
  if (radii.length) {
    push('Base radius', radii[0][0]);
    // Two different literal radii is a deliberate choice, not an accident worth hiding.
    push('Shape', radii.length === 1 ? 'Uniform' : 'Mixed');
  }

  return rows;
};

/**
 * Mirrors `scaleLabel` in newProject/templateData.js. Duplicated rather than imported
 * because that module builds all twelve templates on load and this one must stay cheap;
 * if the thresholds move, they move in both.
 */
const scaleWord = (ratio) => {
  if (ratio <= 1.15) return 'compact';
  if (ratio <= 1.27) return 'balanced';
  return 'dramatic';
};

/**
 * The handful of things that make this system this system, as sentences.
 *
 * Candidates are tried in priority order and the first `limit` that resolve are returned.
 * A caller that gets fewer than two back should drop the whole block: one lonely fact
 * reads like the page failed to load the rest.
 */
export const distinctFacts = (tokensMap, components, brand, limit = 4) => {
  const all = flattenTokens(tokensMap);
  const b = brand || {};
  const facts = [];

  const scale = measureRatio(scaleEntriesOf(tokensMap?.Typography || []));
  if (scale) {
    const entries = scaleEntriesOf(tokensMap.Typography);
    const base = entries.find(e => e.step === 'base');
    facts.push({
      title: scale.ratio.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '× type scale',
      body: 'A ' + scaleWord(scale.ratio) + ' scale'
        + (base ? ', built on ' + base.token.value : '')
        + ', across ' + entries.length + ' steps.',
    });
  }

  const roles = rampRoles(all);
  if (roles.length) {
    const steps = roles[0][1].size;
    facts.push({
      title: roles.length + ' colour ' + (roles.length === 1 ? 'ramp' : 'ramps'),
      body: roles.map(([r]) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
        + ' — ' + steps + ' steps each, derived from one brand colour apiece.',
    });
  }

  if (b.headingFont && b.bodyFont && b.headingFont !== b.bodyFont) {
    facts.push({
      title: b.headingFont + ' with ' + b.bodyFont,
      body: 'Headings set in ' + b.headingFont + ', body copy in ' + b.bodyFont + '.',
    });
  }

  const radii = radiusValues(all);
  if (radii.length) {
    facts.push({
      title: radii.length === 1 ? radii[0][0] + ' throughout' : radii.length + ' corner radii',
      body: radii.length === 1
        ? 'Every corner in the system uses ' + radii[0][0] + '.'
        : 'Corners run ' + radii.map(([v]) => v).join(', ') + '.',
    });
  }

  // Only ever stated when true, and only when there was something that could have failed.
  const usage = buildUsageIndex(tokensMap || {}, components || []);
  const checkable = all.filter(t => t.layer === 'Semantic' || t.layer === 'Component');
  if (checkable.length >= 4) {
    const dead = checkable.filter(t => isDeadToken(t, usage));
    if (dead.length === 0) {
      facts.push({
        title: 'Nothing unused',
        body: 'Every semantic and scoped token is referenced by something downstream.',
      });
    }
  }

  return facts.slice(0, limit);
};
