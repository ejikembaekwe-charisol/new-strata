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

import { useState } from 'react';
import { inkOn } from '../../data/ink';
import { hexToRgb, contrastRatio } from '../ColorPicker';
import { industryName, pairingById } from './designSystemData';
import { card, chip, chipCount, grid, groupLabel } from './stepStyles';
import { brandAssetsFor } from '../../data/brandAssets';
import {
  TEMPLATES, INDUSTRY_FACETS, VIBE_FACETS, FREE_COUNT, scaleLabel,
  selectTemplates, facetCounts,
} from './templateData';

/**
 * `want` if it is legible on `bg`, otherwise plain black or white.
 *
 * 3:1 is the WCAG threshold for large text, which is what this is. A palette whose primary
 * sits too close to its canvas would otherwise render the name nearly invisible — the same
 * failure the brand marks had before they were given a plate.
 */
const readableOn = (want, bg) => {
  const a = hexToRgb(want), b = hexToRgb(bg);
  if (!a || !b) return want;
  return (contrastRatio(a, b) || 0) >= 3 ? want : inkOn(bg);
};


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
// The canvas shows a template's identity and nothing else: its mark if it has one, its
// name if it does not. It needs no project name now — the specimen that used to borrow it
// is gone.
const Canvas = ({ t, height = 132 }) => {
  const p = t.palette;
  const pair = pairingById(t.pairingId);
  const brand = brandAssetsFor(t.id);

  // A template that interprets a real product is recognised by its mark, so the mark is all
  // the canvas shows. No inert needed here: an <img> is not focusable, unlike the real
  // button and input the specimen below renders.
  if (brand) {
    return (
      <div
        aria-hidden="true"
        style={{
          background: p.secondary, height: height + 'px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* A light plate behind every mark, not just the ones that need it. These icons are
            inconsistent — some ship their own background, some are a bare glyph — and
            Framer's dark mark on its near-black canvas was invisible without one. A plate
            on all eight is also what the reference grid does. */}
        <span style={{
          width: '64px', height: '64px', borderRadius: '14px', flexShrink: 0,
          background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img
            src={brand.logo}
            alt=""
            width="40"
            height="40"
            style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block' }}
          />
        </span>
      </div>
    );
  }

  // The other twelve have no mark, so the name is the mark: set in the template's own
  // heading face, on its own canvas colour, centred where the logo sits on the branded
  // eight. That keeps the grid one thing rather than two, and the wordmark still shows the
  // heading typeface now that the pairing line underneath is gone.
  //
  // No inert here either — there is nothing focusable left once the button and input are
  // gone, only text.
  return (
    <div
      aria-hidden="true"
      style={{
        background: p.secondary, height: height + 'px', padding: '0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <span style={{
        fontFamily: `'${pair.heading}', sans-serif`, fontSize: '1.5rem', fontWeight: 700,
        // The palettes are built so the primary reads on the canvas, but a pair that is too
        // close would make the name vanish the way Framer's mark did. inkOn is the fallback.
        color: readableOn(p.primary, p.secondary),
        lineHeight: 1.15, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        {t.name}<span style={{ color: p.accent }}>.</span>
      </span>
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

// A card is a link to the template's own page, and nothing else.
//
// It opens in a new tab on purpose: reading a template should never cost you the screen you
// were standing on — on /projects/new that screen holds a project name that exists nowhere
// else yet. Applying therefore happens on that page rather than here, which is why the card
// carries no buttons of its own.
//
// The link is stretched across the card rather than wrapped around it. Canvas renders a
// real <button> and a real <input>, and an <a> may not contain interactive content any more
// than a <button> may; as a sibling it nests nothing. Being a real <a href> is also what
// makes middle-click, ctrl-click and "open in new window" behave the way they should.
const TemplateCard = ({ t }) => {
  const locked = t.tier === 'pro';
  const p = t.palette;
  return (
    <div className="tpl-card" style={{
      ...card(false), padding: 0, overflow: 'hidden', cursor: 'default',
      display: 'flex', flexDirection: 'column', position: 'relative',
      // Through a custom property so the class below can flip it on hover and focus. The
      // inline border card() writes would otherwise beat any rule without !important.
      border: '1px solid var(--tpl-border, var(--border))',
    }}>
      {/* The mark is the canvas for a branded template — Canvas decides, so the card does
          not need to know which templates have one. */}
      <Canvas t={t} />

      <div style={{
        padding: '0.75rem 0.85rem 0.85rem', display: 'flex', flexDirection: 'column',
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

        <a
          className="sf-focus"
          href={'/templates/' + t.id}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.name + ' — opens in a new tab'}
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        />
      </div>
    </div>
  );
};

// A Details overlay stood here, opened from the card. Cards are links to /templates/:id
// now, so the template's own page is the detail view and this had nothing left to do.

// No props at all now: the gallery browses, /templates/:id applies, and the cards show the
// template's own identity rather than borrowing the project's name for a specimen.
export default function TemplateGallery() {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  // Arrays, not single ids: OR inside a facet, AND across them. An empty array means the
  // facet is unconstrained, which is what the "All" chip restores.
  const [industries, setIndustries] = useState([]);
  const [styles, setStyles] = useState([]);

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
      {/* Ships with the markup it targets, the way DesignSystemView carries its own rules.
          index.css is deliberately untouched — the focus ring reuses .sf-focus from there
          rather than inventing a second convention for the same job. */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tpl-card:hover, .tpl-card:focus-within { --tpl-border: var(--accent); }
      `}} />

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
            {/* The same glyph the Tokens and Components searches use, rather than an
                emoji — which renders as a different picture on every platform and at a
                weight the rest of the iconography does not share. */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true"
              style={{ marginRight: '8px', color: 'var(--text-tertiary)', flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          </>
        )}

      </div>

    </div>
  );
}
