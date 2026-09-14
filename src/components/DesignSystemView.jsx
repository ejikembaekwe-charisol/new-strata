// A design system, presented.
//
// One component renders both the published system at /explore/:id and a template's detail
// view in the create flow, because they are the same thing seen at different moments — a
// set of tokens, a palette, a type pairing, and whatever components exist. Anything that
// differs between the two arrives as a prop: the buttons in the hero, the line of metadata
// under the title, the closing call to action.
//
// It takes a token store and nothing else about where the store came from. A template's
// store is derived at render time by systemFromTemplate and a project's was saved months
// ago, and neither this file nor a reader can tell, which is the point: a template's page
// cannot flatter it with numbers the real thing would not produce.
//
// Every count is derived here rather than passed in, so a caller cannot hand it a figure
// that disagrees with the tokens underneath.

import { useState } from 'react';
import { groupsFor, rowLabelFor } from '../data/tokenGroups';
import { statsFor, distinctFacts } from '../data/systemStats';
import { categoryForComponent } from './componentTaxonomy';
import { EXPORT_FORMATS, exportTextFor } from '../data/tokenExport';
import { renderTokenPreview } from './TokenPreview';
import { inkOn } from '../data/ink';

// Labels for the categories a store can hold, in the order the tabs offer them.
const TAB_LABELS = {
  Color: 'Colours', Typography: 'Typography', Spacing: 'Spacing', Sizing: 'Sizing',
  Border: 'Border', Shadow: 'Shadow', Motion: 'Motion', Layout: 'Layout',
  Flexbox: 'Flexbox', Lists: 'Lists',
};

