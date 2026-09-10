// Curated content for the from-scratch flow, plus the rule-based suggestion lookup.
//
// There is no AI or backend here: suggestions are a deterministic industry -> base,
// vibe -> override merge, so the same answers always produce the same starting point.
// That is what lets the UI label a card "Suggested for X · Y" honestly.

// Extension included so this module and templateData stay loadable by plain Node: the
// template invariants are worth asserting outside a bundler, and one of them — that no
// pairing names an unloaded font family — is a claim a card makes to the user.
import { buildScale } from '../../data/typeScale.js';

export const PALETTES = [
  { id: 'violet', name: 'Violet', primary: '#8B5CF6', secondary: '#171122', accent: '#F472B6' },
  { id: 'sunrise', name: 'Sunrise', primary: '#F97316', secondary: '#1C1410', accent: '#FBBF24' },
  { id: 'sage', name: 'Sage', primary: '#10B981', secondary: '#0F1A16', accent: '#6EE7B7' },
  { id: 'ink', name: 'Ink', primary: '#2563EB', secondary: '#0F172A', accent: '#38BDF8' },
];

// Every family here is loaded in index.html. Adding a pairing means adding the font too,
// or the specimen silently falls back to a system face.
export const FONT_PAIRINGS = [
  { id: 'space-inter', heading: 'Space Grotesk', body: 'Inter', note: 'Geometric and technical' },
  { id: 'playfair-source', heading: 'Playfair Display', body: 'Source Sans 3', note: 'Editorial and refined' },
  { id: 'manrope-inter', heading: 'Manrope', body: 'Inter', note: 'Neutral and modern' },
  { id: 'mono-inter', heading: 'JetBrains Mono', body: 'Inter', note: 'Utilitarian and precise' },
  // Added for the template gallery. Every family below is in the index.html request — a
  // pairing naming one that is not would render in a system fallback, and a gallery card
  // showing a specimen would then be lying about the template's type.
  { id: 'sora-plex', heading: 'Sora', body: 'IBM Plex Sans', note: 'Engineered and calm' },
  { id: 'dmserif-plex', heading: 'DM Serif Display', body: 'IBM Plex Sans', note: 'Stately with a plain body' },
  { id: 'fraunces-inter', heading: 'Fraunces', body: 'Inter', note: 'Characterful and warm' },
  { id: 'outfit-inter', heading: 'Outfit', body: 'Inter', note: 'Rounded and approachable' },
  { id: 'playfair-manrope', heading: 'Playfair Display', body: 'Manrope', note: 'Classic with a modern body' },
];

export const INDUSTRIES = [
  { id: 'saas', name: 'SaaS & Tech' },
  { id: 'fashion', name: 'Fashion & Retail' },
  { id: 'food', name: 'Food & Beverage' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'finance', name: 'Finance' },
  { id: 'creative', name: 'Creative & Agency' },
  { id: 'education', name: 'Education' },
  { id: 'other', name: 'Other' },
];

// Vibes double as the Voice step's tone chips, so the primary one can pre-seed that step.
export const VIBES = ['Professional', 'Playful', 'Bold', 'Minimal', 'Luxurious', 'Friendly', 'Technical', 'Warm'];

const INDUSTRY_SUGGESTIONS = {
  saas: { paletteId: 'ink', fontPairingId: 'space-inter' },
  fashion: { paletteId: 'violet', fontPairingId: 'manrope-inter' },
  food: { paletteId: 'sunrise', fontPairingId: 'manrope-inter' },
  health: { paletteId: 'sage', fontPairingId: 'manrope-inter' },
  finance: { paletteId: 'ink', fontPairingId: 'manrope-inter' },
  creative: { paletteId: 'violet', fontPairingId: 'space-inter' },
  education: { paletteId: 'sunrise', fontPairingId: 'manrope-inter' },
  other: { paletteId: 'violet', fontPairingId: 'manrope-inter' },
};

// A vibe refines the industry's starting point rather than replacing it, so only the
// keys it cares about are listed. 16 entries instead of an explicit 8x8 grid.
const VIBE_OVERRIDES = {
  Professional: { paletteId: 'ink' },
  Playful: { paletteId: 'sunrise' },
  Bold: { paletteId: 'violet' },
  Minimal: { fontPairingId: 'space-inter' },
  Luxurious: { paletteId: 'ink', fontPairingId: 'playfair-source' },
  Friendly: { paletteId: 'sunrise' },
  Technical: { fontPairingId: 'space-inter' },
  Warm: { paletteId: 'sunrise' },
};

