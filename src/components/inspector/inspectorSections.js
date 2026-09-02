// How the inspector groups properties, and which control each one gets.
//
// This is deliberately NOT the same grouping as CATEGORY_GROUPS in ProjectDetail.
// That one answers "which token bucket feeds this property" — `gap` draws on Flexbox
// tokens, `border-radius` on Border tokens. The inspector groups by design concern
// instead: `gap` and `padding` are both Layout, `border-radius` and `opacity` are both
// Styles. Both groupings are correct for their own job, so they live separately and
// `getCategoryForType` still decides which tokens a row offers.

export const INSPECTOR_SECTIONS = [
  {
    id: 'layout',
    title: 'Layout',
    properties: [
      'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'align-content', 'align-self', 'order', 'gap', 'row-gap', 'column-gap',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    ],
  },
  {
    id: 'size',
    title: 'Size',
    properties: [
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'flex-grow', 'flex-shrink', 'flex-basis',
    ],
  },
  {
    id: 'typography',
    title: 'Typography',
    properties: [
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
      'letter-spacing', 'word-spacing', 'text-align', 'text-transform',
      'text-decoration', 'text-decoration-color',
    ],
  },
  {
    id: 'styles',
    title: 'Styles',
    properties: [
      'background-color', 'color', 'fill', 'stroke', 'opacity',
      'border', 'border-width', 'border-style', 'border-color', 'border-radius',
      'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
      'accent-color',
    ],
  },
  {
    id: 'effects',
    title: 'Effects',
    properties: ['box-shadow', 'text-shadow', 'filter', 'backdrop-filter', 'transform'],
  },
  {
    id: 'motion',
    title: 'Motion',
    properties: ['transition', 'transition-duration', 'animation-duration', 'animation-name'],
  },
  {
    id: 'position',
    title: 'Position',
    properties: ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'overflow'],
  },
  {
    id: 'grid',
    title: 'Grid',
    properties: ['grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'grid-area'],
  },
  {
    id: 'other',
    title: 'Other',
    properties: ['cursor', 'list-style', 'list-style-type'],
  },
];

/* ── control kinds ── */

// Keyword properties: a fixed set of values, no token can express them. The inspector
// shows these as segments and they are literal-only — offering a token picker for
// `flex-direction` would be offering something to point at that cannot exist.
export const SEGMENTED_OPTIONS = {
  'flex-direction': [
    { value: 'row', label: 'Row', icon: 'horizontal' },
    { value: 'column', label: 'Column', icon: 'vertical' },
  ],
  'flex-wrap': [
    { value: 'nowrap', label: 'No' },
    { value: 'wrap', label: 'Yes' },
  ],
  'text-align': [
    { value: 'left', label: 'Left', icon: 'alignStart' },
    { value: 'center', label: 'Center', icon: 'alignCenter' },
    { value: 'right', label: 'Right', icon: 'alignEnd' },
  ],
  'justify-content': [
    { value: 'flex-start', label: 'Start', icon: 'alignStart' },
    { value: 'center', label: 'Center', icon: 'alignCenter' },
    { value: 'flex-end', label: 'End', icon: 'alignEnd' },
    { value: 'space-between', label: 'Between', icon: 'spaceBetween' },
  ],
  'align-items': [
    { value: 'flex-start', label: 'Start', icon: 'alignStart' },
    { value: 'center', label: 'Center', icon: 'alignCenter' },
    { value: 'flex-end', label: 'End', icon: 'alignEnd' },
    { value: 'stretch', label: 'Stretch' },
  ],
  'border-style': [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'none', label: 'None' },
  ],
  'outline-style': [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'none', label: 'None' },
  ],
  'font-style': [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
  ],
  'text-transform': [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'Upper' },
    { value: 'capitalize', label: 'Title' },
  ],
};

// Longer keyword lists, better as a dropdown than as segments.
export const KEYWORD_OPTIONS = {
  display: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'],
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  overflow: ['visible', 'hidden', 'scroll', 'auto'],
  cursor: ['auto', 'default', 'pointer', 'text', 'move', 'not-allowed', 'grab'],
  'text-decoration': ['none', 'underline', 'line-through'],
  'align-content': ['flex-start', 'center', 'flex-end', 'space-between', 'stretch'],
  'align-self': ['auto', 'flex-start', 'center', 'flex-end', 'stretch'],
  'font-weight': ['300', '400', '500', '600', '700', '800'],
  'list-style-type': ['none', 'disc', 'circle', 'square', 'decimal'],
};

// Properties that take a colour — these get the swatch control.
export const COLOR_PROPERTIES = new Set([
  'color', 'background-color', 'border-color', 'outline-color',
  'text-decoration-color', 'accent-color', 'fill', 'stroke',
]);

