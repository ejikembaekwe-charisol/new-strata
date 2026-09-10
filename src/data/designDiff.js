// What differs between two design states — two releases, or a branch and the project it
// came from.
//
// This is not the same question `computeImpact` in ProjectDetail answers. That one takes a
// single pending edit and asks what it would ripple into, and to do that it walks the
// *current* token store only — so a token that exists in one state and not the other is
// invisible to it. A release or a branch differs by whole tokens appearing and disappearing,
// so that is the first thing this has to see.
//
// Comparison is by *resolved* value, not by what is written in the field. `{color.primary}`
// against `{color.primary}` is not a change even if the ramp beneath moved, and `#FC0694`
// against `{brand.color.primary}` is not a change if that is what it resolves to. Each side
// resolves inside its own store, which is the only way an alias means anything.

/** Every token in a store, flattened to name → { token, category }. */
const indexTokens = (store) => {
  const out = new Map();
  for (const category in (store || {})) {
    for (const token of store[category] || []) {
      if (token && token.name) out.set(token.name, { token, category });
    }
  }
  return out;
};

/**
 * The literal a value ends up as inside one store, following `{braced}` and bare-name
 * aliases.
 *
 * Cycle-guarded, unlike the copy in ProjectDetail this was lifted from. That one has no
 * guard, and a cyclic alias once blanked the whole Tokens tab through its sibling — a state
 * restored from a release or carried in from a branch is exactly where a cycle would arrive
 * from, so it cannot go unguarded here.
 */
export const resolveInStore = (value, store, seen) => {
  if (!value) return '';
  const val = String(value).trim();
  const visited = seen || new Set();

  const lookup = (name) => {
    if (visited.has(name)) return null;
    visited.add(name);
    for (const category in (store || {})) {
      const found = (store[category] || []).find(t => t.name === name);
      if (found) return resolveInStore(found.value, store, visited);
    }
    return null;
  };

  const braced = val.match(/^\{(.+)\}$/);
  const hit = braced ? lookup(braced[1]) : (val.startsWith('{') ? null : lookup(val));
  // A name that resolves to nothing is not the same as a literal: fall back to the raw text,
  // which is what the rest of the app shows for an unresolved reference.
  return hit === null ? val : hit;
};

const tokenEntry = (op, name, category, before, after, beforeStore, afterStore) => {
  const beforeValue = before ? resolveInStore(before.value, beforeStore) : '';
  const afterValue = after ? resolveInStore(after.value, afterStore) : '';
  const rawChanged = String(before ? before.value : '') !== String(after ? after.value : '');
  return {
    id: 'token:' + name,
    kind: 'token',
    op,
    name,
    category,
    before,
    after,
    beforeValue,
    afterValue,
    rawChanged,
    // Its own text is untouched; it moved because something it points at moved. There is
    // nothing here to apply on its own - it follows its ancestor - so a merge reports it
    // to explain the knock-on effect but does not offer it as a choice.
    inherited: op === 'change' && !rawChanged,
  };
};

const diffTokens = (beforeStore, afterStore) => {
  const a = indexTokens(beforeStore);
  const b = indexTokens(afterStore);
  const added = [];
  const removed = [];
  const changed = [];

  for (const [name, { token, category }] of b) {
    if (!a.has(name)) {
      added.push(tokenEntry('add', name, category, null, token, beforeStore, afterStore));
      continue;
    }
    const prev = a.get(name);
    const beforeValue = resolveInStore(prev.token.value, beforeStore);
    const afterValue = resolveInStore(token.value, afterStore);
    // The raw value is compared too, so re-pointing an alias at something that happens to
    // resolve the same still reads as a change — the intent moved even if the pixel did not.
    if (beforeValue !== afterValue || String(prev.token.value) !== String(token.value)) {
      changed.push(tokenEntry('change', name, category, prev.token, token, beforeStore, afterStore));
    }
  }
  for (const [name, { token, category }] of a) {
    if (!b.has(name)) {
      removed.push(tokenEntry('remove', name, category, token, null, beforeStore, afterStore));
    }
  }
  return { added, removed, changed };
};

