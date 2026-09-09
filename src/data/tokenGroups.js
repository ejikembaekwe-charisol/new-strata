// How each token category is foldered on the Tokens page.
//
// The page used to fold every category the same way — by tier: Brand / Semantic / Scoped.
// That is how a token system is built, and it is the wrong first question for a designer,
// who arrives looking for Primary, Secondary and Accent.
//
// So grouping became a per-category rule. Colour groups by role; every other category
// keeps the tier folders it has always had. One rule object, so the tree has a single code
// path and adding a type scale or a spacing scale later is a rule here rather than a
// rewrite there.
//
// Nothing is stored on a token to make this work. A role and a step are read out of the
// token's name, the same way `guessLayer` reads a tier out of a name and
// `categoryForComponent` reads a folder out of a template.

import { RAMP_STEPS, RAMP_BASE_STEP, DEFAULT_RAMP_ROLES, stepLabel } from './colorRamp.js';
import { scaleStepOf, stepRank as scaleStepRank, stepLabel as scaleStepLabel } from './typeScale.js';
import { normalizeTypeKey } from './tokenTypes.js';
import { TEXT_STYLES, STYLE_GROUPS, styleOf, partRank } from './textStyles.js';

/* ── tiers ── */
// Owned here rather than in ProjectDetail because they are organisation, which is this
// file's subject. ProjectDetail imports them so there is one source of truth.

export const TOKEN_LAYERS = ['Brand', 'Semantic', 'Component'];

export const TOKEN_LAYER_LABELS = { Brand: 'Brand', Semantic: 'Semantic', Component: 'Scoped' };

export const TOKEN_LAYER_COLORS = { Brand: '#F59E0B', Semantic: '#3B82F6', Component: '#10B981' };

export const layerColorFor = (layer) => TOKEN_LAYER_COLORS[layer] || TOKEN_LAYER_COLORS.Component;

/* ── reading a ramp out of a name ── */

const STEP_STRINGS = new Set(RAMP_STEPS.map(String));

/**
 * `color.primary.400` → `{ role: 'primary', step: '400' }`, and null for anything that is
 * not a ramp member. Deliberately strict: exactly three dotted parts, a `color` prefix and
 * a step this build knows. A token that merely mentions a role is not a ramp step.
 */
export const rampMemberOf = (name) => {
  const parts = String(name || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'color') return null;
  const [, role, step] = parts;
  if (!role || !STEP_STRINGS.has(step)) return null;
  return { role, step };
};

/** Ramp steps sort light to dark, in RAMP_STEPS order, not alphabetically. */
const stepRank = (step) => {
  const i = RAMP_STEPS.map(String).indexOf(String(step));
  return i === -1 ? RAMP_STEPS.length : i;
};

// Words a designer writes in capitals. Title-casing them blindly gives "Ui" and "Lg",
// which reads as a typo rather than an abbreviation.
const KEEP_UPPER = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'ui', 'bg',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * How a token reads in the table: `space.tight` becomes "Space Tight".
 *
 * The stored name is untouched — it is what the CSS and DTCG exports are built from, and
 * what a developer types. This is only the label, the same way a ramp step already reads
 * "400" while the token underneath is `color.primary.400`. The full name stays on the row's
 * hover title and in its menu.
 *
 * The whole name is humanised rather than trimmed to the part the folder does not already
 * say: `brand.font.heading` and `text.heading` share a folder, and trimming would make both
 * of them "Heading".
 */
export const humanizeTokenName = (name) => String(name || '')
  .split(/[.\-_]/)
  .filter(Boolean)
  .map(w => (KEEP_UPPER.has(w.toLowerCase())
    ? w.toUpperCase()
    : w.charAt(0).toUpperCase() + w.slice(1)))
  .join(' ');

const titleCase = (slug) => String(slug)
  .split('-')
  .filter(Boolean)
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

// Surfaces, text and borders: the greys a system needs that are nobody's brand colour.
// Matched by name, so a project that never adopted these names simply has no Neutral group
// rather than a wrong one.
const NEUTRAL_PATTERNS = [
  /^color\.(text|bg|background|surface|border|divider)\b/i,
  /^brand\.color\.(background|surface|text|border)$/i,
  /^color\.(white|black)$/i,
];

