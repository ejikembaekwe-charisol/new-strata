import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTabs } from '../context/TabsContext';

// Workspace tab strip. Desktop only — App.css sets --tabstrip-h to 0px and hides this under
// 768px, which is also what keeps ProjectDetail's viewport maths unchanged on mobile.

export default function ProjectTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openTabs, closeTab, neighbourOf, recentProjects } = useTabs();

  // The strip is overflow-x:auto, so an absolutely-positioned menu inside it would be clipped.
  // Measure the button and render the menu fixed instead.
  const [menuAt, setMenuAt] = useState(null);
  const plusRef = useRef(null);

  const openMenu = () => {
    const r = plusRef.current?.getBoundingClientRect();
    if (!r) return;
    setMenuAt({ left: r.left, top: r.bottom + 6 });
  };

  // Close on Escape, and on any scroll or resize that would leave it mispositioned
  useEffect(() => {
    if (!menuAt) return;
    const close = () => setMenuAt(null);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menuAt]);

  // The active project id comes from the path rather than a prop, so a deep link, the branch
  // switcher and a tab click all agree on which chip is current.
  const match = location.pathname.match(/^\/projects\/([^/]+)$/);
  const activeId = match && match[1] !== 'generate' ? match[1] : null;
  const onList = location.pathname === '/projects';

  // The strip is fixed, and it has to sit below the global Navigation on the list route while
  // sitting at the very top on project routes where Navigation is not rendered. Measuring the
  // nav instead of hardcoding a height keeps both cases correct even if the nav restyles.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const nav = document.querySelector('.nav');
      root.style.setProperty('--nav-h', (nav?.offsetHeight || 0) + 'px');
    };
    apply();
    const nav = document.querySelector('.nav');
    if (!nav || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', apply);
      return () => window.removeEventListener('resize', apply);
    }
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [location.pathname]);

  const onClose = (e, id) => {
    e.stopPropagation();      // never let the close bubble into "switch to this tab"
    const isActive = String(id) === String(activeId);
    const next = isActive ? neighbourOf(id) : null;
    closeTab(id);
    if (!isActive) return;
    navigate(next ? `/projects/${next.id}` : '/projects');
  };

  return (
    <div className="workspace-tabs">
      <button
        className={'workspace-tab workspace-tab-home' + (onList ? ' is-active' : '')}
        onClick={() => navigate('/projects')}
        title="All projects"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
        Projects
      </button>

      {openTabs.map(p => {
        const isActive = String(p.id) === String(activeId);
        return (
          <div
            key={p.id}
            className={'workspace-tab' + (isActive ? ' is-active' : '')}
            onClick={() => { if (!isActive) navigate(`/projects/${p.id}`); }}
            onAuxClick={(e) => { if (e.button === 1) onClose(e, p.id); }}
            title={p.name}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/projects/${p.id}`); } }}
          >
            <span className="workspace-tab-dot" style={{ background: p.color || 'var(--accent)' }} />
            <span className="workspace-tab-name">{p.name}</span>
            <button
              className="workspace-tab-close"
              onClick={(e) => onClose(e, p.id)}
              aria-label={`Close ${p.name}`}
              title={`Close ${p.name}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* + offers recently opened projects, or a new one */}
      <button
        ref={plusRef}
        className="workspace-tab workspace-tab-new"
        onClick={() => (menuAt ? setMenuAt(null) : openMenu())}
        title="Open a project"
        aria-label="Open a project"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {menuAt && (
        <>
          <div className="workspace-menu-backdrop" onClick={() => setMenuAt(null)} />
          <div className="workspace-menu" style={{ left: menuAt.left + 'px', top: menuAt.top + 'px' }}>
            {recentProjects.length > 0 && (
              <>
                <div className="workspace-menu-label">Recent</div>
                {recentProjects.slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    className="workspace-menu-item"
                    onClick={() => { setMenuAt(null); navigate('/projects/' + p.id); }}
                  >
                    <span className="workspace-tab-dot" style={{ background: p.color || 'var(--accent)' }} />
                    <span className="workspace-menu-item-name">{p.name}</span>
                  </button>
                ))}
                <div className="workspace-menu-divider" />
              </>
            )}

            <button
              className="workspace-menu-item"
              onClick={() => { setMenuAt(null); navigate('/projects/new'); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New project
            </button>

            <button
              className="workspace-menu-item"
              onClick={() => { setMenuAt(null); navigate('/projects'); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Browse all projects
            </button>
          </div>
        </>
      )}
    </div>
  );
}
