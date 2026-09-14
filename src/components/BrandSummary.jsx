// The brand at a glance: its colours, its type specimens, and its tone.
//
// Shared so a template's detail view and a published system's Brand System tab describe a
// brand identically — it was the second-largest block the two had in common after the token
// dictionary, and a second copy is the thing most likely to drift.
//
// Every block inside hides itself when the data behind it is absent: a template has no
// voice line and a young project has no tone keywords, and neither should render an empty
// heading. The caller supplies the swatch list rather than deriving it, because a project
// and a template disagree about where the fallback colour comes from.

import { useState } from 'react';

export default function BrandSummary({ brand, brandSwatches }) {
  const b = brand || {};
  const swatches = brandSwatches || [];
  // Its own copy state: the two callers have their own, and threading one through would
  // have meant a swatch here clearing a "Copied!" somewhere else on the page.
  const [copiedToken, setCopied] = useState(null);
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
  };
  return (
    <>
        {/* Color swatches & typography preview */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem'
        }}>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Brand Color Swatches</h3>
            {swatches.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>No brand colours defined for this system.</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {swatches.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: c.value, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{c.label}</div>
                    <div 
                      onClick={() => handleCopy(c.value, c.label)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Click to copy hex"
                    >
                      {c.value.toUpperCase()}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{copiedToken === c.label ? '✓' : '📋'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Heading Typography</h3>
              {b.headingFont ? (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Family: {b.headingFont}</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: b.headingFont, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    The quick brown fox jumps.
                  </span>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>No heading font defined.</p>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Body Typography</h3>
              {b.bodyFont ? (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Family: {b.bodyFont}</span>
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.6, fontFamily: b.bodyFont, color: 'var(--text-secondary)', display: 'block' }}>
                    Strata compiles modular, structured design variables directly from brand assets. Every UI token maintains dynamic reference parameters back to global design layers.
                  </span>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>No body font defined.</p>
              )}
            </div>
          </div>
        </div>

        {/* Tone Guidelines */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Tone & Voice</h3>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Design communication specifications.</p>
          </div>
          
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Keywords</span>
            {(b.toneKeywords || []).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>No tone keywords defined.</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(b.toneKeywords || []).map(k => (
                <span key={k} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 500 }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Voice Guidelines</span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: b.voice ? 'var(--text-secondary)' : 'var(--text-tertiary)', lineHeight: 1.6 }}>
              {b.voice || 'No voice guidelines defined.'}
            </p>
          </div>
        </div>
    </>
  );
}
