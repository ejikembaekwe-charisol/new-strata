// Switching model.
//
// Every provider's models are listed, always — from the key's own answer where Strata has
// one, and from the written catalogue where it does not. The two are never mixed: a live
// list replaces the written one outright, because a merge would put rows in front of someone
// that their own key had just finished saying it does not have.
//
// The frame's "Setup" row is what a model whose provider has no key gets. Picking it opens
// the key panel for that provider rather than selecting something that would fail on send.

import { useState } from 'react';
import ForgeIcon from './ForgeIcon';
import { CATALOGUE_HEADINGS, modelsFor } from '../../data/modelCatalogue';

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
 * @param {{id: string, label: string}[]} p.providers
 * @param {Record<string, {id: string, label: string}[]>} p.byProvider  what key tests returned
 * @param {Set<string>} p.connected   providers this person has a key for
 * @param {(providerId: string, modelId: string) => void} p.onPick
 * @param {(providerId: string) => void} p.onLoad   re-ask a connected provider for its list
 * @param {(providerId: string) => void} p.onSetup  open the key panel for one with no key
 */
export default function ModelPicker({
  providers, byProvider, connected, currentProvider, currentModel,
  loading = '', onPick, onLoad, onSetup,
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = providers.map((prov) => {
    const { models, live } = modelsFor(prov.id, byProvider[prov.id]);
    const shown = q
      ? models.filter(x => (x.label || x.id).toLowerCase().includes(q) || x.id.toLowerCase().includes(q))
      : models;
    return { prov, live, shown, count: models.length };
  });
  const visible = q ? groups.filter(g => g.shown.length) : groups;
  const anyWritten = visible.some(g => !g.live && g.shown.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '440px', minHeight: 0 }}>
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

      <div style={{ overflowY: 'auto', minHeight: 0, padding: '0.25rem 0.25rem 0.5rem' }}>
        {visible.length === 0 && (
          <p style={{ margin: 0, padding: '1rem', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
            No model matches &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {visible.map(({ prov, live, shown }) => {
          const wired = connected.has(prov.id);
          return (
            <div key={prov.id}>
              <div style={{ ...header, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span>{CATALOGUE_HEADINGS[prov.id] || prov.label}</span>
                {wired && (
                  <button type="button" className="sf-focus"
                    disabled={loading === prov.id}
                    onClick={() => onLoad(prov.id)}
                    title={live
                      ? 'These came from your key. Ask again to refresh them.'
                      : 'Ask your key which models it can actually use.'}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.65rem', letterSpacing: 0,
                      textTransform: 'none', fontWeight: 500, color: 'var(--accent)',
                    }}>
                    {loading === prov.id ? 'Asking…' : (live ? 'From your key' : 'Check your key')}
                  </button>
                )}
              </div>

              {shown.map((x) => {
                const on = prov.id === currentProvider && x.id === currentModel;
                return (
                  <button
                    key={prov.id + ':' + x.id}
                    type="button"
                    className="sf-focus"
                    aria-current={on ? 'true' : undefined}
                    onClick={() => (wired ? onPick(prov.id, x.id) : onSetup(prov.id))}
                    style={{
                      ...rowBase,
                      background: on ? 'var(--bg-tertiary)' : 'none',
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    <span style={{ ...label, color: wired ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {x.label || x.id}
                    </span>
                    {/* The frame's own affordance for a model you cannot use yet. */}
                    {!wired && (
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Setup
                      </span>
                    )}
                    {on && <ForgeIcon name="chevronRight" size={12} style={{ color: 'var(--text-secondary)' }} />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Said once, at the bottom, rather than on every row it applies to. It disappears as
          soon as every list on screen came from a key. */}
      {anyWritten && (
        <p style={{
          margin: 0, flexShrink: 0, padding: '0.6rem 1rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.5,
        }}>
          Names without &ldquo;from your key&rdquo; beside them are Strata&rsquo;s own list and
          can go out of date. Checking a key replaces them with what it can actually use.
        </p>
      )}
    </div>
  );
}
