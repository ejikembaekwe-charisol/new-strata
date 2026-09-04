// Live inheritance and composition for components.
//
// A component may `extends` another: it resolves through its parent chain every render, so
// changing a parent updates every descendant. Its own mappings win per property, which is
// what makes an override an override rather than a copy.
//
// A `fragment` may hold `children` — ordered references to other components. Those are
// references, not ownership: a child still lives in its own type folder and can be used by
// more than one fragment.
//
// Every walk here is depth-capped. A corrupted chain should degrade to a component's own
// tokens, never hang the page.

const MAX_DEPTH = 32;

/** Components keyed by id, the shape every function here takes. */
export const indexById = (components) =>
  Object.fromEntries((components || []).map(c => [c.id, c]));

/**
 * The chain above a component, nearest parent first. Stops on a repeat, so a cycle that
 * somehow got stored is survivable rather than fatal.
 */
export const ancestors = (comp, byId) => {
  const out = [];
  const seen = new Set(comp ? [comp.id] : []);
  let cur = comp;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const parent = cur && cur.extends ? byId[cur.extends] : null;
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    out.push(parent);
    cur = parent;
  }
  return out;
};

/** Everything below a component, for excluding it from its own parent picker. */
export const descendants = (comp, byId) => {
  if (!comp) return [];
  const all = Object.values(byId);
  const out = [];
  let frontier = [comp.id];
  const seen = new Set(frontier);
  for (let i = 0; i < MAX_DEPTH && frontier.length; i++) {
    const next = [];
    for (const c of all) {
      if (c.extends && frontier.includes(c.extends) && !seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
        next.push(c.id);
      }
    }
    frontier = next;
  }
  return out;
};

/**
 * Would making `parentId` the parent of `childId` create a loop? Checked before the link is
 * made, so a cycle can never be stored in the first place.
 */
export const wouldCycle = (childId, parentId, byId) => {
  if (!childId || !parentId) return false;
  if (childId === parentId) return true;
  const parent = byId[parentId];
  return ancestors(parent, byId).some(a => a.id === childId)
    || parentId === childId;
};

/** Components that may be offered as a parent for this one. */
export const eligibleParents = (comp, components) => {
  const byId = indexById(components);
  const banned = new Set([comp?.id, ...descendants(comp, byId).map(c => c.id)]);
  return (components || []).filter(c => !banned.has(c.id));
};

/**
 * A component's mappings with its parent chain merged in. Furthest ancestor first so nearer
 * ones overwrite, and the component's own mappings land last and win.
 */
export const effectiveTokens = (comp, byId) => {
  if (!comp) return {};
  const chain = ancestors(comp, byId);
  const merged = {};
  for (const a of chain.slice().reverse()) Object.assign(merged, a.tokens || {});
  Object.assign(merged, comp.tokens || {});
  return merged;
};

/**
 * Where a property's value comes from, so the inspector can label the row and decide whether
 * to offer a reset.
 *   own       — set on this component, overriding any inherited value
 *   inherited — coming from `from`, an ancestor
 *   none      — unset anywhere in the chain
 */
export const tokenOrigin = (comp, prop, byId) => {
  if (!comp) return { origin: 'none', from: null, value: '' };
  if (comp.tokens?.[prop]) {
    const inherited = ancestors(comp, byId).find(a => a.tokens?.[prop]);
    return {
      origin: 'own',
      from: inherited || null,          // what a reset would fall back to
      value: comp.tokens[prop],
    };
  }
  const source = ancestors(comp, byId).find(a => a.tokens?.[prop]);
  return source
    ? { origin: 'inherited', from: source, value: source.tokens[prop] }
    : { origin: 'none', from: null, value: '' };
};

/* ── fragments ── */

export const isFragment = (comp) => comp?.template === 'fragment';

/** A fragment's children, in order, skipping ids that no longer resolve. */
export const childrenOf = (comp, byId) =>
  (comp?.children || []).map(id => byId[id]).filter(Boolean);

/** Fragments that would be reachable from this one, so a child cannot contain its container. */
const fragmentDescendantIds = (comp, byId) => {
  const out = new Set();
  const walk = (c, depth) => {
    if (!c || depth > MAX_DEPTH) return;
    for (const id of c.children || []) {
      if (out.has(id)) continue;
      out.add(id);
      walk(byId[id], depth + 1);
    }
  };
  walk(comp, 0);
  return out;
};

/** Would adding `childId` to this fragment create a containment loop? */
export const wouldNest = (fragment, childId, byId) => {
  if (!fragment || !childId) return false;
  if (fragment.id === childId) return true;
  // walking down from the candidate: if we reach the fragment, it would contain itself
  return fragmentDescendantIds(byId[childId], byId).has(fragment.id);
};

/** Components this fragment may take as a child. */
export const eligibleChildren = (fragment, components) => {
  const byId = indexById(components);
  const already = new Set(fragment?.children || []);
  return (components || []).filter(c =>
    c.id !== fragment?.id && !already.has(c.id) && !wouldNest(fragment, c.id, byId)
  );
};

/* ── cleanup on delete ── */

/**
 * Removes components and repairs every reference to them.
 *
 * A deleted parent's resolved mappings are flattened into each direct child before the link
 * is dropped, so the child looks exactly as it did a moment ago. Leaving descendants
 * silently unstyled would be the alternative, and worse.
 */
export const removeComponents = (components, idsToRemove) => {
  const ids = new Set(idsToRemove);
  const byId = indexById(components);

  return (components || [])
    .filter(c => !ids.has(c.id))
    .map(c => {
      let next = c;

      if (next.extends && ids.has(next.extends)) {
        const inheritedNow = effectiveTokens(byId[next.extends], byId);
        // own mappings still win — this only backfills what was being inherited.
        // Empty values are dropped: a stored '' would shadow an inherited value while
        // meaning nothing. To genuinely blank a property, set a literal like `none`.
        const merged = { ...inheritedNow, ...(next.tokens || {}) };
        for (const [k, v] of Object.entries(merged)) if (!v) delete merged[k];
        next = { ...next, tokens: merged };
        delete next.extends;
      }

      if (next.children?.some(id => ids.has(id))) {
        next = { ...next, children: next.children.filter(id => !ids.has(id)) };
      }

      return next;
    });
};
