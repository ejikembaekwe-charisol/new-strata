// A small cross-project vault for Figma access tokens.
//
// Deliberately its own storage key, separate from `strata_projects`, so the secret lives in
// exactly one place instead of being copied into every project that uses it.
//
// THIS IS NOT ENCRYPTION. There is no backend, so anything reversible would keep its key in
// the same browser, and localStorage is readable from devtools regardless. What this does buy:
// the secret is never rendered again after saving, and it is stored once rather than duplicated.
//
// The machinery moved to secretVault.js when LLM keys needed the same thing. Nothing about the
// stored data changed: same `strata_figma_tokens` array, same field names, same `ft-` ids, same
// sessionStorage map — a vault saved before this split reads back identically after it.

import { createVault, fingerprintOf, maskSecret, relativeTime } from './secretVault';

const vault = createVault({
  storageKey: 'strata_figma_tokens',
  sessionKey: 'strata_figma_session',
  idPrefix: 'ft-',
  label: 'Figma token vault',
});

export const {
  listTokens, getToken, getSecret, saveToken, renameToken, deleteToken, touchToken,
  setSessionToken, getSessionToken, hasSessionToken, clearSessionToken,
} = vault;

export { fingerprintOf, maskSecret, relativeTime };
