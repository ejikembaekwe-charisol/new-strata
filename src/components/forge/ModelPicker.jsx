// Switching model, from the list the providers actually returned.
//
// The frame this follows had its own list of models on it — Claude Opus 4.8, GPT 5.6 Luna,
// Qwen3.8 Max and a dozen more. Most of those do not exist, and the ones that do would be
// out of date within the month. Strata does not have to guess: testing a key already returns
// that provider's real model list, so this shows that, grouped by provider, and nothing else.
//
// The frame anticipated the gap itself. It has a row with "Setup" on the right for a model
// you cannot use yet, and that is exactly what a provider with no key is — so an unconnected
// provider gets one row that says Setup and opens the key panel, rather than a list of names
// that would fail the moment one was picked.

import { useState } from 'react';
import ForgeIcon from './ForgeIcon';

const header = {
  padding: '1rem 1rem 0.5rem', fontSize: '0.69rem', fontWeight: 700,
  letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)',
};

const rowBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
  width: '100%', padding: '0.625rem 1rem', borderRadius: '6px', border: 'none',
  background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem',
  color: 'var(--text-primary)', textAlign: 'left',
};

const label = {
  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

/**
 * @param {object} p
 * @param {{id: string, label: string}[]} p.providers      every provider Strata can talk to
 * @param {Record<string, {id: string, label: string}[]>} p.byProvider  models a key test returned
 * @param {Set<string>} p.connected   providers this person has a key for
 * @param {string} p.currentProvider
 * @param {string} p.currentModel
 * @param {string} p.loading          provider id whose list is being fetched, or ''
 * @param {(providerId: string, modelId: string) => void} p.onPick
 * @param {(providerId: string) => void} p.onLoad   fetch a connected provider's list
 * @param {(providerId: string) => void} p.onSetup  open the key panel for one with no key
 */
export default function ModelPicker({
  providers, byProvider, connected, currentProvider, currentModel,
  loading = '', onPick, onLoad, onSetup,
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = providers.map((prov) => {
    const models = byProvider[prov.id] || [];
    const shown = q ? models.filter(m => (m.label || m.id).toLowerCase().includes(q)) : models;
    return { prov, models, shown };
  });
  // A search hides a provider entirely once nothing under it matches, rather than leaving a
  // run of empty headings behind.
  const visible = q ? groups.filter(g => g.shown.length || g.prov.label.toLowerCase().includes(q)) : groups;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '420px', minHeight: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0,
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
      }}>
        <ForgeIcon name="search" size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input
          autoFocus
          type="text"
          aria-label="Search models"
          autoComplete="off"
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem',
          }}
        />
      </div>

      <div style={{ overflowY: 'auto', minHeight: 0, padding: '0.25rem 0.25rem 0.75rem' }}>
        {visible.length === 0 && (
          <p style={{ margin: 0, padding: '1rem', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
            No model matches &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {visible.map(({ prov, models, shown }) => (
          <div key={prov.id}>
            <div style={header}>{prov.label}</div>

            {shown.map((m) => {
              const on = prov.id === currentProvider && m.id === currentModel;
              return (
                <button
                  key={prov.id + ':' + m.id}
                  type="button"
                  className="sf-focus"
                  aria-current={on ? 'true' : undefined}
                  onClick={() => onPick(prov.id, m.id)}
                  style={{
                    ...rowBase,
                    background: on ? 'var(--bg-tertiary)' : 'none',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <span style={label}>{m.label || m.id}</span>
                  {on && <ForgeIcon name="chevronRight" size={12} style={{ color: 'var(--text-secondary)' }} />}
                </button>
              );
            })}

            {/* Nothing to list. Which of the two reasons it is decides what the row offers. */}
            {shown.length === 0 && !q && (
              connected.has(prov.id) ? (
                <button type="button" className="sf-focus" style={rowBase}
                  disabled={loading === prov.id}
                  onClick={() => onLoad(prov.id)}>
                  <span style={{ ...label, color: 'var(--text-tertiary)' }}>
                    {loading === prov.id ? 'Asking…' : 'Load this provider’s models'}
                  </span>
                </button>
              ) : (
                <button type="button" className="sf-focus" style={rowBase}
                  onClick={() => onSetup(prov.id)}>
                  <span style={{ ...label, color: 'var(--text-tertiary)' }}>No key yet</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Setup</span>
                </button>
              )
            )}
            {shown.length === 0 && q && models.length === 0 && (
              <div style={{ ...rowBase, cursor: 'default', color: 'var(--text-tertiary)' }}>
                <span style={label}>Nothing loaded for this provider</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
