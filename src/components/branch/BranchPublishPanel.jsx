// The Branch & Publish screen.
//
// Two axes, and they are not peers: you are always *on* a branch, and you *ship* releases
// from it. So the state of the thing you are on leads, releases run down the main column,
// and branches sit in a rail beside them — rather than two equal cards with the page empty
// underneath, which is what the version this replaces did.
//
// It owns no data. Everything is handed in already computed, the same way PropertySections
// takes rows rather than components, so the page cannot disagree with the editor about what
// has changed.

import DiffList from './DiffList';
import { authorLabel, formatChars, formatStamp } from '../../data/releases';
import { relativeTime } from '../../utils/figmaTokens';
import { summariseDiff } from '../../data/designDiff';

const card = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '12px',
};
const cardHead = {
  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--text-tertiary)', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)',
};
const btn = (primary, disabled) => ({
  background: primary && !disabled ? 'var(--accent)' : 'var(--bg-tertiary)',
  border: '1px solid ' + (primary && !disabled ? 'var(--accent)' : 'var(--border)'),
  borderRadius: '7px', padding: '0.4rem 0.8rem',
  color: primary && !disabled ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.75rem', fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

export default function BranchPublishPanel({
  projectBranchName, isBranch, liveRelease, releases, workingDiff, hasUnpublished,
  branchRoot, branchSiblings, storage,
  canPublish, canRestore, canBranch, canMerge, canDelete,
  selectedReleaseId, onSelectRelease,
  onPublish, onRestore, onMakeLive,
  onNewBranch, onSwitchBranch, onCompare, onMerge, onDeleteBranch,
}) {
  const summary = summariseDiff(workingDiff);

  return (
    <div className="pd-branch-grid" style={{
      maxWidth: '1500px', display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.25rem', alignItems: 'start',
    }}>
      <div style={{ minWidth: 0 }}>
        {/* Where you are, and whether anything is waiting to go out. */}
        <div style={{ ...card, padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: liveRelease ? 'var(--accent)' : 'var(--text-tertiary)',
            }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {liveRelease ? 'v' + liveRelease.number + ' is live' : 'Never published'}
            </span>
            {liveRelease && (
              <span
                style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}
                title={formatStamp(liveRelease.publishedAt)}
              >
                {liveRelease.name} · {relativeTime(liveRelease.publishedAt)}
                {authorLabel(liveRelease.author) ? ' · ' + authorLabel(liveRelease.author) : ''}
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0.9rem', lineHeight: 1.55 }}>
            {hasUnpublished
              ? (summary || 'Something') + ' changed on ' + projectBranchName
                + (liveRelease ? ' since v' + liveRelease.number + '.' : ' and nothing has been published yet.')
              : 'Nothing has changed since v' + (liveRelease ? liveRelease.number : '') + '. What is live matches what you are editing.'}
          </p>

          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish || !hasUnpublished}
            style={btn(true, !canPublish || !hasUnpublished)}
            title={!canPublish ? 'Your role cannot publish this project.'
              : !hasUnpublished ? 'There is nothing new to publish.' : undefined}
          >
            Publish a release
          </button>
        </div>

        {/* What is waiting to go out, in full. */}
        {hasUnpublished && workingDiff && workingDiff.rows.length > 0 && (
          <div style={{ ...card, marginBottom: '1rem' }}>
            <div style={cardHead}>Unpublished changes</div>
            <DiffList diff={workingDiff} />
          </div>
        )}

        <div style={card}>
          <div style={cardHead}>Releases</div>
          {releases.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, padding: '1.1rem 1rem', lineHeight: 1.55 }}>
              Nothing has been published yet. A release records what the design system looked
              like at a moment, so you can see what shipped and go back to it.
            </p>
          ) : releases.map(rel => {
            const isLive = liveRelease && rel.id === liveRelease.id;
            const open = selectedReleaseId === rel.id;
            const pruned = !rel.payload;
            return (
              <div key={rel.id} style={{ borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.85rem 1rem' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: '0.35rem', flexShrink: 0,
                    background: isLive ? 'var(--accent)' : 'var(--border-bright)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        v{rel.number} · {rel.name}
                      </span>
                      {isLive && (
                        <span style={{
                          fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: 'var(--accent)', background: 'var(--accent-glow)',
                          border: '1px solid rgba(252,6,148,0.25)', borderRadius: '100px',
                          padding: '0.05rem 0.4rem',
                        }}>live</span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}
                      title={formatStamp(rel.publishedAt)}
                    >
                      {authorLabel(rel.author) || 'someone'} · {relativeTime(rel.publishedAt)}
                      {' · '}{rel.counts.tokens} tokens, {rel.counts.components} components
                      {rel.branchName && rel.branchName !== 'main' ? ' · from ' + rel.branchName : ''}
                    </div>
                    {rel.notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
                        {rel.notes}
                      </p>
                    )}
                    {pruned && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0.35rem 0 0' }}>
                        Its contents are no longer stored — only the newest releases keep a full
                        copy, so this browser does not run out of room.
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => onSelectRelease(open ? null : rel.id)}
                        disabled={pruned}
                        style={btn(false, pruned)}
                        title={pruned ? 'Its contents are not stored, so there is nothing to compare.' : undefined}
                      >
                        {open ? 'Hide changes' : 'What changed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRestore(rel)}
                        disabled={pruned || !canRestore}
                        style={btn(false, pruned || !canRestore)}
                        title={pruned ? 'Its contents are not stored, so there is nothing to restore.'
                          : !canRestore ? 'Your role cannot restore a release.' : undefined}
                      >
                        Restore
                      </button>
                      {!isLive && (
                        <button
                          type="button"
                          onClick={() => onMakeLive(rel)}
                          disabled={pruned || !canPublish}
                          style={btn(false, pruned || !canPublish)}
                          title={pruned ? 'Its contents are not stored, so it cannot be served.'
                            : !canPublish ? 'Your role cannot change what is live.' : 'Serve this release publicly'}
                        >
                          Make live
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {open && rel.diff && (
                  <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                    <DiffList diff={rel.diff} emptyText="Nothing changed in this release." />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The rail: where you are editing, and how much room is left. */}
      <div style={{ minWidth: 0 }}>
        <div style={{ ...card, marginBottom: '1rem' }}>
          <div style={cardHead}>Branches</div>

          {branchRoot && (
            <BranchRow
              name="main" isCurrent={false} onSwitch={() => onSwitchBranch(branchRoot.id)}
              subtitle="the project this was branched from"
            />
          )}
          <BranchRow
            name={projectBranchName}
            isCurrent
            subtitle={isBranch ? 'you are editing this branch' : 'the main line'}
          />
          {branchSiblings.map(sib => (
            <BranchRow
              key={sib.id}
              name={sib.branchName || 'branch'}
              subtitle={sib.differences === null ? 'comparing…'
                : sib.differences === 0 ? 'identical to what you are editing'
                  : sib.differences + ' difference' + (sib.differences === 1 ? '' : 's') + ' from here'}
              subtitleTitle="Strata compares the two as they are now. There is no record of where they split, so it cannot say which side moved."
              onSwitch={() => onSwitchBranch(sib.id)}
              onCompare={() => onCompare(sib.id)}
              onMerge={canMerge ? () => onMerge(sib.id) : null}
              onDelete={canDelete ? () => onDeleteBranch(sib) : null}
            />
          ))}

          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onNewBranch}
              disabled={!canBranch}
              style={btn(false, !canBranch)}
              title={!canBranch ? 'Your role cannot create branches.' : undefined}
            >
              + New branch
            </button>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
              A branch is a full copy of this design system that you can change and publish on
              its own, then bring back a piece at a time.
            </p>
          </div>
        </div>

        {storage && (
          <div style={{ ...card, padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Browser storage
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{
                width: Math.max(2, storage.percent) + '%', height: '100%',
                background: storage.percent > 80 ? '#EF4444' : 'var(--accent)',
              }} />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '0.45rem 0 0', lineHeight: 1.5 }}>
              {formatChars(storage.chars)} used of the roughly {formatChars(storage.typicalLimit)} a
              browser usually allows. Everything lives in this browser — releases included.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const BranchRow = ({ name, subtitle, subtitleTitle, isCurrent, onSwitch, onCompare, onMerge, onDelete }) => (
  <div style={{ padding: '0.7rem 1rem', borderTop: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: isCurrent ? 'var(--accent)' : 'var(--border-bright)',
      }} />
      {onSwitch ? (
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.8rem', color: 'var(--text-primary)', textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
          }}
        >{name}</button>
      ) : (
        <span style={{
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
        }}>{name}</span>
      )}
      {isCurrent && (
        <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>current</span>
      )}
    </div>
    <div
      style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '0.15rem', marginLeft: '1rem' }}
      title={subtitleTitle}
    >
      {subtitle}
    </div>
    {(onCompare || onMerge || onDelete) && (
      <div className="pd-branch-actions" style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', marginLeft: '1rem', flexWrap: 'wrap' }}>
        {onCompare && <button type="button" onClick={onCompare} style={btn(false, false)}>Compare</button>}
        {onMerge && <button type="button" onClick={onMerge} style={btn(false, false)}>Merge…</button>}
        {onDelete && (
          <button
            type="button" onClick={onDelete}
            style={{ ...btn(false, false), color: '#EF4444' }}
          >Delete</button>
        )}
      </div>
    )}
  </div>
);
