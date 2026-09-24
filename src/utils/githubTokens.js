// The same vault again, holding a GitHub personal access token.
//
// THIS IS NOT ENCRYPTION — see secretVault.js. And this one deserves a sentence the other two
// did not need: a Figma token reads a design file and a model key spends money, but this token
// **writes to repositories**. It is the first credential in Strata that can change something
// outside this browser, and for most people a repository is worth more than a month's API
// spend. So "just this tab" is the default the form offers, and the copy says what the token
// can do rather than only where it is kept.
//
// No extraFields and no dedupeFields, unlike llmKeys: there is no provider and no base URL
// here. api.github.com is the only destination, hardcoded in data/github.js, and the token
// string is the whole identity — so two entries with the same fingerprint are the same token,
// full stop.
//
// The token belongs to the person, not the project: entries are scoped by `owner` (the signed
// in email), exactly as the other two vaults are.

import { createVault, fingerprintOf, maskSecret, relativeTime } from './secretVault';

const vault = createVault({
  storageKey: 'strata_github_tokens',
  sessionKey: 'strata_github_session',
  idPrefix: 'gh-',
  label: 'GitHub token vault',
});

export const {
  listTokens, getToken, getSecret, saveToken, renameToken, deleteToken, touchToken,
  setSessionToken, getSessionToken, hasSessionToken, clearSessionToken,
} = vault;

/** One scope per person, not per project: the token is the account, and accounts are not scoped. */
export const GITHUB_SESSION_SCOPE = 'github';

export { fingerprintOf, maskSecret, relativeTime };
