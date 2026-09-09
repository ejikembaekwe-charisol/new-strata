// Which properties cannot take effect on a given component, and why.
//
// The panel offers all 81 properties for every component, so a button is asked about
// `grid-template-columns` and `list-style` — around 30 of its rows look editable and can
// do nothing. This module answers "can this property do anything here", so the panel can
// dim what cannot and say why instead of staying silent.
//
// Three things it deliberately does NOT do.
//
// It never reads componentPreviews.jsx. Several previews drop mapped properties — a
// `selection` consumes four keys, an `image` with a file consumes none — but the exported
// CSS carries every mapping, so a preview's shortcomings say nothing about whether the
// property applies to the component being designed. Those are reported separately, and in
// different words, by previewGaps below.
//
// It never resolves a token. A stored value may be the name `border.width.thin` rather
// than `1px`, so a rule that needs a property to be *set* asks whether it is present.
// Only the keyword properties are read as values, because no token can express
// `flex-start` — see isLiteralOnly in inspectorSections.
//
// It never makes taste judgements. "A button should not have a shadow" is an opinion; "a
// grid track only exists on a grid container" is CSS. Only the second kind is here.

import { KNOWN_TEMPLATES } from '../componentTaxonomy';
import { INSPECTOR_PROPERTIES } from './inspectorSections';

/**
 * What a template's outer element already is, before any mapping is spread onto it.
 *
 * Taken from what componentPreviews.jsx actually renders, and it can be trusted as a
 * default rather than a fact because every preview sets its own layout *before* spreading
 * `mapped` — so a component that maps `display` overrides what is written here.
 *
 * `arranges` means there are element children a gap could space apart. Text alone does
 * not count: a button's label becomes one anonymous flex item, and one item has no gaps.
 */
const SHAPE = (display, opts = {}) => ({
  display,
  position: 'static',
  arranges: Boolean(opts.arranges),
  svg: Boolean(opts.svg),
  form: Boolean(opts.form),
  // No template renders a ul/ol/li — table uses a real <table>, and accordion, navbar,
  // breadcrumb and pagination are all divs and spans. Kept as a field because a rule
  // reads it, and because a future list template would only need a flag here.
  list: Boolean(opts.list),
});

export const TEMPLATE_SHAPE = {
  button: SHAPE('inline-block'),
  badge: SHAPE('inline-block'),
  tooltip: SHAPE('block'),
  input: SHAPE('inline-block', { form: true }),
  selection: SHAPE('block', { arranges: true, form: true, svg: true }),
  selector: SHAPE('flex', { arranges: true, svg: true }),
  accordion: SHAPE('block', { arranges: true }),
  card: SHAPE('block', { arranges: true }),
  tabs: SHAPE('block', { arranges: true }),
  modal: SHAPE('block', { arranges: true }),
  // The only template where the flex family is load-bearing: it arranges whatever
  // components it holds, and its own defaults are all overridable.
  fragment: SHAPE('flex', { arranges: true }),
  table: SHAPE('block', { arranges: true }),
  chart: SHAPE('block', { svg: true }),
  image: SHAPE('flex'),
  breadcrumb: SHAPE('inline-flex', { arranges: true }),
  pagination: SHAPE('inline-flex', { arranges: true }),
  navbar: SHAPE('flex', { arranges: true }),
  dropdown: SHAPE('block', { arranges: true }),
};

export const shapeFor = (template) => TEMPLATE_SHAPE[template] || null;

const isFlexish = (d) => d === 'flex' || d === 'inline-flex';
const isGridish = (d) => d === 'grid' || d === 'inline-grid';

/** A keyword property's literal value, or '' — safe because no token can hold one. */
const keywordOf = (prop, tokens, inherited) =>
  String(tokens[prop] || inherited[prop] || '').trim();

/**
 * What this component lays out as: its own mapping, then what it inherits, then the
 * default its template already has.
 */
export const effectiveDisplay = (template, tokens = {}, inherited = {}) =>
  keywordOf('display', tokens, inherited) || shapeFor(template)?.display || 'block';

/* ── the rules ── */
//
// Each rule says when its properties DO apply. Anything else is inactive, with the
// sentence the panel shows. Order matters only in that the first rule to fire owns the
// wording for a property.

