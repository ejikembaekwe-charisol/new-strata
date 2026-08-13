import React, { useState } from 'react';

const SWATCHES = ['#FC0694', '#1A1A24', '#3B82F6', '#10B981', '#F59E0B'];
const COMPONENT_CHIPS = ['PrimaryButton', 'PricingCard', 'StatusBadge'];

const ScreenshotImportDemo = () => {
  const [phase, setPhase] = useState('idle'); // idle | scanning | done

  const handleSimulate = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('done'), 1400);
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-controls">
          <div className="dot"></div><div className="dot"></div><div className="dot"></div>
        </div>
        <button className="btn btn-primary" onClick={handleSimulate} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          Simulate Extraction
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="sync-window">
          <span className="sync-label">Uploaded Screenshot</span>
          <div style={{
            border: '1.5px dashed var(--border-bright)', borderRadius: '10px',
            padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--bg)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>🖼️</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>homepage-design.png</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Figma export · 2,400 × 1,600</div>
            </div>
          </div>
        </div>

        <div className="sync-window">
          <span className="sync-label">Extracted Tokens &amp; Components</span>
          {phase === 'idle' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
              Click "Simulate Extraction" to see what comes back.
            </p>
          )}
          {phase === 'scanning' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scanning pixels for colors, text sizes, and regions…</span>
            </div>
          )}
          {phase === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SWATCHES.map((c, i) => (
                  <div key={i} style={{ width: '28px', height: '28px', borderRadius: '6px', background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COMPONENT_CHIPS.map((name) => (
                  <span key={name} style={{
                    fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '0.25rem 0.55rem',
                  }}>{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '2rem', right: '2rem', fontSize: '0.8rem',
        color: '#10b981', opacity: phase === 'done' ? 1 : 0, transition: 'opacity 0.3s',
      }}>
        5 tokens + 3 components detected ✓
      </div>
    </div>
  );
};

export default ScreenshotImportDemo;