const isNeutral = (name) => NEUTRAL_PATTERNS.some(re => re.test(String(name || '')));

// Success, warning, danger. Not a ramp and not a neutral, but very much a role a designer
// looks for by name — without this they land in Other beside the component aliases.
const FEEDBACK_PATTERNS = [
  /^color\.(feedback|status|state)\b/i,
  /^color\.(success|warning|danger|error|info)\b/i,
];

const isFeedback = (name) => FEEDBACK_PATTERNS.some(re => re.test(String(name || '')));

/**
 * The folder a plain colour token belongs to: `color.charts.series-1` -> `charts`.
 *
 * Only consulted after the ramp, Neutral and Feedback passes have taken theirs, because
 * `color.text.primary` and `color.feedback.success` are this shape too and belong to those
 * groups rather than to folders called Text and Feedback.
 */
const plainFolderOf = (name) => {
  const parts = String(name || '').split('.');
  if (parts.length < 3 || parts[0] !== 'color') return null;
  return parts[1] ? parts[1].toLowerCase() : null;
};

// A role's own base token from before ramps existed. It survives as an alias of the ramp's
// Main step, so it belongs in that role's folder — under its full name, since it is not a
// step.
// Which ramp a `brand.color.<role>` token belongs with.
//
// Its own name is only a fallback. Once it aliases a ramp step — which is what
// addColorRamps makes it, and what survives a rename — the ramp it points at is where it
// belongs. Otherwise renaming Primary to Brand Pink would leave brand.color.primary sitting
// in an otherwise empty Primary folder while resolving to Brand Pink.
const legacyRoleOfToken = (token) => {
  const byName = legacyRoleOf(token && token.name);
  if (!byName) return null;
  const aliased = rampMemberOf(String((token && token.value) || '').trim().replace(/^\{|\}$/g, ''));
  return aliased ? aliased.role : byName;
};

const legacyRoleOf = (name) => {
  const m = /^brand\.color\.([a-z0-9-]+)$/i.exec(String(name || ''));
  return m && !isNeutral(name) ? m[1].toLowerCase() : null;
};

/* ── the groupings ── */

/** Every category's behaviour before this change, and still every category but Color. */
const LAYER_GROUPING = {
  id: 'layer',
  groupsFor: (tokens) => TOKEN_LAYERS.map(layer => ({
    key: layer,
    label: TOKEN_LAYER_LABELS[layer],
    dot: TOKEN_LAYER_COLORS[layer],
    dotStyle: 'tier',
    // An empty tier still shows its folder, which is how a folder list reads.
    always: true,
    tokens: (tokens || []).filter(t => t.layer === layer),
    // A token added from this folder should land in this tier.
    defaults: { layer },
  })),
  rowLabel: (token) => humanizeTokenName(token.name),
};

