// The template gallery: ready-made design systems, searchable and filterable.
//
// An overlay rather than a step, in the same frame ScratchWizard and BrandContextEngine
// use — it needs more width than the 680px create column, it behaves identically whether
// it was opened from the create page or from inside a project, and it needs no route.
//
// Every card is drawn from what its template actually delivers: the three colours it
// writes, on the canvas colour it writes, with real component previews and a real specimen
// in the faces it names. No screenshots, no stand-in imagery — there is none in this app
// and inventing some would make the card a picture of something that does not exist.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { renderComponentPreview } from '../componentPreviews';
import { hexToRgb, contrastRatio } from '../ColorPicker';
import { industryName, pairingById } from './designSystemData';
import { card, chip, grid, groupLabel } from './stepStyles';
import {
  TEMPLATES, INDUSTRY_FACETS, VIBE_FACETS, FREE_COUNT, matchesQuery, scaleLabel,
} from './templateData';

/**
 * Black or white, whichever is actually readable on this colour.
 *
 * The same WCAG maths the colour ramps use, rather than a guess about which palettes are
 * dark — five of these templates have a near-white canvas.
 */
const inkOn = (bg) => {
  const c = hexToRgb(bg);
  if (!c) return '#FFFFFF';
  const white = contrastRatio(c, hexToRgb('#FFFFFF')) || 0;
  const black = contrastRatio(c, hexToRgb('#0B0B0F')) || 0;
  return white >= black ? '#FFFFFF' : '#0B0B0F';
};

const mutedOn = (ink) => (ink === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : 'rgba(11,11,15,0.6)');

const pillTrack = {
  display: 'flex', gap: '0.3rem', background: 'var(--bg-tertiary)', padding: '0.25rem',
  borderRadius: '100px', border: '1px solid var(--border)', width: 'fit-content',
};
const pill = (on) => ({
  background: on ? 'var(--accent)' : 'transparent', border: 'none',
  padding: '0.35rem 0.9rem', borderRadius: '100px',
  color: on ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
});
const ghostBtn = {
  background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '999px',
  padding: '0.5rem 1.1rem', color: 'var(--text-secondary)',
  fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
};

/** The canvas: real previews on the template's own surface colour. */
const Canvas = ({ t, projectName, height = 132 }) => {
  const p = t.palette;
  const pair = pairingById(t.pairingId);
  const ink = inkOn(p.secondary);
  const shared = { fontFamily: `'${pair.body}', sans-serif`, borderRadius: '6px' };
  return (
    // inert, because renderComponentPreview returns a real <button> and a real <input>.
    // Focusable content inside an aria-hidden decoration is a keyboard trap, and a button
    // inside the card's own clickable area would be invalid markup. The card's real
    // controls are the named buttons beneath it.
    //
    // inert={true}, never inert="": React 19 maps the empty string to false, so the
    // attribute would never reach the DOM and both controls would stay tabbable.
    <div
      inert={true}
      aria-hidden="true"
      style={{
        background: p.secondary, height: height + 'px', padding: '0.85rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        gap: '0.5rem', overflow: 'hidden',
      }}
    >
      <div style={{
        fontFamily: `'${pair.heading}', sans-serif`, fontSize: '1.05rem', fontWeight: 700,
        color: p.primary, lineHeight: 1.1,
      }}>
        {projectName || 'Your brand'}<span style={{ color: p.accent }}>.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {renderComponentPreview({ template: 'button' }, {
          backgroundColor: p.primary, color: inkOn(p.primary),
          fontSize: '0.68rem', padding: '0.3rem 0.7rem', ...shared,
        }, { buttonLabel: 'Get started' })}
        {renderComponentPreview({ template: 'badge' }, {
          backgroundColor: p.accent, color: inkOn(p.accent), fontSize: '0.6rem', ...shared,
        })}
      </div>

      <div style={{
        fontFamily: `'${pair.body}', sans-serif`, fontSize: '0.66rem', color: mutedOn(ink),
      }}>
        {pair.heading} + {pair.body}
      </div>
    </div>
  );
};

const ProBadge = () => (
  <span style={{
    fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
    padding: '0.1rem 0.4rem', borderRadius: '999px',
    background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)',
  }}>PRO</span>
);

