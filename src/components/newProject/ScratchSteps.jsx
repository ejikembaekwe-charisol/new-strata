import { useRef } from 'react';
import {
  PALETTES, FONT_PAIRINGS, INDUSTRIES, VIBES, CUSTOM_ID, KNOWN_FAMILIES,
  getSuggestion, resolvePalette, resolvePairing, industryLabel,
} from './designSystemData';
import { ColorSwatchButton } from '../ColorPicker';

// Steps for the from-scratch path. Hand-rolled inline styles on CSS vars, matching the
// rest of the app rather than introducing a component kit only here.

const card = (selected) => ({
  position: 'relative',
  background: 'var(--bg-secondary)',
  border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--border)'),
  boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
  borderRadius: '16px',
  padding: '1.1rem',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

const chip = (on) => ({
  padding: '0.45rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
  background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: on ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.82rem',
  fontWeight: on ? 600 : 400,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

const input = {
  width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '0.55rem 0.7rem', color: 'var(--text-primary)',
  fontSize: '0.85rem', fontFamily: 'inherit',
};

const grid = (min) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`, gap: '0.75rem' });

const h = { fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem', fontFamily: 'var(--font-heading)' };
const sub = { fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.6rem', lineHeight: 1.6 };

/** Shown on whichever card the lookup currently points at, so it tracks the answers. */
const SuggestedBadge = ({ label, vibe }) => (
  <span style={{
    position: 'absolute', top: '0.7rem', right: '0.7rem',
    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em',
    padding: '0.2rem 0.5rem', borderRadius: '999px',
    background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)',
    maxWidth: 'calc(100% - 1.4rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }}>
    Suggested for {label} · {vibe}
  </span>
);

export function BasicsStep({ data, set }) {
  return (
    <>
      <h2 style={h}>What are you building?</h2>
      <p style={sub}>
        Two answers, and the next steps start from a palette and type pairing that suit them.
        You can change anything afterwards.
      </p>

      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.7rem' }}>Industry</div>
      <div style={{ ...grid('170px'), marginBottom: '2rem' }}>
        {INDUSTRIES.map(i => (
          <button key={i.id} onClick={() => set({ industry: i.id })} style={{ ...card(data.industry === i.id), padding: '0.9rem 1rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: data.industry === i.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{i.name}</span>
          </button>
        ))}
      </div>

      {data.industry === 'other' && (
        <div style={{ margin: '-1.4rem 0 2rem' }}>
          <input
            style={input}
            placeholder="What industry is it?"
            value={data.customIndustry || ''}
            onChange={(e) => set({ customIndustry: e.target.value })}
            autoFocus
          />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0.45rem 0 0' }}>
            Used to label your system. Suggestions stay on the general starting point.
          </p>
        </div>
      )}

      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.7rem' }}>Primary vibe</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {VIBES.map(v => (
          <button key={v} onClick={() => set({ primaryVibe: v })} style={chip(data.primaryVibe === v)}>{v}</button>
        ))}
      </div>
    </>
  );
}

export function ColorsStep({ data, set }) {
  const setCustomPalette = (fn) => set(prev => ({
    customPalette: fn(prev.customPalette || {}),
    paletteId: CUSTOM_ID,
  }));
  const suggestion = getSuggestion(data.industry, data.primaryVibe);
  const custom = data.customPalette || {};
  // Functional update: three pickers changed in quick succession would otherwise each
  // spread a `custom` captured before the previous change committed, undoing it.
  const setCustom = (key, value) => setCustomPalette(prev => ({ ...prev, [key]: value }));
  return (
    <>
      <h2 style={h}>Pick a palette</h2>
      <p style={sub}>These become your brand colour tokens. Every value is editable later.</p>
      <div style={grid('220px')}>
        {PALETTES.map(p => (
          <button key={p.id} onClick={() => set({ paletteId: p.id })} style={card(data.paletteId === p.id)}>
            {suggestion?.paletteId === p.id && <SuggestedBadge label={industryLabel(data)} vibe={data.primaryVibe} />}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.9rem', marginTop: '1.1rem' }}>
              {[p.primary, p.secondary, p.accent].map(c => (
                <span key={c} style={{ flex: 1, height: '42px', borderRadius: '8px', background: c, border: '1px solid var(--border)' }} />
              ))}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>{p.primary}</div>
          </button>
        ))}

        {/* Bring your own. Never carries the suggested badge — a custom palette is by
            definition not the one the lookup picked. */}
        <div style={{ ...card(data.paletteId === CUSTOM_ID), cursor: 'default' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>Your own colours</div>
          {[['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent']].map(([key, name]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ColorSwatchButton
                value={custom[key] || '#000000'}
                onChange={(v) => setCustom(key, v.toUpperCase())}
                title={name}
                size={30}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', flex: 1 }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{custom[key] || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function TypographyStep({ data, set }) {
  const suggestion = getSuggestion(data.industry, data.primaryVibe);
  return (
    <>
      <h2 style={h}>Choose your type</h2>
      <p style={sub}>A heading and a body face. Specimens render in the real fonts.</p>
      <div style={grid('260px')}>
        {FONT_PAIRINGS.map(f => (
          <button key={f.id} onClick={() => set({ fontPairingId: f.id })} style={card(data.fontPairingId === f.id)}>
            {suggestion?.fontPairingId === f.id && <SuggestedBadge label={industryLabel(data)} vibe={data.primaryVibe} />}
            <div style={{ fontFamily: `'${f.heading}', sans-serif`, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.1rem' }}>
              {data.projectName || 'Your brand'}
            </div>
            <div style={{ fontFamily: `'${f.body}', sans-serif`, fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.6 }}>
              The quick brown fox jumps over the lazy dog.
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.8rem' }}>
              {f.heading} + {f.body} · {f.note}
            </div>
          </button>
        ))}

        {/* Name your own faces. The specimen renders in them, so a family that is neither
            loaded nor installed locally visibly falls back — which is the honest signal. */}
        <div style={{ ...card(data.fontPairingId === CUSTOM_ID), cursor: 'default' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>Your own typeface</div>
          {[['heading', 'Heading font'], ['body', 'Body font']].map(([key, name]) => (
            <div key={key} style={{ marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>{name}</span>
              <input
                style={input}
                list="np-families"
                placeholder={key === 'heading' ? 'e.g. Space Grotesk' : 'e.g. Inter'}
                value={(data.customPairing || {})[key] || ''}
                onChange={(e) => set({
                  customPairing: { ...(data.customPairing || {}), [key]: e.target.value },
                  fontPairingId: CUSTOM_ID,
                })}
              />
            </div>
          ))}
          <datalist id="np-families">
            {KNOWN_FAMILIES.map(f => <option key={f} value={f} />)}
          </datalist>
          {resolvePairing(data) && data.fontPairingId === CUSTOM_ID && (
            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: `'${resolvePairing(data).heading}', sans-serif`, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data.projectName || 'Your brand'}
              </div>
              <div style={{ fontFamily: `'${resolvePairing(data).body}', sans-serif`, fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function LogoStep({ data, set }) {
  const fileRef = useRef(null);
  const palette = resolvePalette(data);
  const pairing = resolvePairing(data);

  const onFile = (file) => {
    if (!file) return;
    // FileReader, not createObjectURL: a blob URL would be revoked on unmount, and this
    // value is stored on the project.
    const reader = new FileReader();
    reader.onload = () => set({ logoDataUrl: String(reader.result), logoMode: 'upload' });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <h2 style={h}>Add a logo</h2>
      <p style={sub}>Generate a wordmark from your name and type choice, or upload your own. You can skip this.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => set({ logoMode: 'generate' })} style={chip(data.logoMode === 'generate')}>Generate a wordmark</button>
        <button onClick={() => set({ logoMode: 'upload' })} style={chip(data.logoMode === 'upload')}>Upload</button>
      </div>

      {data.logoMode === 'upload' ? (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            style={{ border: '1.5px dashed var(--border)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}
          >
            {data.logoDataUrl
              ? <img src={data.logoDataUrl} alt="Your logo" style={{ maxHeight: '90px', maxWidth: '100%' }} />
              : <>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Click to upload or drop an image</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '0.3rem' }}>PNG, JPG, WebP or SVG</div>
                </>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
        </>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: pairing ? `'${pairing.heading}', sans-serif` : 'var(--font-heading)',
            fontSize: '2.2rem', fontWeight: 700,
            color: palette ? palette.primary : 'var(--accent)',
          }}>
            {data.projectName || 'Your brand'}
            <span style={{ color: palette ? palette.accent : 'var(--accent)' }}>.</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: '0.9rem' }}>
            Live preview in {pairing ? pairing.heading : 'your heading font'} and your primary colour
          </div>
        </div>
      )}
    </>
  );
}

export function VoiceStep({ data, set }) {
  const toggle = (v) => {
    const has = data.voiceTags.includes(v);
    set({ voiceTags: has ? data.voiceTags.filter(x => x !== v) : [...data.voiceTags, v] });
  };
  return (
    <>
      <h2 style={h}>How should it sound?</h2>
      <p style={sub}>Pick any that fit. Your primary vibe is already selected.</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {VIBES.map(v => <button key={v} onClick={() => toggle(v)} style={chip(data.voiceTags.includes(v))}>{v}</button>)}
      </div>
    </>
  );
}

export function ReviewStep({ data }) {
  const palette = resolvePalette(data);
  const pairing = resolvePairing(data);
  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border)' };
  const key = { fontSize: '0.8rem', color: 'var(--text-secondary)' };
  const val = { fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' };
  return (
    <>
      <h2 style={h}>Ready to build</h2>
      <p style={sub}>This becomes your starting design system. Everything stays editable.</p>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '0.6rem 1.25rem' }}>
        <div style={row}><span style={key}>Name</span><span style={val}>{data.projectName || '—'}</span></div>
        <div style={row}><span style={key}>Industry</span><span style={val}>{industryLabel(data) || '—'}</span></div>
        <div style={row}><span style={key}>Primary vibe</span><span style={val}>{data.primaryVibe || '—'}</span></div>
        <div style={row}>
          <span style={key}>Palette</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {palette && [palette.primary, palette.secondary, palette.accent].map(c => (
              <span key={c} style={{ width: '16px', height: '16px', borderRadius: '4px', background: c, border: '1px solid var(--border)' }} />
            ))}
            <span style={val}>{palette ? palette.name : '—'}</span>
          </span>
        </div>
        <div style={row}><span style={key}>Typography</span><span style={val}>{pairing ? pairing.heading + ' + ' + pairing.body : '—'}</span></div>
        <div style={row}><span style={key}>Logo</span><span style={val}>{data.logoDataUrl ? 'Uploaded' : data.logoMode === 'generate' ? 'Generated wordmark' : 'Skipped'}</span></div>
        <div style={{ ...row, borderBottom: 'none' }}><span style={key}>Voice</span><span style={val}>{data.voiceTags.length ? data.voiceTags.join(', ') : '—'}</span></div>
      </div>
    </>
  );
}
