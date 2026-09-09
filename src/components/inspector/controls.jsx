// The typed controls the inspector uses: segmented toggles for keywords, a number
// field with an optional slider for lengths, a swatch for colours, and the four-up
// T/R/B/L grid for padding and margin.
//
// Every control is uncontrolled-by-value: it renders whatever string is stored and
// reports a new string back. A stored value is either a token name or a literal —
// `resolveTokenValue` in ProjectDetail already falls through to the literal, so both
// render correctly with no special casing here.

import { useState, useRef, useEffect } from 'react';
import { ColorSwatchButton, hexToRgb, rgbToHex } from '../ColorPicker';
import { groupColorNames } from '../../data/tokenGroups';
import {
  SEGMENTED_OPTIONS, KEYWORD_OPTIONS, SLIDER_RANGES, SIDE_GROUPS,
  controlKind, isLiteralOnly, helpFor,
} from './inspectorSections';

/* ── shared bits ── */

// Native tooltips honour newlines, so the explanation gets its own line.
const nl2 = String.fromCharCode(10, 10);

const S = {
  row: { display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', gap: '0.5rem', alignItems: 'center', minHeight: '30px' },
  label: { fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  field: {
    width: '100%', minWidth: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '0.3rem 0.45rem', color: 'var(--text-primary)',
    fontSize: '0.72rem', fontFamily: 'inherit', outline: 'none',
  },
  segWrap: { display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px', gap: '2px' },
  seg: (on) => ({
    flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
    padding: '0.22rem 0.3rem', fontSize: '0.68rem', minWidth: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: on ? 'var(--bg-secondary)' : 'none',
    color: on ? 'var(--text-primary)' : 'var(--text-tertiary)',
    fontWeight: on ? 600 : 400,
    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
  }),
};

const ICONS = {
  horizontal: <><line x1="4" y1="12" x2="20" y2="12" /><polyline points="8 8 4 12 8 16" /><polyline points="16 8 20 12 16 16" /></>,
  vertical: <><line x1="12" y1="4" x2="12" y2="20" /><polyline points="8 8 12 4 16 8" /><polyline points="8 16 12 20 16 16" /></>,
  alignStart: <><line x1="4" y1="4" x2="4" y2="20" /><rect x="8" y="8" width="9" height="8" rx="1" /></>,
  alignCenter: <><line x1="12" y1="4" x2="12" y2="20" /><rect x="7" y="8" width="10" height="8" rx="1" /></>,
  alignEnd: <><line x1="20" y1="4" x2="20" y2="20" /><rect x="7" y="8" width="9" height="8" rx="1" /></>,
  spaceBetween: <><line x1="4" y1="4" x2="4" y2="20" /><line x1="20" y1="4" x2="20" y2="20" /><rect x="7" y="9" width="4" height="6" rx="1" /><rect x="13" y="9" width="4" height="6" rx="1" /></>,
};
const Icon = ({ name }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

// Hover text for a property: its full name (the column clips the longer ones), the
// exact CSS property it maps to, and what that property actually does.
// A starting name for a token created from a row: the property's own words, so `gap`
// suggests gap.custom and `background-color` suggests background-color.custom.
const suggestedTokenName = (prop) => prop + '.custom';

const tooltipFor = (label, prop, reason) => {
  const head = label + '  ·  ' + prop;
  // A reason and the help sentence say overlapping things — several help sentences already
  // state the dependency in prose ("Only visible once a border width and style are set").
  // Whichever is more useful right now, on its own, rather than both.
  const tail = reason || helpFor(prop);
  return tail ? head + nl2 + tail : head;
};

/* ── individual controls ── */

export const Segmented = ({ prop, value, onChange }) => (
  <div style={S.segWrap}>
    {SEGMENTED_OPTIONS[prop].map(opt => {
      const on = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          // clicking the active segment clears it, so a property can be unset again
          onClick={() => onChange(on ? '' : opt.value)}
          title={opt.label}
          style={S.seg(on)}
        >
          {opt.icon ? <Icon name={opt.icon} /> : opt.label}
        </button>
      );
    })}
  </div>
);

export const KeywordSelect = ({ prop, value, onChange }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ ...S.field, cursor: 'pointer' }}>
    <option value="">—</option>
    {KEYWORD_OPTIONS[prop].map(v => <option key={v} value={v}>{v}</option>)}
  </select>
);

// Splits "12px" into 12 and "px" so the slider can move the number without losing the unit.
const splitValue = (raw, fallbackUnit) => {
  const m = String(raw ?? '').trim().match(/^(-?[\d.]+)\s*([a-z%]*)$/i);
  if (!m) return { num: '', unit: fallbackUnit || '' };
  return { num: m[1], unit: m[2] || fallbackUnit || '' };
};

export const NumberField = ({ prop, value, onChange }) => {
  const range = SLIDER_RANGES[prop];
  const unit = range && !range.unitless ? range.unit : '';
  const { num } = splitValue(value, unit);
  const [draft, setDraft] = useState(null);
  const shown = draft !== null ? draft : (value || '');

  const commit = (text) => {
    setDraft(null);
    const t = String(text).trim();
    if (!t) { onChange(''); return; }
    // a bare number picks up the property's usual unit; anything else is passed through
    onChange(/^-?[\d.]+$/.test(t) && unit ? t + unit : t);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
      <input
        value={shown}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }}
        placeholder="—"
        style={{ ...S.field, width: range ? '58px' : '100%', flexShrink: 0 }}
      />
      {range && (
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={num === '' ? range.min : Number(num)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(range.unitless ? v : v + (range.unit || ''));
          }}
          style={{ flex: 1, minWidth: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
      )}
    </div>
  );
};

