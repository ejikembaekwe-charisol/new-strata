// Ready-made starting points for the from-scratch wizard.
//
// A template is NOT a token dump. It is a set of answers to the questions the wizard
// already asks — industry, vibe, palette, type pairing, type scale, voice — which then
// expand through tokensFromChoices and deriveTokens exactly as a hand-answered run does.
// That is the only way a template and a manual run can never disagree about what a design
// system is, and it is why there is no per-template token file to keep in sync.
//
// What each one actually delivers: 3 colour tokens, from which addColorRamps derives 33
// ramp steps; 2 font-family tokens; and 8 font-size tokens from its scale, which in turn
// unlock the leading, weight and text-style derivations.
//
// Colours are free to invent. Type is not — `pairingId` must name a FONT_PAIRINGS entry,
// and every family in those is loaded in index.html. A pairing naming an unloaded face
// would render in a system fallback and the card would be lying about the template's type.

import { INDUSTRIES, VIBES, CUSTOM_ID, pairingById, industryName } from './designSystemData.js';

/**
 * @typedef {object} Template
 * @property {string} id
 * @property {string} name
 * @property {string} description  one line on what it is for
 * @property {'free'|'pro'} tier
 * @property {string} industry     an INDUSTRIES id — never 'other', see below
 * @property {string} vibe         a VIBES string
 * @property {{name:string,primary:string,secondary:string,accent:string}} palette
 *           `secondary` is the system's canvas colour, which is what the card paints its
 *           preview surface with — the same reading the four built-in PALETTES follow.
 * @property {string} pairingId    a FONT_PAIRINGS id
 * @property {string} baseSize     the scale's base, e.g. '1rem'
 * @property {number} scaleRatio   1.125 compact · 1.25 balanced · 1.333 dramatic
 * @property {string[]} voiceTags  always includes `vibe`
 * @property {string[]} [tags]     extra search words, never rendered
 */

