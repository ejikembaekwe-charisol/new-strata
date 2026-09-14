import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { renderComponentPreview } from '../components/componentPreviews';
import { indexById, effectiveTokens, isFragment, childrenOf } from '../components/inspector/inheritance';
import { deriveTokens } from '../data/derivedTokens';
import DesignSystemView from '../components/DesignSystemView';
import { liveReleaseOf, releasesOf, formatStamp, storageUsage } from '../data/releases';

// TYPE_COLORS keyed the per-type pill in the old token table, and siteStatusColor the
// showcase-sites card. The swatch grid replaced the first; the second card is gone.

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
  
  // No fallback to systems[0] — an unknown id must not render someone else's
  // system under a URL that isn't theirs.
  const sys = systems.find(s => String(s.id) === String(id));
  if (!sys) return null;
  
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
      manifesto: '## Brand Vision\nWe strive to build cohesive experiences at the speed of thought. By linking code components directly to visual design keys, we create a unified single source of truth.\n\n### Core Tenets\n* **Synchronized Delivery**: Design shifts manifest immediately in dev builds.\n\n* **Dynamic Motion**: Micro-interactions are smooth, satisfying, and intentional.'
    },
    tokens: tokens120,
    components: [
      { id: '1', name: 'PrimaryButton', category: 'Actions & Triggers', template: 'button', description: 'Primary brand action button', tokens: { bg: 'color.primary', textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '2', name: 'InputField', category: 'Forms & Inputs', template: 'input', description: 'Standard input field component', tokens: { textColor: 'color.text.primary', padding: 'spacing.3', borderRadius: 'border.radius.md' } },
      { id: '3', name: 'BrandBadge', category: 'Data Display & Visualization', template: 'badge', description: 'Decorative component badge', tokens: { bg: 'color.accent', textColor: 'color.text.primary', padding: 'spacing.1', borderRadius: 'border.radius.full' } },
      { id: '4', name: 'InformationCard', category: 'Layout & Containers', template: 'card', description: 'Content display card block', tokens: { bg: 'color.surface', textColor: 'color.text.primary', padding: 'spacing.4', borderRadius: 'border.radius.lg' } }
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

// SANDBOX_COLORS and SANDBOX_RADII drove the interactive sandbox card, now gone.

// AUDIENCE_TABS and AUDIENCE_STRAPLINES lived here. The page is one scrolling document
// now, so there is no Overview for a persona switcher to re-curate.

const SharedProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, addProject } = useProjects();
  const [copiedToken, setCopiedToken] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('dark');
  // Search, the Explore tab and the export format all live in DesignSystemView now.
  // previewTheme stays because this page still draws the live component preview and hands
  // it to the view; a template has no components to preview.
  const [forking, setForking] = useState(false);

  // Find project in context, or fallback to one of the demo systems. Null when
  // the id matches neither — rendered as a not-found view below. Every value
  // derived from it is null-safe so the hooks below still run unconditionally.
  const stored = projects.find(p => String(p.id) === String(id)) || getMockProject(id);

  // What a reader gets is the release that was published, not whatever its owner happens
  // to be editing right now. Before this, every keystroke in the editor was live to anyone
  // holding the link, and "publish" changed nothing at all.
  //
  // Swapped in once, here, so the thirty-odd reads below are untouched and cannot disagree
  // about which version they are showing.
  const live = liveReleaseOf(stored);
  const project = live
    ? { ...stored, tokens: live.payload.tokens, components: live.payload.components, brand: live.payload.brandData }
    : stored;
  // Nothing published yet: the draft is shown, and the page says so rather than passing it
  // off as a release.
  const showingDraft = Boolean(stored) && !live;

  const brand = project?.brand || {};
  // Only for a project of the reader's own that has never been published — the demo
  // systems carry their own versions and are not drafts.
  const draftNotice = showingDraft && !stored?.isMock ? (
    <div style={{
      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '0.6rem 0.85rem', marginBottom: '1rem',
      fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
    }}>
      This design system has not been published yet. You are seeing it as it stands right
      now, which will change as its owner works on it.
    </div>
  ) : null;
  // The same ramps the editor derives, from the same stored data, so a shared system
  // lists Primary 50-950 rather than the one flat colour it was saved with. Idempotent,
  // so a project already holding its ramps is untouched.
  const tokensMap = deriveTokens(project?.tokens || {});

  // showcaseSites, glanceSwatches and brandSwatches stood here. The first only ever existed
  // on the hardcoded demo records, so the "adopted by" stack it fed was empty for every real
  // project. The other two are superseded by the hero strip, which resolves aliases and reads
  // the ramps rather than only the three brand roots.

  // Real releases first. The demo systems still carry their own hand-written `versions`
  // array, so those keep working untouched.
  const realReleases = releasesOf(stored).map(r => ({
    version: String(r.number),
    date: r.publishedAt,
    description: r.name + (r.notes ? ' — ' + r.notes : ''),
  }));
  // No invented '1.2.0' fallback. A project that has never been published has no version,
  // and saying so is better than making one up.
  const versionsList = realReleases.length ? realReleases : (stored?.versions || []);

  // Placed after every hook: bailing out earlier would change the hook count
  // between a found and a not-found project and break React's hook order.
  if (!project) {
    return (
      <div className="page-container">
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '10rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>This design system isn't available</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            It may have been removed, or the link may be wrong.
          </p>
          <Link to="/explore" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // ProjectDetail buckets tokens by TYPE (Color/Typography/Spacing/Border/Shadow/Motion)
  // with a { layer: 'Brand'|'Semantic'|'Component' } field, while this page's mock/shared
  // tokens are pre-bucketed by tier — including a separate top-level "Component" group —
  // and use { tier: 'brand'|'semantic'|'component' }. Re-flatten by each token's real type
  // so nothing (e.g. the Component-tier button/input tokens) gets silently dropped.
  const TYPE_TO_LAYER_CATEGORY = {
    color: 'Color', fontFamily: 'Typography', fontSize: 'Typography', spacing: 'Spacing',
    borderRadius: 'Border', shadow: 'Shadow', duration: 'Motion', easing: 'Motion',
  };

  const toLayerTokens = (tMap) => {
    const result = { Color: [], Typography: [], Spacing: [], Border: [], Shadow: [], Motion: [] };
    for (const cat in tMap) {
      if (!Array.isArray(tMap[cat])) continue;
      tMap[cat].forEach(t => {
        const bucket = TYPE_TO_LAYER_CATEGORY[t.type] || 'Color';
        result[bucket].push({
          name: t.name,
          value: t.value,
          type: t.type,
          layer: t.layer || (t.tier ? t.tier.charAt(0).toUpperCase() + t.tier.slice(1) : 'Brand'),
        });
      });
    }
    // The same ramps the editor derives, from the same stored data — so a shared system
    // lists Primary 50-950 rather than the one flat colour it was saved with.
    return deriveTokens(result);
  };

  // Remix: this system, copied into a project of your own, opened ready to change.
  //
  // `project` is the published release when there is one, so a remix carries what its
  // author published rather than whatever they happen to be editing.
  const handleRemix = () => {
    if (!user) {
      // Carry where we were. Signing in used to drop you on /projects with nothing copied
      // and no way back, which threw away the only thing you had asked for.
      navigate('/login', { state: { from: '/explore/' + id } });
      return;
    }

    // A remix duplicates a whole design system into a store with a hard ceiling, and a
    // failed write would only reach console.error. Ask first rather than lose the copy.
    const usage = storageUsage(projects);
    if (usage && usage.percent > 80) {
      const go = window.confirm(
        'This browser is ' + usage.percent + '% full, and a remix copies the whole system. '
        + 'It may not save. Continue anyway?');
      if (!go) return;
    }

    setForking(true);
    const copy = addProject({
      title: project.name + ' remix',
      description: project.description,
      color: project.color,
      websiteUrl: project.websiteUrl,
      figmaUrl: project.figmaUrl,
      brand: project.brand,
      tokens: toLayerTokens(project.tokens),
      // `|| []` deliberately: a system with no components must arrive with none. addProject
      // only falls back to the demo set when the key is absent.
      components: project.components || [],
      uploadedAssets: project.uploadedAssets || [],
    });
    if (!copy) { setForking(false); return; }
    navigate(`/projects/${copy.id}`);
  };

  const resolveTokenValue = (tokenName) => {
    if (!tokenName) return '';
    for (const cat in tokensMap) {
      const found = tokensMap[cat]?.find(t => t.name === tokenName);
      if (found) return found.value;
    }
    return '';
  };

  // Sidebar palette rows — only values the project actually has.
  // paletteRows fed the old sidebar. statsFor answers the same question now, and answers it
  // for every category rather than colour alone.

  const handlePrintBrandBible = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      alert('Please allow popups to download the PDF preview.');
      return;
    }
    
    const toneBadges = (brand.toneKeywords || []).map(k => 
      `<span style="background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 100px; font-size: 13px; font-weight: 500; margin-right: 6px; display: inline-block;">${k}</span>`
    ).join('');

    const manifestoHtml = (brand.manifesto || '## Brand Vision\nWe strive to build cohesive experiences at the speed of thought. By linking code components directly to visual design keys, we create a unified single source of truth.\n\n### Core Tenets\n* **Synchronized Delivery**: Design shifts manifest immediately in dev builds.\n\n* **Dynamic Motion**: Micro-interactions are smooth, satisfying, and intentional.')
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

  // Previews come from the shared module, so a public link draws exactly the same
  // set of component types the editor does. Only the legacy six token keys are
  // resolved here — unchanged from before — and this view's light/dark preview
  // surfaces are handed in rather than the app's CSS variables.
  // Same resolution as the editor, so a shared link shows what the editor shows.
  const sharedById = indexById(project.components || []);
  const renderLivePreview = (comp, depth = 0) => {
    const light = previewTheme === 'light';
    // Inherited mappings count here too, or a shared link would show an extending
    // component unstyled while the editor shows it styled.
    const own = effectiveTokens(comp, sharedById);
    const mapped = {};
    const put = (key, prop) => {
      const v = resolveTokenValue(own[key]);
      if (v) mapped[prop] = v;
    };
    put('bg', 'background');
    put('textColor', 'color');
    put('padding', 'padding');
    put('borderRadius', 'borderRadius');
    put('fontFamily', 'fontFamily');
    put('fontSize', 'fontSize');

    return renderComponentPreview(comp, mapped, {
      children: isFragment(comp) && depth < 6
        ? childrenOf(comp, sharedById).map(kid => (
            <React.Fragment key={kid.id}>{renderLivePreview(kid, depth + 1)}</React.Fragment>
          ))
        : undefined,
      surface: light ? '#ffffff' : '#13131a',
      surfaceAlt: light ? '#f4f4f5' : '#1a1a24',
      text: light ? '#171717' : '#ffffff',
      muted: light ? '#71717a' : '#a1a1aa',
      border: light ? '#e4e4e7' : '#2a2a35',
      shadow: '0 4px 12px rgba(0,0,0,0.1)',
      accent: '#FC0694',
      buttonLabel: 'Click Me',
      inputPlaceholder: 'Type here...',
      inputMaxWidth: '180px',
      cardMaxWidth: '220px',
      cardBody: 'Visual spec card.',
    });
  };

  // The three export generators moved to data/tokenExport.js so a template offers the
  // same formats from the same code.




  // Every token flat, each carrying its category and resolved tier. The category list this
  // also built went with the sidebar; the Explore tabs derive their tabs from tokensMap
  // directly, so a category with nothing in it cannot produce one.
  const allTokens = [];
  for (const cat in tokensMap) {
    if (!Array.isArray(tokensMap[cat])) continue;
    tokensMap[cat].forEach(t => {
      allTokens.push({ ...t, category: cat, tier: t.tier || getTokenTier(t) });
    });
  }

  // Token search moved into DesignSystemView along with the grid it filters.

  const projectSlug = (project.name || 'design-system').toLowerCase().replace(/\s+/g, '-');

  // stats, facts and the hero swatch strip are all derived inside DesignSystemView,
  // so a caller cannot hand it a count that disagrees with the tokens underneath.


  // Other systems a reader can actually open: published, and not this one. There is no
  // discovery index, so this is empty for most visitors and the section is then omitted
  // rather than shown with nothing under it.

  const otherPublished = (projects || [])
    .filter(p => String(p.id) !== String(id) && p.liveReleaseId)
    .slice(0, 3);

  const publishedStamp = live && live.publishedAt ? formatStamp(live.publishedAt) : null;

  // Full design system as a single Markdown file — meant to be dropped straight
  // into a repo or pasted into an AI prompt, so an agent/LLM has the whole
  // system (brand, tokens, components, integration) as grounded context.
  const generateMarkdown = () => {
    const lines = [];
    lines.push(`# ${project.name}`);
    if (project.description) lines.push(`\n${project.description}`);

    lines.push(`\n## Brand`);
    lines.push(`- Primary: \`${brand.primaryColor || project.color || '#FC0694'}\``);
    lines.push(`- Secondary: \`${brand.secondaryColor || '#1A1A24'}\``);
    lines.push(`- Accent: \`${brand.accentColor || '#3B82F6'}\``);
    lines.push(`- Heading font: ${brand.headingFont || 'Outfit'}`);
    lines.push(`- Body font: ${brand.bodyFont || 'Inter'}`);
    if (brand.toneKeywords?.length) lines.push(`- Tone: ${brand.toneKeywords.join(', ')}`);
    if (brand.voice) lines.push(`- Voice: ${brand.voice}`);

    lines.push(`\n## Integration`);
    lines.push(`\`\`\`css`);
    lines.push(`@import url("https://strata.io/api/v1/projects/${project.id}/css");`);
    lines.push(`\`\`\``);
    lines.push(`\`\`\`bash`);
    lines.push(`npx strata-cli sync --id ${project.id}`);
    lines.push(`\`\`\``);

    if (allTokens.length) {
      lines.push(`\n## Tokens (${allTokens.length})`);
      const byCategory = {};
      allTokens.forEach(t => { (byCategory[t.category] = byCategory[t.category] || []).push(t); });
      Object.keys(byCategory).forEach(cat => {
        lines.push(`\n### ${cat}`);
        lines.push(`| Name | Value | Type |`);
        lines.push(`|---|---|---|`);
        byCategory[cat].forEach(t => lines.push(`| \`${t.name}\` | \`${t.value}\` | ${t.type} |`));
      });
    }

    if (project.components?.length) {
      lines.push(`\n## Components (${project.components.length})`);
      project.components.forEach(c => {
        lines.push(`- **${c.name}**${c.description ? ` — ${c.description}` : ''}`);
      });
    }

    return lines.join('\n') + '\n';
  };

  const handleDownloadMarkdown = () => {
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(generateMarkdown());
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${projectSlug}.md`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // The six persona cards (sandbox, wild, developer, designer, designTeam, vibeCoder)
  // and the overviewCards selector stood here. They were the Overview tab, which this
  // page no longer has; the sandbox also carried fake device chrome and a search box
  // that did nothing.

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>

      <DesignSystemView
        name={project.name}
        description={project.description}
        color={project.color}
        brand={brand}
        tokensMap={tokensMap}
        components={project.components}
        meta={[
          publishedStamp ? 'Published ' + publishedStamp : null,
          versionsList.length > 0 ? 'Version ' + versionsList[0].version : null,
        ].filter(Boolean)}
        resolveAlias={resolveTokenValue}
        preview={(
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <div style={{
                display: 'flex', gap: '0.3rem', background: 'var(--bg-tertiary)',
                padding: '0.25rem', borderRadius: '100px', border: '1px solid var(--border)',
              }}>
                {['dark', 'light'].map(th => (
                  <button
                    key={th}
                    type="button"
                    role="radio"
                    aria-checked={previewTheme === th}
                    onClick={() => setPreviewTheme(th)}
                    style={{
                      background: previewTheme === th ? 'var(--accent)' : 'transparent',
                      border: 'none', padding: '0.3rem 0.9rem', borderRadius: '100px',
                      color: previewTheme === th ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', textTransform: 'capitalize',
                    }}
                  >{th}</button>
                ))}
              </div>
            </div>
            <div style={{
              background: previewTheme === 'dark' ? '#0B0B0F' : '#FFFFFF',
              borderRadius: '12px', padding: '1.5rem', display: 'flex',
              flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start',
            }}>
              {(project.components || []).filter(c => !isFragment(c)).slice(0, 12)
                .map(c => <div key={c.id}>{renderLivePreview(c, 0)}</div>)}
            </div>
          </div>
        )}
        notice={draftNotice}
        breadcrumb={(
          <div style={{ padding: '4.5rem 0 1.25rem' }}>
            <Link to="/explore" style={{
              color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            }}>← Back to Explore</Link>
          </div>
        )}
        actions={(
          <>
            <button
              onClick={handleRemix}
              disabled={forking}
              className="btn"
              style={{
                padding: '0.65rem 1.35rem', fontSize: '0.88rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                background: 'var(--accent)', color: '#ffffff', border: 'none',
                opacity: forking ? 0.7 : 1, cursor: forking ? 'default' : 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6M6 9a9 9 0 0012 8"/></svg>
              {forking ? 'Remixing…' : 'Remix design system'}
            </button>
            <button onClick={handleDownloadMarkdown} className="btn btn-secondary"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download {projectSlug}.md
            </button>
            <button onClick={() => handleCopy(generateMarkdown(), 'Markdown')} className="btn btn-secondary"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}>
              {copiedToken === 'Markdown' ? 'Copied!' : 'Copy markdown'}
            </button>
            <button onClick={() => handleCopy(window.location.href, 'Link')} className="btn btn-secondary"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}>
              {copiedToken === 'Link' ? 'Copied!' : 'Share'}
            </button>
          </>
        )}
        footerTitle={'Use ' + project.name + ' in your project'}
        footerBody="Remix it into a system of your own — every token and component copied across, and everything editable from the moment it opens."
        footerActions={(
          <>
            <button onClick={handleRemix} disabled={forking} className="btn"
              style={{
                padding: '0.7rem 1.5rem', fontSize: '0.88rem', fontWeight: 600, border: 'none',
                background: 'var(--accent)', color: '#fff',
                opacity: forking ? 0.7 : 1, cursor: forking ? 'default' : 'pointer',
              }}>
              {forking ? 'Remixing…' : 'Remix design system'}
            </button>
            <button onClick={handleDownloadMarkdown} className="btn btn-secondary"
              style={{ padding: '0.7rem 1.4rem', fontSize: '0.85rem' }}>
              Download {projectSlug}.md
            </button>
          </>
        )}
      />

      {/* The Brand Bible is a project-only artefact — a template has no manifesto. */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button onClick={handlePrintBrandBible} className="btn btn-secondary"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}>
          Print the Brand Bible
        </button>
      </div>

      {/* Only rendered when there genuinely are other published systems to open. */}
      {otherPublished.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>More systems</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {otherPublished.map(p => (
              <Link key={p.id} to={'/explore/' + p.id} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '1.1rem', textDecoration: 'none', display: 'block',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                {p.description && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                    {p.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}


      {/* The mobile rules that lived here moved into DesignSystemView, which owns the
          markup they target. The rest styled the token table, the category rail and the
          audience switcher — all removed with the tabs. */}

    </div>
  );
};

export default SharedProject;
