// The token dictionary: tier pills, a category rail, and the table itself.
//
// Lifted out of SharedProject so a template's detail view and a published system's page
// show tokens identically. It was the largest single block the two had in common, and a
// second copy would have been the thing most likely to drift.
//
// It owns its own search, tier, category and copy state: nothing above it needs to know
// which category is selected, and the two callers would otherwise have had to duplicate
// four pieces of state each.

import { useState } from 'react';
import { renderTokenPreview } from './TokenPreview';

// Per-token-type pill colour.
const TYPE_COLORS = {
  color: '#FC0694',
  fontFamily: '#10B981',
  fontSize: '#3B82F6',
  spacing: '#F59E0B',
  borderRadius: '#8B5CF6',
  shadow: '#EC4899',
  duration: '#6366F1',
  easing: '#14B8A6',
};

export default function TokenExplorer({ tokens }) {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('brand');
  const [category, setCategory] = useState('All');
  const [copied, setCopied] = useState(null);

  const all = tokens || [];
  const categories = ['All', ...Array.from(new Set(all.map(t => t.category)))];

  const q = search.trim().toLowerCase();
  const filtered = all.filter(t => {
    const tierMatch = tier === 'all' || t.tier === tier;
    const catMatch = category === 'All' || t.category === category;
    const searchMatch = !q || (t.name + ' ' + t.value).toLowerCase().includes(q);
    return tierMatch && catMatch && searchMatch;
  });

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
  };

  return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        
        {/* Header with Search and Sliding Pill */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Token Dictionary</h3>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Full spec index of atomic variables.</p>
            </div>
            <input 
              type="text" 
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', padding: '0.4rem 1rem', borderRadius: '100px',
                fontSize: '0.85rem', width: '220px', outline: 'none'
              }}
            />
          </div>

          {/* Sliding Category Pill Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '100px', border: '1px solid var(--border)', width: 'fit-content' }}>
            {[
              { id: 'brand', label: 'Brand Core' },
              { id: 'semantic', label: 'Semantic' },
              { id: 'component', label: 'Component Tier' },
              { id: 'all', label: 'Show All' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setTier(pill.id)}
                style={{
                  background: tier === pill.id ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  padding: '0.4rem 1.1rem',
                  borderRadius: '100px',
                  color: tier === pill.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side Category Selector + Table Grid */}
        <div className="sp-token-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '2rem' }}>
          {/* Category Sidebar list */}
          <div className="sp-token-categories" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
            <span className="sp-token-categories-label" style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Categories</span>
            {categories.map(cat => (
              <button
                key={cat}
                className="sp-token-category-btn"
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? 'rgba(255,255,255,0.05)' : 'none',
                  border: 'none',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: category === cat ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tokens display list */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto' }}>
            <div className="sp-token-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: '1rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
              {['Name', 'Value', 'Type', 'Visual Preview'].map(h => (
                <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {filtered.length > 0 ? (
              filtered.map((t, idx) => (
                <div key={idx} className="sp-token-row" style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: '1rem', alignItems: 'center',
                  padding: '0.6rem 0.875rem', borderBottom: '1px solid rgba(128,128,128,0.08)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '0.1rem' }}>{t.tier}</span>
                  </div>
                  <span 
                    onClick={() => copy(t.value, t.name)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    title="Click to copy value"
                  >
                    {t.value}
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{copied === t.name ? '✓' : '📋'}</span>
                  </span>
                  <span style={{
                    display: 'inline-flex', alignSelf: 'center', justifySelf: 'start',
                    fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                    background: `${TYPE_COLORS[t.type] || 'rgba(255,255,255,0.1)'}15`, color: TYPE_COLORS[t.type] || 'var(--text-primary)',
                    border: `1px solid ${TYPE_COLORS[t.type] || 'rgba(255,255,255,0.1)'}30`, fontWeight: 500, letterSpacing: '0.03em',
                  }}>{t.type}</span>
                  <div>{renderTokenPreview(t)}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No tokens matching selected filters.</div>
            )}
          </div>
        </div>

      </div>
  );
}
