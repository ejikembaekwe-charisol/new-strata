import { useState } from 'react';
import { maskSecret, relativeTime } from '../utils/figmaTokens';

// Opened from inside the Brand Context Engine, which is itself a `.modal-overlay`
// (z-index 2000, App.css:529). This one needs an explicit higher layer, and its backdrop
// click must not bubble into the engine's own dismiss handler.
const OVERLAY_Z = 2100;

const lbl = { fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' };
const field = { width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit' };
const smallBtn = (accent) => ({
  padding: '0.3rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
  border: '1px solid ' + (accent ? 'var(--accent)' : 'var(--border)'),
  background: accent ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: accent ? '#fff' : 'var(--text-secondary)',
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
});

export default function FigmaTokenModal({ vault = [], busy = false, error = '', onClose, onUse, onRename, onDelete }) {
  const [secret, setSecret] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);

  const canUse = secret.trim().length > 0 && !busy;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: OVERLAY_Z }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        e.stopPropagation();   // never let the dismiss reach the engine behind this
        onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add a Figma token</h2>
            <p className="modal-subtitle">Paste a personal access token or token ID. Saving it is optional.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="form-group">
              <label className="form-label">Access token <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  style={{ ...field, fontFamily: 'var(--font-mono)', paddingRight: '3.4rem' }}
                  placeholder="Enter Figma Token ID (e.g. 1) or Personal Access Token"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => setShow(v => !v)}
                  style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >{show ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', margin: '0.25rem 0 0.9rem' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                Save this token for reuse
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                  {remember
                    ? 'Kept in this browser so you can pick it in any project. Not encrypted — anyone with access to this browser can read it.'
                    : 'Kept for this browser tab only. Nothing is stored, and you will need to paste it again next time.'}
                </span>
              </span>
            </label>

            <div className="form-group">
              <label className="form-label">Name this token {!remember && <span className="form-optional">unused when not saving</span>}</label>
              <input
                className="form-input"
                placeholder="e.g. Design team PAT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!remember}
                style={{ opacity: remember ? 1 : 0.5 }}
              />
            </div>

            {error && <p style={{ fontSize: '0.78rem', color: '#FACC15', margin: '0.2rem 0 0' }}>{error}</p>}
          </div>

          {vault.length > 0 && (
            <div className="modal-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.1rem' }}>
              <span style={lbl}>Saved tokens</span>
              {vault.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0.5rem 0.65rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', marginBottom: '0.4rem' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {maskSecret(t.secret)}{t.lastUsedAt ? ' · used ' + relativeTime(t.lastUsedAt) : ''}
                    </div>
                  </div>
                  <button onClick={() => onRename(t)} style={smallBtn(false)}>Rename</button>
                  <button onClick={() => onDelete(t)} style={{ ...smallBtn(false), color: '#EF4444' }}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary modal-btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary modal-btn"
            onClick={() => onUse({ secret: secret.trim(), name, remember })}
            disabled={!canUse}
          >
            {busy ? 'Working...' : 'Use token'}
          </button>
        </div>
      </div>
    </div>
  );
}
