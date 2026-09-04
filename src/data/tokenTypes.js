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