// The five that ProjectDetail mirrors onto `brand.color.*` and `brand.font.*` tokens. A
// change to one of these already shows up as a token change, so diffing them here as well
// would report the same edit twice.
const MIRRORED_BRAND_FIELDS = new Set([
  'primaryColor', 'secondaryColor', 'accentColor', 'headingFont', 'bodyFont',
]);

const BRAND_LABELS = {
  voice: 'Voice', manifesto: 'Manifesto', toneKeywords: 'Tone keywords',
  mission: 'Mission', vision: 'Vision', tagline: 'Tagline', audience: 'Audience',
};

const brandText = (v) => (Array.isArray(v) ? v.join(', ') : String(v == null ? '' : v));

/**
 * The Brand Bible prose - the part of a release no token carries.
 *
 * Without this a release that changed only the manifesto would report "no changes", which
 * is the kind of quiet lie this screen exists to stop telling.
 */
const diffBrand = (before, after) => {
  const a = before || {};
  const b = after || {};
  const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter(f => !MIRRORED_BRAND_FIELDS.has(f));
  const changed = [];
  for (const field of fields) {
    const raw = b[field] === undefined ? a[field] : b[field];
    // Nested objects under brand (brandContext and friends) are not prose and have no
    // sensible one-line before and after, so they are left out rather than stringified.
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) continue;
    const beforeValue = brandText(a[field]);
    const afterValue = brandText(b[field]);
    if (beforeValue === afterValue) continue;
    changed.push({
      id: 'brand:' + field,
      kind: 'brand',
      op: 'change',
      field,
      name: BRAND_LABELS[field] || field,
      beforeValue,
      afterValue,
      afterRaw: b[field],
    });
  }
  return changed.sort((x, y) => x.name.localeCompare(y.name));
};

const indexComponents = (list) => {
  const out = new Map();
  for (const c of list || []) if (c && c.id != null) out.set(String(c.id), c);
  return out;
};

/** Which mapped properties differ, by the value each one resolves to in its own store. */
const propChanges = (before, after, beforeStore, afterStore) => {
  const pa = (before && before.tokens) || {};
  const pb = (after && after.tokens) || {};
  const props = new Set([...Object.keys(pa), ...Object.keys(pb)]);
  const out = [];
  for (const prop of props) {
    const rawBefore = pa[prop] || '';
    const rawAfter = pb[prop] || '';
    const beforeValue = rawBefore ? resolveInStore(rawBefore, beforeStore) : '';
    const afterValue = rawAfter ? resolveInStore(rawAfter, afterStore) : '';
    if (rawBefore === rawAfter && beforeValue === afterValue) continue;
    out.push({ prop, rawBefore, rawAfter, beforeValue, afterValue });
  }
  return out.sort((x, y) => x.prop.localeCompare(y.prop));
};

const diffComponents = (beforeList, afterList, beforeStore, afterStore) => {
  const a = indexComponents(beforeList);
  const b = indexComponents(afterList);
  const added = [];
  const removed = [];
  const changed = [];

  for (const [cid, comp] of b) {
    if (!a.has(cid)) {
      added.push({ id: 'component:' + cid, kind: 'component', op: 'add', componentId: cid, name: comp.name, before: null, after: comp, props: [] });
      continue;
    }
    const prev = a.get(cid);
    const props = propChanges(prev, comp, beforeStore, afterStore);
    const renamed = String(prev.name || '') !== String(comp.name || '');
    const retemplated = String(prev.template || '') !== String(comp.template || '');
    if (props.length || renamed || retemplated) {
      // Nobody touched this component: every property it maps still points where it
      // pointed, and it only looks different because a token underneath moved. Applying it
      // in a merge would copy a component that will follow the token anyway, and counting
      // it as a change of its own inflates every token edit into "1 token, 1 component".
      const inherited = !renamed && !retemplated
        && props.length > 0 && props.every(pr => pr.rawBefore === pr.rawAfter);
      changed.push({
        id: 'component:' + cid, kind: 'component', op: 'change', componentId: cid,
        name: comp.name, before: prev, after: comp, props, renamed, retemplated, inherited,
      });
    }
  }
  for (const [cid, comp] of a) {
    if (!b.has(cid)) {
      removed.push({ id: 'component:' + cid, kind: 'component', op: 'remove', componentId: cid, name: comp.name, before: comp, after: null, props: [] });
    }
  }
  return { added, removed, changed };
};

