// The connect modal's second tab: Model Context Protocol servers.
//
// The frame shows two servers with four capability tags each, a status pill on every row, and
// a line saying that connected servers can be queried by your agents. Two of those are claims
// this app cannot make, so they are made differently here:
//
//  1. **The tags are the server's own.** `read_canvas`, `get_styles` and the rest are not
//     tools any MCP server actually exposes; Figma's Dev Mode server calls its own
//     get_design_context, get_screenshot and so on. So a row shows nothing until it has been
//     checked, and then shows the tool names that came back from tools/list.
//  2. **Reaching a server is not the same as using one.** Forge sends one prompt and renders
//     the reply; it has no tool-use loop, so a model cannot call any of these. The page says
//     that in the hero rather than implying the opposite, and a checked server reads
//     "Answered" — what was observed — rather than "Connected".
//
// The Magnific row is not here. Strata would need its endpoint to send anything, and a row
// whose address had to be invented would fail at the end of somebody's decision rather than
// at the start of it. The custom row takes any endpoint, including that one.

import { useState } from 'react';
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

/** What one probe result is called on the row. Nothing here outlives the check that produced it. */
const verdict = (probe, probing) => {
  if (probing) return { tone: 'idle', text: 'Checking…' };
  if (!probe) return { tone: 'idle', text: 'Not checked' };
  if (probe.status === 'ok') return { tone: 'on', text: 'Answered' };
  if (probe.status === 'responding') return { tone: 'warn', text: 'Not MCP' };
  if (probe.status === 'insecure-origin') return { tone: 'warn', text: 'Blocked here' };
  return { tone: 'warn', text: 'No answer' };
};

function ServerRow({ server, probe, probing, onProbe, onRemove }) {
  const v = verdict(probe, probing);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
      width: '100%', padding: '1rem', borderRadius: '12px',
      border: '1px solid ' + (probe?.status === 'ok' ? 'var(--accent)' : 'var(--border)'),
      background: probe?.status === 'ok' ? 'var(--accent-glow)' : 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          width: 36, height: 36, borderRadius: '8px',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}>
          {server.icon ? <ForgeIcon name={server.icon} size={22} /> : <ForgeIcon name="code" size={18} />}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div>
            <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>{server.name}</div>
            {/* Only a preset has a description. One you added shows its address alone,
                rather than the address twice. */}
            {server.blurb && (
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)', maxWidth: '680px' }}>
                {server.blurb}
              </p>
            )}
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
              {server.url}
            </p>
          </div>

          {/* The frame's capability row. It is empty until the server has said what it has. */}
          {probe?.status === 'ok' && (
            probe.tools.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {probe.tools.slice(0, 12).map(t => (
                  <span key={t.name} style={{
                    padding: '0.125rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)',
                    fontSize: '0.69rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                  }}>{t.name}</span>
                ))}
                {probe.tools.length > 12 && (
                  <span style={{ fontSize: '0.69rem', color: 'var(--text-tertiary)' }}>
                    and {probe.tools.length - 12} more
                  </span>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                It answered but did not list its tools, which a server can decline to do.
              </p>
            )
          )}

          {probe && probe.status !== 'ok' && (
            <div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {probe.message}
              </p>
              {probe.possibilities.length > 0 && (
                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  {probe.possibilities.map(x => <li key={x}>{x}</li>)}
                </ul>
              )}
              {probe.remedy && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{probe.remedy}</p>
              )}
            </div>
          )}

          {probe?.status === 'ok' && (
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Checked just now, in {probe.durationMs}ms. That is this browser reaching it, not
              a model using it.
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <Pill tone={v.tone}>{v.text}</Pill>
        <button type="button" className="sf-focus" style={smallBtn}
          disabled={probing} onClick={() => onProbe(server)}>
          {probing ? 'Checking…' : 'Check'}
        </button>
        {onRemove && (
          <button type="button" className="sf-focus" style={smallBtn}
            onClick={() => onRemove(server.id)}>Remove</button>
        )}
      </div>
    </div>
  );
}

export default function McpPanel({ servers, probes, probing, onProbe, onAdd, onRemove, note }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const submit = () => {
    if (onAdd({ name, url })) { setName(''); setUrl(''); setOpen(false); }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2rem',
          fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em',
        }}>
          Model Context Protocol
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '78ch' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            An MCP server gives a model tools &mdash; reading the design file you have open,
            fetching data, running an action. Point Strata at one and it will tell you whether
            this browser can reach it and what tools it says it has.
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            It cannot hand those tools to the model yet. Forge sends one prompt and renders
            what comes back; there is no tool-use loop behind it, so nothing on this tab
            changes what the chat can do. Checking a server is a diagnostic, and that is all it
            claims to be.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Setup MCP Servers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {servers.map(s => (
            <ServerRow
              key={s.id}
              server={s}
              probe={probes[s.id]}
              probing={probing === s.id}
              onProbe={onProbe}
              onRemove={s.preset ? null : onRemove}
            />
          ))}

          {!open ? (
            <button type="button" className="sf-focus" onClick={() => setOpen(true)}
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
              <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Configure custom MCP server
              </span>
            </button>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem',
              borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '0.75rem' }} className="pd-forge-row">
                <div>
                  <label htmlFor="mcp-name" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Name
                  </label>
                  <input id="mcp-name" type="text" autoComplete="off" placeholder="My server"
                    style={{ ...field, fontFamily: 'inherit' }}
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="mcp-url" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Endpoint
                  </label>
                  <input id="mcp-url" type="text" autoComplete="off" placeholder="http://127.0.0.1:3845/mcp"
                    style={field}
                    value={url} onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                An http or https endpoint. A server that speaks over stdio has no address a
                page can call, so it cannot be added here at all.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="sf-focus" onClick={submit}
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: '999px', border: 'none',
                    background: url.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: url.trim() ? '#fff' : 'var(--text-tertiary)',
                    fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                    cursor: url.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  Add server
                </button>
                <button type="button" className="sf-focus" style={smallBtn}
                  onClick={() => { setOpen(false); setUrl(''); setName(''); }}>Cancel</button>
                {note && <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{note}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The frame's footnote promised secure routing through "sandbox loops". There is no
          such thing here, and the real constraint is worth more than the reassurance. */}
      <p style={{ margin: 0, paddingBottom: '0.5rem', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--text-tertiary)', maxWidth: '86ch' }}>
        Strata is a page in your browser. It can only reach a server that is running and that
        allows a web page to read it &mdash; and when Strata itself is served over https, it
        cannot read a plain-http address on your own machine at all, whatever is running there.
        A local server is checkable from a local build.
      </p>
    </>
  );
}
