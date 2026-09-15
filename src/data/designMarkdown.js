// The whole design system as one Markdown file.
//
// Moved out of SharedProject so the public page and Dev mode emit the same document — two
// builders would eventually disagree about what a design system is, and this file is meant to
// be handed straight to a person or an AI tool, which makes a discrepancy expensive.
//
// Components used to appear here as `- **Name** — description` and nothing more, which is the
// one thing a developer cannot act on. They now carry their mapped tokens and their generated
// rule, so the file describes the system rather than listing its parts.
//
// Nothing here invents a value. The brand section prints only fields the project actually
// holds, and a system with no tokens or no components simply has no such section rather than
// an empty heading.

import { componentCss } from './componentExport';
import { indexById, effectiveTokens } from '../components/inspector/inheritance';
import { cssPropForTokenKey } from './tokenKeys';

/** Every token in the store, flat, each carrying the category it came from. */
const flatten = (tokensMap) => {
  const out = [];
  for (const cat in tokensMap || {}) {
    if (!Array.isArray(tokensMap[cat])) continue;
    for (const t of tokensMap[cat]) if (t && t.name) out.push({ ...t, category: cat });
  }
  return out;
};

/**
 * @param project  the project, for name / description / components
 * @param tokensMap  the derived token store
 */
export const designMarkdown = (project, tokensMap) => {
  const p = project || {};
  const brand = p.brand || {};
  const tokens = flatten(tokensMap);
  const components = Array.isArray(p.components) ? p.components : [];
  const byId = indexById(components);
  const lines = [];

  lines.push('# ' + (p.name || 'Design system'));
  if (p.description) lines.push('\n' + p.description);

  // Only what the project defines. The old version printed #FC0694 and Outfit as fallbacks,
  // which meant a system that had never set a brand colour still claimed one.
  const brandRows = [
    ['Primary', brand.primaryColor || p.color],
    ['Secondary', brand.secondaryColor],
    ['Accent', brand.accentColor],
    ['Heading font', brand.headingFont],
    ['Body font', brand.bodyFont],
    ['Tone', (brand.toneKeywords || []).join(', ')],
    ['Voice', brand.voice],
  ].filter(([, v]) => v);
  if (brandRows.length) {
    lines.push('\n## Brand');
    for (const [label, value] of brandRows) {
      const mono = /colour|color|font$/i.test(label) && String(value).startsWith('#');
      lines.push('- ' + label + ': ' + (mono ? '`' + value + '`' : value));
    }
  }

  if (tokens.length) {
    lines.push('\n## Tokens (' + tokens.length + ')');
    const byCategory = {};
    tokens.forEach(t => { (byCategory[t.category] = byCategory[t.category] || []).push(t); });
    for (const cat of Object.keys(byCategory)) {
      lines.push('\n### ' + cat);
      lines.push('| Name | Value | Type | Layer |');
      lines.push('|---|---|---|---|');
      for (const t of byCategory[cat]) {
        lines.push('| `' + t.name + '` | `' + t.value + '` | ' + (t.type || '') + ' | '
          + (t.layer || t.tier || '') + ' |');
      }
    }
  }

  if (components.length) {
    lines.push('\n## Components (' + components.length + ')');
    for (const c of components) {
      lines.push('\n### ' + (c.name || 'Component'));
      if (c.description) lines.push('\n' + c.description);

      const meta = [c.template && 'Template: `' + c.template + '`',
        c.extends && byId[c.extends] && 'Extends: ' + byId[c.extends].name]
        .filter(Boolean);
      if (meta.length) lines.push('\n' + meta.join(' · '));

      // Mapped tokens, inheritance resolved, so the table matches what the rule emits.
      const mapped = effectiveTokens(c, byId);
      const rows = Object.entries(mapped).filter(([, v]) => v);
      if (rows.length) {
        lines.push('\n| Property | Token |');
        lines.push('|---|---|');
        for (const [key, value] of rows) {
          lines.push('| `' + cssPropForTokenKey(key) + '` | `' + value + '` |');
        }
      }

      // A fragment groups other components and has no element, so it has no rule either.
      if (c.template !== 'fragment') {
        lines.push('\n```css');
        lines.push(componentCss(c, byId));
        lines.push('```');
      }
    }
  }

  return lines.join('\n') + '\n';
};

/** A filename stem for the download, e.g. "Acme Corp" -> "acme-corp". */
export const markdownSlug = (name) =>
  String(name || 'design-system').toLowerCase().replace(/\s+/g, '-');
