// Talking to GitHub from a page that has no server behind it.
//
// Three things set the shape of this file.
//
// **One origin, hardcoded.** `API` below is the only destination any function here will send a
// token to, and there is deliberately no baseUrl parameter — the opposite of the `custom`
// provider in llmProviders.js. A credential that can write to somebody's repository should have
// exactly one possible destination, checkable by reading the top of the file. The one place a
// URL arrives from outside is the pagination `Link` header, and that one is origin-checked
// before it is followed.
//
// **Why a token and not "Sign in with GitHub".** OAuth needs a client secret exchanged on a
// server. There is no server. The device flow does not rescue it either: GitHub's token
// endpoint sends no CORS headers, so a browser cannot complete it. A personal access token
// against api.github.com is the one path that genuinely works from a page, which is why it is
// the only one offered.
//
// **Never rejects, and `reachedGitHub` gates every sentence.** Same contract as testKey and
// probeServer: every path resolves to a flat result, and nothing may be said about the token,
// the account or the repository unless GitHub actually answered. Every request here is
// preflighted — Authorization is not a CORS-safelisted header — and a failed preflight arrives
// in JS as the same bare TypeError as an offline machine, a proxy, or an extension blocking
// api.github.com. So a transport failure never names a cause.
//
// commitFiles adds a second, stronger boolean, because "did GitHub answer" and "did the
// repository change" are different questions and the second one has a real unknown. See
// `mutationCertainty`.

const API = 'https://api.github.com';

/** GitHub attributes the commit to the token's own account when we say nothing. */
const COMMIT_HEADERS = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

/**
 * A token that cannot go in a header would make fetch throw, and the catch would report that
 * as `blocked` — a lie, because nothing was sent and the fault was the input, not the network.
 * So it is checked here and refused without a request.
 */
const headerSafe = (secret) => /^[\x21-\x7E]+$/.test(String(secret || ''));

const authHeaders = (secret) => ({ ...COMMIT_HEADERS, Authorization: 'Bearer ' + secret });

/** Branch names may contain slashes — feature/x is legal — so those survive encoding. */
const encodeBranch = (b) => String(b).split('/').map(encodeURIComponent).join('/');

const base = (status, extra = {}) => ({
  status,
  // True only when GitHub answered. Nothing may be asserted about the token unless it is.
  reachedGitHub: false,
  httpStatus: null,
  message: '',
  detail: '',
  rateLimit: null,
  checkedAt: new Date().toISOString(),
  durationMs: 0,
  ...extra,
});

/** GitHub's own prose for protected branches and required checks beats anything we would write. */
const githubMessage = (json, text) => {
  const parts = [];
  if (json?.message) parts.push(json.message);
  for (const e of json?.errors || []) if (e?.message) parts.push(e.message);
  const joined = parts.join(' ') || String(text || '').slice(0, 200);
  return joined.length > 300 ? joined.slice(0, 300) + '…' : joined;
};

const readRateLimit = (headers) => {
  const limit = headers.get('x-ratelimit-limit');
  if (limit === null) return null;
  const reset = Number(headers.get('x-ratelimit-reset') || 0);
  return {
    limit: Number(limit),
    remaining: Number(headers.get('x-ratelimit-remaining') || 0),
    used: Number(headers.get('x-ratelimit-used') || 0),
    // A Unix second, and the Date header is not readable, so this can only be compared against
    // a local clock that may be wrong. The UI says "about N minutes", never a wall-clock time.
    resetAt: reset ? new Date(reset * 1000).toISOString() : '',
    resource: headers.get('x-ratelimit-resource') || '',
  };
};

const retryAfterOf = (headers) => {
  const raw = Number(headers.get('retry-after') || 0);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
};

/** 429, or a 403 that is really a rate limit. Checked before `forbidden`, deliberately. */
const isRateLimited = (res) => res.status === 429
  || (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || retryAfterOf(res.headers) > 0));

/**
 * `required; url=https://github.com/orgs/acme/sso?...` — the difference between "your token is
 * wrong" and "authorise the token you already have". The URL comes from a header, so it is
 * checked before it is ever put in an href.
 */
