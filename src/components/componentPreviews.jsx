// Live previews for every template in the component taxonomy.
//
// Shared by ProjectDetail (which resolves *any* mapped CSS property) and
// SharedProject (which resolves only the legacy six token keys and supplies
// its own light/dark defaults). Neither caller's token resolution changes:
// both hand in an already-resolved `mapped` style object, plus whatever
// surface colours suit their surroundings via `opts`.
//
// Every preview is static. None of them is a working control — they exist to
// show what the mapped tokens look like on that kind of component.

import React from 'react';

// Surface colours a preview needs beyond the mapped tokens. ProjectDetail
// leaves these alone and gets the app's CSS variables; SharedProject passes
// literals matching whichever theme its preview pane is showing.
const CHROME = {
  surface: 'var(--bg-secondary)',
  surfaceAlt: 'var(--bg-tertiary)',
  text: 'var(--text-primary)',
  muted: 'var(--text-secondary)',
  border: 'var(--border)',
  shadow: 'var(--shadow-md)',
  accent: 'var(--accent)',
};

// The mapped background doubles as the component's accent wherever a preview
// needs one small emphasised part (an active tab, a chart bar, a checked box).
// Falls back to the chrome accent so an unmapped component still reads.
const accentOf = (mapped, c) => mapped.backgroundColor || c.accent;

// Several previews want the mapped colours on an inner element but not the
// outer frame, so the frame doesn't get painted over by a token meant for,
// say, a menu item.
const withoutSurface = (mapped) => {
  const { backgroundColor, ...rest } = mapped;
  return rest;
};

