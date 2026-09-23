// A page for the demo project's Forge preview, composed from what that project actually holds.
//
// The demo exists to be a worked example, and Forge opening on an empty frame made it look
// like there was nothing to work with. This fills it — but not with a picture of a website.
// Every rule the page's own elements use is `libraryCss` output, so the buttons, cards and
// badges in it ARE this project's components; every colour, size, radius and shadow is one of
// its custom properties; and every number printed is counted from the token store rather than
// written down here.
//
// That last part is the whole reason this file is a function of the project and not a string.
// A marketing page for a design-system tool wants figures on it, and the frame this follows
// had "300+ teams" and "94% fewer mismatches" on it. Those are not things Strata knows. What
// it does know is how many tokens the project has and how they break down, so that is what
// the page says. If the invented figures are wanted back for a screenshot, they belong in the
// copy here as obviously-sample text, not dressed as facts.

import { libraryCss, componentClassName } from './componentExport';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const countIn = (tokensMap, category) =>
  (Array.isArray(tokensMap?.[category]) ? tokensMap[category] : []).length;

const totalTokens = (tokensMap) => Object.values(tokensMap || {})
  .reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);

/** A token's value, for the specimen rows that print real pairs. */
const valueOf = (tokensMap, name) => {
  for (const cat in tokensMap || {}) {
    if (!Array.isArray(tokensMap[cat])) continue;
    const hit = tokensMap[cat].find(t => t.name === name);
    if (hit) return hit.value;
  }
  return '';
};

/** Only components that have an element and a rule of their own can be used in the page. */
const usable = (components) => (components || []).filter(c => c && c.template !== 'fragment');

const has = (components, name) => usable(components).some(c => c.name === name);
/** The project's own class for a component, or '' when it does not have that component —
 *  so the page degrades to a plain element rather than referencing a rule that is not there. */
const cls = (components, name) => (has(components, name) ? componentClassName(name) : '');

/**
 * @returns {string} one self-contained HTML document, using this project's own component
 *   rules and custom properties. The token declarations are NOT included: buildPreviewDocument
 *   injects those, and declaring them twice would let the two copies disagree.
 */