const COLOR_GROUPING = {
  id: 'role',
  groupsFor: (tokens) => {
    const list = tokens || [];

    // Roles the project starts with, then any further ramp somebody added. Discovered
    // roles are sorted so the order cannot depend on token insertion order.
    const found = new Set();
    for (const t of list) {
      const m = rampMemberOf(t.name);
      if (m) found.add(m.role);
      const legacy = legacyRoleOfToken(t);
      if (legacy) found.add(legacy);
    }
    const roleKeysWithSteps = new Set();
    for (const t of list) {
      const m = rampMemberOf(t.name);
      if (m) roleKeysWithSteps.add(m.role);
    }
    const extra = [...found].filter(r => !DEFAULT_RAMP_ROLES.includes(r)).sort();
    const roles = [...DEFAULT_RAMP_ROLES, ...extra];

    // The three default roles show as empty folders only while the project has no ramp at
    // all — they are a hint about what belongs here. Once any ramp exists they stop being
    // placeholders, so renaming Primary does not leave an empty Primary beside the new name.
    const anyRamp = roleKeysWithSteps.size > 0;

    const claimed = new Set();
    const groups = roles.map(role => {
      const members = list.filter(t => {
        const m = rampMemberOf(t.name);
        const hit = (m && m.role === role) || legacyRoleOfToken(t) === role;
        if (hit) claimed.add(t.name);
        return hit;
      });
      // Steps light to dark; the legacy alias trails them under its own name.
      members.sort((a, b) => {
        const ma = rampMemberOf(a.name), mb = rampMemberOf(b.name);
        if (ma && mb) return stepRank(ma.step) - stepRank(mb.step);
        if (ma) return -1;
        if (mb) return 1;
        return a.name.localeCompare(b.name);
      });
      return {
        key: role,
        label: titleCase(role),
        // The base step's own colour makes a better folder marker than a tier dot.
        dot: members.find(t => rampMemberOf(t.name)?.step === RAMP_BASE_STEP)?.value || null,
        // A ramp's marker is the colour itself, so the folder list reads as a palette.
        dotStyle: 'swatch',
        always: !anyRamp && DEFAULT_RAMP_ROLES.includes(role),
        tokens: members,
        defaults: { layer: 'Brand', namePrefix: 'color.' + role + '.' },
      };
    });

    const neutral = list.filter(t => !claimed.has(t.name) && isNeutral(t.name));
    neutral.forEach(t => claimed.add(t.name));
    groups.push({
      key: 'neutral',
      label: 'Neutral',
      dot: null,
      always: true,
      tokens: neutral,
      defaults: { layer: 'Semantic', namePrefix: 'color.' },
    });

    const feedback = list.filter(t => !claimed.has(t.name) && isFeedback(t.name));
    feedback.forEach(t => claimed.add(t.name));
    groups.push({
      key: 'feedback',
      label: 'Feedback',
      dot: null,
      // Only shown when the project actually has status colours.
      always: false,
      tokens: feedback,
      defaults: { layer: 'Semantic', namePrefix: 'color.feedback.' },
    });

    // Sets of related colours that are not a ramp — chart series, illustration swatches,
    // a partner's palette. A ramp is one colour generated outward; these are a named set
    // you fill yourself, so there is no base step and no generated scale.
    const folderNames = new Set();
    for (const t of list) {
      if (claimed.has(t.name)) continue;
      const f = plainFolderOf(t.name);
      if (f) folderNames.add(f);
    }
    for (const folder of [...folderNames].sort()) {
      const members = list.filter(t => !claimed.has(t.name) && plainFolderOf(t.name) === folder);
      members.forEach(t => claimed.add(t.name));
      groups.push({
        key: 'folder:' + folder,
        label: titleCase(folder),
        // No swatch: that marker is a ramp's base colour and doubles as its recolour
        // control. A folder has no base, and showing one would promise a control that is
        // not there.
        dot: null,
        always: false,
        // No step order to respect, so alphabetical.
        tokens: members.slice().sort((a, b) => a.name.localeCompare(b.name)),
        defaults: { layer: 'Brand', namePrefix: 'color.' + folder + '.' },
      });
    }

    // Nothing may fall out of the tree for failing to match the taxonomy — the same rule
    // componentFoldersFor follows. In practice this holds the semantic and scoped aliases
    // (color.action, button.bg), whose tier dot already says what they are.
    const rest = list.filter(t => !claimed.has(t.name));
    groups.push({
      key: 'other',
      label: 'Other',
      dot: null,
      // Hidden when empty: an always-visible Other reads as a dumping ground.
      always: false,
      tokens: rest,
      defaults: { layer: 'Semantic' },
    });

    return groups;
  },
  // Inside a role folder the header already says Primary, so eleven repetitions of
  // `color.primary.*` would be noise. The step alone is the useful part.
  rowLabel: (token) => {
    const m = rampMemberOf(token.name);
    return m ? stepLabel(m.step) : humanizeTokenName(token.name);
  },
};

/* ── typography ── */

// Ordered the way a type spec is read: what the letters are, then how big, then the rest.
//
// Unlike colour, the folder a typography token belongs in needs no name parsing — every
// token already carries `type`. Only the steps *inside* Type Scale come from names.
// A designer builds a type system in a fixed order: choose the faces, set the scale,
// decide the weights and the leading — then compose the styles out of them. The panel
// follows that, so Font Family is the first thing on the page and the styles sit below the
// ingredients they are made of.
export const TYPE_SECTIONS = { foundations: 'Foundations', styles: 'Text styles', more: 'More' };