const RULES = [
  {
    props: ['grid-template-columns', 'grid-template-rows'],
    applies: (c) => isGridish(c.display),
    reason: (c) => 'Column and row tracks only exist on a grid container, and this '
      + c.template + ' lays out as ' + c.display + '. Set display to grid to use it.',
  },
  {
    props: ['grid-column', 'grid-row', 'grid-area'],
    applies: (c) => Boolean(c.container),
    reason: () => 'Placing an item on a grid needs a grid container around it. Add this '
      + 'component to a fragment whose display is grid.',
  },
  {
    // Gated on display alone, not on having children: once display is flex a button's
    // text label becomes an anonymous flex item, and both of these visibly move it.
    props: ['flex-direction', 'flex-wrap', 'justify-content', 'align-items'],
    applies: (c) => isFlexish(c.display) || isGridish(c.display),
    reason: (c) => 'Only a flex or grid container arranges its contents, and this '
      + c.template + ' lays out as ' + c.display + '. Set display to flex to use it.',
  },
  {
    // A gap needs two things to sit between, so these do need element children.
    props: ['gap', 'row-gap', 'column-gap', 'align-content'],
    applies: (c) => (isFlexish(c.display) || isGridish(c.display)) && c.shape.arranges,
    reason: (c) => (isFlexish(c.display) || isGridish(c.display)
      ? 'A ' + c.template + ' holds no child components to space apart.'
      : 'Only a flex or grid container spaces out its contents, and this ' + c.template
        + ' lays out as ' + c.display + '. Set display to flex to use it.'),
  },
  {
    // These describe how a parent treats this component, so they need a parent that
    // lays anything out at all — which here means being inside a fragment.
    props: ['flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'order'],
    applies: (c) => Boolean(c.container),
    reason: () => 'This describes how a parent lays the component out, so it only takes '
      + 'effect once the component is inside a fragment.',
  },
  {
    props: ['top', 'right', 'bottom', 'left'],
    applies: (c) => c.position !== 'static',
    reason: () => 'An offset needs a position other than static. Set position to relative '
      + 'or absolute to use it.',
  },
  {
    // Not gated on position alone: z-index also works on a flex or grid item.
    props: ['z-index'],
    applies: (c) => c.position !== 'static' || Boolean(c.container),
    reason: () => 'Stacking order applies to a positioned element, or to an item inside a '
      + 'flex or grid parent. Set position, or put the component in a fragment.',
  },
  {
    // Presence, not value: border-width may hold a token name.
    props: ['border-color', 'border-style'],
    applies: (c) => c.has('border-width') || c.has('border'),
    reason: () => 'A border has to have a width before its colour or style shows. Set '
      + 'border width first.',
  },
  {
    props: ['outline-color', 'outline-style', 'outline-offset'],
    applies: (c) => c.has('outline-width') || c.has('outline'),
    reason: () => 'An outline has to have a width before the rest of it shows. Set '
      + 'outline width first.',
  },
  {
    props: ['text-decoration-color'],
    applies: (c) => {
      const d = c.keyword('text-decoration');
      return Boolean(d) && d !== 'none';
    },
    reason: () => 'There is no underline or strike-through to colour yet. Set a text '
      + 'decoration first.',
  },
  {
    props: ['fill', 'stroke'],
    applies: (c) => c.shape.svg,
    reason: (c) => 'Fill and stroke paint an SVG shape, and a ' + c.template
      + ' draws none.',
  },
  {
    props: ['accent-color'],
    applies: (c) => c.shape.form,
    reason: (c) => 'This tints a native checkbox, radio or range input. A ' + c.template
      + ' is not one.',
  },
  {
    props: ['list-style', 'list-style-type'],
    applies: (c) => c.shape.list || c.display === 'list-item',
    reason: (c) => 'A marker needs a list. A ' + c.template + ' is not one — set display '
      + 'to list-item to use it.',
  },
];

const contextFor = ({ template, tokens, inherited, container }) => ({
  template,
  container,
  shape: shapeFor(template),
  display: effectiveDisplay(template, tokens, inherited),
  position: keywordOf('position', tokens, inherited) || 'static',
  has: (p) => Boolean(tokens[p] || inherited[p]),
  keyword: (p) => keywordOf(p, tokens, inherited),
});

/**
 * Why each property cannot take effect on this component, keyed by property.
 *
 * Sparse: a property that applies is simply absent, so a caller reads `inactive[prop]`
 * and gets undefined in the ordinary case.
 *
 * `tokens` and `inherited` must be keyed by REAL CSS property names — both callers
 * normalise through `cssPropForTokenKey` first. Handing this raw `comp.tokens` would read
 * the six legacy short keys as unmapped and dim `border-radius` and `background-color` on
 * every component in the demo project.
 *
 * `container` is the fragment holding this component, or null. Containment, not
 * inheritance: a component may sit in more than one fragment, since children are
 * references, so the reasons say "a fragment" rather than naming one.
 *
 * Each entry carries `held`, which is the honesty flag the panel needs:
 *   ''          nothing is mapped, so the row may be dimmed and made inert
 *   'own'       a value is really there — the row stays editable and offers to clear it
 *   'inherited' the value lives on an ancestor, so clearing here would delete nothing
 */
export const inactiveProperties = ({
  template, tokens = {}, inherited = {}, container = null,
} = {}) => {
  // An unknown template means we know nothing, so nothing is claimed. `template` is never
  // validated anywhere in the app, so this has to degrade open rather than dim the lot.
  if (!shapeFor(template)) return {};

  const c = contextFor({ template, tokens, inherited, container });
  const out = {};
  for (const rule of RULES) {
    if (rule.applies(c)) continue;
    const reason = rule.reason(c);
    for (const prop of rule.props) {
      if (out[prop]) continue;
      out[prop] = {
        reason,
        held: tokens[prop] ? 'own' : (inherited[prop] ? 'inherited' : ''),
      };
    }
  }
  return out;
};

/* ── preview gaps ── */
//
// A different claim, and it must never be worded like the one above. These properties
// apply to the component and are exported correctly; it is Strata's preview that cannot
// show them, because the template hardcodes the value or has nothing to apply it to.
//
// Taken from componentPreviews.jsx: each entry is a property the preview provably drops
// or repurposes. Being wrong here is mild — a note that need not have been shown — but
// being wrong in inactiveProperties dims a working control, so the two stay separate.

const TYPOGRAPHY = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'word-spacing', 'text-align', 'text-transform',
  'text-decoration', 'text-decoration-color',
];

