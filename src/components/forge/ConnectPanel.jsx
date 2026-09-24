// Connecting a model: the directory of providers, and the form for the one you picked.
//
// This is the Figma frame's screen, with three departures from it, all in the same direction.
//
//  1. **Only providers a browser can actually reach are listed.** The frame's Cursor, Copilot,
//     OpenCode and Kimi-for-Coding rows are IDE and CLI subscriptions with no key-addressable
//     API; the reasoning is written out in llmDirectory.js.
//  2. **Nothing says "Checking status…" on arrival.** The frame shows two rows probing on
//     mount. Strata makes no request until a button is pressed — firing someone's credential
//     at a provider unasked is not ours to do — so a row is Connected when a key exists for it
//     and Not connected when one does not, and "Checking…" appears only while a test that
//     somebody started is in flight.
//  3. **The frame's footnote named another product** and is replaced by what is true here: a
//     request from a web page succeeds only where the provider allows it, and Strata says
//     which ones it knows about rather than implying it knows about all of them.
//
// The form below the directory is the one that was already working, moved here unchanged in
// behaviour: paste, optionally save, test against the real endpoint, and manage what is saved.
// It lived twice in ProjectDetail — once behind the gear menu and once as the empty state —
// and the two copies had to be edited in lockstep. There is one now.
//
// The header's second tab is the frame's MCP screen, in McpPanel.

import { PROVIDER_DIRECTORY, CUSTOM_ENTRY } from '../../data/llmDirectory';
import McpPanel from './McpPanel';
import { maskSecret, relativeTime } from '../../utils/llmKeys';
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

/** The frame's pill: a 6px dot and a word, in the colour the state deserves. */
function StatusPill({ tone, children }) {
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

/** 36px tile: the exported glyph where the frame had one, its initials where it did not. */
function ProviderMark({ entry }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)', fontSize: entry.initials && entry.initials.length > 1 ? '0.68rem' : '0.85rem',
      fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {entry.icon ? <ForgeIcon name={entry.icon} size={20} /> : entry.initials}
    </span>
  );
}

function ProviderRow({ entry, state, onClick }) {
  const selected = state === 'checking';
  return (
    <button
      type="button"
      className="sf-focus"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        width: '100%', textAlign: 'left', padding: '1rem', borderRadius: '12px',
        border: '1px solid ' + (state === 'on' || selected ? 'var(--accent)' : 'var(--border)'),
        background: state === 'on' || selected ? 'var(--accent-glow)' : 'var(--bg-secondary)',
        fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        <ProviderMark entry={entry} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {entry.name}
          </span>
          <span style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entry.models}
          </span>
        </span>
      </span>
      {state === 'checking'
        ? <StatusPill tone="idle">Checking&hellip;</StatusPill>
        : state === 'on'
          ? <StatusPill tone="on">Connected</StatusPill>
          : <StatusPill tone="warn">Not connected</StatusPill>}
    </button>
  );
}

/**
 * @param {object} p
 * @param {import('../../data/llmDirectory').DirectoryEntry|null} p.entry  null shows the directory
 * @param {Set<string>} p.connected   entry ids with a key behind them
 * @param {string} p.checkingId       the entry a test is running against, or ''
 * @param {() => void} [p.onClose]    back to the workspace; absent when there is no workspace yet
 * @param {'models'|'mcp'} p.tab      which of the frame's two tabs is showing
 * @param {object} p.mcp              everything McpPanel needs, passed straight through
 */
