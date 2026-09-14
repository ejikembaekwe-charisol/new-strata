// A template at its own address.
//
// The gallery's cards link here and open it in a new tab, so studying a template never
// costs you the screen you were standing on. That is also why applying has to happen from
// this page rather than back in the gallery: a new tab cannot reach into the one that
// opened it, and on /projects/new the project does not exist yet — the name typed there
// lives only in that tab's component state.
//
// So "Use this template" here creates a project of its own, named after the template, and
// opens it with the setup wizard pre-filled. The tab you came from is left exactly as it
// was.

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import DesignSystemView from '../components/DesignSystemView';
import { systemFromTemplate } from '../data/templateSystem';
import { TEMPLATES, seedFromTemplate } from '../components/newProject/templateData';

const ProBadge = () => (
  <span style={{
    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
    padding: '0.15rem 0.5rem', borderRadius: '999px',
    background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)',
  }}>PRO</span>
);

export default function TemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addProject } = useProjects();

  const template = TEMPLATES.find(t => t.id === id) || null;

  // Placed before any early return would be needed, and this component has no hooks after
  // it, so there is no hook-order hazard either way.
  if (!template) {
    return (
      <div className="page-container">
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '10rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No such template</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            The link may be wrong, or this template may have been retired.
          </p>
          <Link to="/projects/new" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Start a design system
          </Link>
        </div>
      </div>
    );
  }

  const locked = template.tier === 'pro';
  const system = systemFromTemplate(template);

  const use = () => {
    if (!user) {
      // Come back here after signing in, so the click is not thrown away.
      navigate('/login', { state: { from: '/templates/' + template.id } });
      return;
    }
    const project = addProject({
      title: template.name,
      description: template.description,
      color: template.palette?.primary,
      brand: { toneKeywords: [] },
    });
    // The same route state the create page uses, so the wizard opens pre-filled by exactly
    // the same path rather than a second one that could drift from it.
    navigate('/projects/' + project.id, {
      state: { setup: 'scratch', template: seedFromTemplate(template) },
    });
  };

  return (
    <div className="page-container" style={{ paddingTop: '4.5rem', paddingBottom: '6rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/projects/new" style={{
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        }}>← All templates</Link>
      </div>

      <DesignSystemView
        name={system.name}
        description={system.description}
        color={system.color}
        brand={system.brand}
        tokensMap={system.tokensMap}
        components={system.components}
        meta={system.meta}
        badge={locked ? <ProBadge /> : null}
        actions={locked ? (
          <Link
            to="/pricing"
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '999px', background: 'var(--accent)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            See plans →
          </Link>
        ) : (
          <button
            type="button"
            className="sf-focus"
            onClick={use}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '999px', border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation',
            }}
          >
            Use this template
          </button>
        )}
      />

      <p style={{
        marginTop: '2rem', fontSize: '0.82rem', color: 'var(--text-tertiary)',
        lineHeight: 1.6, maxWidth: '62ch',
      }}>
        {locked
          ? 'Everything this template contains is on this page — the palette, the type, the scale and every token it writes. It just cannot be applied yet.'
          : 'Using it creates a design system of its own, named after the template, and opens the setup steps filled in with these answers. Everything stays editable.'}
      </p>
    </div>
  );
}