const GAPS = {
  // The mapped background is drawn as the field's border so the field stays legible, and
  // the border shorthand is written after the spread, which clobbers the parts.
  input: {
    'background-color': 'The preview draws this as the field border rather than as a fill, '
      + 'so the field stays legible.',
    border: 'The preview sets the field border from the mapped background instead.',
    'border-width': 'The preview sets the field border from the mapped background instead.',
    'border-style': 'The preview sets the field border from the mapped background instead.',
    'border-color': 'The preview sets the field border from the mapped background instead.',
  },
  // Reads four keys only; the row and box sizes are fixed so the controls stay recognisable.
  selection: {
    'font-size': 'The preview uses a fixed label size.',
    padding: 'The preview uses fixed row spacing.',
    'box-shadow': 'The preview does not draw a shadow on these controls.',
    opacity: 'The preview does not fade these controls.',
  },
  selector: { 'font-size': 'The preview uses a fixed label size.' },
  pagination: {
    'font-size': 'The preview uses a fixed size for the page numbers.',
    padding: 'The preview uses fixed padding on the page pills.',
  },
  // The wrapper takes the mapped style, but the chart itself is an SVG with no text in it.
  chart: Object.fromEntries(TYPOGRAPHY.map(p => [
    p, 'The chart preview draws no text, so there is nothing here for this to affect.',
  ])),
  tabs: {
    'background-color': 'The preview uses this for the active tab underline rather than as '
      + 'a fill.',
  },
};

/**
 * Properties this template's preview will not show, keyed by property. Same sparse shape
 * as inactiveProperties, but a different claim and different wording.
 *
 * `hasImage` is an `image` component with a file uploaded — that branch renders the real
 * picture and spreads no mapped style at all, so every property is a gap.
 */
export const previewGaps = ({ template, hasImage = false } = {}) => {
  if (template === 'image' && hasImage) {
    return Object.fromEntries(INSPECTOR_PROPERTIES.map(p => [
      p, 'An uploaded image is drawn as-is, so the preview applies no mapped styles to it.',
    ]));
  }
  const notes = GAPS[template];
  if (!notes) return {};
  return Object.fromEntries(Object.entries(notes).map(([p, why]) => [p, why]));
};

/* ── a development-only sanity check ── */
//
// This is KNOWN_TEMPLATES' first consumer. A template in the taxonomy with no shape here
// silently reports that everything applies, which is the safe direction but worth saying.
if (import.meta.env && import.meta.env.DEV) {
  const missing = KNOWN_TEMPLATES.filter(t => !TEMPLATE_SHAPE[t]);
  if (missing.length) {
    console.warn('[applicability] no shape for: ' + missing.join(', ')
      + ' — every property will read as applicable on those.');
  }
}

/**
 * Both kinds of note in the one shape the panel renders: `{ kind, reason, held }` keyed by
 * property.
 *
 * Inactive wins where they overlap. A property that cannot take effect here has nothing to
 * gain from also being told the preview would not have shown it.
 */
export const propertyNotes = (input = {}) => {
  const out = {};
  for (const [prop, note] of Object.entries(inactiveProperties(input))) {
    out[prop] = { kind: 'inactive', ...note };
  }
  for (const [prop, reason] of Object.entries(previewGaps(input))) {
    if (out[prop]) continue;
    out[prop] = { kind: 'preview', reason, held: '' };
  }
  return out;
};