// `industry` is never 'other' on purpose. industryLabel() returns '' for it when
// customIndustry is empty, so Review would show an em dash and the Basics step would
// surface a required text field nobody asked for.
export const TEMPLATES = [
  // ── Interpretations of well-known product surfaces ──────────────────────
  //
  // Named plainly, and described as interpretations because that is what they are: palettes
  // approximated from publicly visible brand colours, not those companies' design tokens,
  // which we do not have and could not honestly claim to ship. None of these is affiliated
  // with the company it is named after, which is why every description still says so — the
  // plainer the name and the more real the logo beside it, the more that line earns its
  // place.
  //
  // Typefaces are the harder honesty problem. Sohne, SF Pro, Geist and Inter Display are
  // not families this app loads, and a template naming an unloaded family makes its own
  // specimen fall back to something else — the card would then be lying about the one
  // thing it is showing you. So each maps to the closest family that IS loaded, and each
  // description says which substitution was made.
  {
    id: 'stripe', name: 'Stripe', tier: 'free',
    description: "An interpretation of Stripe's design language, not affiliated with Stripe. Indigo over deep navy — what a payments brand reaches for when it needs to look safe. Manrope and Inter stand in for Sohne, which this app does not load.",
    industry: 'finance', vibe: 'Professional',
    palette: { name: 'Stripe', primary: '#635BFF', secondary: '#0A2540', accent: '#00D4FF' },
    pairingId: 'manrope-inter', baseSize: '1rem', scaleRatio: 1.25,
    voiceTags: ['Professional', 'Technical'],
    tags: ['stripe', 'payments', 'fintech', 'indigo', 'popular'],
  },
  {
    id: 'linear', name: 'Linear', tier: 'free',
    description: "An interpretation of Linear's design language, not affiliated with Linear. A violet-blue on near-black, sized for dense product surfaces. Sora and IBM Plex Sans stand in for Inter Display.",
    industry: 'saas', vibe: 'Minimal',
    palette: { name: 'Linear', primary: '#5E6AD2', secondary: '#08090A', accent: '#A8B1FF' },
    pairingId: 'sora-plex', baseSize: '0.9375rem', scaleRatio: 1.125,
    voiceTags: ['Minimal', 'Technical'],
    tags: ['linear', 'issue tracker', 'dark', 'dense', 'popular'],
  },
  {
    id: 'github', name: 'GitHub', tier: 'free',
    description: "An interpretation of GitHub's dark mode, not affiliated with GitHub. The canonical near-black canvas with the blue and green it signals with. JetBrains Mono and Inter, which is close to what a code host actually ships.",
    industry: 'saas', vibe: 'Technical',
    palette: { name: 'GitHub', primary: '#2F81F7', secondary: '#0D1117', accent: '#3FB950' },
    pairingId: 'mono-inter', baseSize: '0.9375rem', scaleRatio: 1.125,
    voiceTags: ['Technical', 'Professional'],
    tags: ['github', 'developer', 'code', 'dark', 'popular'],
  },
  {
    id: 'vercel', name: 'Vercel', tier: 'free',
    description: "An interpretation of Vercel's design language, not affiliated with Vercel. Pure black, one electric blue and a gradient purple — a developer platform with the contrast turned all the way up. Space Grotesk and Inter stand in for Geist.",
    industry: 'saas', vibe: 'Bold',
    palette: { name: 'Vercel', primary: '#0070F3', secondary: '#000000', accent: '#7928CA' },
    pairingId: 'space-inter', baseSize: '1rem', scaleRatio: 1.333,
    voiceTags: ['Bold', 'Technical'],
    tags: ['vercel', 'developer', 'platform', 'black', 'popular'],
  },
  {
    id: 'figma', name: 'Figma', tier: 'free',
    description: "An interpretation of Figma's design language, not affiliated with Figma. The multicolour toolkit palette on a neutral canvas. Outfit and Inter, rounded the way its interface is.",
    industry: 'creative', vibe: 'Playful',
    palette: { name: 'Figma', primary: '#A259FF', secondary: '#1E1E1E', accent: '#0ACF83' },
    pairingId: 'outfit-inter', baseSize: '1rem', scaleRatio: 1.25,
    voiceTags: ['Playful', 'Bold'],
    tags: ['figma', 'design tool', 'colourful', 'popular'],
  },
  {
    id: 'framer', name: 'Framer', tier: 'free',
    description: "An interpretation of Framer's design language, not affiliated with Framer. One saturated blue on near-black, the page treated like a working artboard. Space Grotesk and Inter.",
    industry: 'creative', vibe: 'Bold',
    palette: { name: 'Framer', primary: '#0055FF', secondary: '#111111', accent: '#00CCFF' },
    pairingId: 'space-inter', baseSize: '1rem', scaleRatio: 1.333,
    voiceTags: ['Bold', 'Minimal'],
    tags: ['framer', 'builder', 'site', 'blue', 'popular'],
  },
  {
    id: 'apple', name: 'Apple', tier: 'free',
    description: "An interpretation of Apple's design language, not affiliated with Apple. System blue over graphite, with the restraint of a product page. Manrope and Inter stand in for SF Pro, which this app does not load.",
    industry: 'fashion', vibe: 'Minimal',
    palette: { name: 'Apple', primary: '#0071E3', secondary: '#1D1D1F', accent: '#64D2FF' },
    pairingId: 'manrope-inter', baseSize: '1.0625rem', scaleRatio: 1.25,
    voiceTags: ['Minimal', 'Professional'],
    tags: ['apple', 'product', 'retail', 'graphite', 'popular'],
  },
  {
    id: 'claude', name: 'Claude', tier: 'free',
    description: "An interpretation of Claude's design language, not affiliated with Anthropic. Terracotta on warm cream — an editorial canvas rather than a dark product shell. Fraunces and Inter.",
    industry: 'saas', vibe: 'Warm',
    palette: { name: 'Claude', primary: '#D97757', secondary: '#FAF9F5', accent: '#7D8471' },
    pairingId: 'fraunces-inter', baseSize: '1.0625rem', scaleRatio: 1.2,
    voiceTags: ['Warm', 'Friendly'],
    tags: ['claude', 'anthropic', 'warm', 'cream', 'editorial', 'popular'],
  },

  // ── The original set ────────────────────────────────────────────────────
  {
    id: 'orbit', name: 'Orbit', tier: 'free',
    description: 'A calm product blue for dashboards and developer tools.',
    industry: 'saas', vibe: 'Technical',
    palette: { name: 'Orbit', primary: '#2F6BFF', secondary: '#0B1020', accent: '#4FD1C5' },
    pairingId: 'space-inter', baseSize: '1rem', scaleRatio: 1.25,
    voiceTags: ['Technical', 'Professional'], tags: ['dashboard', 'developer', 'dark'],
  },
  {
    id: 'ledger', name: 'Ledger', tier: 'free',
    description: 'Restrained navy on paper white, for things that must look safe.',
    industry: 'finance', vibe: 'Professional',
    palette: { name: 'Ledger', primary: '#1F3A5F', secondary: '#F7F8FA', accent: '#16A34A' },
    pairingId: 'manrope-inter', baseSize: '0.9375rem', scaleRatio: 1.125,
    voiceTags: ['Professional'], tags: ['banking', 'light', 'compact'],
  },
  {
    id: 'broadsheet', name: 'Broadsheet', tier: 'free',
    description: 'Editorial serif and a wide scale, for writing that carries the page.',
    industry: 'creative', vibe: 'Luxurious',
    palette: { name: 'Broadsheet', primary: '#111111', secondary: '#FBF8F1', accent: '#C2410C' },
    pairingId: 'dmserif-plex', baseSize: '1.0625rem', scaleRatio: 1.333,
    voiceTags: ['Luxurious', 'Minimal'], tags: ['editorial', 'magazine', 'serif', 'light'],
  },
  {
    id: 'terrace', name: 'Terrace', tier: 'free',
    description: 'Warm terracotta and a friendly face, for menus and marketplaces.',
    industry: 'food', vibe: 'Warm',
    palette: { name: 'Terrace', primary: '#C2410C', secondary: '#1A1210', accent: '#F2C14E' },
    pairingId: 'fraunces-inter', baseSize: '1rem', scaleRatio: 1.25,
    voiceTags: ['Warm', 'Friendly'], tags: ['restaurant', 'hospitality'],
  },
  {
    id: 'clinic', name: 'Clinic', tier: 'free',
    description: 'Clear greens on a soft surface, for care that should feel unhurried.',
    industry: 'health', vibe: 'Friendly',
    palette: { name: 'Clinic', primary: '#0E9F6E', secondary: '#F5FAF7', accent: '#3B82F6' },
    pairingId: 'manrope-inter', baseSize: '1rem', scaleRatio: 1.2,
    voiceTags: ['Friendly', 'Professional'], tags: ['medical', 'wellness', 'light'],
  },
  {
    id: 'atelier', name: 'Atelier', tier: 'free',
    description: 'Ink on white with a brass accent, and room to breathe.',
    industry: 'fashion', vibe: 'Minimal',
    palette: { name: 'Atelier', primary: '#0A0A0A', secondary: '#FFFFFF', accent: '#B08D57' },
    pairingId: 'playfair-manrope', baseSize: '1rem', scaleRatio: 1.333,
    voiceTags: ['Minimal', 'Luxurious'], tags: ['retail', 'monochrome', 'light'],
  },
  {
    id: 'chalk', name: 'Chalk', tier: 'free',
    description: 'Violet and amber with rounded type, for learning that should feel light.',
    industry: 'education', vibe: 'Playful',
    palette: { name: 'Chalk', primary: '#7C3AED', secondary: '#131022', accent: '#FBBF24' },
    pairingId: 'outfit-inter', baseSize: '1rem', scaleRatio: 1.2,
    voiceTags: ['Playful', 'Friendly'], tags: ['learning', 'school', 'courses'],
  },
  {
    id: 'signal', name: 'Signal', tier: 'free',
    description: 'One loud orange, a mono heading, and a tight scale.',
    industry: 'saas', vibe: 'Bold',
    palette: { name: 'Signal', primary: '#FF4D00', secondary: '#0D0D0F', accent: '#22D3EE' },
    pairingId: 'mono-inter', baseSize: '0.9375rem', scaleRatio: 1.125,
    voiceTags: ['Bold', 'Technical'], tags: ['startup', 'dark', 'mono'],
  },
  {
    id: 'kiosk', name: 'Kiosk', tier: 'free',
    description: 'Hot pink on near-black with a dramatic scale, for storefronts.',
    industry: 'fashion', vibe: 'Bold',
    palette: { name: 'Kiosk', primary: '#E11D48', secondary: '#14090D', accent: '#FDE68A' },
    pairingId: 'sora-plex', baseSize: '1rem', scaleRatio: 1.333,
    voiceTags: ['Bold', 'Playful'], tags: ['ecommerce', 'shop', 'dark'],
  },
  {
    id: 'vault', name: 'Vault', tier: 'pro',
    description: 'Deep teal and gold with a serif heading, for private-bank restraint.',
    industry: 'finance', vibe: 'Luxurious',
    palette: { name: 'Vault', primary: '#0F766E', secondary: '#0A1614', accent: '#D4AF37' },
    pairingId: 'playfair-source', baseSize: '1.0625rem', scaleRatio: 1.25,
    voiceTags: ['Luxurious', 'Professional'], tags: ['wealth', 'premium', 'dark'],
  },
  {
    id: 'studio', name: 'Studio', tier: 'pro',
    description: 'Magenta and cyan at full volume, for work that wants to be seen.',
    industry: 'creative', vibe: 'Bold',
    palette: { name: 'Studio', primary: '#DB2777', secondary: '#0C0A12', accent: '#22D3EE' },
    pairingId: 'space-inter', baseSize: '1rem', scaleRatio: 1.333,
    voiceTags: ['Bold', 'Playful'], tags: ['agency', 'portfolio', 'dark'],
  },
  {
    id: 'almanac', name: 'Almanac', tier: 'pro',
    description: 'Scholarly blue on warm paper, with a body face built for long reads.',
    industry: 'education', vibe: 'Professional',
    palette: { name: 'Almanac', primary: '#1D4ED8', secondary: '#FAF9F6', accent: '#B45309' },
    pairingId: 'dmserif-plex', baseSize: '1.0625rem', scaleRatio: 1.2,
    voiceTags: ['Professional', 'Minimal'], tags: ['university', 'research', 'light'],
  },
];

