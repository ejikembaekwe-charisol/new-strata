// Static data + pure helpers for the Brand Context Engine.
// Kept out of the component file so the merge/build logic stays testable.

// Three stages. The old five screens are regrouped, not cut: the two review screens fold into
// Review, and the generation preview folds into Generate alongside the component picker.
export const STEPS = [
  { n: 1, label: 'Brand Context', sub: 'Provide brand context from briefs, images, Figma, website, or JSON files.' },
  { n: 2, label: 'Review', sub: 'Check what was extracted, choose which source wins, and see the merged result.' },
  { n: 3, label: 'Generate', sub: 'Choose components, then preview the tokens and structures before applying.' },
];

export const SOURCE_META = {
  description: { title: 'Brand Description', desc: 'Describe your brand identity — we will extract colors, typography, and mood.', tint: '#8B5CF6' },
  images: { title: 'Brand Images', desc: 'Upload logos, mockups, or brand assets to extract color palettes.', tint: '#EC4899' },
  figma: { title: 'Figma Link', desc: 'Link your Figma file to extract variables and styles.', tint: '#A855F7' },
  website: { title: 'Brand Website', desc: 'Link your brand website to scrape colors and typography.', tint: '#3B82F6' },
  styleDictionary: { title: 'Style Dictionary', desc: 'Import token JSON files.', tint: '#10B981' },
};

// Step 1 render order — Figma and Website lead.
export const SOURCE_ORDER = ['figma', 'website', 'styleDictionary', 'description', 'images'];

// Default conflict-resolution order for merging extractions — deliberately NOT the display
// order. Figma and Website extraction is simulated, so it must not outrank the sources that
// do real parsing by default. Step 3 lets the user reorder this freely.
export const DEFAULT_PRIORITY = ['description', 'images', 'styleDictionary', 'figma', 'website'];

export const GOAL_PRESETS = [
  'Increase brand trust',
  'Feel more premium',
  'Appeal to a younger audience',
  'Simplify the visual language',
  'Improve accessibility',
  'Stand out from competitors',
];

export const TONE_OPTIONS = ['Bold', 'Minimal', 'Playful', 'Corporate', 'Friendly', 'Technical', 'Luxury', 'Warm', 'Energetic', 'Calm'];

export const COMPONENT_CATEGORIES = ['All Components', 'Inputs & Forms', 'Data Display', 'Feedback & Overlays', 'Navigation & Layout'];

// `template` is what our preview renderer can actually draw (button | input | card | badge |
// image — see ProjectDetail's component preview). `exact` marks the four that map one-to-one;
// the rest are approximated with the nearest template and labelled as such in the picker.
export const COMPONENT_CATALOG = [
  { key: 'button', name: 'Button', tag: 'inputs', category: 'Inputs & Forms', template: 'button', appCategory: 'Actions & Buttons', desc: 'Interactive button trigger for user actions', variants: ['primary', 'secondary', 'outline'], states: true, exact: true },
  { key: 'input', name: 'Input', tag: 'inputs', category: 'Inputs & Forms', template: 'input', appCategory: 'Form Inputs', desc: 'Text input fields for forms and user data collection', variants: ['default', 'filled'], states: true, exact: true },
  { key: 'card', name: 'Card', tag: 'layout', category: 'Navigation & Layout', template: 'card', appCategory: 'Display & Data', desc: 'Container for grouping related content and actions', variants: ['default', 'elevated'], states: false, exact: true },
  { key: 'badge', name: 'Badge', tag: 'data-display', category: 'Data Display', template: 'badge', appCategory: 'Feedback & Status', desc: 'Compact status or tag indicators', variants: ['default', 'success', 'warning', 'danger'], states: false, exact: true },
  { key: 'avatar', name: 'Avatar', tag: 'data-display', category: 'Data Display', template: 'image', appCategory: 'Display & Data', desc: 'Visual representation of a user or entity', variants: ['default'], states: false, exact: false },
  { key: 'alert', name: 'Alert', tag: 'feedback', category: 'Feedback & Overlays', template: 'card', appCategory: 'Feedback & Status', desc: 'Contextual feedback messages for user actions', variants: ['info', 'error'], states: false, exact: false },
  { key: 'modal', name: 'Modal', tag: 'feedback', category: 'Feedback & Overlays', template: 'card', appCategory: 'Display & Data', desc: 'Overlay window for focused user tasks or notifications', variants: ['default'], states: false, exact: false },
  { key: 'toggle', name: 'Toggle Switch', tag: 'inputs', category: 'Inputs & Forms', template: 'input', appCategory: 'Form Inputs', desc: 'Binary switch control for setting state on/off', variants: ['default'], states: true, exact: false },
  { key: 'select', name: 'Select Dropdown', tag: 'inputs', category: 'Inputs & Forms', template: 'input', appCategory: 'Form Inputs', desc: 'Dropdown selector for single or multiple options', variants: ['default'], states: true, exact: false },
  { key: 'tooltip', name: 'Tooltip', tag: 'feedback', category: 'Feedback & Overlays', template: 'badge', appCategory: 'Feedback & Status', desc: 'Brief contextual popover helper text', variants: ['default'], states: false, exact: false },
  { key: 'tabs', name: 'Tabs', tag: 'navigation', category: 'Navigation & Layout', template: 'card', appCategory: 'Display & Data', desc: 'Navigational tab bar for switching views', variants: ['default'], states: false, exact: false },
  { key: 'table', name: 'Table', tag: 'data-display', category: 'Data Display', template: 'card', appCategory: 'Display & Data', desc: 'Data grid for displaying structured rows and columns', variants: ['default'], states: false, exact: false },
];