export default function ConnectPanel({
  tab, onTab, mcp,
  entry, connected, checkingId, onChoose, onBack, onClose,
  provider, baseUrl, onBaseUrl, keyDraft, onKeyDraft, name, onName,
  remember, onRemember, busy, sessionKeyHeld, note, test, saved,
  onSave, onTest, onDelete,
}) {
  const unknownBrowser = PROVIDER_DIRECTORY.filter(e => e.browserOk === null).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%' }}>
      {/* Header bar: the frame's tab group on the left, its close action on the right. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        flexShrink: 0, padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)',
      }}>
        {/* The frame's tab group. Its left tab is labelled Agents; this one says Models,
            because Forge sends a prompt and renders the reply - there is no agent behind it
            and the MCP tab says as much about itself. */}
        <div role="tablist" aria-label="Connect" style={{ display: 'flex', gap: '0.5rem' }}>
          {[{ id: 'models', label: 'Models' }, { id: 'mcp', label: 'MCP' }].map(t => (
            <button key={t.id} type="button" role="tab" className="sf-focus"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '8px', border: 'none',
                background: tab === t.id ? 'var(--bg-tertiary)' : 'none',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'inherit', fontSize: '0.82rem',
                fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
              }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {entry && tab === 'models' && (
            <button type="button" className="sf-focus" style={smallBtn} onClick={onBack}>
              All providers
            </button>
          )}
          {onClose && (
            <button type="button" className="sf-focus" aria-label="Close" onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: '14px', border: 'none',
                background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
              <ForgeIcon name="xCircle" size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '1.75rem',
        padding: '2.5rem', minHeight: 0, overflowY: 'auto',
      }}>
        {tab === 'mcp' ? <McpPanel {...mcp} /> : (<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{
            margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2rem',
            fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em',
          }}>
            Connect your AI provider
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '78ch' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Bring a key you already pay for. Strata sends it straight from this browser to the
              provider you choose &mdash; there is no Strata server in between, because there is
              no Strata server.
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              The key is stored under your own account on this device, so teammates who open this
              project will not see it and you will not see theirs. It is kept in plain text, and
              unlike a Figma token an API key spends money.
            </p>
          </div>
        </div>

        {!entry ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Setup Providers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {PROVIDER_DIRECTORY.map(e => (
                  <ProviderRow
                    key={e.id}
                    entry={e}
                    state={checkingId === e.id ? 'checking' : connected.has(e.id) ? 'on' : 'off'}
                    onClick={() => onChoose(e.id)}
                  />
                ))}

                {/* The frame's last row, borderless, sitting apart from the list it follows. */}
                <button type="button" className="sf-focus" onClick={() => onChoose(CUSTOM_ENTRY.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                    textAlign: 'left', padding: '1rem', borderRadius: '12px',
                    border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}>
                    <ForgeIcon name="plus" size={16} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {CUSTOM_ENTRY.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {CUSTOM_ENTRY.models}
                    </span>
                  </span>
                  {connected.has(CUSTOM_ENTRY.id) && <><span style={{ flex: 1 }} /><StatusPill tone="on">Connected</StatusPill></>}
                </button>
              </div>
            </div>

            {/* What the frame's footnote should have said. A request made by a web page reaches
                a provider only where that provider allows it, and Strata will not guess on
                behalf of the ones it has not confirmed. */}
            <p style={{ margin: 0, paddingBottom: '0.5rem', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--text-tertiary)', maxWidth: '86ch' }}>
              The first four are known to answer a request made from a web page. The other{' '}
              {unknownBrowser} have the API but may refuse a browser; the key test says which
              happened, and it does not guess at a cause. Providers that only sell an editor or
              CLI subscription &mdash; Cursor, Copilot, OpenCode, Kimi for Coding &mdash; have
              nothing to send a key to and are not listed.
            </p>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '760px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProviderMark entry={entry} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.models}</div>
              </div>
              <div style={{ flex: 1 }} />
              {connected.has(entry.id) ? <StatusPill tone="on">Connected</StatusPill> : <StatusPill tone="warn">Not connected</StatusPill>}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: '64ch' }}>
              {entry.via === 'custom' && entry.baseUrl
                ? 'An OpenAI-compatible server. The base URL below is filled in for you; the key is theirs, not Strata’s.'
                : provider?.keyHint}
              {entry.keysUrl && (
                <>
                  {' '}
                  <a href={entry.keysUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}>Get a key &#8599;</a>
                </>
              )}
              {entry.browserOk === null && (
                <span style={{ display: 'block', marginTop: '0.35rem' }}>
                  Strata has not confirmed that this provider accepts requests from a browser.
                  Test the key before relying on it.
                </span>
              )}
            </p>

            {provider?.needsBaseUrl && (
              <div>
                <label htmlFor="forge-base" style={labelStyle}>Base URL</label>
                <input id="forge-base" type="text" style={field} autoComplete="off"
                  placeholder="https://openrouter.ai/api/v1"
                  value={baseUrl}
                  onChange={(e) => onBaseUrl(e.target.value)} />
              </div>
            )}

            <div className="pd-forge-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '0.75rem' }}>
              <div>
                <label htmlFor="forge-key" style={labelStyle}>API key</label>
                {/* type=password so it is not shoulder-read, and the value only ever lives in
                    this field — a saved key is never rendered back. */}
                <input id="forge-key" type="password" style={field} autoComplete="off"
                  placeholder={provider?.keyPlaceholder}
                  value={keyDraft}
                  onChange={(e) => onKeyDraft(e.target.value)} />
              </div>
              <div>
                <label htmlFor="forge-name" style={labelStyle}>Name it (optional)</label>
                <input id="forge-name" type="text" style={{ ...field, fontFamily: 'inherit' }} autoComplete="off"
                  placeholder="Work key"
                  value={name}
                  onChange={(e) => onName(e.target.value)} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember}
                onChange={(e) => onRemember(e.target.checked)}
                style={{ marginTop: '0.15rem', accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Remember this key on this device
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {remember
                    ? 'Not encrypted — anyone with access to this browser can read it.'
                    : 'Kept for this browser tab only.'}
                </span>
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="sf-focus"
                disabled={!keyDraft.trim() || busy}
                onClick={onSave}
                style={{
                  padding: '0.5rem 1.1rem', borderRadius: '999px', border: 'none',
                  background: keyDraft.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: keyDraft.trim() ? '#fff' : 'var(--text-tertiary)',
                  fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                  cursor: keyDraft.trim() && !busy ? 'pointer' : 'not-allowed',
                }}>
                {remember ? 'Save key' : 'Keep for this tab'}
              </button>
              <button type="button" className="sf-focus" style={smallBtn}
                disabled={busy || (!keyDraft.trim() && !sessionKeyHeld)}
                onClick={() => onTest(null)}>
                {busy ? 'Testing…' : 'Test connection'}
              </button>
              {sessionKeyHeld && !keyDraft.trim() && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  A key is held for this tab.
                </span>
              )}
            </div>

            {note && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{note}</p>}

            {/* The result. Every sentence here is keyed off reachedProvider: when the browser
                blocked the request we learned nothing about the key, and the copy must not
                pretend otherwise. */}
            {test && (
              <div style={{
                padding: '0.9rem 1rem', borderRadius: '10px', background: 'var(--bg-tertiary)',
                border: '1px solid ' + (test.status === 'ok' ? 'rgba(16,185,129,0.35)' : 'var(--border)'),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <StatusPill tone={test.status === 'ok' ? 'on' : 'warn'}>
                    {test.reachedProvider ? 'Answered' : 'No answer'}
                  </StatusPill>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {test.message}
                  </span>
                </div>
                {test.detail && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.76rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
                    {test.detail}
                  </p>
                )}
                {test.models.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      What it returned
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {test.models.slice(0, 12).map(m => (
                        <span key={m.id} style={{
                          fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                          padding: '0.2rem 0.5rem', borderRadius: '6px',
                          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                        }}>{m.label}</span>
                      ))}
                    </div>
                    {/* A raw count would flatter: OpenAI's list includes embeddings and speech
                        models that cannot generate a prototype. */}
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.74rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                      {test.models.length > 12 ? 'The first 12 of ' + test.models.length + '. ' : ''}
                      This is everything the key can see, which for some providers includes
                      embedding and speech models as well as ones that can write code.
                    </p>
                  </div>
                )}
                <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  Checked {relativeTime(test.checkedAt)} · took {test.durationMs}ms.
                  This says the key worked from this browser just now, and nothing beyond that.
                </p>
              </div>
            )}

            {saved.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.6rem' }}>
                  Saved for {provider?.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {saved.map(k => (
                    <div key={k.id} className="pd-forge-key-row" style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                      padding: '0.6rem 0.8rem', borderRadius: '8px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{k.name}</span>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {maskSecret(k.secret)}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                        used {relativeTime(k.lastUsedAt)}
                      </span>
                      <div style={{ flex: 1 }} />
                      <button type="button" className="sf-focus" style={smallBtn}
                        disabled={busy} onClick={() => onTest(k.id)}>Test</button>
                      <button type="button" className="sf-focus" style={smallBtn}
                        onClick={() => onDelete(k.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}
