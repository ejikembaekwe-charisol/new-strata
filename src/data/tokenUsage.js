// Who depends on a token.
//
// Strata could always show what a token points *at* — the row prints "Resolves to" and the
// value cell's tooltip carries the whole chain. What it could never show is the other
// direction: what points at this. That was only computable as a side effect of editing,
// through the impact panel, so the only way to learn a token's dependents was to change it
// and read what moved.
//
// This builds the reverse graph once, from the two places a dependency can live: a token
// value that references another token, and a component property mapped to one.

import { rampMemberOf } from './tokenGroups.js';
import { scaleStepOf } from './typeScale.js';
import { styleOf } from './textStyles.js';
import { normalizeTypeKey } from './tokenTypes.js';

const MAX_DEPTH = 32;

/**
 * Whether a token is one member of a set the app generated: a ramp step, a type-scale step,
 * or one part of a text style.
 *
 * These are inventory, not commitments. A ramp produces all eleven steps and a scale all
 * eight whether or not you have reached for them yet, so an unreferenced one is a menu
 * entry rather than dead weight.
 *
 * Each check is guarded by the token's type, because the name predicates are deliberately
 * loose on their own — `scaleStepOf` reads only the last segment, so `control.height.sm`
 * matches it despite being nothing to do with a type scale.
 */
export const isGeneratedSetMember = (token) => {
  const name = token && token.name;
  if (!name) return false;
  const type = normalizeTypeKey(token.type);

  if (rampMemberOf(name) && /color$|^fill$|^stroke$/.test(type)) return true;
  if (scaleStepOf(name) && type === 'font-size') return true;
  const style = styleOf(name);
  if (style) return true;

  return false;
};

/**
 * Every token name a value references.
 *
 * A reference only counts when its target actually exists, and that is what makes reading
 * raw values safe. A Motion token holds `all 250ms ease-out`, whose words look like bare
 * names; a component property may hold the literal `12px`. Neither is a token, so neither
 * becomes an edge. A shadow holding `0 2px 4px {color.primary.400}` does.
 */
export const referencesIn = (value, knownNames) => {
  const out = [];
  const seen = new Set();
  const s = value == null ? '' : String(value).trim();
  if (!s) return out;

  const add = (name) => {
    if (!name || seen.has(name) || !knownNames.has(name)) return;
    seen.add(name);
    out.push(name);
  };

  // Braced references, anywhere in the value — one value can carry several.
  const braced = /\{([^{}]+)\}/g;
  let m;
  while ((m = braced.exec(s)) !== null) add(m[1].trim());

  // The legacy form resolveValueInStore still accepts: the whole value is a token name.
  if (!s.includes('{')) add(s);

  return out;
};

/**
 * The reverse graph. One pass over the store rather than a resolve per token — with ~170
 * tokens that is the difference between free and noticeable on every render.
 *
 * Every known token gets an entry, so "nothing references this" is a fact the index states
 * rather than a lookup miss the caller has to interpret.
 */
export const buildUsageIndex = (tokens, components) => {
  const all = [];
  for (const cat in tokens || {}) {
    if (!Array.isArray(tokens[cat])) continue;
    for (const t of tokens[cat]) if (t && t.name) all.push({ ...t, category: cat });
  }

  const knownNames = new Set(all.map(t => t.name));
  const index = new Map();
  for (const name of knownNames) index.set(name, { tokens: [], components: [] });

  for (const t of all) {
    for (const ref of referencesIn(t.value, knownNames)) {
      // A token aliasing itself is a broken token, not a dependent of itself.
      if (ref === t.name) continue;
      index.get(ref).tokens.push(t.name);
    }
  }

  for (const comp of components || []) {
    for (const [prop, val] of Object.entries((comp && comp.tokens) || {})) {
      for (const ref of referencesIn(val, knownNames)) {
        index.get(ref).components.push({ id: comp.id, name: comp.name, prop });
      }
    }
  }

  return { index, knownNames, byName: new Map(all.map(t => [t.name, t])) };
};

/** The immediate referrers of a name — what you would actually go and edit. */
export const referrersOf = (name, usage) =>
  (usage && usage.index.get(name)) || { tokens: [], components: [] };

/**
 * Direct referrers plus the totals behind them: "2 direct, 6 in all". The direct list is
 * what you would edit; the total is what would move if the value changed.
 *
 * Breadth-first with a visited set and a depth cap, so an alias loop somebody hand-wrote
 * degrades to a partial answer instead of hanging the page.
 */
export const usageOf = (name, usage) => {
  const direct = referrersOf(name, usage);
  const reachedTokens = new Set();
  const reachedComponents = new Map();
  const visited = new Set([name]);
  let frontier = [name];

  for (let depth = 0; depth < MAX_DEPTH && frontier.length; depth++) {
    const next = [];
    for (const current of frontier) {
      const entry = usage && usage.index.get(current);
      if (!entry) continue;
      for (const c of entry.components) reachedComponents.set(c.id + ' ' + c.prop, c);
      for (const t of entry.tokens) {
        if (visited.has(t)) continue;
        visited.add(t);
        reachedTokens.add(t);
        next.push(t);
      }
    }
    frontier = next;
  }

  return {
    direct,
    totalTokens: reachedTokens.size,
    totalComponents: reachedComponents.size,
    unused: direct.tokens.length === 0 && direct.components.length === 0,
  };
};

/**
 * A token nothing references, where that is a defect rather than normal.
 *
 * An unused Brand entry is not a defect — a palette is a menu you pick from, and a ramp
 * generates all eleven steps whether or not you have reached for them yet. A Semantic or
 * Scoped token is different: being referenced is the only reason it exists, so one with no
 * referrers is dead weight and worth saying so.
 *
 * Direct emptiness is sufficient: nothing reaches a token transitively without something
 * reaching it directly first.
 */
export const isDeadToken = (token, usage) => {
  const tier = token && token.layer;
  if (tier !== 'Semantic' && tier !== 'Component') return false;
  // A generated set member is inventory whatever tier it sits in. The text styles are
  // Semantic and there are thirty-six of them, so without this the badge would land on
  // most of a freshly generated type system and read as breakage.
  if (isGeneratedSetMember(token)) return false;
  const entry = usage && usage.index.get(token.name);
  return Boolean(entry) && entry.tokens.length === 0 && entry.components.length === 0;
};
