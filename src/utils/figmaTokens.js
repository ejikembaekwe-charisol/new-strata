// A small cross-project vault for Figma access tokens.
//
// Deliberately its own storage key, separate from `strata_projects`, so the secret lives in
// exactly one place instead of being copied into every project that uses it.
//
// THIS IS NOT ENCRYPTION. There is no backend, so anything reversible would keep its key in
// the same browser, and localStorage is readable from devtools regardless. What this does buy:
// the secret is never rendered again after saving, and it is stored once rather than duplicated.

const KEY = 'strata_figma_tokens';

const readAll = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Could not read the Figma token vault', e);
    return [];
  }
};

const writeAll = (entries) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    return true;
  } catch (e) {
    console.warn('Could not write the Figma token vault', e);
    return false;
  }
};

const ownerOf = (owner) => owner || '';

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
    } catch (e) {
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

/** figd_abc...4a2f → "figd_••••••••4a2f". Keeps the prefix so the kind of token stays recognisable. */
export function maskSecret(secret) {
  const s = String(secret ?? '').trim();
  if (!s) return '';
  const last4 = s.slice(-4);
  const m = s.match(/^([A-Za-z]+_)/);
  const prefix = m ? m[1] : '';
  const hiddenCount = Math.max(4, Math.min(12, s.length - prefix.length - 4));
  return prefix + '•'.repeat(hiddenCount) + last4;
}

export function listTokens(owner) {
  const o = ownerOf(owner);
  return readAll()
    .filter(t => ownerOf(t.owner) === o)
    .sort((a, b) => String(b.lastUsedAt || b.createdAt || '').localeCompare(String(a.lastUsedAt || a.createdAt || '')));
}

export function getToken(id) {
  return readAll().find(t => t.id === id) || null;
}

/** The only function that hands back the raw secret. Call it at the point of use, not to render. */
export function getSecret(id) {
  return getToken(id)?.secret || '';
}

/**
 * Saves a token, or renames the existing entry when the same secret is already stored —
 * matching on fingerprint so re-pasting a token never produces a duplicate row.
 * @returns {Promise<{ entry: object, deduped: boolean }>}
 */
export async function saveToken({ owner, name, secret }) {
  const clean = String(secret ?? '').trim();
  if (!clean) throw new Error('A token value is required');
  const label = String(name ?? '').trim() || 'Untitled token';
  const { algo, hex } = await fingerprintOf(clean);
  const now = new Date().toISOString();
  const all = readAll();
  const o = ownerOf(owner);

  const existing = all.find(t => ownerOf(t.owner) === o && t.fingerprint === hex);
  if (existing) {
    existing.name = label;
    existing.lastUsedAt = now;
    existing.secret = clean; // same fingerprint, but keep the freshest copy
    writeAll(all);
    return { entry: { ...existing }, deduped: true };
  }

  const entry = {
    id: 'ft-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
    owner: o,
    name: label,
    secret: clean,
    fingerprint: hex,
    algo,
    last4: clean.slice(-4),
    createdAt: now,
    lastUsedAt: now,
  };
  writeAll([entry, ...all]);
  return { entry: { ...entry }, deduped: false };
}

export function renameToken(id, name) {
  const all = readAll();
  const t = all.find(x => x.id === id);
  if (!t) return null;
  t.name = String(name ?? '').trim() || t.name;
  writeAll(all);
  return { ...t };
}

export function deleteToken(id) {
  const all = readAll();
  const next = all.filter(t => t.id !== id);
  writeAll(next);
  return next.length !== all.length;
}

export function touchToken(id) {
  const all = readAll();
  const t = all.find(x => x.id === id);
  if (!t) return null;
  t.lastUsedAt = new Date().toISOString();
  writeAll(all);
  return { ...t };
}

/** "2 days ago" style, for the saved-token rows. */
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

// ---------------------------------------------------------------------------
// Unsaved tokens — kept for this browser tab only.
//
// When someone declines to save a token, it goes here instead of into the vault or the
// project. sessionStorage dies with the tab, so an unsaved token survives a reload during
// setup and leaves no residue afterwards: nothing about it is written to `strata_projects`,
// not even a masked hint.

const SESSION_KEY = 'strata_figma_session';

const readSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
};

const writeSession = (map) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not write the session token store', e);
  }
};

export function setSessionToken(projectId, secret) {
  if (!projectId) return;
  const map = readSession();
  map[String(projectId)] = String(secret ?? '');
  writeSession(map);
}

export function getSessionToken(projectId) {
  if (!projectId) return '';
  return readSession()[String(projectId)] || '';
}

export function hasSessionToken(projectId) {
  return Boolean(getSessionToken(projectId));
}

export function clearSessionToken(projectId) {
  if (!projectId) return;
  const map = readSession();
  if (!(String(projectId) in map)) return;
  delete map[String(projectId)];
  writeSession(map);
}
