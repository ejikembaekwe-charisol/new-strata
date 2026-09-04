// "Add colour ramp": a role name, a base colour, and the eleven steps it produces.
//
// The steps are shown before anything is committed, because a ramp is eleven tokens and
// nobody should have to add it to find out what it looks like. What the preview draws is
// the same buildRamp output that gets saved — not an approximation of it.

import { useState } from 'react';
import { ColorSwatchButton } from './ColorPicker';
import { buildRamp, rampStep, stepLabel, RAMP_STEPS, RAMP_BASE_STEP } from '../data/colorRamp';
import { rampMemberOf } from '../data/tokenGroups';

export default function RampModal({ existingColorTokens = [], background = '#0D0D12', onClose, onCreate }) {
  const [role, setRole] = useState('');
  const [base, setBase] = useState('#6366F1');

  const slug = role.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tokens = slug ? buildRamp(base, slug) : [];

  // Roles already present, so a second ramp cannot quietly shadow the first.
  const takenRoles = new Set(
    existingColorTokens.map(t => rampMemberOf(t.name)?.role).filter(Boolean)
  );
  const taken = Boolean(slug) && takenRoles.has(slug);
  const ready = tokens.length === RAMP_STEPS.length && !taken;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(520px, 94vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
          Add colour ramp
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          A role and one colour become eleven steps. The colour you pick is kept exactly as
          the ramp's <strong style={{ color: 'var(--text-primary)' }}>Main</strong> step.
        </p>

        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Role
            </label>
            <input
              autoFocus
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Brand Green"
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Base
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ColorSwatchButton value={base} onChange={setBase} against={background} title="Base colour" size={34} />
              <input
                className="form-input"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                style={{ width: '104px', fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}
              />
            </div>
          </div>
        </div>

        {/* What will be created, drawn from the same function that creates it. */}
        <div style={{ marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
          {slug ? RAMP_STEPS.length + ' steps · color.' + slug + '.*' : 'Steps'}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '3px',
          border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem', marginBottom: '1.2rem',
        }}>
          {RAMP_STEPS.map(step => {
            const hex = rampStep(base, step);
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                <div
                  title={slug ? 'color.' + slug + '.' + step + '  ·  ' + (hex || '—') : String(hex || '—')}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '4px',
                    background: hex || 'var(--bg-tertiary)',
                    border: step === RAMP_BASE_STEP ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.14)',
                  }}
                />
                <span style={{ fontSize: '0.54rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {stepLabel(step)}
                </span>
              </div>
            );
          })}
        </div>

        {taken && (
          <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.8rem' }}>
            This project already has a <strong>{role.trim()}</strong> ramp. Edit its steps instead,
            or choose another role name.
          </div>
        )}
        {Boolean(role.trim()) && !slug && (
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: '0.8rem' }}>
            A role needs at least one letter or number.
          </div>
        )}
        {Boolean(slug) && tokens.length === 0 && (
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: '0.8rem' }}>
            {base} is not a colour I can read — try a 3 or 6 digit hex.
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
            Create {RAMP_STEPS.length} tokens
          </button>
        </div>
      </div>
    </div>
  );
}
