// The build-from-scratch wizard, run from inside a project.
//
// This used to live on /projects/new and end by creating the project. Now the project
// already exists — you reach this from Get Started on the Brand Bible — so it ends by
// applying its answers to the open project through the same `onApply` contract the
// Brand Context Engine uses.
//
// Suggestions on the Colors/Typography steps come from a deterministic lookup on the
// industry + vibe answers. No AI, no backend.

import { useState, useEffect } from 'react';
import {
  getSuggestion, paletteById, resolvePalette, resolvePairing,
  industryLabel, tokensFromChoices, CUSTOM_ID,
} from './designSystemData';
import {
  BasicsStep, ColorsStep, TypographyStep, LogoStep, VoiceStep, ReviewStep,
} from './ScratchSteps';

const SCRATCH_STEPS = ['basics', 'colors', 'typography', 'logo', 'voice'];
const STEP_LABELS = { basics: 'Basics', colors: 'Colors', typography: 'Type', logo: 'Logo', voice: 'Voice' };

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

export default function ScratchWizard({ projectName, onClose, onApply, onSaveContext }) {
  const [stage, setStage] = useState('basics');
  const [data, setData] = useState({
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
  // Back on the first step leaves the wizard — there is no entry screen to return to now
  // that the project already exists.
  const goBack = () => {
    if (stage === 'review') setStage('voice');
    else if (stepIndex > 0) setStage(SCRATCH_STEPS[stepIndex - 1]);
    else onClose();
  };

  const finish = () => {
    const palette = resolvePalette(data);
    const pairing = resolvePairing(data);
    // An uploaded logo genuinely is a Brand Images source, so record it as one. Nothing
    // else is marked provided — the other engine sources really are still empty.
    if (data.logoDataUrl && onSaveContext) {
      onSaveContext({ images: { items: [{ name: 'Logo', dataUrl: data.logoDataUrl }], extraction: null } });
    }
    onApply({
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
      tokens: tokensFromChoices(palette, pairing),
    });
  };

  const StepBody = {
    basics: BasicsStep, colors: ColorsStep, typography: TypographyStep,
    logo: LogoStep, voice: VoiceStep,
  }[stage];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', height: '56px', flexShrink: 0,
        padding: '0 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
          Strata<span style={{ color: 'var(--accent)' }}>.</span>
        </span>
        <span style={{ color: 'var(--border)', margin: '0 0.3rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {projectName || 'Project'}
        </span>
        <span style={{ color: 'var(--border)', margin: '0 0.3rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Build from scratch</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          title="Close"
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0 0.2rem' }}
        >
          ×
        </button>
      </header>

      <div style={{ width: '100%', maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <Stepper current={stage} />
        {stage === 'review' ? <ReviewStep data={data} /> : <StepBody data={data} set={set} />}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', alignItems: 'center' }}>
          <button style={ghostBtn} onClick={goBack}>Back</button>
          <div style={{ flex: 1 }} />
          {stage === 'review'
            ? <button style={primaryBtn(true)} onClick={finish}>Apply to project</button>
            : <button style={primaryBtn(canContinue())} disabled={!canContinue()} onClick={goNext}>Continue</button>}
        </div>
      </div>
    </div>
  );
}
