// The collapsible property sections — the typed-control list shared by the properties rail
// and the component dialog.
//
// Extracted from ComponentInspector so both surfaces render the identical control for a
// given property. Previously the dialog had its own flat table of two dropdowns per row,
// which meant the same mapping looked and behaved differently depending on where you were
// standing, and every new control had to be built twice.
//
// It owns no knowledge of components — it renders whatever `tokens` holds and reports the
// change through `onPatch`. Both callers already had the patch shape it wants, so neither
// had to change how it stores a mapping.

import { useEffect, useState } from 'react';
import { INSPECTOR_SECTIONS, isSideProperty } from './inspectorSections';
import { InspectorRow } from './controls';

const humanize = (prop) => prop
  .replace(/-/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase());

export default function PropertySections({
  tokens = {},
  onPatch,
  tokensForProperty,
  presetsForProperty,
  onCreateToken,
  existingTokenNames,
  inheritedTokens = {},
  inheritedFrom = '',
  resolve,
  // Layout and Styles by default — the two people reach for first. The rest stay shut so
  // the panel is scannable rather than a wall of 80 properties.
  defaultOpen = ['layout', 'styles'],
  // Sections to force open when something outside fills them in, e.g. the dialog applying
  // a preset. Without this a preset's mappings would land inside collapsed sections and
  // read as though nothing had happened.
  reveal,
}) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const toggle = (id) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Compared by content rather than identity, so a caller passing a fresh array each
  // render does not reopen sections the user has deliberately closed.
  const revealKey = (reveal || []).join(',');
  useEffect(() => {
    if (!revealKey) return;
    setOpen(prev => new Set([...prev, ...revealKey.split(',')]));
  }, [revealKey]);

  return (
    <>
      {INSPECTOR_SECTIONS.map(section => {
        const isOpen = open.has(section.id);
        const setCount = section.properties.filter(p => tokens[p] || inheritedTokens[p]).length;
        // The four sides of padding/margin are drawn by their parent row's SidesControl,
        // so they must not also appear as rows of their own.
        const rows = section.properties.filter(p => !isSideProperty(p));
        return (
          <div key={section.id} style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: '0.7rem 1rem', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {section.title}
              </span>
              {setCount > 0 && (
                <span style={{
                  fontSize: '0.62rem', color: 'var(--accent)', background: 'var(--accent-glow)',
                  border: '1px solid rgba(252,6,148,0.25)', borderRadius: '100px', padding: '0.05rem 0.35rem',
                }}>
                  {setCount}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', lineHeight: 1 }}>
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem 0.9rem' }}>
                {rows.map(prop => (
                  <InspectorRow
                    key={prop}
                    prop={prop}
                    label={humanize(prop)}
                    tokens={tokens}
                    tokenOptions={tokensForProperty ? tokensForProperty(prop) : []}
                    presets={presetsForProperty ? presetsForProperty(prop) : []}
                    onCreateToken={onCreateToken}
                    existingTokenNames={existingTokenNames ? existingTokenNames() : []}
                    inherited={inheritedTokens[prop] || ''}
                    inheritedFrom={inheritedFrom}
                    resolve={resolve}
                    onChange={(v) => onPatch({ [prop]: v })}
                    onChangeMany={onPatch}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Which sections hold these properties. The component dialog uses it to open the sections a
 * preset has just filled, so the preset's mappings are visible rather than sitting behind a
 * collapsed header that only shows a count.
 */
export const sectionIdsForProperties = (props) => {
  const want = new Set(props || []);
  return INSPECTOR_SECTIONS
    .filter(s => s.properties.some(p => want.has(p)))
    .map(s => s.id);
};