/**
 * @returns {{ paletteId: string, fontPairingId: string } | null}
 *          null until both answers are in, so nothing is suggested on a guess.
 */
export function getSuggestion(industryId, vibe) {
  if (!industryId || !vibe) return null;
  const base = INDUSTRY_SUGGESTIONS[industryId];
  if (!base) return null;
  return { ...base, ...(VIBE_OVERRIDES[vibe] || {}) };
}

export const CUSTOM_ID = 'custom';

// Families we actually load in index.html. A custom entry can name anything, but only these
// are guaranteed to render rather than falling back to a system face.
export const KNOWN_FAMILIES = [
  'Inter', 'Outfit', 'Space Grotesk', 'Playfair Display', 'Source Sans 3',
  'Manrope', 'JetBrains Mono', 'Georgia',
  'Sora', 'DM Serif Display', 'Fraunces', 'IBM Plex Sans',
];

export const paletteById = (id) => PALETTES.find(p => p.id === id) || null;
export const pairingById = (id) => FONT_PAIRINGS.find(f => f.id === id) || null;
export const industryName = (id) => INDUSTRIES.find(i => i.id === id)?.name || '';

// The base sizes offered as a choice, which is what they are. 16px is the browser
// default and sits in the middle deliberately.
export const BASE_SIZES = [
  { id: '0.9375rem', label: '15px' },
  { id: '1rem', label: '16px' },
  { id: '1.0625rem', label: '17px' },
];

// A real default rather than nothing. With no scale, tokensFromChoices emitted no size
// tokens, so addTypeScale bailed at fewer than two entries and addTextStyles never ran
// either — a from-scratch run shipped two typefaces and no sizes at all.
export const DEFAULT_SCALE = { base: '1rem', ratio: 1.25 };

/** The scale in play, whether a template set it or the Typography step did. */
export const resolveScale = (data) => ({ ...DEFAULT_SCALE, ...((data && data.scale) || {}) });

export const baseSizeLabel = (base) =>
  (BASE_SIZES.find(b => b.id === base) || {}).label || base;

/** The palette in play, whether curated or hand-picked. */
export const resolvePalette = (data) =>
  data.paletteId === CUSTOM_ID
    ? { id: CUSTOM_ID, name: 'Custom', ...data.customPalette }
    : paletteById(data.paletteId);

/** The pairing in play, whether curated or hand-typed. */
export const resolvePairing = (data) => {
  if (data.pairingIsCustom || data.fontPairingId === CUSTOM_ID) {
    const c = data.customPairing || {};
    if (!c.heading && !c.body) return null;
    return { id: CUSTOM_ID, heading: c.heading || c.body, body: c.body || c.heading, note: 'Your own' };
  }
  return pairingById(data.fontPairingId);
};

/** What to call the industry: the typed one when "Other" was chosen. */
export const industryLabel = (data) =>
  (data.industry === 'other' && data.customIndustry?.trim()) || industryName(data.industry);

/** Brand-tier tokens for the chosen palette and pairing, in the app's token shape. */
export function tokensFromChoices(palette, pairing, scale) {
  const tokens = [];
  if (palette) {
    tokens.push({ name: 'brand.color.primary', value: palette.primary, type: 'color', layer: 'Brand', description: 'Chosen in setup' });
    tokens.push({ name: 'brand.color.secondary', value: palette.secondary, type: 'color', layer: 'Brand', description: 'Chosen in setup' });
    tokens.push({ name: 'brand.color.accent', value: palette.accent, type: 'color', layer: 'Brand', description: 'Chosen in setup' });
  }
  if (pairing) {
    tokens.push({ name: 'brand.font.heading', value: pairing.heading, type: 'fontFamily', layer: 'Brand', description: 'Chosen in setup' });
    tokens.push({ name: 'brand.font.body', value: pairing.body, type: 'fontFamily', layer: 'Brand', description: 'Chosen in setup' });
  }
  // A scale is what turns typefaces into typography. Without it this path emitted font
  // families and no sizes at all, which meant addTypeScale bailed for want of two
  // font-size tokens and addTextStyles never fired either — so a system built from
  // scratch had faces but no type scale and no text styles.
  //
  // buildScale is the same builder the Type Scale dialog uses, so a scale created here
  // and one created there are identical.
  if (scale && scale.base && scale.ratio) {
    tokens.push(...buildScale(scale.base, scale.ratio));
  }
  return tokens;
}