export function renderComponentPreview(comp, rawMapped = {}, opts = {}) {
  const c = { ...CHROME, ...opts };
  const t = comp?.template;

  // Callers may hand in either form; everything below sets backgroundColor, and
  // mixing the two on one element makes React drop one of them on rerender.
  const mapped = { ...rawMapped };
  if ('background' in mapped) {
    mapped.backgroundColor = mapped.background;
    delete mapped.background;
  }

  const base = {
    border: 'none',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center',
    fontWeight: 500,
    transition: 'opacity 0.2s',
    ...mapped,
  };

  /* ── Actions & Triggers ── */

  if (t === 'button') {
    return (
      <button style={base} onClick={opts.onButtonClick}>
        {opts.buttonLabel || 'Click Me'}
      </button>
    );
  }

  if (t === 'dropdown') {
    const text = mapped.color || c.text;
    return (
      <div style={{ display: 'inline-block', textAlign: 'left', minWidth: '150px', fontFamily: mapped.fontFamily }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
          padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem',
          backgroundColor: c.surfaceAlt, color: c.text, border: `1px solid ${c.border}`,
          ...withoutSurface(mapped),
        }}>
          Menu
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {/* The open menu is the part the tokens describe, so it takes the mapped surface. */}
        <div style={{
          marginTop: '0.3rem', padding: '0.25rem', borderRadius: '6px', overflow: 'hidden',
          backgroundColor: c.surface, border: `1px solid ${c.border}`, boxShadow: c.shadow,
          ...mapped,
        }}>
          {['Edit', 'Duplicate', 'Delete'].map((item, i) => (
            <div key={item} style={{
              padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px',
              color: text, backgroundColor: i === 0 ? accentOf(mapped, c) : 'transparent',
              opacity: i === 0 ? 1 : 0.75,
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (t === 'tooltip') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{
          padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500,
          backgroundColor: c.surfaceAlt, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap',
          ...mapped,
        }}>
          Helpful hint
        </div>
        {/* Arrow, in the same colour as the bubble it belongs to. */}
        <div style={{
          width: 0, height: 0, marginTop: '-1px',
          borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
          borderTop: `5px solid ${accentOf(mapped, c) === c.accent ? c.surfaceAlt : accentOf(mapped, c)}`,
        }} />
        <span style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: c.muted, textDecoration: 'underline dotted' }}>
          hover target
        </span>
      </div>
    );
  }

  /* ── Forms & Inputs ── */

  if (t === 'input') {
    // The mapped background renders as the field's border instead, so the
    // field itself stays legible. (Behaviour carried over from the original.)
    const { backgroundColor, ...rest } = mapped;
    return (
      <input
        type="text"
        placeholder={opts.inputPlaceholder || 'Placeholder...'}
        style={{
          color: c.text, outline: 'none', width: '100%', maxWidth: opts.inputMaxWidth || '200px',
          ...rest,
          backgroundColor: opts.inputSurface || c.surfaceAlt,
          border: `1px solid ${backgroundColor || c.border}`,
        }}
        disabled
      />
    );
  }

  if (t === 'selection') {
    const accent = accentOf(mapped, c);
    const radius = mapped.borderRadius || '4px';
    const label = { fontSize: '0.75rem', color: mapped.color || c.text, fontFamily: mapped.fontFamily };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            width: '14px', height: '14px', borderRadius: radius, flexShrink: 0,
            backgroundColor: accent, border: `1px solid ${accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span style={label}>Checkbox</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            border: `1px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: accent }} />
          </span>
          <span style={label}>Radio button</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            width: '26px', height: '15px', borderRadius: '100px', backgroundColor: accent, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2px',
          }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#fff' }} />
          </span>
          <span style={label}>Toggle</span>
        </div>
      </div>
    );
  }

  if (t === 'selector') {
    const accent = accentOf(mapped, c);
    const radius = mapped.borderRadius || '6px';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', minWidth: '160px' }}>
        {/* colour picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {[accent, c.muted, c.border].map((swatch, i) => (
            <span key={i} style={{
              width: '18px', height: '18px', borderRadius: radius, backgroundColor: swatch,
              border: i === 0 ? `2px solid ${c.text}` : `1px solid ${c.border}`,
            }} />
          ))}
        </div>
        {/* date field */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.5rem', borderRadius: radius, fontSize: '0.72rem',
          backgroundColor: c.surfaceAlt, color: c.text, border: `1px solid ${c.border}`,
          ...withoutSurface(mapped),
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" />
          </svg>
          2026-09-01
        </div>
        {/* file drop zone */}
        <div style={{
          padding: '0.5rem', borderRadius: radius, textAlign: 'center', fontSize: '0.7rem',
          color: c.muted, border: `1px dashed ${accent}`,
          fontFamily: mapped.fontFamily,
        }}>
          Drop a file here
        </div>
      </div>
    );
  }

  /* ── Layout & Containers ── */

  if (t === 'fragment') {
    // A fragment draws nothing of its own — it arranges the components it holds, using its
    // own layout mappings. `opts.children` arrives already rendered so this file stays a
    // pure function of what it is handed, with no knowledge of the project store.
    const kids = opts.children || [];
    if (!kids.length) {
      // An empty container that rendered as nothing would be indistinguishable from a
      // broken preview, so it says what it is.
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '140px', minHeight: '56px', padding: '0.75rem',
          borderRadius: mapped.borderRadius || '8px',
          border: `1px dashed ${c.border}`, color: c.muted,
          fontSize: '0.72rem', textAlign: 'center',
          ...withoutSurface(mapped),
        }}>
          Empty fragment — add components to it
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: '0.5rem', maxWidth: '100%',
        ...mapped,
      }}>
        {kids}
      </div>
    );
  }


  if (t === 'accordion') {
    const rows = ['Getting started', 'Configuration', 'Troubleshooting'];
    return (
      <div style={{
        textAlign: 'left', width: '100%', maxWidth: '240px', overflow: 'hidden',
        borderRadius: mapped.borderRadius || '8px',
        backgroundColor: c.surface, border: `1px solid ${c.border}`,
        ...mapped,
      }}>
        {rows.map((row, i) => (
          <div key={row} style={{ borderTop: i ? `1px solid ${c.border}` : 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.45rem 0.6rem', fontSize: '0.76rem', fontWeight: 600,
              color: mapped.color || c.text,
            }}>
              {row}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: i === 0 ? 'rotate(90deg)' : 'none' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            {i === 0 && (
              <div style={{ padding: '0 0.6rem 0.5rem', fontSize: '0.72rem', opacity: 0.7, color: mapped.color || c.muted }}>
                The first panel is expanded to show its content area.
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (t === 'card') {
    return (
      <div style={{
        backgroundColor: c.surface,
        color: opts.cardText || undefined,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
        textAlign: 'left',
        width: '100%',
        maxWidth: opts.cardMaxWidth || '240px',
        ...mapped,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Card Title</div>
        <div style={{ opacity: 0.7, fontSize: '0.85em' }}>
          {opts.cardBody || 'This is a token-mapped card component.'}
        </div>
      </div>
    );
  }

  if (t === 'tabs') {
    const accent = accentOf(mapped, c);
    return (
      <div style={{ textAlign: 'left', width: '100%', maxWidth: '240px', fontFamily: mapped.fontFamily }}>
        <div style={{ display: 'flex', gap: '0.15rem', borderBottom: `1px solid ${c.border}` }}>
          {['Overview', 'Specs', 'Usage'].map((tab, i) => (
            <div key={tab} style={{
              padding: '0.35rem 0.55rem', fontSize: '0.74rem',
              fontWeight: i === 0 ? 600 : 500,
              color: i === 0 ? (mapped.color || c.text) : c.muted,
              borderBottom: `2px solid ${i === 0 ? accent : 'transparent'}`,
              marginBottom: '-1px',
            }}>
              {tab}
            </div>
          ))}
        </div>
        <div style={{
          padding: '0.6rem', fontSize: '0.72rem', color: c.muted,
          backgroundColor: c.surface, border: `1px solid ${c.border}`, borderTop: 'none',
          ...withoutSurface(mapped),
        }}>
          Panel content for the selected tab.
        </div>
      </div>
    );
  }

  if (t === 'modal') {
    return (
      <div style={{
        position: 'relative', width: '100%', maxWidth: '240px', padding: '1rem 0.75rem',
        borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.35)',
      }}>
        <div style={{
          textAlign: 'left', borderRadius: '8px', padding: '0.7rem',
          backgroundColor: c.surface, border: `1px solid ${c.border}`, boxShadow: c.shadow,
          ...mapped,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Confirm action</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>×</span>
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: '0.6rem' }}>
            This dialog needs a response before you continue.
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
            <span style={{
              padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '5px',
              border: `1px solid ${c.border}`, color: c.muted,
            }}>Cancel</span>
            <span style={{
              padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '5px',
              backgroundColor: accentOf(mapped, c), color: '#fff',
            }}>Confirm</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Data Display & Visualization ── */

  if (t === 'table') {
    const rows = [['Alpha', '128', 'Active'], ['Beta', '64', 'Draft'], ['Gamma', '32', 'Active']];
    const cell = { padding: '0.3rem 0.45rem', fontSize: '0.7rem', textAlign: 'left' };
    return (
      <div style={{
        textAlign: 'left', width: '100%', maxWidth: '240px', overflow: 'hidden',
        borderRadius: mapped.borderRadius || '8px',
        backgroundColor: c.surface, border: `1px solid ${c.border}`,
        ...mapped,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mapped.fontFamily }}>
          <thead>
            <tr style={{ backgroundColor: c.surfaceAlt }}>
              <th style={{ ...cell, fontWeight: 700 }}>Name ↑</th>
              <th style={{ ...cell, fontWeight: 700 }}>Uses</th>
              <th style={{ ...cell, fontWeight: 700 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r[0]} style={{ borderTop: `1px solid ${c.border}` }}>
                {r.map((v, j) => (
                  <td key={j} style={{ ...cell, opacity: j === 0 ? 1 : 0.7, color: mapped.color || c.text }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (t === 'badge') {
    return (
      <span style={{
        ...base, display: 'inline-block', textTransform: 'uppercase', fontSize: '0.7rem',
        padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.05em', ...mapped,
      }}>
        New
      </span>
    );
  }

  if (t === 'chart') {
    // Inline SVG — no charting library, so nothing is added to the bundle.
    const accent = accentOf(mapped, c);
    const bars = [18, 34, 26, 44, 30, 52];
    return (
      <div style={{
        width: '100%', maxWidth: '240px', padding: '0.6rem', textAlign: 'left',
        borderRadius: mapped.borderRadius || '8px',
        backgroundColor: c.surface, border: `1px solid ${c.border}`,
        ...mapped,
      }}>
        <svg viewBox="0 0 180 64" width="100%" height="64" role="img" aria-label="Example bar and line chart">
          <line x1="0" y1="60" x2="180" y2="60" stroke={c.border} strokeWidth="1" />
          {bars.map((h, i) => (
            <rect key={i} x={8 + i * 29} y={60 - h} width="16" height={h} rx="2" fill={accent} opacity="0.85" />
          ))}
          <polyline
            points={bars.map((h, i) => `${16 + i * 29},${60 - h - 6}`).join(' ')}
            fill="none" stroke={mapped.color || c.text} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"
          />
          {bars.map((h, i) => (
            <circle key={i} cx={16 + i * 29} cy={60 - h - 6} r="2" fill={mapped.color || c.text} opacity="0.8" />
          ))}
        </svg>
      </div>
    );
  }

  if (t === 'image') {
    return (
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '100%', maxHeight: '100%',
        borderLeft: comp.accentColor ? `4px solid ${comp.accentColor}` : 'none',
        paddingLeft: comp.accentColor ? '0.5rem' : 0,
      }}>
        {comp.imageUrl ? (
          <img
            src={comp.imageUrl}
            alt={comp.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
          />
        ) : (
          // An 'image' component with nothing uploaded — an avatar placeholder
          // rather than a broken image icon.
          <span style={{
            width: '44px', height: '44px', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700,
            backgroundColor: accentOf(mapped, c), color: '#fff', ...mapped,
          }}>
            {(comp.name || 'A').slice(0, 2).toUpperCase()}
          </span>
        )}
        {comp.accentFontSize && (
          <span
            title={`Detected text size: ~${comp.accentFontSize}px`}
            style={{
              position: 'absolute', top: '2px', right: '2px',
              backgroundColor: c.surface, border: `1px solid ${c.border}`,
              borderRadius: '4px', padding: '0.1rem 0.35rem',
              fontSize: '0.65rem', color: c.muted, lineHeight: 1.4,
            }}
          >
            Aa {comp.accentFontSize}px
          </span>
        )}
      </div>
    );
  }

  /* ── Navigation ── */

  if (t === 'breadcrumb') {
    const crumbs = ['Home', 'Library', 'Components'];
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap',
        fontSize: '0.74rem', padding: '0.3rem 0.5rem', fontFamily: mapped.fontFamily,
        // A breadcrumb bar can carry its own surface, so it takes the full mapped
        // style rather than dropping the background like the inset previews do.
        ...mapped,
      }}>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb}>
            {i > 0 && <span style={{ color: c.muted, opacity: 0.6 }}>›</span>}
            <span style={{
              color: i === crumbs.length - 1 ? (mapped.color || c.text) : c.muted,
              fontWeight: i === crumbs.length - 1 ? 600 : 500,
            }}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (t === 'pagination') {
    const accent = accentOf(mapped, c);
    const radius = mapped.borderRadius || '6px';
    const pageStyle = (active) => ({
      minWidth: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: radius, fontSize: '0.72rem', padding: '0 0.3rem',
      backgroundColor: active ? accent : 'transparent',
      color: active ? '#fff' : (mapped.color || c.muted),
      border: `1px solid ${active ? accent : c.border}`,
    });
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: mapped.fontFamily }}>
        <span style={pageStyle(false)}>‹</span>
        <span style={pageStyle(false)}>1</span>
        <span style={pageStyle(true)}>2</span>
        <span style={pageStyle(false)}>3</span>
        <span style={{ color: c.muted, fontSize: '0.72rem', padding: '0 0.1rem' }}>…</span>
        <span style={pageStyle(false)}>8</span>
        <span style={pageStyle(false)}>›</span>
      </div>
    );
  }

  if (t === 'navbar') {
    const accent = accentOf(mapped, c);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', maxWidth: '250px',
        padding: '0.45rem 0.6rem', borderRadius: mapped.borderRadius || '8px',
        backgroundColor: c.surfaceAlt, border: `1px solid ${c.border}`,
        fontFamily: mapped.fontFamily,
        ...mapped,
      }}>
        <span style={{ width: '13px', height: '13px', borderRadius: '4px', backgroundColor: accent, flexShrink: 0 }} />
        {['Home', 'Docs', 'Team'].map((link, i) => (
          <span key={link} style={{
            fontSize: '0.72rem', color: mapped.color || (i === 0 ? c.text : c.muted),
            fontWeight: i === 0 ? 600 : 500,
          }}>
            {link}
          </span>
        ))}
        <span style={{
          width: '18px', height: '18px', borderRadius: '50%', marginLeft: 'auto', flexShrink: 0,
          backgroundColor: accent, opacity: 0.8,
        }} />
      </div>
    );
  }

  // An unknown template is shown as unsupported rather than as a blank frame,
  // so a preview that cannot be drawn never looks like one that is empty.
  return (
    <div style={{
      padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.72rem',
      color: c.muted, backgroundColor: c.surfaceAlt, border: `1px dashed ${c.border}`,
    }}>
      No preview for “{t || 'unknown'}” yet
    </div>
  );
}

export default renderComponentPreview;
