// How much brand context has the user actually supplied?
//
// The six items mirror live's Brand Context Engine: the five sources on Step 1 plus the
// component selection on Step 4. Steps 2, 3 and 5 are review screens and take no input,
// so they are not counted.
//
// Every test reads persisted `project.brandContext`. It deliberately never reads
// ProjectDetail's `brandData` state, which fills in invented defaults (#FC0694 / Outfit)
// the moment a project loads — reading that would report items the user never supplied.

export const SOURCE_KEYS = ['description', 'images', 'figma', 'website', 'styleDictionary', 'components'];

export const BRAND_ITEMS = [
  { key: 'description', label: 'Brand Description', hint: 'Describe your brand identity' },
  { key: 'images', label: 'Brand Images', hint: 'Upload logos, mockups or brand assets' },
  { key: 'figma', label: 'Figma Link', hint: 'File URL and access token are both required' },
  { key: 'website', label: 'Brand Website', hint: 'Link your brand website' },
  { key: 'styleDictionary', label: 'Style Dictionary', hint: 'Import a token JSON file' },
  { key: 'components', label: 'Components', hint: 'Choose which components to generate' },
];

import { hasSessionToken } from './figmaTokens';

const filled = (v) => typeof v === 'string' ? v.trim().length > 0 : Boolean(v);

export function emptyBrandContext() {
  return {
    description: { text: '', goals: [], primaryColor: '', extraction: null },
    images: { items: [], extraction: null },
    figma: { fileUrl: '', tokenRef: '', tokenHint: '', extraction: null },
    website: { url: '', extraction: null },
    styleDictionary: { fileName: '', content: '', extraction: null },
    components: { selected: {} },
  };
}

const isDone = (key, bc, projectId) => {
  switch (key) {
    case 'description': return filled(bc?.description?.text);
    case 'images': return (bc?.images?.items || []).length > 0;
    // Live marks both the file URL and the access token with a required asterisk. The token
    // half is satisfied three ways: `tokenRef` (saved in the cross-project vault), `token`
    // (legacy plaintext copy older projects still carry), or an unsaved token held in
    // sessionStorage for this tab.
    //
    // That last clause makes this NOT a pure function of `project` — it reads sessionStorage
    // too. That is deliberate: persisting a "user chose not to save" marker in the project
    // would keep reporting Configured after the tab closed and the secret was gone. Reading
    // the session directly means Figma stops counting exactly when the token stops existing.
    case 'figma': return filled(bc?.figma?.fileUrl)
      && (filled(bc?.figma?.tokenRef) || filled(bc?.figma?.token) || hasSessionToken(projectId));
    case 'website': return filled(bc?.website?.url);
    case 'styleDictionary': return filled(bc?.styleDictionary?.content);
    case 'components': return Object.keys(bc?.components?.selected || {}).length > 0;
    default: return false;
  }
};

const clip = (s, n = 48) => {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

/** A short, real description of what the user provided — never a placeholder. */
const summaryOf = (key, bc, projectId) => {
  switch (key) {
    case 'description': return clip(bc?.description?.text);
    case 'images': {
      const n = (bc?.images?.items || []).length;
      return n ? n + (n === 1 ? ' image' : ' images') : '';
    }
    case 'figma': return clip(bc?.figma?.fileUrl, 40);
    case 'website': return clip(bc?.website?.url, 40);
    case 'styleDictionary': return clip(bc?.styleDictionary?.fileName || 'Token JSON imported', 40);
    case 'components': {
      const sel = bc?.components?.selected || {};
      const keys = Object.keys(sel);
      if (!keys.length) return '';
      const variants = keys.reduce((n, k) => n + (sel[k]?.variants || []).length, 0);
      return keys.length + (keys.length === 1 ? ' component' : ' components') + ', ' + variants + ' variants';
    }
    default: return '';
  }
};

/**
 * @returns {{ items: Array, done: number, total: number, percent: number }}
 *          `items` mirrors BRAND_ITEMS with `done` and `summary` on each.
 */
export function getBrandCompleteness(project) {
  const bc = project?.brandContext;
  const items = BRAND_ITEMS.map(item => {
    const done = isDone(item.key, bc, project?.id);
    return { ...item, done, summary: done ? summaryOf(item.key, bc, project?.id) : '' };
  });
  const done = items.filter(i => i.done).length;
  const total = items.length;
  return { items, done, total, percent: Math.round((done / total) * 100) };
}