const ssoUrlOf = (headers) => {
  const raw = headers.get('x-github-sso') || '';
  const m = /url=(\S+)/.exec(raw);
  if (!m) return '';
  try {
    const u = new URL(m[1]);
    return u.origin === 'https://github.com' ? u.toString() : '';
  } catch {
    return '';
  }
};

/**
 * One request. **Never throws.** Returns what happened, not what it meant.
 * @returns {Promise<{answered: boolean, aborted: boolean, timedOut: boolean, res: Response|null,
 *   json: any, text: string}>}
 */
async function call(url, { secret, method = 'GET', body, timeoutMs = 15000, signal } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), Math.max(1, timeoutMs));
  const onOuter = () => ctrl.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) onOuter();
    else signal.addEventListener('abort', onOuter, { once: true });
  }
  try {
    const res = await fetch(url, {
      method,
      headers: body
        ? { ...authHeaders(secret), 'Content-Type': 'application/json' }
        : authHeaders(secret),
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: ctrl.signal,
    });
    const text = await res.text().catch(() => '');
    // An abort between the headers and the body would otherwise read as a malformed answer.
    if (ctrl.signal.aborted) {
      return { answered: false, aborted: true, timedOut: ctrl.signal.reason?.name === 'TimeoutError', res: null, json: null, text: '' };
    }
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { answered: true, aborted: false, timedOut: false, res, json, text };
  } catch {
    const timedOut = ctrl.signal.reason?.name === 'TimeoutError';
    return { answered: false, aborted: ctrl.signal.aborted, timedOut, res: null, json: null, text: '' };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuter);
  }
}

/** The same four sentences wherever a request did not come back. Never names a cause. */
const transportResult = (out, what) => {
  if (out.timedOut) {
    return base('timeout', { message: 'GitHub did not answer in time' + (what ? ' while ' + what : '') + '.' });
  }
  if (out.aborted) return base('cancelled', { message: 'Cancelled.' });
  return base('blocked', {
    message: 'Nothing came back from api.github.com. The browser gives no reason it can be asked about, so Strata cannot tell which of these it was:',
    possibilities: [
      'This machine has no route to api.github.com right now.',
      'An extension, a proxy or a network policy is blocking it.',
      'Something between this browser and GitHub is answering for it.',
    ],
  });
};

/** A non-2xx answer, classified in the one order that does not lie. */
const classify = (res, json, text) => {
  const detail = githubMessage(json, text);
  const shared = { reachedGitHub: true, httpStatus: res.status, detail, rateLimit: readRateLimit(res.headers) };
  if (res.status === 401) {
    return base('rejected', { ...shared, message: 'GitHub refused this token. It is wrong, expired, or has been revoked.' });
  }
  // Before `forbidden`: an SSO wall and a rate limit are both 403s, and calling either one a
  // permissions problem would be a claim about the token that was never observed.
  // The header's presence is the signal; its URL is a separate question. A link that does not
  // point at github.com is dropped rather than rendered, and the wall is still a wall.
  if (res.status === 403 && res.headers.get('x-github-sso') !== null) {
    return base('sso-required', {
      ...shared,
      ssoUrl: ssoUrlOf(res.headers),
      message: 'This token has not been authorised for that organisation’s single sign-on.',
    });
  }
  if (isRateLimited(res)) {
    return base('rate-limited', {
      ...shared,
      retryAfterSec: retryAfterOf(res.headers),
      message: 'GitHub is rate-limiting this token. This says nothing about whether the token is good.',
    });
  }
  if (res.status === 403) {
    return base('forbidden', { ...shared, message: 'GitHub refused the request. The token is real; this particular thing was not allowed.' });
  }
  if (res.status === 404) {
    return base('not-found', { ...shared, message: 'GitHub answered 404.' });
  }
  return base('github-error', { ...shared, message: 'GitHub answered ' + res.status + '.' });
};

// ── who the token belongs to ──────────────────────────────────────────────────

