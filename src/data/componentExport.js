// A component, as code a developer can paste into their own codebase.
//
// Moved out of ProjectDetail's component modal, where these lived and were reachable only
// from inside a dialog. Dev mode needs the same generators at page level, and needs two more
// that emit the whole library at once, so they live here and the modal imports them.
//
// The output references CSS custom properties rather than literal values on purpose: a
// stylesheet full of baked hexes stops being true the moment a token changes, whereas
// var(--color-primary) keeps pointing at whatever the exported tokens say. The variable names
// are generated to match cssVariablesFrom in tokenExport.js, which is what makes the two
// files work together once both are written into a repo.

import { cssPropForTokenKey } from './tokenKeys';
import { effectiveTokens, indexById } from '../components/inspector/inheritance';

// Custom-property names must match what the project exports ,
// otherwise CSS copied out of Dev mode would not paste back in here.
export const tokenToCssVar = (tokenName) => `--${String(tokenName).replace(/\./g, '-')}`;

// PrimaryButton → primary-button
export const componentClassName = (name) =>
  String(name || 'component')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'component';

// The element each template renders, so the JSX names something real.
export const TEMPLATE_ELEMENT = {
  button: 'button', input: 'input', card: 'div', badge: 'span', image: 'img',
  dropdown: 'div', tooltip: 'div', selection: 'label', selector: 'div',
  accordion: 'div', tabs: 'div', modal: 'div', table: 'table',
  chart: 'figure', breadcrumb: 'nav', pagination: 'nav', navbar: 'nav',
};

// `inheritedRows` are declarations the component gets from its parent. They are included
// because the preview includes them — a rule that omitted them would not reproduce what
// is on screen — and marked so it is clear where they came from.
export const componentToCssText = (name, rows, inheritedRows = [], parentName = '') => {
  const decl = (r) => `  ${cssPropForTokenKey(r.key)}: var(${tokenToCssVar(r.value)});`;
  const own = new Set((rows || []).filter(r => r.value).map(r => cssPropForTokenKey(r.key)));
  const note = parentName ? ` /* inherited from ${parentName} */` : ' /* inherited */';
  const decls = [
    ...(inheritedRows || []).filter(r => r.value && !own.has(cssPropForTokenKey(r.key))).map(r => decl(r) + note),
    ...(rows || []).filter(r => r.value).map(decl),
  ];
  const body = decls.length ? decls.join('\n') : '  /* no tokens mapped yet */';
  return `.${componentClassName(name)} {\n${body}\n}`;
};

export const componentToJsxText = (name, template) => {
  const el = TEMPLATE_ELEMENT[template] || 'div';
  const cls = componentClassName(name);
  const comp = String(name || 'Component').replace(/[^a-zA-Z0-9]/g, '') || 'Component';
  const selfClosing = el === 'input' || el === 'img';
  return selfClosing
    ? `export function ${comp}(props) {\n  return <${el} className="${cls}" {...props} />;\n}`
    : `export function ${comp}({ children, ...props }) {\n  return (\n    <${el} className="${cls}" {...props}>\n      {children}\n    </${el}>\n  );\n}`;
};

export const componentToJsonText = (name, type, template, description, rows, extra = {}) => {
  const tokens = {};
  for (const r of rows || []) {
    if (r.value) tokens[cssPropForTokenKey(r.key)] = r.value;
  }
  return JSON.stringify({
    name: name || '', type: type || '', template: template || '',
    description: description || '', tokens,
    // present only when they mean something, so an ordinary component's spec is unchanged
    ...(extra.extends ? { extends: extra.extends } : {}),
    ...(extra.children && extra.children.length ? { children: extra.children } : {}),
  }, null, 2);
};

// -- Whole-library output ---------------------------------------------------
//
// The per-component generators above take pre-built `rows`, because the modal has them from
// its form. Walking the stored components instead means resolving inheritance first, which is
// what `effectiveTokens` does: a child that inherits its padding has to emit that padding, or
// the stylesheet will not reproduce what the preview shows.

/** A component's mapped tokens as the { key, value } rows the generators expect. */
const rowsFor = (tokenMap) => Object.entries(tokenMap || {})
  .filter(([, value]) => value)
  .map(([key, value]) => ({ key, value }));

/** One component's rule, with inheritance resolved. */
export const componentCss = (comp, byId) => {
  const index = byId || {};
  const own = rowsFor(comp?.tokens);
  const merged = rowsFor(effectiveTokens(comp, index));
  const ownKeys = new Set(own.map(r => cssPropForTokenKey(r.key)));
  const inherited = merged.filter(r => !ownKeys.has(cssPropForTokenKey(r.key)));
  const parent = comp?.extends ? index[comp.extends] : null;
  return componentToCssText(comp?.name, own, inherited, parent?.name || '');
};

export const componentJsx = (comp) => componentToJsxText(comp?.name, comp?.template);

/**
 * Every component as one stylesheet.
 *
 * Fragments are skipped: they are grouping containers with no element of their own, so a rule
 * for one would select nothing. A name that humanises to a selector already used is skipped
 * too and reported in the header — emitting it would silently override the first rule, and a
 * developer reading the file deserves to know a component is missing rather than wonder.
 */
export const libraryCss = (components, byId) => {
  const all = components || [];
  const index = byId || indexById(all);
  const seen = new Set();
  const skipped = [];
  const rules = [];
  for (const c of all) {
    if (!c || c.template === 'fragment') continue;
    const cls = componentClassName(c.name);
    if (seen.has(cls)) { skipped.push(c.name); continue; }
    seen.add(cls);
    rules.push(componentCss(c, index));
  }
  const head = ['/* Component styles, generated by Strata */',
    '/* Values reference the custom properties in tokens.css - export both together. */'];
  if (skipped.length) {
    head.push('/* Skipped, their names collide with an earlier component: ' + skipped.join(', ') + ' */');
  }
  return head.join('\n') + '\n\n' + (rules.join('\n\n') || '/* no components yet */') + '\n';
};

/** Every component as one module of exported functions, on the same skip rules. */
export const libraryJsx = (components) => {
  const seen = new Set();
  const out = [];
  for (const c of components || []) {
    if (!c || c.template === 'fragment') continue;
    const fn = String(c.name || 'Component').replace(/[^a-zA-Z0-9]/g, '') || 'Component';
    if (seen.has(fn)) continue;
    seen.add(fn);
    out.push(componentJsx(c));
  }
  return ['// Components, generated by Strata.',
    '// Each references the class names in components.css - export both together.',
    '', out.join('\n\n') || '// no components yet', ''].join('\n');
};
