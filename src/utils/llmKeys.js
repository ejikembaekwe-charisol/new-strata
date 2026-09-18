// The same vault as the Figma one, holding the API key a user brings to Strata Forge.
//
// THIS IS NOT ENCRYPTION — see secretVault.js. And one thing is worth saying out loud that a
// Figma token did not need: these keys carry direct billing. Anyone who can read this browser
// can spend money with them, so the UI offers "just this tab" as a first-class choice rather
// than as a lesser option.
//
// The key belongs to the person, not to the project: entries are scoped by `owner` (the signed
// in email), exactly as Figma tokens are, so opening someone else's project never surfaces
// their key and never hands yours over.

import { createVault, fingerprintOf, maskSecret, relativeTime } from './secretVault';

const vault = createVault({
  storageKey: 'strata_llm_keys',
  sessionKey: 'strata_llm_session',
  idPrefix: 'lk-',
  label: 'model key vault',
  extraFields: ['provider', 'baseUrl'],
  // The same key string against two different custom base URLs — Ollama on :11434 and
  // OpenRouter, say — is two genuinely different connections, and collapsing them into one
  // row would lose whichever was saved second.
  dedupeFields: ['provider', 'baseUrl'],
});

export const {
  getToken: getKey,
  getSecret,
  renameToken: renameKey,
  deleteToken: deleteKey,
  touchToken: touchKey,
  setSessionToken, getSessionToken, hasSessionToken, clearSessionToken,
} = vault;

/** Saved keys for this person, newest use first, optionally narrowed to one provider. */
export function listKeys(owner, providerId) {
  const all = vault.listTokens(owner);
  return providerId ? all.filter(k => k.provider === providerId) : all;
}

/** @returns {Promise<{ entry: object, deduped: boolean, persisted: boolean }>} */
export function saveKey({ owner, name, secret, provider, baseUrl = '' }) {
  return vault.saveToken({ owner, name, secret, provider, baseUrl });
}

/**
 * An unsaved key is held per project *and* provider, so switching provider inside one project
 * does not silently reuse the key typed for the previous one.
 */
export const sessionScope = (projectId, providerId) =>
  String(projectId || '') + '::' + String(providerId || '');

export { fingerprintOf, maskSecret, relativeTime };
