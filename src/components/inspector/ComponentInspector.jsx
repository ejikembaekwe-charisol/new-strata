// The properties inspector: the live preview, then collapsible sections of typed rows.
//
// Every edit commits straight through `onChange` — there is no Save button, matching how
// an inspector is expected to behave. The panel itself is stateless about the component;
// it renders whatever `component.tokens` holds and reports patches back.

import { useState } from 'react';
import PropertySections from './PropertySections';
import { ENTRANCE_KEYFRAMES, entranceByAnimation } from '../../data/motionKeyframes';

// Entrances come from the shared definition, so the picker, the app's stylesheet and
// every CSS export are describing the same four animations.
const ENTRANCES = ENTRANCE_KEYFRAMES;

const DEFAULT_DURATION = '250ms';
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Pulls a duration and easing out of whatever the component actually maps. Reports
// where they came from so the panel can say whether it is using a real token or the
// stated fallback — showing an invented duration as if it were the component's own
// would be a lie.
const motionFor = (tokens, resolve) => {
  const pick = (prop) => (tokens[prop] ? { value: resolve(tokens[prop]), token: tokens[prop] } : null);
  const direct = pick('animation-duration') || pick('transition-duration');
  let duration = direct && /^[\d.]+m?s$/.test(String(direct.value).trim()) ? direct.value.trim() : '';
  let easing = '';
  let token = direct ? direct.token : '';

  // the transition shorthand can carry both, e.g. "all 250ms ease-out"
  const shorthand = tokens.transition ? String(resolve(tokens.transition)) : '';
  if (shorthand) {
    const d = shorthand.match(/(^|\s)([\d.]+m?s)(\s|$)/);
    const e = shorthand.match(/(cubic-bezier\([^)]*\)|ease-in-out|ease-in|ease-out|linear|ease)/);
    if (!duration && d) { duration = d[2]; token = tokens.transition; }
    if (e) easing = e[1];
  }

  return {
    duration: duration || DEFAULT_DURATION,
    easing: easing || DEFAULT_EASING,
    fromToken: Boolean(duration),
    source: duration
      ? token + ' (' + duration + ')'
      : 'no motion token mapped — falling back to ' + DEFAULT_DURATION,
  };
};

