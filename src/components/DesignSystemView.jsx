// A design system, presented in the same shape the community page uses.
//
// This is the template detail view in the create flow. It deliberately mirrors
// SharedProject's layout — the hero, the underlined tab bar, the 1fr/340px grid and the
// sticky right rail — so a template and a published system read as the same product rather
// than as two unrelated screens.
//
// The pieces that carry real weight are not copied, they are shared: the token dictionary is
// TokenExplorer and the colour/type/tone blocks are BrandSummary, both rendered by this file
// and by SharedProject. What is left here is the shell around them.
//
// A tab appears only when a template can fill it. A template ships no components, so there
// is no Components & Spec tab and no live preview — the alternative was a tab whose only
// content explained its own emptiness, which is worse than not offering it.

import { useState } from 'react';
import TokenExplorer from './TokenExplorer';
import BrandSummary from './BrandSummary';
import { statsFor, distinctFacts } from '../data/systemStats';
import { EXPORT_FORMATS, exportTextFor } from '../data/tokenExport';

const cardBox = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
};
const railBox = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
};
const railHead = { margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' };

export default function DesignSystemView({
  name, description, color, brand, tokensMap, components,
  meta = [], actions = null, badge = null, overviewLead = null,
}) {
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(null);
  const [format, setFormat] = useState('css');

  const b = brand || {};
  const comps = components || [];
  const store = tokensMap || {};

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
  };

  // Flat, carrying the tier TokenExplorer filters on. deriveTokens writes `layer`; the
  // pills read `tier`, so the two are reconciled here rather than inside the shared
  // component, which should not have to know which of its callers wrote which field.
  const allTokens = [];
  for (const cat in store) {
    if (!Array.isArray(store[cat])) continue;
    store[cat].forEach(t => allTokens.push({
      ...t, category: cat, tier: String(t.tier || t.layer || 'Brand').toLowerCase(),
    }));
  }

  const brandSwatches = [
    { label: 'Primary', value: b.primaryColor },
    { label: 'Secondary', value: b.secondaryColor },
    { label: 'Accent', value: b.accentColor },
  ].filter(c => c.value);

  const stats = statsFor(store, comps, b, color);
  const facts = distinctFacts(store, comps, b);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'brand', name: 'Brand System' },
    { id: 'tokens', name: 'Tokens' },
    ...(comps.length ? [{ id: 'components', name: 'Components & Spec' }] : []),
  ];
  const current = tabs.some(t => t.id === tab) ? tab : 'overview';

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="sp-header-row" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: '1.5rem', paddingBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
            background: `linear-gradient(135deg, ${color || 'var(--accent)'}, var(--accent))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: '1.75rem', fontWeight: 900,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', textTransform: 'uppercase',
          }}>{name ? name.charAt(0) : 'S'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{name}</h1>
              {badge}
            </div>
            {description && (
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>
                {description}
              </p>
            )}
            {meta.length > 0 && (
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                {meta.join(' · ')}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="sp-header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      {/* ── Tab bar, the same underline treatment the community page uses ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem',
        overflowX: 'auto', gap: '0.5rem',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className="sf-focus"
            onClick={() => setTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: current === t.id ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              padding: '0.75rem 1.25rem',
              color: current === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: current === t.id ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              fontFamily: 'inherit',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="sp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* ── Overview ─────────────────────────────────────────────── */}
          {current === 'overview' && (
            <>
              {overviewLead}
              {facts.length >= 2 && (
                <div style={cardBox}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      What makes it distinct
                    </h3>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      Read off the tokens it writes, not written about them.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {facts.map((f, i) => (
                      <div key={f.title} style={{ display: 'flex', gap: '0.85rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                          fontWeight: 700, paddingTop: '0.15rem', fontVariantNumeric: 'tabular-nums',
                        }}>{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</div>
                          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.15rem' }}>
                            {f.body}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The export block is the whole of "Components & Spec" a template can
                  honestly offer, so it sits here rather than behind an empty tab. */}
              <div style={cardBox}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export</h3>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    The same tokens, in the shape your tools expect.
                  </p>
                </div>
                <div>
                  <div style={{
                    display: 'flex', gap: '0.25rem', marginBottom: '0.75rem',
                    background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content',
                  }}>
                    {EXPORT_FORMATS.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        className="sf-focus"
                        onClick={() => setFormat(f.id)}
                        style={{
                          background: format === f.id ? 'var(--bg-secondary)' : 'none',
                          border: 'none', borderRadius: '6px', padding: '0.35rem 1rem',
                          color: format === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          textTransform: 'uppercase', fontFamily: 'inherit',
                        }}
                      >{f.id}</button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <pre style={{
                      margin: 0, padding: '1rem', borderRadius: '10px', background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)', overflowX: 'auto', maxHeight: '320px',
                      fontSize: '0.74rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)', lineHeight: 1.65,
                    }}>{exportTextFor(format, store)}</pre>
                    <button
                      type="button"
                      className="sf-focus"
                      onClick={() => copy(exportTextFor(format, store), 'export')}
                      style={{
                        position: 'absolute', top: '0.6rem', right: '0.6rem',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        borderRadius: '7px', padding: '0.3rem 0.7rem', cursor: 'pointer',
                        color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
                      }}
                    >{copied === 'export' ? 'Copied!' : 'Copy'}</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Brand System ─────────────────────────────────────────── */}
          {current === 'brand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <BrandSummary brand={b} brandSwatches={brandSwatches} />
            </div>
          )}

          {/* ── Tokens ───────────────────────────────────────────────── */}
          {current === 'tokens' && <TokenExplorer tokens={allTokens} />}

          {/* ── Components & Spec, only ever reachable when there are some ── */}
          {current === 'components' && (
            <div style={cardBox}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Components</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
                {comps.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '1rem',
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    {c.description && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                        {c.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── The sticky rail ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '2rem' }}>
          {brandSwatches.length > 0 && (
            <div style={railBox}>
              <h3 style={railHead}>Brand Palette</h3>
              {brandSwatches.map(c => (
                <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{
                      width: '14px', height: '14px', borderRadius: '4px', background: c.value,
                      border: '1px solid var(--border)',
                    }} />
                    {c.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {String(c.value).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(b.headingFont || b.bodyFont) && (
            <div style={railBox}>
              <h3 style={railHead}>Type Scale</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Heading</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: b.headingFont || 'Outfit', color: 'var(--text-primary)' }}>{name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>Body</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'right', fontFamily: b.bodyFont || 'Inter' }}>
                  The quick brown fox jumps over the lazy dog.
                </span>
              </div>
            </div>
          )}

          {/* Counted, never estimated — statsFor drops any row it cannot resolve. */}
          {stats.filter(r => r.kind !== 'color').length > 0 && (
            <div style={railBox}>
              <h3 style={{ ...railHead, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>At a glance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {stats.filter(r => r.kind !== 'color').map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                    }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
