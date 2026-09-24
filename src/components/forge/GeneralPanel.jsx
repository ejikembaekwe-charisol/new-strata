// The connect modal's third tab: the accounts, and the two settings that used to live in the
// toolbar's dropdown.
//
// **GitHub is a token, not a sign-in button.** OAuth needs a secret exchanged on a server and
// there is no server; GitHub's device-flow token endpoint sends no CORS headers either. A
// personal access token against api.github.com is the one path that works from a page, so it is
// the one offered, and the screen says why rather than drawing a sign-in button that cannot
// work. Everything it then shows — the login, the scopes, the repository list — came back from
// GitHub in this session; nothing is read out of storage and presented as current.
//
// **Plexo has no controls.** Strata Design is still a shell and Plexo has no endpoint to call,
// so the row says that and stops. A "Connect" button with nothing behind it would be the most
// convincing thing on this tab and the least true.

import { useState } from 'react';
import { maskSecret, relativeTime } from '../../utils/githubTokens';
import ForgeIcon from './ForgeIcon';

const GREEN = '#10B981';
const AMBER = '#E2B042';

const field = {
  width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
};

const smallBtn = {
  padding: '0.4rem 0.85rem', borderRadius: '999px', border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
  fontSize: '0.78rem', fontFamily: 'inherit', cursor: 'pointer',
};

const labelStyle = {
  display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem',
};

const cardStyle = {
  display: 'flex', flexDirection: 'column', gap: '1rem',
  padding: '1rem', borderRadius: '12px',
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
};

function Pill({ tone, children }) {
  const colour = tone === 'on' ? GREEN : tone === 'warn' ? AMBER : 'var(--text-secondary)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0,
      padding: '0.25rem 0.75rem', borderRadius: '100px',
      background: tone === 'warn' ? 'rgba(226,176,66,0.12)' : 'var(--bg-tertiary)',
      fontSize: '0.69rem', fontWeight: 600, color: colour, whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: colour }} />
      {children}
    </span>
  );
}

function Mark({ icon, initials }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)', color: 'var(--text-primary)',
      fontSize: '0.8rem', fontWeight: 700,
    }}>
      {icon ? <ForgeIcon name={icon} size={20} /> : initials}
    </span>
  );
}

/**
 * What GitHub reported about the token's reach — and the three-way distinction that matters.
 *
 * A missing header says nothing. A present-but-empty one is what a fine-grained token looks
 * like AND what a classic token with nothing ticked looks like, and no header separates them,
 * so the copy names both rather than picking the flattering one.
 */
