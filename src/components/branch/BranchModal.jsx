// Naming a branch when you make it.
//
// It used to be called `branch-8213`, from the last four digits of the clock, which told
// you nothing a week later. A branch is a full copy of a design system; it deserves a name
// you chose.

import { useState } from 'react';

const slug = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-');

export default function BranchModal({ projectName, existingNames, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const taken = new Set([...(existingNames || []).map(slug), 'main']);
  const clash = Boolean(slug(name)) && taken.has(slug(name));
  const ready = Boolean(name.trim()) && !clash;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(520px, 94vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>New branch</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.4rem 0 1.1rem', lineHeight: 1.55 }}>
          A complete copy of {projectName} that you can change and publish on its own. Bring
          it back a change at a time when you are ready — nothing is merged automatically.
        </p>

        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
          Name
        </label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. dark mode trial"
          style={{
            width: '100%', background: 'var(--bg-tertiary)',
            border: '1px solid ' + (clash ? '#EF4444' : 'var(--border)'),
            borderRadius: '8px', padding: '0.5rem 0.65rem', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
          }}
        />
        {clash && (
          <p style={{ fontSize: '0.7rem', color: '#EF4444', margin: '0.35rem 0 0' }}>
            There is already a branch called that.
          </p>
        )}

        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.9rem 0 0.3rem' }}>
          What it is for <span style={{ color: 'var(--text-tertiary)' }}>optional</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Trying a lighter surface palette"
          style={{
            width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.5rem 0.65rem', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', marginBottom: '1.2rem',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            style={!ready ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => onCreate({ name: name.trim(), description: description.trim() })}
          >
            Create branch
          </button>
        </div>
      </div>
    </div>
  );
}
