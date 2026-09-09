// The explanation for one property row: what it is called, the CSS property it maps to,
// what that property does, and — when the row is dimmed or the preview cannot show it —
// why.
//
// The copy is not new. PROPERTY_HELP has carried a sentence for all 81 properties for a
// while, shown as a native `title` on an 11px label. Nothing invited that hover, so it
// went unread; and a native tooltip waits about a second, never appears on keyboard focus,
// and never appears at all on a touch device.
//
// Rendered fixed and measured from the icon, because the inspector scrolls and an
// absolutely-positioned panel would be clipped by it — the same reason TokenColorSelect
// and ColorSwatchButton are fixed. Nothing in the rail's ancestor chain sets a transform,
// so a fixed child escapes to the viewport.

import { useEffect, useLayoutEffect, useRef } from 'react';

const TIP_W = 260;
// Clear of the icon without leaving a gap the pointer could fall into.
const GAP = 10;
// Kept off every edge by the same 8px the two existing popovers use.
const EDGE = 8;

/** The Lucide info glyph, the same path already used by the callout in NewProjectModal. */
export const InfoIcon = ({ size = 12 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Mounted only while it is showing, so the caller renders `{open && <HelpTip …/>}`. That
 * keeps the measure-and-place below a one-shot: there is no previous position to flash at
 * on the way back in.
 */
export default function HelpTip({ anchorRef, label, prop, help, reason, reasonKind, onClose }) {
  const tipRef = useRef(null);

  // Measured, not estimated. The two popovers in this codebase hardcode a height because
  // theirs is fixed; a tooltip is two to five lines depending on the sentence, and guessing
  // would push the short ones off-centre.
  //
  // Written straight to the node rather than held in state: this is a DOM read followed by
  // a DOM write in the same layout pass, which is exactly what a layout effect is for, and
  // it costs no extra render.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const h = tip.offsetHeight;

    // Left of the icon by preference. The rail is pinned to the right edge, so there is
    // empty page over there, and a tip that opens leftward never covers the control the
    // reader is about to use. On a phone the rail is the full width and there is no room,
    // so it drops below instead.
    const room = a.left - GAP - TIP_W >= EDGE;
    const left = room
      ? a.left - GAP - TIP_W
      : Math.min(Math.max(EDGE, a.left), window.innerWidth - TIP_W - EDGE);
    const top = room
      ? Math.min(Math.max(EDGE, a.top + a.height / 2 - h / 2), window.innerHeight - h - EDGE)
      : Math.min(a.bottom + GAP, Math.max(EDGE, window.innerHeight - h - EDGE));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.style.visibility = 'visible';
    // Re-measured when the content changes underneath it, not only on open: mapping
    // `display: flex` clears the reason on `justify-content` while its tip is showing, and
    // the panel would otherwise stay centred on the height it no longer has.
  }, [anchorRef, label, prop, help, reason, reasonKind]);

  // Escape closes it, captured and stopped so it does not also close the drawer or dialog
  // the row sits in — the same guard TokenColorSelect uses.
  //
  // Scrolling closes it too. The position is measured once, and by the time the rail has
  // moved the pointer has already left the icon, so repositioning would be work in service
  // of nothing. Both existing popovers get this wrong and float away from their trigger.
  useEffect(() => {
    // Tabbing to a control that is below the fold makes the browser scroll it into view,
    // and that scroll arrives just after the focus that opened this tip — so closing on
    // every scroll would make the keyboard path work only for rows already on screen.
    // A user scroll a moment later still closes it.
    const openedAt = Date.now();
    const onScroll = () => { if (Date.now() - openedAt > 250) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    // There is no hover on a phone, and the rail is full-width there rather than hidden, so
    // the icon is tapped instead. A tap has to be dismissable by tapping elsewhere.
    const away = (e) => { if (!anchorRef.current?.contains(e.target)) onClose(); };
    document.addEventListener('keydown', esc, true);
    document.addEventListener('pointerdown', away);
    // Passive: this never calls preventDefault, so it must not sit in the scroll path.
    // Capture, because scroll does not bubble off the rail's own scroller.
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('keydown', esc, true);
      document.removeEventListener('pointerdown', away);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onClose);
    };
  }, [onClose, anchorRef]);

  return (
    <div
      ref={tipRef}
      role="tooltip"
      className="pd-help-tip"
      id={'help-tip-' + prop}
      style={{
        position: 'fixed',
        // Off-screen and hidden for the measuring pass, so the first paint cannot be seen
        // at 0,0 and cannot widen the page. The layout effect above moves it and reveals it
        // before the browser paints.
        //
        // CAREFUL: the effect writes top/left/visibility straight to this node, which works
        // only because this style object is value-identical on every render, so React's
        // diff emits no style write. Put anything render-dependent in here and React will
        // rewrite the whole block, snapping the tip back to -9999 where it is invisible.
        top: 0, left: -9999, visibility: 'hidden',
        width: TIP_W, zIndex: 2500,
        // --bg-tertiary, not --bg-secondary. In light theme --bg-secondary is #FFFFFF, and
        // so is the dialog this tip opens over and the rail it drops onto on a phone — a
        // white panel on white behind a hairline. --bg-tertiary is what every field in the
        // inspector already uses, so it reads as raised in both themes.
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-bright)',
        borderRadius: '10px',
        // A themed shadow rather than the hardcoded one the two colour popovers use. It is
        // the only reason this panel works in light theme at all.
        boxShadow: 'var(--shadow-dropdown)',
        padding: '0.6rem 0.7rem',
        // Purely informational, so it never takes the pointer — which also means it can
        // never steal the hover that is keeping it open.
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-tertiary)',
        marginTop: '0.1rem',
      }}>
        {prop}
      </div>
      {help && (
        <p style={{
          fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)',
          margin: '0.45rem 0 0',
        }}>
          {help}
        </p>
      )}
      {/* Shown alongside the explanation rather than instead of it. The native tooltip had
          room for one or the other, so a dimmed row lost the description of the property —
          which is the row most likely to need it.

          Captioned, because the two kinds of note are different claims: one says the
          property cannot work here, the other says it works and exports but this preview
          cannot draw it. Presenting them identically under a bare rule would blur that. */}
      {reason && (
        <div style={{
          margin: '0.5rem 0 0', paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-bright)',
        }}>
          <span style={{
            display: 'block', fontSize: '0.58rem', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.2rem',
          }}>
            {reasonKind === 'preview' ? 'Not shown in the preview' : 'Does not apply here'}
          </span>
          {/* --text-secondary, not tertiary: four lines of tertiary at 0.7rem is the same
              colour as the caption above it, and this is the longest sentence in the panel.
              The caption carries the "secondary" signal instead. */}
          <p style={{
            margin: 0, fontSize: '0.7rem', lineHeight: 1.45, color: 'var(--text-secondary)',
          }}>
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
