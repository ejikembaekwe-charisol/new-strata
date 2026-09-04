// Refactors that span the whole store: renaming a ramp, and recolouring one.
//
// Both are more than field edits. Renaming a ramp renames eleven tokens, and anything
// aliasing one of them — or any component mapped to one — has to be repointed in the same
// action or it stops resolving. Recolouring rebuilds ten steps around a new base.
//
// Neither can go through handleEditToken: it swaps a single token in place, repairs no
// references, and does not persist.
//
// The reference repair asks the usage index who actually references each old name and
// rewrites exactly those, rather than sweeping every value in the store. That is what makes
// it precise in both directions — it cannot miss a referrer, and it cannot corrupt a value
// that merely looks similar. `referencesIn` is the shared answer to "does this value
// reference that name", so this and the usages panel cannot disagree.

import { buildUsageIndex } from './tokenUsage.js';
import { rampMemberOf } from './tokenGroups.js';
import { RAMP_STEPS, RAMP_BASE_STEP, rampStep } from './colorRamp.js';

/** `Brand Pink!` → `brand-pink`. Empty when there is nothing usable in the name. */
export const slugifyRole = (name) => String(name || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const eachToken = (tokens, fn) => {
  for (const cat in tokens || {}) {
    if (!Array.isArray(tokens[cat])) continue;
    for (const t of tokens[cat]) if (t && t.name) fn(t, cat);
  }
};

/** Whether a project already has a ramp under this role slug. */
export const rampRoleExists = (tokens, role) => {
  let found = false;
  eachToken(tokens, (t) => {
    if (rampMemberOf(t.name)?.role === role) found = true;
  });
  return found;
};

/** Every role slug with a ramp, for the placeholder-folder rule and for clash checks. */
export const rampRolesIn = (tokens) => {
  const roles = new Set();
  eachToken(tokens, (t) => {
    const m = rampMemberOf(t.name);
    if (m) roles.add(m.role);
  });
  return [...roles];
};

/**
 * Rewrites one value so references to `oldName` point at `newName`.
 *
 * Handles the braced form anywhere in the value — a shadow can carry a colour reference
 * alongside its offsets — and the bare form, where the whole value is a token name, which
 * resolveTokenValue still accepts from older projects.
 */
const repointValue = (value, oldName, newName) => {
  const s = String(value == null ? '' : value);
  if (s.trim() === oldName) return newName;
  // Split on the exact delimited reference rather than a substring, so `{color.primary.4}`
  // can never be caught by a rename of `color.primary.40`.
  return s.split('{' + oldName + '}').join('{' + newName + '}');
};

/**
 * Renames a ramp and repairs everything that referenced it.
 *
 * Nothing is deleted and no other token is touched. Returns the counts so the caller can
 * report what happened instead of claiming success silently, and `ok: false` with a reason
 * when the rename cannot be done — a clash, or a role that is not there.
 */
export const renameRamp = (tokens, components, oldRole, newRoleName) => {
  const newRole = slugifyRole(newRoleName);
  if (!newRole) return { ok: false, reason: 'A ramp name needs at least one letter or number.' };
  if (newRole === oldRole) return { ok: false, reason: 'unchanged' };
  if (!rampRoleExists(tokens, oldRole)) return { ok: false, reason: 'That ramp no longer exists.' };
  if (rampRoleExists(tokens, newRole)) {
    return { ok: false, reason: 'This project already has a ' + newRoleName.trim() + ' ramp.' };
  }

  // old → new for every step this ramp actually has, which may be fewer than eleven if
  // somebody deleted one.
  const renames = new Map();
  eachToken(tokens, (t) => {
    const m = rampMemberOf(t.name);
    if (m && m.role === oldRole) renames.set(t.name, 'color.' + newRole + '.' + m.step);
  });
  if (renames.size === 0) return { ok: false, reason: 'That ramp has no steps to rename.' };

  // Who references those names. Asked once, before anything moves.
  const usage = buildUsageIndex(tokens, components);
  const tokenReferrers = new Set();
  const componentReferrers = new Map();
  for (const oldName of renames.keys()) {
    const entry = usage.index.get(oldName);
    if (!entry) continue;
    for (const n of entry.tokens) tokenReferrers.add(n);
    for (const c of entry.components) componentReferrers.set(c.id, true);
  }

  let repaired = 0;

  const nextTokens = {};
  for (const cat in tokens || {}) {
    if (!Array.isArray(tokens[cat])) { nextTokens[cat] = tokens[cat]; continue; }
    nextTokens[cat] = tokens[cat].map(t => {
      if (!t || !t.name) return t;
      let next = t;

      // A referrer's value gets repointed. A ramp step can reference another step, so this
      // runs before the rename and is keyed on the old names either way.
      if (tokenReferrers.has(t.name)) {
        let value = t.value;
        for (const [oldName, newName] of renames) value = repointValue(value, oldName, newName);
        if (value !== t.value) {
          next = { ...next, value };
          repaired++;
        }
      }

      // The step itself.
      const renamedTo = renames.get(t.name);
      if (renamedTo) next = { ...next, name: renamedTo };

      return next;
    });
  }

  const nextComponents = (components || []).map(comp => {
    if (!comp || !componentReferrers.has(comp.id)) return comp;
    const mapped = { ...(comp.tokens || {}) };
    let touched = false;
    for (const [prop, val] of Object.entries(mapped)) {
      let next = val;
      for (const [oldName, newName] of renames) next = repointValue(next, oldName, newName);
      if (next !== val) { mapped[prop] = next; touched = true; repaired++; }
    }
    return touched ? { ...comp, tokens: mapped } : comp;
  });

  return {
    ok: true,
    tokens: nextTokens,
    components: nextComponents,
    role: newRole,
    renamed: renames.size,
    repaired,
  };
};

/**
 * Rebuilds a ramp around a new base colour.
 *
 * `main` becomes the new colour byte for byte — the rule buildRamp already follows, because
 * the colour a designer picked is the colour they meant.
 *
 * A step is only rebuilt when its current value is what the generator would have produced
 * from the old base. Anything else was tuned by hand and is left alone, and named in `kept`
 * so the caller can say so rather than silently overwriting or silently skipping.
 */
export const recolorRamp = (tokens, role, newHex) => {
  const base = rampStep(newHex, RAMP_BASE_STEP);
  if (!base) return { ok: false, reason: newHex + ' is not a colour I can read.' };

  const steps = new Map();
  eachToken(tokens, (t) => {
    const m = rampMemberOf(t.name);
    if (m && m.role === role) steps.set(m.step, t);
  });
  const current = steps.get(RAMP_BASE_STEP);
  if (!current) return { ok: false, reason: 'That ramp has no base step to work from.' };

  const oldBase = String(current.value || '').trim();
  const same = (a, b) => String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
  if (same(oldBase, newHex)) return { ok: false, reason: 'unchanged' };

  const kept = [];
  const nextValues = new Map();
  for (const step of RAMP_STEPS) {
    // RAMP_STEPS holds numbers for 50-950; rampMemberOf reads steps out of a name, so they
    // arrive as strings. Comparing the two directly misses every numeric step.
    const key = String(step);
    const token = steps.get(key);
    if (!token) continue;
    if (key === RAMP_BASE_STEP) { nextValues.set(token.name, base); continue; }
    const generated = rampStep(oldBase, step);
    if (generated && same(token.value, generated)) {
      nextValues.set(token.name, rampStep(newHex, step));
    } else {
      kept.push(key);
    }
  }

  const nextTokens = {};
  for (const cat in tokens || {}) {
    if (!Array.isArray(tokens[cat])) { nextTokens[cat] = tokens[cat]; continue; }
    nextTokens[cat] = tokens[cat].map(t => {
      const value = t && nextValues.get(t.name);
      return value ? { ...t, value } : t;
    });
  }

  return { ok: true, tokens: nextTokens, changed: nextValues.size, kept };
};