/**
 * Only the facets the collection actually contains.
 *
 * Derived rather than listed, the way SharedProject builds its category rail — so a chip
 * can never offer a filter that returns nothing, and 'other' can never appear because no
 * template carries it.
 */
export const INDUSTRY_FACETS = INDUSTRIES.filter(i => TEMPLATES.some(t => t.industry === i.id));
export const VIBE_FACETS = VIBES.filter(v => TEMPLATES.some(t => t.vibe === v));

export const FREE_COUNT = TEMPLATES.filter(t => t.tier === 'free').length;

// Built once at module load, the way CATALOG_BY_KEY is in brandContextEngine.data.js.
const HAYSTACK = new Map(TEMPLATES.map(t => [t.id, [
  t.name, t.description, industryName(t.industry), t.vibe, t.palette.name,
  pairingById(t.pairingId)?.heading, pairingById(t.pairingId)?.body,
  ...(t.tags || []),
].join(' ').toLowerCase()]));

/**
 * Whether a template matches a query.
 *
 * Words are ANDed with each other and OR-matched across the fields, so "dark saas"
 * narrows rather than widens.
 */
export const matchesQuery = (t, query) => {
  const words = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = HAYSTACK.get(t.id) || '';
  return words.every(w => hay.includes(w));
};

/**
 * A template as a patch for ScratchWizard's `data`.
 *
 * Every key the wizard's seeding effects read is supplied deliberately: ScratchWizard
 * reads `data.customPalette.primary` without optional chaining, both in the effect and in
 * its dependency array, so an absent customPalette would throw. And every value here is
 * truthy, which is precisely what makes those seed-only-while-unset effects leave it
 * alone — a pre-filled template is indistinguishable from a manual choice, so it survives
 * a Back for free.
 *
 * The palette rides as CUSTOM_ID plus customPalette rather than by extending PALETTES to
 * twelve. resolvePalette spreads customPalette after `name: 'Custom'`, so carrying `name`
 * is what makes the Review row read "Orbit" instead of "Custom" — and it lands the three
 * colours in the wizard's own colour pickers, where a hex can be nudged.
 */
export const seedFromTemplate = (t) => ({
  industry: t.industry,
  primaryVibe: t.vibe,
  customIndustry: '',
  paletteId: CUSTOM_ID,
  customPalette: {
    name: t.palette.name,
    primary: t.palette.primary,
    secondary: t.palette.secondary,
    accent: t.palette.accent,
  },
  fontPairingId: t.pairingId,
  customPairing: {},
  voiceTags: [...t.voiceTags],
  logoMode: 'generate',
  logoDataUrl: null,
  scale: { base: t.baseSize, ratio: t.scaleRatio },
  // Provenance only. Nothing reads it for behaviour.
  templateId: t.id,
});

/** How the scale reads on a card: the ratio, in words. */
export const scaleLabel = (ratio) => {
  if (ratio <= 1.15) return 'Compact scale';
  if (ratio <= 1.27) return 'Balanced scale';
  return 'Dramatic scale';
};
