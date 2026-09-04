// "Add type scale": a base size and a ratio, previewed at real sizes before anything is
// created.
//
// The companion to RampModal, and it exists for the same reason: a scale is eight tokens,
// and nobody should have to commit eight tokens to find out what they look like. It also
// covers the case the automatic pass cannot — a project with no size tokens at all has no
// ratio to measure, so its scale has to start somewhere.

import { useState } from 'react';
import {
  SCALE_STEPS, SCALE_BASE_STEP, SCALE_RATIOS, buildScale, stepLabel,
} from '../data/typeScale';

export default function ScaleModal({ existingTypographyTokens = [], onClose, onCreate }) {
  const [baseValue, setBaseValue] = useState('1rem');
  const [ratio, setRatio] = useState(1.25);
  const [prefix, setPrefix] = useState('brand.font.size.');

  const tokens = buildScale(baseValue, ratio, prefix);

  // Steps that would collide with a token already there. Creating them would shadow the
  // originals, so the dialog says which and refuses.
  const have = new Set(existingTypographyTokens.map(t => t.name));
  const clashes = tokens.filter(t => have.has(t.name)).map(t => t.name);
  const ready = tokens.length === SCALE_STEPS.length && clashes.length === 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(560px, 94vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
          Add type scale
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          A base size and a ratio become {SCALE_STEPS.length} steps. The size you enter is kept
          exactly as the scale's <strong style={{ color: 'var(--text-primary)' }}>Base</strong> step.
        </p>

        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Base size
            </label>
            <input
              autoFocus
              className="form-input"
              value={baseValue}
              onChange={(e) => setBaseValue(e.target.value)}
              placeholder="1rem"
              style={{ width: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Ratio
            </label>
            <select
              className="form-input"
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              style={{ cursor: 'pointer', fontSize: '0.78rem' }}
            >
              {SCALE_RATIOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Name prefix
            </label>
            <input
              className="form-input"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}
            />
          </div>
        </div>

        {/* Each step at its own size, from the same buildScale that will create them. */}
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem 0.7rem',
          marginBottom: '1.2rem', maxHeight: '230px', overflowY: 'auto',
        }}>
          {tokens.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: '#F59E0B' }}>
              {baseValue.trim()
                ? String(baseValue).trim() + ' is not a size I can read — try 1rem, 16px or 1.125em.'
                : 'Enter a base size to preview the scale.'}
            </div>
          ) : tokens.map(t => (
            <div
              key={t.name}
              style={{
                display: 'flex', alignItems: 'baseline', gap: '0.6rem',
                padding: '0.18rem 0', minWidth: 0,
              }}
            >
              <span style={{
                width: '38px', flexShrink: 0, fontSize: '0.66rem',
                color: t.name.endsWith(SCALE_BASE_STEP) ? 'var(--accent)' : 'var(--text-tertiary)',
                fontWeight: t.name.endsWith(SCALE_BASE_STEP) ? 600 : 400,
              }}>
                {stepLabel(t.name.split('.').pop())}
              </span>
              <span style={{
                width: '74px', flexShrink: 0, fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem', color: 'var(--text-secondary)',
              }}>
                {t.value}
              </span>
              <span style={{
                flex: 1, minWidth: 0, fontSize: t.value, lineHeight: 1.15,
                color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                Aa
              </span>
            </div>
          ))}
        </div>

        {clashes.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.8rem', lineHeight: 1.5 }}>
            {clashes.length} of these already exist ({clashes.slice(0, 3).join(', ')}
            {clashes.length > 3 ? '…' : ''}). Change the prefix, or edit the existing steps instead.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            onClick={() => onCreate(tokens)}
            style={!ready ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Create {SCALE_STEPS.length} tokens
          </button>
        </div>
      </div>
    </div>
  );
}