// Bounded numeric properties get a slider beside the field. `max` is a sensible editing
// range, not a CSS limit — a bigger value typed into the field is still accepted.
export const SLIDER_RANGES = {
  opacity: { min: 0, max: 1, step: 0.01, unitless: true },
  'border-radius': { min: 0, max: 64, step: 1, unit: 'px' },
  'border-width': { min: 0, max: 16, step: 1, unit: 'px' },
  'outline-width': { min: 0, max: 16, step: 1, unit: 'px' },
  'font-size': { min: 8, max: 96, step: 1, unit: 'px' },
  gap: { min: 0, max: 64, step: 1, unit: 'px' },
  'row-gap': { min: 0, max: 64, step: 1, unit: 'px' },
  'column-gap': { min: 0, max: 64, step: 1, unit: 'px' },
  'letter-spacing': { min: -2, max: 8, step: 0.1, unit: 'px' },
  'line-height': { min: 0.8, max: 3, step: 0.05, unitless: true },
  'z-index': { min: 0, max: 100, step: 1, unitless: true },
  'flex-grow': { min: 0, max: 5, step: 1, unitless: true },
  'flex-shrink': { min: 0, max: 5, step: 1, unitless: true },
  order: { min: 0, max: 10, step: 1, unitless: true },
  'outline-offset': { min: 0, max: 16, step: 1, unit: 'px' },
};

// The four-up side grid, keyed by its shorthand.
export const SIDE_GROUPS = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
};
const ALL_SIDES = new Set(Object.values(SIDE_GROUPS).flat());

/** Which control a property gets. */
export const controlKind = (prop) => {
  if (SIDE_GROUPS[prop]) return 'sides';
  if (COLOR_PROPERTIES.has(prop)) return 'color';
  if (SEGMENTED_OPTIONS[prop]) return 'segmented';
  if (KEYWORD_OPTIONS[prop]) return 'keyword';
  if (SLIDER_RANGES[prop]) return 'slider';
  return 'text';
};

/**
 * A keyword or segmented property cannot reference a token — there is no token whose
 * value is `flex-start`. Those rows are literal-only, and the inspector says so rather
 * than showing an empty picker.
 */
export const isLiteralOnly = (prop) =>
  Boolean(SEGMENTED_OPTIONS[prop] || KEYWORD_OPTIONS[prop]);

/** The individual side properties, so the sides control can hide them as their own rows. */
export const isSideProperty = (prop) => ALL_SIDES.has(prop);

/** Every property the inspector can reach, for the coverage check in the tests. */
export const INSPECTOR_PROPERTIES = INSPECTOR_SECTIONS.flatMap(s => s.properties);

/**
 * Sections for a component, with the rows already resolved. `sides` rows swallow their
 * four side properties so they are not also listed individually.
 */
export const sectionsFor = (tokens = {}) => {
  const set = (p) => Boolean(tokens[p]);
  return INSPECTOR_SECTIONS.map(section => {
    const rows = section.properties.filter(p => !isSideProperty(p));
    return {
      ...section,
      rows,
      // How many of this section's properties actually carry a value, side ones included
      setCount: section.properties.filter(set).length,
    };
  });
};

/**
 * What each property actually does, shown on hover in the inspector.
 *
 * One plain sentence each, describing the CSS behaviour rather than restating the
 * property name — "Fill behind the element" is useful, "Sets the background colour"
 * is not. A missing entry is a bug, and the tests assert every property has one.
 */
