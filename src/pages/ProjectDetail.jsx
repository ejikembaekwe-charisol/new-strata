import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';

/* ── Error Boundary: prevents blank screen on render crashes ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ProjectDetail render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          background: 'var(--bg)', color: 'var(--text-primary)', gap: '1rem',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '0.6rem 1.5rem',
              fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };

const menuItemStyle = {
  display: 'block', width: '100%', background: 'none', border: 'none',
  padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem',
  color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left',
  fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
};

const actionBtnStyle = {
  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.78rem',
  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
};

const MOCK_TOKEN_CATEGORIES = ['Color', 'Typography', 'Spacing', 'Border', 'Shadow', 'Motion'];

const MOCK_TOKENS = {
  Color: [
    { name: 'color.primary', value: '#FC0694', type: 'color' },
    { name: 'color.secondary', value: '#1A1A24', type: 'color' },
    { name: 'color.accent', value: '#3B82F6', type: 'color' },
    { name: 'color.background', value: '#0D0D12', type: 'color' },
    { name: 'color.surface', value: '#13131A', type: 'color' },
    { name: 'color.text.primary', value: '#FFFFFF', type: 'color' },
    { name: 'color.text.secondary', value: '#8C8CA1', type: 'color' },
  ],
  Typography: [
    { name: 'font.heading', value: 'Outfit', type: 'fontFamily' },
    { name: 'font.body', value: 'Inter', type: 'fontFamily' },
    { name: 'font.size.xs', value: '0.75rem', type: 'fontSize' },
    { name: 'font.size.sm', value: '0.875rem', type: 'fontSize' },
    { name: 'font.size.base', value: '1rem', type: 'fontSize' },
    { name: 'font.size.lg', value: '1.25rem', type: 'fontSize' },
    { name: 'font.size.xl', value: '1.5rem', type: 'fontSize' },
  ],
  Spacing: [
    { name: 'spacing.1', value: '4px', type: 'spacing' },
    { name: 'spacing.2', value: '8px', type: 'spacing' },
    { name: 'spacing.3', value: '12px', type: 'spacing' },
    { name: 'spacing.4', value: '16px', type: 'spacing' },
    { name: 'spacing.6', value: '24px', type: 'spacing' },
    { name: 'spacing.8', value: '32px', type: 'spacing' },
  ],
  Border: [
    { name: 'border.radius.sm', value: '4px', type: 'borderRadius' },
    { name: 'border.radius.md', value: '8px', type: 'borderRadius' },
    { name: 'border.radius.lg', value: '16px', type: 'borderRadius' },
    { name: 'border.radius.full', value: '9999px', type: 'borderRadius' },
  ],
  Shadow: [
    { name: 'shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)', type: 'shadow' },
    { name: 'shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)', type: 'shadow' },
    { name: 'shadow.lg', value: '0 16px 48px rgba(0,0,0,0.5)', type: 'shadow' },
  ],
  Motion: [
    { name: 'duration.fast', value: '150ms', type: 'duration' },
    { name: 'duration.base', value: '250ms', type: 'duration' },
    { name: 'duration.slow', value: '500ms', type: 'duration' },
    { name: 'easing.default', value: 'cubic-bezier(0.4,0,0.2,1)', type: 'easing' },
  ],
};

const TYPE_COLORS = {
  color: '#FC0694',
  fontFamily: '#8B5CF6',
  fontSize: '#8B5CF6',
  spacing: '#22C55E',
  borderRadius: '#F59E0B',
  shadow: '#3B82F6',
  duration: '#EF4444',
  easing: '#EF4444',
};

export default function ProjectDetail() {
  return (
    <ErrorBoundary>
      <ProjectDetailInner />
    </ErrorBoundary>
  );
}

function ProjectDetailInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { projects, isLoaded, updateProject } = useProjects();

  // Find project from list
  const project = projects.find(p => String(p.id) === String(id));

  const [activeTab, setActiveTab] = useState('tokens');
  const [activeCategory, setActiveCategory] = useState('Color');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [brandData, setBrandData] = useState(null);
  
  // State from project — merge saved tokens with MOCK_TOKENS so no category is ever undefined
  const [activeTokens, setActiveTokens] = useState(() => {
    const saved = project?.tokens;
    if (!saved) return MOCK_TOKENS;
    // Ensure every MOCK category exists and is always an array
    const merged = { ...MOCK_TOKENS };
    for (const cat in saved) {
      merged[cat] = Array.isArray(saved[cat]) ? saved[cat] : (merged[cat] || []);
    }
    return merged;
  });
  const [components, setComponents] = useState(() => {
    return Array.isArray(project?.components) ? project.components : [];
  });
  const [suggestion, setSuggestion] = useState(null);

  // UI interaction states
  const [activeDropdown, setActiveDropdown] = useState(null); // token.name
  const [tokenModal, setTokenModal] = useState(null); // { mode: 'add'|'edit', token?, category }
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editingTokenName, setEditingTokenName] = useState(null);
  const [editingTokenValue, setEditingTokenValue] = useState('');

  // Initialize brandData once project is found
  React.useEffect(() => {
    if (project && !brandData) {
      setBrandData({
        primaryColor: project.brand?.primaryColor || '#FC0694',
        secondaryColor: project.brand?.secondaryColor || '#1A1A24',
        accentColor: project.brand?.accentColor || '#3B82F6',
        headingFont: project.brand?.headingFont || 'Outfit',
        bodyFont: project.brand?.bodyFont || 'Inter',
        websiteUrl: project.websiteUrl || '',
        figmaUrl: project.figmaUrl || '',
        toneKeywords: project.brand?.toneKeywords || [],
        voice: project.brand?.voice || 'Professional, precise, and forward-leaning.',
        manifesto: project.brand?.manifesto || `## Holistic Design Manifesto

We believe in design that serves a purpose beyond aesthetics. Our brand is built on the principles of clarity, intention, and structural integrity. 

Every element—from typography to color, from macro-layout to micro-interaction—must work together to create a cohesive and intuitive user experience. 

### Core Principles
1. **Purposeful:** Every design decision must solve a specific user problem.
2. **Accessible:** Our products are built for everyone, without compromise.
3. **Elegant:** We embrace simplicity, removing the unnecessary so the essential may speak.

This document serves as our living source of truth.`
      });
    }
  }, [project, brandData]);

  // Loading state
  if (!isLoaded) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  // Not found state
  if (!project) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '10rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Project not found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>The project you are looking for doesn't exist or has been deleted.</p>
        <Link to="/projects" className="btn btn-primary">Back to projects</Link>
      </div>
    );
  }

  // Wait for brandData to initialize
  if (!brandData) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  // Helper functions for state synchronization
  const updateTokensState = (newTokens) => {
    setActiveTokens(newTokens);
    updateProject(id, { tokens: newTokens });
  };

  const updateComponentsState = (newComponents) => {
    setComponents(newComponents);
    updateProject(id, { components: newComponents });
  };

  // State actions for tokens
  const handleAddToken = (category, token) => {
    const updated = {
      ...activeTokens,
      [category]: [...(activeTokens[category] || []), token]
    };
    updateTokensState(updated);
  };

  const handleEditToken = (category, originalName, updatedToken) => {
    const originalCategory = getCategoryForType(activeTokens[category].find(t => t.name === originalName)?.type) || category;
    const newCategory = getCategoryForType(updatedToken.type);

    let updated = { ...activeTokens };
    if (originalCategory === newCategory) {
      updated[category] = activeTokens[category].map(t => t.name === originalName ? updatedToken : t);
    } else {
      updated[originalCategory] = activeTokens[originalCategory].filter(t => t.name !== originalName);
      updated[newCategory] = [...(activeTokens[newCategory] || []), updatedToken];
    }
    updateTokensState(updated);
  };

  const handleDeleteToken = (category, name) => {
    const updated = {
      ...activeTokens,
      [category]: activeTokens[category].filter(t => t.name !== name)
    };
    updateTokensState(updated);
  };

  const handleDuplicateToken = (category, token) => {
    const duplicated = {
      ...token,
      name: `${token.name}_copy`
    };
    handleAddToken(category, duplicated);
  };

  // State actions for components
  const handleAddComponent = (comp) => {
    const newComp = {
      id: String(Date.now()),
      ...comp
    };
    updateComponentsState([...components, newComp]);
  };

  const handleDeleteComponent = (compId) => {
    updateComponentsState(components.filter(c => c.id !== compId));
  };

  // Token value resolver for live component styles
  const resolveTokenValue = (tokenName) => {
    if (!tokenName) return '';
    for (const cat in activeTokens) {
      const found = activeTokens[cat]?.find(t => t.name === tokenName);
      if (found) return found.value;
    }
    return '';
  };

  // Live Component Preview Renderer
  const renderLivePreview = (comp) => {
    const style = {
      background: resolveTokenValue(comp.tokens?.bg),
      color: resolveTokenValue(comp.tokens?.textColor),
      padding: resolveTokenValue(comp.tokens?.padding),
      borderRadius: resolveTokenValue(comp.tokens?.borderRadius),
      fontFamily: resolveTokenValue(comp.tokens?.fontFamily),
      fontSize: resolveTokenValue(comp.tokens?.fontSize),
      border: 'none',
      cursor: 'pointer',
      display: 'inline-block',
      textAlign: 'center',
      fontWeight: 500,
      transition: 'opacity 0.2s',
    };

    if (comp.template === 'button') {
      return (
        <button style={style} onClick={() => alert(`${comp.name} clicked!`)}>
          Click Me
        </button>
      );
    }
    if (comp.template === 'badge') {
      return (
        <span style={{ ...style, display: 'inline-block', textTransform: 'uppercase', fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          New
        </span>
      );
    }
    if (comp.template === 'card') {
      return (
        <div style={{
          background: resolveTokenValue(comp.tokens?.bg) || 'var(--bg-secondary)',
          color: resolveTokenValue(comp.tokens?.textColor),
          padding: resolveTokenValue(comp.tokens?.padding),
          borderRadius: resolveTokenValue(comp.tokens?.borderRadius),
          fontFamily: resolveTokenValue(comp.tokens?.fontFamily),
          fontSize: resolveTokenValue(comp.tokens?.fontSize),
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'left',
          width: '100%',
          maxWidth: '240px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Card Title</div>
          <div style={{ opacity: 0.7, fontSize: '0.85em' }}>This is a token-mapped card component.</div>
        </div>
      );
    }
    if (comp.template === 'input') {
      return (
        <input
          type="text"
          placeholder="Placeholder..."
          style={{
            background: 'var(--bg-tertiary)',
            color: resolveTokenValue(comp.tokens?.textColor) || 'var(--text-primary)',
            padding: resolveTokenValue(comp.tokens?.padding),
            borderRadius: resolveTokenValue(comp.tokens?.borderRadius),
            fontFamily: resolveTokenValue(comp.tokens?.fontFamily),
            fontSize: resolveTokenValue(comp.tokens?.fontSize),
            border: `1px solid ${resolveTokenValue(comp.tokens?.bg) || 'var(--border)'}`,
            outline: 'none',
            width: '100%',
            maxWidth: '200px',
          }}
          disabled
        />
      );
    }
    return null;
  };

  const handleBrandUpdate = (field, value) => {
    const newData = { ...brandData, [field]: value };
    setBrandData(newData);
    
    // Persist to global context
    updateProject(id, { brand: newData });

    // Sync to tokens
    if (field === 'primaryColor') updateToken('Color', 'color.primary', value);
    if (field === 'secondaryColor') updateToken('Color', 'color.secondary', value);
    if (field === 'accentColor') updateToken('Color', 'color.accent', value);
    if (field === 'headingFont') updateToken('Typography', 'font.heading', value);
    if (field === 'bodyFont') updateToken('Typography', 'font.body', value);

    // --- Intelligent Suggestion Engine ---
    
    // 1. Color -> Tone
    if (field === 'primaryColor') {
      if (value.toLowerCase().includes('yellow') || value === '#FACC15') {
        setSuggestion({
          message: 'Bright primary colors often benefit from an "Energetic" tone. Update tone?',
          newValue: ['Energetic', 'Lively', 'Modern'],
          originalField: 'toneKeywords'
        });
      }
    }

    // 2. Tone -> Color
    if (field === 'toneKeywords' && value.includes('Calm')) {
      setSuggestion({
        message: 'A "Calm" tone pairs well with soft blues. Update Primary Color to #60A5FA?',
        newValue: '#60A5FA',
        originalField: 'primaryColor'
      });
    }

    // 3. Font -> Tone/Voice
    if (field === 'headingFont' && value === 'Roboto') {
      setSuggestion({
        message: 'Roboto is a neutral, technical font. Should we adjust the Brand Voice to be more "Systematic"?',
        newValue: 'Systematic, efficient, and data-driven.',
        originalField: 'voice'
      });
    }
  };

  const approveSuggestion = () => {
    if (!suggestion) return;
    handleBrandUpdate(suggestion.originalField, suggestion.newValue);
    setSuggestion(null);
  };

  const rejectSuggestion = () => {
    setSuggestion(null);
  };

  const updateToken = (category, name, value) => {
    const updated = {
      ...activeTokens,
      [category]: activeTokens[category].map(t => t.name === name ? { ...t, value } : t)
    };
    updateTokensState(updated);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brandData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "brand-context.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDownloadLogo = () => {
    alert('Downloading assets... (mock)');
  };

  const tokens = activeTokens[activeCategory] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── App Top Bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0 1.5rem', height: '52px', flexShrink: 0,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Strata<span style={{ color: 'var(--accent)' }}>.</span>
          </span>
        </Link>

        <span style={{ color: 'var(--border)', fontSize: '1.2rem', marginLeft: '0.25rem' }}>/</span>

        <Link to="/projects" style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Projects
        </Link>

        <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>/</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: project.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</span>
          <span style={{
            fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: '100px',
            border: '1px solid var(--border)', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{project.status}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Sync button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--accent-glow)', border: '1px solid rgba(252,6,148,0.25)',
          borderRadius: '6px', padding: '0.4rem 0.875rem',
          color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Sync
        </button>

        {/* Export button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '0.4rem 0.875rem',
          color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(p => !p)}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--accent)', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.7rem', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {user?.initials || 'U'}
          </button>
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '0.375rem', minWidth: '160px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200,
            }}>
              <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{user?.email}</div>
              </div>
              <button onClick={() => { navigate('/projects'); setShowUserMenu(false); }} style={menuItemStyle}>
                My projects
              </button>
              <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }} style={{ ...menuItemStyle, color: '#EF4444' }}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <aside style={{
          width: '200px', flexShrink: 0,
          background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '1rem 0',
          overflowY: 'auto',
        }}>
          {/* Tabs */}
          <div style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'brand', label: 'Brand Bible', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
              { id: 'tokens', label: 'Tokens', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
              { id: 'components', label: 'Components', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { id: 'settings', label: 'Settings', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                  background: activeTab === tab.id ? 'var(--bg-tertiary)' : 'none',
                  border: 'none', borderRadius: '6px',
                  padding: '0.5rem 0.625rem', marginBottom: '0.1rem',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 500 : 400,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Token categories */}
          {activeTab === 'tokens' && (
            <div style={{ padding: '0 0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', padding: '0 0.625rem' }}>
                Categories
              </div>
              {MOCK_TOKEN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: activeCategory === cat ? 'var(--accent-glow)' : 'none',
                    border: activeCategory === cat ? '1px solid rgba(252,6,148,0.2)' : '1px solid transparent',
                    borderRadius: '6px', padding: '0.45rem 0.625rem', marginBottom: '0.1rem',
                    color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  {cat}
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    {MOCK_TOKENS[cat]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {activeTab === 'brand' && (
            <div style={{ maxWidth: '1200px' }}>
              
              {/* Intelligent Suggestion Banner */}
              {suggestion && (
                <div style={{ 
                  background: 'var(--accent-glow)', border: '1px solid var(--accent)', 
                  borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(252,6,148,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 11-7.6-12.7 8.19 8.19 0 014.9 1.5"/><polyline points="16 5 19 8 21 6"/></svg>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{suggestion.message}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={rejectSuggestion} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Reject</button>
                    <button onClick={approveSuggestion} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Approve</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  {/* Manifesto Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Holistic Design Manifesto</h2>
                        <span style={{ 
                          fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '100px', 
                          background: 'var(--accent-glow)', color: 'var(--accent)', 
                          border: '1px solid rgba(252,6,148,0.2)', fontWeight: 600 
                        }}>AI GENERATED</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button style={actionBtnStyle}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Export PDF
                        </button>
                        <button style={actionBtnStyle} onClick={() => alert('Manifesto copied to clipboard for Engineering Handoff!')}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          Copy for Handoff
                        </button>
                      </div>
                    </div>
                    <div style={{ 
                      background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '20px', 
                      border: '1px solid var(--border)', lineHeight: '1.8', color: 'var(--text-secondary)',
                      fontSize: '1rem', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px',
                        background: 'radial-gradient(circle, rgba(252,6,148,0.05) 0%, transparent 70%)',
                        pointerEvents: 'none'
                      }} />
                      <textarea 
                        className="manifesto-view" 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          width: '100%', 
                          minHeight: '300px', 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          padding: 0
                        }}
                        value={brandData.manifesto}
                        onChange={(e) => handleBrandUpdate('manifesto', e.target.value)}
                      />
                    </div>
                  </section>

                  {/* Tone & Voice Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: 0 }}>Tone & Voice</h2>
                      <button 
                        onClick={() => {
                          const val = prompt('Add tone keyword (e.g. Playful, Professional):');
                          if (val) handleBrandUpdate('toneKeywords', [...brandData.toneKeywords, val]);
                        }}
                        style={actionBtnStyle}
                      >+ Add keyword</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {brandData.toneKeywords.map((keyword, i) => (
                          <div key={i} style={{ 
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: 'var(--text-primary)', fontSize: '0.9rem'
                          }}>
                            {keyword}
                            <button 
                              onClick={() => handleBrandUpdate('toneKeywords', brandData.toneKeywords.filter((_, idx) => idx !== i))}
                              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Brand Voice Description</label>
                        <textarea 
                          className="form-textarea"
                          style={{ height: '80px', fontSize: '0.9rem' }}
                          value={brandData.voice}
                          onChange={(e) => handleBrandUpdate('voice', e.target.value)}
                          placeholder="Describe how the brand speaks..."
                        />
                      </div>
                    </div>
                  </section>

                  {/* Identity Grid */}
                  <section>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Visual Identity</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Brand Colors</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {[
                            { label: 'Primary', field: 'primaryColor' },
                            { label: 'Secondary', field: 'secondaryColor' },
                            { label: 'Accent', field: 'accentColor' },
                          ].map(c => (
                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.label}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input 
                                  type="color" 
                                  value={brandData[c.field]} 
                                  onChange={(e) => handleBrandUpdate(c.field, e.target.value)}
                                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
                                />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{brandData[c.field].toUpperCase()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Typography</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Headings</span>
                            <select 
                              value={brandData.headingFont} 
                              onChange={(e) => handleBrandUpdate('headingFont', e.target.value)}
                              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                            >
                              <option>Outfit</option>
                              <option>Inter</option>
                              <option>Roboto</option>
                            </select>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Body</span>
                            <select 
                              value={brandData.bodyFont} 
                              onChange={(e) => handleBrandUpdate('bodyFont', e.target.value)}
                              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                            >
                              <option>Inter</option>
                              <option>Roboto</option>
                              <option>Outfit</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar: Assets & Refs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Logo Card */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.5rem', color: '#000' }}>S<span style={{ color: brandData.primaryColor }}>.</span></span>
                    </div>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Main Brandmark</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>SVG, PNG, WebP available</p>
                    <button 
                      onClick={handleDownloadLogo}
                      className="btn btn-secondary" 
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Assets
                    </button>
                  </div>

                  {/* Source References */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: 0 }}>Source of Truth</h3>
                      <button 
                        onClick={handleExportJSON}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                      >Export JSON</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Figma URL</label>
                        <input 
                          className="form-input" 
                          style={{ fontSize: '0.8rem', padding: '0.4rem' }} 
                          value={brandData.figmaUrl} 
                          onChange={(e) => handleBrandUpdate('figmaUrl', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Website URL</label>
                        <input 
                          className="form-input" 
                          style={{ fontSize: '0.8rem', padding: '0.4rem' }} 
                          value={brandData.websiteUrl} 
                          onChange={(e) => handleBrandUpdate('websiteUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tokens' && (
            <>
              {/* Token table header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeCategory} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({tokens.length})</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setTokenModal({ mode: 'add', category: activeCategory })} style={actionBtnStyle}>+ Add token</button>
                  <button style={actionBtnStyle} onClick={() => alert('Importing tokens... (mock)')}>Import</button>
                </div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '1rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                {['Name', 'Value', 'Type', ''].map(h => (
                  <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {/* Token rows */}
              {tokens.map((token, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto',
                    gap: '1rem', alignItems: 'center',
                    padding: '0.625rem 0.875rem', borderRadius: '8px',
                    transition: 'background 0.15s', cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {token.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {token.type === 'color' && (
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: token.value, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    )}
                    {editingTokenName === token.name ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingTokenValue}
                        onChange={(e) => setEditingTokenValue(e.target.value)}
                        onBlur={() => {
                          handleEditToken(activeCategory, token.name, { ...token, value: editingTokenValue });
                          setEditingTokenName(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditToken(activeCategory, token.name, { ...token, value: editingTokenValue });
                            setEditingTokenName(null);
                          } else if (e.key === 'Escape') {
                            setEditingTokenName(null);
                          }
                        }}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--accent)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          padding: '0.1rem 0.3rem',
                          width: '100%',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setEditingTokenName(token.name);
                          setEditingTokenValue(token.value);
                        }}
                        title="Double click to edit value"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          borderBottom: '1px dashed transparent',
                          transition: 'border-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderBottom = '1px dashed var(--text-tertiary)'}
                        onMouseLeave={e => e.currentTarget.style.borderBottom = '1px dashed transparent'}
                      >
                        {token.value}
                      </span>
                    )}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                    background: `${TYPE_COLORS[token.type]}15`,
                    color: TYPE_COLORS[token.type],
                    border: `1px solid ${TYPE_COLORS[token.type]}30`,
                    fontWeight: 500, letterSpacing: '0.03em',
                  }}>
                    {token.type}
                  </span>
                  
                  {/* 3-Dot Action Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === token.name ? null : token.name);
                      }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', padding: '0.2rem', borderRadius: '4px',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                    {activeDropdown === token.name && (
                      <>
                        <div
                          onClick={() => setActiveDropdown(null)}
                          style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 100, background: 'transparent',
                          }}
                        />
                        <div style={{
                          position: 'absolute', top: '100%', right: 0,
                          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '0.25rem', minWidth: '120px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 101,
                          display: 'flex', flexDirection: 'column', gap: '0.1rem',
                        }}>
                          <button
                            onClick={() => {
                              setTokenModal({ mode: 'edit', token, category: activeCategory });
                              setActiveDropdown(null);
                            }}
                            style={menuItemStyle}
                          >
                            Edit Token
                          </button>
                          <button
                            onClick={() => {
                              handleDuplicateToken(activeCategory, token);
                              setActiveDropdown(null);
                            }}
                            style={menuItemStyle}
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${token.name}"?`)) {
                                handleDeleteToken(activeCategory, token.name);
                              }
                              setActiveDropdown(null);
                            }}
                            style={{ ...menuItemStyle, color: '#EF4444' }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'components' && components.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-tertiary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No components yet</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Add components that reference your tokens.
              </p>
              <button onClick={() => setShowComponentModal(true)} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
                + Add component
              </button>
            </div>
          )}

          {activeTab === 'components' && components.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Components <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({components.length})</span>
                </h2>
                <button onClick={() => setShowComponentModal(true)} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
                  + Add component
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.5rem',
              }}>
                {components.map((comp) => (
                  <div key={comp.id} style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    position: 'relative',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{comp.name}</h3>
                          <span style={{
                            fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '100px',
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                            color: 'var(--text-secondary)', fontWeight: 500
                          }}>{comp.category}</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{comp.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete component "${comp.name}"?`)) {
                            handleDeleteComponent(comp.id);
                          }
                        }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(239, 68, 68, 0.6)', padding: '0.2rem',
                          display: 'flex', alignItems: 'center',
                        }}
                        title="Delete component"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Canvas/Preview Area */}
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', top: '6px', left: '8px', fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Live Canvas
                      </div>
                      {renderLivePreview(comp)}
                    </div>

                    {/* Mapped Tokens List */}
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Mapped Tokens
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.entries(comp.tokens || {}).map(([prop, tokenName]) => {
                          if (!tokenName) return null;
                          return (
                            <div key={prop} style={{
                              display: 'flex', alignItems: 'center', gap: '0.35rem',
                              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                              padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem'
                            }}>
                              <span style={{ color: 'var(--text-tertiary)' }}>{prop}:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500 }}>{tokenName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ maxWidth: '480px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Project settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Project name</label>
                  <input className="form-input" defaultValue={project.name} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select className="form-input" style={{ cursor: 'pointer' }}>
                    <option>Private</option>
                    <option>Public</option>
                  </select>
                </div>
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button style={{ ...actionBtnStyle, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
                    Delete project
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* ── Modals ── */}
      {tokenModal && (
        <TokenModal
          modal={tokenModal}
          onClose={() => setTokenModal(null)}
          onSave={(updatedToken) => {
            if (tokenModal.mode === 'add') {
              handleAddToken(tokenModal.category, updatedToken);
            } else {
              handleEditToken(tokenModal.category, tokenModal.token.name, updatedToken);
            }
            setTokenModal(null);
          }}
        />
      )}

      {showComponentModal && (
        <ComponentModal
          activeTokens={activeTokens}
          onClose={() => setShowComponentModal(false)}
          onSave={(compData) => {
            handleAddComponent(compData);
            setShowComponentModal(false);
          }}
        />
      )}

    </div>
  );
}

/* ── Utility functions for token translation ── */
const getCategoryForType = (type) => {
  if (type === 'color') return 'Color';
  if (type === 'fontFamily' || type === 'fontSize') return 'Typography';
  if (type === 'spacing') return 'Spacing';
  if (type === 'borderRadius') return 'Border';
  if (type === 'shadow') return 'Shadow';
  if (type === 'duration' || type === 'easing') return 'Motion';
  return 'Color'; // fallback
};

const getDefaultTypeForCategory = (category) => {
  if (category === 'Color') return 'color';
  if (category === 'Typography') return 'fontFamily';
  if (category === 'Spacing') return 'spacing';
  if (category === 'Border') return 'borderRadius';
  if (category === 'Shadow') return 'shadow';
  if (category === 'Motion') return 'duration';
  return 'color';
};

/* ── Token Add/Edit Dialog Component ── */
function TokenModal({ modal, onClose, onSave }) {
  const isEdit = modal.mode === 'edit';
  const [name, setName] = useState(isEdit ? modal.token.name : '');
  const [value, setValue] = useState(isEdit ? modal.token.value : '');
  const [type, setType] = useState(isEdit ? modal.token.type : getDefaultTypeForCategory(modal.category));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) {
      alert('Please fill in all fields');
      return;
    }
    onSave({ name: name.trim(), value: value.trim(), type });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(9, 9, 12, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', width: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Token' : 'Add Token'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Token Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. color.primary"
              required
              disabled={isEdit}
              style={{ background: isEdit ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', color: isEdit ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Token Type</label>
            <select
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="color">Color</option>
              <option value="fontFamily">Font Family</option>
              <option value="fontSize">Font Size</option>
              <option value="spacing">Spacing</option>
              <option value="borderRadius">Border Radius</option>
              <option value="shadow">Shadow</option>
              <option value="duration">Duration</option>
              <option value="easing">Easing</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Token Value</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. #FFFFFF or 16px"
                required
                style={{ flex: 1 }}
              />
              {type === 'color' && (
                <input
                  type="color"
                  value={value.startsWith('#') && value.length === 7 ? value : '#ffffff'}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={actionBtnStyle}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.25rem' }}>
              {isEdit ? 'Save Changes' : 'Create Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Component Wizard dialog ── */
function ComponentModal({ onClose, onSave, activeTokens }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Atom');
  const [template, setTemplate] = useState('button');

  // Token mappings
  const [bg, setBg] = useState('');
  const [textColor, setTextColor] = useState('');
  const [padding, setPadding] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('');

  const getTokensOfType = (type) => {
    const list = [];
    if (!activeTokens || typeof activeTokens !== 'object') return list;
    for (const cat in activeTokens) {
      const catTokens = activeTokens[cat];
      if (!Array.isArray(catTokens)) continue; // skip null/undefined/non-array categories
      catTokens.forEach(t => {
        if (t && t.type === type) {
          list.push(t.name);
        }
      });
    }
    return list;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a component name');
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim() || 'Custom component',
      category,
      template,
      tokens: {
        bg,
        textColor,
        padding,
        borderRadius,
        fontFamily,
        fontSize,
      }
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(9, 9, 12, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', width: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Create New Component
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Component Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PrimaryButton"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Atom">Atom</option>
                <option value="Molecule">Molecule</option>
                <option value="Organism">Organism</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Description</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard button for primary calls to action"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Preview Template</label>
            <select
              className="form-input"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="button">Button template</option>
              <option value="badge">Badge template</option>
              <option value="card">Card template</option>
              <option value="input">Input template</option>
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token Mappings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Background Color</label>
                <select className="form-input" value={bg} onChange={(e) => setBg(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('color').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Text Color</label>
                <select className="form-input" value={textColor} onChange={(e) => setTextColor(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('color').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Padding (Spacing)</label>
                <select className="form-input" value={padding} onChange={(e) => setPadding(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('spacing').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Border Radius</label>
                <select className="form-input" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('borderRadius').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Font Family</label>
                <select className="form-input" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('fontFamily').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Font Size</label>
                <select className="form-input" value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
                  <option value="">-- None --</option>
                  {getTokensOfType('fontSize').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={actionBtnStyle}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.25rem' }}>
              Create Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

