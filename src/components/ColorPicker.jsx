// The colour editor used everywhere a colour is picked in Strata.
//
// Replaces the browser's native <input type="color">, which looks different on
// every OS and tells you nothing about whether the colour is actually usable.
// This one shows the WCAG contrast ratio against the surface the colour will sit
// on, and shades the region of the picker that fails AA — so the failing area is
// computed from the real contrast formula, not drawn for decoration.

import React, { useState, useRef, useEffect, useMemo } from 'react';

/* ── colour maths ── */

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

export const hexToRgb = (hex) => {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const alphaFromHex = (hex) => {
  const h = String(hex || '').trim().replace(/^#/, '');
  if (h.length !== 8 || !/^[0-9a-f]{8}$/i.test(h)) return 1;
  return parseInt(h.slice(6, 8), 16) / 255;
};

const to2 = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
export const rgbToHex = ({ r, g, b }) => '#' + to2(r) + to2(g) + to2(b);

export const rgbToHsv = ({ r, g, b }) => {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
};

export const hsvToRgb = ({ h, s, v }) => {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const i = Math.floor(h / 60) % 6;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][i] || [0, 0, 0];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

const channelLum = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
export const luminance = ({ r, g, b }) =>
  0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b);

/** WCAG 2.1 contrast ratio, 1–21. */
export const contrastRatio = (a, b) => {
  if (!a || !b) return null;
  const la = luminance(a), lb = luminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

/* ── drag helper: pointer capture so a drag survives leaving the element ── */
const useDrag = (onMove) => {
  const ref = useRef(null);
  const start = (e) => {
    const el = ref.current;
    if (!el) return;
    const fire = (ev) => {
      const r = el.getBoundingClientRect();
      onMove(clamp01((ev.clientX - r.left) / r.width), clamp01((ev.clientY - r.top) / r.height));
    };
    fire(e);
    const move = (ev) => { ev.preventDefault(); fire(ev); };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return [ref, start];
};

const CHECKER =
  'linear-gradient(45deg, #7a7a86 25%, transparent 25%, transparent 75%, #7a7a86 75%),' +
  'linear-gradient(45deg, #7a7a86 25%, transparent 25%, transparent 75%, #7a7a86 75%)';

/**
 * The picker panel.
 *
 * `against` is the colour the contrast ratio is measured against — the surface
 * this colour will actually sit on. It can be flipped between the dark and light
 * ground with the badge on the left, because a brand colour usually has to work
 * on both.
 */
export function ColorPicker({ value, onChange, against = '#0D0D12', alt = '#FFFFFF', width = 252 }) {
  const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };
  const [hsv, setHsv] = useState(() => rgbToHsv(rgb));
  const [alpha, setAlpha] = useState(() => alphaFromHex(value));
  const [format, setFormat] = useState('Hex');
  const [text, setText] = useState(null);
  const [compareAlt, setCompareAlt] = useState(false);
  const [hasEyeDropper] = useState(() => typeof window !== 'undefined' && 'EyeDropper' in window);

  // Follow the value when it is changed from outside (a hex typed in the field
  // beside us, a preset chosen elsewhere) without fighting an in-progress drag.
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = hexToRgb(value);
    if (!next) return;
    setHsv(rgbToHsv(next));
    setAlpha(alphaFromHex(value));
    lastEmitted.current = value;
  }, [value]);

  const emit = (nextHsv, nextAlpha) => {
    const hex = rgbToHex(hsvToRgb(nextHsv));
    const out = nextAlpha >= 1 ? hex : hex + to2(nextAlpha * 255);
    lastEmitted.current = out;
    onChange(out);
  };

  const setSV = (s, v) => { const n = { ...hsv, s, v: 1 - v }; setHsv(n); emit(n, alpha); };
  const setHue = (x) => { const n = { ...hsv, h: x * 360 }; setHsv(n); emit(n, alpha); };
  const setAlphaAt = (x) => { setAlpha(x); emit(hsv, x); };

  const [svRef, svStart] = useDrag(setSV);
  const [hueRef, hueStart] = useDrag((x) => setHue(x));
  const [alphaRef, alphaStart] = useDrag((x) => setAlphaAt(x));

  const current = hsvToRgb(hsv);
  const currentHex = rgbToHex(current);
  const groundHex = compareAlt ? alt : against;
  const ground = hexToRgb(groundHex) || { r: 0, g: 0, b: 0 };
  const ratio = contrastRatio(current, ground);
  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;

  // Where contrast against the current ground crosses 4.5:1, sampled across the
  // square. Everything on the failing side is shaded, so you can see at a glance
  // which part of this hue is unusable on that surface.
  const failPath = useMemo(() => {
    const cols = 32, groundLum = luminance(ground);
    const need = (lum) => {
      const hi = Math.max(lum, groundLum), lo = Math.min(lum, groundLum);
      return (hi + 0.05) / (lo + 0.05) >= 4.5;
    };
    const pts = [];
    for (let i = 0; i <= cols; i++) {
      const s = i / cols;
      let lo = 0, hi = 1, edge = null;
      // contrast is monotonic in v for a fixed hue and saturation, so bisect
      if (need(luminance(hsvToRgb({ h: hsv.h, s, v: 0 }))) === need(luminance(hsvToRgb({ h: hsv.h, s, v: 1 })))) {
        edge = need(luminance(hsvToRgb({ h: hsv.h, s, v: 1 }))) ? 0 : 1;
      } else {
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          if (need(luminance(hsvToRgb({ h: hsv.h, s, v: mid })))) hi = mid; else lo = mid;
        }
        edge = (lo + hi) / 2;
      }
      pts.push([s * 100, (1 - edge) * 100]);
    }
    return pts;
  }, [hsv.h, groundHex]);

  const displayText = text !== null ? text : (
    format === 'Hex' ? currentHex.replace('#', '')
    : format === 'RGB' ? `${Math.round(current.r)}, ${Math.round(current.g)}, ${Math.round(current.b)}`
    : `${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`
  );

  const commitText = (raw) => {
    setText(null);
    const t = String(raw).trim();
    if (format === 'Hex') {
      const next = hexToRgb(t.startsWith('#') ? t : '#' + t);
      if (next) { const n = rgbToHsv(next); setHsv(n); emit(n, alpha); }
      return;
    }
    const nums = t.split(/[,\s]+/).map(Number).filter(n => !Number.isNaN(n));
    if (nums.length < 3) return;
    if (format === 'RGB') {
      const n = rgbToHsv({ r: clamp01(nums[0] / 255) * 255, g: clamp01(nums[1] / 255) * 255, b: clamp01(nums[2] / 255) * 255 });
      setHsv(n); emit(n, alpha);
    } else {
      const n = { h: ((nums[0] % 360) + 360) % 360, s: clamp01(nums[1] / 100), v: clamp01(nums[2] / 100) };
      setHsv(n); emit(n, alpha);
    }
  };

  const pickFromScreen = async () => {
    try {
      const res = await new window.EyeDropper().open();
      const next = hexToRgb(res.sRGBHex);
      if (next) { const n = rgbToHsv(next); setHsv(n); emit(n, alpha); }
    } catch (e) {
      // the user dismissed the picker — nothing to do
    }
  };

  const sq = width - 32;
  const handle = (x, y, size = 14) => ({
    position: 'absolute', left: `${x}%`, top: `${y}%`,
    width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
    borderRadius: '50%', border: '2px solid #fff',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
  });

  return (
    <div style={{
      width, background: '#1E1E24', border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
      boxShadow: '0 16px 40px rgba(0,0,0,0.55)', fontFamily: 'inherit',
    }}>
      {/* contrast readout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={() => setCompareAlt(v => !v)}
          title={`Contrast against ${groundHex} — click to compare against ${compareAlt ? against : alt}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none',
            padding: 0, cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
          }}
        >
          <span style={{
            width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.35)',
            background: `linear-gradient(90deg, ${currentHex} 50%, ${groundHex} 50%)`,
          }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.01em' }}>
            {ratio ? ratio.toFixed(2) : '—'} : 1
          </span>
        </button>
        <span
          title={passAAA ? 'Passes AAA (7:1)' : passAA ? 'Passes AA (4.5:1)' : 'Below AA (4.5:1)'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.72rem', fontWeight: 600,
            color: passAA ? '#fff' : 'rgba(255,255,255,0.4)',
          }}
        >
          {passAA ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          )}
          {passAAA ? 'AAA' : 'AA'}
        </span>
      </div>

      {/* saturation / value square */}
      <div
        ref={svRef}
        onPointerDown={svStart}
        style={{
          position: 'relative', width: '100%', height: sq, borderRadius: '6px',
          cursor: 'crosshair', touchAction: 'none', overflow: 'hidden',
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
      >
        {/* the region that fails AA against the compared surface */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="cp-fail" width="3" height="3" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="rgba(0,0,0,0.42)" />
              <circle cx="1.5" cy="1.5" r="0.5" fill="rgba(255,255,255,0.30)" />
            </pattern>
          </defs>
          <path
            d={`M0,100 L${failPath.map(([x, y]) => `${x},${y}`).join(' L')} L100,100 Z`}
            fill="url(#cp-fail)"
          />
          <polyline
            points={failPath.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.6" vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span style={handle(hsv.s * 100, (1 - hsv.v) * 100, 15)} />
      </div>

      {/* eyedropper + sliders */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {hasEyeDropper && (
          <button
            type="button"
            onClick={pickFromScreen}
            title="Pick a colour from the screen"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.75)', display: 'flex', flexShrink: 0 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/>
              <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>
            </svg>
          </button>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          <div
            ref={hueRef}
            onPointerDown={hueStart}
            style={{
              position: 'relative', height: 12, borderRadius: '99px', cursor: 'pointer', touchAction: 'none',
              background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
          >
            <span style={handle((hsv.h / 360) * 100, 50, 14)} />
          </div>
          <div
            ref={alphaRef}
            onPointerDown={alphaStart}
            style={{
              position: 'relative', height: 12, borderRadius: '99px', cursor: 'pointer', touchAction: 'none',
              backgroundImage: `linear-gradient(to right, transparent, ${currentHex}), ${CHECKER}`,
              backgroundSize: '100% 100%, 8px 8px, 8px 8px',
              backgroundPosition: '0 0, 0 0, 4px 4px',
              backgroundColor: '#fff',
            }}
          >
            <span style={handle(alpha * 100, 50, 14)} />
          </div>
        </div>
      </div>

      {/* format, value, opacity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <select
          value={format}
          onChange={(e) => { setFormat(e.target.value); setText(null); }}
          style={{
            background: '#2A2A32', color: '#fff', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '7px', padding: '0.35rem 0.3rem', fontSize: '0.72rem',
            fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {['Hex', 'RGB', 'HSL'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <input
          value={displayText}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commitText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitText(e.currentTarget.value); } }}
          spellCheck={false}
          style={{
            flex: 1, minWidth: 0, background: '#2A2A32', color: '#fff',
            border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px',
            padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', outline: 'none',
          }}
        />
        <div style={{
          display: 'flex', alignItems: 'center', background: '#2A2A32',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', flexShrink: 0,
        }}>
          <input
            value={Math.round(alpha * 100)}
            onChange={(e) => {
              const n = Number(String(e.target.value).replace(/[^\d]/g, ''));
              if (!Number.isNaN(n)) setAlphaAt(clamp01(n / 100));
            }}
            style={{
              width: 30, background: 'none', color: '#fff', border: 'none',
              padding: '0.35rem 0 0.35rem 0.4rem', fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem', outline: 'none', textAlign: 'right',
            }}
          />
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', padding: '0 0.4rem 0 0.2rem' }}>%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * A swatch that opens the picker in a popover — the drop-in replacement for
 * <input type="color">. Rendered fixed and measured from the trigger, so it is
 * never clipped by a scrolling dialog.
 */
export function ColorSwatchButton({
  value, onChange, disabled, title, against, alt,
  size = 32, radius = 6, style,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc, true); };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    const w = 252, h = 360;
    setPos({
      top: Math.min(r.bottom + 6, Math.max(8, window.innerHeight - h - 8)),
      left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8),
    });
    setOpen(true);
  };

  const solid = (hexToRgb(value) && rgbToHex(hexToRgb(value))) || 'transparent';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={title || value}
        style={{
          width: size, height: size, borderRadius: radius, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.18)', padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: solid,
          backgroundImage: CHECKER,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px',
          opacity: disabled ? 0.55 : 1,
          ...style,
        }}
      >
        <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: radius - 1, background: solid }} />
      </button>
      {open && pos && (
        <div ref={popRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 2300 }}>
          <ColorPicker value={value} onChange={onChange} against={against} alt={alt} />
        </div>
      )}
    </>
  );
}

export default ColorPicker;