function Scopes({ verify }) {
  if (!verify || verify.status !== 'ok') return null;
  if (!verify.scopesReported) {
    return (
      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        GitHub did not report any scope list for this token, so Strata cannot say what it can reach.
      </p>
    );
  }
  if (!verify.scopes.length) {
    return (
      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        GitHub reported no scopes. That is what a fine-grained token looks like &mdash; its
        permissions are set per repository and GitHub does not list them here &mdash; and it is
        also what a classic token with nothing ticked looks like. Strata cannot tell those apart
        from here, and will find out when it tries a repository.
      </p>
    );
  }
  const canPrivate = verify.scopes.includes('repo');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {verify.scopes.map(s => (
          <span key={s} style={{
            padding: '0.125rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)',
            fontSize: '0.69rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
          }}>{s}</span>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
        {canPrivate
          ? 'With repo, this token can reach private repositories as well as public ones.'
          : 'Without repo, this token can only reach public repositories.'}
      </p>
    </div>
  );
}

function VerifyResult({ verify }) {
  if (!verify) return null;
  const good = verify.status === 'ok';
  return (
    <div style={{
      padding: '0.9rem 1rem', borderRadius: '10px', background: 'var(--bg-tertiary)',
      border: '1px solid ' + (good ? 'rgba(16,185,129,0.35)' : 'var(--border)'),
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Pill tone={good ? 'on' : 'warn'}>{verify.reachedGitHub ? 'Answered' : 'No answer'}</Pill>
        {good && verify.account?.avatarUrl && (
          <img src={verify.account.avatarUrl} alt="" width="24" height="24"
            style={{ borderRadius: '50%', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {verify.message}
        </span>
      </div>
      {verify.detail && (
        <p style={{ margin: 0, fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          {verify.detail}
        </p>
      )}
      {verify.possibilities?.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.74rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          {verify.possibilities.map(x => <li key={x}>{x}</li>)}
        </ul>
      )}
      {verify.ssoUrl && (
        <a href={verify.ssoUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none' }}>
          Authorise it for that organisation &#8599;
        </a>
      )}
      <Scopes verify={verify} />
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
        Checked {relativeTime(verify.checkedAt)} · took {verify.durationMs}ms. This is not stored
        &mdash; it describes the token at that moment, and GitHub is where it is true.
      </p>
    </div>
  );
}

export default function GeneralPanel({ github, workspace }) {
  const g = github;
  const [showToken, setShowToken] = useState(false);
  const connected = g.saved.length > 0 || g.sessionHeld;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2rem',
          fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em',
        }}>
          General
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '78ch' }}>
          The accounts this project can reach, and the two settings that apply to the workspace.
          Everything here is stored in this browser under your own account &mdash; teammates who
          open this project will not see it, and you will not see theirs.
        </p>
      </div>

      {/* ── GitHub ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Accounts
        </h3>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mark initials="GH" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {connected && g.verify?.status === 'ok'
                  ? '@' + g.verify.account.login + (g.verify.account.name ? ' · ' + g.verify.account.name : '')
                  : 'Commit this project’s exported files into a repository'}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            {connected ? <Pill tone="on">Token saved</Pill> : <Pill tone="warn">Not connected</Pill>}
          </div>

          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: '72ch' }}>
            There is no &ldquo;Sign in with GitHub&rdquo; here because there cannot be: OAuth
            needs a secret exchanged on a server, and Strata has no server. A personal access
            token is the one thing a page can use, and it goes straight from this browser to
            api.github.com and nowhere else.{' '}
            <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}>Make a token &#8599;</a>
            {' '}It needs permission to write repository contents &mdash; <code style={{ fontFamily: 'var(--font-mono)' }}>repo</code>{' '}
            on a classic token, or Contents: read and write on a fine-grained one.
          </p>

          <div>
            <label htmlFor="gh-token" style={labelStyle}>Personal access token</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input id="gh-token" type={showToken ? 'text' : 'password'} style={field} autoComplete="off"
                placeholder="github_pat_… or ghp_…"
                value={g.draft}
                onChange={(e) => g.onDraft(e.target.value)} />
              <button type="button" className="sf-focus" style={smallBtn}
                onClick={() => setShowToken(v => !v)}>{showToken ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={g.remember}
              onChange={(e) => g.onRemember(e.target.checked)}
              style={{ marginTop: '0.15rem', accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Remember this token on this device
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {g.remember
                  ? 'Not encrypted — anyone with access to this browser can read it, and it can write to your repositories.'
                  : 'Kept for this browser tab only.'}
              </span>
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="sf-focus"
              disabled={!g.draft.trim() || g.busy}
              onClick={g.onConnect}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '999px', border: 'none',
                background: g.draft.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: g.draft.trim() ? '#fff' : 'var(--text-tertiary)',
                fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                cursor: g.draft.trim() && !g.busy ? 'pointer' : 'not-allowed',
              }}>
              {g.busy ? 'Checking…' : 'Connect'}
            </button>
            {connected && (
              <button type="button" className="sf-focus" style={smallBtn}
                disabled={g.busy} onClick={() => g.onVerify(null)}>Check again</button>
            )}
          </div>

          {g.note && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{g.note}</p>}
          <VerifyResult verify={g.verify} />

          {g.saved.map(t => (
            <div key={t.id} className="pd-forge-key-row" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
              padding: '0.6rem 0.8rem', borderRadius: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {maskSecret(t.secret)}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>used {relativeTime(t.lastUsedAt)}</span>
              <div style={{ flex: 1 }} />
              <button type="button" className="sf-focus" style={smallBtn}
                disabled={g.busy} onClick={() => g.onVerify(t.id)}>Check</button>
              <button type="button" className="sf-focus" style={smallBtn}
                onClick={() => g.onDisconnect(t.id)}>Disconnect</button>
            </div>
          ))}

          {/* Where this project pushes. Separate from the token because it is configuration:
              it persists, and unlike the token it is per project. */}
          {connected && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  Where this project pushes
                </span>
                <div style={{ flex: 1 }} />
                <button type="button" className="sf-focus" style={smallBtn}
                  disabled={g.reposBusy} onClick={g.onLoadRepos}>
                  {g.reposBusy ? 'Loading…' : g.repos.length ? 'Reload repositories' : 'Load repositories'}
                </button>
              </div>

              {g.repos.length > 0 && (
                <div>
                  <label htmlFor="gh-repo-pick" style={labelStyle}>Repositories this token can see</label>
                  <select id="gh-repo-pick" style={{ ...field, fontFamily: 'inherit' }}
                    value={g.target.repoFullName}
                    onChange={(e) => g.onTarget({ repoFullName: e.target.value })}>
                    <option value="">Choose one…</option>
                    {g.repos.map(r => (
                      <option key={r.fullName} value={r.fullName} disabled={!r.canPush || r.archived}>
                        {r.fullName}
                        {r.private ? ' · private' : ''}
                        {r.archived ? ' · archived' : !r.canPush ? ' · read only' : ''}
                      </option>
                    ))}
                  </select>
                  {/* A short list looks exactly like a complete one, and three different
                      things make a repository silently absent with a 200. */}
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    A token only ever lists what it has been given. Private repositories, and
                    repositories in organisations this token is not authorised for, are absent
                    from this list rather than shown as unavailable.
                    {g.reposComplete === false && ' This is as far as Strata read; there may be more.'}
                    {' '}Not here? Type it below.
                  </p>
                </div>
              )}
              {g.reposNote && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{g.reposNote}</p>}

              <div className="pd-forge-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 0.8fr)', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="gh-repo" style={labelStyle}>Repository</label>
                  <input id="gh-repo" type="text" style={field} autoComplete="off" placeholder="owner/repo"
                    value={g.target.repoFullName}
                    onChange={(e) => g.onTarget({ repoFullName: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="gh-branch" style={labelStyle}>Branch</label>
                  <input id="gh-branch" type="text" style={field} autoComplete="off"
                    value={g.target.branch}
                    onChange={(e) => g.onTarget({ branch: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="gh-folder" style={labelStyle}>Folder</label>
                  <input id="gh-folder" type="text" style={field} autoComplete="off" placeholder="strata"
                    value={g.target.folder}
                    onChange={(e) => g.onTarget({ folder: e.target.value })} />
                </div>
              </div>

              {/* Why the branch is not main, said where the decision is made rather than in a
                  warning after the fact. */}
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: '72ch' }}>
                Strata suggests a branch of its own rather than your default one. A commit from a
                tool you have just connected should not land on the branch that deploys, and a
                branch you can delete is the only undo there is &mdash; Strata has no server and
                cannot take a commit back.
              </p>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The button that actually commits is on <strong style={{ color: 'var(--text-primary)' }}>Handoff
                &rarr; Connect your app</strong>, beside the folder writer &mdash; that is where
                the files are.
              </p>
            </div>
          )}
        </div>

        {/* ── Plexo ────────────────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mark initials="PX" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>Plexo</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                The sibling company behind Strata Design
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Pill tone="idle">Nothing to connect to</Pill>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: '72ch' }}>
            There is no Plexo account to connect yet, and no endpoint to send one to. When there
            is, this row will take a key the way the GitHub one above does. Until then it has no
            button, because a button here would do nothing. The Design tab says the same thing at
            more length.
          </p>
        </div>
      </div>

      {/* ── the settings the toolbar dropdown used to hold ──────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          This workspace
        </h3>
        <div style={{ ...cardStyle, gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={workspace.remoteImages}
              onChange={(e) => workspace.onRemoteImages(e.target.checked)}
              style={{ marginTop: '0.2rem', accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Allow remote images
              <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                Off by default: an image pointing at another server is a way for a generated page
                to send what it can see somewhere else.
              </span>
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="sf-focus" style={smallBtn} onClick={workspace.onNewChat}>
              Start a new conversation
            </button>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
              Clears the transcript and the pages generated from it. Neither is stored anyway.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