export const PROPERTY_HELP = {
  // colour
  'color': 'Colour of the text inside the element.',
  'background-color': 'Fill painted behind the element, under its content and padding.',
  'border-color': 'Colour of the border. Only visible once a border width and style are set.',
  'outline-color': 'Colour of the outline — the ring drawn outside the border, often the focus ring.',
  'text-decoration-color': 'Colour of the underline or strike-through, independent of the text colour.',
  'accent-color': 'Tint browsers use for built-in controls: checkboxes, radios, range sliders.',
  'fill': 'Interior colour of an SVG shape.',
  'stroke': 'Outline colour of an SVG shape.',

  // typography
  'font-family': 'Typeface used for the text, with fallbacks if the first is unavailable.',
  'font-size': 'Height of the text. Also the basis for any value written in em.',
  'font-weight': 'Thickness of the strokes, from 100 (thin) to 900 (black).',
  'font-style': 'Upright or italic.',
  'line-height': 'Vertical space each line of text occupies — the leading.',
  'letter-spacing': 'Extra space added between characters. Negative values tighten them.',
  'text-align': 'Horizontal alignment of the text within its box.',
  'text-transform': 'Forces the text to render as uppercase, lowercase or title case without changing the content.',
  'text-decoration': 'Line drawn through the text: underline, overline or strike-through.',
  'word-spacing': 'Extra space added between words.',

  // spacing
  'padding': 'Space inside the element, between its border and its content. Shorthand for all four sides.',
  'padding-top': 'Space inside the element above its content.',
  'padding-right': 'Space inside the element to the right of its content.',
  'padding-bottom': 'Space inside the element below its content.',
  'padding-left': 'Space inside the element to the left of its content.',
  'margin': 'Space outside the element, pushing neighbours away. Shorthand for all four sides.',
  'margin-top': 'Space above the element, outside its border.',
  'margin-right': 'Space to the right of the element, outside its border.',
  'margin-bottom': 'Space below the element, outside its border.',
  'margin-left': 'Space to the left of the element, outside its border.',

  // size
  'width': 'Horizontal size of the element.',
  'height': 'Vertical size of the element.',
  'min-width': 'Floor on the width — the element will not shrink below this.',
  'min-height': 'Floor on the height — the element will not shrink below this.',
  'max-width': 'Ceiling on the width — the element will not grow beyond this.',
  'max-height': 'Ceiling on the height — the element will not grow beyond this.',
  'flex-grow': 'How greedily this item takes leftover space in a flex row or column. 0 means it never grows.',
  'flex-shrink': 'How readily this item gives up space when the container is too small. 0 means it never shrinks.',
  'flex-basis': 'The size a flex item starts from, before growing or shrinking.',

  // border & styles
  'border': 'Border width, style and colour in one declaration.',
  'border-width': 'Thickness of the border.',
  'border-style': 'Line style of the border: solid, dashed, none.',
  'border-radius': 'How rounded the corners are. A large value on a square element makes a circle.',
  'outline': 'Outline width, style and colour in one declaration. Drawn outside the border and takes up no space.',
  'outline-width': 'Thickness of the outline.',
  'outline-style': 'Line style of the outline.',
  'outline-offset': 'Gap between the border and the outline.',
  'opacity': 'How opaque the element is, from 0 (invisible) to 1 (solid). Applies to its content too.',

  // effects
  'box-shadow': 'Shadow cast by the element box. Offset, blur, spread and colour.',
  'text-shadow': 'Shadow cast by the text itself rather than the box.',
  'transform': 'Geometric change to the element: translate, rotate, scale or skew.',
  'filter': 'Graphical effect applied to the element: blur, brightness, saturation and so on.',
  'backdrop-filter': 'Effect applied to whatever sits behind the element — how frosted glass is done.',
  'cursor': 'Pointer shape shown when hovering the element.',

  // motion
  'transition': 'Which properties animate when they change, and how. Shorthand for property, duration and easing.',
  'transition-duration': 'How long a transition takes.',
  'animation-duration': 'How long one cycle of a keyframe animation takes.',
  'animation-name': 'Which keyframe animation runs — how the component arrives on screen.',

  // layout
  'display': 'How the element lays out its children and flows among its siblings — block, flex, grid, none.',
  'flex-direction': 'Whether flex children stack in a row or a column.',
  'flex-wrap': 'Whether flex children spill onto a new line when they run out of room.',
  'justify-content': 'How children are distributed along the main axis — the direction flex-direction set.',
  'align-items': 'How children line up across the axis opposite the flex direction.',
  'align-content': 'How wrapped rows of children are distributed when there is spare space across the axis.',
  'align-self': 'Overrides align-items for this one item.',
  'order': 'Reorders this item visually without moving it in the markup.',
  'gap': 'Space between children, without adding any around the outside.',
  'row-gap': 'Space between rows of children.',
  'column-gap': 'Space between columns of children.',

  // position
  'position': 'How the element is placed: in normal flow, offset from it, or taken out of it entirely.',
  'top': 'Distance from the top edge of the positioning context. Needs a position other than static.',
  'right': 'Distance from the right edge of the positioning context.',
  'bottom': 'Distance from the bottom edge of the positioning context.',
  'left': 'Distance from the left edge of the positioning context.',
  'z-index': 'Stacking order among overlapping positioned elements. Higher sits in front.',
  'overflow': 'What happens to content too big for the box: show it, clip it, or scroll it.',

  // grid
  'grid-template-columns': 'Number and size of the columns in a grid.',
  'grid-template-rows': 'Number and size of the rows in a grid.',
  'grid-column': 'Which column track this item starts and ends on.',
  'grid-row': 'Which row track this item starts and ends on.',
  'grid-area': 'Which named region of the grid this item occupies.',

  // lists
  'list-style': 'Marker type, position and image for a list in one declaration.',
  'list-style-type': 'Shape of the list marker: disc, decimal, none.',
};

/** The explanation for a property, or '' when there is none. */
export const helpFor = (prop) => PROPERTY_HELP[prop] || '';