const TYPOGRAPHY_PROPERTIES = [
  { type: 'font-family', label: 'Font Family', always: true, namePrefix: 'brand.font.', section: TYPE_SECTIONS.foundations },
  { type: 'font-size', label: 'Type Scale', always: true, scale: true, namePrefix: 'brand.font.size.', section: TYPE_SECTIONS.foundations },
  { type: 'font-weight', label: 'Weight', namePrefix: 'brand.font.weight.', section: TYPE_SECTIONS.foundations },
  { type: 'line-height', label: 'Line Height', namePrefix: 'brand.font.leading.', section: TYPE_SECTIONS.foundations },
  { type: 'letter-spacing', label: 'Letter Spacing', namePrefix: 'brand.font.tracking.', section: TYPE_SECTIONS.foundations },
  { type: 'font-style', label: 'Font Style', section: TYPE_SECTIONS.more },
  { type: 'text-align', label: 'Text Align', section: TYPE_SECTIONS.more },
  { type: 'text-transform', label: 'Text Transform', section: TYPE_SECTIONS.more },
  { type: 'text-decoration', label: 'Text Decoration', section: TYPE_SECTIONS.more },
  { type: 'word-spacing', label: 'Word Spacing', section: TYPE_SECTIONS.more },
];

const TYPOGRAPHY_GROUPING = {
  id: 'property',
  groupsFor: (tokens) => {
    const list = tokens || [];
    const claimed = new Set();

    // Styles come first, and claim their tokens before the property folders run — a
    // style's size is typed `font-size`, so without this it would also show up under Type
    // Scale and the same token would be in two folders.
    const styleGroups = STYLE_GROUPS.map(groupName => {
      const subgroups = [];
      for (const style of TEXT_STYLES) {
        if (style.group !== groupName) continue;
        const members = list.filter(t => styleOf(t.name)?.style.slug === style.slug);
        if (members.length === 0) continue;
        members.forEach(t => claimed.add(t.name));
        members.sort((a, b) => partRank(styleOf(a.name).part) - partRank(styleOf(b.name).part));
        subgroups.push({ key: style.slug, label: style.label, style, tokens: members });
      }
      return {
        key: 'style-' + groupName.toLowerCase(),
        label: groupName,
        dot: null,
        // A style group with nothing in it means the project has no scale to build on,
        // and an empty Heading folder would only be a puzzle.
        always: false,
        tokens: subgroups.flatMap(sg => sg.tokens),
        subgroups,
        section: TYPE_SECTIONS.styles,
        defaults: { layer: 'Semantic' },
      };
    });

    const groups = TYPOGRAPHY_PROPERTIES.map(prop => {
      const members = list.filter(t => {
        if (claimed.has(t.name)) return false;
        const hit = normalizeTypeKey(t.type) === prop.type;
        if (hit) claimed.add(t.name);
        return hit;
      });

      // The size folder is a scale, so it reads small to large. Tokens that are not steps
      // (text.size.ui, button.font-size) follow them, the same order the ramps use.
      if (prop.scale) {
        members.sort((a, b) => {
          const sa = scaleStepOf(a.name), sb = scaleStepOf(b.name);
          if (sa && sb) return scaleStepRank(sa) - scaleStepRank(sb);
          if (sa) return -1;
          if (sb) return 1;
          return a.name.localeCompare(b.name);
        });
      }

      return {
        key: prop.type,
        label: prop.label,
        dot: null,
        // Family and size are what a project always has; the rest appear once it does.
        always: Boolean(prop.always),
        tokens: members,
        section: prop.section,
        defaults: { layer: 'Brand', type: prop.type, namePrefix: prop.namePrefix },
      };
    });

    // Same never-orphan rule as colour: a type this build does not list still shows up.
    const rest = list.filter(t => !claimed.has(t.name));
    groups.push({
      key: 'other',
      label: 'Other',
      dot: null,
      always: false,
      tokens: rest,
      section: TYPE_SECTIONS.more,
      defaults: { layer: 'Semantic' },
    });

    // Display order only. The styles still *claimed* their tokens further up, before the
    // property pass ran — a style's size is typed `font-size`, so claiming later would put
    // `type.h1.size` under Type Scale as well as under Heading.
    const inSection = (name) => groups.filter(g => g.section === name);
    return [
      ...inSection(TYPE_SECTIONS.foundations),
      ...styleGroups,
      ...inSection(TYPE_SECTIONS.more),
    ];
  },
  rowLabel: (token) => {
    // Inside a style the folder already says H1, so the row is just the part it carries.
    const st = styleOf(token.name);
    if (st) return titleCase(st.part);
    if (normalizeTypeKey(token.type) !== 'font-size') return humanizeTokenName(token.name);
    const step = scaleStepOf(token.name);
    return step ? scaleStepLabel(step) : humanizeTokenName(token.name);
  },
};