const section = { marginTop: '4rem', scrollMarginTop: '2rem' };
const h2 = { fontSize: '1.4rem', margin: '0 0 0.4rem', color: 'var(--text-primary)' };
const sub = { fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem' };

const pill = (on) => ({
  padding: '0.4rem 0.9rem', borderRadius: '999px', fontFamily: 'inherit',
  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
  background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: on ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.8rem', fontWeight: on ? 600 : 400, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  touchAction: 'manipulation',
});

export default function DesignSystemView({
  name, description, color, brand, tokensMap, components,
  meta = [], breadcrumb = null, notice = null, actions = null, preview = null,
  footerTitle, footerBody, footerActions = null,
  resolveAlias,
}) {
  const [tab, setTab] = useState('Color');
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('css');
  const [copied, setCopied] = useState(null);

  const b = brand || {};
  const comps = components || [];
  const store = tokensMap || {};

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
  };

  // An alias resolves through the caller when it can; otherwise it is left alone, and the
  // swatch that would have been drawn from it is simply skipped.
  const literal = (v) => {
    const s = String(v == null ? '' : v).trim();
    if (!s.startsWith('{')) return s;
    return resolveAlias ? String(resolveAlias(s.replace(/[{}]/g, '')) || '') : '';
  };

  const stats = statsFor(store, comps, b, color);
  const facts = distinctFacts(store, comps, b);

  // The strip under the title: real colours, neutrals last, because leading with them puts
  // swatches the colour of the page itself where the brand colour belongs.
  const strip = (() => {
    const groups = groupsFor('Color', store.Color || []);
    const ordered = [
      ...groups.filter(g => !/neutral/i.test(g.label || '')),
      ...groups.filter(g => /neutral/i.test(g.label || '')),
    ];
    // Round-robin across the groups rather than draining the first. A system with a
    // Primary ramp of twelve would otherwise fill the whole strip with one hue and say
    // nothing about its secondary or its accent.
    const usable = ordered.map(g => g.tokens
      .map(t => ({ name: t.name, value: literal(t.value).toUpperCase() }))
      .filter(x => /^#[0-9A-F]{3,8}$/.test(x.value)));
    const seen = new Set();
    const out = [];
    const deepest = Math.max(0, ...usable.map(g => g.length));
    for (let i = 0; i < deepest && out.length < 9; i++) {
      for (const g of usable) {
        if (out.length >= 9) break;
        const x = g[Math.floor(i * g.length / Math.max(deepest, 1))] || g[i];
        if (!x || seen.has(x.value)) continue;
        seen.add(x.value);
        out.push(x);
      }
    }
    return out;
  })();

  // Tabs are the categories this system actually has, so the row describes the system
  // rather than the schema.
  const tokenTabs = Object.keys(TAB_LABELS)
    .filter(cat => Array.isArray(store[cat]) && store[cat].length > 0)
    .map(cat => ({ id: cat, label: TAB_LABELS[cat], count: store[cat].length }));
  const tabs = [
    ...tokenTabs,
    ...(comps.length ? [{ id: '__components', label: 'Components', count: comps.length }] : []),
    // Only where the caller can actually draw one. A template ships no components, so it
    // gets no Preview tab rather than an empty stage.
    ...(preview && comps.length ? [{ id: '__preview', label: 'Preview', count: null }] : []),
  ];
  const current = tabs.some(t => t.id === tab) ? tab : (tabs[0] ? tabs[0].id : null);

  const componentGroups = (() => {
    const by = new Map();
    for (const c of comps) {
      const cat = categoryForComponent(c);
      if (!by.has(cat)) by.set(cat, []);
      by.get(cat).push(c);
    }
    return [...by.entries()].map(([category, list]) => ({ category, list }));
  })();

  const searched = (list) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(t => (t.name + ' ' + t.value).toLowerCase().includes(q));
  };

  const groups = current && current !== '__components' && current !== '__preview'
    ? groupsFor(current, store[current] || [])
      .map(g => ({ ...g, tokens: searched(g.tokens) }))
      .filter(g => g.tokens.length > 0)
    : [];

  return (
    <>
      {/* These rules ship with the component that needs them. They used to sit in
          SharedProject's own <style>, so the template overlay rendered this same markup
          without them and the rail stayed a 300px column on a 390px screen. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .dsv-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .dsv-actions { width: 100%; }
          .dsv-actions > * { flex: 1; justify-content: center !important; }
          .dsv-swatch-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important; }
        }
      `}} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: breadcrumb ? '0' : '1rem' }}>
        {breadcrumb}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
            background: `linear-gradient(135deg, ${color || 'var(--accent)'}, var(--accent))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: '1.75rem', fontWeight: 900,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', textTransform: 'uppercase',
          }}>
            {name ? name.charAt(0) : 'S'}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontSize: '2.1rem', fontWeight: 700, margin: 0,
              color: 'var(--text-primary)', lineHeight: 1.15,
            }}>{name}</h1>
            {description && (
              <p style={{
                margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem',
                maxWidth: '58ch', lineHeight: 1.6,
              }}>{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="dsv-actions" style={{
            display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.5rem',
          }}>{actions}</div>
        )}

        {strip.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            {strip.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => copy(s.value, 'strip-' + s.value)}
                title={s.name + ' — ' + s.value}
                style={{
                  width: '64px', height: '34px', borderRadius: '8px', background: s.value,
                  border: '1px solid var(--border)', cursor: 'pointer', padding: 0,
                  fontSize: '0.62rem', fontWeight: 700, touchAction: 'manipulation',
                  color: copied === 'strip-' + s.value ? inkOn(s.value) : 'transparent',
                }}
              >{copied === 'strip-' + s.value ? 'Copied' : ''}</button>
            ))}
          </div>
        )}
      </div>

      {notice && <div style={{ marginTop: '2.5rem' }}>{notice}</div>}

      {/* ── About + the stats rail ─────────────────────────────────────── */}
      <div className="dsv-grid" style={{
        display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem',
        marginTop: '2.5rem', alignItems: 'start',
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 id="about" style={{ ...h2, margin: '0 0 0.75rem' }}>About {name}</h2>

          {meta.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.9rem' }}>
              {meta.join(' · ')}
            </div>
          )}

          {Array.isArray(b.toneKeywords) && b.toneKeywords.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
              {b.toneKeywords.map(k => (
                <span key={k} style={{
                  fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '999px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}>{k}</span>
              ))}
            </div>
          )}

          {b.voice && (
            <p style={{
              fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '64ch',
            }}>{b.voice}</p>
          )}

          {/* Fewer than two facts reads as a page that failed to load, so the block goes. */}
          {facts.length >= 2 && (
            <div style={{ marginTop: '1.75rem' }}>
              <div style={{
                fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '1rem',
              }}>What makes it distinct</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {facts.map((f, i) => (
                  <div key={f.title} style={{ display: 'flex', gap: '0.85rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                      fontWeight: 700, paddingTop: '0.15rem', fontVariantNumeric: 'tabular-nums',
                    }}>{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</div>
                      <div style={{
                        fontSize: '0.83rem', color: 'var(--text-secondary)',
                        lineHeight: 1.6, marginTop: '0.15rem',
                      }}>{f.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <aside style={{
            position: 'sticky', top: '2rem', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden',
          }}>
            {stats[0].kind === 'color' && (
              <div style={{ background: stats[0].value, padding: '1.15rem 1.25rem 1.4rem' }}>
                <div style={{
                  fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.09em',
                  color: inkOn(stats[0].value), opacity: 0.7, fontWeight: 700,
                }}>{stats[0].label}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700,
                  color: inkOn(stats[0].value), marginTop: '0.2rem',
                }}>{stats[0].value}</div>
              </div>
            )}
            <div style={{ padding: '0.5rem 1.25rem 1rem' }}>
              {stats.slice(stats[0].kind === 'color' ? 1 : 0).map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {row.kind === 'color' && (
                      <span style={{
                        width: '13px', height: '13px', borderRadius: '4px', flexShrink: 0,
                        background: row.value, border: '1px solid var(--border)',
                      }} />
                    )}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* ── Explore ────────────────────────────────────────────────────── */}
      {tabs.length > 0 && (
        <section id="explore" style={section}>
          <h2 style={h2}>Explore {name}</h2>
          <p style={sub}>Pick what you want to see. Every value here is the one the system ships.</p>

          <div style={{
            display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem',
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={current === t.id}
                onClick={() => setTab(t.id)}
                style={pill(current === t.id)}
              >
                {t.label}
                {t.count !== null && (
                  <span style={{
                    opacity: 0.7, fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums',
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {current !== '__components' && current !== '__preview' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="dsv-search" style={{
                display: 'block', fontSize: '0.7rem', textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600,
                marginBottom: '0.4rem',
              }}>Search {TAB_LABELS[current] || 'tokens'}</label>
              <input
                id="dsv-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or value…"
                style={{
                  width: '100%', maxWidth: '320px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)', borderRadius: '999px',
                  padding: '0.5rem 1rem', color: 'var(--text-primary)',
                  fontSize: '0.85rem', fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {current !== '__components' && current !== '__preview' && groups.length === 0 && (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '2.5rem', textAlign: 'center',
              color: 'var(--text-secondary)', fontSize: '0.86rem',
            }}>
              {search.trim()
                ? 'Nothing in ' + (TAB_LABELS[current] || 'this group') + ' matches “' + search.trim() + '”.'
                : 'No tokens here.'}
            </div>
          )}

          {current !== '__components' && current !== '__preview' && groups.map(g => (
            <div key={g.key} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>{g.label}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{g.tokens.length}</span>
              </div>
              <div className="dsv-swatch-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem',
              }}>
                {g.tokens.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => copy(t.value, t.name)}
                    title={'Copy ' + t.name}
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: 0, overflow: 'hidden', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit', display: 'block', width: '100%',
                      touchAction: 'manipulation',
                    }}
                  >
                    <div style={{
                      height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      // For colour the block IS the preview — renderTokenPreview also prints
                      // the hex, which the row below already shows.
                      background: current === 'Color' ? literal(t.value) : 'transparent',
                    }}>
                      {current !== 'Color' && renderTokenPreview(t)}
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem 0.6rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{
                        fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{rowLabelFor(current, t)}</div>
                      <div style={{
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)', marginTop: '0.15rem',
                        color: copied === t.name ? 'var(--accent)' : 'var(--text-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{copied === t.name ? 'Copied!' : t.value}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {current === '__preview' && preview}

          {current === '__components' && componentGroups.map(folder => (
            <div key={folder.category} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>{folder.category}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{folder.list.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
                {folder.list.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '1rem',
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    {c.description && (
                      <div style={{
                        fontSize: '0.74rem', color: 'var(--text-tertiary)',
                        marginTop: '0.2rem', lineHeight: 1.5,
                      }}>{c.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Export ─────────────────────────────────────────────────────── */}
      <section id="export" style={section}>
        <h2 style={h2}>Export</h2>
        <p style={sub}>The same tokens, in the shape your tools expect.</p>
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', gap: '0.3rem', padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
          }}>
            {EXPORT_FORMATS.map(f => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={format === f.id}
                onClick={() => setFormat(f.id)}
                style={{
                  background: format === f.id ? 'var(--bg-tertiary)' : 'transparent',
                  border: 'none', padding: '0.35rem 0.85rem', borderRadius: '7px',
                  color: format === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{f.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => copy(exportTextFor(format, store), 'Export')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600,
              }}
            >{copied === 'Export' ? 'Copied!' : 'Copy'}</button>
          </div>
          <pre style={{
            margin: 0, padding: '1.1rem', overflowX: 'auto', maxHeight: '340px',
            fontSize: '0.74rem', fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)', lineHeight: 1.65,
          }}>{exportTextFor(format, store)}</pre>
        </div>
      </section>

      {/* ── Closing call to action ─────────────────────────────────────── */}
      {footerActions && (
        <section id="use" style={{
          ...section, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '2.5rem 1.5rem', textAlign: 'center',
        }}>
          <h2 style={{ ...h2, fontSize: '1.35rem', margin: '0 0 0.5rem' }}>{footerTitle}</h2>
          {footerBody && (
            <p style={{
              fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 auto 1.5rem',
              maxWidth: '52ch', lineHeight: 1.65,
            }}>{footerBody}</p>
          )}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {footerActions}
          </div>
        </section>
      )}
    </>
  );
}
