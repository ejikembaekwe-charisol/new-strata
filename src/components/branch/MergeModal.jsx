// Bringing a branch's changes into the project you have open.
//
// Merge here is a **selective two-way apply**: every difference between what you are
// editing and what the branch holds is listed, you tick what to take, and only that is
// applied. Nothing is decided for you.
//
// Two-way, not three-way, and the dialog says so. A branch is a separate project and Strata
// keeps no record of where the two split, so it cannot work out which side moved or call
// something a conflict. Rather than invent that certainty, every difference is surfaced as
// your choice. That is a weaker guarantee than a version control system gives, and saying
// it plainly is better than implying a safety that is not there.
//
// It always writes into the project that is open, never into another one. That keeps a
// merge on the undo stack like any other design change, and it is why the panel asks you to
// switch to main before merging a branch into main.

import { useState } from 'react';
import DiffList from './DiffList';
import { summariseDiff } from '../../data/designDiff';

export default function MergeModal({ sourceName, targetName, diff, readOnly, onClose, onApply }) {
  const [selection, setSelection] = useState({});
  const toggle = (rowId, next) => setSelection(prev => ({ ...prev, [rowId]: next }));

  const selectable = (diff && diff.entries) || [];
  const chosen = selectable.filter(e => selection[e.id] !== false);
  const followers = ((diff && diff.rows) || []).length - selectable.length;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(820px, 95vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
          {readOnly ? sourceName + ' compared with ' + targetName : 'Merge ' + sourceName + ' into ' + targetName}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.4rem 0 0.9rem', lineHeight: 1.55 }}>
          {diff && diff.rows.length
            ? summariseDiff(diff) + ' differ' + (diff.entries.length === 1 ? 's' : '')
              + (readOnly ? '.' : ', all ticked to begin with. Untick anything you do not want.')
            : 'These two are identical.'}
        </p>

        {!readOnly && diff && diff.rows.length > 0 && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0 0 0.9rem', lineHeight: 1.5 }}>
            Strata has no record of where these two split, so it cannot tell which side moved
            or flag a conflict. Every difference is listed for you to decide.
            {followers > 0 && ' ' + followers + ' row' + (followers === 1 ? '' : 's')
              + ' cannot be ticked — they follow a token above rather than changing on their own.'}
          </p>
        )}

        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          overflowY: 'auto', flex: '1 1 auto', minHeight: 0, marginBottom: '1rem',
        }}>
          <DiffList
            diff={diff}
            selection={readOnly ? undefined : selection}
            onToggle={readOnly ? undefined : toggle}
            emptyText="Nothing differs between these two."
            initialRows={30}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.6rem' }}>
          {!readOnly && (
            <span style={{ marginRight: 'auto', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              Ctrl+Z undoes a merge.
            </span>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <button
              type="button"
              className="btn-primary"
              disabled={chosen.length === 0}
              style={chosen.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              onClick={() => onApply(chosen)}
            >
              Apply {chosen.length} of {selectable.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
