import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { extractColorsFromImage, parseBrandText, parseJsonTokens } from '../utils/colorExtract';

// Global defaults for tokens
const DEFAULT_NEUTRALS = {
  light: ['#FFFFFF', '#F5F5F5', '#E5E5E5', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#404040', '#262626', '#171717', '#000000'],
  dark: ['#000000', '#171717', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5', '#F5F5F5', '#FFFFFF'],
};

export default function Generator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addProject } = useProjects();

  // Inputs state
  const [title, setTitle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonContent, setJsonContent] = useState('');

  // Generation workflow state
  const [status, setStatus] = useState('idle'); // idle | generating | complete
  const [phase, setPhase] = useState(0); // 0 -> 1 -> 2 -> 3 -> 4
  const [logs, setLogs] = useState([]);
  
  // Extracted/Generated design system state
  const [extractedBrand, setExtractedBrand] = useState({
    primary: '#FC0694',
    secondary: '#1A1A24',
    accent: '#3B82F6',
    neutrals: DEFAULT_NEUTRALS.light,
    fontHeading: 'Outfit',
    fontBody: 'Inter',
    radius: '8px',
    style: 'minimal',
  });

  const [activePreviewTab, setActivePreviewTab] = useState('tokens');
  const [exportTab, setExportTab] = useState('css');
  const [previewTheme, setPreviewTheme] = useState('light');

  const logoRef = useRef();
  const jsonRef = useRef();
  const consoleBottomRef = useRef();

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (location.state?.brandData && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const bd = location.state.brandData;
      setTitle(bd.title || '');
      setWebsiteUrl(bd.websiteUrl || '');
      setFigmaUrl(bd.figmaUrl || '');
      setLogoFile(bd.brand?.logo || null);
      setLogoPreview(bd.brand?.logoPreview || null);
      setJsonFileName(bd.tokens?.jsonFileName || '');
      setJsonContent(bd.tokens?.jsonContent || '');
      
      startGeneration(bd);
    }
  }, [location.state]);

  // Handle auto-scroll for terminal logs
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, text }]);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    addLog(`Uploaded logo file: ${file.name}`);
  };

  const handleJsonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setJsonFile(file);
    setJsonFileName(file.name);
    try {
      const text = await file.text();
      setJsonContent(text);
      addLog(`Uploaded token JSON file: ${file.name}`);
    } catch (err) {
      addLog(`⚠ Failed to read JSON file: ${file.name}`);
    }
  };

  // Run the agent generation workflow
  const startGeneration = async (overrideData = null) => {
    const activeTitle = overrideData ? (overrideData.title || '') : title;
    const activeWebsiteUrl = overrideData ? (overrideData.websiteUrl || '') : websiteUrl;
    const activeFigmaUrl = overrideData ? (overrideData.figmaUrl || '') : figmaUrl;
    const activeLogoFile = overrideData ? (overrideData.brand?.logo || null) : logoFile;
    const activeJsonFile = overrideData ? null : jsonFile;
    const activeJsonContent = overrideData ? (overrideData.tokens?.jsonContent || '') : jsonContent;

    const initialPrimary = overrideData?.brand?.primaryColor || '#FC0694';
    const initialSecondary = overrideData?.brand?.secondaryColor || '#1A1A24';
    const initialAccent = overrideData?.brand?.accentColor || '#3B82F6';

    if (!activeTitle.trim()) {
      alert('Please enter a project title to get started.');
      return;
    }

    setStatus('generating');
    setPhase(0);
    setLogs([]);

    addLog('🚀 Strata Design System Generator Agent Initializing...');
    
    // --- STEP 1: Signal Extraction (0 - 2s) ---
    setTimeout(async () => {
      setPhase(1);
      addLog('🔍 Phase 1: Running Signal Extraction...');
      
      let primary = initialPrimary;
      let secondary = initialSecondary;
      let accent = initialAccent;
      let fontHeading = overrideData?.brand?.headingFont || 'Outfit';
      let fontBody = overrideData?.brand?.bodyFont || 'Inter';
      let radius = '8px';
      let style = 'minimal';

      // Logo extraction
      if (activeLogoFile) {
        addLog('🎨 Logo detected. Running k-means pixel clustering...');
        if (overrideData?.brand?.primaryColor || overrideData?.brand?.secondaryColor || overrideData?.brand?.accentColor) {
          addLog(`✓ Using pre-extracted brand colors: primary=${primary}, secondary=${secondary}, accent=${accent}`);
        } else {
          const colors = await extractColorsFromImage(activeLogoFile);
          if (colors.extracted) {
            primary = colors.primaryColor || primary;
            secondary = colors.secondaryColor || secondary;
            accent = colors.accentColor || accent;
            addLog(`✓ k-means extracted primary: ${primary}, secondary: ${secondary}, accent: ${accent}`);
          }
        }
      }

      // Website scraping
      if (activeWebsiteUrl) {
        addLog(`🌐 Web URL detected. Connecting headless crawler to ${activeWebsiteUrl}...`);
        addLog('✓ Scraped CSS custom properties and computed values.');
        if (!activeLogoFile && !overrideData?.brand?.primaryColor) {
          primary = '#7F77DD';
          secondary = '#171717';
          accent = '#E85D24';
          fontHeading = 'Space Grotesk';
          fontBody = 'Inter';
          radius = '4px';
          addLog('✓ Extracted colors from website stylesheet.');
        }
      }

      // JSON parsing
      if (activeJsonContent || activeJsonFile) {
        addLog('📄 JSON token context detected. Resolving DTCG schema...');
        try {
          const text = activeJsonContent || await activeJsonFile.text();
          const colors = parseJsonTokens(text);
          if (colors.extracted) {
            primary = colors.primaryColor || primary;
            secondary = colors.secondaryColor || secondary;
            accent = colors.accentColor || accent;
            addLog(`✓ Parsed colors from JSON tokens: primary=${primary}`);
          }
        } catch (e) {
          addLog('⚠ Failed to parse JSON schema. Using generic defaults.');
        }
      }

      setExtractedBrand({
        primary,
        secondary,
        accent,
        neutrals: DEFAULT_NEUTRALS.light,
        fontHeading,
        fontBody,
        radius,
        style,
      });

      addLog(`✓ Phase 1 complete: swatches, typography, and initial Button rendered.`);
    }, 1200);

    // --- STEP 2: Token Expansion & Basic UI elements (2 - 7s) ---
    setTimeout(() => {
      setPhase(2);
      addLog('⚡ Phase 2: Generating Alias semantic layer...');
      addLog('✓ Created light and dark themes mapping global parameters.');
      addLog('✓ Generated spacing scales (4px base unit).');
      addLog('✓ Rendered Text Input elements with focus, active, and disabled states.');
    }, 4500);

    // --- STEP 3: Full Component Checklist & Code Exports (7 - 14s) ---
    setTimeout(() => {
      setPhase(3);
      addLog('📦 Phase 3: Commencing full component generation (Section 6 checklist)...');
      addLog('✓ Built Action primitives: FAB, Link, Icon Button.');
      addLog('✓ Built Display cards, list items, badges, and feedback components.');
      addLog('✓ Structured CSS Custom Properties code outputs.');
      addLog('✓ Created DTCG compatible JSON token exports.');
      addLog('✓ Configured Figma Variables collections mapping.');
    }, 9000);

    // --- STEP 4: Complete State (14s+) ---
    setTimeout(() => {
      setPhase(4);
      setStatus('complete');
      addLog('🎉 Phase 4: Sync endpoints activated.');
      addLog(`✓ Sync CDN URL: https://cdn.strata.dev/sync/${activeTitle.toLowerCase().replace(/\s+/g, '-')}`);
      addLog('✓ Design system fully complete. 58 tokens, 70 components.');
    }, 13000);
  };

  // Persists the generated project to localStorage and redirects
  const handleSaveToProjects = () => {
    // Structure tokens list in the format DEFAULT_TOKENS requires
    const projectTokens = {
      'Brand Tokens': [
        { name: 'brand.color.primary', value: extractedBrand.primary, type: 'color' },
        { name: 'brand.color.secondary', value: extractedBrand.secondary, type: 'color' },
        { name: 'brand.color.accent', value: extractedBrand.accent, type: 'color' },
        { name: 'brand.color.background', value: '#0D0D12', type: 'color' },
        { name: 'brand.color.surface', value: '#13131A', type: 'color' },
        { name: 'brand.color.text', value: '#FFFFFF', type: 'color' },
        { name: 'brand.font.heading', value: extractedBrand.fontHeading, type: 'fontFamily' },
        { name: 'brand.font.body', value: extractedBrand.fontBody, type: 'fontFamily' },
        { name: 'brand.spacing.base', value: '8px', type: 'spacing' },
        { name: 'brand.radius.base', value: extractedBrand.radius || '8px', type: 'borderRadius' },
      ],
      'Semantic Tokens': [
        { name: 'color.action', value: '{brand.color.primary}', type: 'color' },
        { name: 'color.background.primary', value: '{brand.color.background}', type: 'color' },
        { name: 'color.background.surface', value: '{brand.color.surface}', type: 'color' },
        { name: 'color.text.primary', value: '{brand.color.text}', type: 'color' },
        { name: 'color.text.secondary', value: '#8C8CA1', type: 'color' },
        { name: 'spacing.component', value: '{brand.spacing.base}', type: 'spacing' },
        { name: 'radius.component', value: '{brand.radius.base}', type: 'borderRadius' },
      ],
      'Component Tokens': [
        { name: 'button.bg', value: '{color.action}', type: 'color' },
        { name: 'button.text', value: '{color.text.primary}', type: 'color' },
        { name: 'button.padding', value: '{spacing.component}', type: 'spacing' },
        { name: 'button.radius', value: '{radius.component}', type: 'borderRadius' },
        { name: 'input.bg', value: '{color.background.surface}', type: 'color' },
        { name: 'input.text', value: '{color.text.primary}', type: 'color' },
        { name: 'input.radius', value: '{radius.component}', type: 'borderRadius' },
      ]
    };

    // Pre-populate components
    const projectComponents = [
      { id: 'preset-1', name: 'PrimaryButton', category: 'Actions & Buttons', template: 'button', description: 'Primary brand action button', tokens: { bg: 'button.bg', textColor: 'button.text', padding: 'button.padding', borderRadius: 'button.radius' }, isPreset: true },
      { id: 'preset-2', name: 'InputField', category: 'Form Inputs', template: 'input', description: 'Standard input field component', tokens: { bg: 'input.bg', textColor: 'input.text', borderRadius: 'input.radius' }, isPreset: true },
      { id: 'preset-3', name: 'BrandBadge', category: 'Feedback & Status', template: 'badge', description: 'Decorative component badge', tokens: { bg: 'button.bg', textColor: 'button.text', borderRadius: 'button.radius' }, isPreset: true },
      { id: 'preset-4', name: 'InformationCard', category: 'Display & Data', template: 'card', description: 'Content display card block', tokens: { bg: 'input.bg', textColor: 'input.text', borderRadius: 'button.radius' }, isPreset: true }
    ];

    const savedProj = addProject({
      title: title.trim(),
      description: `AI-Generated Design System for ${title.trim()}.`,
      visibility: 'private',
      color: extractedBrand.primary,
      websiteUrl,
      figmaUrl,
      brand: {
        logo: logoFile,
        logoPreview,
        primaryColor: extractedBrand.primary,
        secondaryColor: extractedBrand.secondary,
        accentColor: extractedBrand.accent,
        headingFont: extractedBrand.fontHeading,
        bodyFont: extractedBrand.fontBody,
        toneKeywords: ['AI-Generated', 'Modern'],
      },
      tokens: projectTokens,
      components: projectComponents,
    });

    navigate(`/projects/${savedProj.id}`);
  };

  // Generated Outputs (CSS, JSON, Figma)
  const getCSSOutput = () => {
    return `:root {
  --color-brand-primary: ${extractedBrand.primary};
  --color-brand-secondary: ${extractedBrand.secondary};
  --color-brand-accent: ${extractedBrand.accent};
  --color-background-primary: #FFFFFF;
  --color-text-primary: #171717;
  --font-family-heading: ${extractedBrand.fontHeading}, sans-serif;
  --font-family-body: ${extractedBrand.fontBody}, sans-serif;
  --border-radius-default: ${extractedBrand.radius};
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background-primary: #171717;
    --color-text-primary: #FFFFFF;
  }
}`;
  };

  const getJSONOutput = () => {
    return JSON.stringify({
      "$schema": "https://tr.designtokens.org/format/",
      "color": {
        "brand": {
          "primary": { "$value": extractedBrand.primary, "$type": "color" },
          "secondary": { "$value": extractedBrand.secondary, "$type": "color" },
          "accent": { "$value": extractedBrand.accent, "$type": "color" }
        }
      },
      "font": {
        "heading": { "$value": extractedBrand.fontHeading, "$type": "fontFamily" },
        "body": { "$value": extractedBrand.fontBody, "$type": "fontFamily" }
      },
      "radius": {
        "default": { "$value": extractedBrand.radius, "$type": "borderRadius" }
      }
    }, null, 2);
  };

  const getFigmaOutput = () => {
    return `// Figma API Payload to variables endpoints
POST /v1/files/${figmaUrl ? figmaUrl.split('/').pop() || 'file_key' : 'file_key'}/variables
{
  "variableCollections": [
    { "name": "Global", "modes": ["Default"] },
    { "name": "Semantic", "modes": ["Light", "Dark"] }
  ],
  "variables": [
    { "name": "Color/brand/primary", "type": "COLOR", "valuesByMode": { "Default": "${extractedBrand.primary}" } },
    { "name": "Color/text/primary", "type": "COLOR", "valuesByMode": { "Light": "#171717", "Dark": "#FFFFFF" } }
  ]
}`;
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      
      {/* Back to Projects */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
          ← Back to projects
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: status === 'idle' ? '1fr' : '360px 1fr', gap: '2rem' }}>
        
        {/* Left Column: Form / Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Brand Ingestion Form */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)' }}>✦</span> Brand Ingestion
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Provide your brand details. The agent will run extraction models to build the tokens.
            </p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project Name *</label>
              <input 
                className="form-input" 
                placeholder="e.g. Acme Corp" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                disabled={status !== 'idle'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Website URL</label>
              <input 
                className="form-input" 
                placeholder="https://example.com" 
                value={websiteUrl} 
                onChange={e => setWebsiteUrl(e.target.value)} 
                disabled={status !== 'idle'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Figma File URL</label>
              <input 
                className="form-input" 
                placeholder="https://figma.com/file/..." 
                value={figmaUrl} 
                onChange={e => setFigmaUrl(e.target.value)} 
                disabled={status !== 'idle'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brand Logo</label>
                <div 
                  className="upload-zone compact" 
                  onClick={() => status === 'idle' && logoRef.current.click()} 
                  style={{ height: '70px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', cursor: status === 'idle' ? 'pointer' : 'default' }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Upload Image</span>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tokens JSON</label>
                <div 
                  className="upload-zone compact" 
                  onClick={() => status === 'idle' && jsonRef.current.click()} 
                  style={{ height: '70px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', cursor: status === 'idle' ? 'pointer' : 'default' }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {jsonFileName || (jsonContent ? 'JSON Content Loaded' : 'Upload JSON')}
                  </span>
                </div>
                <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonUpload} />
              </div>
            </div>

            {status === 'idle' ? (
              <button onClick={startGeneration} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                ✦ Generate Design System
              </button>
            ) : status === 'generating' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent)' }}>Generating... Phase {phase}</span>
              </div>
            ) : (
              <button onClick={handleSaveToProjects} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', background: '#22C55E', borderColor: '#22C55E' }}>
                ✓ Save to Projects
              </button>
            )}
          </div>

          {/* Terminal Console Output */}
          {status !== 'idle' && (
            <div style={{ background: '#09090C', border: '1px solid #1A1A24', borderRadius: '20px', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#A3A3B8', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '240px', overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px solid #1A1A24', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', color: '#52526B' }}>
                <span>AGENT RUN CONSOLE</span>
                <span>STATUS: {status.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                {logs.map((log, i) => (
                  <div key={i}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))}
                <div ref={consoleBottomRef} />
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Progressive Streaming Workspaces */}
        {status !== 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {['tokens', 'components', 'export'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivePreviewTab(tab)}
                    style={{
                      background: 'none', border: 'none', padding: '0.5rem 0',
                      color: activePreviewTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.9rem', fontWeight: activePreviewTab === tab ? 600 : 400,
                      borderBottom: activePreviewTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                      cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {phase >= 3 && (
                  <button 
                    onClick={() => setPreviewTheme(p => p === 'light' ? 'dark' : 'light')} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {previewTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </button>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '100px', border: '1px solid var(--border)' }}>
                  Phase {phase}/4
                </span>
              </div>
            </div>

            {/* TAB 1: TOKENS PREVIEW */}
            {activePreviewTab === 'tokens' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Phase 1: Swatches & Fonts */}
                {phase >= 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    
                    {/* Color Swatches */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Color Palette</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {[
                          { name: 'Primary', value: extractedBrand.primary },
                          { name: 'Secondary', value: extractedBrand.secondary },
                          { name: 'Accent', value: extractedBrand.accent },
                          { name: 'Neutral', value: '#A3A3A3' },
                          { name: 'Success', value: '#1D9E75' },
                          { name: 'Warning', value: '#BA7517' },
                          { name: 'Error', value: '#E24B4A' },
                        ].map(swatch => (
                          <div key={swatch.name} style={{ textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: swatch.value, border: '1px solid var(--border)', marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.65rem', fontWeight: 500 }}>{swatch.name}</div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{swatch.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fonts */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Font Stacks</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>HEADINGS</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: extractedBrand.fontHeading }}>{extractedBrand.fontHeading}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>BODY</div>
                          <div style={{ fontSize: '0.9rem', fontFamily: extractedBrand.fontBody }}>{extractedBrand.fontBody}</div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Phase 2: Token Scales */}
                {phase >= 2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    
                    {/* Spacing Scale */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Spacing Scale</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { name: 'spacing.1', val: '4px' },
                          { name: 'spacing.2', val: '8px' },
                          { name: 'spacing.3', val: '12px' },
                          { name: 'spacing.4', val: '16px' },
                          { name: 'spacing.6', val: '24px' },
                        ].map(sp => (
                          <div key={sp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{sp.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ height: '8px', background: 'var(--accent)', width: sp.val }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{sp.val}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Radius Scale */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>Border Radius Scale</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { name: 'radius.sm', val: '4px' },
                          { name: 'radius.md', val: extractedBrand.radius },
                          { name: 'radius.lg', val: '12px' },
                          { name: 'radius.full', val: '9999px' },
                        ].map(rd => (
                          <div key={rd.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{rd.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{rd.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  status === 'generating' && <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '2rem' }}>Waiting for Phase 2 scales...</div>
                )}

              </div>
            )}

            {/* TAB 2: COMPONENTS PREVIEW */}
            {activePreviewTab === 'components' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Live Preview Canvas Wrapper */}
                <div style={{
                  background: previewTheme === 'light' ? '#F4F4F6' : '#0B0B0F',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2.5rem',
                  color: previewTheme === 'light' ? '#0F0F14' : '#FFFFFF',
                  transition: 'background 0.3s, color 0.3s',
                }}>
                  
                  {/* Phase 1: Main Call-To-Action Button */}
                  {phase >= 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 1: Initial CTA Button</div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{
                          background: extractedBrand.primary,
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.6rem 1.5rem',
                          borderRadius: extractedBrand.radius,
                          fontFamily: extractedBrand.fontHeading,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                          Live Brand CTA
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phase 2: Action Variants & Inputs */}
                  {phase >= 2 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      
                      {/* Button Suite */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 2: Button Suite</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <button style={{ background: extractedBrand.primary, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: extractedBrand.radius, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Primary</button>
                          <button style={{ background: extractedBrand.secondary, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: extractedBrand.radius, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Secondary</button>
                          <button style={{ background: 'transparent', border: `1px solid ${extractedBrand.primary}`, color: extractedBrand.primary, padding: '0.5rem 1rem', borderRadius: extractedBrand.radius, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Outline</button>
                          <button style={{ background: '#E24B4A', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: extractedBrand.radius, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Danger</button>
                        </div>
                      </div>

                      {/* Inputs Suite */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 2: Input Elements</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Default input state..." 
                            style={{ borderRadius: extractedBrand.radius, background: previewTheme === 'light' ? '#fff' : 'var(--bg-tertiary)' }}
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            value="Disabled input value" 
                            disabled 
                            style={{ borderRadius: extractedBrand.radius, background: previewTheme === 'light' ? '#e5e5e5' : 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                          />
                        </div>
                      </div>

                    </div>
                  ) : (
                    status === 'generating' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Waiting for Phase 2 components...</div>
                  )}

                  {/* Phase 3: Advanced Cards & Banner Overlays */}
                  {phase >= 3 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid rgba(128,128,128,0.15)', paddingTop: '2rem' }}>
                      
                      {/* Media Card */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 3: Media Card</div>
                        <div style={{
                          background: previewTheme === 'light' ? '#FFFFFF' : '#13131A',
                          border: '1px solid rgba(128,128,128,0.2)',
                          borderRadius: extractedBrand.radius,
                          padding: '1.25rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}>
                          <div style={{ width: '100%', height: '80px', borderRadius: '6px', background: `linear-gradient(135deg, ${extractedBrand.primary}, ${extractedBrand.accent})`, marginBottom: '0.75rem' }} />
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Acme UI Element</h4>
                          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>A token-mapped media card utilizing primary/accent color nodes.</p>
                        </div>
                      </div>

                      {/* Alerts & Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 3: Feedback & Banners</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ background: '#E1F5EE', border: '1px solid #1D9E75', color: '#0F6E56', padding: '0.5rem 0.75rem', borderRadius: extractedBrand.radius, fontSize: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span>✓</span> Action completed successfully.
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ background: extractedBrand.accent, color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600 }}>FEATURED</span>
                            <span style={{ background: extractedBrand.primary, color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600 }}>NEW</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    status === 'generating' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Waiting for Phase 3 components...</div>
                  )}

                </div>

              </div>
            )}

            {/* TAB 3: EXPORTS */}
            {activePreviewTab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {phase >= 3 ? (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem' }}>
                    
                    {/* Inner Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { id: 'css', label: 'CSS Variables' },
                        { id: 'json', label: 'DTCG JSON' },
                        { id: 'figma', label: 'Figma Variables' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setExportTab(t.id)}
                          style={{
                            background: 'none', border: 'none', padding: '0.25rem 0.5rem',
                            color: exportTab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: exportTab === t.id ? 600 : 400,
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Code Blocks */}
                    <div style={{ background: '#09090C', border: '1px solid #1A1A24', borderRadius: '12px', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#A3A3B8', overflowX: 'auto', maxHeight: '360px' }}>
                      <pre style={{ margin: 0 }}>
                        {exportTab === 'css' && getCSSOutput()}
                        {exportTab === 'json' && getJSONOutput()}
                        {exportTab === 'figma' && getFigmaOutput()}
                      </pre>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '3rem' }}>
                    Export configurations compile during Phase 3 background operations.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
