// The template gallery: ready-made design systems, searchable and filterable.
//
// Rendered inline, directly under StartChoice's two cards, rather than behind a third
// card of its own. Templates are the easiest way in, so they are visible without a click
// — and a door that looked like the other two but opened a browser rather than starting
// something was the wrong shape for them. Both callers widen their container to suit.
//
// Content only, no frame: the create page puts it on a page and the Brand Bible puts it
// in a modal, exactly as they already do for StartChoice.
//
// Every card is drawn from what its template actually delivers: the three colours it
// writes, on the canvas colour it writes, with real component previews and a real specimen
// in the faces it names. No screenshots, no stand-in imagery — there is none in this app
// and inventing some would make the card a picture of something that does not exist.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renderComponentPreview } from '../componentPreviews';
import { inkOn } from '../../data/ink';
import DesignSystemView from '../DesignSystemView';
import { systemFromTemplate } from '../../data/templateSystem';
import { industryName, pairingById } from './designSystemData';
import { card, chip, chipCount, grid, groupLabel } from './stepStyles';
import {
  TEMPLATES, INDUSTRY_FACETS, VIBE_FACETS, FREE_COUNT, scaleLabel,
  selectTemplates, facetCounts,
} from './templateData';

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

// A template's detail view, built from DesignSystemView.
//
// The community page at /explore/:id briefly shared this design and has since gone back
// to its own — so this is now the only place the scrolling layout appears.
//
// It is an overlay rather than a route on purpose. Both callers render the gallery inline
// (step 2 of /projects/new, and the Get Started modal inside a project), and navigating
// away from either would throw away a half-finished create flow — on /projects/new the
// project does not exist yet, so the typed name lives only in component state.
//
// The system it shows is built by systemFromTemplate, which runs the template through the
// same tokensFromChoices -> deriveTokens path the wizard runs on Apply. So the counts here
// are what you get, not an estimate: thirteen authored tokens become eighty-nine.
const Details = ({ t, onClose, onUse, onShowFree }) => {
  const locked = t.tier === 'pro';
  const system = systemFromTemplate(t);

  // Escape closes it. Captured, so it wins before anything underneath can act on the key,
  // and the gallery behind stays exactly where it was.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Not named useBtn: a `use` prefix makes ESLint read it as a hook.
  const applyBtn = (big) => (
    <button
      type="button"
      onClick={() => onUse(t)}
      style={{
        padding: big ? '0.7rem 1.5rem' : '0.55rem 1.2rem', borderRadius: '999px',
        border: 'none', background: 'var(--accent)', color: '#fff',
        fontSize: big ? '0.88rem' : '0.85rem', fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', touchAction: 'manipulation',
      }}
    >
      Use this template
    </button>
  );

  const plansBtn = (
    <Link
      to="/pricing"
      style={{
        padding: '0.55rem 1.2rem', borderRadius: '999px', background: 'var(--accent)',
        color: '#fff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
      }}
    >
      See plans →
    </Link>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2100, overflowY: 'auto',
        background: 'rgba(9, 9, 12, 0.92)', backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        // Without this, scrolling past the end of this panel scrolls the gallery behind it.
        overscrollBehavior: 'contain',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: '20px', width: 'min(1080px, 100%)', margin: '0 auto',
          padding: '1.5rem 2rem 3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', marginBottom: '1.25rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Template{locked ? ' · needs Pro' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              background: 'none', border: 'none', color: 'var(--text-tertiary)',
              cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: 0,
            }}
          >×</button>
        </div>

        <DesignSystemView
          name={system.name}
          description={system.description}
          color={system.color}
          brand={system.brand}
          tokensMap={system.tokensMap}
          components={system.components}
          meta={system.meta}
          actions={locked ? (
            <>
              {plansBtn}
              <button type="button" style={ghostBtn} onClick={onShowFree}>Show free templates</button>
            </>
          ) : applyBtn(false)}
          footerTitle={locked ? t.name + ' needs Pro' : 'Start from ' + t.name}
          footerBody={locked
            ? 'Everything it contains is on this page — the palette, the type, the scale and every token it writes. It just cannot be applied yet.'
            : 'Picking it fills in the setup steps with these answers, so you can change anything before it is applied.'}
          footerActions={locked ? plansBtn : applyBtn(true)}
        />
      </div>
    </div>
  );
};