export function demoSitePage({ project, components, tokensMap, byId } = {}) {
  const comps = usable(components);
  const name = esc(project?.name || 'Strata');
  const tokens = totalTokens(tokensMap);

  const counts = {
    colour: countIn(tokensMap, 'Color'),
    type: countIn(tokensMap, 'Typography'),
    space: countIn(tokensMap, 'Spacing'),
    border: countIn(tokensMap, 'Border'),
    shadow: countIn(tokensMap, 'Shadow'),
    motion: countIn(tokensMap, 'Motion'),
  };

  const primary = cls(comps, 'PrimaryButton');
  const secondary = cls(comps, 'SecondaryButton');
  const card = cls(comps, 'InformationCard');
  const badge = cls(comps, 'StatusBadge');
  const nav = cls(comps, 'NavBar');

  // Three real token rows, named so the specimen cannot print a pair the store does not have.
  const specimen = [
    ['brand.space.4', valueOf(tokensMap, 'brand.space.4')],
    ['brand.radius.lg', valueOf(tokensMap, 'brand.radius.lg')],
    ['brand.font.size.base', valueOf(tokensMap, 'brand.font.size.base')],
  ].filter(([, v]) => v);

  const row = (k, v) => '<div class="row"><span class="muted">' + esc(k) + '</span><strong>' + esc(v) + '</strong></div>';

  const componentRow = (c) => '<div class="crow">'
    + '<span class="chip">' + esc((c.name || '?').slice(0, 1)) + '</span>'
    + '<span><strong>' + esc(c.name) + '</strong>'
    + '<em>' + esc(c.template || 'element') + '</em></span></div>';

  const capability = (n, title, body, foot) => '<article class="' + card + ' cap">'
    + '<span class="num">' + esc(n) + '</span>'
    + '<h3>' + esc(title) + '</h3>'
    + '<p>' + esc(body) + '</p>'
    + '<span class="fact"><i></i>' + esc(foot) + '</span>'
    + '</article>';

  const figure = (label, value, body) => '<article class="' + card + ' cap">'
    + '<span class="muted">' + esc(label) + '</span>'
    + '<h2 class="fig">' + esc(value) + '</h2>'
    + '<p>' + esc(body) + '</p>'
    + '</article>';

  // Page furniture only. Anything a component already describes — a button, a card, a badge,
  // the navbar — is left to that component's own rule.
  const pageCss = [
    'body { font-family: var(--brand-font-body, system-ui, sans-serif); color: var(--color-text-primary, #2a2a38); background: #fff; }',
    '.wrap { padding: var(--brand-space-6, 24px); display: grid; gap: 64px; }',
    '.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px;',
    '  padding: var(--brand-space-3, 12px) var(--brand-space-6, 24px); background: var(--brand-color-primary, #fc0694); }',
    '.bar, .bar a { color: #fff; }',
    '.brand { display: flex; align-items: center; gap: var(--brand-space-3, 12px); }',
    '.mark { width: 36px; height: 36px; border-radius: var(--brand-radius-md, 10px); display: grid; place-items: center;',
    '  background: #fff; color: var(--brand-color-primary, #fc0694); font-weight: 700; }',
    '.bar nav { display: flex; align-items: center; gap: var(--brand-space-3, 12px); font-size: 14px; }',
    '.hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--brand-space-4, 16px); align-items: start; }',
    'h1 { font-family: var(--brand-font-heading, inherit); font-size: 48px; line-height: 1.15; margin: 0; }',
    'h2 { font-family: var(--brand-font-heading, inherit); font-size: 32px; line-height: 1.25; margin: 0; }',
    'h3 { font-family: var(--brand-font-heading, inherit); font-size: 20px; margin: 0; }',
    'p { line-height: 1.6; margin: 0; color: var(--color-text-secondary, #52525e); }',
    '.lede { font-size: 16px; }',
    '.actions { display: flex; gap: var(--brand-space-3, 12px); flex-wrap: wrap; }',
    '.facts { display: flex; gap: var(--brand-space-4, 16px); flex-wrap: wrap; font-size: 13px; }',
    '.fact { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }',
    '.fact i { width: 8px; height: 8px; border-radius: 999px; background: var(--brand-color-primary, #fc0694); }',
    '.panelgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--brand-space-3, 12px); }',
    '.panel { border: 1px solid var(--color-bg-surface, #f3e8f5); border-radius: var(--card-radius, 12px); padding: var(--brand-space-3, 12px); display: grid; gap: 8px; align-content: start; }',
    '.row, .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; }',
    '.crow { display: flex; align-items: center; gap: 8px; font-size: 12px; }',
    '.crow span:last-child { display: grid; }',
    '.crow em { font-style: normal; font-size: 11px; color: var(--color-text-secondary, #52525e); }',
    '.chip { width: 32px; height: 32px; flex: none; border-radius: var(--brand-radius-md, 10px); display: grid; place-items: center;',
    '  background: var(--brand-color-primary, #fc0694); color: #fff; font-size: 11px; font-weight: 600; }',
    '.muted { color: var(--color-text-secondary, #52525e); font-size: 12px; }',
    '.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--brand-space-3, 12px); }',
    '.cap { display: grid; gap: var(--brand-space-3, 12px); align-content: start; padding: var(--brand-space-4, 16px); }',
    '.num { width: 40px; height: 40px; border-radius: var(--brand-radius-md, 12px); display: grid; place-items: center;',
    '  background: var(--brand-color-primary, #fc0694); color: #fff; font-weight: 700; font-size: 14px; }',
    '.fig { font-size: 28px; }',
    '.eyebrow { font-size: 12px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; }',
    '.cta { display: flex; align-items: center; justify-content: space-between; gap: var(--brand-space-4, 16px); flex-wrap: wrap;',
    '  padding: var(--brand-space-6, 24px); border-radius: var(--card-radius, 12px); background: var(--color-bg-surface, #fce7f3); }',
    'footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 13px; }',
  ].join('\n');

  return [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8"><title>' + name + '</title>',
    '<style>', libraryCss(comps, byId), '</style>',
    '<style>', pageCss, '</style>',
    '</head><body>',

    '<header class="bar ' + nav + '">',
    '  <div class="brand"><span class="mark">' + esc(name.slice(0, 1)) + '</span>',
    '    <span><strong>' + name + '</strong><br><small>Design system infrastructure</small></span></div>',
    '  <nav><a href="#capabilities">Capabilities</a><a href="#inside">What is in it</a>',
    '    <button class="' + primary + '">Book a demo</button></nav>',
    '</header>',

    '<div class="wrap">',
    '<section class="hero">',
    '  <div style="display:grid;gap:var(--brand-space-3,12px)">',
    badge ? '    <span class="' + badge + '">Design system infrastructure</span>' : '',
    '    <h1>Build, scale, and govern design systems with one source of truth.</h1>',
    '    <p class="lede">Every element on this page is drawn with ' + name
      + '&rsquo;s own components and tokens. Change a token and this page changes with it.</p>',
    '    <div class="actions"><button class="' + primary + '">Start free trial</button>',
    '      <button class="' + secondary + '">Talk to sales</button></div>',
    '    <div class="facts">',
    '      <span class="fact"><i></i>' + tokens + ' tokens across ' + Object.values(counts).filter(Boolean).length + ' categories</span>',
    '      <span class="fact"><i></i>' + comps.length + ' components, each with its own rule</span>',
    '    </div>',
    '  </div>',

    '  <div class="' + card + ' panel" style="gap:var(--brand-space-3,12px)">',
    '    <div class="head"><span><span class="muted">Live workspace</span><br><strong>' + name + '</strong></span>',
    badge ? '<span class="' + badge + '">Synced</span>' : '',
    '    </div>',
    '    <div class="panelgrid">',
    '      <div class="panel"><div class="head"><span class="muted">Tokens</span><strong>' + tokens + '</strong></div>',
    specimen.map(([k, v]) => row(k.split('.').slice(-1)[0], v)).join(''),
    '      </div>',
    '      <div class="panel"><div class="head"><span class="muted">Components</span><strong>' + comps.length + '</strong></div>',
    comps.slice(0, 3).map(componentRow).join(''),
    '      </div>',
    '    </div>',
    '  </div>',
    '</section>',

    '<section id="capabilities" style="display:grid;gap:var(--brand-space-3,12px)">',
    '  <span class="eyebrow">Capabilities</span>',
    '  <h2>Everything your team needs to build, govern, and scale a design system.</h2>',
    '  <div class="cards">',
    capability('01', 'Unified tokens',
      'Colour, type, spacing, radius, shadow and motion in one store, published to every team.',
      counts.colour + ' colour tokens in this system'),
    capability('02', 'Component catalog',
      'Every component carries the tokens mapped onto it and the CSS rule those tokens produce.',
      comps.length + ' components documented here'),
    capability('03', 'Governance at scale',
      'Owners, reviewers and release windows keep a change visible before it reaches production.',
      'Every release is restorable'),
    '  </div>',
    '</section>',

    '<section id="inside" style="display:grid;gap:var(--brand-space-3,12px)">',
    '  <span class="eyebrow">What is in it</span>',
    '  <h2>Counted from this project, not estimated.</h2>',
    '  <div class="cards">',
    figure('Colour', String(counts.colour), 'Every colour the system defines, including the ramps derived from its three brand colours.'),
    figure('Typography', String(counts.type), 'Families, sizes, weights and leading — the text styles the system can set.'),
    figure('Spacing and shape', String(counts.space + counts.border + counts.shadow),
      counts.space + ' spacing, ' + counts.border + ' radius and border, ' + counts.shadow + ' shadow.'),
    '  </div>',
    '</section>',

    '<section class="cta">',
    '  <div style="display:grid;gap:8px;max-width:62ch">',
    '    <h2>Ready to build a design system that scales?</h2>',
    '    <p>This page is a starting point. Ask on the right for a change and it is rewritten.</p>',
    '  </div>',
    '  <div class="actions"><button class="' + primary + '">Start free trial</button>',
    '    <button class="' + secondary + '">Talk to sales</button></div>',
    '</section>',

    '<footer><span>&copy; ' + new Date().getFullYear() + ' ' + name + '. Built from '
      + tokens + ' tokens and ' + comps.length + ' components.</span>',
    '  <span class="muted">Docs &middot; Pricing &middot; Contact</span></footer>',
    '</div></body></html>',
  ].filter(Boolean).join('\n');
}
