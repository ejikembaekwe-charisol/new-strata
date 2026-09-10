// Publishing a release: name it, say what changed if you like, and see exactly what is
// about to go out before it does.
//
// The diff is the point. A release you cannot inspect before cutting it is a button you
// press and hope about, and the whole reason this screen exists is that the previous one
// could not tell you what a version contained.

import { useState } from 'react';
import DiffList from './DiffList';
import { summariseDiff } from '../../data/designDiff';

export default function PublishModal({ diff, liveRelease, nextNumber, storage, onClose, onPublish }) {
  const summary = summariseDiff(diff);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const ready = Boolean(name.trim());

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(720px, 94vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
          Publish v{nextNumber}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.4rem 0 1.1rem', lineHeight: 1.55 }}>
          {liveRelease
            ? summary + ' since v' + liveRelease.number + ', published ' + new Date(liveRelease.publishedAt).toLocaleDateString() + '.'
            : 'The first release of this design system — ' + (summary || 'everything in it') + '.'}
        </p>

        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
          What to call it
        </label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Darker primary ramp"
          style={{
            width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.5rem 0.65rem', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', marginBottom: '0.9rem',
          }}
        />

        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
          Notes <span style={{ color: 'var(--text-tertiary)' }}>optional</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the people consuming this should know."
          style={{
            width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.5rem 0.65rem', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            marginBottom: '1rem',
          }}
        />

        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          overflowY: 'auto', flex: '0 1 auto', minHeight: 0, marginBottom: '0.9rem',
        }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)', padding: '0.7rem 0.75rem',
          }}>
            Going out in this release
          </div>
          <DiffList diff={diff} emptyText="Nothing has changed." />
        </div>

        {storage && storage.percent > 80 && (
          <p style={{ fontSize: '0.72rem', color: '#EF4444', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
            This browser is {storage.percent}% full. Releases are stored here, so publishing may
            fail — deleting a project or an old release will free room.
          </p>
        )}

        {/* Said plainly rather than implied: publishing does not put a wall around anything,
            because there is no server to enforce one. */}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 1rem', lineHeight: 1.5 }}>
          A release fixes what the public view serves. It does not restrict who can open the
          link — visibility is not enforced yet.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            style={!ready ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            title={!ready ? 'Give the release a name first.' : undefined}
            onClick={() => onPublish({ name: name.trim(), notes: notes.trim() })}
          >
            Publish v{nextNumber}
          </button>
        </div>
      </div>
    </div>
  );
}