/**
 * What differs between two design states.
 *
 * Each side is `{ tokens, components, brandData }` — the shape `designSnapshot()` produces
 * and the shape a release stores.
 *
 * @returns {{ tokens: {added,removed,changed}, components: {added,removed,changed},
 *             entries: Array, total: number }}
 *          `entries` is every change in one flat list, which is what the merge UI ticks.
 */
export const diffDesigns = (before, after) => {
  const beforeStore = (before && before.tokens) || {};
  const afterStore = (after && after.tokens) || {};
  const tokens = diffTokens(beforeStore, afterStore);
  const components = diffComponents(
    (before && before.components) || [],
    (after && after.components) || [],
    beforeStore, afterStore,
  );
  const brand = diffBrand(before && before.brandData, after && after.brandData);
  const rows = [
    ...tokens.added, ...tokens.changed, ...tokens.removed,
    ...components.added, ...components.changed, ...components.removed,
    ...brand,
  ];
  // What a merge can actually offer as a choice. An inherited row is reported but not
  // selectable, so counting it would promise a checkbox that is not there.
  const entries = rows.filter(r => !r.inherited);
  return { tokens, components, brand, rows, entries, total: entries.length };
};

/** A one-line summary, e.g. "4 tokens, 1 component". '' when nothing differs. */
export const summariseDiff = (diff) => {
  if (!diff || !diff.total) return '';
  const t = diff.entries.filter(e => e.kind === 'token').length;
  const c = diff.entries.filter(e => e.kind === 'component').length;
  const b = diff.entries.filter(e => e.kind === 'brand').length;
  const parts = [];
  if (t) parts.push(t + ' token' + (t === 1 ? '' : 's'));
  if (c) parts.push(c + ' component' + (c === 1 ? '' : 's'));
  if (b) parts.push(b + ' brand field' + (b === 1 ? '' : 's'));
  return parts.join(', ');
};

/**
 * Applies the chosen entries of a diff onto a design state, returning a new one.
 *
 * This is what selective merge commits: `base` is the target (main), the entries came from
 * diffing base against the branch, and each accepted entry pulls that one change across.
 * Anything not accepted is left exactly as it was on the target.
 */
export const applyDiffEntries = (base, entries) => {
  const tokens = {};
  for (const category in (base.tokens || {})) tokens[category] = [...(base.tokens[category] || [])];
  let components = [...(base.components || [])];
  const brandData = { ...(base.brandData || {}) };

  const putToken = (category, token) => {
    const cat = category || 'Color';
    if (!tokens[cat]) tokens[cat] = [];
    const i = tokens[cat].findIndex(t => t.name === token.name);
    if (i === -1) tokens[cat].push(token); else tokens[cat][i] = token;
  };
  const dropToken = (name) => {
    for (const cat in tokens) tokens[cat] = tokens[cat].filter(t => t.name !== name);
  };

  for (const entry of entries || []) {
    // Never applied: it has no change of its own, and writing its resolved literal would
    // flatten a living alias into a hard-coded value.
    if (entry.inherited) continue;
    if (entry.kind === 'token') {
      if (entry.op === 'remove') dropToken(entry.name);
      else if (entry.after) {
        // A token can move category between the two states; drop it wherever it was first so
        // the merge cannot leave two rows with the same name.
        dropToken(entry.name);
        putToken(entry.category, entry.after);
      }
    } else if (entry.kind === 'component') {
      if (entry.op === 'remove') {
        components = components.filter(c => String(c.id) !== String(entry.componentId));
      } else if (entry.after) {
        const i = components.findIndex(c => String(c.id) === String(entry.componentId));
        if (i === -1) components.push(entry.after); else components[i] = entry.after;
      }
    } else if (entry.kind === 'brand') {
      brandData[entry.field] = entry.afterRaw;
    }
  }
  return { tokens, components, brandData };
};