const TemplateCard = ({ t, projectName, onDetails, onUse }) => {
  const locked = t.tier === 'pro';
  const p = t.palette;
  return (
    <div style={{
      ...card(false), padding: 0, overflow: 'hidden', cursor: 'default',
      display: 'flex', flexDirection: 'column',
    }}>
      <Canvas t={t} projectName={projectName} />

      <div style={{
        padding: '0.75rem 0.85rem 0.8rem', display: 'flex', flexDirection: 'column',
        gap: '0.4rem', flex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <span style={{
            fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{t.name}</span>
          {locked && <ProBadge />}
        </div>

        {/* The three colour tokens it writes, in the strip the Colors step already uses. */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[p.primary, p.secondary, p.accent].map(c => (
            <span key={c} style={{
              flex: 1, height: '12px', borderRadius: '4px', background: c,
              border: '1px solid var(--border)',
            }} />
          ))}
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          {industryName(t.industry)} · {t.vibe} · {scaleLabel(t.scaleRatio)}
        </div>

        <div style={{
          marginTop: 'auto', paddingTop: '0.4rem', display: 'flex',
          alignItems: 'center', gap: '0.6rem',
        }}>
          {/* Not a disabled button: a disabled element fires no hover events, so its
              title never appears and the card would say "Needs Pro" with no way to
              learn what that means. It stays enabled and opens the details panel,
              which is where the explanation and the link to plans already are. */}
          <button
            type="button"
            onClick={() => (locked ? onDetails(t) : onUse(t))}
            title={locked
              ? 'Pro templates unlock when paid plans launch after beta — see what it contains'
              : 'Start from ' + t.name}
            style={{
              padding: '0.36rem 0.85rem', borderRadius: '999px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 600,
              background: locked ? 'transparent' : 'var(--accent)',
              border: locked ? '1px solid var(--accent)' : 'none',
              color: locked ? 'var(--accent)' : '#fff',
            }}
          >
            {locked ? 'See what it has' : 'Use this'}
          </button>
          <button
            type="button"
            onClick={() => onDetails(t)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'inherit',
            }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

const Details = ({ t, projectName, onClose, onUse, onShowFree }) => {
  const locked = t.tier === 'pro';
  const p = t.palette;
  const pair = pairingById(t.pairingId);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2100,
        background: 'rgba(9, 9, 12, 0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '16px', width: 'min(680px, 100%)', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <Canvas t={t} projectName={projectName} height={168} />

        <div style={{ padding: '1.4rem 1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{t.name}</h3>
            {locked && <ProBadge />}
          </div>
          <p style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.4rem 0 1.1rem',
            lineHeight: 1.6,
          }}>{t.description}</p>

          <div style={{ ...groupLabel, marginTop: 0 }}>Type</div>
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{
              fontFamily: `'${pair.heading}', sans-serif`, fontSize: '1.5rem',
              color: 'var(--text-primary)', lineHeight: 1.2,
            }}>{pair.heading}</div>
            <div style={{
              fontFamily: `'${pair.body}', sans-serif`, fontSize: '0.85rem',
              color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.6,
            }}>
              {pair.body} — the quick brown fox jumps over the lazy dog.
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
              {pair.note} · {scaleLabel(t.scaleRatio)}, {t.scaleRatio}× on {t.baseSize}
            </div>
          </div>

          <div style={groupLabel}>Colour</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
            {[['primary', p.primary], ['canvas', p.secondary], ['accent', p.accent]].map(([role, hex]) => (
              <div key={role} style={{ flex: 1 }}>
                <span style={{
                  display: 'block', height: '38px', borderRadius: '8px', background: hex,
                  border: '1px solid var(--border)',
                }} />
                <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  {role}
                </div>
                <div style={{
                  fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                }}>{hex.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={groupLabel}>What it writes</div>
          <p style={{
            fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 1.2rem',
            lineHeight: 1.65,
          }}>
            Five brand tokens — three colours and two typefaces — plus an eight-step type
            scale. Strata then derives 33 colour ramp steps from those three colours, and the
            line heights, weights and text styles from the scale. Every one is yours to change
            afterwards.
          </p>

          {locked && (
            <div style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '0.8rem 0.9rem', marginBottom: '1.2rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                This one needs Pro
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Everything it contains is on this page — the palette, the type, the scale and
                the tokens it writes. It just cannot be applied yet.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {locked ? (
              <>
                <Link
                  to="/pricing"
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: '999px', background: 'var(--accent)',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  See plans →
                </Link>
                <button type="button" style={ghostBtn} onClick={onShowFree}>Show free templates</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onUse(t)}
                style={{
                  padding: '0.5rem 1.2rem', borderRadius: '999px', border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: '0.85rem',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Use this template
              </button>
            )}
            <button type="button" style={ghostBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TemplateGallery({ projectName, onClose, onUse, onScratch }) {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [style, setStyle] = useState('all');
  const [details, setDetails] = useState(null);

  const results = TEMPLATES.filter(t =>
    (tier === 'all' || t.tier === tier)
    && (industry === 'all' || t.industry === industry)
    && (style === 'all' || t.vibe === style)
    && matchesQuery(t, query));

  const filtered = Boolean(query.trim()) || tier !== 'all' || industry !== 'all' || style !== 'all';
  const clearAll = () => { setQuery(''); setTier('all'); setIndustry('all'); setStyle('all'); };
  const lockedShown = results.filter(t => t.tier === 'pro').length;
  // The case worth naming separately: a filter that matches only locked templates would
  // otherwise be a dead end reached in two clicks.
  const allLocked = results.length > 0 && lockedShown === results.length && tier === 'all';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <div style={{
        height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0 1.5rem', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Strata<span style={{ color: 'var(--accent)' }}>.</span>
        </span>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Templates</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1,
          }}
        >×</button>
      </div>

      <div style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <h1 style={{
          fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)',
          margin: '0 0 0.5rem',
        }}>Start from a template</h1>
        {/* Said once, here, rather than repeated on every locked card. */}
        <p style={{
          fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 1.6rem',
          lineHeight: 1.6, maxWidth: '62ch',
        }}>
          {TEMPLATES.length} starting points, each built from a real palette and the type
          families Strata loads. <strong style={{ color: 'var(--text-primary)' }}>{FREE_COUNT} are
          free to use now.</strong> Pro templates are previewable in full — they unlock when
          paid plans launch after beta. Whichever you pick fills in the setup steps, so you can
          change anything before it is applied.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', borderRadius: '100px',
            padding: '0.45rem 1.1rem', width: '260px', maxWidth: '100%',
          }}>
            <span style={{ marginRight: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search templates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', width: '100%',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={pillTrack}>
            {[['all', 'All'], ['free', 'Free'], ['pro', 'Pro']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTier(id)} style={pill(tier === id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips rather than dropdowns: a closed select would hide that these twelve span
            seven industries, and the flow has no other select in it. */}
        <div style={{ marginBottom: '0.9rem' }}>
          <div style={groupLabel}>Industry</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setIndustry('all')} style={chip(industry === 'all')}>All</button>
            {INDUSTRY_FACETS.map(i => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIndustry(industry === i.id ? 'all' : i.id)}
                style={chip(industry === i.id)}
              >{i.name}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.4rem' }}>
          <div style={groupLabel}>Style</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setStyle('all')} style={chip(style === 'all')}>All</button>
            {VIBE_FACETS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setStyle(style === v ? 'all' : v)}
                style={chip(style === v)}
              >{v}</button>
            ))}
          </div>
        </div>

        <div style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span>
            {results.length} template{results.length === 1 ? '' : 's'}
            {tier === 'all' && lockedShown > 0 && ' · ' + lockedShown + ' need' + (lockedShown === 1 ? 's' : '') + ' Pro'}
          </span>
          {filtered && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--accent)', fontSize: '0.78rem', fontFamily: 'inherit',
              }}
            >Clear filters</button>
          )}
        </div>

        {results.length === 0 ? (
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '2.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              No template matches that.
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.2rem', lineHeight: 1.6 }}>
              {query.trim()
                ? 'Nothing matches “' + query.trim() + '” with those filters.'
                : 'Nothing matches those filters.'}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" style={ghostBtn} onClick={clearAll}>Clear filters</button>
              <button type="button" style={ghostBtn} onClick={onScratch}>Start from scratch instead</button>
            </div>
          </div>
        ) : (
          <>
            {allLocked && (
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1, minWidth: '14rem' }}>
                  {results.length === 1
                    ? 'The only template matching that needs Pro.'
                    : 'All ' + results.length + ' templates matching that need Pro.'}
                </span>
                <button type="button" style={ghostBtn} onClick={() => setTier('free')}>Show free only</button>
                <button type="button" style={ghostBtn} onClick={clearAll}>Clear filters</button>
              </div>
            )}
            <div style={{ ...grid('230px'), gap: '1rem' }}>
              {results.map(t => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  projectName={projectName}
                  onDetails={setDetails}
                  onUse={onUse}
                />
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: '2rem', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          None of these fit?{' '}
          <button
            type="button"
            onClick={onScratch}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--accent)', fontSize: '0.82rem', fontFamily: 'inherit',
            }}
          >Start from scratch instead →</button>
        </div>
      </div>

      {details && (
        <Details
          t={details}
          projectName={projectName}
          onClose={() => setDetails(null)}
          onUse={(t) => { setDetails(null); onUse(t); }}
          onShowFree={() => { setDetails(null); setTier('free'); }}
        />
      )}
    </div>
  );
}