export default function ComponentInspector({
  component,
  tokensForProperty,
  presetsForProperty,
  onCreateToken,
  existingTokenNames,
  inheritedTokens = {},
  parent,
  parentOptions = [],
  onSetParent,
  childComponents = [],
  childOptions = [],
  onSetChildren,
  onSelectComponent,
  resolve,
  onChange,
  onOpenEditor,
  onClose,
  renderPreview,
  canEdit = true,
}) {

  // Bumping this remounts the stage, which is what restarts the CSS animation.
  const [playCount, setPlayCount] = useState(0);
  const [entrance, setEntrance] = useState('rise');

  const tokens = component.tokens || {};
  const fragment = component.template === 'fragment';
  const childIds = childComponents.map(c => c.id);
  const move = (i, delta) => {
    const next = childIds.slice();
    const j = i + delta;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onSetChildren && onSetChildren(next);
  };
  const add = (id) => onSetChildren && onSetChildren([...childIds, id]);
  const remove = (id) => onSetChildren && onSetChildren(childIds.filter(x => x !== id));
  const arrowBtn = (disabled) => ({
    background: 'none', border: 'none', padding: '0 0.15rem', flexShrink: 0,
    cursor: disabled ? 'default' : 'pointer', fontSize: '0.72rem', lineHeight: 1,
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
    opacity: disabled ? 0.35 : 1, fontFamily: 'inherit',
  });

  const motion = motionFor(tokens, resolve);
  // A mapped animation-name is the component's own entrance, so it wins over the
  // picker. The picker then only previews an entrance the component has not adopted.
  const mappedEntrance = tokens['animation-name']
    ? entranceByAnimation[String(resolve(tokens['animation-name'])).trim()]
    : null;
  const activeEntrance = mappedEntrance || ENTRANCES.find(e => e.id === entrance) || ENTRANCES[0];

  const patch = (changes) => {
    const next = { ...tokens };
    for (const [k, v] of Object.entries(changes)) {
      if (v) next[k] = v; else delete next[k];
    }
    onChange({ ...component, tokens: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
        padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {component.name}
        </span>
        <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {component.template}
        </span>
        <div style={{ flex: 1 }} />
        {canEdit && onOpenEditor && (
          <button
            onClick={() => onOpenEditor(component)}
            title="Name, type, description and code"
            style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.25rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.68rem',
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            Details
          </button>
        )}
        <button
          onClick={onClose}
          title="Close"
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0 0.15rem', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      {/* Preview stage. Pinned outside the scroller so it stays in view while the
          properties below it scroll. */}
      <div style={{ flexShrink: 0, padding: '0.9rem 0.9rem 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem',
        }}>
          <button
            type="button"
            className="pd-preview-play"
            onClick={() => setPlayCount(n => n + 1)}
            title={'Replay the entrance using ' + motion.source}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0.22rem 0.5rem', cursor: 'pointer',
              color: 'var(--accent)', fontSize: '0.68rem', fontFamily: 'inherit',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20" />
            </svg>
            Play
          </button>

          <select
            value={activeEntrance.id}
            onChange={(e) => { setEntrance(e.target.value); setPlayCount(n => n + 1); }}
            title={mappedEntrance
              ? "This component's own entrance (" + tokens['animation-name'] + ')'
              : 'Previewing an entrance this component has not adopted — map animation-name to keep it'}
            style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0.22rem 0.3rem', color: 'var(--text-secondary)',
              fontSize: '0.66rem', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            {ENTRANCES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>

          <div style={{ flex: 1 }} />
          {/* Where the timing came from — a mapped token, or the stated fallback. */}
          <span
            title={motion.source}
            style={{
              fontSize: '0.62rem', fontFamily: 'var(--font-mono)', flexShrink: 0,
              color: (motion.fromToken || mappedEntrance) ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            {mappedEntrance ? activeEntrance.label + ' · ' : ''}{motion.duration}
          </span>
        </div>

        <div style={{
          borderRadius: '10px', border: '1px solid var(--border)',
          background: 'var(--bg)', height: '150px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', overflow: 'hidden',
        }}>
          {/* keyed on playCount so React remounts it and the animation restarts */}
          <div
            key={playCount}
            className="pd-preview-stage"
            style={playCount ? {
              animationName: activeEntrance.animation,
              animationDuration: motion.duration,
              animationTimingFunction: motion.easing,
              animationFillMode: 'both',
            } : undefined}
          >
            {renderPreview(component)}
          </div>
        </div>
      </div>

      {/* Relationships. Extends is offered on anything; Children only on a fragment,
          because only a fragment composes. */}
      <div style={{ flexShrink: 0, padding: '0 0.9rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>Extends</span>
          <select
            value={parent ? parent.id : ''}
            onChange={(e) => onSetParent && onSetParent(e.target.value || null)}
            title={parent
              ? 'Inherits every mapping from ' + parent.name + ' unless overridden here'
              : 'Inherit mappings from another component'}
            style={{
              flex: 1, minWidth: 0, background: 'var(--bg-tertiary)',
              border: '1px solid ' + (parent ? 'var(--accent)' : 'var(--border)'),
              borderRadius: '6px', padding: '0.25rem 0.4rem',
              color: parent ? 'var(--accent)' : 'var(--text-tertiary)',
              fontSize: '0.7rem', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="">Nothing</option>
            {/* Itself and its descendants are absent, so a loop cannot be chosen */}
            {(parentOptions || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {parent && onSelectComponent && (
            <button
              type="button"
              onClick={() => onSelectComponent(parent.id)}
              title={'Open ' + parent.name}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {fragment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
              Children {(childComponents || []).length > 0 && '· ' + childComponents.length}
            </span>
            {(childComponents || []).map((kid, i) => (
              <div
                key={kid.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '0.22rem 0.35rem',
                }}
              >
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', width: '12px', flexShrink: 0 }}>{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onSelectComponent && onSelectComponent(kid.id)}
                  title={'Open ' + kid.name}
                  style={{
                    flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer', color: 'var(--text-primary)',
                    fontSize: '0.7rem', fontFamily: 'inherit',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {kid.name}
                </button>
                {/* order matters to the layout, so it is reorderable */}
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} title="Move up"
                  style={arrowBtn(i === 0)}>↑</button>
                <button type="button" disabled={i === childComponents.length - 1} onClick={() => move(i, 1)} title="Move down"
                  style={arrowBtn(i === childComponents.length - 1)}>↓</button>
                <button type="button" onClick={() => remove(kid.id)} title={'Remove ' + kid.name + ' from this fragment'}
                  style={{ ...arrowBtn(false), color: 'rgba(239,68,68,0.75)' }}>×</button>
              </div>
            ))}
            <select
              value=""
              onChange={(e) => { if (e.target.value) add(e.target.value); }}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '0.25rem 0.4rem', color: 'var(--text-secondary)',
                fontSize: '0.7rem', fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <option value="">＋ Add child…</option>
              {/* itself, anything already in, and anything that would nest a container
                  inside its own content are all absent */}
              {(childOptions || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {(childOptions || []).length === 0 && (childComponents || []).length === 0 && (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                No other components to add yet.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Only the properties scroll. */}
      <div className="pd-inspector-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <PropertySections
          tokens={tokens}
          onPatch={patch}
          tokensForProperty={tokensForProperty}
          presetsForProperty={presetsForProperty}
          onCreateToken={onCreateToken}
          existingTokenNames={existingTokenNames}
          inheritedTokens={inheritedTokens}
          inheritedFrom={parent ? parent.name : ''}
          resolve={resolve}
        />
      </div>
    </div>
  );
}
