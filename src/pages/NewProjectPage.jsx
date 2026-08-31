import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import {
  getSuggestion, paletteById, resolvePalette, resolvePairing,
  industryLabel, tokenMapFromChoices, CUSTOM_ID,
} from '../components/newProject/designSystemData';
import {
  BasicsStep, ColorsStep, TypographyStep, LogoStep, VoiceStep, ReviewStep,
} from '../components/newProject/ScratchSteps';

// Full-page create flow. Two paths from the entry screen: import an existing system
// (cosmetic fields — the Brand Context Engine inside the project does the real work), or
// build one from scratch through a short guided wizard.
//
// Suggestions on the Colors/Typography steps come from a deterministic lookup on the
// industry + vibe answers. No AI, no backend.

const SCRATCH_STEPS = ['basics', 'colors', 'typography', 'logo', 'voice'];
const STEP_LABELS = { basics: 'Basics', colors: 'Colors', typography: 'Type', logo: 'Logo', voice: 'Voice' };

const shell = { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' };
const body = { width: '100%', maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' };
const primaryBtn = (enabled) => ({
  padding: '0.65rem 1.4rem', borderRadius: '999px', border: 'none',
  background: enabled ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: enabled ? '#fff' : 'var(--text-tertiary)',
  fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
  cursor: enabled ? 'pointer' : 'not-allowed',
});
const ghostBtn = {
  padding: '0.65rem 1.1rem', borderRadius: '999px', border: '1px solid var(--border)',
  background: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem',
  fontFamily: 'inherit', cursor: 'pointer',
};
const field = {
  width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'var(--text-primary)',
  fontSize: '0.9rem', fontFamily: 'inherit',
};
const label = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' };

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { addProject } = useProjects();

  const [stage, setStage] = useState('entry');
  const [createdId, setCreatedId] = useState(null);
  const [data, setData] = useState({
    projectName: '',
    figmaLink: '', brandUrl: '', tokensFileName: '',
    industry: null, primaryVibe: null, customIndustry: '',
    paletteId: null, fontPairingId: null,
    customPalette: {}, customPairing: {},
    logoMode: 'generate', logoDataUrl: null,
    voiceTags: [],
  });

  // accepts a patch object or a function of the previous data, so callers that derive
  // from current values are not exposed to a stale closure
  const set = (patch) => setData(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));

  // Seed the palette and pairing from the answers, but only while still unset — so going
  // back and choosing manually is never overwritten on re-entry.
  useEffect(() => {
    if (stage !== 'colors' && stage !== 'typography') return;
    const s = getSuggestion(data.industry, data.primaryVibe);
    if (!s) return;
    if (stage === 'colors' && !data.paletteId) set({ paletteId: s.paletteId });
    if (stage === 'typography' && !data.fontPairingId) set({ fontPairingId: s.fontPairingId });

    // give the custom colour inputs a starting point rather than #000000
    if (stage === 'colors' && !data.customPalette.primary) {
      const base = paletteById(s.paletteId);
      if (base) set({ customPalette: { primary: base.primary, secondary: base.secondary, accent: base.accent } });
    }
  }, [stage, data.industry, data.primaryVibe, data.paletteId, data.fontPairingId, data.customPalette.primary]);

  // The primary vibe is a tone too, so pre-check it rather than asking twice
  useEffect(() => {
    if (stage === 'voice' && data.primaryVibe && data.voiceTags.length === 0) {
      set({ voiceTags: [data.primaryVibe] });
    }
  }, [stage, data.primaryVibe, data.voiceTags.length]);

  const stepIndex = SCRATCH_STEPS.indexOf(stage);
  const canContinue = () => {
    if (stage === 'basics') return Boolean(data.industry && data.primaryVibe);
    if (stage === 'colors') {
      if (data.paletteId === CUSTOM_ID) return Boolean(resolvePalette(data)?.primary);
      return Boolean(data.paletteId);
    }
    if (stage === 'typography') {
      if (data.fontPairingId === CUSTOM_ID) return Boolean(resolvePairing(data));
      return Boolean(data.fontPairingId);
    }
    return true;   // logo and voice are both skippable
  };

  const goNext = () => {
    if (stepIndex >= 0 && stepIndex < SCRATCH_STEPS.length - 1) setStage(SCRATCH_STEPS[stepIndex + 1]);
    else if (stage === 'voice') setStage('review');
  };
  const goBack = () => {
    if (stage === 'review') setStage('voice');
    else if (stepIndex > 0) setStage(SCRATCH_STEPS[stepIndex - 1]);
    else setStage('entry');
  };

  const createFromScratch = () => {
    const palette = resolvePalette(data);
    const pairing = resolvePairing(data);
    const project = addProject({
      title: data.projectName.trim() || 'Untitled',
      description: '',
      color: palette ? palette.primary : '#FC0694',
      // Real user choices, so they go straight onto the brand rather than being "extracted"
      brand: {
        primaryColor: palette ? palette.primary : '',
        secondaryColor: palette ? palette.secondary : '',
        accentColor: palette ? palette.accent : '',
        headingFont: pairing ? pairing.heading : '',
        bodyFont: pairing ? pairing.body : '',
        toneKeywords: data.voiceTags,
        logoPreview: data.logoDataUrl || undefined,
        industry: industryLabel(data) || undefined,
        vibe: data.primaryVibe || undefined,
      },
      tokens: tokenMapFromChoices(palette, pairing),
      // An uploaded logo genuinely is a Brand Images source, so record it as one. Nothing
      // else is marked provided — the other engine sources really are still empty.
      brandContext: data.logoDataUrl
        ? { images: { items: [{ name: 'Logo', dataUrl: data.logoDataUrl }], extraction: null } }
        : undefined,
    });
    setCreatedId(project.id);
    setStage('done');
  };

  const createFromImport = () => {
    const project = addProject({
      title: data.projectName.trim() || 'Untitled',
      description: '',
      color: '#FC0694',
      websiteUrl: data.brandUrl.trim(),
      figmaUrl: data.figmaLink.trim(),
      brand: { toneKeywords: [] },
    });
    navigate('/projects/' + project.id);
  };

  // ── entry ──────────────────────────────────────────────────────────────────
  if (stage === 'entry') {
    const named = data.projectName.trim().length > 0;
    return (
      <div style={shell}>
        <Header />
        <div style={body}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)' }}>
            New design system
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 2.2rem' }}>
            Name it, then bring in what you have or start from scratch.
          </p>

          <div style={{ marginBottom: '2.2rem' }}>
            <span style={label}>Project name</span>
            <input
              style={field}
              placeholder="e.g. Acme Corp"
              value={data.projectName}
              onChange={(e) => set({ projectName: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <PathCard
              title="Import what you have"
              desc="Point us at a Figma file, a live site, or a tokens.json and refine it inside the project."
              disabled={!named}
              onClick={() => setStage('import')}
            />
            <PathCard
              title="Start from scratch"
              desc="Answer two questions and we will suggest a palette and type pairing to build on."
              disabled={!named}
              onClick={() => setStage('basics')}
              accent
            />
          </div>
          {!named && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>Give it a name to continue.</p>
          )}
        </div>
      </div>
    );
  }

  // ── import ─────────────────────────────────────────────────────────────────
  if (stage === 'import') {
    return (
      <div style={shell}>
        <Header />
        <div style={body}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem', fontFamily: 'var(--font-heading)' }}>
            Bring in your system
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: 1.6 }}>
            Add what you have now, or skip and do it inside the project — the Brand Context Engine
            handles extraction there.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div>
              <span style={label}>Figma file URL</span>
              <input style={field} placeholder="https://www.figma.com/file/..." value={data.figmaLink} onChange={(e) => set({ figmaLink: e.target.value })} />
            </div>
            <div>
              <span style={label}>Brand website</span>
              <input style={field} placeholder="https://yourbrand.com" value={data.brandUrl} onChange={(e) => set({ brandUrl: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={ghostBtn} onClick={() => setStage('entry')}>Back</button>
            <div style={{ flex: 1 }} />
            <button style={primaryBtn(true)} onClick={createFromImport}>Create project</button>
          </div>
        </div>
      </div>
    );
  }

  // ── done ───────────────────────────────────────────────────────────────────
  if (stage === 'done') {
    const palette = resolvePalette(data);
    return (
      <div style={shell}>
        <Header />
        <div style={{ ...body, textAlign: 'center', paddingTop: '5rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1.5rem',
            background: palette ? palette.primary : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'npPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)' }}>
            {data.projectName} is ready
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 2rem' }}>
            Your palette and type are set as brand tokens. Everything stays editable.
          </p>
          <button style={primaryBtn(true)} onClick={() => navigate('/projects/' + createdId)}>Go to project</button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes npPop { from { transform: scale(0.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }' }} />
      </div>
    );
  }

  // ── the scratch wizard ─────────────────────────────────────────────────────
  const StepBody = { basics: BasicsStep, colors: ColorsStep, typography: TypographyStep, logo: LogoStep, voice: VoiceStep }[stage];

  return (
    <div style={shell}>
      <Header />
      <div style={body}>
        <Stepper current={stage} />
        {stage === 'review' ? <ReviewStep data={data} /> : <StepBody data={data} set={set} />}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', alignItems: 'center' }}>
          <button style={ghostBtn} onClick={goBack}>Back</button>
          <div style={{ flex: 1 }} />
          {stage === 'review'
            ? <button style={primaryBtn(true)} onClick={createFromScratch}>Create design system</button>
            : <button style={primaryBtn(canContinue())} disabled={!canContinue()} onClick={goNext}>Continue</button>}
        </div>
      </div>
    </div>
  );
}

const Header = () => (
  <header style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem', height: '56px', flexShrink: 0,
    padding: '0 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
  }}>
    <Link to="/projects" style={{ textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
      Strata<span style={{ color: 'var(--accent)' }}>.</span>
    </Link>
    <span style={{ color: 'var(--border)', margin: '0 0.3rem' }}>/</span>
    <Link to="/projects" style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Projects</Link>
  </header>
);

const Stepper = ({ current }) => {
  const i = SCRATCH_STEPS.indexOf(current);
  const done = current === 'review';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.2rem', flexWrap: 'wrap' }}>
      {SCRATCH_STEPS.map((s, idx) => {
        const active = idx === i;
        const complete = done || (i >= 0 && idx < i);
        return (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.76rem', fontWeight: active ? 600 : 500,
              color: active ? 'var(--accent)' : complete ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            }}>
              <span style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem',
                background: active ? 'var(--accent)' : complete ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                border: '1px solid ' + (active || complete ? 'var(--accent)' : 'var(--border)'),
                color: active ? '#fff' : complete ? 'var(--accent)' : 'var(--text-tertiary)',
              }}>{complete ? '✓' : idx + 1}</span>
              {STEP_LABELS[s]}
            </span>
            {idx < SCRATCH_STEPS.length - 1 && (
              <span style={{ width: '18px', height: '1px', background: 'var(--border)' }} />
            )}
          </span>
        );
      })}
    </div>
  );
};

const PathCard = ({ title, desc, onClick, disabled, accent }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      textAlign: 'left', padding: '1.4rem',
      background: 'var(--bg-secondary)',
      border: '1px solid ' + (accent ? 'var(--accent)' : 'var(--border)'),
      borderRadius: '16px', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
    }}
  >
    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{title}</div>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
  </button>
);
