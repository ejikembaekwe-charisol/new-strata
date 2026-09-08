import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import StartChoice from '../components/StartChoice';

// Creating a project is two steps: name it, then choose how the brand gets built.
//
// The choice used to live behind Get Started on the project's Brand Bible, which meant the
// Brand Context Engine — five steps of real extraction work — sat two clicks past a screen
// where nothing appeared to be happening. It is offered here instead, with the cards shared
// from StartChoice so both entry points promise the same two things.
//
// The project itself is created the moment a path is picked rather than on step one: the
// engine reads and writes a real project, so there has to be one for it to work on.

const field = {
  width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'var(--text-primary)',
  fontSize: '0.9rem', fontFamily: 'inherit',
};
const label = {
  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem',
};

const STEPS = ['Name', 'Set up the brand'];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { addProject } = useProjects();
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState(1);

  const named = projectName.trim().length > 0;

  // No brand, no tokens: addProject already defaults to an empty token map, and a project
  // the user creates should start genuinely empty rather than pre-filled with guesses.
  // `setup` rides along in route state so the project opens with that wizard running.
  const create = (setup) => {
    if (!named) return;
    const project = addProject({
      title: projectName.trim(),
      description: '',
      color: '#FC0694',
      brand: { toneKeywords: [] },
    });
    navigate('/projects/' + project.id, setup ? { state: { setup } } : undefined);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
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

      <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)' }}>
          New design system
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
          Name it, then choose whether to build the brand from scratch or import one you
          already have.
        </p>

        {/* Two steps, so the numbering says something true rather than decorating the page. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const now = step === n;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.78rem', fontWeight: now || done ? 600 : 400,
                  color: now ? 'var(--accent)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.66rem', fontWeight: 600,
                    background: now ? 'var(--accent)' : done ? 'var(--bg-tertiary)' : 'transparent',
                    border: now ? 'none' : '1px solid var(--border)',
                    color: now ? '#fff' : 'var(--text-tertiary)',
                  }}>
                    {done ? '✓' : n}
                  </span>
                  {s}
                </span>
                {n < STEPS.length && (
                  <span style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
                )}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={label}>Project name</span>
              <input
                style={field}
                placeholder="e.g. Acme Corp"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && named) { e.preventDefault(); setStep(2); } }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => named && setStep(2)}
                disabled={!named}
                style={{
                  padding: '0.65rem 1.4rem', borderRadius: '999px', border: 'none',
                  background: named ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: named ? '#fff' : 'var(--text-tertiary)',
                  fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                  cursor: named ? 'pointer' : 'not-allowed',
                }}
              >
                Next
              </button>
              {!named && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Give it a name to continue.</span>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StartChoice
              heading={'How do you want to set up ' + projectName.trim() + '?'}
              onPick={(key) => create(key)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.75rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'inherit',
                }}
              >
                ‹ Back
              </button>
              {/* The way out for someone who only wants an empty project — which used to be
                  the whole of this page, so it should not become impossible. */}
              <button
                onClick={() => create(null)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'var(--text-tertiary)', fontSize: '0.85rem', fontFamily: 'inherit',
                  marginLeft: 'auto',
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