/**
 * GET /user.
 *
 * This is authentication, not authorisation: it says the token works and whose it is, and
 * nothing whatever about which repositories it can see or push to. That is knowable only per
 * repository, from the first step of commitFiles.
 *
 * @returns {Promise<{status: string, reachedGitHub: boolean,
 *   account: {login: string, name: string, avatarUrl: string, htmlUrl: string}|null,
 *   scopes: string[]|null, scopesReported: boolean, tokenKindGuess: string,
 *   rateLimit: object|null, message: string, detail: string,
 *   checkedAt: string, durationMs: number}>}
 */
export async function verifyToken(secret, { timeoutMs = 15000, signal } = {}) {
  const started = Date.now();
  const done = (r) => ({
    account: null, scopes: null, scopesReported: false, tokenKindGuess: '',
    possibilities: [], ...r, durationMs: Date.now() - started,
  });

  if (!String(secret || '').trim()) {
    return done(base('bad-token', { message: 'Paste a token first.' }));
  }
  if (!headerSafe(secret)) {
    return done(base('bad-token', {
      message: 'That does not look like a token Strata can send — it has characters that cannot go in a request header. Nothing was sent.',
    }));
  }

  const out = await call(API + '/user', { secret, timeoutMs, signal });
  if (!out.answered) return done(transportResult(out, 'checking the token'));

  const { res, json, text } = out;
  if (!res.ok) return done(classify(res, json, text));
  // A 200 that is not an account is not a working token: a proxy or a captive portal answering
  // with an HTML page reaches us as a perfectly good 200.
  if (!json || !json.login) {
    return done(base('github-error', {
      reachedGitHub: true, httpStatus: res.status, detail: String(text || '').slice(0, 200),
      message: 'Something answered for api.github.com with a 200 that is not a GitHub account. Strata will not treat that as a working token.',
    }));
  }

  // Three-way, and the middle case is the one that gets misreported. `get` returns null for an
  // absent header and '' for a present-but-empty one, which is the whole distinction.
  const rawScopes = res.headers.get('x-oauth-scopes');
  const scopes = rawScopes === null ? null : rawScopes.split(',').map(s => s.trim()).filter(Boolean);
  const rateLimit = readRateLimit(res.headers);

  // An authenticated call is allowed 5000/hour and an anonymous one 60. A 200 from /user with
  // the anonymous limit is impossible in principle, so it means something is rewriting the
  // request rather than that everything is fine.
  const looksAnonymous = rateLimit !== null && rateLimit.limit > 0 && rateLimit.limit <= 60;

  const login = json?.login || '';
  return done(base('ok', {
    reachedGitHub: true,
    httpStatus: res.status,
    rateLimit,
    account: {
      login,
      name: json?.name || '',
      avatarUrl: json?.avatar_url || '',
      htmlUrl: json?.html_url || '',
    },
    scopes,
    scopesReported: rawScopes !== null,
    tokenKindGuess: /^github_pat_/.test(secret) ? 'fine-grained'
      : /^ghp_/.test(secret) ? 'classic'
        : /^gh[ous]_/.test(secret) ? 'oauth-or-app' : '',
    message: looksAnonymous
      ? 'GitHub answered, but reported the rate limit of an unauthenticated caller. Something between this browser and GitHub may be altering the request.'
      : 'GitHub accepted this token — it belongs to @' + login + '. That is all it proves: it does not say which repositories the token can see, or whether it can push to any of them.',
  }));
}

// ── what the token can see ────────────────────────────────────────────────────

/** `<https://api.github.com/user/repos?page=2>; rel="next"` */
const nextLink = (headers) => {
  for (const part of String(headers.get('link') || '').split(',')) {
    const m = /<([^>]+)>\s*;\s*rel="next"/.exec(part.trim());
    if (m) return m[1];
  }
  return '';
};

const repoRow = (r) => ({
  fullName: r.full_name,
  owner: r.owner?.login || '',
  name: r.name,
  private: Boolean(r.private),
  defaultBranch: r.default_branch || 'main',
  canPush: r.permissions?.push === true,
  archived: Boolean(r.archived),
  fork: Boolean(r.fork),
  updatedAt: r.updated_at || '',
  htmlUrl: r.html_url || '',
});

