import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

// Creating a project asks for a name and nothing else.
//
// How the system gets built — from scratch, or imported from a Figma file / site /
// tokens.json — is chosen later, from Get Started on the project's Brand Bible. Deciding
// that here meant you could not have a project until you had answered how you intended to
// fill it, and it also meant inventing brand values before the user had seen anything.

const field = {
  width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'var(--text-primary)',
  fontSize: '0.9rem', fontFamily: 'inherit',
};
const label = {
  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem',
};

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { addProject } = useProjects();
  const [projectName, setProjectName] = useState('');

  const named = projectName.trim().length > 0;

  // No brand, no tokens: addProject already defaults to an empty token map, and a project
  // the user creates should start genuinely empty rather than pre-filled with guesses.
  const create = () => {
    if (!named) return;
    const project = addProject({
      title: projectName.trim(),
      description: '',
      color: '#FC0694',
      brand: { toneKeywords: [] },
    });
    navigate('/projects/' + project.id);
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

      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)' }}>
          New design system
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 2.2rem', lineHeight: 1.6 }}>
          Name it. You'll choose how to set up the brand — from scratch or imported — once
          you're inside the project.
        </p>

        <div style={{ marginBottom: '1.75rem' }}>
          <span style={label}>Project name</span>
          <input
            style={field}
            placeholder="e.g. Acme Corp"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={create}
            disabled={!named}
            style={{
              padding: '0.65rem 1.4rem', borderRadius: '999px', border: 'none',
              background: named ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: named ? '#fff' : 'var(--text-tertiary)',
              fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
              cursor: named ? 'pointer' : 'not-allowed',
            }}
          >
            Create project
          </button>
          {!named && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Give it a name to continue.</span>
          )}
        </div>
      </div>
    </div>
  );
}