export const CATALOG_BY_KEY = COMPONENT_CATALOG.reduce((m, c) => { m[c.key] = c; return m; }, {});

// ---------------------------------------------------------------------------

/** Normalise any of the three real parsers into one extraction record. */
export function toExtraction(parsed, { simulated = false, note = '' } = {}) {
  const colors = [parsed?.primaryColor, parsed?.secondaryColor, parsed?.accentColor].filter(Boolean);
  return {
    colors,
    headingFont: parsed?.headingFont || null,
    bodyFont: parsed?.bodyFont || null,
    tone: parsed?.toneKeywords || [],
    simulated,
    note,
  };
}

/**
 * Website and Figma extraction is SIMULATED — no network request is made. Values are
 * derived deterministically from the input string so they stay stable between runs, and
 * every record is flagged `simulated: true` so a later pass can find them.
 */
export function simulateExtraction(seed, kind) {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;

  const hex = (hue, s, l) => {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + hue / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return ('#' + f(0) + f(8) + f(4)).toUpperCase();
  };

  const fonts = ['Inter', 'Roboto', 'DM Sans', 'Manrope', 'Poppins', 'Figtree'];
  return {
    colors: [hex(h, 0.72, 0.55), hex((h + 150) % 360, 0.6, 0.45), hex((h + 40) % 360, 0.9, 0.55)],
    headingFont: fonts[h % fonts.length],
    bodyFont: fonts[(h + 2) % fonts.length],
    tone: [],
    simulated: true,
    note: kind === 'figma'
      ? 'Simulated result. The access token is stored but never sent to Figma.'
      : 'Simulated result. No request is made to the site.',
  };
}

/** First non-empty value wins, walking `order` top-down. */
export function mergeExtractions(brandContext, order) {
  const out = { colors: [], headingFont: null, bodyFont: null, tone: [] };
  for (const key of order) {
    const ex = brandContext?.[key]?.extraction;
    if (!ex) continue;
    for (const c of ex.colors || []) {
      if (out.colors.length < 3 && !out.colors.includes(c)) out.colors.push(c);
    }
    if (!out.headingFont && ex.headingFont) out.headingFont = ex.headingFont;
    if (!out.bodyFont && ex.bodyFont) out.bodyFont = ex.bodyFont;
    for (const t of ex.tone || []) if (!out.tone.includes(t)) out.tone.push(t);
  }
  return out;
}

/** Which sources have an extraction, in display order (Step 2 renders in this order). */
export function extractedKeys(brandContext) {
  return SOURCE_ORDER.filter(k => brandContext?.[k]?.extraction);
}

/** Brand-layer tokens for the merged configuration. Types match getCategoryForType. */
export function buildTokens(merged) {
  const tokens = [];
  const names = ['brand.color.primary', 'brand.color.secondary', 'brand.color.accent'];
  (merged.colors || []).forEach((value, i) => {
    if (!names[i]) return;
    tokens.push({ name: names[i], value, type: 'color', layer: 'Brand', description: 'From brand context' });
  });
  if (merged.headingFont) tokens.push({ name: 'brand.font.heading', value: merged.headingFont, type: 'fontFamily', layer: 'Brand', description: 'From brand context' });
  if (merged.bodyFont) tokens.push({ name: 'brand.font.body', value: merged.bodyFont, type: 'fontFamily', layer: 'Brand', description: 'From brand context' });
  return tokens;
}

/** One component record per selected variant, using the nearest renderable template. */
export function buildComponents(selected) {
  const out = [];
  for (const [key, cfg] of Object.entries(selected || {})) {
    const meta = CATALOG_BY_KEY[key];
    if (!meta) continue;
    (cfg.variants || []).forEach((variantName) => {
      const clean = String(variantName || '').trim();
      if (!clean) return;
      const label = clean.charAt(0).toUpperCase() + clean.slice(1);
      out.push({
        name: meta.name.replace(/\s+/g, '') + label,
        category: meta.appCategory,
        template: meta.template,
        description: meta.name + ' — ' + clean + ' variant',
        tokens: {
          bg: 'brand.color.primary',
          textColor: 'brand.color.secondary',
          borderRadius: 'brand.color.accent',
        },
        variant: clean,
        includeStates: !!cfg.includeStates,
        approximated: !meta.exact,
      });
    });
  }
  return out;
}
