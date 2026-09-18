// The mechanics behind a cross-project secret vault, with the storage keys passed in.
//
// This is figmaTokens.js's machinery, lifted out so a second kind of secret — an LLM API key —
// can reuse it rather than grow a second copy that drifts. figmaTokens.js is now a thin wrapper
// over createVault and keeps its exact export list, so nothing that imports it changed.
//
// THIS IS NOT ENCRYPTION. There is no backend, so anything reversible would keep its key in
// the same browser, and localStorage is readable from devtools regardless. What this does buy:
// the secret is never rendered again after saving, and it is stored once rather than duplicated.
//
// Two rules keep a migration from being an event, and both are load-bearing:
//   1. readAll never writes. A read-repair-persist pattern would mean that merely opening the
//      app rewrites every vault a user already has, turning any future bug in here into data
//      loss for data that predates it.
//   2. Nothing runs at import time. createVault only builds closures.

/**
 * SHA-256 via Web Crypto. `crypto.subtle` only exists in a secure context — a plain-http
 * dev run over a LAN IP (`vite --host`) has no `subtle` at all — so this falls back to a
 * non-cryptographic FNV-1a digest and reports which algorithm it actually used. Callers
 * label the result with `algo`, so the UI never claims SHA-256 when it did something weaker.
 * @returns {Promise<{ algo: 'sha-256' | 'fnv-1a', hex: string }>}
 */
export async function fingerprintOf(secret) {
  const text = String(secret ?? '');
  if (globalThis.crypto?.subtle?.digest) {
    try {
      const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      return { algo: 'sha-256', hex };
    } catch {
      // fall through to the weak digest below
    }
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return { algo: 'fnv-1a', hex: h.toString(16).padStart(8, '0') };
}

/**
 * figd_abc...4a2f → "figd_••••••••4a2f". Keeps the prefix so the kind of secret stays
 * recognisable.
 *
 * The prefix match accepts a dash as well as an underscore: Figma writes `figd_`, but
 * Anthropic writes `sk-ant-` and OpenAI `sk-proj-`, which the underscore-only form missed
 * entirely and masked with no prefix at all. Every `_` prefix produces the same output it
 * always did — this is a strict widening.
 */
export function maskSecret(secret) {
  const s = String(secret ?? '').trim();
  if (!s) return '';
  const last4 = s.slice(-4);
  const m = s.match(/^([A-Za-z]+[-_])/);
  const prefix = m ? m[1] : '';
  const hiddenCount = Math.max(4, Math.min(12, s.length - prefix.length - 4));
  return prefix + '•'.repeat(hiddenCount) + last4;
}

/** "2 days ago" style, for the saved-secret rows. */
export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return new Date(iso).toLocaleDateString();
}

const ownerOf = (owner) => owner || '';

/**
 * Builds one vault over a pair of storage keys.
 *
 * @param {object} cfg
 * @param {string} cfg.storageKey   localStorage key holding the saved array
 * @param {string} cfg.sessionKey   sessionStorage key holding the unsaved map
 * @param {string} cfg.idPrefix     entry id prefix, e.g. 'ft-'
 * @param {string} cfg.label        used only in console warnings
 * @param {string[]} cfg.extraFields  fields copied from the save input onto the entry
 * @param {string[]} cfg.dedupeFields fields that must also match for a save to be a rename
 */
