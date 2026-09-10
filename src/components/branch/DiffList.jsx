// The rows of a diff — what changed, from what, to what.
//
// Used read-only when a release is being published or inspected, and with checkboxes when a
// merge is choosing what to take. Same rows either way, so what you tick is exactly what you
// were shown.

import { useState } from 'react';
import { humanizeTokenName } from '../../data/tokenGroups';

const OP_LABEL = { add: 'added', remove: 'removed', change: 'changed' };
const OP_COLOR = { add: '#10B981', remove: '#EF4444', change: 'var(--accent)' };

const looksLikeColour = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v || '').trim());

const gridFor = (selectable) => (selectable
  ? '18px minmax(0,1.5fr) minmax(0,1fr) 12px minmax(0,1fr) 74px'
  : 'minmax(0,1.5fr) minmax(0,1fr) 12px minmax(0,1fr) 74px');

const Value = ({ value, muted }) => {
  // Nothing, rather than the word "none". An added token has no previous value, and the
  // badge at the end of the row already says ADDED — but worse, `none` is a real CSS value
  // (border-style, text-decoration, list-style all take it), so printing it in a value
  // column was ambiguous rather than merely redundant.
  if (!value) return <span />;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', minWidth: 0,
      color: muted ? 'var(--text-tertiary)' : 'var(--text-secondary)',
    }}>
      {looksLikeColour(value) && (
        <span style={{
          width: 11, height: 11, borderRadius: '3px', flexShrink: 0, background: value,
          border: '1px solid rgba(128,128,128,0.35)',
        }} />
      )}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
    </span>
  );
};

const Row = ({ row, checked, onToggle }) => {
  // An inherited row moved because something it points at moved. There is nothing to apply
  // on its own, so it is shown to explain the knock-on effect and cannot be ticked.
  const selectable = Boolean(onToggle) && !row.inherited;
  const isComponent = row.kind === 'component';
  const propList = (row.props || []);
  const detail = isComponent
    ? (row.renamed ? 'renamed' : '')
    : '';

  return (
    <div
      className="pd-diff-row"
      style={{
        display: 'grid',
        gridTemplateColumns: gridFor(Boolean(onToggle)),
        gap: '0.5rem', alignItems: 'center',
        padding: '0.4rem 0.75rem',
        borderTop: '1px solid var(--border)',
        opacity: row.inherited ? 0.6 : 1,
      }}
      title={row.inherited
        ? (row.kind === 'component'
          ? 'Nobody edited this component — it follows a token that changed.'
          : 'Not edited directly — it follows a token that changed.')
        : undefined}
    >
      {onToggle && (
        selectable ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(row.id, e.target.checked)}
            style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 13, height: 13 }}
            aria-label={row.name}
          />
        ) : <span />
      )}

      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
        <span
          title={row.kind === 'token' ? row.name : undefined}
          style={{
            fontFamily: row.kind === 'token' ? 'var(--font-mono)' : 'inherit',
            fontSize: '0.72rem', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >{row.kind === 'token' ? humanizeTokenName(row.name) : row.name}</span>
        {detail && (
          <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{detail}</span>
        )}
      </span>

      {/* A component has no single value — it has the properties that moved. Listing them
          is the only honest thing to put in these columns. */}
      {isComponent ? (
        /* Spans Was, the arrow and Now, because a component has no single before and
           after. Italic so it cannot be misread as a value sitting under the Was
           heading — it is the list of properties that moved. */
        <span style={{
          gridColumn: 'span 3', minWidth: 0, fontSize: '0.68rem', color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {row.op !== 'change' ? (row.template || 'component')
            : propList.length
              ? propList.map(pr => humanizeTokenName(pr.prop)).join(', ')
              : (row.renamed ? 'renamed from ' + (row.before && row.before.name) : 'changed')}
        </span>
      ) : (
        <>
          <Value value={row.beforeValue} muted />
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
            {row.op === 'remove' ? '' : '→'}
          </span>
          <Value value={row.afterValue} />
        </>
      )}

      <span style={{
        justifySelf: 'end', flexShrink: 0,
        fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.04em',
        color: row.inherited ? 'var(--text-tertiary)' : OP_COLOR[row.op],
      }}>
        {row.inherited ? 'follows' : OP_LABEL[row.op]}
      </span>
    </div>
  );
};

/**
 * @param {object}   diff        from diffDesigns
 * @param {object}   [selection] id → boolean. Absent means read-only, with no checkboxes.
 * @param {function} [onToggle]  (id, next) => void
 */
export default function DiffList({ diff, selection, onToggle, emptyText = 'No changes.', initialRows = 12 }) {
  const [expanded, setExpanded] = useState(false);
  const rows = (diff && diff.rows) || [];

  if (!rows.length) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0, padding: '0.9rem 0.75rem' }}>
        {emptyText}
      </p>
    );
  }

  const shown = expanded ? rows : rows.slice(0, initialRows);
  const hidden = rows.length - shown.length;

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: gridFor(Boolean(onToggle)),
        gap: '0.5rem', alignItems: 'center', padding: '0.3rem 0.75rem',
        fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-tertiary)',
      }}>
        {onToggle && <span />}
        <span>Name</span>
        <span>Was</span>
        <span />
        <span>Now</span>
        <span style={{ justifySelf: 'end' }}>Change</span>
      </div>
      {shown.map(row => (
        <Row
          key={row.id}
          row={row}
          checked={selection ? selection[row.id] !== false : false}
          onToggle={onToggle}
        />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)',
            padding: '0.5rem', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.72rem', color: 'var(--accent)',
          }}
        >
          Show {hidden} more
        </button>
      )}
    </div>
  );
}