/**
 * Inline "create a token" form, opened from any row's dropdown.
 *
 * Prefilled from the row: the name from the property, the value from whatever the row
 * already shows — so a literal you have dialled in becomes the token's value rather than
 * having to be retyped. Refuses a name that already exists instead of creating a second
 * token that shadows the first.
 */
export const NewTokenForm = ({ prop, suggestedName, suggestedValue, existingNames, onCancel, onCreate }) => {
  const [name, setName] = useState(suggestedName);
  const [value, setValue] = useState(suggestedValue || '');
  const [layer, setLayer] = useState('Component');
  const taken = existingNames.includes(name.trim());
  const ready = name.trim() && value.trim() && !taken;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
      background: 'var(--bg)', border: '1px solid var(--accent)',
      borderRadius: '7px', padding: '0.45rem',
    }}>
      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
        New token for {prop}
      </span>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="token.name"
        style={{ ...S.field, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="value"
        style={{ ...S.field, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}
      />
      <select
        value={layer}
        onChange={(e) => setLayer(e.target.value)}
        title="Which tier this token belongs to"
        style={{ ...S.field, fontSize: '0.68rem', cursor: 'pointer' }}
      >
        <option value="Brand">Brand</option>
        <option value="Semantic">Semantic</option>
        <option value="Component">Scoped</option>
      </select>
      {taken && (
        <span style={{ fontSize: '0.62rem', color: '#EF4444' }}>
          A token called {name.trim()} already exists.
        </span>
      )}
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button
          type="button"
          disabled={!ready}
          onClick={() => onCreate({ name: name.trim(), value: value.trim(), layer })}
          style={{
            flex: 1, border: 'none', borderRadius: '5px', cursor: ready ? 'pointer' : 'not-allowed',
            background: ready ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: ready ? '#fff' : 'var(--text-tertiary)',
            fontSize: '0.68rem', padding: '0.28rem', fontFamily: 'inherit', fontWeight: 600,
          }}
        >
          Create &amp; map
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: '1px solid var(--border)', borderRadius: '5px', cursor: 'pointer',
            background: 'none', color: 'var(--text-secondary)', fontSize: '0.68rem',
            padding: '0.28rem 0.5rem', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/**
 * Token picker for colour properties.
 *
 * A native <select> can only show token names, which is no use when the thing being
 * chosen is a colour — `color.bg.surface` and `brand.color.secondary` are
 * indistinguishable as text. This shows each token as its actual colour alongside its
 * name and resolved value, so you pick by eye and by name at once.
 *
 * Rendered fixed and measured from the trigger, because the inspector scrolls and a
 * normally-positioned list would be clipped by it.
 */
// A preset's value may be an alias like {brand.color.primary}, which is not paintable.
// Only draw a swatch for something that actually looks like a colour.
const asSwatchValue = (v) => (/^(#|rgb|hsl)/i.test(String(v || '').trim()) ? v : '');

export const TokenColorSelect = ({ value, options, presets = [], resolve, onChange, onAdopt, onNewToken }) => {
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
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    const w = 258, h = 300;
    setPos({
      top: Math.min(r.bottom + 4, Math.max(8, window.innerHeight - h - 8)),
      left: Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8),
    });
    setOpen(true);
  };

  const resolved = resolve(value);
  const isLiteral = Boolean(value) && !options.includes(value);
  const swatch = (v) => ({
    width: 15, height: 15, borderRadius: '4px', flexShrink: 0,
    background: v || 'transparent',
    border: v ? '1px solid rgba(255,255,255,0.18)' : '1px dashed var(--border)',
  });

  // Ramps took a project's colours from about fifteen to about fifty, and a flat list that
  // long is worse than a short one. Grouped by the same rule the Tokens page folders by —
  // see groupColorNames — so the two cannot disagree. Null means one group, i.e. flat.
  const grouped = groupColorNames(options);
  const groups = grouped || [{ label: null, names: options }];

  const groupHeading = {
    fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--text-tertiary)', padding: '0.15rem 0.3rem 0.2rem',
  };

  const swatchButton = (name) => {
    const v = resolve(name);
    return (
      <button
        key={name}
        type="button"
        onClick={() => { onChange(name); setOpen(false); }}
        title={name + (v ? '  ·  ' + v : '')}
        style={{
          width: '100%', aspectRatio: '1', borderRadius: '5px', cursor: 'pointer', padding: 0,
          background: v || 'var(--bg-tertiary)',
          border: name === value ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
        }}
      />
    );
  };

  const nameButton = (name) => {
    const v = resolve(name);
    return (
      <button
        key={name}
        type="button"
        onClick={() => { onChange(name); setOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', textAlign: 'left',
          background: name === value ? 'var(--bg-tertiary)' : 'none',
          border: 'none', borderRadius: '5px', cursor: 'pointer',
          padding: '0.22rem 0.3rem', fontFamily: 'inherit',
        }}
      >
        <span style={swatch(v)} />
        <span style={{
          flex: 1, minWidth: 0, fontSize: '0.7rem', color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {v}
        </span>
      </button>
    );
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="pd-token-color-trigger"
        onClick={toggle}
        title={value ? value + (resolved ? '  ·  ' + resolved : '') : 'Pick a colour token'}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', minWidth: 0,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px',
          padding: '0.28rem 0.4rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={swatch(resolved)} />
        <span style={{
          flex: 1, minWidth: 0, fontSize: '0.72rem',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value ? (isLiteral ? value + ' (literal)' : value) : (options.length ? '—' : 'No tokens yet')}
        </span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={popRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 2400, width: 258,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '10px', boxShadow: '0 14px 34px rgba(0,0,0,0.55)',
            padding: '0.5rem', maxHeight: 300, overflowY: 'auto',
          }}
        >
          {options.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', padding: '0.3rem' }}>
              No colour tokens in this project yet.
            </div>
          ) : (
            <>
              {/* pick by eye — one grid per ramp, so the list reads as a palette rather
                  than forty-odd unrelated squares */}
              {groups.map(g => (
                <div key={'sw:' + (g.label || '_')} style={{ marginBottom: '0.4rem' }}>
                  {g.label && <div style={groupHeading}>{g.label}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
                    {g.names.map(swatchButton)}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0 0.35rem' }} />
              {/* pick by name, with the colour and what it resolves to */}
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  borderRadius: '5px', cursor: 'pointer', padding: '0.22rem 0.3rem',
                  fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'inherit',
                }}
              >
                Clear
              </button>
              {groups.map(g => (
                <div key={'nm:' + (g.label || '_')}>
                  {g.label && <div style={groupHeading}>{g.label}</div>}
                  {g.names.map(nameButton)}
                </div>
              ))}
            </>
          )}

          {/* Starter-set colours this project does not have. Shown as swatches like any
              other colour, but under their own heading so it is clear they do not exist
              yet — picking one creates it. */}
          {presets.length > 0 && onAdopt && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0 0.35rem' }} />
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', padding: '0 0.3rem 0.25rem' }}>
                Presets — creates the token
              </div>
              {presets.map(t => {
                const v = resolve(t.value) || t.value;
                return (
                  <button
                    key={'preset:' + t.name}
                    type="button"
                    onClick={() => { onAdopt(t); setOpen(false); }}
                    title={'Create ' + t.name + ' (' + t.value + ') and map it'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', borderRadius: '5px', cursor: 'pointer',
                      padding: '0.22rem 0.3rem', fontFamily: 'inherit',
                    }}
                  >
                    <span style={swatch(asSwatchValue(v))} />
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: '0.7rem', color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{t.name}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {t.value}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {onNewToken && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0 0.35rem' }} />
              <button
                type="button"
                onClick={() => { setOpen(false); onNewToken(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '0.22rem 0.3rem',
                  fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'inherit',
                }}
              >
                ＋ New token…
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export const ColorControl = ({ value, onChange, resolve }) => {
  const resolved = resolve ? resolve(value) : value;
  const rgb = hexToRgb(resolved);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
      <ColorSwatchButton
        value={rgb ? rgbToHex(rgb) : '#FFFFFF'}
        onChange={onChange}
        size={22}
        radius={5}
        title={value || 'Pick a colour'}
      />
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        style={{ ...S.field, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}
      />
    </div>
  );
};

/**
 * The four-up side grid. One field while linked, four while not — matching the
 * reference's single/per-side toggle. Switching to per-side seeds each side from the
 * shorthand so nothing silently changes on screen.
 */
export const SidesControl = ({ prop, tokens, onChangeMany, inherited = '' }) => {
  const sides = SIDE_GROUPS[prop];
  const anySide = sides.some(s => tokens[s]);
  const [perSide, setPerSide] = useState(anySide);

  const toggle = (next) => {
    setPerSide(next);
    if (next) {
      // linked → per-side: copy the shorthand out to each side, then drop it
      const from = tokens[prop] || '';
      const patch = { [prop]: '' };
      sides.forEach(s => { patch[s] = tokens[s] || from; });
      onChangeMany(patch);
    } else {
      // per-side → linked: keep the top value as the shorthand, clear the sides
      const patch = { [prop]: tokens[sides[0]] || tokens[prop] || '' };
      sides.forEach(s => { patch[s] = ''; });
      onChangeMany(patch);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
        {!perSide && (
          <input
            value={tokens[prop] || ''}
            onChange={(e) => onChangeMany({ [prop]: e.target.value })}
            placeholder={inherited || '—'}
            title={inherited && !tokens[prop] ? 'Inherited: ' + inherited : undefined}
            style={{
              ...S.field, flex: 1,
              // shown as a placeholder because it is not set here — typing overrides it
              borderStyle: inherited && !tokens[prop] ? 'dashed' : 'solid',
            }}
          />
        )}
        {perSide && <span style={{ flex: 1, fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>Per side</span>}
        <div style={{ ...S.segWrap, flexShrink: 0, width: 'auto' }}>
          {[[false, 'Linked'], [true, 'Per side']].map(([mode, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => toggle(mode)}
              title={label}
              style={{ ...S.seg(perSide === mode), flex: 'none', padding: '0.22rem 0.35rem' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {mode
                  ? <><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" /></>
                  : <><rect x="3" y="3" width="18" height="18" rx="2" /></>}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {perSide && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
            {sides.map(side => (
              <input
                key={side}
                value={tokens[side] || ''}
                onChange={(e) => onChangeMany({ [side]: e.target.value })}
                placeholder="—"
                title={side}
                style={{ ...S.field, textAlign: 'center', padding: '0.28rem 0.15rem' }}
              />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', marginTop: '0.15rem' }}>
            {['T', 'R', 'B', 'L'].map(l => (
              <span key={l} style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * One inspector row. Token-first: a property that can reference a token opens in token
 * mode with a toggle to enter a literal instead. Keyword properties skip the toggle —
 * no token can hold the value `flex-start`, so offering a picker would be offering
 * something that cannot exist.
 */
export function InspectorRow({
  prop, label, tokens, tokenOptions, presets = [], resolve, onChange, onChangeMany,
  onCreateToken, existingTokenNames = [], inherited = '', inheritedFrom = '',
  // Why this property cannot take effect here, or why the preview cannot show it:
  // `{ kind: 'inactive' | 'preview', reason, held }` — see applicability.js. Absent on
  // most rows, and an absent note renders exactly as this row always did.
  note = null,
}) {
  const kind = controlKind(prop);
  const value = tokens[prop] || '';
  const literalOnly = isLiteralOnly(prop);
  const isToken = Boolean(value) && tokenOptions.includes(value);
  const [mode, setMode] = useState(literalOnly ? 'raw' : (isToken || !value ? 'token' : 'raw'));
  const [creating, setCreating] = useState(false);

  // A property that cannot take effect dims its row — but only while the row is empty.
  // A row holding a value is never dimmed and never made inert, because greying it would
  // trap a mapping with no way left to clear it. That single rule is why there is no
  // precedence puzzle here: the accent label a literal earns always survives, and the
  // trapped-data case cannot arise.
  const inactive = note && note.kind === 'inactive' ? note : null;
  // A different claim, and deliberately quieter: the property does apply and is exported,
  // but this template's preview cannot show it. Only worth saying once something is
  // actually mapped — an empty row has nothing for the preview to fail to draw.
  const previewGap = note && note.kind === 'preview' && (value || inherited) ? note : null;
  const asleep = Boolean(inactive) && !value && !inherited;

  // One click wakes a dimmed row. These rules read Strata's template and mappings, not the
  // user's real component, so a wrong answer has to cost a click rather than block the
  // edit — the same bargain the inherited row below already strikes.
  const [woken, setWoken] = useState(false);
  // A ref rather than state so the effect needs no dependency on it: the row must not
  // re-arm while a NumberField holds an uncommitted draft or a colour popover is open,
  // because `inert` would swallow both.
  const busy = useRef({ focused: false, creating: false });
  // Mirrored in an effect rather than written during render, so the un-waking effect below
  // can read it without taking a dependency on it. Declared first, so it has already run
  // by the time that one does.
  useEffect(() => { busy.current.creating = creating; }, [creating]);

  // Moving to another component must not leave a row woken from the last one.
  const reasonKey = inactive ? inactive.reason : '';
  useEffect(() => {
    if (!busy.current.focused && !busy.current.creating) setWoken(false);
  }, [reasonKey]);

  if (kind === 'sides') {
    // No rule gates padding or margin, so this row is never dimmed. It could not show a
    // reason honestly anyway: it swallows four side properties and has one place to put a
    // sentence. If a rule ever targets them, all five must share one answer.
    return (
      <div style={{ ...S.row, alignItems: 'start' }}>
        <span className="pd-inspector-label" style={{ ...S.label, paddingTop: '0.35rem' }} title={tooltipFor(label, prop)} data-prop={prop}>{label}</span>
        <SidesControl prop={prop} tokens={tokens} onChangeMany={onChangeMany} inherited={inherited} />
      </div>
    );
  }

  // Choosing a preset creates the token and maps it in one action.
  const adopt = (token) => {
    const name = onCreateToken ? onCreateToken(prop, token) : token.name;
    onChange(name);
  };

  const control = () => {
    if (creating) {
      return (
        <NewTokenForm
          prop={prop}
          suggestedName={suggestedTokenName(prop)}
          suggestedValue={resolve(value) || value}
          existingNames={existingTokenNames}
          onCancel={() => setCreating(false)}
          onCreate={(token) => { setCreating(false); adopt(token); }}
        />
      );
    }
    if (mode === 'token' && !literalOnly) {
      // A colour token is unreadable as plain text in a native select, so those get a
      // picker that shows each token as its colour, its name and what it resolves to.
      if (kind === 'color') {
        return (
          <TokenColorSelect
            value={value}
            options={tokenOptions}
            presets={presets}
            resolve={resolve}
            onChange={onChange}
            onAdopt={adopt}
            onNewToken={onCreateToken ? () => setCreating(true) : null}
          />
        );
      }
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <select
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__new__') { setCreating(true); return; }
              if (v.startsWith('preset:')) {
                const preset = presets.find(t => t.name === v.slice(7));
                if (preset) adopt(preset);
                return;
              }
              onChange(v);
            }}
            style={{ ...S.field, cursor: 'pointer', flex: 1 }}
            title={tokenOptions.length ? undefined : 'No tokens of this kind yet'}
          >
            <option value="">{tokenOptions.length ? '—' : 'No tokens yet'}</option>
            {/* A literal can be showing while the row sits in token mode — after flipping
                back, say. Listing it keeps the control honest about what is applied
                instead of reading as empty. */}
            {value && !tokenOptions.includes(value) && (
              <option value={value}>{value} (literal)</option>
            )}
            {tokenOptions.map(t => <option key={t} value={t}>{t}</option>)}
            {/* Starter-set tokens this project does not have. Picking one creates it. */}
            {presets.length > 0 && (
              <optgroup label="Presets — creates the token">
                {presets.map(t => (
                  <option key={'preset:' + t.name} value={'preset:' + t.name}>
                    {t.name}  ({t.value})
                  </option>
                ))}
              </optgroup>
            )}
            {onCreateToken && <option value="__new__">＋ New token…</option>}
          </select>
        </div>
      );
    }
    if (kind === 'segmented') return <Segmented prop={prop} value={value} onChange={onChange} />;
    if (kind === 'keyword') return <KeywordSelect prop={prop} value={value} onChange={onChange} />;
    if (kind === 'color') return <ColorControl value={value} onChange={onChange} resolve={resolve} />;
    if (kind === 'slider') return <NumberField prop={prop} value={value} onChange={onChange} />;
    return <NumberField prop={prop} value={value} onChange={onChange} />;
  };

  const holdingLiteral = Boolean(value) && !isToken;
  // Three states a row can be in: its own value, a value coming from a parent, or unset.
  // An override is only an override if something is actually being overridden.
  const isInherited = !value && Boolean(inherited);
  const isOverride = Boolean(value) && Boolean(inherited);

  // Takes the slot the {} / ab toggle vacates, so the label column loses no width. Mono,
  // because the toggle it stands in for was mono.
  const naMark = (
    <span
      aria-hidden="true"
      title={inactive ? inactive.reason : undefined}
      style={{
        flexShrink: 0, fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
        lineHeight: 1, color: 'var(--text-tertiary)',
      }}
    >
      n/a
    </span>
  );

  const previewMark = (
    <span
      title={previewGap ? previewGap.reason : undefined}
      style={{ flexShrink: 0, fontSize: '0.58rem', lineHeight: 1, color: 'var(--text-tertiary)' }}
    >
      preview
    </span>
  );

  if (asleep && !woken) {
    const title = tooltipFor(label, prop, inactive.reason);
    // No aria-disabled on the row: it holds the wake control, and marking the row disabled
    // makes that control read as disabled too — which would hide the one escape hatch from
    // exactly the people who most need it announced. Its own aria-label carries the state.
    return (
      <div style={S.row} data-inactive={prop}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
          <span
            className="pd-inspector-label"
            style={{ ...S.label, color: 'var(--text-tertiary)' }}
            title={title}
            data-prop={prop}
          >
            {label}
          </span>
          {naMark}
        </span>
        {/* The hover target is this wrapper, which is a live element. A `title` on a
            disabled control never appears — a disabled element fires no hover events — so
            the reason would be invisible, which is the whole point of the feature. `inert`
            on the inside takes the real control out of pointer, tab and screen-reader
            reach without the `disabled` attribute being involved at all. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWoken(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWoken(true); } }}
          title={inactive.reason + nl2 + 'Click to set it anyway.'}
          aria-label={label + ' does not apply to this component. ' + inactive.reason + ' Activate to set it anyway.'}
          style={{ minWidth: 0, cursor: 'pointer', borderRadius: '6px' }}
        >
          {/* 0.55, not lower: the light theme is the binding constraint, and a keyword
              select faded past this stops being readable, which reads as broken rather
              than as unavailable. */}
          <div inert={true} style={{ opacity: 0.55, minWidth: 0 }}>
            {control()}
          </div>
        </div>
      </div>
    );
  }

  // Said out loud rather than left to a tooltip. This is the one actionable state — a
  // mapping that is real, is still in the exported CSS, and does nothing — and it can sit
  // inside a collapsed section where a hover would never happen.
  const card = inactive && !asleep ? (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.4rem', minWidth: 0,
      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
      borderRadius: '7px', padding: '0.32rem 0.4rem',
    }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: '0.62rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
        {inactive.reason}{' '}
        <span style={{ color: 'var(--text-tertiary)' }}>
          {value
            ? 'Still mapped, and still in the exported CSS.'
            : 'Inherited from ' + (inheritedFrom || 'the parent') + ' — clear it there.'}
        </span>
      </span>
      {/* Only where clearing would do something. On an inherited value the mapping lives
          on the ancestor, so this button would delete nothing and is not offered. */}
      {Boolean(value) && (
        <button
          type="button"
          onClick={() => onChange('')}
          title={'Remove the ' + prop + ' mapping from this component'}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
            color: 'var(--accent)', fontSize: '0.62rem', fontFamily: 'inherit', lineHeight: 1.4,
          }}
        >
          Clear
        </button>
      )}
    </div>
  ) : null;

  // Wrapped only when there is something to wrap, so a row with no note renders the
  // markup it always did.
  const cell = (inner) => (card
    ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>{inner}{card}</div>
    : inner);
  const rowStyle = card ? { ...S.row, alignItems: 'start' } : S.row;
  const labelPad = card ? { paddingTop: '0.35rem' } : null;

  if (isInherited) {
    return (
      <div style={rowStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0, ...labelPad }}>
          <span
            className="pd-inspector-label"
            style={{ ...S.label, color: 'var(--text-tertiary)' }}
            title={tooltipFor(label, prop)}
            data-prop={prop}
          >
            {label}
          </span>
          {inactive && naMark}
          {previewGap && previewMark}
        </span>
        {/* Shown but not editable in place: typing here would silently create an override,
            so the row asks first. Never inerted, even when the value cannot take effect —
            this button is the only way to take the property over. */}
        {cell(
          <button
            type="button"
            className="pd-inspector-inherited"
            onClick={() => onChange(inherited)}
            title={'Inherited' + (inheritedFrom ? ' from ' + inheritedFrom : '') + ' — click to override on this component'}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%', minWidth: 0,
              background: 'none', border: '1px dashed var(--border)', borderRadius: '6px',
              padding: '0.26rem 0.4rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            {kind === 'color' && (
              <span style={{
                width: 15, height: 15, borderRadius: '4px', flexShrink: 0,
                background: resolve(inherited) || 'transparent',
                border: '1px solid rgba(255,255,255,0.18)', opacity: 0.75,
              }} />
            )}
            <span style={{
              flex: 1, minWidth: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{inherited}</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>inherited</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={rowStyle}
      onFocusCapture={() => { busy.current.focused = true; }}
      onBlurCapture={() => { busy.current.focused = false; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0, ...labelPad }}>
        <span
          className="pd-inspector-label"
          style={{ ...S.label, color: holdingLiteral ? 'var(--accent)' : 'var(--text-secondary)' }}
          title={tooltipFor(label, prop)}
          data-prop={prop}
        >
          {label}
        </span>
        {isOverride && (
          <button
            type="button"
            onClick={() => onChange('')}
            title={'Overriding' + (inheritedFrom ? ' ' + inheritedFrom : '') + ' — reset to the inherited value'}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
              color: 'var(--accent)', fontSize: '0.62rem', lineHeight: 1, fontFamily: 'inherit',
            }}
          >
            ↺
          </button>
        )}
        {!literalOnly && (
          <button
            type="button"
            onClick={() => setMode(m => (m === 'token' ? 'raw' : 'token'))}
            title={mode === 'token' ? 'Enter a literal value instead' : 'Pick a token instead'}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
              color: mode === 'token' ? 'var(--text-tertiary)' : 'var(--accent)',
              fontSize: '0.58rem', fontFamily: 'var(--font-mono)', lineHeight: 1,
            }}
          >
            {mode === 'token' ? '{}' : 'ab'}
          </button>
        )}
        {inactive && naMark}
        {previewGap && previewMark}
      </span>
      {cell(control())}
    </div>
  );
}
