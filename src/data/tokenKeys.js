// How a component's style map keys its properties.
//
// A component's `tokens` object maps a CSS property to a token name. The six keys below
// predate the free-form property table, so they are still written and read as-is and
// existing saved components keep working; anything added since is stored under its real
// CSS property name.
//
// Extracted from ProjectDetail so the release diff can normalise the same way the
// inspector does. Two copies of this map would eventually disagree, and the disagreement
// would show up as a component that looks changed when nothing about it moved.

export const LEGACY_TOKEN_KEY_TO_CSS = {
  bg: 'background-color',
  textColor: 'color',
  padding: 'padding',
  borderRadius: 'border-radius',
  fontFamily: 'font-family',
  fontSize: 'font-size',
};

/** The real CSS property a stored key means. Passes a real property straight through. */
export const cssPropForTokenKey = (key) => LEGACY_TOKEN_KEY_TO_CSS[key] || key;