/**
 * GET /user/repos — the repositories this token can see.
 *
 * `/user/repos`, never `/users/{login}/repos`: the latter lists only public repositories owned
 * by that login, silently dropping every private one and every repository the person is a
 * collaborator on. GitHub's defaults here (all visibility, owner + collaborator + org member)
 * are the ones we want.
 *
 * **A short list looks exactly like a complete one**, and there are three ways a repository is
 * silently absent with a 200: a fine-grained token scoped to selected repositories, a classic
 * token without `repo`, and an org enforcing SAML that the token is not authorised for. So the
 * UI never calls this "your repositories", and `complete` is reported rather than implied.
 */
export async function listRepos(secret, { maxPages = 5, timeoutMs = 20000, signal } = {}) {
  const started = Date.now();
  const done = (r) => ({ repos: [], complete: false, pageCount: 0, possibilities: [], ...r, durationMs: Date.now() - started });

  if (!headerSafe(secret)) return done(base('bad-token', { message: 'Connect a token first.' }));

  let url = API + '/user/repos?per_page=100&sort=updated';
  const repos = [];
  let pageCount = 0;

  while (url && pageCount < maxPages) {
    const out = await call(url, { secret, timeoutMs, signal });
    if (!out.answered) {
      // Whatever arrived before the failure is still true, so it is kept and labelled partial.
      return done({ ...transportResult(out, 'listing repositories'), repos, pageCount });
    }
    if (!out.res.ok) return done({ ...classify(out.res, out.json, out.text), repos, pageCount });

    // A body that is not a list would make for-of throw, and nothing here may throw.
    for (const r of (Array.isArray(out.json) ? out.json : [])) if (r?.full_name) repos.push(repoRow(r));
    pageCount += 1;

    const next = nextLink(out.res.headers);
    // The one URL in this module that comes from outside. A header is not a reason to send
    // somebody's token somewhere else, so the origin is checked rather than trusted.
    if (!next) { url = ''; break; }
    let sameOrigin;
    try { sameOrigin = new URL(next).origin === API; } catch { sameOrigin = false; }
    if (!sameOrigin) {
      return done(base('ok', {
        reachedGitHub: true, httpStatus: 200, repos, pageCount, complete: false,
        message: 'GitHub’s next-page link pointed somewhere other than api.github.com, so Strata stopped rather than send the token there.',
      }));
    }
    url = next;
  }

  return done(base('ok', {
    reachedGitHub: true,
    httpStatus: 200,
    repos,
    pageCount,
    complete: !url,
    message: repos.length + ' repositor' + (repos.length === 1 ? 'y' : 'ies') + ' this token can see.',
  }));
}

// ── writing a commit ──────────────────────────────────────────────────────────

/**
 * base64 of the UTF-8 bytes, chunked.
 *
 * Not `encoding: 'utf-8'`: the bundle is generated text full of em dashes and curly quotes, and
 * base64 of encoded bytes is unambiguous where that is fragile. Not `btoa(unescape(...))`
 * either, which is wrong above the BMP. The chunking is not decoration — spreading a 100KB
 * array into fromCharCode exceeds the argument limit and throws.
 */
