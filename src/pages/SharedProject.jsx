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
  
  const weeklyDownloads = {
    '1': 820,
    '2': 450,
    '3': 2840,
    '4': 150,
    '5': 95,
    '6': 1150,
    '7': 310
  }[sys.id] || 120;

  const totalDownloads = {
    '1': 12400,
    '2': 3100,
    '3': 52300,
    '4': 900,
    '5': 1200,
    '6': 18900,
    '7': 2800
  }[sys.id] || 1500;

  const weeklyUsage = {
    '1': 6,
    '2': 2,
    '3': 34,
    '4': 1,
    '5': 3,
    '6': 14,
    '7': 5
  }[sys.id] || 4;

  const tokens120 = {
    Color: [
      { name: 'color.primary', value: sys.color, type: 'color', tier: 'brand' },
      { name: 'color.secondary', value: '#1E1E2F', type: 'color', tier: 'brand' },
      { name: 'color.accent', value: '#3B82F6', type: 'color', tier: 'brand' },
      { name: 'color.background', value: '#0D0D12', type: 'color', tier: 'semantic' },
      { name: 'color.surface', value: '#13131A', type: 'color', tier: 'semantic' },
      { name: 'color.text.primary', value: '#FFFFFF', type: 'color', tier: 'semantic' },
      { name: 'color.text.secondary', value: '#8C8CA1', type: 'color', tier: 'semantic' },
      { name: 'color.success', value: '#10B981', type: 'color', tier: 'semantic' },
    ],
    Typography: [
      { name: 'font.heading', value: 'Outfit', type: 'fontFamily', tier: 'brand' },
      { name: 'font.body', value: 'Inter', type: 'fontFamily', tier: 'brand' },
      { name: 'font.size.xs', value: '0.75rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.sm', value: '0.875rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.base', value: '1rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.lg', value: '1.25rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.xl', value: '1.5rem', type: 'fontSize', tier: 'semantic' },
    ],
    Spacing: [
      { name: 'spacing.1', value: '4px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.2', value: '8px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.3', value: '12px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.4', value: '16px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.6', value: '24px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.8', value: '32px', type: 'spacing', tier: 'brand' },
    ],
    Border: [
      { name: 'border.radius.sm', value: '4px', type: 'borderRadius', tier: 'brand' },
      { name: 'border.radius.md', value: '8px', type: 'borderRadius', tier: 'brand' },
      { name: 'border.radius.lg', value: '16px', type: 'borderRadius', tier: 'brand' },
      { name: 'border.radius.full', value: '9999px', type: 'borderRadius', tier: 'brand' },
    ],
    Shadow: [
      { name: 'shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)', type: 'shadow', tier: 'semantic' },
      { name: 'shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)', type: 'shadow', tier: 'semantic' },
      { name: 'shadow.lg', value: '0 16px 48px rgba(0,0,0,0.5)', type: 'shadow', tier: 'semantic' },
    ],
    Motion: [
      { name: 'duration.fast', value: '150ms', type: 'duration', tier: 'semantic' },
      { name: 'duration.base', value: '250ms', type: 'duration', tier: 'semantic' },
      { name: 'duration.slow', value: '500ms', type: 'duration', tier: 'semantic' },
      { name: 'easing.default', value: 'cubic-bezier(0.4,0,0.2,1)', type: 'easing', tier: 'semantic' },
    ],
    Component: [
      { name: 'button.primary.bg', value: 'color.primary', type: 'color', tier: 'component' },
      { name: 'button.primary.text', value: 'color.text.primary', type: 'color', tier: 'component' },
      { name: 'button.primary.radius', value: 'border.radius.md', type: 'borderRadius', tier: 'component' },
      { name: 'input.bg', value: 'color.surface', type: 'color', tier: 'component' },
      { name: 'card.bg', value: 'color.surface', type: 'color', tier: 'component' },
      { name: 'card.shadow', value: 'shadow.md', type: 'shadow', tier: 'component' },
    ]
  };

  const tokens110 = {
    Color: [
      { name: 'color.primary', value: sys.color, type: 'color', tier: 'brand' },
      { name: 'color.secondary', value: '#1A1A24', type: 'color', tier: 'brand' },
      { name: 'color.accent', value: '#3B82F6', type: 'color', tier: 'brand' },
      { name: 'color.background', value: '#0D0D12', type: 'color', tier: 'semantic' },
      { name: 'color.surface', value: '#13131A', type: 'color', tier: 'semantic' },
      { name: 'color.text.primary', value: '#EEEEEE', type: 'color', tier: 'semantic' },
      { name: 'color.text.secondary', value: '#8C8CA1', type: 'color', tier: 'semantic' },
    ],
    Typography: [
      { name: 'font.heading', value: 'Outfit', type: 'fontFamily', tier: 'brand' },
      { name: 'font.body', value: 'Inter', type: 'fontFamily', tier: 'brand' },
      { name: 'font.size.xs', value: '0.75rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.sm', value: '0.875rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.base', value: '1.05rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.lg', value: '1.25rem', type: 'fontSize', tier: 'semantic' },
      { name: 'font.size.xl', value: '1.5rem', type: 'fontSize', tier: 'semantic' },
    ],
    Spacing: [
      { name: 'spacing.1', value: '4px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.2', value: '8px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.3', value: '12px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.4', value: '16px', type: 'spacing', tier: 'brand' },
      { name: 'spacing.8', value: '32px', type: 'spacing', tier: 'brand' },
    ],
    Border: [
      { name: 'border.radius.sm', value: '4px', type: 'borderRadius', tier: 'brand' },
      { name: 'border.radius.md', value: '8px', type: 'borderRadius', tier: 'brand' },
      { name: 'border.radius.lg', value: '16px', type: 'borderRadius', tier: 'brand' },
    ],
    Shadow: [
      { name: 'shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)', type: 'shadow', tier: 'semantic' },
      { name: 'shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)', type: 'shadow', tier: 'semantic' },
    ],
    Motion: [
      { name: 'duration.fast', value: '150ms', type: 'duration', tier: 'semantic' },
      { name: 'duration.base', value: '250ms', type: 'duration', tier: 'semantic' },
      { name: 'easing.default', value: 'linear', type: 'easing', tier: 'semantic' },
    ]
  };

  const tokens100 = {
    Color: [
      { name: 'color.primary', value: sys.color, type: 'color', tier: 'brand' },
      { name: 'color.secondary', value: '#111115', type: 'color', tier: 'brand' },
      { name: 'color.accent', value: '#0052cc', type: 'color', tier: 'brand' },
    ],
    Typography: [
      { name: 'font.heading', value: 'Arial', type: 'fontFamily', tier: 'brand' },
      { name: 'font.body', value: 'Arial', type: 'fontFamily', tier: 'brand' },
    ]
  };

  return {
    id: String(sys.id),
    name: sys.name,
    description: sys.description,
    color: sys.color,
    status: 'Active',
    websiteUrl: 'https://strata.charisol.io/demo',
    figmaUrl: 'https://figma.com/@strata-demo',
    repositoryUrl: 'https://github.com/charisol/strata-design-system',
    license: 'MIT',
    weeklyDownloads,
    totalDownloads,
    weeklyUsage,
    updated: '2 weeks ago',
    brand: {
      primaryColor: sys.color,
      secondaryColor: '#1E1E2F',
      accentColor: '#3B82F6',
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      toneKeywords: ['Clean', 'Minimalist', 'Explore'],
      voice: 'Conversational, reliable, clear.',
      manifesto: '## Brand Vision\nWe strive to build cohesive experiences at the speed of thought. By linking code components directly to visual design keys, we create a unified single source of truth.\n\n### Core Tenets\n* **Synchronized Delivery**: Design shifts manifest immediately in dev builds.\n* **Clear Accessibility**: Text contrast meets WCAG AAA defaults.\n* **Dynamic Motion**: Micro-interactions are smooth, satisfying, and intentional.'
    },
    tokens: tokens120,
    components: [
      { id: '1', name: 'PrimaryButton', category: 'Actions & Buttons', template: 'button', description: 'Primary brand action button', tokens: { bg: 'color.primary', textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '2', name: 'InputField', category: 'Form Inputs', template: 'input', description: 'Standard input field component', tokens: { textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '3', name: 'BrandBadge', category: 'Feedback & Status', template: 'badge', description: 'Decorative component badge', tokens: { bg: 'color.accent', textColor: 'color.text.primary', padding: 'spacing.1', borderRadius: 'border.radius.full' } },
      { id: '4', name: 'InformationCard', category: 'Display & Data', template: 'card', description: 'Content display card block', tokens: { bg: 'color.surface', textColor: 'color.text.primary', padding: 'spacing.4', borderRadius: 'border.radius.lg' } }
    ],
    showcaseSites: [
      { name: 'Muzingo Web Player', url: 'https://muzingo.io', image: '🎵', status: 'Live' },
      { name: 'Strata Admin Portal', url: 'https://strata.io', image: '💼', status: 'Live' },
      { name: 'Fintech Dashboard Beta', url: 'https://fintechdash.dev', image: '📈', status: 'Live' }
    ],
    versions: [
      { version: '1.2.0', date: '2026-06-15', description: 'Added component-tier tokens, added color.success, and updated secondary color.', tokens: tokens120 },
      { version: '1.1.0', date: '2026-05-10', description: 'Stable beta release. Refined font sizes and margins.', tokens: tokens110 },
      { version: '1.0.0', date: '2026-04-01', description: 'Initial alpha release with baseline colors and Arial typography mapping.', tokens: tokens100 }
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

const getTokenTier = (token) => {
  if (token.tier) return token.tier;
  const name = token.name.toLowerCase();
  if (
    name.startsWith('button') || 
    name.startsWith('input') || 
    name.startsWith('card') || 
    name.startsWith('badge') ||
    name.includes('component')
  ) {
    return 'component';
  }
  if (
    name.includes('primary') || 
    name.includes('secondary') || 
    name.includes('accent') || 
    name.includes('brand') ||
    name === 'font.heading' ||
    name === 'font.body' ||
    name.startsWith('spacing.') ||
    name.startsWith('border.radius.')
  ) {
    return 'brand';
  }
  return 'semantic';
};

const flattenTokensMap = (tObject) => {
  const flat = {};
  if (!tObject) return flat;
  for (const cat in tObject) {
    if (Array.isArray(tObject[cat])) {
      tObject[cat].forEach(t => {
        flat[t.name] = t;
      });
    }
  }
  return flat;
};

const SharedProject = () => {
  const { id } = useParams();
  const { projects } = useProjects();
  const [copiedToken, setCopiedToken] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('dark');
  const [tokenSearch, setTokenSearch] = useState('');
  const [activeExportTab, setActiveExportTab] = useState('css');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTier, setSelectedTier] = useState('brand');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Find project in context, or fallback to mock project
  const project = projects.find(p => String(p.id) === String(id)) || getMockProject(id);
  const brand = project.brand || {};
  const tokensMap = project.tokens || {};

  const versionsList = project.versions || [
    {
      version: '1.2.0',
      date: project.updated || 'Just now',
      description: 'Current release containing baseline tokens.',
      tokens: project.tokens || {}
    }
  ];

  const [baseVersion, setBaseVersion] = useState(versionsList[1]?.version || versionsList[0]?.version || '1.2.0');
  const [targetVersion, setTargetVersion] = useState(versionsList[0]?.version || '1.2.0');

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

  const handlePrintBrandBible = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      alert('Please allow popups to download the PDF preview.');
      return;
    }
    
    const toneBadges = (brand.toneKeywords || []).map(k => 
      `<span style="background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 100px; font-size: 13px; font-weight: 500; margin-right: 6px; display: inline-block;">${k}</span>`
    ).join('');

    const manifestoHtml = (brand.manifesto || '## Brand Vision\nWe strive to build cohesive experiences at the speed of thought. By linking code components directly to visual design keys, we create a unified single source of truth.\n\n### Core Tenets\n* **Synchronized Delivery**: Design shifts manifest immediately in dev builds.\n* **Clear Accessibility**: Text contrast meets WCAG AAA defaults.\n* **Dynamic Motion**: Micro-interactions are smooth, satisfying, and intentional.')
      .replace(/^## (.*)$/gm, '<h2 style="font-size: 24px; color: #1e293b; margin-top: 24px; margin-bottom: 12px; font-family: ' + (brand.headingFont || 'Outfit') + ', sans-serif;">$1</h2>')
      .replace(/^### (.*)$/gm, '<h3 style="font-size: 18px; color: #334155; margin-top: 18px; margin-bottom: 8px; font-family: ' + (brand.headingFont || 'Outfit') + ', sans-serif;">$1</h3>')
      .replace(/^\* (.*)$/gm, '<li style="margin-bottom: 6px;">$1</li>')
      .replace(/^\d\.\s\*\*(.*)\*\*:\s(.*)$/gm, '<li style="margin-bottom: 8px;"><strong>$1</strong>: $2</li>')
      .replace(/\n\n/g, '</p><p style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 12px;">')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Brand Bible - ${project.name || 'Strata'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;800;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: '${brand.bodyFont || 'Inter'}', 'Inter', sans-serif;
              color: #1e293b;
              background: #ffffff;
              padding: 40px;
              margin: 0;
            }
            h1, h2, h3 {
              font-family: '${brand.headingFont || 'Outfit'}', 'Outfit', sans-serif;
              font-weight: 700;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo-box {
              background: #000;
              color: #fff;
              font-family: '${brand.headingFont || 'Outfit'}', sans-serif;
              font-weight: 900;
              font-size: 32px;
              width: 60px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
            }
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .color-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-top: 15px;
            }
            .color-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            .color-swatch {
              height: 100px;
            }
            .color-info {
              padding: 10px;
              font-size: 13px;
            }
            .color-title {
              font-weight: 600;
              margin-bottom: 2px;
            }
            .color-hex {
              color: #64748b;
              font-family: monospace;
            }
            .font-preview {
              padding: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-top: 10px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 28px;">Strata Brand Bible</h1>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="logo-box">S<span style="color: ${brand.primaryColor || '#FC0694'}">.</span></div>
          </div>
          
          <div class="section">
            ${manifestoHtml.startsWith('<h2') || manifestoHtml.startsWith('<p') ? manifestoHtml : '<p>' + manifestoHtml + '</p>'}
          </div>

          <div class="section">
            <h2 style="font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">Visual Identity</h2>
            
            <h3 style="font-size: 16px; color: #475569; margin-bottom: 10px;">Color Palette</h3>
            <div class="color-grid">
              <div class="color-card">
                <div class="color-swatch" style="background: ${brand.primaryColor || '#FC0694'}"></div>
                <div class="color-info">
                  <div class="color-title">Primary Color</div>
                  <div class="color-hex">${(brand.primaryColor || '#FC0694').toUpperCase()}</div>
                </div>
              </div>
              <div class="color-card">
                <div class="color-swatch" style="background: ${brand.secondaryColor || '#1A1A24'}"></div>
                <div class="color-info">
                  <div class="color-title">Secondary Color</div>
                  <div class="color-hex">${(brand.secondaryColor || '#1A1A24').toUpperCase()}</div>
                </div>
              </div>
              <div class="color-card">
                <div class="color-swatch" style="background: ${brand.accentColor || '#3B82F6'}"></div>
                <div class="color-info">
                  <div class="color-title">Accent Color</div>
                  <div class="color-hex">${(brand.accentColor || '#3B82F6').toUpperCase()}</div>
                </div>
              </div>
            </div>

            <h3 style="font-size: 16px; color: #475569; margin-top: 25px; margin-bottom: 10px;">Typography System</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div class="font-preview">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Headings Font</div>
                <div style="font-family: '${brand.headingFont || 'Outfit'}', sans-serif; font-size: 24px; font-weight: 700;">${brand.headingFont || 'Outfit'}</div>
                <div style="font-family: '${brand.headingFont || 'Outfit'}', sans-serif; font-size: 14px; color: #475569; margin-top: 5px;">The quick brown fox jumps over the lazy dog.</div>
              </div>
              <div class="font-preview">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Body Font</div>
                <div style="font-family: '${brand.bodyFont || 'Inter'}', sans-serif; font-size: 24px; font-weight: 400;">${brand.bodyFont || 'Inter'}</div>
                <div style="font-family: '${brand.bodyFont || 'Inter'}', sans-serif; font-size: 14px; color: #475569; margin-top: 5px;">The quick brown fox jumps over the lazy dog.</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 style="font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">Tone & Voice</h2>
            <div style="margin-bottom: 15px;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 5px;">Keywords</span>
              <div>${toneBadges}</div>
            </div>
            <div>
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 5px;">Voice Guidelines</span>
              <p style="font-size: 15px; line-height: 1.6; margin: 0; color: #334155;">${brand.voice || ''}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getVersionDiff = () => {
    const baseObj = versionsList.find(v => v.version === baseVersion);
    const targetObj = versionsList.find(v => v.version === targetVersion);
    
    if (!baseObj || !targetObj) return { added: [], modified: [], deleted: [] };
    
    const baseTokens = flattenTokensMap(baseObj.tokens);
    const targetTokens = flattenTokensMap(targetObj.tokens);
    
    const added = [];
    const modified = [];
    const deleted = [];
    
    Object.keys(targetTokens).forEach(name => {
      const targetToken = targetTokens[name];
      const baseToken = baseTokens[name];
      
      if (!baseToken) {
        added.push(targetToken);
      } else if (baseToken.value !== targetToken.value) {
        modified.push({
          name,
          type: targetToken.type,
          oldValue: baseToken.value,
          newValue: targetToken.value
        });
      }
    });
    
    Object.keys(baseTokens).forEach(name => {
      if (!targetTokens[name]) {
        deleted.push(baseTokens[name]);
      }
    });
    
    return { added, modified, deleted };
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

  const getCSSVariables = () => {
    let css = `/* Auto-generated by Strata */\n:root {\n`;
    for (const cat in tokensMap) {
      if (Array.isArray(tokensMap[cat])) {
        tokensMap[cat].forEach(t => {
          const varName = `--${t.name.replace(/\./g, '-')}`;
          css += `  ${varName}: ${t.value};\n`;
        });
      }
    }
    css += `}`;
    return css;
  };

  const getTailwindTheme = () => {
    const config = { theme: { extend: {} } };
    for (const cat in tokensMap) {
      if (Array.isArray(tokensMap[cat])) {
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
    }
    return JSON.stringify(config, null, 2);
  };

  const getDTCGJson = () => {
    const json = { $schema: 'https://tr.designtokens.org/format/' };
    for (const cat in tokensMap) {
      if (Array.isArray(tokensMap[cat])) {
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
    }
    return JSON.stringify(json, null, 2);
  };

  const getActiveExportText = () => {
    if (activeExportTab === 'tailwind') return getTailwindTheme();
    if (activeExportTab === 'json') return getDTCGJson();
    return getCSSVariables();
  };

  // Compile tokens for filtering and category list
  const allTokens = [];
  const tokenCategoriesSet = new Set(['All']);
  
  for (const cat in tokensMap) {
    if (Array.isArray(tokensMap[cat])) {
      tokenCategoriesSet.add(cat);
      tokensMap[cat].forEach(t => {
        const tier = t.tier || getTokenTier(t);
        allTokens.push({ ...t, category: cat, tier });
      });
    }
  }

  const tokenCategories = Array.from(tokenCategoriesSet);

  const filteredTokens = allTokens.filter(t => {
    const tierMatch = selectedTier === 'all' || t.tier === selectedTier;
    const catMatch = selectedCategory === 'All' || t.category === selectedCategory;
    const searchMatch = tokenSearch === '' || 
      t.name.toLowerCase().includes(tokenSearch.toLowerCase()) || 
      t.value.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      t.type.toLowerCase().includes(tokenSearch.toLowerCase());
    return tierMatch && catMatch && searchMatch;
  });

  const projectSlug = (project.name || 'design-system').toLowerCase().replace(/\s+/g, '-');
  const { added, modified, deleted } = getVersionDiff();

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

      {/* ── NPM-style Tab Header ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', gap: '0.5rem' }}>
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'brand', name: 'Brand System' },
          { id: 'tokens', name: 'Tokens' },
          { id: 'components', name: 'Components & Spec' },
          { id: 'versions', name: 'Versions & Diff' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              padding: '0.75rem 1.25rem',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              marginBottom: '-1px'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* ── Main Layout: Content Grid with Stats Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
        
        {/* Left Side Content panel */}
        <div style={{ minWidth: 0 }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Package installation card */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Install Package</span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.8rem 1rem' }}>
                  <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>$</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={`npm install @strata-ds/${projectSlug}`} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                  />
                  <button 
                    onClick={() => handleCopy(`npm install @strata-ds/${projectSlug}`, 'InstallCmd')}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                  >
                    {copiedToken === 'InstallCmd' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Readme details */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
              }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>README.md</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  <p>Welcome to <strong>{project.name}</strong>, a premium design token distribution package built on Strata. This package offers synchronized distribution of atomic variables directly to developer endpoints.</p>
                  
                  <h3 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem', fontSize: '1.1rem' }}>Getting Started</h3>
                  <p>Sync variables via the Strata CLI or load variables directly via CSS custom properties. Our pipeline packages visual intent directly into theme definitions.</p>
                  
                  <pre style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '1rem', margin: '0.5rem 0',
                    fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                    overflowX: 'auto'
                  }}>
{`// CLI synchronization
npx strata-cli sync --id ${project.id}

// Import in CSS
@import "@strata-ds/${projectSlug}/variables.css";`}
                  </pre>
                </div>
              </div>

              {/* Live Showcase Sites Gallery */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Showcase Sites</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Web products powered by the live variables of this design system.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {(project.showcaseSites || [
                    { name: 'Muzingo Web Player', url: 'https://muzingo.io', image: '🎵', status: 'Live' }
                  ]).map(site => (
                    <div key={site.name} style={{
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column',
                      gap: '0.75rem', position: 'relative', transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border)'
                      }}>
                        {site.image || '🌐'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{site.name}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{site.url}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                          <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>{site.status}</span>
                        </div>
                        <a href={site.url} target="_blank" rel="noreferrer" style={{
                          fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600
                        }}>Visit Site →</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* BRAND SYSTEM TAB */}
          {activeTab === 'brand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Brand Bible Print / Download Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Generated Brand Bible</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '450px' }}>
                    Print or export the comprehensive brand guidelines documentation as an interactive PDF document.
                  </p>
                </div>
                <button 
                  onClick={handlePrintBrandBible}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                  Download PDF
                </button>
              </div>

              {/* Color swatches & typography preview */}
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

              {/* Tone Guidelines */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Tone & Voice</h3>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Design communication specifications.</p>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Keywords</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(brand.toneKeywords || ['Modern', 'Cohesive']).map(k => (
                      <span key={k} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 500 }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Voice Guidelines</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {brand.voice || 'Conversational, reliable, clear and accessible.'}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TOKENS TAB */}
          {activeTab === 'tokens' && (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
              
              {/* Header with Search and Sliding Pill */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Token Dictionary</h3>
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
                      fontSize: '0.85rem', width: '220px', outline: 'none'
                    }}
                  />
                </div>

                {/* Sliding Category Pill Filter */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '100px', border: '1px solid var(--border)', width: 'fit-content' }}>
                  {[
                    { id: 'brand', label: 'Brand Core' },
                    { id: 'semantic', label: 'Semantic' },
                    { id: 'component', label: 'Component Tier' },
                    { id: 'all', label: 'Show All' }
                  ].map(pill => (
                    <button
                      key={pill.id}
                      onClick={() => setSelectedTier(pill.id)}
                      style={{
                        background: selectedTier === pill.id ? 'var(--accent)' : 'transparent',
                        border: 'none',
                        padding: '0.4rem 1.1rem',
                        borderRadius: '100px',
                        color: selectedTier === pill.id ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side Category Selector + Table Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '2rem' }}>
                {/* Category Sidebar list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Categories</span>
                  {tokenCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        background: selectedCategory === cat ? 'rgba(255,255,255,0.05)' : 'none',
                        border: 'none',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        color: selectedCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: selectedCategory === cat ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Tokens display list */}
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '0.1rem' }}>{t.tier}</span>
                        </div>
                        <span 
                          onClick={() => handleCopy(t.value, t.name)}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Click to copy value"
                        >
                          {t.value}
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{copiedToken === t.name ? '✓' : '📋'}</span>
                        </span>
                        <span style={{
                          display: 'inline-flex', alignSelf: 'center', justifySelf: 'start',
                          fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                          background: `${TYPE_COLORS[t.type] || 'rgba(255,255,255,0.1)'}15`, color: TYPE_COLORS[t.type] || 'var(--text-primary)',
                          border: `1px solid ${TYPE_COLORS[t.type] || 'rgba(255,255,255,0.1)'}30`, fontWeight: 500, letterSpacing: '0.03em',
                        }}>{t.type}</span>
                        <div>{renderTokenPreview(t)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No tokens matching selected filters.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* COMPONENTS TAB */}
          {activeTab === 'components' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Component Canvas Preview */}
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

              {/* Developer Handoff Card */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Developer Code Handoff</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>CDN Public Link</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', position: 'relative' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={`https://strata.io/api/v1/projects/${project.id}/css`} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                      />
                      <button 
                        onClick={() => handleCopy(`https://strata.io/api/v1/projects/${project.id}/css`, 'CDN')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
                      >
                        {copiedToken === 'CDN' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>CLI Sync Command</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={`npx strata-cli sync --id ${project.id}`} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none' }}
                      />
                      <button 
                        onClick={() => handleCopy(`npx strata-cli sync --id ${project.id}`, 'CLI')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
                      >
                        {copiedToken === 'CLI' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code sandbox tabs */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '8px', width: 'fit-content' }}>
                    {['css', 'tailwind', 'json'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveExportTab(tab)}
                        style={{
                          background: activeExportTab === tab ? 'var(--bg-secondary)' : 'none',
                          border: 'none', borderRadius: '6px', padding: '0.35rem 1rem',
                          color: activeExportTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <pre style={{
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '1rem', margin: 0,
                      fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                      maxHeight: '220px', overflow: 'auto', whiteSpace: 'pre-wrap'
                    }}>
                      {getActiveExportText()}
                    </pre>
                    <button 
                      onClick={() => handleCopy(getActiveExportText(), 'Snippet')}
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(9, 9, 12, 0.85)', border: '1px solid var(--border)',
                        borderRadius: '6px', padding: '0.35rem 0.65rem',
                        color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {copiedToken === 'Snippet' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VERSIONS & DIFF TAB */}
          {activeTab === 'versions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Diff calculation workspace */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Version Difference Engine</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Compare design tokens across any two published versions to review changes.</p>
                </div>
                
                {/* Selectors dropdowns */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Base Version (Old)</span>
                    <select 
                      value={baseVersion} 
                      onChange={(e) => setBaseVersion(e.target.value)}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                    >
                      {versionsList.map(v => (
                        <option key={v.version} value={v.version}>{v.version} ({v.date})</option>
                      ))}
                    </select>
                  </div>

                  <span style={{ color: 'var(--text-tertiary)', fontSize: '1.25rem', marginTop: '1rem' }}>➔</span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Target Version (New)</span>
                    <select 
                      value={targetVersion} 
                      onChange={(e) => setTargetVersion(e.target.value)}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                    >
                      {versionsList.map(v => (
                        <option key={v.version} value={v.version}>{v.version} ({v.date})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diff Result List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600 }}>{added.length} Added</span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600 }}>{modified.length} Modified</span>
                    <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600 }}>{deleted.length} Deleted</span>
                  </div>

                  {added.length === 0 && modified.length === 0 && deleted.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                      No differences found. The tokens in both versions match exactly.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                      
                      {/* Added section */}
                      {added.map(t => (
                        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>+ {t.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{t.type}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.value}</span>
                        </div>
                      ))}

                      {/* Modified section */}
                      {modified.map(t => (
                        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>~ {t.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{t.type}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{t.oldValue}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>➔</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t.newValue}</span>
                          </div>
                        </div>
                      ))}

                      {/* Deleted section */}
                      {deleted.map(t => (
                        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, textDecoration: 'line-through' }}>- {t.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{t.type}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{t.value}</span>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              </div>

              {/* Version History Changelog List */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Published Release Timeline</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                  {versionsList.map((v, idx) => (
                    <div key={v.version} style={{ position: 'relative', paddingBottom: idx === versionsList.length - 1 ? 0 : '1rem' }}>
                      {/* Timeline dot */}
                      <span style={{
                        position: 'absolute', left: '-21px', top: '4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: idx === 0 ? 'var(--accent)' : 'var(--bg-secondary)',
                        border: '2px solid var(--accent)', display: 'inline-block'
                      }}></span>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>v{v.version}</span>
                          {idx === 0 && <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 600 }}>Latest</span>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{v.date}</span>
                      </div>
                      
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {v.description || 'Design system release.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Sticky Sidebar */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '2rem' }}>
            
            {/* Quick NPM installer */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>NPM Install Code</h3>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  npm i @strata-ds/{projectSlug}
                </span>
                <button 
                  onClick={() => handleCopy(`npm i @strata-ds/${projectSlug}`, 'InstallSidebar')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '0.1rem' }}
                >
                  {copiedToken === 'InstallSidebar' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* NPM statistics */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Package Info</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Weekly Downloads</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{(project.weeklyDownloads || 1420).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Downloads</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{(project.totalDownloads || 28400).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Live Sites Using It</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>{project.showcaseSites ? project.showcaseSites.length : 3} Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Current Version</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>v{versionsList[0]?.version || '1.2.0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>License</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{project.license || 'MIT'}</span>
                </div>
              </div>
            </div>

            {/* Resources list */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Resources</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href={project.figmaUrl || 'https://figma.com'} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
                  padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a5 5 0 00-5 5v2a5 5 0 005 5h2a5 5 0 005-5V7a5 5 0 00-5-5h-2z"/><path d="M7 17a5 5 0 1010 0v-3H7v3z"/></svg>
                  Figma Community File
                </a>
                <a href={project.repositoryUrl || 'https://github.com'} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
                  padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>
                  GitHub Repository
                </a>
                <a href={project.websiteUrl || 'https://strata.io'} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
                  padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><path d="M2 12h20"/></svg>
                  Official Homepage
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default SharedProject;
