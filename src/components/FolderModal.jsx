// "Add colour folder": a named set of colours that is not a ramp.
//
// A ramp is one colour generated outward into eleven steps. Plenty of colour does not work
// that way — chart series, illustration swatches, a partner brand's palette — and had
// nowhere to go but the Other pile.
//
// A folder is created with its first colour rather than empty, because colour groups are
// derived from token names: an empty folder has no tokens to derive it from and would
// vanish the moment it was made.

import { useState } from 'react';
import { ColorSwatchButton, hexToRgb } from './ColorPicker';
import { slugifyRole } from '../data/tokenRefactor';

const START = [
  { id: 1, label: '', value: '#4F8DF5' },
  { id: 2, label: '', value: '#22C6A8' },
];

export default function FolderModal({ existingSlugs, background = '#0D0D12', onClose, onCreate }) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState(START);
  const [nextId, setNextId] = useState(3);

  const slug = slugifyRole(name);
  const taken = Boolean(slug) && existingSlugs.has(slug);

  // A row counts once it has a label and a colour we can read; a blank row is someone
  // part-way through rather than a mistake, so it is skipped rather than blocking.
  const usable = rows.filter(r => slugifyRole(r.label) && hexToRgb(r.value));
  const dupes = (() => {
    const seen = new Set(); const out = new Set();
    for (const r of usable) {
      const s = slugifyRole(r.label);
      if (seen.has(s)) out.add(s); else seen.add(s);
    }
    return [...out];
  })();
  const ready = Boolean(slug) && !taken && usable.length > 0 && dupes.length === 0;

  const setRow = (id, patch) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const tokens = usable.map(r => ({
    name: 'color.' + slug + '.' + slugifyRole(r.label),
    value: String(r.value).trim().toUpperCase(),
    type: 'color',
    // Brand, because these are literal palette values rather than aliases of anything.
    layer: 'Brand',
    description: name.trim() + ' — ' + r.label.trim(),
  }));

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 'min(520px, 94vw)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '18px', padding: '1.6rem',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
          Add colour folder
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          A named set of colours with no light-to-dark relationship — chart series,
          illustration swatches, a partner's palette. For a brand colour that needs a
          50&ndash;950 scale, use <strong style={{ color: 'var(--text-primary)' }}>Ramp</strong> instead.
        </p>

        <div style={{ marginBottom: '1.1rem' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Folder name
          </label>
          <input
            autoFocus
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Charts"
          />
          {slug && (
            <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              color.{slug}.*
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          Colours
        </div>
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem',
          marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem',
          maxHeight: '240px', overflowY: 'auto',
        }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ColorSwatchButton
                value={r.value}
                onChange={(hex) => setRow(r.id, { value: hex })}
                against={background}
                title={'Colour ' + (i + 1)}
                size={28}
                radius={6}
              />
              <input
                className="form-input"
                value={r.label}
                onChange={(e) => setRow(r.id, { label: e.target.value })}
                placeholder={'e.g. Series ' + (i + 1)}
                style={{ flex: 1, minWidth: 0, fontSize: '0.8rem' }}
              />
              <span style={{
                width: '70px', flexShrink: 0, fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem', color: 'var(--text-tertiary)',
              }}>
                {r.value}
              </span>
              <button
                type="button"
                onClick={() => setRows(rs => (rs.length > 1 ? rs.filter(x => x.id !== r.id) : rs))}
                disabled={rows.length === 1}
                title={rows.length === 1 ? 'A folder needs at least one colour' : 'Remove'}
                style={{
                  background: 'none', border: 'none', padding: '0.2rem', flexShrink: 0,
                  cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                  color: rows.length === 1 ? 'var(--text-tertiary)' : 'rgba(239,68,68,0.75)',
                  opacity: rows.length === 1 ? 0.4 : 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => { setRows(rs => [...rs, { id: nextId, label: '', value: '#8B5CF6' }]); setNextId(n => n + 1); }}
            style={{
              alignSelf: 'flex-start', background: 'none', border: 'none', padding: '0.15rem 0',
              cursor: 'pointer', color: 'var(--accent)', fontSize: '0.75rem', fontFamily: 'inherit',
            }}
          >
            ＋ Add another
          </button>
        </div>

        {taken && (
          <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.8rem' }}>
            This project already has a <strong>{name.trim()}</strong> group. Pick another name,
            or add colours to the existing one from its own ＋.
          </div>
        )}
        {dupes.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.8rem' }}>
            Two colours would end up with the same name ({dupes.join(', ')}).
          </div>
        )}
        {Boolean(name.trim()) && !slug && (
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: '0.8rem' }}>
            A folder name needs at least one letter or number.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <span style={{ marginRight: 'auto', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {usable.length} colour{usable.length === 1 ? '' : 's'} ready
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            onClick={() => onCreate(tokens)}
            style={!ready ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Create folder
          </button>
        </div>
      </div>
    </div>
  );
}