const GROUPINGS = { Color: COLOR_GROUPING, Typography: TYPOGRAPHY_GROUPING };

/**
 * Every colour group name already in use — ramp roles and plain folders both — so a new
 * folder can be refused rather than quietly merging into one that exists.
 */
export const colorGroupSlugsIn = (colorTokens) => {
  const out = new Set();
  for (const t of colorTokens || []) {
    const m = rampMemberOf(t.name);
    if (m) { out.add(m.role); continue; }
    const legacy = legacyRoleOfToken(t);
    if (legacy) { out.add(legacy); continue; }
    if (isNeutral(t.name) || isFeedback(t.name)) continue;
    const f = plainFolderOf(t.name);
    if (f) out.add(f);
  }
  for (const r of DEFAULT_RAMP_ROLES) out.add(r);
  return out;
};

/** The rule for a category. Every category has one; Color's is the only special case. */
export const groupingFor = (categoryId) => GROUPINGS[categoryId] || LAYER_GROUPING;

/**
 * The folders to render for a category, dropping the ones that are both empty and not
 * marked `always`.
 */
export const groupsFor = (categoryId, tokens) =>
  groupingFor(categoryId)
    .groupsFor(tokens)
    .filter(g => g.always || g.tokens.length > 0);

/** How a token's name reads inside its folder. */
export const rowLabelFor = (categoryId, token) => groupingFor(categoryId).rowLabel(token);

/**
 * Colour token names bucketed by role, in the same order and under the same labels the
 * Tokens page folders them.
 *
 * Takes names rather than tokens on purpose: the colour picker has only names, and sharing
 * this derivation is what stops a dropdown and the tree disagreeing about which ramp a
 * colour belongs to. Returns null when there is nothing worth grouping, so a caller can
 * fall back to a flat list rather than draw one pointless heading.
 */
export const groupColorNames = (names) => {
  const list = (names || []).filter(Boolean);
  if (list.length === 0) return null;

  const buckets = new Map();
  const push = (key, name) => {
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(name);
  };

  for (const name of list) {
    const m = rampMemberOf(name);
    if (m) { push('role:' + m.role, name); continue; }
    const legacy = legacyRoleOf(name);
    if (legacy) { push('role:' + legacy, name); continue; }
    push(isNeutral(name) ? 'neutral' : isFeedback(name) ? 'feedback' : 'other', name);
  }

  const roleKeys = [...buckets.keys()].filter(k => k.startsWith('role:')).map(k => k.slice(5));
  const known = DEFAULT_RAMP_ROLES.filter(r => roleKeys.includes(r));
  const extra = roleKeys.filter(r => !DEFAULT_RAMP_ROLES.includes(r)).sort();

  const out = [];
  for (const role of [...known, ...extra]) {
    const members = buckets.get('role:' + role) || [];
    // Steps light to dark, the legacy alias after them.
    members.sort((a, b) => {
      const ma = rampMemberOf(a), mb = rampMemberOf(b);
      if (ma && mb) return stepRank(ma.step) - stepRank(mb.step);
      if (ma) return -1;
      if (mb) return 1;
      return a.localeCompare(b);
    });
    out.push({ label: titleCase(role), names: members });
  }
  for (const [key, label] of [['neutral', 'Neutral'], ['feedback', 'Feedback'], ['other', 'Other']]) {
    const members = buckets.get(key);
    if (members && members.length) out.push({ label, names: members.slice().sort() });
  }

  // A single group is just a flat list wearing a hat.
  return out.length > 1 ? out : null;
};
