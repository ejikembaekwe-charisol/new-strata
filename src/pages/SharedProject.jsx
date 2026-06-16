import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const TYPE_COLORS = {
  color: '#FC0694',
  fontFamily: '#10B981',
  fontSize: '#3B82F6',
  spacing: '#F59E0B',
  borderRadius: '#8B5CF6',
  shadow: '#EC4899',
  duration: '#6366F1',
  easing: '#14B8A6',
};

const getMockProject = (id) => {
  const systems = [
    { id: '1', name: 'My Design', color: '#1a237e', description: 'Internal branding system for our key corporate web dashboard.' },
    { id: '2', name: 'Rukky', color: '#880e4f', description: 'A creative brand system designed for Rukky rhino conservation programs.' },
    { id: '3', name: 'Demo Project', color: '#004d40', description: 'The official Strata demonstration design system to explore live updates.' },
    { id: '4', name: 'Demo', color: '#b71c1c', description: 'Quick playground test suite designed for visual experiments.' },
    { id: '5', name: 'Gregori Showcase', color: '#5d4037', description: 'Elegant and classic editorial design system built for the Gregori family portfolios.' },
    { id: '6', name: 'UXR Team', color: '#0f766e', description: 'Research and UX engineering collaborative dashboard design system.' },
    { id: '7', name: 'Something Light', color: '#7c3aed', description: 'Minimalist brand guideline focusing on light weights and pastel components.' }
  ];
  
  const sys = systems.find(s => String(s.id) === String(id)) || systems[0];
  
  return {
    id: String(sys.id),
    name: sys.name,
    description: sys.description,
    color: sys.color,
    status: 'Active',
    websiteUrl: 'https://strata.charisol.io/demo',
    figmaUrl: 'https://figma.com/@strata-demo',
    updated: '2 weeks ago',
    brand: {
      primaryColor: sys.color,
      secondaryColor: '#1A1A24',
      accentColor: '#3B82F6',
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      toneKeywords: ['Clean', 'Minimalist', 'Explore'],
      voice: 'Conversational, reliable, clear.'
    },
    tokens: {
      Color: [
        { name: 'color.primary', value: sys.color, type: 'color' },
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
    },
    components: [
      { id: '1', name: 'PrimaryButton', category: 'Actions & Buttons', template: 'button', description: 'Primary brand action button', tokens: { bg: 'color.primary', textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '2', name: 'InputField', category: 'Form Inputs', template: 'input', description: 'Standard input field component', tokens: { textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '3', name: 'BrandBadge', category: 'Feedback & Status', template: 'badge', description: 'Decorative component badge', tokens: { bg: 'color.accent', textColor: 'color.text.primary', padding: 'spacing.1', borderRadius: 'border.radius.full' } },
      { id: '4', name: 'InformationCard', category: 'Display & Data', template: 'card', description: 'Content display card block', tokens: { bg: 'color.surface', textColor: 'color.text.primary', padding: 'spacing.4', borderRadius: 'border.radius.lg' } }
    ]
  };
};

const renderTokenPreview = (token) => {
  const { type, value } = token;
  if (!value) return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>-</span>;
  let cleanValue = String(value).trim();

  switch (type) {
    case 'color':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '4px',
            background: cleanValue, border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexShrink: 0
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cleanValue}</span>
        </div>
      );
    case 'fontSize':
      let sizeVal = cleanValue;
      if (/^\d+$/.test(sizeVal)) sizeVal += 'px';
      return <span style={{ fontSize: sizeVal, color: 'var(--text-primary)' }}>Aa</span>;
    case 'fontFamily':
      return <span style={{ fontFamily: cleanValue, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Aa Bb</span>;
    case 'spacing':
      let spacingVal = cleanValue;
      if (/^\d+$/.test(spacingVal)) spacingVal += 'px';
      return <div style={{ height: '8px', width: spacingVal, maxWidth: '80px', minWidth: '4px', background: 'var(--accent)', borderRadius: '2px', opacity: 0.8 }} />;
    case 'borderRadius':
      let radiusVal = cleanValue;
      if (/^\d+$/.test(radiusVal)) radiusVal += 'px';
      return <div style={{ width: '28px', height: '28px', border: '2px solid var(--accent)', borderRadius: radiusVal, background: 'var(--accent-glow)' }} />;
    case 'shadow':
      return <div style={{ width: '28px', height: '28px', background: 'var(--bg-secondary)', borderRadius: '4px', boxShadow: cleanValue, border: '1px solid var(--border)' }} />;
    case 'duration':
    case 'easing':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div 
            className="motion-preview-box"
            style={{
              width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent)',
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
            onMouseEnter={e => {
              const animDuration = type === 'duration' ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(10px)';
            }}
            onMouseLeave={e => {
              const animDuration = type === 'duration' ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Hover</span>
        </div>
      );
    default:
      return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{value}</span>;
  }
};

const SharedProject = () => {
  const { id } = useParams();
  const { projects } = useProjects();
  const [copiedToken, setCopiedToken] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('dark');
  const [tokenSearch, setTokenSearch] = useState('');
  const [activeExportTab, setActiveExportTab] = useState('css');

  // Find project in context, or fallback to mock project
  const project = projects.find(p => String(p.id) === String(id)) || getMockProject(id);
  const brand = project.brand || {};
  const tokensMap = project.tokens || {};

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const resolveTokenValue = (tokenName) => {
    if (!tokenName) return '';
    for (const cat in tokensMap) {
      const found = tokensMap[cat]?.find(t => t.name === tokenName);
      if (found) return found.value;
    }
    return '';
  };

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
      return <button style={style}>Click Me</button>;
    }
    if (comp.template === 'badge') {
      return <span style={{ ...style, display: 'inline-block', textTransform: 'uppercase', fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>New</span>;
    }
    if (comp.template === 'card') {
      return (
        <div style={{
          background: resolveTokenValue(comp.tokens?.bg) || (previewTheme === 'light' ? '#ffffff' : '#13131a'),
          color: resolveTokenValue(comp.tokens?.textColor) || (previewTheme === 'light' ? '#171717' : '#ffffff'),
          padding: resolveTokenValue(comp.tokens?.padding) || '1rem',
          borderRadius: resolveTokenValue(comp.tokens?.borderRadius) || '8px',
          fontFamily: resolveTokenValue(comp.tokens?.fontFamily),
          fontSize: resolveTokenValue(comp.tokens?.fontSize),
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'left',
          width: '100%',
          maxWidth: '220px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Card Title</div>
          <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>Visual spec card.</div>
        </div>
      );
    }
    if (comp.template === 'input') {
      return (
        <input
          type="text"
          placeholder="Type here..."
          style={{
            background: previewTheme === 'light' ? '#f4f4f5' : '#1a1a24',
            color: resolveTokenValue(comp.tokens?.textColor) || 'var(--text-primary)',
            padding: resolveTokenValue(comp.tokens?.padding) || '0.5rem 1rem',
            borderRadius: resolveTokenValue(comp.tokens?.borderRadius) || '6px',
            fontFamily: resolveTokenValue(comp.tokens?.fontFamily),
            fontSize: resolveTokenValue(comp.tokens?.fontSize),
            border: `1px solid ${resolveTokenValue(comp.tokens?.bg) || 'var(--border)'}`,
            outline: 'none',
            width: '100%',
            maxWidth: '180px',
          }}
          readOnly
        />
      );
    }
    return null;
  };

  // Compile Export Formats
  const getCSSVariables = () => {
    let css = `/* Auto-generated by Strata */\n:root {\n`;
    for (const cat in tokensMap) {
      tokensMap[cat].forEach(t => {
        const varName = `--${t.name.replace(/\./g, '-')}`;
        css += `  ${varName}: ${t.value};\n`;
      });
    }
    css += `}`;
    return css;
  };

  const getTailwindTheme = () => {
    const config = { theme: { extend: {} } };
    for (const cat in tokensMap) {
      tokensMap[cat].forEach(t => {
        const parts = t.name.split('.');
        let current = config.theme.extend;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) current[part] = {};
          current = current[part];
        }
        current[parts[parts.length - 1]] = t.value;
      });
    }
    return JSON.stringify(config, null, 2);
  };

  const getDTCGJson = () => {
    const json = { $schema: 'https://tr.designtokens.org/format/' };
    for (const cat in tokensMap) {
      tokensMap[cat].forEach(t => {
        const parts = t.name.split('.');
        let current = json;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) current[part] = {};
          current = current[part];
        }
        current[parts[parts.length - 1]] = { $value: t.value, $type: t.type };
      });
    }
    return JSON.stringify(json, null, 2);
  };

  const getActiveExportText = () => {
    if (activeExportTab === 'tailwind') return getTailwindTheme();
    if (activeExportTab === 'json') return getDTCGJson();
    return getCSSVariables();
  };

  // Build filtered tokens list for display
  const allTokens = [];
  for (const cat in tokensMap) {
    tokensMap[cat].forEach(t => {
      allTokens.push({ ...t, category: cat });
    });
  }
  const filteredTokens = allTokens.filter(t => 
    t.name.toLowerCase().includes(tokenSearch.toLowerCase()) || 
    t.value.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    t.type.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      
      {/* ── Breadcrumb / Header ── */}
      <div style={{ padding: '6rem 0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/explore" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
            ← Back to Explore
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${project.color}, var(--accent))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontSize: '1.75rem', fontWeight: 900,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)', textTransform: 'uppercase'
            }}>
              {project.name ? project.name.charAt(0) : 'S'}
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{project.name}</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>{project.description}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => handleCopy(window.location.href, 'Link')} 
            className="btn btn-secondary" 
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            {copiedToken === 'Link' ? 'Copied!' : 'Share Project'}
          </button>
        </div>
      </div>

      {/* ── Brand Specs Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem', marginTop: '1.5rem' }}>
        
        {/* Left main area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section 1: Color ribbon & Typography specs */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem'
          }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Brand Color Swatches</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                {[
                  { label: 'Primary', value: brand.primaryColor || '#FC0694' },
                  { label: 'Secondary', value: brand.secondaryColor || '#1A1A24' },
                  { label: 'Accent', value: brand.accentColor || '#3B82F6' }
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: c.value, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{c.label}</div>
                      <div 
                        onClick={() => handleCopy(c.value, c.label)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Click to copy hex"
                      >
                        {c.value.toUpperCase()}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{copiedToken === c.label ? '✓' : '📋'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Heading Typography</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Family: {brand.headingFont || 'Outfit'}</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: brand.headingFont || 'Outfit', color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  The quick brown fox jumps.
                </span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Body Typography</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Family: {brand.bodyFont || 'Inter'}</span>
                <span style={{ fontSize: '0.9rem', lineHeight: 1.6, fontFamily: brand.bodyFont || 'Inter', color: 'var(--text-secondary)', display: 'block' }}>
                  Strata compiles modular, structured design variables directly from brand assets. Every UI token maintains dynamic reference parameters back to global design layers.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Component Canvas Preview */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Living Component Preview</h3>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Interact with live, token-mapped UI components below.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '100px', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setPreviewTheme('light')} 
                  style={{
                    background: previewTheme === 'light' ? 'var(--accent)' : 'none',
                    border: 'none', padding: '0.3rem 0.75rem', borderRadius: '100px',
                    color: previewTheme === 'light' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >Light</button>
                <button 
                  onClick={() => setPreviewTheme('dark')} 
                  style={{
                    background: previewTheme === 'dark' ? 'var(--accent)' : 'none',
                    border: 'none', padding: '0.3rem 0.75rem', borderRadius: '100px',
                    color: previewTheme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >Dark</button>
              </div>
            </div>

            <div style={{
              background: previewTheme === 'light' ? '#F4F4F5' : '#09090C',
              border: '1px solid var(--border)', borderRadius: '14px', padding: '2.5rem',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem', alignItems: 'center', justifyContentItems: 'center',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {project.components && project.components.length > 0 ? (
                project.components.map(comp => (
                  <div key={comp.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{comp.name}</div>
                    {renderLivePreview(comp)}
                  </div>
                ))
              ) : (
                <span style={{ gridColumn: '1 / -1', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No components defined for this design system.</span>
              )}
            </div>
          </div>

          {/* Section 3: Searchable Token Dictionary */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Token Dictionary</h3>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Full spec index of atomic variables.</p>
              </div>
              <input 
                type="text" 
                placeholder="Search variables..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '0.4rem 1rem', borderRadius: '100px',
                  fontSize: '0.85rem', width: '200px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: '1rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                {['Name', 'Value', 'Type', 'Visual Preview'].map(h => (
                  <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {filteredTokens.length > 0 ? (
                filteredTokens.map((t, idx) => (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: '1rem', alignItems: 'center',
                    padding: '0.6rem 0.875rem', borderBottom: '1px solid rgba(128,128,128,0.08)'
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.value}</span>
                    <span style={{
                      display: 'inline-flex', alignSelf: 'center', justifySelf: 'start',
                      fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                      background: `${TYPE_COLORS[t.type]}15`, color: TYPE_COLORS[t.type],
                      border: `1px solid ${TYPE_COLORS[t.type]}30`, fontWeight: 500, letterSpacing: '0.03em',
                    }}>{t.type}</span>
                    <div>{renderTokenPreview(t)}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No tokens matching search criteria.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Developer Handoff Card */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Developer Handoff</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>CDN Public Link</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.6rem', position: 'relative' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://strata.io/api/v1/projects/${project.id}/css`} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                  />
                  <button 
                    onClick={() => handleCopy(`https://strata.io/api/v1/projects/${project.id}/css`, 'CDN')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--accent)' }}
                  >
                    {copiedToken === 'CDN' ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>CLI Sync Command</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={`npx strata-cli sync --id ${project.id}`} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                  />
                  <button 
                    onClick={() => handleCopy(`npx strata-cli sync --id ${project.id}`, 'CLI')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: 'var(--accent)' }}
                  >
                    {copiedToken === 'CLI' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>

            {/* Code sandbox tabs */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '8px' }}>
                {['css', 'tailwind', 'json'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveExportTab(tab)}
                    style={{
                      flex: 1, background: activeExportTab === tab ? 'var(--bg-secondary)' : 'none',
                      border: 'none', borderRadius: '6px', padding: '0.35rem',
                      color: activeExportTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '0.85rem', margin: 0,
                  fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                  maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {getActiveExportText()}
                </pre>
                <button 
                  onClick={() => handleCopy(getActiveExportText(), 'Snippet')}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(9, 9, 12, 0.75)', border: '1px solid var(--border)',
                    borderRadius: '4px', padding: '0.25rem 0.5rem',
                    color: 'var(--text-secondary)', fontSize: '0.65rem', cursor: 'pointer'
                  }}
                >
                  {copiedToken === 'Snippet' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>

          {/* Immersive Production Showcase */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Consumer Deployments</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Live projects connected to this design system's variables:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
              {[
                { name: 'Sam Portfolio', url: 'https://samportfolio.dev', status: 'Connected', lastSync: '10m ago' },
                { name: 'Beacon CRM', url: 'https://beaconcrm.io', status: 'Connected', lastSync: '1h ago' },
                { name: 'Strata Landing Page', url: 'https://strata.io', status: 'Connected', lastSync: '12h ago' }
              ].map(app => (
                <div key={app.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{app.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{app.url}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 600 }}>
                      {app.status}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>Sync {app.lastSync}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SharedProject;