export function createVault({
  storageKey,
  sessionKey,
  idPrefix = 'sv-',
  label = 'secret vault',
  extraFields = [],
  dedupeFields = [],
}) {
  const readAll = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read the ' + label, e);
      return [];
    }
  };

  const writeAll = (entries) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch (e) {
      console.warn('Could not write the ' + label, e);
      return false;
    }
  };

  const listTokens = (owner) => {
    const o = ownerOf(owner);
    return readAll()
      .filter(t => ownerOf(t.owner) === o)
      .sort((a, b) => String(b.lastUsedAt || b.createdAt || '').localeCompare(String(a.lastUsedAt || a.createdAt || '')));
  };

  const getToken = (id) => readAll().find(t => t.id === id) || null;

  /** The only function that hands back the raw secret. Call it at the point of use, not to render. */
  const getSecret = (id) => getToken(id)?.secret || '';

  /**
   * Saves a secret, or renames the existing entry when the same one is already stored —
   * matching on fingerprint (plus any dedupeFields) so re-pasting never produces a duplicate.
   *
   * `persisted` is reported because localStorage can refuse a write on a full quota, and a
   * save that silently failed used to read as a save that worked.
   * @returns {Promise<{ entry: object, deduped: boolean, persisted: boolean }>}
   */
  const saveToken = async (input) => {
    const { owner, name, secret } = input || {};
    const clean = String(secret ?? '').trim();
    if (!clean) throw new Error('A value is required');
    const labelText = String(name ?? '').trim() || 'Untitled';
    const { algo, hex } = await fingerprintOf(clean);
    const now = new Date().toISOString();
    const all = readAll();
    const o = ownerOf(owner);

    const extras = {};
    for (const f of extraFields) extras[f] = input?.[f] ?? '';

    const matches = (t) => ownerOf(t.owner) === o && t.fingerprint === hex
      && dedupeFields.every(f => (t[f] ?? '') === (extras[f] ?? ''));

    const existing = all.find(matches);
    if (existing) {
      existing.name = labelText;
      existing.lastUsedAt = now;
      existing.secret = clean; // same fingerprint, but keep the freshest copy
      const persisted = writeAll(all);
      return { entry: { ...existing }, deduped: true, persisted };
    }

    const entry = {
      id: idPrefix + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
      owner: o,
      name: labelText,
      secret: clean,
      fingerprint: hex,
      algo,
      last4: clean.slice(-4),
      ...extras,
      createdAt: now,
      lastUsedAt: now,
    };
    const persisted = writeAll([entry, ...all]);
    return { entry: { ...entry }, deduped: false, persisted };
  };

  const renameToken = (id, name) => {
    const all = readAll();
    const t = all.find(x => x.id === id);
    if (!t) return null;
    t.name = String(name ?? '').trim() || t.name;
    writeAll(all);
    return { ...t };
  };

  const deleteToken = (id) => {
    const all = readAll();
    const next = all.filter(t => t.id !== id);
    writeAll(next);
    return next.length !== all.length;
  };

  const touchToken = (id) => {
    const all = readAll();
    const t = all.find(x => x.id === id);
    if (!t) return null;
    t.lastUsedAt = new Date().toISOString();
    writeAll(all);
    return { ...t };
  };

  // ── Unsaved secrets — kept for this browser tab only ──────────────────────
  //
  // When someone declines to save, it goes here instead of into the vault or the project.
  // sessionStorage dies with the tab, so an unsaved secret survives a reload during setup and
  // leaves no residue afterwards: nothing about it is written to `strata_projects`, not even
  // a masked hint.

  const readSession = () => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeSession = (map) => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(map));
    } catch (e) {
      console.warn('Could not write the session store for the ' + label, e);
    }
  };

  const setSessionToken = (scope, secret) => {
    if (!scope) return;
    const map = readSession();
    map[String(scope)] = String(secret ?? '');
    writeSession(map);
  };

  const getSessionToken = (scope) => {
    if (!scope) return '';
    return readSession()[String(scope)] || '';
  };

  const hasSessionToken = (scope) => Boolean(getSessionToken(scope));

  const clearSessionToken = (scope) => {
    if (!scope) return;
    const map = readSession();
    if (!(String(scope) in map)) return;
    delete map[String(scope)];
    writeSession(map);
  };

  return {
    listTokens, getToken, getSecret, saveToken, renameToken, deleteToken, touchToken,
    setSessionToken, getSessionToken, hasSessionToken, clearSessionToken,
  };
}