export function toBase64(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** The branch a first commit should land on: namespaced, dated, and never the default one. */
export const suggestBranch = (slug, when = new Date()) =>
  'strata/' + (slug || 'handoff') + '-' + when.toISOString().slice(0, 10);

const cleanFolder = (path) => String(path || '').trim().replace(/^\/+|\/+$/g, '');

const badFolder = (path) => /\\/.test(path) || path.split('/').some(seg => seg === '..' || seg === '.git');

const step = (onStep, name, index, total, phase, mutating = false) => {
  if (typeof onStep === 'function') onStep({ step: name, index, total, phase, mutating });
};

/**
 * Writes `files` into one commit on one branch.
 *
 * **Why the Git Data API and not Contents.** PUT /contents is one call per file and shorter
 * code — and it produces six separate commits, each individually visible, so a failure at file
 * four leaves the branch permanently half-updated. The blobs → tree → commit → ref sequence
 * produces one commit, and nothing is visible until the last request. That property is what
 * lets a failure report say, truthfully, that the repository is unchanged.
 *
 * `branch` is required and has no default here. A data module that silently picks a write
 * target is exactly the hidden behaviour that makes a mutation surprising; the default is
 * computed in the UI where it can be read and edited before anything is sent.
 *
 * **`force` is not a parameter, not a setting, and the word does not appear below.** Without
 * it GitHub applies the fast-forward rule, so a branch that moved since we read it rejects the
 * update with 422 — and that 422 is the whole safety mechanism. With it, every commit made in
 * between is discarded silently. The only thing the option could buy is the accident.
 *
 * @returns {Promise<{status: string, reachedGitHub: boolean,
 *   mutationCertainty: 'none'|'applied'|'unknown', failedStep: string, ...}>}
 */
export async function commitFiles({
  secret, owner, repo, branch, baseBranch = '', path = 'strata',
  message = 'Update design system from Strata', files = [], onStep,
  timeoutMs = 20000, signal,
} = {}) {
  const started = Date.now();
  const folder = cleanFolder(path);
  const paths = files.map(f => (folder ? folder + '/' + f.name : f.name));
  const done = (r) => ({
    mutationCertainty: 'none', failedStep: '', owner, repo, branch,
    branchCreated: false, baseBranch, parentSha: '', treeSha: '', commitSha: '',
    htmlUrl: '', paths, written: [], overwrote: [], possibilities: [],
    ...r,
    durationMs: Date.now() - started,
  });

  if (!headerSafe(secret)) return done(base('bad-token', { message: 'Connect a token first.' }));
  if (!owner || !repo) return done(base('bad-input', { message: 'Choose a repository first.' }));
  if (!String(branch || '').trim()) return done(base('bad-input', { message: 'Name the branch to commit to.' }));
  if (badFolder(folder)) return done(base('bad-input', { message: 'That folder is not one Strata will write to.' }));
  if (!files.length) return done(base('bad-input', { message: 'There are no files to commit.' }));

  const repoUrl = API + '/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo);
  const total = 5 + files.length + 3;
  let n = 0;
  const failed = (name, res, json, text) => done({ ...classify(res, json, text), failedStep: name });

  // 1 ─ the repository itself. Read-only, and it answers two questions that would otherwise
  // only surface at the very last request, after everything had been uploaded.
  step(onStep, 'repo', (n += 1), total, 'start');
  const repoOut = await call(repoUrl, { secret, timeoutMs, signal });
  if (!repoOut.answered) return done({ ...transportResult(repoOut, 'looking up the repository'), failedStep: 'repo' });
  if (!repoOut.res.ok) {
    if (repoOut.res.status === 404) {
      return done({
        ...classify(repoOut.res, repoOut.json, repoOut.text),
        failedStep: 'repo',
        message: 'GitHub answered 404. That means either there is no repository at ' + owner + '/' + repo
          + ', or there is one and this token cannot see it — GitHub answers the same way for both, on purpose.',
      });
    }
    return failed('repo', repoOut.res, repoOut.json, repoOut.text);
  }
  const repoJson = repoOut.json || {};
  if (repoJson.archived) {
    return done(base('archived', {
      reachedGitHub: true, httpStatus: 200, failedStep: 'repo',
      message: owner + '/' + repo + ' is archived, and archived repositories do not accept writes. Nothing was sent.',
    }));
  }
  if (repoJson.permissions && repoJson.permissions.push !== true) {
    return done(base('no-push', {
      reachedGitHub: true, httpStatus: 200, failedStep: 'repo',
      message: 'This token can read ' + owner + '/' + repo + ' but not push to it. Nothing was sent.',
    }));
  }
  const defaultBranch = repoJson.default_branch || 'main';
  step(onStep, 'repo', n, total, 'done');

  // 2 ─ the base. Singular `git/ref/`, never the plural matching endpoint: `refs/heads/main`
  // also prefix-matches `main-experiment`, and parenting on the wrong branch is a silent wrong
  // answer rather than an error.
  const refUrl = (b) => repoUrl + '/git/ref/heads/' + encodeBranch(b);
  const wantedBase = baseBranch || defaultBranch;
  step(onStep, 'base-ref', (n += 1), total, 'start');
  const baseOut = await call(refUrl(wantedBase), { secret, timeoutMs, signal });
  if (!baseOut.answered) return done({ ...transportResult(baseOut, 'reading the base branch'), failedStep: 'base-ref' });

  let emptyRepo = false;
  let baseSha = '';
  if (baseOut.res.ok) {
    baseSha = baseOut.json?.object?.sha || '';
  } else if (baseOut.res.status === 409 || (baseOut.res.status === 404 && !baseBranch)) {
    // 409 is GitHub's "Git Repository is empty"; a 404 on the repo's own default branch can
    // only mean the same thing.
    emptyRepo = true;
  } else if (baseOut.res.status === 404) {
    return done(base('no-base-branch', {
      reachedGitHub: true, httpStatus: 404, failedStep: 'base-ref',
      message: 'There is no branch called ' + wantedBase + ' in ' + owner + '/' + repo + '. Nothing was sent.',
    }));
  } else {
    return failed('base-ref', baseOut.res, baseOut.json, baseOut.text);
  }
  step(onStep, 'base-ref', n, total, 'done');

  // 3 ─ does the target branch already exist? This decides POST vs PATCH at the end, and it is
  // also what the confirmation means when it says "create" rather than "update".
  let parentSha = baseSha;
  let branchCreated = true;
  if (!emptyRepo) {
    step(onStep, 'head-ref', (n += 1), total, 'start');
    const headOut = await call(refUrl(branch), { secret, timeoutMs, signal });
    if (!headOut.answered) return done({ ...transportResult(headOut, 'reading the branch'), failedStep: 'head-ref' });
    if (headOut.res.ok) {
      // An existing branch parents on its own tip. Parenting it on some other branch's tip
      // would be a history rewrite wearing a commit's clothes.
      parentSha = headOut.json?.object?.sha || '';
      branchCreated = false;
    } else if (headOut.res.status !== 404) {
      return failed('head-ref', headOut.res, headOut.json, headOut.text);
    }
    step(onStep, 'head-ref', n, total, 'done');
  }

  // 4 ─ the parent commit's tree.
  let parentTree = '';
  if (!emptyRepo) {
    step(onStep, 'parent-commit', (n += 1), total, 'start');
    const commitOut = await call(repoUrl + '/git/commits/' + encodeURIComponent(parentSha), { secret, timeoutMs, signal });
    if (!commitOut.answered) return done({ ...transportResult(commitOut, 'reading the last commit'), failedStep: 'parent-commit' });
    if (!commitOut.res.ok) return failed('parent-commit', commitOut.res, commitOut.json, commitOut.text);
    parentTree = commitOut.json?.tree?.sha || '';
    step(onStep, 'parent-commit', n, total, 'done');
  }

  // 5 ─ which of our paths already exist. Read-only, and its whole purpose is so the
  // confirmation can say "4 added, 2 overwritten" before anything is uploaded.
  let overwrote = [];
  let listingTruncated = false;
  if (parentTree) {
    step(onStep, 'base-tree', (n += 1), total, 'start');
    const treeOut = await call(repoUrl + '/git/trees/' + encodeURIComponent(parentTree) + '?recursive=1', { secret, timeoutMs, signal });
    if (treeOut.answered && treeOut.res.ok) {
      const have = new Set((treeOut.json?.tree || []).map(t => t.path));
      overwrote = paths.filter(p => have.has(p));
      listingTruncated = Boolean(treeOut.json?.truncated);
    }
    step(onStep, 'base-tree', n, total, 'done');
  }

  // 6 ─ blobs, one per file, in order. Sequential rather than Promise.all: GitHub's secondary
  // limits target concurrent writes to one repository, and "3 of 6" is only honest in order.
  const written = [];
  for (const file of files) {
    step(onStep, 'blobs', (n += 1), total, 'start');
    const blobOut = await call(repoUrl + '/git/blobs', {
      secret, method: 'POST', timeoutMs, signal,
      body: { content: toBase64(file.text), encoding: 'base64' },
    });
    if (!blobOut.answered) return done({ ...transportResult(blobOut, 'uploading ' + file.name), failedStep: 'blobs', written, overwrote });
    if (!blobOut.res.ok) {
      return done({ ...failed('blobs', blobOut.res, blobOut.json, blobOut.text), written, overwrote });
    }
    written.push({ path: folder ? folder + '/' + file.name : file.name, blobSha: blobOut.json?.sha || '', bytes: file.text.length });
    step(onStep, 'blobs', n, total, 'done');
  }

  // 7 ─ the tree.
  //
  // `base_tree` is the most dangerous line in this file. It is what makes the commit additive:
  // every other file in the repository is carried forward. Leave it out and the tree contains
  // only our files, which is a commit that deletes the entire repository — and it would report
  // success. It is the parent commit's TREE sha, not its commit sha.
  //
  // Every entry is a blob at 100644 with a real sha. The {path, sha: null} form, which removes
  // a path, must never appear here: this function adds and overwrites, and has no delete.
  step(onStep, 'tree', (n += 1), total, 'start');
  const treePost = await call(repoUrl + '/git/trees', {
    secret, method: 'POST', timeoutMs, signal,
    body: {
      ...(parentTree ? { base_tree: parentTree } : {}),
      tree: written.map(w => ({ path: w.path, mode: '100644', type: 'blob', sha: w.blobSha })),
    },
  });
  if (!treePost.answered) return done({ ...transportResult(treePost, 'building the tree'), failedStep: 'tree', written, overwrote });
  if (!treePost.res.ok) return done({ ...failed('tree', treePost.res, treePost.json, treePost.text), written, overwrote });
  const treeSha = treePost.json?.sha || '';
  step(onStep, 'tree', n, total, 'done');

  // Nothing changed, so there is nothing to commit. Not a failure — and skipping it is what
  // stops a second press from littering the branch with empty commits.
  if (treeSha && parentTree && treeSha === parentTree) {
    return done(base('unchanged', {
      reachedGitHub: true, httpStatus: 200, treeSha, parentSha, overwrote, written,
      branchCreated: false,
      htmlUrl: 'https://github.com/' + owner + '/' + repo + '/tree/' + branch,
      message: 'These files are already what is on ' + branch + ', so there was nothing to commit.',
    }));
  }

  // 8 ─ the commit object. No author and no committer: omitted, GitHub attributes it to the
  // token's own account and links it properly. Inventing an author from Strata's sign-in email
  // would produce an unlinked commit and a hole in their contribution graph.
  step(onStep, 'commit', (n += 1), total, 'start');
  const commitPost = await call(repoUrl + '/git/commits', {
    secret, method: 'POST', timeoutMs, signal,
    body: { message, tree: treeSha, parents: parentSha ? [parentSha] : [] },
  });
  if (!commitPost.answered) return done({ ...transportResult(commitPost, 'writing the commit'), failedStep: 'commit', written, overwrote, treeSha });
  if (!commitPost.res.ok) return done({ ...failed('commit', commitPost.res, commitPost.json, commitPost.text), written, overwrote, treeSha });
  const commitSha = commitPost.json?.sha || '';
  step(onStep, 'commit', n, total, 'done');

  // 9 ─ the ref. **The first and only user-visible change.** Everything above is content
  // addressed objects with nothing pointing at them: no branch, no file listing, no commit
  // count, no notification. That is why a failure before this point can promise the repository
  // is exactly as it was, and why GitHub eventually collects the orphans.
  step(onStep, 'ref', (n += 1), total, 'start', true);
  const refOut = branchCreated
    ? await call(repoUrl + '/git/refs', { secret, method: 'POST', timeoutMs, signal, body: { ref: 'refs/heads/' + branch, sha: commitSha } })
    : await call(repoUrl + '/git/refs/heads/' + encodeBranch(branch), { secret, method: 'PATCH', timeoutMs, signal, body: { sha: commitSha } });

  const branchUrl = 'https://github.com/' + owner + '/' + repo + '/tree/' + branch;

  if (!refOut.answered) {
    // The one case where we genuinely do not know. The request may have been sent and applied;
    // the browser only refused to let us read the answer. Saying "failed" here would be as
    // wrong as saying "done", and retrying could race against ourselves.
    step(onStep, 'ref', n, total, 'fail', true);
    return done({
      ...base('unknown', { httpStatus: null }),
      reachedGitHub: false,
      mutationCertainty: 'unknown',
      failedStep: 'ref',
      written, overwrote, treeSha, commitSha, parentSha, branchCreated,
      htmlUrl: branchUrl,
      message: 'Strata could not read GitHub’s answer to the last step, so it cannot tell you whether the commit landed. Open the branch on GitHub and look.',
    });
  }

  if (!refOut.res.ok) {
    step(onStep, 'ref', n, total, 'fail', true);
    const detail = githubMessage(refOut.json, refOut.text);
    const shared = {
      failedStep: 'ref', written, overwrote, treeSha, commitSha, parentSha, branchCreated,
      reachedGitHub: true, httpStatus: refOut.res.status, detail,
      rateLimit: readRateLimit(refOut.res.headers),
    };
    if (refOut.res.status === 422 && /fast[- ]forward/i.test(detail)) {
      // The safety net firing. The answer is to read the branch again and redo it, never to
      // insist — so the copy does not contain the word that would undo somebody else's work.
      return done(base('race', {
        ...shared,
        htmlUrl: branchUrl,
        message: branch + ' moved on GitHub while Strata was working, so the commit no longer follows from it. Nothing in the repository changed. Try again and Strata will build on the new tip.',
      }));
    }
    return done(base(refOut.res.status === 422 ? 'protected' : 'github-error', {
      ...shared,
      htmlUrl: branchUrl,
      message: 'GitHub refused the last step, so nothing in the repository changed. It said: ' + (detail || refOut.res.status),
    }));
  }

  step(onStep, 'ref', n, total, 'done', true);
  return done(base('ok', {
    reachedGitHub: true,
    httpStatus: refOut.res.status,
    mutationCertainty: 'applied',
    written, overwrote, treeSha, commitSha, parentSha, branchCreated,
    htmlUrl: 'https://github.com/' + owner + '/' + repo + '/commit/' + commitSha,
    message: 'Committed ' + written.length + ' file' + (written.length === 1 ? '' : 's')
      + ' as ' + commitSha.slice(0, 7) + ' on ' + branch + (branchCreated ? ', a branch it created.' : '.')
      + (listingTruncated ? ' Strata could not read the whole file list beforehand, so it could not tell you which paths already existed.' : ''),
  }));
}

// ── where this project pushes ─────────────────────────────────────────────────
//
// Configuration, so it persists. The outcome of a commit never does: "committed 2 hours ago"
// read back out of localStorage outlives the branch it describes, because anyone can delete
// that branch. GitHub is the source of truth and the result carries a link to it.

const TARGET_KEY = 'strata_github_target';

const readTargets = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(TARGET_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

/** @returns {{repoFullName: string, branch: string, folder: string}|null} */
export function loadTarget(owner, projectId) {
  return readTargets().find(t => t.owner === owner && t.projectId === projectId) || null;
}

export function saveTarget(owner, projectId, { repoFullName, branch, folder }) {
  const rest = readTargets().filter(t => !(t.owner === owner && t.projectId === projectId));
  try {
    localStorage.setItem(TARGET_KEY, JSON.stringify([...rest, { owner, projectId, repoFullName, branch, folder }]));
    return true;
  } catch {
    return false;
  }
}
