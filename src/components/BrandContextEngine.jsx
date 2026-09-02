import { useState, useMemo, useRef, useEffect } from 'react';
import {
  extractColorsFromImage, parseBrandText, parseJsonTokens, resizeImageToDataUrl,
} from '../utils/colorExtract';
import { getBrandCompleteness, emptyBrandContext } from '../utils/projectCompleteness';
import {
  STEPS, SOURCE_META, SOURCE_ORDER, DEFAULT_PRIORITY, GOAL_PRESETS, TONE_OPTIONS,
  COMPONENT_CATEGORIES, COMPONENT_CATALOG, CATALOG_BY_KEY,
  toExtraction, simulateExtraction, mergeExtractions, extractedKeys,
  buildTokens, buildComponents,
} from './brandContextEngine.data';
import { SOURCE_ICONS } from './SourceIcons';
import {
  listTokens, saveToken, renameToken, deleteToken, touchToken,
  maskSecret, setSessionToken, getSessionToken, clearSessionToken,
} from '../utils/figmaTokens';
import FigmaTokenModal from './FigmaTokenModal';
import { ColorSwatchButton } from './ColorPicker';

const MAX_IMAGES = 5;
const MAX_GOALS = 3;

const lbl = { fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' };
const field = { width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit' };
const card = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1rem', overflow: 'hidden' };
const pillBtn = (active) => ({
  padding: '0.4rem 0.9rem', borderRadius: '100px', border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
  background: active ? 'var(--accent)' : 'var(--bg-tertiary)', color: active ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
});

export default function BrandContextEngine({ project, owner = '', initialStep = 1, initialSource = null, onClose, onSave, onApply }) {
  const [step, setStep] = useState(initialStep);
  const [bc, setBc] = useState(() => ({ ...emptyBrandContext(), ...(project?.brandContext || {}) }));
  // Default to the first card in display order, so the top of the list is the one open
  const [open, setOpen] = useState(() => (initialSource ? { [initialSource]: true } : { [SOURCE_ORDER[0]]: true }));
  const [busy, setBusy] = useState({});
  const [order, setOrder] = useState(() => (project?.brandContext?.priority || DEFAULT_PRIORITY).slice());
  const [preview, setPreview] = useState(null);
  const [autoExtracted, setAutoExtracted] = useState([]);
  const previewRef = useRef(null);
  const [catFilter, setCatFilter] = useState('All Components');
  const [customGoal, setCustomGoal] = useState('');
  const imgRef = useRef();
  const jsonRef = useRef();

  // Saved Figma tokens live in their own store, shared across every project
  const [vault, setVault] = useState(() => listTokens(owner));
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  // Unsaved tokens live in sessionStorage, so re-read rather than mirroring them in state
  const [sessionTick, setSessionTick] = useState(0);
  const refreshVault = () => setVault(listTokens(owner));

  // Persist on every change so the checklist and Projects card stay in step with storage
  const commit = (next) => {
    setBc(next);
    // Picker and preview now share step 3, so a stale preview could be applied after the
    // selection changed. Clearing it here forces a regenerate before Apply is offered.
    setPreview(null);
    onSave?.({ ...next, priority: order });
  };
  const patch = (key, part) => commit({ ...bc, [key]: { ...bc[key], ...part } });

  useEffect(() => {
    if (preview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [preview]);

  const status = useMemo(() => {
    const map = {};
    // The id matters: the figma check consults the session store for unsaved tokens
    getBrandCompleteness({ id: project?.id, brandContext: bc }).items.forEach(i => { map[i.key] = i.done; });
    return map;
    // sessionTick is a dep because the figma check reads sessionStorage, which React cannot see
  }, [bc, project?.id, sessionTick]);

  const done = Object.values(status).filter(Boolean).length;
  const ready = extractedKeys(bc);
  const merged = useMemo(() => mergeExtractions(bc, order), [bc, order]);
  const selected = bc.components?.selected || {};

  // ---------- extraction ----------

  // Pure: computes one source's extraction from a brandContext snapshot. Kept separate from
  // runExtract so generatePreview can fill several at once and commit a single update —
  // calling patch() in a loop would have every iteration read the same stale `bc` closure.
  const computeExtraction = (key, snap) => {
    if (key === 'description') {
      const text = snap.description?.text || '';
      if (!text.trim()) return null;
      const extraction = toExtraction(parseBrandText(text));
      // An explicitly picked primary colour outranks anything found in the prose
      if (snap.description.primaryColor) {
        extraction.colors = [snap.description.primaryColor, ...extraction.colors.filter(c => c !== snap.description.primaryColor)].slice(0, 3);
      }
      if (!extraction.colors.length && !extraction.headingFont && !extraction.tone.length) {
        extraction.note = 'No colours, known fonts or tone words found in the text.';
      }
      return extraction;
    }
    if (key === 'figma') {
      return snap.figma?.fileUrl ? simulateExtraction(snap.figma.fileUrl, 'figma') : null;
    }
    if (key === 'website') {
      return snap.website?.url ? simulateExtraction(snap.website.url, 'website') : null;
    }
    if (key === 'styleDictionary') {
      const content = snap.styleDictionary?.content || '';
      if (!content) return null;
      const parsed = parseJsonTokens(content);
      return { ...toExtraction(parsed), note: parsed.extracted ? 'Parsed from the imported JSON.' : 'No colours found in the imported JSON.' };
    }
    return null;   // images can only be sampled at upload time — the File is gone by now
  };

  const runExtract = async (key) => {
    setBusy(b => ({ ...b, [key]: true }));
    try {
      const extraction = computeExtraction(key, bc);
      if (extraction) patch(key, { extraction });
    } finally {
      setBusy(b => ({ ...b, [key]: false }));
    }
  };

  const onPickImages = async (files) => {
    const list = Array.from(files || []).slice(0, MAX_IMAGES - (bc.images.items?.length || 0));
    if (!list.length) return;
    setBusy(b => ({ ...b, images: true }));
    try {
      const items = [];
      const colors = [];
      for (const file of list) {
        // Sample the ORIGINAL file, then keep only a small thumbnail — the whole project
        // lives in localStorage, so full-size data URLs would blow the quota.
        try {
          // Resolves an OBJECT, not an array — and it fabricates #FC0694/#1A1A24/#3B82F6
          // fallbacks when it finds nothing, so read `colors` and honour `extracted`
          // rather than primaryColor, or invented values get stored as sampled ones.
          const res = await extractColorsFromImage(file, 3);
          if (res?.extracted) {
            for (const hex of res.colors || []) if (!colors.includes(hex)) colors.push(hex);
          }
        } catch (e) {
          console.warn('Colour sampling failed for ' + file.name, e);
        }
        try {
          items.push({ name: file.name, dataUrl: await resizeImageToDataUrl(file, 320, 0.75) });
        } catch (e) {
          items.push({ name: file.name, dataUrl: '' });
        }
      }
      const nextItems = [...(bc.images.items || []), ...items];
      const picked = colors.slice(0, 3);
      patch('images', {
        items: nextItems,
        extraction: picked.length
          ? { colors: picked, headingFont: null, bodyFont: null, tone: [], simulated: false, note: 'Sampled from ' + nextItems.length + ' image' + (nextItems.length === 1 ? '' : 's') + '.' }
          : (bc.images.extraction || { colors: [], headingFont: null, bodyFont: null, tone: [], simulated: false, note: 'No distinct colours found — the image may be flat, transparent, or near-white.' }),
      });
    } finally {
      setBusy(b => ({ ...b, images: false }));
    }
  };

  const onPickJson = async (file) => {
    if (!file) return;
    setBusy(b => ({ ...b, styleDictionary: true }));
    try {
      const content = await file.text();
      const parsed = parseJsonTokens(content);
      patch('styleDictionary', {
        fileName: file.name,
        content,
        extraction: { ...toExtraction(parsed), note: parsed.extracted ? 'Parsed from ' + file.name + '.' : 'No colours found in ' + file.name + '.' },
      });
    } finally {
      setBusy(b => ({ ...b, styleDictionary: false }));
    }
  };

  // ---------- saved Figma tokens ----------

  const projectId = project?.id;
  const sessionSecret = useMemo(() => getSessionToken(projectId), [projectId, sessionTick]);
  // Re-read on each tick rather than mirroring the session store into state

  const attachToken = (entry) => {
    touchToken(entry.id);
    // Only the id and a masked hint reach the project — never the secret itself.
    // A saved token and an unsaved one must never both claim to be active.
    clearSessionToken(projectId);
    patch('figma', { tokenRef: entry.id, tokenHint: maskSecret(entry.secret), token: '' });
    setSessionTick(t => t + 1);
    refreshVault();
  };

  // From the modal: either save to the vault and attach, or keep it for this tab only.
  const useToken = async ({ secret, name, remember }) => {
    const clean = String(secret || '').trim();
    if (!clean) { setTokenError('Paste a token first.'); return; }
    setSavingToken(true);
    setTokenError('');
    try {
      if (remember) {
        const { entry } = await saveToken({ owner, name, secret: clean });
        attachToken(entry);
      } else {
        // Nothing about an unsaved token is written to the project — not even a hint
        patch('figma', { tokenRef: '', tokenHint: '', token: '' });
        setSessionToken(projectId, clean);
        setSessionTick(t => t + 1);
      }
      setTokenModalOpen(false);
    } catch (e) {
      setTokenError(e.message || 'Could not use that token.');
    } finally {
      setSavingToken(false);
    }
  };

  const promoteSessionToken = async () => {
    const secret = getSessionToken(projectId);
    if (!secret) return;
    setSavingToken(true);
    try {
      const { entry } = await saveToken({ owner, name: 'Saved from ' + (project?.name || 'project'), secret });
      attachToken(entry); // clears the session copy
    } catch (e) {
      setTokenError(e.message || 'Could not save that token.');
    } finally {
      setSavingToken(false);
    }
  };

  const detachToken = () => {
    clearSessionToken(projectId);
    patch('figma', { tokenRef: '', tokenHint: '', token: '' });
    setSessionTick(t => t + 1);
  };

  const onRenameToken = (entry) => {
    const next = window.prompt('Name this token', entry.name);
    if (next === null) return;
    renameToken(entry.id, next);
    if (bc.figma.tokenRef === entry.id) patch('figma', { tokenRef: entry.id });
    refreshVault();
  };

  const onDeleteToken = (entry) => {
    const attached = bc.figma.tokenRef === entry.id;
    const msg = attached
      ? 'Delete "' + entry.name + '"? It is attached to this project, so you will need to pick another token.'
      : 'Delete "' + entry.name + '"? Any project using it will need another token selected.';
    if (!window.confirm(msg)) return;
    deleteToken(entry.id);
    if (attached) patch('figma', { tokenRef: '', tokenHint: '' });
    refreshVault();
  };

  // Older projects stored the token in clear text inside the project itself
  const legacyToken = !bc.figma.tokenRef && bc.figma.token ? bc.figma.token : '';
  const migrateLegacyToken = async () => {
    setSavingToken(true);
    try {
      const { entry } = await saveToken({ owner, name: tokenName || 'Moved from ' + (project?.name || 'project'), secret: legacyToken });
      attachToken(entry); // clears figma.token in the same patch
      setTokenName('');
    } catch (e) {
      setTokenError(e.message || 'Could not move that token.');
    } finally {
      setSavingToken(false);
    }
  };

  const attachedEntry = vault.find(t => t.id === bc.figma.tokenRef) || null;

  // ---------- step 4 helpers ----------

  const toggleComponent = (key) => {
    const meta = CATALOG_BY_KEY[key];
    const next = { ...selected };
    if (next[key]) delete next[key];
    else next[key] = { variants: meta.variants.slice(), includeStates: meta.states };
    commit({ ...bc, components: { selected: next } });
  };

  const setAll = (on) => {
    const next = {};
    if (on) COMPONENT_CATALOG.forEach(c => { next[c.key] = { variants: c.variants.slice(), includeStates: c.states }; });
    commit({ ...bc, components: { selected: next } });
  };

  const setVariantCount = (key, n) => {
    const cur = selected[key];
    if (!cur) return;
    const count = Math.max(1, Math.min(6, n));
    const variants = cur.variants.slice(0, count);
    while (variants.length < count) variants.push('variant' + (variants.length + 1));
    commit({ ...bc, components: { selected: { ...selected, [key]: { ...cur, variants } } } });
  };

  const setVariantName = (key, i, value) => {
    const cur = selected[key];
    if (!cur) return;
    const variants = cur.variants.slice();
    variants[i] = value;
    commit({ ...bc, components: { selected: { ...selected, [key]: { ...cur, variants } } } });
  };

  const move = (key, dir) => {
    const next = order.slice();
    const from = next.indexOf(key);
    if (from < 0) return;
    // Walk to the next slot that actually holds an extracted source
    let to = from + dir;
    while (to >= 0 && to < next.length && !ready.includes(next[to])) to += dir;
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    setPreview(null);   // priority changes the merged result
    onSave?.({ ...bc, priority: next });
  };

  const generatePreview = () => {
    // Description, Figma and Website only extract when their own Extract button is pressed,
    // so someone who filled them in and came straight here would see no tokens at all.
    // Fill in any configured source that has not been extracted yet, in one commit.
    let next = bc;
    const filledIn = [];
    for (const key of SOURCE_ORDER) {
      if (next[key]?.extraction) continue;
      const extraction = computeExtraction(key, next);
      if (!extraction) continue;
      next = { ...next, [key]: { ...next[key], extraction } };
      filledIn.push(SOURCE_META[key].title);
    }
    if (filledIn.length) {
      commit(next);          // clears any older preview
      setAutoExtracted(filledIn);
    } else {
      setAutoExtracted([]);
    }

    const m = mergeExtractions(next, order);
    setPreview({ merged: m, tokens: buildTokens(m), components: buildComponents(selected) });
  };

  const apply = () => {
    if (!preview) return;
    onApply?.({
      brand: {
        primaryColor: preview.merged.colors[0] || '',
        secondaryColor: preview.merged.colors[1] || '',
        accentColor: preview.merged.colors[2] || '',
        headingFont: preview.merged.headingFont || '',
        bodyFont: preview.merged.bodyFont || '',
        toneKeywords: preview.merged.tone || [],
      },
      tokens: preview.tokens,
      components: preview.components,
    });
  };

  // ---------- render pieces ----------

  const badge = (isDone) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 600,
      padding: '0.2rem 0.6rem', borderRadius: '100px',
      background: isDone ? 'rgba(34,197,94,0.14)' : 'var(--bg-tertiary)',
      border: '1px solid ' + (isDone ? 'rgba(34,197,94,0.5)' : 'var(--border)'),
      color: isDone ? '#22C55E' : 'var(--text-tertiary)', whiteSpace: 'nowrap',
    }}>{isDone ? 'Configured' : '+ Not Configured'}</span>
  );

  const sourceCard = (key, body) => {
    const meta = SOURCE_META[key];
    const Icon = SOURCE_ICONS[key];
    const isOpen = !!open[key];
    return (
      <div key={key} style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', padding: '1.1rem 1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: meta.tint + '22', border: '1px solid ' + meta.tint + '55',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.tint,
          }}>{Icon ? <Icon /> : null}</div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{meta.title}</span>
              {badge(status[key])}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>{meta.desc}</p>
          </div>
          <button
            onClick={() => setOpen(o => ({ ...o, [key]: !isOpen }))}
            style={{ ...pillBtn(!isOpen), background: isOpen ? 'var(--bg-tertiary)' : 'var(--accent)', border: '1px solid ' + (isOpen ? 'var(--border)' : 'var(--accent)'), color: isOpen ? 'var(--text-secondary)' : '#fff' }}
          >
            {isOpen ? 'Collapse ⌃' : '+ Configure'}
          </button>
        </div>
        {isOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-primary)' }}>
            {body}
          </div>
        )}
      </div>
    );
  };

  const extractBtn = (key, label) => (
    <button
      onClick={() => runExtract(key)}
      disabled={!!busy[key] || !status[key]}
      style={{
        ...pillBtn(!!status[key]), borderRadius: '8px', padding: '0.55rem 1rem',
        opacity: status[key] ? 1 : 0.45, cursor: status[key] ? 'pointer' : 'not-allowed',
      }}
    >
      {busy[key] ? 'Working…' : label}
    </button>
  );

  const step1 = (
    <>
      {sourceCard('figma', (
        <>
          <span style={lbl}>Figma file URL <span style={{ color: 'var(--accent)' }}>*</span></span>
          <input style={{ ...field, marginBottom: '1.1rem' }} placeholder="https://www.figma.com/file/..." value={bc.figma.fileUrl} onChange={(e) => patch('figma', { fileUrl: e.target.value })} />

          <span style={lbl}>Figma access token <span style={{ color: 'var(--accent)' }}>*</span></span>

          {attachedEntry ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.85rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{attachedEntry.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{maskSecret(attachedEntry.secret)}</span>
              <div style={{ flex: 1 }} />
              <button onClick={detachToken} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                Use a different token
              </button>
            </div>
          ) : sessionSecret ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '8px', padding: '0.7rem 0.85rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>Unsaved token</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{maskSecret(sessionSecret)}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flex: 1, minWidth: '180px' }}>
                This browser tab only — you will need to paste it again next time.
              </span>
              <button onClick={promoteSessionToken} disabled={savingToken} style={{ ...pillBtn(true), borderRadius: '8px', padding: '0.32rem 0.8rem', fontSize: '0.75rem' }}>
                {savingToken ? 'Saving...' : 'Save for reuse'}
              </button>
              <button onClick={detachToken} style={{ ...pillBtn(false), borderRadius: '8px', padding: '0.32rem 0.8rem', fontSize: '0.75rem' }}>Remove</button>
            </div>
          ) : (
            <>
              {legacyToken && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '8px', padding: '0.7rem 0.85rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, minWidth: '200px' }}>
                    This project stores a token in clear text ({maskSecret(legacyToken)}). Move it into your saved tokens so it is kept once and reusable.
                  </span>
                  <button onClick={migrateLegacyToken} disabled={savingToken} style={{ ...pillBtn(true), borderRadius: '8px' }}>
                    {savingToken ? 'Moving...' : 'Move to saved tokens'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {vault.length > 0 && (
                  <select
                    style={{ ...field, flex: '1 1 240px', cursor: 'pointer' }}
                    value=""
                    onChange={(e) => {
                      const entry = vault.find(t => t.id === e.target.value);
                      if (entry) attachToken(entry);
                    }}
                  >
                    <option value="">Select a saved token...</option>
                    {vault.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {maskSecret(t.secret)}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => { setTokenError(''); setTokenModalOpen(true); }} style={{ ...pillBtn(vault.length === 0), borderRadius: '8px' }}>
                  + Add new token
                </button>
              </div>

              {tokenError && <p style={{ fontSize: '0.75rem', color: '#FACC15', margin: '0.6rem 0 0' }}>{tokenError}</p>}
            </>
          )}

          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0.85rem 0 1rem', lineHeight: 1.55 }}>
            {sessionSecret
              ? 'This token is held for this browser tab only and is not stored.'
              : 'Saved tokens are reusable across all your projects. They are kept in this browser only and are not encrypted — anyone with access to this browser can read them.'}
            {attachedEntry ? ' Fingerprint ' + attachedEntry.algo + ' ' + attachedEntry.fingerprint.slice(0, 8) + '...' + attachedEntry.fingerprint.slice(-4) + '.' : ''}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {extractBtn('figma', 'Extract Figma')}
          </div>
        </>
      ))}

      {sourceCard('website', (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input style={{ ...field, flex: '1 1 260px' }} placeholder="https://yourbrand.com" value={bc.website.url} onChange={(e) => patch('website', { url: e.target.value })} />
          {extractBtn('website', 'Extract Website')}
        </div>
      ))}

      {sourceCard('styleDictionary', (
        <>
          <button onClick={() => jsonRef.current?.click()} style={{ ...pillBtn(false), borderRadius: '8px', padding: '0.6rem 1.1rem' }}>
            {busy.styleDictionary ? 'Parsing…' : '+ Upload JSON file'}
          </button>
          <input ref={jsonRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => onPickJson(e.target.files?.[0])} />
          {bc.styleDictionary.fileName && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.8rem' }}>{bc.styleDictionary.fileName}</span>
          )}
        </>
      ))}
      {sourceCard('description', (
        <>
          <textarea
            rows={3}
            style={{ ...field, resize: 'vertical', marginBottom: '1.1rem' }}
            placeholder="We are a modern fintech brand targeting young professionals..."
            value={bc.description.text}
            onChange={(e) => patch('description', { text: e.target.value })}
          />
          <span style={lbl}>Brand goals ({(bc.description.goals || []).length}/{MAX_GOALS})</span>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
            <select
              style={{ ...field, flex: '1 1 220px', cursor: 'pointer' }}
              value=""
              onChange={(e) => {
                const v = e.target.value;
                const goals = bc.description.goals || [];
                if (v && goals.length < MAX_GOALS && !goals.includes(v)) patch('description', { goals: [...goals, v] });
              }}
            >
              <option value="">Select a goal…</option>
              {GOAL_PRESETS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input
              style={{ ...field, flex: '1 1 200px' }}
              placeholder="Or type custom goal..."
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
            />
            <button
              onClick={() => {
                const goals = bc.description.goals || [];
                const v = customGoal.trim();
                if (v && goals.length < MAX_GOALS && !goals.includes(v)) { patch('description', { goals: [...goals, v] }); setCustomGoal(''); }
              }}
              style={{ ...pillBtn(false), borderRadius: '8px' }}
            >+ Add</button>
          </div>
          {(bc.description.goals || []).length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {bc.description.goals.map(g => (
                <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '100px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}>
                  {g}
                  <button onClick={() => patch('description', { goals: bc.description.goals.filter(x => x !== g) })} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ ...lbl, marginBottom: 0 }}>Primary color:</span>
            <ColorSwatchButton value={bc.description.primaryColor || '#3B82F6'} onChange={(v) => patch('description', { primaryColor: v })} title="Primary colour" size={32} />
            <input style={{ ...field, width: '120px', fontFamily: 'var(--font-mono)' }} placeholder="#3B82F6" value={bc.description.primaryColor || ''} onChange={(e) => patch('description', { primaryColor: e.target.value })} />
            <div style={{ flex: 1 }} />
            {extractBtn('description', 'Extract Brief')}
          </div>
        </>
      ))}

      {sourceCard('images', (
        <>
          <span style={lbl}>Brand logos, screenshots &amp; mockups <span style={{ color: 'var(--accent)' }}>*</span></span>
          <div
            onClick={() => imgRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPickImages(e.dataTransfer.files); }}
            style={{ border: '1.5px dashed var(--border)', borderRadius: '12px', padding: '2.2rem 1rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)' }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>☁</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {busy.images ? 'Sampling colours…' : 'Click to upload or drag & drop brand images'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
              PNG, JPG, WebP, SVG, GIF (up to {MAX_IMAGES} images)
            </div>
          </div>
          <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => onPickImages(e.target.files)} />
          {(bc.images.items || []).length > 0 && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
              {bc.images.items.map((im, i) => (
                <div key={i} style={{ position: 'relative', width: '74px' }}>
                  {im.dataUrl
                    ? <img src={im.dataUrl} alt={im.name} style={{ width: '74px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    : <div style={{ width: '74px', height: '54px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }} />}
                  <button
                    onClick={() => patch('images', { items: bc.images.items.filter((_, j) => j !== i) })}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1, padding: 0 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </>
      ))}

    </>
  );

  const emptyNote = (text, tone) => (
    <div style={{
      background: tone === 'warn' ? 'rgba(250,204,21,0.07)' : 'var(--bg-secondary)',
      border: '1px solid ' + (tone === 'warn' ? 'rgba(250,204,21,0.4)' : 'var(--border)'),
      borderRadius: '12px', padding: '3rem 1.5rem', textAlign: 'center',
      color: tone === 'warn' ? '#FACC15' : 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6,
    }}>{text}</div>
  );

  const step2 = ready.length === 0
    ? emptyNote('No extractions created yet. Please return to Step 1 and extract at least one source.')
    : ready.map(key => {
      const ex = bc[key].extraction;
      return (
        <div key={key} style={{ ...card, padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{SOURCE_META[key].title}</span>
            {ex.simulated && (
              <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.45)', color: '#FACC15' }}>SIMULATED</span>
            )}
          </div>
          {ex.note && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 0.9rem' }}>{ex.note}</p>}

          <span style={lbl}>Colors</span>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {ex.colors.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>None found</span>}
            {ex.colors.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.3rem 0.5rem' }}>
                <ColorSwatchButton
                  value={c}
                  onChange={(v) => {
                    const colors = ex.colors.slice(); colors[i] = v.toUpperCase();
                    patch(key, { extraction: { ...ex, colors } });
                  }}
                  title={c}
                  size={26}
                  radius={5}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)' }}>{c}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={lbl}>Headings</span>
              <input style={field} placeholder="Not detected" value={ex.headingFont || ''} onChange={(e) => patch(key, { extraction: { ...ex, headingFont: e.target.value } })} />
            </div>
            <div>
              <span style={lbl}>Body text</span>
              <input style={field} placeholder="Not detected" value={ex.bodyFont || ''} onChange={(e) => patch(key, { extraction: { ...ex, bodyFont: e.target.value } })} />
            </div>
          </div>

          <span style={lbl}>Mood &amp; tone</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {TONE_OPTIONS.map(t => {
              const on = (ex.tone || []).includes(t);
              return (
                <button
                  key={t}
                  onClick={() => {
                    const tone = on ? ex.tone.filter(x => x !== t) : [...(ex.tone || []), t];
                    patch(key, { extraction: { ...ex, tone } });
                  }}
                  style={{ ...pillBtn(on), fontSize: '0.72rem', padding: '0.28rem 0.7rem' }}
                >{t}</button>
              );
            })}
          </div>
        </div>
      );
    });

  const step3 = (
    <>
      {ready.length === 0
        ? emptyNote('No Extracted Sources Available — extract at least one source (Brand Description, Images, Figma, Website, or Style Dictionary) in Step 1 to configure priority resolution.')
        : (
          <div style={{ ...card, padding: '1.1rem 1.25rem' }}>
            {order.filter(k => ready.includes(k)).map((key, i, arr) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', width: '18px' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{SOURCE_META[key].title}</span>
                {bc[key].extraction?.simulated && <span style={{ fontSize: '0.62rem', color: '#FACC15' }}>SIMULATED</span>}
                <button onClick={() => move(key, -1)} disabled={i === 0} style={{ ...pillBtn(false), padding: '0.15rem 0.5rem', fontSize: '0.8rem', opacity: i === 0 ? 0.35 : 1, cursor: i === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                <button onClick={() => move(key, 1)} disabled={i === arr.length - 1} style={{ ...pillBtn(false), padding: '0.15rem 0.5rem', fontSize: '0.8rem', opacity: i === arr.length - 1 ? 0.35 : 1, cursor: i === arr.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
              </div>
            ))}
          </div>
        )}

      <div style={{ ...card, padding: '1.4rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.3rem', color: 'var(--text-primary)' }}>Merged Brand Configuration Summary</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.3rem' }}>Visual output synthesized across your prioritized extraction sources.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
            <span style={lbl}>Brand colors</span>
            {['Primary Color', 'Secondary Color', 'Accent Color'].map((name, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', padding: '0.5rem 0.65rem', marginBottom: '0.45rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{name}</span>
                {merged.colors[i]
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: merged.colors[i], border: '1px solid var(--border)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)' }}>{merged.colors[i]}</span>
                    </span>
                  : <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
            <span style={lbl}>Typography</span>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.8rem', marginBottom: '0.5rem' }}>
              <span style={{ ...lbl, marginBottom: '0.25rem' }}>Headings</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{merged.headingFont || '—'}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.8rem', marginBottom: '0.5rem' }}>
              <span style={{ ...lbl, marginBottom: '0.25rem' }}>Body text</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{merged.bodyFont || '—'}</div>
            </div>
            {(merged.headingFont || merged.bodyFont) && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.8rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: merged.headingFont ? merged.headingFont + ', sans-serif' : 'inherit' }}>Design System Preview</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontFamily: merged.bodyFont ? merged.bodyFont + ', sans-serif' : 'inherit' }}>The quick brown fox jumps over the lazy dog.</div>
              </div>
            )}
          </div>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
            <span style={lbl}>Brand mood &amp; tone</span>
            {merged.tone.length === 0
              ? <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>No tone words found in your sources.</span>
              : <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {merged.tone.map(t => <span key={t} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '100px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}>{t}</span>)}
                </div>}
          </div>
        </div>
      </div>
    </>
  );

  const visibleCatalog = catFilter === 'All Components' ? COMPONENT_CATALOG : COMPONENT_CATALOG.filter(c => c.category === catFilter);

  const step4 = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Select Components &amp; Variation Counts</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Choose which UI components to generate into your design system and specify variation presets.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setAll(true)} style={{ ...pillBtn(false), borderRadius: '8px' }}>Select All</button>
          <button onClick={() => setAll(false)} style={{ ...pillBtn(false), borderRadius: '8px' }}>Deselect All</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.1rem 0' }}>
        {COMPONENT_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={pillBtn(catFilter === c)}>{c}</button>
        ))}
      </div>

      {visibleCatalog.map(meta => {
        const cfg = selected[meta.key];
        const on = !!cfg;
        return (
          <div key={meta.key} style={{ ...card, border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)') }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.95rem 1.15rem' }}>
              <input type="checkbox" checked={on} onChange={() => toggleComponent(meta.key)} style={{ width: '17px', height: '17px', accentColor: 'var(--accent)', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{meta.name}</span>
                  <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem', borderRadius: '5px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>{meta.tag}</span>
                  {on && <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem', borderRadius: '5px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>{cfg.variants.length} variants</span>}
                  {!meta.exact && (
                    <span title={'Rendered with the nearest available template (' + meta.template + ')'} style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem', borderRadius: '5px', background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.4)', color: '#FACC15' }}>
                      approximated as {meta.template}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>{meta.desc}</p>
              </div>
            </div>

            {on && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.15rem', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{meta.name} Variations</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Variant Count:</span>
                    <button onClick={() => setVariantCount(meta.key, cfg.variants.length - 1)} style={{ ...pillBtn(false), padding: '0.1rem 0.55rem' }}>−</button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '16px', textAlign: 'center', color: 'var(--text-primary)' }}>{cfg.variants.length}</span>
                    <button onClick={() => setVariantCount(meta.key, cfg.variants.length + 1)} style={{ ...pillBtn(false), padding: '0.1rem 0.55rem' }}>+</button>
                  </div>
                </div>
                <span style={lbl}>Variant names:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}>
                  {cfg.variants.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{i + 1}.</span>
                      <input style={{ ...field, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} value={v} onChange={(e) => setVariantName(meta.key, i, e.target.value)} />
                    </div>
                  ))}
                </div>
                {meta.states && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!cfg.includeStates} onChange={(e) => commit({ ...bc, components: { selected: { ...selected, [meta.key]: { ...cfg, includeStates: e.target.checked } } } })} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                    Include Interactive States (hover, focus, active, disabled)
                  </label>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const step5 = !preview
    ? null
    : (
      <div ref={previewRef}>
        {autoExtracted.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 0.9rem', lineHeight: 1.55 }}>
            Extracted {autoExtracted.join(', ')} for you, since {autoExtracted.length === 1 ? 'it had' : 'they had'} not been run yet.
          </p>
        )}
        <div style={{ ...card, padding: '1.3rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
            Token classification layers{' '}
            {preview.tokens.length > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>
                {preview.tokens.length} token{preview.tokens.length === 1 ? '' : 's'}
              </span>
            )}
          </h3>
          {preview.tokens.length === 0
            ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 0.4rem' }}>No tokens yet — none of your sources produced colours or fonts.</p>
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  Go back to <strong>Brand Context</strong> and add a source: describe your brand
                  (mentioning a hex colour or font name), upload an image to sample, import a token
                  JSON file, or link a Figma file or website.
                </p>
              </div>
            )
            : preview.tokens.map(t => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', borderRadius: '5px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>{t.layer}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', flex: 1, minWidth: '150px' }}>{t.name}</span>
                {t.type === 'color' && <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: t.value, border: '1px solid var(--border)' }} />}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{t.value}</span>
              </div>
            ))}
        </div>
        <div style={{ ...card, padding: '1.3rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.3rem', color: 'var(--text-primary)' }}>Component structures</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
            {preview.components.length} component{preview.components.length === 1 ? '' : 's'} will be created.
          </p>
          {preview.components.length === 0
            ? <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>Nothing selected in Step 4.</p>
            : <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {preview.components.map(c => (
                  <span key={c.name} style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {c.name}
                    <span style={{ color: c.approximated ? '#FACC15' : 'var(--text-tertiary)', marginLeft: '0.35rem' }}>{c.template}</span>
                  </span>
                ))}
              </div>}
        </div>
      </div>
    );

  const sectionHeading = (text) => (
    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.75rem 0 0.9rem' }}>{text}</h3>
  );

  // Three stages: the two old review screens fold into Review, and the generation preview
  // folds into Generate under the component picker.
  const bodies = {
    1: step1,
    2: <>{step2}{sectionHeading('Source priority')}{step3}</>,
    3: <>{step4}{preview ? sectionHeading('Generation preview') : null}{step5}</>,
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '1000px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '1.35rem 1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent)' }}>✦</span> Brand Context Engine
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>{STEPS[step - 1].sub}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {STEPS.map(s => (
              <button key={s.n} onClick={() => setStep(s.n)} style={pillBtn(step === s.n)}>
                {s.n < step ? '✓' : s.n} {s.label}
              </button>
            ))}
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.2rem' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>{bodies[step]}</div>

        {tokenModalOpen && (
          <FigmaTokenModal
            vault={vault}
            busy={savingToken}
            error={tokenError}
            onClose={() => setTokenModalOpen(false)}
            onUse={useToken}
            onRename={(t) => { onRenameToken(t); }}
            onDelete={(t) => { onDeleteToken(t); }}
          />
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem 1.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', opacity: step === 1 ? 0.4 : 1 }}
          >‹ Previous Step</button>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{done} of 6 provided</span>

          {step === 3
            ? (preview
              ? <button onClick={apply} className="btn btn-primary" style={{ padding: '0.6rem 1.3rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Apply to project</button>
              : <button onClick={generatePreview} className="btn btn-primary" style={{ padding: '0.6rem 1.3rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>✦ Generate Design System Preview</button>)
            : <button onClick={() => setStep(s => Math.min(3, s + 1))} className="btn btn-primary" style={{ padding: '0.6rem 1.3rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Next Step ›</button>}
        </div>
      </div>
    </div>
  );
}
