// Reconciling the two spellings a token type comes in.
//
// Tokens saved before the CSS-property taxonomy use camelCase (`fontSize`, `borderRadius`);
// everything since uses the CSS property name (`font-size`, `border-radius`). Both mean the
// same type, so anything classifying a token has to compare them normalised.
//
// It lives in its own module because three places need it — the grouping rules, the type
// scale, and ProjectDetail — and putting it in any one of those would make the other two
// import in a circle.

export const normalizeTypeKey = (type) =>
  (type || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// ── Which bucket a token lives in ────────────────────────────────────────────
//
// The store is keyed by category, so anything turning a flat list of tokens into a store
// needs this. ProjectDetail has a much larger TYPE_TO_CATEGORY covering every selectable
// CSS property; this is the subset the derivation paths actually emit, and it lives here
// for the same reason normalizeTypeKey does — the alternative is importing ProjectDetail.

const CATEGORY_BY_TYPE = {
  color: 'Color',
  'font-family': 'Typography', 'font-size': 'Typography', 'font-weight': 'Typography',
  'line-height': 'Typography', 'letter-spacing': 'Typography',
  spacing: 'Spacing',
  'border-radius': 'Border', 'border-width': 'Border',
  shadow: 'Shadow',
  duration: 'Motion', easing: 'Motion',
};

/** Colour is the fallback because it is the store's first bucket, matching ProjectDetail. */
export const categoryForType = (type) => CATEGORY_BY_TYPE[normalizeTypeKey(type)] || 'Color';

/** A flat list of tokens as a category-keyed store, the shape deriveTokens expects. */
export const storeFromList = (list) => {
  const store = {};
  for (const t of list || []) {
    const cat = categoryForType(t.type);
    (store[cat] = store[cat] || []).push(t);
  }
  return store;
};