export default function TemplateGallery({ projectName, onUse }) {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  // Arrays, not single ids: OR inside a facet, AND across them. An empty array means the
  // facet is unconstrained, which is what the "All" chip restores.
  const [industries, setIndustries] = useState([]);
  const [styles, setStyles] = useState([]);
  const [details, setDetails] = useState(null);

  const selection = { industries, styles, tier, query };
  const results = selectTemplates(selection);
  // How many each chip would yield given everything else. Counting a facet ignores that
  // facet's own selections, so picking one industry never zeroes out the rest.
  const counts = facetCounts(selection);

  // The same toggle shape the tone chips in BrandContextEngine and the voice tags in
  // ScratchSteps already use, so a chip row behaves the same wherever it appears.
  const toggle = (list, set) => (v) =>
    set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const toggleIndustry = toggle(industries, setIndustries);
  const toggleStyle = toggle(styles, setStyles);

  const filtered = Boolean(query.trim()) || tier !== 'all' || industries.length > 0 || styles.length > 0;
  const clearAll = () => { setQuery(''); setTier('all'); setIndustries([]); setStyles([]); };
  const lockedShown = results.filter(t => t.tier === 'pro').length;
  // The case worth naming separately: a filter that matches only locked templates would
  // otherwise be a dead end reached in two clicks.
  const allLocked = results.length > 0 && lockedShown === results.length && tier === 'all';

  return (
    <div>
      {/* A rule and a heading, because this is a second offer under the first two rather
          than more of the same thing. */}
      <div style={{
        borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.75rem',
      }}>
        <h3 style={{
          margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)',
        }}>Or start from a template</h3>
        {/* Said once, here, rather than repeated on every locked card. */}
        <p style={{
          fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.4rem 0 1.4rem',
          lineHeight: 1.6, maxWidth: '62ch',
        }}>
          {TEMPLATES.length} starting points, each built from a real palette and the type
          families Strata loads. <strong style={{ color: 'var(--text-primary)' }}>{FREE_COUNT} are
          free to use now.</strong> Pro templates are previewable in full — they unlock when
          paid plans launch after beta. Picking one fills in the same steps as building from
          scratch, so you can change anything before it is applied.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          {/* The ring is on the pill, not the input: the input clears its own outline,
              and a caret alone is not a focus indicator. */}
          <div className="sf-search" style={{
            display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', borderRadius: '100px',
            padding: '0.45rem 1.1rem', width: '260px', maxWidth: '100%',
          }}>
            <span aria-hidden="true" style={{ marginRight: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🔍</span>
            <input
              type="text"
              aria-label="Search templates"
              autoComplete="off"
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', width: '100%',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {/* Mutually exclusive, so role=radiogroup — the same shape as the component-kind
              chooser in ProjectDetail, which is this codebase's one worked example. */}
          <div style={pillTrack} role="radiogroup" aria-label="Pricing tier">
            {[['all', 'All'], ['free', 'Free'], ['pro', 'Pro']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="sf-focus"
                role="radio"
                aria-checked={tier === id}
                onClick={() => setTier(id)}
                style={pill(tier === id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips rather than dropdowns: a closed select would hide that these twelve span
            seven industries, and the flow has no other select in it.

            Multi-select, and every chip carries the number it would yield. With 44 of the
            56 industry-x-style pairs empty, a single-select row could only ever narrow
            toward nothing; the counts make the shape of the collection visible and a chip
            that would return nothing is dimmed rather than clickable. */}
        <div style={{ marginBottom: '0.9rem' }}>
          <div style={groupLabel} id="tg-industry-label">Industry</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}
               role="group" aria-labelledby="tg-industry-label">
            <button
              type="button"
              className="sf-focus"
              aria-pressed={industries.length === 0}
              onClick={() => setIndustries([])}
              style={chip(industries.length === 0)}
            >
              All<span style={chipCount(industries.length === 0)}>{counts.industryAll}</span>
            </button>
            {INDUSTRY_FACETS.map(i => {
              const on = industries.includes(i.id);
              const n = counts.industry[i.id];
              // A selected chip may legitimately count 0 — pick SaaS & Tech, then Warm.
              // It has to stay clickable or the selection could never be undone.
              const dead = n === 0 && !on;
              return (
                <button
                  key={i.id}
                  type="button"
                  className="sf-focus"
                  aria-pressed={on}
                  disabled={dead}
                  onClick={() => toggleIndustry(i.id)}
                  style={chip(on, dead)}
                >
                  {i.name}<span style={chipCount(on)}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '1.4rem' }}>
          <div style={groupLabel} id="tg-style-label">Style</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}
               role="group" aria-labelledby="tg-style-label">
            <button
              type="button"
              className="sf-focus"
              aria-pressed={styles.length === 0}
              onClick={() => setStyles([])}
              style={chip(styles.length === 0)}
            >
              All<span style={chipCount(styles.length === 0)}>{counts.styleAll}</span>
            </button>
            {VIBE_FACETS.map(v => {
              const on = styles.includes(v);
              const n = counts.style[v];
              const dead = n === 0 && !on;
              return (
                <button
                  key={v}
                  type="button"
                  className="sf-focus"
                  aria-pressed={on}
                  disabled={dead}
                  onClick={() => toggleStyle(v)}
                  style={chip(on, dead)}
                >
                  {v}<span style={chipCount(on)}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          {/* Announced, because narrowing the set is the one thing on this screen that
              changes content without moving focus. */}
          <span aria-live="polite">
            {filtered
              ? results.length + ' of ' + TEMPLATES.length + ' templates'
              : TEMPLATES.length + ' templates'}
            {tier === 'all' && lockedShown > 0 && ' · ' + lockedShown + ' need' + (lockedShown === 1 ? 's' : '') + ' Pro'}
          </span>
          {filtered && (
            <button
              type="button"
              className="sf-focus"
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
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button type="button" style={ghostBtn} onClick={clearAll}>Clear filters</button>
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

      </div>

      {details && (
        <Details
          t={details}
          onClose={() => setDetails(null)}
          onUse={(t) => { setDetails(null); onUse(t); }}
          onShowFree={() => { setDetails(null); setTier('free'); }}
        />
      )}
    </div>
  );
}
