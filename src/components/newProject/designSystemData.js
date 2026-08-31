// Curated content for the from-scratch flow, plus the rule-based suggestion lookup.
//
// There is no AI or backend here: suggestions are a deterministic industry -> base,
// vibe -> override merge, so the same answers always produce the same starting point.
// That is what lets the UI label a card "Suggested for X · Y" honestly.

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
];

export const paletteById = (id) => PALETTES.find(p => p.id === id) || null;
export const pairingById = (id) => FONT_PAIRINGS.find(f => f.id === id) || null;
export const industryName = (id) => INDUSTRIES.find(i => i.id === id)?.name || '';

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
export function tokensFromChoices(palette, pairing) {
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
  return tokens;
}

/**
 * addProject stores tokens in the category-keyed shape that migrateTokensToLayers expects,
 * not a flat array — so build that shape directly here.
 */
export function tokenMapFromChoices(palette, pairing) {
  const map = {
    Color: [], Typography: [], Spacing: [], Sizing: [], Layout: [],
    Flexbox: [], Lists: [], Border: [], Shadow: [], Motion: [],
  };
  for (const t of tokensFromChoices(palette, pairing)) {
    if (t.type === 'color') map.Color.push(t);
    else if (t.type === 'fontFamily') map.Typography.push(t);
  }
  return map;
}
