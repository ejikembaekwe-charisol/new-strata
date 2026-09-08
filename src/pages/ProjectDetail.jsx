import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useTabs } from '../context/TabsContext';
import branchIcon from '../assets/branch-icon.svg';
import { resolveMyRole, can, canViewTab, ROLES, describeRole, roleSummary, LOCAL_OWNER_EMAIL } from '../utils/permissions';
import { getBrandCompleteness, emptyBrandContext } from '../utils/projectCompleteness';
import BrandContextEngine from '../components/BrandContextEngine';
import StartChoice from '../components/StartChoice';
import ScratchWizard from '../components/newProject/ScratchWizard';
import ComponentInspector from '../components/inspector/ComponentInspector';
import PropertySections, { sectionIdsForProperties } from '../components/inspector/PropertySections';
import {
  indexById, effectiveTokens, tokenOrigin, isFragment, childrenOf,
  eligibleParents, eligibleChildren, removeComponents,
} from '../components/inspector/inheritance';

import {
  COMPONENT_TAXONOMY, CATEGORY_LIST, TYPES_FOR_CATEGORY, TYPE_TO_TEMPLATE,
  TYPE_DESCRIPTIONS, TYPE_TO_CATEGORY as COMPONENT_TYPE_CATEGORY,
  TEMPLATE_TO_TYPE,
  categoryForComponent, typeForComponent, componentFoldersFor,
} from '../components/componentTaxonomy';
import { renderComponentPreview } from '../components/componentPreviews';
import { ColorSwatchButton } from '../components/ColorPicker';
import { deriveTokens } from '../data/derivedTokens';
import { buildUsageIndex, usageOf, referrersOf, isDeadToken } from '../data/tokenUsage';
import { renameRamp, recolorRamp, slugifyRole } from '../data/tokenRefactor';
import { styleOf } from '../data/textStyles';
import { normalizeTypeKey } from '../data/tokenTypes';
import RampModal from '../components/RampModal';
import ScaleModal from '../components/ScaleModal';
import ComponentThumb from '../components/ComponentThumb';
import {
  TOKEN_LAYERS, TOKEN_LAYER_LABELS, layerColorFor,
  groupsFor, rowLabelFor,
} from '../data/tokenGroups';
import { MOCK_TOKENS } from '../data/designSystemSeed';
import { entranceKeyframesCss, ENTRANCE_KEYFRAMES, entranceByAnimation } from '../data/motionKeyframes';
import { extractColorsFromImage, extractFontSizesFromImage, detectComponentRegions, cropImageRegionToDataUrl, resizeImageToDataUrl, suggestUniqueName } from '../utils/colorExtract';

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

// Invited teammates only give us an email up front (no name yet), so derive
// avatar initials from the email's local part instead, e.g. "jordan.lee@…" → "JL".
const computeInitialsFromEmail = (email) => {
  const local = (email || '').split('@')[0];
  const parts = local.split(/[._\-+]+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Sidebar shows token TYPES
const TOKEN_TYPES = [
  { id: 'Color', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg> },
  { id: 'Typography', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  { id: 'Spacing', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { id: 'Sizing', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> },
  { id: 'Border', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/></svg> },
  { id: 'Shadow', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="14" height="14" rx="2"/><rect x="7" y="7" width="14" height="14" rx="2" opacity="0.4"/></svg> },
  { id: 'Motion', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
  { id: 'Layout', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
  { id: 'Flexbox', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'Lists', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> },
];

// Token table: name, value, preview. The type column went away — the folder says it.
const TOKEN_TABLE_COLS = 'minmax(0, 1.5fr) minmax(0, 1fr) 150px';
const nlnl = String.fromCharCode(10, 10);

// Types whose "Visual Preview" cell already renders a swatch + the raw value
// (must match the color cases in renderTokenPreview) — used to skip the
// redundant duplicate value line on the mobile token card.
// Undo depth. A snapshot of this project is roughly 25KB, so fifty is about a megabyte
// of memory and nothing on disk — the history is deliberately not persisted.
const HISTORY_LIMIT = 50;

const COLOR_VALUE_TYPES = new Set(['color', 'background-color', 'border-color', 'outline-color', 'text-decoration-color', 'accent-color', 'fill', 'stroke']);

// Sidebar main navigation tabs — shared by the desktop list, the mobile icon rail, and the mobile nav overlay
const MAIN_TABS = [
  { id: 'brand', label: 'Brand Bible', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { id: 'handoff', label: 'Handoff', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg> },
  { id: 'tokens', label: 'Tokens', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { id: 'components', label: 'Components', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'settings', label: 'Settings', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  { id: 'collaboration', label: 'Collaboration', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'branch', label: 'Branch & Publish', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg> },
];

// Where a component sits in the Components tree. Both derive from the component's
// `template` via the taxonomy, falling back to its stored category only when the
// template is one this build does not know — see componentTaxonomy.js.
const componentTreeCategory = (comp) => categoryForComponent(comp);
const componentTreeType = (comp) => typeForComponent(comp);

// Font choices offered in the Brand Bible typography selects.
const FONT_CHOICES = ['Outfit', 'Inter', 'Roboto', 'DM Sans', 'Poppins', 'Manrope', 'Figtree', 'Space Grotesk', 'Playfair Display', 'Georgia'];

// Flat token store: { Color: [{name, value, type, layer}, ...], Typography: [...], ... }

// Migrate old formats to the new flat-by-type structure
const migrateTokensToLayers = (saved) => deriveTokens(migrateTokenShape(saved));

const migrateTokenShape = (saved) => {
  if (!saved) return MOCK_TOKENS;

  // Already in new format if keys are type names
  const typeKeys = ['Color', 'Typography', 'Spacing', 'Sizing', 'Border', 'Shadow', 'Motion', 'Layout', 'Flexbox', 'Lists'];
  const hasTypeKeys = typeKeys.some(k => Array.isArray(saved[k]));
  if (hasTypeKeys) {
    const result = {};
    typeKeys.forEach(k => {
      result[k] = Array.isArray(saved[k]) ? saved[k] : [...MOCK_TOKENS[k]];
    });
    return result;
  }

  // Old layer-keyed format — migrate by flattening into types with guessed layers
  const result = {};
  typeKeys.forEach(k => { result[k] = [...MOCK_TOKENS[k]]; });

  const typeMap = { color: 'Color', fontFamily: 'Typography', fontSize: 'Typography', spacing: 'Spacing', borderRadius: 'Border', shadow: 'Shadow', duration: 'Motion', easing: 'Motion' };
  const guessLayer = (name) => {
    if (name.startsWith('brand.')) return 'Brand';
    if (name.includes('.') && (name.startsWith('button.') || name.startsWith('input.') || name.startsWith('card.'))) return 'Component';
    return 'Semantic';
  };

  for (const cat in saved) {
    const list = saved[cat];
    if (!Array.isArray(list)) continue;
    list.forEach(t => {
      const typeBucket = typeMap[t.type] || 'Color';
      const layer = t.layer || guessLayer(t.name);
      const exists = result[typeBucket]?.some(x => x.name === t.name);
      if (!exists) result[typeBucket].push({ ...t, layer });
    });
  }

  return result;
};

const TYPE_COLORS = {
  // Color family — legacy + full CSS property taxonomy
  color: '#FC0694',
  'background-color': '#FC0694',
  'border-color': '#FC0694',
  'outline-color': '#FC0694',
  'text-decoration-color': '#FC0694',
  'accent-color': '#FC0694',
  fill: '#FC0694',
  stroke: '#FC0694',
  // Typography family
  fontFamily: '#10B981',
  'font-family': '#10B981',
  fontSize: '#3B82F6',
  'font-size': '#3B82F6',
  'font-weight': '#3B82F6',
  'font-style': '#3B82F6',
  'line-height': '#3B82F6',
  'letter-spacing': '#3B82F6',
  'text-align': '#3B82F6',
  'text-transform': '#3B82F6',
  'text-decoration': '#3B82F6',
  'word-spacing': '#3B82F6',
  // Spacing family
  spacing: '#F59E0B',
  padding: '#F59E0B',
  'padding-top': '#F59E0B',
  'padding-right': '#F59E0B',
  'padding-bottom': '#F59E0B',
  'padding-left': '#F59E0B',
  margin: '#F59E0B',
  'margin-top': '#F59E0B',
  'margin-right': '#F59E0B',
  'margin-bottom': '#F59E0B',
  'margin-left': '#F59E0B',
  gap: '#F59E0B',
  'row-gap': '#F59E0B',
  'column-gap': '#F59E0B',
  // Sizing family
  width: '#F59E0B',
  height: '#F59E0B',
  'min-width': '#F59E0B',
  'min-height': '#F59E0B',
  'max-width': '#F59E0B',
  'max-height': '#F59E0B',
  // Border & Radius family
  borderRadius: '#8B5CF6',
  border: '#8B5CF6',
  'border-width': '#8B5CF6',
  'border-style': '#8B5CF6',
  'border-radius': '#8B5CF6',
  outline: '#8B5CF6',
  'outline-width': '#8B5CF6',
  'outline-style': '#8B5CF6',
  'outline-offset': '#8B5CF6',
  // Effects family
  shadow: '#EC4899',
  opacity: '#EC4899',
  'box-shadow': '#EC4899',
  'text-shadow': '#EC4899',
  transform: '#EC4899',
  cursor: '#EC4899',
  filter: '#EC4899',
  'backdrop-filter': '#EC4899',
  // Animation family
  duration: '#6366F1',
  easing: '#14B8A6',
  transition: '#6366F1',
  'transition-duration': '#6366F1',
  'animation-duration': '#6366F1',
  // Layout & Positioning family
  display: '#38BDF8',
  position: '#38BDF8',
  top: '#38BDF8',
  right: '#38BDF8',
  bottom: '#38BDF8',
  left: '#38BDF8',
  'z-index': '#38BDF8',
  overflow: '#38BDF8',
  // Flexbox & Grid family
  'flex-direction': '#C084FC',
  'flex-wrap': '#C084FC',
  'flex-grow': '#C084FC',
  'flex-shrink': '#C084FC',
  'flex-basis': '#C084FC',
  'justify-content': '#C084FC',
  'align-items': '#C084FC',
  'align-content': '#C084FC',
  'align-self': '#C084FC',
  order: '#C084FC',
  'grid-template-columns': '#C084FC',
  'grid-template-rows': '#C084FC',
  'grid-column': '#C084FC',
  'grid-row': '#C084FC',
  'grid-area': '#C084FC',
  // Lists family
  'list-style': '#94A3B8',
  'list-style-type': '#94A3B8',
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
  const location = useLocation();
  const { user, logout } = useAuth();
  const { projects, isLoaded, updateProject, addProject, deleteProject } = useProjects();
  const { openTab, markOpened, sectionFor, setSection, sidebarCollapsed, setSidebarCollapsed, hydrated } = useTabs();

  // Find project from list
  const project = projects.find(p => String(p.id) === String(id));
  const myRole = resolveMyRole(project, user);

  const [activeTab, setActiveTab] = useState(() => sectionFor(id) || 'brand');
  const [tokenTableSearch, setTokenTableSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date());
  const [brandData, setBrandData] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [projectNameDraft, setProjectNameDraft] = useState(project?.name || '');
  const [projectDescDraft, setProjectDescDraft] = useState(project?.description || '');
  // null when closed; otherwise { step, source } for the Brand Context Engine
  const [engine, setEngine] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Designer' });
  // Session-only: dismissing just hides it for this visit — it comes back on
  // the next page refresh, so it keeps catching the user's eye rather than
  // vanishing for good after one click.
  const [uploadBannerDismissed, setUploadBannerDismissed] = useState(false);
  const dismissUploadBanner = () => setUploadBannerDismissed(true);

  // Components tree in the sidebar. Opening a component shows the preview
  // drawer (previewComponentId) — there is no separate in-page detail view.
  const [componentSearch, setComponentSearch] = useState('');
  // Folders the user has toggled *away from their default* — not simply the closed
  // ones. A category defaults to open only when it holds components, so a fresh
  // project shows the taxonomy without 17 empty rows, and clicking one still works
  // in both directions without a second piece of state.
  const [toggledComponentFolders, setToggledComponentFolders] = useState(() => new Set());

  // Component group filter, driven by the mobile bottom navbar. Defaults to
  // 'All' so the desktop view — which has no group-filter control — is unchanged.

  // The tree's root folder. Expanded by default; collapsing it hides every group.
  const [componentRootOpen, setComponentRootOpen] = useState(true);

  // Kebab menu on a component card (mobile). Holds the trigger's measured
  // screen position because the rows live in an `overflow: hidden` container,
  // which would clip an absolutely-positioned panel — so the menu is `fixed`.
  const [componentMenu, setComponentMenu] = useState(null); // { id, top, right }

  // Component Preview drawer. `previewOnLight` is deliberately local to the
  // drawer — it swaps only the preview surface, unlike the app-wide isLightTheme.
  // Get Started now asks how to begin before opening anything: build from scratch, or
  // import what you already have. The per-source checklist links still go straight to
  // the engine — those name one specific source, so a choice would be wrong there.
  const [startChoice, setStartChoice] = useState(false);
  const [scratchWizard, setScratchWizard] = useState(false);
  const [toggledTokenFolders, setToggledTokenFolders] = useState(() => new Set());
  const [previewComponentId, setPreviewComponentId] = useState(null);
  // Which token's dependents are showing. Shares the rail with previewComponentId, so
  // opening either closes the other rather than stacking two panels over the table.
  const [usageTokenName, setUsageTokenName] = useState(null);
  // Which ramp folder is being renamed, and what has been typed so far.
  const [renamingRamp, setRenamingRamp] = useState(null);
  // What the last refactor did, or why it was refused. Shown under the toolbar.
  const [refactorNote, setRefactorNote] = useState(null);
  const [expandedUsage, setExpandedUsage] = useState(() => new Set());
  const [previewOnLight, setPreviewOnLight] = useState(false);
  const previewDrawerRef = useRef(null);

  // Handoff state variables
  const [rampModalOpen, setRampModalOpen] = useState(false);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handoff dynamic states
  const [activeHandoffSubTab, setActiveHandoffSubTab] = useState('connect');
  const [activeBrandSubTab, setActiveBrandSubTab] = useState('identity');
  const [projectVisibility, setProjectVisibility] = useState(project?.visibility || 'Private');
  const [syncToken, setSyncToken] = useState(project?.syncToken || 'pt_live_' + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18));

  const handleVisibilityChange = (visibility) => {
    setProjectVisibility(visibility);
    updateProject(id, { visibility });
  };

  const handleGenerateSyncToken = () => {
    const newToken = 'pt_live_' + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
    setSyncToken(newToken);
    updateProject(id, { syncToken: newToken });
    alert('New sync token generated successfully! Remember to update your downstream environments.');
  };
  
  // State from project — migrated and merged into Brand / Semantic / Component layers
  const [activeTokens, setActiveTokens] = useState(() => {
    return migrateTokensToLayers(project?.tokens);
  });
  const [components, setComponents] = useState(() => {
    return Array.isArray(project?.components) ? project.components : [];
  });
  const [suggestion, setSuggestion] = useState(null);

  // Asset model states
  const [uploadedAssets, setUploadedAssets] = useState([]);

  // Undo/redo over design content only — tokens, components, brand, assets. Project
  // settings (name, visibility, members) stay out: undoing "removed a teammate" with a
  // keystroke is a different kind of promise than undoing a colour.
  //
  // Declared up here, above this component's early return, because everything below it is
  // conditional and a hook there crashes the page.
  const [history, setHistory] = useState({ past: [], future: [] });
  const [brandBibleDirty, setBrandBibleDirty] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [selectedImpacts, setSelectedImpacts] = useState({ tokens: {}, components: {} });
  const [impactPanelTab, setImpactPanelTab] = useState('brandBible');
  const [suggestionsModalData, setSuggestionsModalData] = useState(null);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Sync uploaded assets & dirty flag from project context
  React.useEffect(() => {
    if (project) {
      if (Array.isArray(project.uploadedAssets)) {
        setUploadedAssets(project.uploadedAssets);
      } else {
        const defaultAssets = [
          { id: '1', name: 'Brandbook_v1.pdf', type: 'PDF Document', size: '2.4 MB', date: '2026-05-15', visibility: 'Team' },
          { id: '2', name: 'logo_dark.svg', type: 'SVG Vector', size: '12 KB', date: '2026-05-16', visibility: 'Public link' }
        ];
        setUploadedAssets(defaultAssets);
        updateProject(project.id, { uploadedAssets: defaultAssets });
      }
      if (project.brandBibleDirty !== undefined) {
        setBrandBibleDirty(project.brandBibleDirty);
      }
    }
  }, [project]);

  // Bump the header's "Saved" timestamp whenever token/component/brand content actually changes
  const skipNextSaveStamp = useRef(true);
  useEffect(() => {
    if (skipNextSaveStamp.current) { skipNextSaveStamp.current = false; return; }
    setLastSavedAt(new Date());
  }, [activeTokens, components, brandData]);

  const [generatedAssetsVisibility, setGeneratedAssetsVisibility] = useState(() => {
    return project?.generatedAssetsVisibility || {
      brandBible: 'Public link',
      css: 'Public link',
      json: 'Team',
      react: 'Private'
    };
  });

  const updateGeneratedAssetVisibility = (assetKey, val) => {
    const updated = { ...generatedAssetsVisibility, [assetKey]: val };
    setGeneratedAssetsVisibility(updated);
    updateProject(id, { generatedAssetsVisibility: updated });
  };

  const updateUploadedAssets = (newAssets) => {
    setUploadedAssets(newAssets);
    updateProject(id, { uploadedAssets: newAssets });
  };

  const downloadTextFile = (filename, text) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getReactThemeText = () => {
    return `import React, { createContext, useContext } from 'react';

// Strata Generated Theme Provider
const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: '${brandData?.primaryColor || '#FC0694'}',
      secondary: '${brandData?.secondaryColor || '#1A1A24'}',
      accent: '${brandData?.accentColor || '#3B82F6'}',
      background: '${activeTokens.Color?.find(t => t.name === 'brand.color.background')?.value || '#0D0D12'}',
      surface: '${activeTokens.Color?.find(t => t.name === 'brand.color.surface')?.value || '#13131A'}',
    },
    typography: {
      headingFont: '${brandData?.headingFont || 'Outfit'}',
      bodyFont: '${brandData?.bodyFont || 'Inter'}',
    },
    spacing: {
      tight: '${activeTokens.Spacing?.find(t => t.name === 'space.tight')?.value || '8px'}',
      comfortable: '${activeTokens.Spacing?.find(t => t.name === 'space.comfortable')?.value || '16px'}',
      loose: '${activeTokens.Spacing?.find(t => t.name === 'space.loose')?.value || '32px'}',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
`;
  };

  // UI interaction states
  const [activeDropdown, setActiveDropdown] = useState(null); // token.name
  const [tokenModal, setTokenModal] = useState(null); // { mode: 'add'|'edit', token?, category }
  const [componentModal, setComponentModal] = useState(null); // { mode: 'add'|'edit', component? }
  const [editingTokenName, setEditingTokenName] = useState(null);
  const [editingTokenValue, setEditingTokenValue] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => new Set());

  // Keep the Settings tab's name draft in sync once the project loads
  React.useEffect(() => {
    if (project) {
      setProjectNameDraft(project.name);
    }
  }, [project?.id, project?.name]);

  // Escape, or a click outside it, closes the Component Preview drawer.
  // A `mousedown` listener rather than a backdrop element: a backdrop would
  // swallow the click, so switching straight to another component would take
  // two clicks. This way the drawer closes and the new row's click still
  // lands, so it just swaps. On mobile the drawer fills the screen, so there
  // is no "outside" to hit and this never fires there.
  React.useEffect(() => {
    if (!previewComponentId) return;
    const onKey = (e) => { if (e.key === 'Escape') setPreviewComponentId(null); };
    const onDown = (e) => {
      if (previewDrawerRef.current && !previewDrawerRef.current.contains(e.target)) {
        setPreviewComponentId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [previewComponentId]);

  // A snapshot is a shallow grab of the four pieces of design state. Shallow is enough
  // because every mutation path already builds new objects rather than mutating in place —
  // updateTokensState and friends spread, they never push.
  const designSnapshot = () => ({
    tokens: activeTokens,
    components,
    brandData,
    uploadedAssets,
  });

  const applyDesignSnapshot = (snap) => {
    setActiveTokens(snap.tokens);
    setComponents(snap.components);
    setBrandData(snap.brandData);
    setUploadedAssets(snap.uploadedAssets || []);
    // One write, so a reader can never catch the project half-restored.
    updateProject(id, {
      tokens: snap.tokens,
      components: snap.components,
      brand: snap.brandData,
      uploadedAssets: snap.uploadedAssets || [],
    });
  };

  /**
   * Every design edit goes through here: the state before the edit is pushed onto the
   * stack, then the edit is applied. `next` carries only the pieces that changed.
   *
   * A new action clears the redo branch, which is what keeps the history a line rather
   * than a tree — redoing after a fresh edit would reapply something that no longer
   * follows from what is on screen.
   */
  const commitDesign = (label, next, explicitBefore) => {
    // An explicit baseline matters for the impact-panel flow: handleEditToken applies its
    // edit to state optimistically so the panel can show what would move, so by the time
    // applyChange runs, "now" is already the edited state. Undoing to that would undo
    // nothing. The pre-edit snapshot is captured before the optimistic apply instead.
    const before = explicitBefore || designSnapshot();
    setHistory(h => ({
      past: [...h.past, { label, state: before }].slice(-HISTORY_LIMIT),
      future: [],
    }));
    applyDesignSnapshot({ ...before, ...next });
  };

  // A dialog or inline editor left open over a restored value would be editing something
  // that no longer exists. The two rails guard themselves — each returns null for a token
  // or component it cannot find — so only the modal ones need closing.
  const closeEditorsForHistory = () => {
    setTokenModal(null);
    setComponentModal(null);
    setRenamingRamp(null);
    setEditingTokenName(null);
  };

  const undo = () => {
    if (history.past.length === 0) return;
    const entry = history.past[history.past.length - 1];
    // Captured before anything moves, so redo returns to exactly what undo left.
    const current = designSnapshot();
    // The updater stays pure: applying a snapshot writes to the project, and React is free
    // to run an updater more than once.
    setHistory(h => ({
      past: h.past.slice(0, -1),
      future: [{ label: entry.label, state: current }, ...h.future].slice(0, HISTORY_LIMIT),
    }));
    applyDesignSnapshot(entry.state);
    closeEditorsForHistory();
    setShowUndoToast(false);
  };

  const redo = () => {
    if (history.future.length === 0) return;
    const entry = history.future[0];
    const current = designSnapshot();
    setHistory(h => ({
      past: [...h.past, { label: entry.label, state: current }].slice(-HISTORY_LIMIT),
      future: h.future.slice(1),
    }));
    applyDesignSnapshot(entry.state);
    closeEditorsForHistory();
  };

  // Ctrl+Z / Ctrl+Y and the Mac equivalents. Ctrl+Shift+Z redoes as well, because that is
  // what many people reach for.
  //
  // Skipped entirely while focus is in a field: mid-typing, Ctrl+Z means "undo my typing",
  // and this app commits inline edits on Enter or blur, so until then the keystroke
  // belongs to the input.
  React.useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = String(e.key || '').toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      if (isTyping()) return;
      e.preventDefault();
      if (key === 'y' || e.shiftKey) redo(); else undo();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // No dependency array on purpose: these handlers close over the history and the
    // current design state, and a stale closure would undo to the wrong snapshot.
    // Rebinding one listener per render costs less than that bug.
  });

  // Arriving from the create flow with a path already chosen. The create page makes the
  // project and hands the choice over in route state, so the wizard is running by the time
  // the project opens rather than waiting behind Get Started.
  //
  // Up here on purpose: this file's early return is below, and a hook after it has crashed
  // the page twice. It works out because the setters it needs are declared above too, so it
  // never has to reach for openBrandEngine, which is defined further down.
  React.useEffect(() => {
    const setup = location.state && location.state.setup;
    if (!setup) return;
    if (setup === 'engine') setEngine({ step: 1, source: null });
    else if (setup === 'scratch') setScratchWizard(true);
    // Consumed. Without this, a reload or a Back would reopen a wizard already dismissed.
    navigate(location.pathname, { replace: true });
  }, [location.state, location.pathname, navigate]);

  // Registering the tab on mount covers every way into a project — the list, a freshly created
  // one, a pasted deep link, the branch switcher — rather than scattering openTab across callers.
  React.useEffect(() => {
    if (!project || !hydrated) return;
    openTab(id);
    markOpened(id);
  }, [id, project, hydrated, openTab, markOpened]);

  // Restore the remembered section. Two cases: a fresh page load, where the store only
  // becomes readable once TabsProvider has hydrated (so the initial useState fell back to
  // 'brand'), and an in-app switch to another project, where the id changes.
  const restoredForRef = React.useRef(null);
  // Set when a restore is queued. The write effect below runs in the same commit and would
  // still see the pre-restore activeTab, persisting it over the value just read back.
  const skipSectionWriteRef = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated || restoredForRef.current === id) return;
    restoredForRef.current = id;
    const remembered = sectionFor(id);
    if (remembered && remembered !== activeTab) {
      skipSectionWriteRef.current = true;
      setActiveTab(remembered);
    }
  }, [id, hydrated, sectionFor, activeTab]);

  // Remember where the user was, so returning to a tab is continuous. Gated on hydration,
  // or the mount default would be written over the stored value before it is read back.
  React.useEffect(() => {
    if (!hydrated || !project || restoredForRef.current !== id) return;
    if (skipSectionWriteRef.current) { skipSectionWriteRef.current = false; return; }
    setSection(id, activeTab);
  }, [id, hydrated, project, activeTab, setSection]);

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

  // Helper functions for state synchronization. Both route through commitDesign, so every
  // token and component edit in the app lands on the undo stack without each of the
  // fourteen call sites having to remember to.
  const updateTokensState = (newTokens, label = 'Token change') => {
    commitDesign(label, { tokens: newTokens });
  };

  const updateComponentsState = (newComponents, label = 'Component change') => {
    commitDesign(label, { components: newComponents });
  };

  // State actions for tokens
  const handleAddToken = (category, token) => {
    const updated = {
      ...activeTokens,
      [category]: [...(activeTokens[category] || []), token]
    };
    updateTokensState(updated, 'Add ' + token.name);
  };

  // Adds many tokens (e.g. a batch from the token-upload table) in one state
  // update — calling handleAddToken in a loop would have every iteration read
  // the same stale `activeTokens` closure and only the last token would stick.
  const handleAddTokens = (tokens) => {
    const updated = { ...activeTokens };
    for (const token of tokens) {
      const category = getCategoryForType(token.type);
      updated[category] = [...(updated[category] || []), token];
    }
    updateTokensState(updated, 'Add ' + tokens.length + ' tokens');
  };

  const handleEditToken = (category, originalName, updatedToken) => {
    const originalToken = activeTokens[category]?.find(t => t.name === originalName);

    setPendingChange({
      type: 'token',
      category,
      originalName,
      updatedToken,
      originalToken,
      oldValue: originalToken?.value,
      newValue: updatedToken.value,
      // The state as it stands before the optimistic apply below. applyChange uses this as
      // the undo baseline, so Ctrl+Z returns to the value you started from.
      snapshotBefore: designSnapshot(),
      label: 'Edit ' + originalName,
    });

    let updated = { ...activeTokens };
    const originalCategory = getCategoryForType(originalToken?.type) || category;
    const newCategory = getCategoryForType(updatedToken.type);

    if (originalCategory === newCategory) {
      updated[category] = activeTokens[category].map(t => t.name === originalName ? updatedToken : t);
    } else {
      updated[originalCategory] = activeTokens[originalCategory].filter(t => t.name !== originalName);
      updated[newCategory] = [...(activeTokens[newCategory] || []), updatedToken];
    }
    setActiveTokens(updated);
  };

  const handleDeleteToken = (category, name) => {
    const updated = {
      ...activeTokens,
      [category]: activeTokens[category].filter(t => t.name !== name)
    };
    updateTokensState(updated, 'Delete ' + name);
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
    updateComponentsState([...components, newComp], 'Add ' + (newComp.name || 'component'));
  };

  // Adds many components (e.g. a batch of regions detected from one design
  // screenshot) in one state update — calling handleAddComponent in a loop
  // would have every iteration read the same stale `components` closure and
  // only the last one would stick. Each item also needs its own unique id:
  // String(Date.now()) per item in a tight synchronous loop can collide.
  const handleAddComponents = (comps) => {
    const newComps = comps.map((c, i) => ({ id: `${Date.now()}-${i}`, ...c }));
    updateComponentsState([...components, ...newComps], 'Add ' + newComps.length + ' components');
  };

  const handleEditComponent = (updatedComp) => {
    updateComponentsState(
      components.map(c => c.id === updatedComp.id ? updatedComp : c),
      'Edit ' + (updatedComp.name || 'component'),
    );
  };

  // Deleting has to repair references, not just drop the row: a deleted parent's mappings
  // are flattened into its children so they keep their appearance, and a deleted child is
  // removed from every fragment holding it. See removeComponents.
  const handleDeleteComponent = (compId) => {
    const name = components.find(c => c.id === compId)?.name;
    updateComponentsState(removeComponents(components, [compId]), 'Delete ' + (name || 'component'));
    setSelectedComponentIds(prev => { const next = new Set(prev); next.delete(compId); return next; });
    setPreviewComponentId(prev => (prev === compId ? null : prev));
  };

  const handleDeleteComponents = (compIds) => {
    const ids = new Set(compIds);
    updateComponentsState(removeComponents(components, compIds), 'Delete ' + ids.size + ' components');
    setSelectedComponentIds(new Set());
    setPreviewComponentId(prev => (ids.has(prev) ? null : prev));
  };

  // Recursive token value resolver for references (e.g. {brand.color.primary})
  //
  // `seen` guards against an alias loop. Two tokens pointing at each other used to recurse
  // until the stack gave out, and because every row resolves its own value that blanked the
  // whole Tokens tab rather than spoiling one row. getTokenInheritanceChain below has always
  // capped its walk; this is the same protection, by the reference already visited.
  const resolveTokenValue = (tokenValueOrName, seen) => {
    if (!tokenValueOrName) return '';
    let val = String(tokenValueOrName).trim();

    const visited = seen || new Set();
    // Back where we started: hand back the reference rather than following it again. A
    // cyclic token has no value to resolve to, and saying so beats crashing the page.
    if (visited.has(val)) return val;
    visited.add(val);

    // Check if it's a token name directly (legacy mappings)
    if (!val.startsWith('{')) {
      for (const cat in activeTokens) {
        const found = activeTokens[cat]?.find(t => t.name === val);
        if (found) return resolveTokenValue(found.value, visited);
      }
    }
    
    // Check if it's a bracketed reference
    const match = val.match(/^\{(.+)\}$/);
    if (match) {
      const refName = match[1];
      for (const cat in activeTokens) {
        const found = activeTokens[cat]?.find(t => t.name === refName);
        if (found) return resolveTokenValue(found.value, visited);
      }
    }
    
    return val;
  };

  const getTokenInheritanceChain = (tokenNameOrValue) => {
    const chain = [];
    if (!tokenNameOrValue) return chain;
    let currentVal = String(tokenNameOrValue).trim();
    
    // If it's a name, find the token first
    if (!currentVal.startsWith('{') && !currentVal.startsWith('#') && !/^\d/.test(currentVal)) {
      for (const cat in activeTokens) {
        const found = activeTokens[cat]?.find(t => t.name === currentVal);
        if (found) {
          chain.push(found.name);
          currentVal = found.value;
          break;
        }
      }
    }

    let iterations = 0;
    while (iterations < 10) { // prevent infinite loop
      iterations++;
      const match = currentVal.match(/^\{(.+)\}$/);
      if (!match) {
        chain.push(currentVal);
        break;
      }
      
      const refName = match[1];
      chain.push(refName);
      
      let foundToken = null;
      for (const cat in activeTokens) {
        foundToken = activeTokens[cat]?.find(t => t.name === refName);
        if (foundToken) break;
      }
      
      if (foundToken) {
        currentVal = foundToken.value;
      } else {
        chain.push(`Unresolved: ${refName}`);
        break;
      }
    }
    return chain;
  };

  // Components keyed by id — what the inheritance and composition helpers take. Plain
  // derivation, not a hook, so it sits safely below the loading guards above.
  const componentsById = indexById(components);

  // Deliberately not a useMemo. ProjectDetail has an early return below and has crashed
  // twice on a hook placed after it; componentsById above is a plain const for the same
  // reason. One pass over ~170 tokens is not worth the risk.
  const tokenUsage = buildUsageIndex(activeTokens, components);

  // The two rails take turns. Opening one closes the other, so the table is never behind
  // two panels, and the expansion state resets rather than carrying over to another token.
  // A rename changes tokens *and* components, and they must land together — two writes
  // would be two states a reader could catch in between. One updateProject is the honest
  // representation of one refactor.
  const commitRefactor = ({ tokens, components: nextComponents }, label = 'Ramp change') => {
    commitDesign(label, nextComponents ? { tokens, components: nextComponents } : { tokens });
  };

  // Neither of these goes through handleEditToken: it repairs no references and does not
  // persist, so using it here would leave every alias pointing at a name that had moved.
  const commitRampRename = (role, typed) => {
    setRenamingRamp(null);
    const slug = slugifyRole(typed);
    // Nothing typed, or the same name back — a cancel, not an error.
    if (!slug || slug === role) return;

    const result = renameRamp(activeTokens, components, role, typed);
    if (!result.ok) {
      if (result.reason !== 'unchanged') setRefactorNote({ kind: 'error', text: result.reason });
      return;
    }
    commitRefactor(result, 'Rename ramp to ' + result.role);
    // The rail may be showing a name that no longer exists.
    setUsageTokenName(null);
    setRefactorNote({
      kind: 'ok',
      text: 'Renamed ' + result.renamed + ' tokens'
        + (result.repaired ? ' and repaired ' + result.repaired + ' reference' + (result.repaired === 1 ? '' : 's') : '')
        + '.',
    });
  };

  const commitRampColor = (role, hex) => {
    const result = recolorRamp(activeTokens, role, hex);
    if (!result.ok) {
      if (result.reason !== 'unchanged') setRefactorNote({ kind: 'error', text: result.reason });
      return;
    }
    commitRefactor({ tokens: result.tokens }, 'Recolour ' + role + ' ramp');
    setRefactorNote({
      kind: 'ok',
      text: 'Rebuilt ' + result.changed + ' steps'
        + (result.kept.length
          ? ' · ' + result.kept.join(', ') + ' kept because you had edited '
            + (result.kept.length === 1 ? 'it' : 'them')
          : '')
        + '.',
    });
  };

  const openUsage = (name) => {
    setPreviewComponentId(null);
    setExpandedUsage(new Set());
    setUsageTokenName(prev => (prev === name ? null : name));
  };

  // Turns a component's whole `tokens` map into a resolved React style object,
  // so any CSS property the user mapped (not just the original six) actually
  // shows up in the live preview.
  // The one place a component's tokens become a style, so inheritance resolves here and
  // every preview — rail, drawer, shared view — gets it without changes of its own.
  // A style row shows a specimen and a size/line-height summary. Every part is resolved
  // through the tokens themselves, so the row can only ever say what the tokens say — an
  // unresolvable part is simply absent rather than filled in with a plausible number.
  const styleSpecimen = (subgroup) => {
    const part = (which) => {
      const t = (subgroup.tokens || []).find(x => styleOf(x.name)?.part === which);
      return t ? resolveTokenValue(t.value) : '';
    };
    return {
      family: part('family'),
      size: part('size'),
      lineHeight: part('line-height'),
      weight: part('weight'),
    };
  };

  const resolveMappedStyle = (comp) => {
    const out = {};
    for (const [key, tokenName] of Object.entries(effectiveTokens(comp, componentsById))) {
      if (!tokenName) continue;
      const resolved = resolveTokenValue(tokenName);
      if (!resolved) continue;
      out[cssPropToStyleKey(cssPropForTokenKey(key))] = resolved;
    }
    return out;
  };

  // Live Component Preview Renderer. Every template lives in componentPreviews.jsx,
  // shared with the public shared-project view so both draw the same set. The mapped
  // style is resolved here, generically, from whatever CSS properties the user mapped.
  // Depth-capped: a fragment cycle that somehow got stored must not recurse forever.
  const renderLivePreview = (comp, depth = 0) =>
    renderComponentPreview(comp, resolveMappedStyle(comp), {
      onButtonClick: () => alert(`${comp.name} clicked!`),
      children: isFragment(comp) && depth < 6
        ? childrenOf(comp, componentsById).map(kid => (
            <React.Fragment key={kid.id}>{renderLivePreview(kid, depth + 1)}</React.Fragment>
          ))
        : undefined,
    });

  /**
   * The same preview, for a row's thumbnail rather than the rail.
   *
   * Two differences, both because this now runs once per visible row instead of once for
   * the selected component: no click handler (a tile that popped an alert would be absurd,
   * and the tile is pointer-events:none anyway), and a much shallower fragment recursion —
   * two levels reads fine at 120x64 and six would not.
   */
  const renderThumbPreview = (comp, depth = 0) =>
    renderComponentPreview(comp, resolveMappedStyle(comp), {
      onButtonClick: () => {},
      children: isFragment(comp) && depth < 2
        ? childrenOf(comp, componentsById).map(kid => (
            <React.Fragment key={kid.id}>{renderThumbPreview(kid, depth + 1)}</React.Fragment>
          ))
        : undefined,
    });

  const handlePrintBrandBible = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      alert('Please allow popups to download the PDF preview.');
      return;
    }
    
    const toneBadges = (brandData?.toneKeywords || []).map(k => 
      `<span style="background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 100px; font-size: 13px; font-weight: 500; margin-right: 6px; display: inline-block;">${k}</span>`
    ).join('');

    const manifestoHtml = (brandData?.manifesto || '')
      .replace(/^## (.*)$/gm, '<h2 style="font-size: 24px; color: #1e293b; margin-top: 24px; margin-bottom: 12px; font-family: ' + brandData?.headingFont + ', sans-serif;">$1</h2>')
      .replace(/^### (.*)$/gm, '<h3 style="font-size: 18px; color: #334155; margin-top: 18px; margin-bottom: 8px; font-family: ' + brandData?.headingFont + ', sans-serif;">$1</h3>')
      .replace(/^\* (.*)$/gm, '<li style="margin-bottom: 6px;">$1</li>')
      .replace(/^\d\.\s\*\*(.*)\*\*:\s(.*)$/gm, '<li style="margin-bottom: 8px;"><strong>$1</strong>: $2</li>')
      .replace(/\n\n/g, '</p><p style="line-height: 1.6; color: #475569; font-size: 15px; margin-bottom: 12px;">')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Brand Bible - ${project?.name || 'Strata'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;800;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: '${brandData?.bodyFont || 'Inter'}', 'Inter', sans-serif;
              color: #1e293b;
              background: #ffffff;
              padding: 40px;
              margin: 0;
            }
            h1, h2, h3 {
              font-family: '${brandData?.headingFont || 'Outfit'}', 'Outfit', sans-serif;
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
              font-family: '${brandData?.headingFont || 'Outfit'}', sans-serif;
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
            <div class="logo-box">S<span style="color: ${brandData?.primaryColor || '#FC0694'}">.</span></div>
          </div>
          
          <div class="section">
            ${manifestoHtml.startsWith('<h2') || manifestoHtml.startsWith('<p') ? manifestoHtml : '<p>' + manifestoHtml + '</p>'}
          </div>

          <div class="section">
            <h2 style="font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">Visual Identity</h2>
            
            <h3 style="font-size: 16px; color: #475569; margin-bottom: 10px;">Color Palette</h3>
            <div class="color-grid">
              <div class="color-card">
                <div class="color-swatch" style="background: ${brandData?.primaryColor || '#FC0694'}"></div>
                <div class="color-info">
                  <div class="color-title">Primary Color</div>
                  <div class="color-hex">${(brandData?.primaryColor || '#FC0694').toUpperCase()}</div>
                </div>
              </div>
              <div class="color-card">
                <div class="color-swatch" style="background: ${brandData?.secondaryColor || '#1A1A24'}"></div>
                <div class="color-info">
                  <div class="color-title">Secondary Color</div>
                  <div class="color-hex">${(brandData?.secondaryColor || '#1A1A24').toUpperCase()}</div>
                </div>
              </div>
              <div class="color-card">
                <div class="color-swatch" style="background: ${brandData?.accentColor || '#3B82F6'}"></div>
                <div class="color-info">
                  <div class="color-title">Accent Color</div>
                  <div class="color-hex">${(brandData?.accentColor || '#3B82F6').toUpperCase()}</div>
                </div>
              </div>
            </div>

            <h3 style="font-size: 16px; color: #475569; margin-top: 25px; margin-bottom: 10px;">Typography System</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div class="font-preview">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Headings Font</div>
                <div style="font-family: '${brandData?.headingFont || 'Outfit'}', sans-serif; font-size: 24px; font-weight: 700;">${brandData?.headingFont || 'Outfit'}</div>
                <div style="font-family: '${brandData?.headingFont || 'Outfit'}', sans-serif; font-size: 14px; color: #475569; margin-top: 5px;">The quick brown fox jumps over the lazy dog.</div>
              </div>
              <div class="font-preview">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Body Font</div>
                <div style="font-family: '${brandData?.bodyFont || 'Inter'}', sans-serif; font-size: 24px; font-weight: 400;">${brandData?.bodyFont || 'Inter'}</div>
                <div style="font-family: '${brandData?.bodyFont || 'Inter'}', sans-serif; font-size: 14px; color: #475569; margin-top: 5px;">The quick brown fox jumps over the lazy dog.</div>
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
              <p style="font-size: 15px; line-height: 1.6; margin: 0; color: #334155;">${brandData?.voice || ''}</p>
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

  const handleBrandUpdate = (field, value) => {
    const originalValue = brandData[field];
    
    setPendingChange({
      type: 'brand',
      field,
      oldValue: originalValue,
      newValue: value
    });

    // Update local state instantly so UI is responsive
    const newData = { ...brandData, [field]: value };
    setBrandData(newData);

    // Sync to local activeTokens immediately for real-time visual feedback
    const syncTokenLocally = (category, name, val) => {
      setActiveTokens(prev => ({
        ...prev,
        [category]: prev[category]?.map(t => t.name === name ? { ...t, value: val } : t) || []
      }));
    };
    if (field === 'primaryColor') syncTokenLocally('Color', 'brand.color.primary', value);
    if (field === 'secondaryColor') syncTokenLocally('Color', 'brand.color.secondary', value);
    if (field === 'accentColor') syncTokenLocally('Color', 'brand.color.accent', value);
    if (field === 'headingFont') syncTokenLocally('Typography', 'brand.font.heading', value);
    if (field === 'bodyFont') syncTokenLocally('Typography', 'brand.font.body', value);

    // --- Intelligent Suggestion Engine ---
    if (field === 'primaryColor') {
      if (value.toLowerCase().includes('yellow') || value === '#FACC15') {
        setSuggestion({
          message: 'Bright primary colors often benefit from an "Energetic" tone. Update tone?',
          newValue: ['Energetic', 'Lively', 'Modern'],
          originalField: 'toneKeywords'
        });
      }
    }

    if (field === 'toneKeywords' && value.includes('Calm')) {
      setSuggestion({
        message: 'A "Calm" tone pairs well with soft blues. Update Primary Color to #60A5FA?',
        newValue: '#60A5FA',
        originalField: 'primaryColor'
      });
    }

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
      [category]: activeTokens[category]?.map(t => t.name === name ? { ...t, value } : t) || []
    };
    updateTokensState(updated);
  };

  // --- Downstream Impact Calculations ---

  const getProposedState = (change) => {
    let proposedBrand = { ...brandData };
    let proposedTokens = JSON.parse(JSON.stringify(activeTokens));

    if (!change) return { brandData: proposedBrand, tokens: proposedTokens };

    if (change.type === 'brand') {
      proposedBrand[change.field] = change.newValue;
      
      const field = change.field;
      const value = change.newValue;
      const updateTokenInProposed = (category, name, val) => {
        if (proposedTokens[category]) {
          proposedTokens[category] = proposedTokens[category].map(t => 
            t.name === name ? { ...t, value: val } : t
          );
        }
      };
      if (field === 'primaryColor') updateTokenInProposed('Color', 'brand.color.primary', value);
      if (field === 'secondaryColor') updateTokenInProposed('Color', 'brand.color.secondary', value);
      if (field === 'accentColor') updateTokenInProposed('Color', 'brand.color.accent', value);
      if (field === 'headingFont') updateTokenInProposed('Typography', 'brand.font.heading', value);
      if (field === 'bodyFont') updateTokenInProposed('Typography', 'brand.font.body', value);
    } else if (change.type === 'token') {
      const { category, originalName, updatedToken } = change;
      if (proposedTokens[category]) {
        const originalCategory = getCategoryForType(proposedTokens[category].find(t => t.name === originalName)?.type) || category;
        const newCategory = getCategoryForType(updatedToken.type) || originalCategory;

        if (originalCategory === newCategory) {
          proposedTokens[originalCategory] = proposedTokens[originalCategory].map(t => 
            t.name === originalName ? updatedToken : t
          );
        } else {
          proposedTokens[originalCategory] = proposedTokens[originalCategory].filter(t => t.name !== originalName);
          proposedTokens[newCategory] = [...(proposedTokens[newCategory] || []), updatedToken];
        }
      }
    }

    return { brandData: proposedBrand, tokens: proposedTokens };
  };

  const getBrandBibleImpact = (change) => {
    const sections = [];
    if (!change) return sections;
    
    if (change.type === 'brand') {
      const field = change.field;
      if (field === 'manifesto') {
        sections.push({ name: 'Brand Overview > Manifesto', description: 'Updates the brand mission statement.' });
      } else if (field === 'toneKeywords' || field === 'voice') {
        sections.push({ name: 'Tone & Voice Guidelines', description: 'Updates brand personality traits and speaking style.' });
      } else if (field === 'primaryColor' || field === 'secondaryColor' || field === 'accentColor') {
        sections.push({ name: 'Visual Identity > Color Palette', description: 'Regenerates brand color swatches and values.' });
      } else if (field === 'headingFont' || field === 'bodyFont') {
        sections.push({ name: 'Visual Identity > Typography Systems', description: 'Updates primary and secondary font families.' });
      } else if (field === 'websiteUrl' || field === 'figmaUrl') {
        sections.push({ name: 'Source References', description: 'Updates website or design file links in the Brand Bible.' });
      }
    } else if (change.type === 'token') {
      const cat = change.category;
      if (cat === 'Color') {
        sections.push({ name: 'Visual Identity > Color Palette', description: 'Regenerates brand color swatches and values.' });
        sections.push({ name: 'Component Tokens > Color Mappings', description: 'Updates component-level color mappings.' });
      } else if (cat === 'Typography') {
        sections.push({ name: 'Visual Identity > Typography Systems', description: 'Updates primary and secondary font families.' });
        sections.push({ name: 'Component Tokens > Type Scales', description: 'Updates typography scale ranges.' });
      } else if (cat === 'Spacing') {
        sections.push({ name: 'Visual Identity > Spacing Scale', description: 'Updates grid spacing values.' });
      } else if (cat === 'Border') {
        sections.push({ name: 'Visual Identity > Shape & Borders', description: 'Updates border radius and line values.' });
      } else if (cat === 'Shadow') {
        sections.push({ name: 'Visual Identity > Shadow & Depth', description: 'Updates depth elevations.' });
      } else if (cat === 'Motion') {
        sections.push({ name: 'Visual Identity > Motion & Transitions', description: 'Updates animations and timing functions.' });
      }
    }
    return sections;
  };

  const resolveValueInStore = (tokenValueOrName, store) => {
    if (!tokenValueOrName) return '';
    let val = String(tokenValueOrName).trim();
    
    if (!val.startsWith('{')) {
      for (const cat in store) {
        const found = store[cat]?.find(t => t.name === val);
        if (found) return resolveValueInStore(found.value, store);
      }
    }
    
    const match = val.match(/^\{(.+)\}$/);
    if (match) {
      const refName = match[1];
      for (const cat in store) {
        const found = store[cat]?.find(t => t.name === refName);
        if (found) return resolveValueInStore(found.value, store);
      }
    }
    return val;
  };

  const computeImpact = (change) => {
    if (!change) return { brandBible: [], tokens: [], components: [] };
    
    const brandBible = getBrandBibleImpact(change);
    const { brandData: proposedBrand, tokens: proposedTokens } = getProposedState(change);
    
    const affectedTokens = [];
    const affectedComponents = [];
    
    for (const cat in activeTokens) {
      activeTokens[cat]?.forEach(t => {
        if (change.type === 'token' && t.name === change.originalName) return;
        
        if (change.type === 'brand') {
          if (change.field === 'primaryColor' && t.name === 'brand.color.primary') return;
          if (change.field === 'secondaryColor' && t.name === 'brand.color.secondary') return;
          if (change.field === 'accentColor' && t.name === 'brand.color.accent') return;
          if (change.field === 'headingFont' && t.name === 'brand.font.heading') return;
          if (change.field === 'bodyFont' && t.name === 'brand.font.body') return;
        }
        
        const resolvedOld = resolveValueInStore(t.name, activeTokens);
        const resolvedNew = resolveValueInStore(t.name, proposedTokens);
        
        if (resolvedOld !== resolvedNew) {
          const path = [change.type === 'token' ? change.originalName : change.field, t.name];
          affectedTokens.push({
            name: t.name,
            category: cat,
            oldValue: resolvedOld,
            newValue: resolvedNew,
            path
          });
        }
      });
    }
    
    components.forEach(comp => {
      const changedProps = [];
      if (comp.tokens) {
        for (const prop in comp.tokens) {
          const val = comp.tokens[prop];
          if (!val) continue;
          const resolvedOld = resolveValueInStore(val, activeTokens);
          const resolvedNew = resolveValueInStore(val, proposedTokens);
          if (resolvedOld !== resolvedNew) {
            changedProps.push({
              prop,
              oldValue: resolvedOld,
              newValue: resolvedNew,
              tokenRef: val
            });
          }
        }
      }
      if (changedProps.length > 0) {
        affectedComponents.push({
          id: comp.id,
          name: comp.label || comp.name,
          template: comp.template,
          changedProps
        });
      }
    });
    
    return { brandBible, tokens: affectedTokens, components: affectedComponents };
  };

  const applyChange = (acceptedImpacts) => {
    // No separate snapshot here any more: commitDesign below pushes the pre-change state
    // onto the shared history, and the toast's Undo runs that same stack. Capturing a
    // second copy is what left this function calling a setter that no longer exists.
    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 30000);

    const { brandData: proposedBrand, tokens: proposedTokens } = getProposedState(pendingChange);
    const impact = computeImpact(pendingChange);

    let finalBrand = { ...proposedBrand };
    
    let finalTokens = JSON.parse(JSON.stringify(proposedTokens));
    impact.tokens.forEach(tok => {
      const isAccepted = acceptedImpacts?.tokens?.[tok.name] !== false;
      if (!isAccepted) {
        for (const cat in finalTokens) {
          const index = finalTokens[cat]?.findIndex(t => t.name === tok.name);
          if (index !== -1) {
            finalTokens[cat][index].value = tok.oldValue;
            break;
          }
        }
      }
    });

    let finalComponents = JSON.parse(JSON.stringify(components));
    impact.components.forEach(compImpact => {
      const isAccepted = acceptedImpacts?.components?.[compImpact.id] !== false;
      const compIndex = finalComponents.findIndex(c => c.id === compImpact.id);
      if (compIndex !== -1) {
        if (!isAccepted) {
          compImpact.changedProps.forEach(propChange => {
            if (finalComponents[compIndex].tokens) {
              finalComponents[compIndex].tokens[propChange.prop] = propChange.oldValue;
            }
          });
        }
      }
    });

    // One entry on the shared stack, so the toast's Undo and Ctrl+Z are the same action
    // rather than a one-shot snapshot that could disagree with a stack that had moved on.
    commitDesign(
      pendingChange.label || 'Apply brand changes',
      { tokens: finalTokens, components: finalComponents, brandData: finalBrand },
      pendingChange.snapshotBefore,
    );

    setBrandBibleDirty(true);
    updateProject(id, { brandBibleDirty: true });

    setPendingChange(null);
  };

  const cancelChange = () => {
    if (!pendingChange) return;

    if (pendingChange.type === 'brand') {
      const field = pendingChange.field;
      const oldVal = pendingChange.oldValue;
      
      setBrandData(prev => ({ ...prev, [field]: oldVal }));

      const syncTokenLocally = (category, name, val) => {
        setActiveTokens(prev => ({
          ...prev,
          [category]: prev[category]?.map(t => t.name === name ? { ...t, value: val } : t) || []
        }));
      };
      if (field === 'primaryColor') syncTokenLocally('Color', 'brand.color.primary', oldVal);
      if (field === 'secondaryColor') syncTokenLocally('Color', 'brand.color.secondary', oldVal);
      if (field === 'accentColor') syncTokenLocally('Color', 'brand.color.accent', oldVal);
      if (field === 'headingFont') syncTokenLocally('Typography', 'brand.font.heading', oldVal);
      if (field === 'bodyFont') syncTokenLocally('Typography', 'brand.font.body', oldVal);
      
    } else if (pendingChange.type === 'token') {
      let reverted = { ...activeTokens };
      const currentCategory = getCategoryForType(pendingChange.updatedToken.type);
      const originalCategory = getCategoryForType(pendingChange.originalToken.type) || pendingChange.category;

      if (currentCategory === originalCategory) {
        reverted[originalCategory] = reverted[originalCategory].map(t => 
          t.name === pendingChange.updatedToken.name ? pendingChange.originalToken : t
        );
      } else {
        reverted[currentCategory] = reverted[currentCategory].filter(t => t.name !== pendingChange.updatedToken.name);
        reverted[originalCategory] = [...(reverted[originalCategory] || []), pendingChange.originalToken];
      }
      setActiveTokens(reverted);
    }
    
    setPendingChange(null);
  };

  // Still the toast's handler, but it is the stack's undo now — one history and one
  // action, so the toast can never restore a snapshot the stack has already moved past.
  const handleUndo = () => {
    setShowUndoToast(false);
    undo();
  };

  const getCSSVariablesText = () => {
    let cssText = `:root {\n`;
    for (const cat in activeTokens) {
      activeTokens[cat]?.forEach(t => {
        const varName = `--${t.name.replace(/\./g, '-')}`;
        cssText += `  ${varName}: ${t.value};\n`;
      });
    }
    cssText += `}`;
    // A motion.enter.* token's value is a keyframes name, so the keyframes have to ship
    // with it — otherwise the exported variable resolves to a name that does nothing.
    cssText += nlnl + entranceKeyframesCss();
    return cssText;
  };

  const getDTCGJsonText = () => {
    const dtcg = {
      "$schema": "https://tr.designtokens.org/format/",
    };
    for (const cat in activeTokens) {
      const catKey = cat.toLowerCase();
      dtcg[catKey] = {};
      activeTokens[cat]?.forEach(t => {
        const parts = t.name.split('.');
        let current = dtcg;
        parts.forEach((part, i) => {
          if (i === parts.length - 1) {
            current[part] = { "$value": t.value, "$type": t.type };
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        });
      });
    }
    return JSON.stringify(dtcg, null, 2);
  };

  const getFigmaVariablesText = () => {
    const variables = [];
    for (const cat in activeTokens) {
      activeTokens[cat]?.forEach(t => {
        variables.push({
          name: t.name.replace(/\./g, '/'),
          type: t.type === 'color' ? 'COLOR' : 'FLOAT',
          value: t.value
        });
      });
    }
    return `// Figma API Endpoint: POST /v1/files/file_key/variables\n` + 
           JSON.stringify({
             variableCollections: [
               { name: "Global", modes: ["Default"] }
             ],
             variables: variables.map(v => ({
               name: v.name,
               type: v.type,
               valuesByMode: { "Default": v.value }
             }))
           }, null, 2);
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

  // Branches always point at the true root project, so a branch-of-a-branch
  // still shows up as a sibling in the root's branch switcher.
  const branchRootId = project?.branchOf || project?.id;
  const projectBranchName = project?.branchName || 'main';
  const branchSiblings = projects.filter(p => p.branchOf === branchRootId && String(p.id) !== String(id));
  const branchRoot = project?.branchOf ? projects.find(p => String(p.id) === String(branchRootId)) : null;

  const handleBranchProject = () => {
    if (!project) return;
    const branched = addProject({
      title: `${project.name} (Branch)`,
      description: project.description,
      color: project.color,
      websiteUrl: project.websiteUrl,
      figmaUrl: project.figmaUrl,
      brand: brandData,
      tokens: activeTokens,
      components,
      branchOf: branchRootId,
      branchName: `branch-${String(Date.now()).slice(-4)}`,
    });
    navigate(`/projects/${branched.id}`);
  };

  // The tree shows every type and layer at once, so search is the only filter left.
  const tokenTableSearchLower = tokenTableSearch.trim().toLowerCase();
  const matchesTokenSearch = (t) => !tokenTableSearchLower
    || [t.name, t.value, t.type].some(v => String(v).toLowerCase().includes(tokenTableSearchLower));
  const visibleTokens = Object.fromEntries(
    TOKEN_TYPES.map(({ id }) => [id, (activeTokens[id] || []).filter(matchesTokenSearch)])
  );
  const visibleTokenCount = Object.values(visibleTokens).reduce((n, list) => n + list.length, 0);
  const tokenTotal = Object.values(activeTokens || {})
    .reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);

  // Folders toggled away from their default: a type opens when it holds tokens, so the
  // four empty ones do not pad the page; a layer inside an open type defaults to open.
  // Folders are stored as "toggled away from their default", so collapsing or
  // expanding everything means naming exactly the folders whose default is the
  // opposite of what is wanted — not just emptying the set.
  // Second-tier keys come from the category's own grouping rule, so Colour contributes
  // its role folders and everything else contributes its tiers. A stale key list here
  // would leave Collapse all half-finished.
  const tokenFolderKeys = TOKEN_TYPES.flatMap(({ id }) => [
    { key: id, defaultOpen: (activeTokens[id] || []).length > 0 },
    ...groupsFor(id, activeTokens[id] || []).flatMap(g => [
      { key: id + '/' + g.key, defaultOpen: true },
      // A style is a third tier, and it starts shut: nine styles of four tokens would
      // otherwise bury the type scale under thirty-six rows.
      ...(g.subgroups || []).map(sg => ({ key: id + '/' + g.key + '/' + sg.key, defaultOpen: false })),
    ]),
  ]);
  const anyTokenFolderOpen = tokenFolderKeys.some(
    ({ key, defaultOpen }) => (toggledTokenFolders.has(key) ? !defaultOpen : defaultOpen)
  );
  const setAllTokenFolders = (open) => setToggledTokenFolders(
    new Set(tokenFolderKeys.filter(k => k.defaultOpen !== open).map(k => k.key))
  );

  const toggleTokenFolder = (key) => setToggledTokenFolders(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Brand Bible shows its onboarding card until at least one real brand source exists.
  // Read from `project`, not `brandData` — that one fills in invented defaults (#FC0694,
  // Outfit) the moment a project loads, so it is never empty and cannot be the test.
  // The read-only route resolves real projects (SharedProject looks them up in ProjectContext
  // before falling back to mock data), so this is a working link rather than a placeholder.
  const copyShareLink = async () => {
    const url = window.location.origin + '/explore/' + id;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch (e) {
      // clipboard needs a secure context and permission; still let the user get the URL
      window.prompt('Copy this link', url);
    }
  };

  const completeness = getBrandCompleteness(project);

  // The onboarding card is only for a project with nothing at all in it. Previously this read
  // only the applied `brand` fields, so a project whose brand-context sources were filled in
  // but not yet applied was still told to "Get Started" — hiding the work already done.
  const hasBrandContext = completeness.done > 0 || Boolean(
    project?.brand?.primaryColor || project?.brand?.logoPreview ||
    project?.websiteUrl || project?.figmaUrl ||
    (project?.brand?.toneKeywords || []).length > 0
  );

  // Opens the Brand Context Engine. Two entry points remain: Get Started on the empty Brand
  // Bible card, and the Add/Edit link on each brand-context checklist row.
  // Components are chosen on step 3, not step 1, so that checklist row jumps straight there.
  const ENGINE_STEP_FOR_ITEM = { components: 3 };
  const openBrandEngine = (source = null) => setEngine({
    step: ENGINE_STEP_FOR_ITEM[source] || 1,
    source: ENGINE_STEP_FOR_ITEM[source] ? null : source,
  });

  // Which tokens the inspector offers for a property. Same rule the component editor
  // uses: the property's token bucket via getCategoryForType, so `gap` offers Spacing
  // tokens and `background-color` offers Color ones.
  const getTokenNamesForProperty = (cssProp) => {
    const list = activeTokens?.[getCategoryForType(cssProp)];
    return Array.isArray(list) ? list.map(t => t.name).filter(Boolean) : [];
  };

  // Starter-set tokens for a property that this project does not have yet. Offered in
  // the inspector so a fresh project is not a wall of "No tokens yet" with the only way
  // forward being to leave for the Tokens page.
  // Which token types suit a property when nothing matches it exactly. A bucket is too
  // coarse on its own — Motion holds durations, easings and animation names, so offering
  // the whole bucket for `animation-name` suggested `brand.duration.fast`, which cannot
  // be an animation name.
  const COMPATIBLE_TOKEN_TYPES = (cssProp) => {
    if (/-duration$/.test(cssProp)) return ['duration'];
    if (/^(padding|margin|gap|row-gap|column-gap)/.test(cssProp)) return ['spacing'];
    if (/^(min-|max-)?(width|height)$/.test(cssProp)) return ['width', 'height'];
    if (/^(border|outline)-radius$|^border-radius$/.test(cssProp)) return ['borderRadius'];
    if (/color$|^fill$|^stroke$/.test(cssProp)) return ['color'];
    if (/^font-family$/.test(cssProp)) return ['fontFamily'];
    if (/^font-size$/.test(cssProp)) return ['fontSize'];
    if (/shadow$/.test(cssProp)) return ['shadow'];
    return [];
  };

  const getPresetTokensForProperty = (cssProp) => {
    const category = getCategoryForType(cssProp);
    const have = new Set((activeTokens?.[category] || []).map(t => t.name));
    const pool = (MOCK_TOKENS[category] || []).filter(t => t.name && !have.has(t.name));
    const want = normalizeTypeKey(cssProp);
    // an exact type match is always the right answer
    const exact = pool.filter(t => normalizeTypeKey(t.type) === want);
    if (exact.length) return exact;
    const compat = COMPATIBLE_TOKEN_TYPES(cssProp).map(normalizeTypeKey);
    const near = compat.length ? pool.filter(t => compat.includes(normalizeTypeKey(t.type))) : [];
    return near.length ? near : pool;
  };

  // Creates a token and hands back its name so the caller can map it in the same action.
  // A name that already exists is mapped rather than duplicated.
  const createTokenForProperty = (cssProp, token) => {
    const category = getCategoryForType(cssProp);
    const existing = (activeTokens?.[category] || []).some(t => t.name === token.name);
    if (!existing) {
      handleAddToken(category, {
        // The property itself is a valid token type and round-trips through
        // getCategoryForType, so it beats the bucket's default — which typed a `gap`
        // token as `flex-direction`.
        type: cssProp,
        layer: 'Component',
        ...token,
      });
    }
    return token.name;
  };

  // Every token name in the project, so the inline form can refuse a duplicate.
  const allTokenNames = () => Object.values(activeTokens || {})
    .flatMap(list => (Array.isArray(list) ? list.map(t => t.name) : []));

  const saveBrandContext = (brandContext) => updateProject(id, { brandContext });

  // Commits the engine's Step 5 preview. Uses the batch helpers on purpose — the singular
  // handleAddToken/handleAddComponent read state from a closure and would drop all but the
  // last when called in a loop.
  const applyBrandContext = ({ brand, tokens, components: comps }) => {
    const nextBrand = { ...(project.brand || {}) };
    Object.entries(brand || {}).forEach(([k, v]) => {
      if (Array.isArray(v) ? v.length : v) nextBrand[k] = v;
    });
    updateProject(id, { brand: nextBrand });
    setBrandData(prev => ({ ...(prev || {}), ...nextBrand }));
    if (tokens?.length) handleAddTokens(tokens);
    if (comps?.length) handleAddComponents(comps);
    setEngine(null);
  };

  // Appearance row for the profile menu. There are three renderings of that panel, so this
  // keeps them from drifting — and mobile keeps a way to switch themes now that the header
  // icon is gone (that icon was hidden under 768px anyway).
  const renderThemeMenuItem = () => (
    <button
      className="pd-theme-menu-item"
      onClick={() => { setIsLightTheme(p => !p); document.body.classList.toggle('light-theme'); }}
      style={{ ...menuItemStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem' }}>{isLightTheme ? '🌙' : '☀️'}</span>
        {isLightTheme ? 'Dark mode' : 'Light mode'}
      </span>
      <span style={{
        width: '30px', height: '16px', borderRadius: '999px', flexShrink: 0,
        background: isLightTheme ? 'var(--bg-tertiary)' : 'var(--accent)',
        border: '1px solid var(--border)', position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: '1px', left: isLightTheme ? '2px' : '15px',
          width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s',
        }} />
      </span>
    </button>
  );

  // Shared main-tab button list — rendered in the desktop sidebar, the mobile icon
  // rail (icon-only), and the mobile nav overlay (icon + label, like desktop).
  // Collaboration and Branch & Publish sit below a divider in the design, so the list is
  // rendered with a rule inserted before the first of them.
  const SIDEBAR_DIVIDER_BEFORE = 'collaboration';

  const renderMainTabButtons = () => MAIN_TABS.filter(tab => canViewTab(myRole, tab.id)).map(tab => (
    <React.Fragment key={tab.id}>
    {tab.id === SIDEBAR_DIVIDER_BEFORE && (
      <div className="pd-sidebar-divider" style={{ height: '1px', background: 'var(--border)', margin: '0.6rem 0.3rem' }} />
    )}
    <button
      className={`pd-sidebar-tab-btn${activeTab === tab.id ? ' pd-sidebar-tab-btn-active' : ''}`}
      title={tab.label}
      onClick={() => {
        setActiveTab(tab.id);
        setMobileNavExpanded(false);
        // Entering Components closes any open preview, so the tab is not a no-op when
        // a drawer is already showing. Folders keep their own collapsed state.
        if (tab.id === 'components') setPreviewComponentId(null);
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
        background: activeTab === tab.id ? 'var(--accent-glow)' : 'none',
        border: 'none', borderRadius: '8px',
        padding: '0.55rem 0.7rem', marginBottom: '0.15rem',
        color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 400,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      {tab.icon}
      <span className="pd-sidebar-tab-label">{tab.label}</span>
    </button>
    </React.Fragment>
  ));

  // One token row. Rendered inside its type → layer folder, so `rowType` is the folder's
  // type rather than a single global "active" category — which also means Edit, Duplicate
  // and Delete always act on the right bucket.
  const renderTokenRow = (token, rowType, typeIcon, isLast, nested = false) => {
                const displayValue = editingTokenName === token.name ? editingTokenValue : token.value;
                const resolvedPreviewValue = resolveTokenValue(displayValue);
                const previewToken = { ...token, value: resolvedPreviewValue };
                const isAlias = String(displayValue).trim().startsWith('{');
                const chain = getTokenInheritanceChain(displayValue);

                return (
                  <div
                    key={token.name}
                    className="pd-token-row"
                    style={{
                      display: 'grid', gridTemplateColumns: TOKEN_TABLE_COLS,
                      gap: '0.75rem', alignItems: 'center',
                      padding: '0.55rem 1rem',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => openUsage(token.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openUsage(token.name); }
                    }}
                  >
                    <span
                      className={'pd-tree-name-cell' + (nested ? ' pd-tree-child-name' : '')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}
                    >
                      <span style={{ display: 'flex', color: 'var(--accent)', flexShrink: 0 }}>{typeIcon}</span>
                      {/* The tier the layer folder used to announce. It stopped being a level
                          you navigate through, so it says its piece here instead. */}
                      <span
                        title={(TOKEN_LAYER_LABELS[token.layer] || token.layer || 'Scoped') + ' token'}
                        style={{
                          width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                          background: layerColorFor(token.layer),
                        }}
                      />
                      {/* A ramp step reads as just its step — the folder above already says
                          Primary, and eleven `color.primary.*` in a column is noise. The full
                          name stays on hover and in the kebab. */}
                      <span
                        title={token.name}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >{rowLabelFor(rowType, token)}</span>
                      {/* Only where being unreferenced is a defect: a semantic or scoped
                          token exists to be referenced. Generated palette and scale members
                          are exempt — see isDeadToken. */}
                      {isDeadToken(token, tokenUsage) && (
                        <span
                          title={'Nothing references ' + token.name + ' yet'}
                          style={{
                            flexShrink: 0, fontSize: '0.58rem', textTransform: 'uppercase',
                            letterSpacing: '0.04em', color: '#F59E0B',
                            border: '1px solid rgba(245,158,11,0.35)', borderRadius: '100px',
                            padding: '0.05rem 0.3rem',
                          }}
                        >
                          unused
                        </span>
                      )}
                    </span>
                    <div
                      className={!isAlias && COLOR_VALUE_TYPES.has(token.type) ? 'pd-token-row-value-duplicate' : undefined}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {editingTokenName === token.name ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingTokenValue}
                          onChange={(e) => setEditingTokenValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            handleEditToken(rowType, token.name, { ...token, value: editingTokenValue });
                            setEditingTokenName(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditToken(rowType, token.name, { ...token, value: editingTokenValue });
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
                      ) : isAlias ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingTokenName(token.name);
                              setEditingTokenValue(token.value);
                            }}
                            title={`Inheritance Path: ${chain.join(' ➔ ')}\nDouble click to edit alias`}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              color: 'var(--accent)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.8 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                            {token.value}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                            Resolves to: <strong style={{ color: 'var(--text-secondary)' }}>{resolvedPreviewValue}</strong>
                          </span>
                        </div>
                      ) : (
                        <span
                          onDoubleClick={() => {
                            setEditingTokenName(token.name);
                            setEditingTokenValue(token.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                    {/* Live Visual Preview column */}
                    <div className="pd-token-preview-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      {renderTokenPreview(previewToken)}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="pd-token-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(String(resolvedPreviewValue));
                            setCopiedToken(token.name);
                            setTimeout(() => setCopiedToken(prev => prev === token.name ? null : prev), 1200);
                          }}
                          style={{
                            display: 'none', alignItems: 'center', gap: '0.35rem',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '0.4rem 0.6rem', color: 'var(--text-tertiary)',
                            fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          {copiedToken === token.name ? 'Copied!' : 'Copy'}
                        </button>

                        {/* 3-Dot Action Dropdown */}
                        {can(myRole, 'tokens', 'edit') && (
                        <div className="pd-token-row-actions" style={{ position: 'relative' }}>
                          <button
                            className={'pd-tree-row-kebab' + (activeDropdown === token.name ? ' is-open' : '')}
                            title={'Actions for ' + token.name}
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
                                  // Above the mobile token-type bar (z-index 150),
                                  // which this menu would otherwise open behind.
                                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                  zIndex: 160, background: 'transparent',
                                }}
                              />
                              <div style={{
                                position: 'absolute', top: '100%', right: 0,
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                borderRadius: '8px', padding: '0.25rem', minWidth: '120px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 161,
                                display: 'flex', flexDirection: 'column', gap: '0.1rem',
                              }}>
                                <button
                                  onClick={() => {
                                    openUsage(token.name);
                                    setActiveDropdown(null);
                                  }}
                                  style={menuItemStyle}
                                >
                                  Usages
                                </button>
                                <button
                                  onClick={() => {
                                    setTokenModal({ mode: 'edit', token, category: rowType });
                                    setActiveDropdown(null);
                                  }}
                                  style={menuItemStyle}
                                >
                                  Edit Token
                                </button>
                                <button
                                  onClick={() => {
                                    handleDuplicateToken(rowType, token);
                                    setActiveDropdown(null);
                                  }}
                                  style={menuItemStyle}
                                >
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${token.name}"?`)) {
                                      handleDeleteToken(rowType, token.name);
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
                        )}
                      </div>
                    </div>

                    {/* Description (mobile card only) */}
                    {token.description && (
                      <span className="pd-token-row-desc" style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {token.description}
                      </span>
                    )}
                  </div>
                );
  };

  // Collapse/expand every folder in a tree. Shared by Tokens and Components so the
  // two pages offer the same control in the same place.
  const collapseAllBtn = (anyOpen, onToggle, what) => (
    <button
      type="button"
      onClick={onToggle}
      title={anyOpen ? 'Collapse all ' + what : 'Expand all ' + what}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
        marginLeft: 'auto',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.45rem 0.7rem', cursor: 'pointer',
        color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'inherit',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {anyOpen
          ? <><polyline points="4 9 12 3 20 9" /><polyline points="4 21 12 15 20 21" /></>
          : <><polyline points="4 3 12 9 20 3" /><polyline points="4 15 12 21 20 15" /></>}
      </svg>
      {anyOpen ? 'Collapse all' : 'Expand all'}
    </button>
  );

  // Components sidebar: a search box over a collapsible tree of components
  // grouped by kind, with the open component highlighted.
  // Folder glyph for the tree. Open and closed states so a row reads at a glance.
  // The chevron beside it already shows open or closed, so the folder glyph
  // itself stays the same in both states.
  const folderIcon = (size = 13) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 7a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.4.6L11.4 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );

  // Components carry their own glyph so a leaf never reads as another folder.
  const componentIcon = (size = 12) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--tabstrip-h, 0px))', marginTop: 'var(--tabstrip-h, 0px)', background: 'var(--bg)' }}>

      {/* ── App Top Bar ── */}
      <header className="pd-header" style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0 1.5rem', height: '52px', flexShrink: 0,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Last saved timestamp */}
        <span className="pd-header-saved" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          Saved {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>

        {/* Undo / redo. In the header rather than a tab's toolbar because Ctrl+Z works
            everywhere, and a control that only exists on the Components tab would make
            the shortcut look tab-specific. The tooltip names the action, because after a
            few edits the useful question is what exactly is about to come back. */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          {[
            { on: history.past.length > 0, label: history.past.length ? history.past[history.past.length - 1].label : null,
              act: undo, verb: 'Undo', keys: 'Ctrl+Z',
              d: 'M20 20v-7a4 4 0 00-4-4H4', poly: '9 14 4 9 9 4' },
            { on: history.future.length > 0, label: history.future.length ? history.future[0].label : null,
              act: redo, verb: 'Redo', keys: 'Ctrl+Y',
              d: 'M4 20v-7a4 4 0 014-4h12', poly: '15 14 20 9 15 4' },
          ].map(b => (
            <button
              key={b.verb}
              type="button"
              onClick={b.act}
              disabled={!b.on}
              title={b.on ? b.verb + ': ' + b.label + '  (' + b.keys + ')' : 'Nothing to ' + b.verb.toLowerCase()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', borderRadius: '6px', border: 'none',
                background: 'none', padding: 0,
                color: b.on ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                cursor: b.on ? 'pointer' : 'not-allowed', opacity: b.on ? 1 : 0.4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={b.poly} /><path d={b.d} />
              </svg>
            </button>
          ))}
        </span>

        {/* Branch selector */}
        {/* Sync button */}
        <button
          className="pd-header-sync"
          onClick={() => setBrandBibleDirty(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent-glow)', border: '1px solid rgba(252,6,148,0.25)',
            borderRadius: '6px', padding: '0.4rem 0.875rem',
            color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          <span className="pd-btn-label">{brandBibleDirty ? 'Sync' : 'Synced'}</span>
        </button>

        <div style={{ flex: 1 }} />

        <span className="pd-header-live-dot" style={{
          display: 'none', width: '10px', height: '10px', borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0,
        }} />

        <div className="pd-header-branch" style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBranchMenu(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', border: '1px solid #333',
              borderRadius: '6px', padding: '0.4rem 0.75rem',
              color: '#eee', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <img src={branchIcon} alt="" width="14" height="14" />
            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectBranchName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showBranchMenu && (
            <>
              <div onClick={() => setShowBranchMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'transparent' }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '200px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '0.375rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 201,
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.375rem 0.625rem' }}>Branches</div>
                {branchRoot && (
                  <button onClick={() => { navigate(`/projects/${branchRoot.id}`); setShowBranchMenu(false); }} style={menuItemStyle}>
                    main
                  </button>
                )}
                {!project.branchOf && (
                  <button style={{ ...menuItemStyle, color: 'var(--accent)', cursor: 'default' }}>
                    main (current)
                  </button>
                )}
                {branchSiblings.map(sib => (
                  <button key={sib.id} onClick={() => { navigate(`/projects/${sib.id}`); setShowBranchMenu(false); }} style={menuItemStyle}>
                    {sib.branchName || sib.id}
                  </button>
                ))}
                {project.branchOf && (
                  <button style={{ ...menuItemStyle, color: 'var(--accent)', cursor: 'default' }}>
                    {projectBranchName} (current)
                  </button>
                )}
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                <button onClick={() => { handleBranchProject(); setShowBranchMenu(false); }} style={menuItemStyle}>
                  + New branch from here
                </button>
              </div>
            </>
          )}
        </div>

        {/* Share — export, invite teammates, or copy a link. .pd-export-btn on the wrapper
            keeps the existing mobile hide behaviour. */}
        <div className="pd-export-btn" style={{ position: 'relative' }}>
          <button
            onClick={() => setShowShareMenu(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0.4rem 0.875rem',
              color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="pd-btn-label">Share</span>
          </button>

          {showShareMenu && (
            <>
              {/* transparent backdrop closes the menu, same as the branch selector */}
              <div onClick={() => setShowShareMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'transparent' }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '260px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '0.375rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 201,
              }}>
                <button
                  style={menuItemStyle}
                  onClick={() => { setActiveTab('handoff'); setShowShareMenu(false); }}
                >
                  Export design system
                </button>

                <button
                  style={menuItemStyle}
                  onClick={() => { setActiveTab('collaboration'); setInviteModalOpen(true); setShowShareMenu(false); }}
                >
                  Invite users
                </button>

                <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />

                <button style={menuItemStyle} onClick={copyShareLink}>
                  {shareCopied ? 'Link copied' : 'Copy view-only link'}
                </button>

                {/* There is no backend, so say what the link can and cannot do */}
                <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '0.25rem 0.75rem 0.5rem' }}>
                  Opens the read-only view of this project. It resolves for people whose browser
                  already has it — there is no server behind the link yet.
                </p>
              </div>
            </>
          )}
        </div>


        {/* Publish — the primary action, so it closes the row */}
        <button
          className="pd-header-publish"
          onClick={() => setActiveTab('branch')}
          title={brandBibleDirty ? 'You have unpublished changes' : 'Publish this design system'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent)', border: '1px solid var(--accent)',
            borderRadius: '6px', padding: '0.4rem 0.875rem',
            color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="pd-btn-label">Publish</span>
          {brandBibleDirty && (
            <span title="Unpublished changes" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', opacity: 0.9 }} />
          )}
        </button>

        {/* Avatar */}
        <div className="pd-header-avatar" style={{ position: 'relative' }}>
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

              {renderThemeMenuItem()}
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.375rem 0' }} />
              <button onClick={() => { navigate('/projects'); setShowUserMenu(false); }} style={menuItemStyle}>
                My projects
              </button>
              {canViewTab(myRole, 'settings') && (
                <button onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }} style={menuItemStyle}>
                  Settings
                </button>
              )}
              <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }} style={{ ...menuItemStyle, color: '#EF4444' }}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="pd-shell" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <aside className={'pd-sidebar' + (sidebarCollapsed ? ' is-collapsed' : '')} style={{
          flexShrink: 0,
          background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '1rem 0',
          overflowY: 'auto',
        }}>
          {/* Mobile-only: expand the icon rail into a labeled overlay menu */}
          <button
            className="pd-mobile-nav-toggle"
            title="Expand menu"
            onClick={() => setMobileNavExpanded(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          {/* Desktop-only collapse toggle. Mobile has a permanent rail and its own
              .pd-mobile-nav-toggle, so this is hidden there. */}
          <button
            className="pd-sidebar-collapse-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              {sidebarCollapsed
                ? <polyline points="13 9 16 12 13 15" />
                : <polyline points="16 9 13 12 16 15" />}
            </svg>
          </button>

          {/* Tabs */}
          <div className="pd-sidebar-tabs" style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
            {renderMainTabButtons()}
          </div>

          {/* Rail-only bottom actions (mobile icon rail) */}
          <div className="pd-sidebar-rail-bottom">
            <button
              className="pd-rail-btn pd-rail-btn-ghost"
              title="Branch this project"
              onClick={handleBranchProject}
            >
              <img src={branchIcon} alt="" width="16" height="16" />
            </button>
            <button
              className="pd-rail-btn"
              title="Export"
              onClick={() => {}}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button
              className="pd-rail-btn pd-rail-btn-accent"
              title="Sync"
              onClick={() => {}}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="pd-rail-avatar"
                title={user?.name || 'Account'}
                onClick={() => setShowUserMenu(p => !p)}
              >
                {user?.initials || 'U'}
              </button>
              {showUserMenu && (
                <>
                  <div
                    onClick={() => setShowUserMenu(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'transparent' }}
                  />
                  <div style={{
                    position: 'fixed', bottom: '0.75rem', left: '60px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '0.375rem', minWidth: '160px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 201,
                  }}>
                    <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{user?.email}</div>
                    </div>
                    {renderThemeMenuItem()}
                    <button onClick={() => { navigate('/projects'); setShowUserMenu(false); }} style={menuItemStyle}>
                      My projects
                    </button>
                    {canViewTab(myRole, 'settings') && (
                      <button onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }} style={menuItemStyle}>
                        Settings
                      </button>
                    )}
                    <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }} style={{ ...menuItemStyle, color: '#EF4444' }}>
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Token TYPE categories in sidebar */}

        </aside>

        {/* Mobile-only: expanded nav overlay (icon rail → full labeled menu) */}
        {mobileNavExpanded && (
          <>
            <div className="pd-mobile-nav-backdrop" onClick={() => setMobileNavExpanded(false)} />
            <div className="pd-mobile-nav-overlay">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Menu</span>
                <button
                  onClick={() => setMobileNavExpanded(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="pd-sidebar-tabs" style={{ padding: '0 0.75rem', marginBottom: '1.25rem' }}>
                {renderMainTabButtons()}
              </div>

              {/* Categories aren't duplicated here — they live in the inline
                  "Browse" card on the page itself, so the same tree isn't
                  rendered three times off one shared expand/collapse state. */}

              {/* Branch selector / Sync / Export / Account — bottom of the full menu */}
              <div className="pd-mobile-nav-bottom">
                <div style={{ position: 'relative', width: '100%' }}>
                  <button
                    onClick={() => setShowBranchMenu(p => !p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                      background: 'transparent', border: '1px solid #333',
                      borderRadius: '6px', padding: '0.5rem 0.75rem',
                      color: '#eee', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <img src={branchIcon} alt="" width="14" height="14" />
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectBranchName}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showBranchMenu && (
                    <>
                      <div onClick={() => setShowBranchMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'transparent' }} />
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '10px', padding: '0.375rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 311,
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.375rem 0.625rem' }}>Branches</div>
                        {branchRoot && (
                          <button onClick={() => { navigate(`/projects/${branchRoot.id}`); setShowBranchMenu(false); }} style={menuItemStyle}>
                            main
                          </button>
                        )}
                        {!project.branchOf && (
                          <button style={{ ...menuItemStyle, color: 'var(--accent)', cursor: 'default' }}>
                            main (current)
                          </button>
                        )}
                        {branchSiblings.map(sib => (
                          <button key={sib.id} onClick={() => { navigate(`/projects/${sib.id}`); setShowBranchMenu(false); }} style={menuItemStyle}>
                            {sib.branchName || sib.id}
                          </button>
                        ))}
                        {project.branchOf && (
                          <button style={{ ...menuItemStyle, color: 'var(--accent)', cursor: 'default' }}>
                            {projectBranchName} (current)
                          </button>
                        )}
                        <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                        <button onClick={() => { handleBranchProject(); setShowBranchMenu(false); }} style={menuItemStyle}>
                          + New branch from here
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setBrandBibleDirty(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                    background: 'var(--accent-glow)', border: '1px solid rgba(252,6,148,0.25)',
                    borderRadius: '6px', padding: '0.5rem 0.75rem',
                    color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                  {brandBibleDirty ? 'Sync' : 'Synced'}
                </button>

                <button
                  onClick={() => { setActiveTab('handoff'); setMobileNavExpanded(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '0.5rem 0.75rem',
                    color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>

                <div style={{ position: 'relative', width: '100%' }}>
                  <button
                    onClick={() => setShowUserMenu(p => !p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: '0.25rem', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent)', color: '#fff',
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.65rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {user?.initials || 'U'}
                    </span>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.name || 'Account'}
                    </span>
                  </button>
                  {showUserMenu && (
                    <>
                      <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'transparent' }} />
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '10px', padding: '0.375rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 311,
                      }}>
                        <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{user?.email}</div>
                        </div>
                        {renderThemeMenuItem()}
                        <button onClick={() => { navigate('/projects'); setShowUserMenu(false); }} style={menuItemStyle}>
                          My projects
                        </button>
                        {canViewTab(myRole, 'settings') && (
                          <button onClick={() => { setActiveTab('settings'); setShowUserMenu(false); setMobileNavExpanded(false); }} style={menuItemStyle}>
                            Settings
                          </button>
                        )}
                        <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }} style={{ ...menuItemStyle, color: '#EF4444' }}>
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Main Content ── */}
        <main
          className={'pd-main' + (previewComponentId || usageTokenName ? ' has-inspector' : '')}
          style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}
        >


          {/* Brand Bible onboarding — replaces the whole tab until a brand source exists */}
          {activeTab === 'brand' && !hasBrandContext && (
            <div style={{ maxWidth: '1200px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent-glow) 0%, var(--bg-secondary) 55%)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '2.5rem',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                  color: 'var(--accent)', borderRadius: '100px',
                  padding: '0.3rem 0.85rem', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>✨ Brand Context Engine</span>

                <h2 style={{ fontSize: '1.9rem', fontWeight: 700, margin: '1.25rem 0 0.85rem', color: 'var(--text-primary)' }}>
                  Setup your Brand Context
                </h2>

                <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '46rem', margin: 0 }}>
                  Define your brand identity using descriptions, logo assets, website links, Figma
                  variables, or JSON tokens. Strata's AI will parse these sources to extract colors,
                  typography, and automatically bootstrap your design system tokens and component specs.
                </p>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.9rem', marginBottom: 0 }}>
                  {completeness.done} of {completeness.total} provided &middot; add any of it whenever you like.
                </p>

                <button
                  onClick={() => setStartChoice(true)}
                  className="btn btn-primary"
                  style={{
                    marginTop: '1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.7rem 1.5rem', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 600,
                  }}
                >
                  Get Started
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'brand' && hasBrandContext && (
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

              {/* Setup progress — what is still outstanding, and where to go for it */}
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Brand context</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {completeness.done} of {completeness.total} &middot; {completeness.percent}%
                  </span>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.35rem 0 1.1rem' }}>
                  {completeness.done === completeness.total
                    ? 'Everything is filled in. You can change any of it at any time.'
                    : 'Nothing here is required. Fill in whatever you have, whenever you have it.'}
                </p>

                <div className="pd-setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem' }}>
                  {completeness.items.map(item => (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.75rem', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: item.done ? 'var(--accent)' : 'transparent',
                        border: item.done ? 'none' : '1.5px solid var(--text-tertiary)',
                        color: '#fff',
                      }}>
                        {item.done && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: 'block', fontSize: '0.8rem',
                          color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                        }}>
                          {item.label}
                        </span>
                        {/* What was actually provided — read from stored data, never a placeholder */}
                        {item.done && item.summary && (
                          <span style={{
                            display: 'block', fontSize: '0.72rem', color: 'var(--text-tertiary)',
                            textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                          }}>
                            {item.summary}
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => openBrandEngine(item.key)}
                        title={item.done ? 'Edit ' + item.label : item.hint}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          color: item.done ? 'var(--text-secondary)' : 'var(--accent)',
                          fontSize: '0.75rem', fontWeight: 600,
                          fontFamily: 'inherit', flexShrink: 0,
                        }}
                      >
                        {item.done ? 'Edit' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="pd-brand-subtabs" style={{
                display: 'inline-flex',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px',
                marginBottom: '2rem',
                gap: '4px',
              }}>
                {[
                  { id: 'identity', label: 'Visual Identity' },
                  { id: 'voice', label: 'Manifesto & Voice' },
                  { id: 'assets', label: 'Brand Assets & Documents' }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    className="pd-brand-subtab-btn"
                    onClick={() => setActiveBrandSubTab(subTab.id)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: activeBrandSubTab === subTab.id ? 600 : 400,
                      background: activeBrandSubTab === subTab.id ? 'var(--bg-secondary)' : 'none',
                      color: activeBrandSubTab === subTab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: activeBrandSubTab === subTab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Visual Identity */}
              {/* brandData fills in #FC0694/Outfit defaults on load, so a project whose brand
                  context has not been applied yet would show those as if they were its own. */}
              {activeBrandSubTab === 'identity' && !project?.brand?.primaryColor && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.4)',
                  borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.5rem',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: '#FACC15', flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    These are placeholder values — no brand has been applied to this project yet.
                    Run the Brand Context Engine and apply it to replace them with your own.
                  </span>
                </div>
              )}

              {activeBrandSubTab === 'identity' && (
                <div className="pd-brand-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Brand Colors card */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem 2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Brand Colors</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Configure the core brand colors. Changes here will propagate to your design tokens.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                          { label: 'Primary Color', field: 'primaryColor' },
                          { label: 'Secondary Color', field: 'secondaryColor' },
                          { label: 'Accent Color', field: 'accentColor' },
                        ].map(c => (
                          <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '0.75rem 1.25rem', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <ColorSwatchButton
                                value={brandData[c.field]}
                                onChange={(v) => handleBrandUpdate(c.field, v)}
                                disabled={!can(myRole, 'brandBible', 'edit')}
                                title={c.label}
                                against={brandData.backgroundColor || '#0D0D12'}
                              />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{brandData[c.field].toUpperCase()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Typography Card */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem 2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Typography</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Select heading and body fonts used throughout the design system.
                      </p>
                      <div className="pd-brand-minigrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Headings</span>
                          <select
                            value={project?.brand?.headingFont || ''}
                            onChange={(e) => handleBrandUpdate('headingFont', e.target.value)}
                            disabled={!can(myRole, 'brandBible', 'edit')}
                            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '6px', color: project?.brand?.headingFont ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '0.9rem', cursor: can(myRole, 'brandBible', 'edit') ? 'pointer' : 'not-allowed' }}
                          >
                            {/* Empty until a font is actually set — the old default reported
                                Outfit for projects that had never chosen one. */}
                            <option value="">Select a font</option>
                            {FONT_CHOICES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Body Font</span>
                          <select
                            value={project?.brand?.bodyFont || ''}
                            onChange={(e) => handleBrandUpdate('bodyFont', e.target.value)}
                            disabled={!can(myRole, 'brandBible', 'edit')}
                            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '6px', color: project?.brand?.bodyFont ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '0.9rem', cursor: can(myRole, 'brandBible', 'edit') ? 'pointer' : 'not-allowed' }}
                          >
                            <option value="">Select a font</option>
                            {FONT_CHOICES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Sidebar column: Logo & references */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Logo Card */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.5rem', color: '#000' }}>S<span style={{ color: brandData.primaryColor }}>.</span></span>
                      </div>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Main Brandmark</h3>
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
                        <h3 style={{ fontSize: '0.85rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Source of Truth</h3>
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
                            disabled={!can(myRole, 'brandBible', 'edit')}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Website URL</label>
                          <input
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                            value={brandData.websiteUrl}
                            onChange={(e) => handleBrandUpdate('websiteUrl', e.target.value)}
                            disabled={!can(myRole, 'brandBible', 'edit')}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub-tab 2: Manifesto & Voice */}
              {activeBrandSubTab === 'voice' && (
                <div className="pd-brand-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Manifesto Section */}
                    <section>
                      <div className="pd-manifesto-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Holistic Design Manifesto</h2>
                          <span style={{
                            fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '100px',
                            background: 'var(--accent-glow)', color: 'var(--accent)',
                            border: '1px solid rgba(252,6,148,0.2)', fontWeight: 600
                          }}>AI GENERATED</span>
                        </div>
                        <div className="pd-manifesto-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                          <button style={actionBtnStyle} onClick={() => handlePrintBrandBible()}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export PDF
                          </button>
                          <button style={actionBtnStyle} onClick={() => {
                            navigator.clipboard.writeText(brandData.manifesto);
                            alert('Manifesto copied to clipboard for Engineering Handoff!');
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            Copy for Handoff
                          </button>
                        </div>
                      </div>
                      <div style={{ 
                        background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', 
                        border: '1px solid var(--border)', lineHeight: '1.8', color: 'var(--text-secondary)',
                        fontSize: '0.95rem', position: 'relative', overflow: 'hidden'
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
                            minHeight: '280px',
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
                          readOnly={!can(myRole, 'brandBible', 'edit')}
                        />
                      </div>
                    </section>

                  </div>

                  {/* Side column: Tone keywords and voice */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Tone Keywords */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.85rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Tone Keywords</h3>
                        {can(myRole, 'brandBible', 'create') && (
                          <button
                            onClick={() => {
                              const val = prompt('Add tone keyword (e.g. Playful, Professional):');
                              if (val) handleBrandUpdate('toneKeywords', [...brandData.toneKeywords, val]);
                            }}
                            style={{ ...actionBtnStyle, fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          >+ Add</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {brandData.toneKeywords.map((keyword, i) => (
                          <div key={i} style={{ 
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                            padding: '0.3rem 0.75rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.4rem',
                            color: 'var(--text-primary)', fontSize: '0.78rem'
                          }}>
                            {keyword}
                            {can(myRole, 'brandBible', 'delete') && (
                              <button
                                onClick={() => handleBrandUpdate('toneKeywords', brandData.toneKeywords.filter((_, idx) => idx !== i))}
                                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0, display: 'flex' }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {brandData.toneKeywords.length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No keywords set</span>
                        )}
                      </div>
                    </div>

                    {/* Brand Voice Description */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>Brand Voice</h3>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <textarea
                          className="form-textarea"
                          style={{ height: '120px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
                          value={brandData.voice}
                          onChange={(e) => handleBrandUpdate('voice', e.target.value)}
                          placeholder="Describe how the brand speaks..."
                          readOnly={!can(myRole, 'brandBible', 'edit')}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub-tab 3: Brand Assets & Documents */}
              {activeBrandSubTab === 'assets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Generated Assets List & PDF Bible Preview */}
                  <div className="pd-brand-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                    
                    {/* Generated Brand Bible PDF Preview Card */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="pd-assets-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Compiled Brand Bible</h3>
                          {brandBibleDirty ? (
                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>PENDING CHANGES</span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600 }}>LIVE & SYNCED</span>
                          )}
                        </div>
                        <button
                          onClick={handlePrintBrandBible}
                          className="btn btn-secondary pd-bible-download-btn"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download PDF
                        </button>
                      </div>

                      {/* Preview Card */}
                      <div style={{ 
                        background: 'var(--bg-tertiary)', 
                        borderRadius: '16px', 
                        border: '1px solid var(--border)', 
                        height: '340px', 
                        overflowY: 'auto', 
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {/* Cover details */}
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                          <div className="pd-bible-cover-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>S<span style={{ color: brandData.primaryColor }}>.</span></span>
                            <span className="pd-bible-cover-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Strata Generated Artifact</span>
                          </div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem' }}>Core Brand Guidelines</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Always kept up-to-date with your design tokens.</p>
                        </div>
                        {/* Manifesto excerpt */}
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Manifesto Excerpt</span>
                          <p style={{ margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
                            {brandData.manifesto?.split('\n\n')?.[1]?.replace(/\*\*/g, '') || 'We believe in design that serves a purpose beyond aesthetics...'}
                          </p>
                        </div>
                        {/* Swatches */}
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Color Palette Swatches</span>
                          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                            {[
                              { name: 'Primary', color: brandData.primaryColor },
                              { name: 'Secondary', color: brandData.secondaryColor },
                              { name: 'Accent', color: brandData.accentColor }
                            ].map(swatch => (
                              <div key={swatch.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 0 90px', minWidth: '90px', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: swatch.color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}></div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{swatch.name}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{swatch.color.toUpperCase()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Fonts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Headings Font</span>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                              <div style={{ fontFamily: brandData.headingFont, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{brandData.headingFont}</div>
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Body Font</span>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                              <div style={{ fontFamily: brandData.bodyFont, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{brandData.bodyFont}</div>
                            </div>
                          </div>
                        </div>
                        {/* Keywords */}
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Tone keywords</span>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {brandData.toneKeywords?.map((k, idx) => (
                              <span key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: 'var(--text-primary)' }}>{k}</span>
                            )) || 'No keywords set'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reference Document Upload Card (from original assets sidebar) */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Reference Documents</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Upload files to serve as brand reference materials (e.g. guidelines, assets).</p>
                      </div>

                      {/* Drag and Drop File Input Area */}
                      {can(myRole, 'assets', 'upload') ? (
                      <div
                        onClick={() => document.getElementById('brand-bible-uploader').click()}
                        style={{
                          border: '2px dashed var(--border)',
                          borderRadius: '16px',
                          padding: '2.5rem 1.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: isScanningDoc ? 'rgba(252,6,148,0.03)' : 'var(--bg-tertiary)',
                          transition: 'background 0.2s, border-color 0.2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <input 
                          id="brand-bible-uploader" 
                          type="file" 
                          accept=".pdf,.docx,.doc" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsScanningDoc(true);
                              setTimeout(() => {
                                setIsScanningDoc(false);
                                setSuggestionsModalData({
                                  fileName: file.name,
                                  fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                                  primaryColor: '#1E3A8A',
                                  accentColor: '#10B981',
                                  headingFont: 'Outfit',
                                  bodyFont: 'Inter',
                                  toneKeywords: ['Innovative', 'Trustworthy', 'Sleek'],
                                  voice: 'Bold, user-centric, and technically detailed.'
                                });
                              }, 1800);
                            }
                          }}
                        />
                        
                        {isScanningDoc ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="loading-spinner" style={{ width: '28px', height: '28px', borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>AI Scan in Progress...</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Extracting colors, typography, tone & voice patterns</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: 'var(--text-tertiary)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Upload reference document</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>PDF or DOCX (max 10MB)</span>
                          </div>
                        )}
                      </div>
                      ) : (
                        <div style={{
                          border: '2px dashed var(--border)', borderRadius: '16px', padding: '2rem 1.5rem',
                          textAlign: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '0.8rem',
                        }}>
                          You don't have permission to upload reference documents.
                        </div>
                      )}

                      {/* Uploaded Reference List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Uploaded Reference Files ({uploadedAssets.length})</span>
                        {uploadedAssets.map(asset => (
                          <div key={asset.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                              <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.size} • Uploaded {asset.date}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <button 
                                onClick={() => alert(`Downloading ${asset.name}...`)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </button>
                              {can(myRole, 'assets', 'delete') && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to remove ${asset.name}?`)) {
                                      updateUploadedAssets(uploadedAssets.filter(a => a.id !== asset.id));
                                    }
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* System Generated Production Assets List (Infused from original Assets Hub) */}
                  <div className="pd-codeassets-card" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>System Generated Code Assets</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Download pre-compiled design token distribution files direct for integration.</p>
                    </div>

                    <div className="pd-brand-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      {[
                        {
                          key: 'css',
                          name: 'CSS Custom Properties',
                          desc: 'CSS variables mapping tokens directly to root.',
                          filename: 'variables.css',
                          badge: 'CSS',
                          onDownload: () => downloadTextFile(`${project?.name || 'strata'}-variables.css`, getCSSVariablesText())
                        },
                        {
                          key: 'json',
                          name: 'Design Tokens JSON',
                          desc: 'DTCG JSON format, compatible with standard style dictionaries.',
                          filename: 'tokens.json',
                          badge: 'JSON',
                          onDownload: () => downloadTextFile(`${project?.name || 'strata'}-tokens.json`, getDTCGJsonText())
                        },
                        {
                          key: 'react',
                          name: 'React Theme Provider',
                          desc: 'React Context Provider containing active token scales.',
                          filename: 'ThemeProvider.jsx',
                          badge: 'REACT',
                          onDownload: () => downloadTextFile('ThemeProvider.jsx', getReactThemeText())
                        }
                      ].map(asset => (
                        <div key={asset.key} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div className="pd-exporter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{asset.badge}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{asset.filename}</span>
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem' }}>{asset.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.3 }}>{asset.desc}</p>
                          </div>
                          <button 
                            onClick={asset.onDownload}
                            className="btn btn-secondary"
                            style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.5rem' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {activeTab === 'tokens' && (
            <>
              {!uploadBannerDismissed && (
                <UploadAnnouncementBanner
                  message="✨ New: Upload a screenshot of any UI to extract real color and typography tokens — look for the Upload Image tab when adding a token."
                  onDismiss={dismissUploadBanner}
                />
              )}
              {/* Token table header. Mirrors the Components header: the tree below carries
                  the grouping, so there is no single "active" type left to name here. */}
              <div className="pd-tokens-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      All tokens
                    </h2>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '0.15rem 0.5rem',
                    }}>
                      {tokenTotal} defined
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Colour is grouped by role; everything else by layer.
                  </span>
                  {/* What the last rename or recolour actually touched, or why it was
                      refused. A refactor across eleven tokens should not land silently. */}
                  {refactorNote && (
                    <span
                      onClick={() => setRefactorNote(null)}
                      title="Dismiss"
                      style={{
                        marginTop: '0.35rem', fontSize: '0.72rem', cursor: 'pointer',
                        color: refactorNote.kind === 'error' ? '#EF4444' : 'var(--accent)',
                      }}
                    >
                      {refactorNote.text}
                    </span>
                  )}
                </div>
                {can(myRole, 'tokens', 'create') && (
                  <div className="pd-tokens-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={actionBtnStyle} onClick={() => alert('Importing tokens... (mock)')}>Import</button>
                  </div>
                )}
              </div>

              {/* Search sits directly above the table it filters, as on Components. */}
              <div className="pd-table-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div className="pd-token-search-wrap" style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={tokenTableSearch}
                  onChange={(e) => setTokenTableSearch(e.target.value)}
                  placeholder="Search tokens..."
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '0.45rem 0.75rem 0.45rem 2rem', color: 'var(--text-primary)',
                    fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              {collapseAllBtn(anyTokenFolderOpen, () => setAllTokenFolders(!anyTokenFolderOpen), 'folders')}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                {/* Column headers */}
                <div className="pd-token-table-header" style={{
                  display: 'grid', gridTemplateColumns: TOKEN_TABLE_COLS, gap: '0.75rem',
                  alignItems: 'center', padding: '0.9rem 1rem',
                  background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Token</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Value</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Preview</span>
                </div>

                {TOKEN_TYPES.map(({ id: typeId, icon: typeIcon }) => {
                  const typeTokens = visibleTokens[typeId] || [];
                  // With a search active a type with no match drops out entirely; without one
                  // an empty type still shows its row, which is how a folder list reads.
                  if (tokenTableSearchLower && typeTokens.length === 0) return null;
                  const typeDefaultOpen = typeTokens.length > 0;
                  const typeOpen = tokenTableSearchLower ? true
                    : (toggledTokenFolders.has(typeId) ? !typeDefaultOpen : typeDefaultOpen);
                  return (
                    <div key={typeId}>
                      <div
                        className="pd-tree-folder-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleTokenFolder(typeId)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTokenFolder(typeId); } }}
                        title={typeOpen ? 'Collapse ' + typeId : 'Expand ' + typeId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.6rem 1rem', cursor: 'pointer',
                          background: 'var(--bg-tertiary)',
                          borderBottom: '1px solid var(--border)',
                          userSelect: 'none',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          style={{ flexShrink: 0, color: 'var(--text-secondary)', transform: typeOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ display: 'flex', color: 'var(--accent)' }}>{folderIcon(13)}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{typeId}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{typeTokens.length}</span>

                        {/* A ramp is eleven tokens and a scale is eight, so each gets its
                            own action rather than that many trips through the single-token
                            dialog. Only the two categories that fold into scales have one. */}
                        {can(myRole, 'tokens', 'create') && (() => {
                          const bulk = typeId === 'Color'
                            ? {
                              label: 'Ramp', open: setRampModalOpen, aria: 'Add a colour ramp',
                              title: 'Add a colour ramp — one colour becomes a 50-950 scale',
                            }
                            : typeId === 'Typography'
                              ? {
                                label: 'Scale', open: setScaleModalOpen, aria: 'Add a type scale',
                                title: 'Add a type scale — one size and a ratio become eight steps',
                              }
                              : null;
                          if (!bulk) return null;
                          return (
                            <button
                              className="pd-tree-folder-add"
                              onClick={(e) => { e.stopPropagation(); bulk.open(true); }}
                              title={bulk.title}
                              aria-label={bulk.aria}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                marginLeft: 'auto', flexShrink: 0,
                                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                                color: 'var(--text-secondary)', cursor: 'pointer',
                                padding: '0.15rem 0.4rem', fontSize: '0.68rem', fontFamily: 'inherit',
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              {bulk.label}
                            </button>
                          );
                        })()}
                      </div>

                      {/* Second tier: whatever the category's grouping rule says. Colour
                          folders by role — Primary, Secondary, Accent — because that is what a
                          designer comes looking for; everything else keeps its Brand /
                          Semantic / Scoped tiers. See tokenGroups.js. */}
                      {typeOpen && groupsFor(typeId, typeTokens)
                        .filter(g => !(tokenTableSearchLower && g.tokens.length === 0))
                        .map((group, gi, shown) => {
                        const layerTokens = group.tokens;
                        const layerKey = typeId + '/' + group.key;
                        const layerOpen = tokenTableSearchLower ? true : !toggledTokenFolders.has(layerKey);
                        // Only Typography sections its folders; everywhere else this is undefined
                        // and no label is drawn. A section whose folders were all empty and
                        // dropped never becomes the previous one, so it prints no heading.
                        const sectionLabel = group.section && group.section !== shown[gi - 1]?.section
                          ? group.section
                          : null;
                        return (
                          <div key={layerKey}>
                            {sectionLabel && (
                              <div
                                className="pd-tree-section-label"
                                style={{
                                  padding: '0.6rem 1rem 0.3rem 2.2rem',
                                  fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em',
                                  color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)',
                                  borderBottom: '1px solid var(--border)', userSelect: 'none',
                                }}
                              >
                                {sectionLabel}
                              </div>
                            )}
                            <div
                              className="pd-tree-folder-row pd-tree-type-row"
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleTokenFolder(layerKey)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTokenFolder(layerKey); } }}
                              title={layerOpen ? 'Collapse ' + group.label : 'Expand ' + group.label}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem 0.5rem 2.2rem', cursor: 'pointer',
                                background: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border)',
                                userSelect: 'none',
                              }}
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ flexShrink: 0, color: 'var(--text-tertiary)', transform: layerOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <span style={{ display: 'flex', color: 'var(--accent)' }}>{folderIcon(11)}</span>
                              {/* A ramp's marker is its own base colour, and on a ramp it is
                                  also the way in to changing it. stopPropagation because the
                                  whole row toggles the folder. */}
                              {group.dotStyle === 'swatch' && can(myRole, 'tokens', 'edit') ? (
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  style={{ display: 'flex', flexShrink: 0 }}
                                >
                                  <ColorSwatchButton
                                    value={group.dot || '#000000'}
                                    onChange={(hex) => commitRampColor(group.key, hex)}
                                    title={'Recolour the ' + group.label + ' ramp'}
                                    against={activeTokens.Color?.find(t => t.name === 'brand.color.background')?.value || '#0D0D12'}
                                    size={13}
                                    radius={3}
                                  />
                                </span>
                              ) : group.dot && (
                                <span style={group.dotStyle === 'swatch'
                                  ? {
                                    width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
                                    background: group.dot, border: '1px solid rgba(255,255,255,0.18)',
                                  }
                                  : { width: '6px', height: '6px', borderRadius: '50%', background: group.dot, flexShrink: 0 }
                                } />
                              )}
                              {renamingRamp && renamingRamp.role === group.key ? (
                                <input
                                  autoFocus
                                  value={renamingRamp.draft}
                                  onChange={(e) => setRenamingRamp({ role: group.key, draft: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  onBlur={() => commitRampRename(group.key, renamingRamp.draft)}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') commitRampRename(group.key, renamingRamp.draft);
                                    else if (e.key === 'Escape') setRenamingRamp(null);
                                  }}
                                  style={{
                                    background: 'var(--bg-tertiary)', border: '1px solid var(--accent)',
                                    borderRadius: '5px', color: 'var(--text-primary)',
                                    fontSize: '0.78rem', fontFamily: 'inherit',
                                    padding: '0.1rem 0.3rem', width: '150px',
                                  }}
                                />
                              ) : (
                                <span
                                  onDoubleClick={(e) => {
                                    if (group.dotStyle !== 'swatch' || !can(myRole, 'tokens', 'edit')) return;
                                    e.stopPropagation();
                                    setRefactorNote(null);
                                    setRenamingRamp({ role: group.key, draft: group.label });
                                  }}
                                  title={group.dotStyle === 'swatch' && can(myRole, 'tokens', 'edit')
                                    ? 'Double-click to rename this ramp'
                                    : undefined}
                                  style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}
                                >
                                  {group.label}
                                </span>
                              )}
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{layerTokens.length}</span>

                              {can(myRole, 'tokens', 'create') && (
                                <button
                                  className="pd-tree-folder-add"
                                  onClick={(e) => { e.stopPropagation(); setTokenModal({
                                    mode: 'add', category: typeId,
                                    defaultLayer: group.defaults?.layer,
                                    // A token added inside a ramp or a scale starts on its name.
                                    defaultName: group.defaults?.namePrefix,
                                    defaultType: group.defaults?.type,
                                  }); }}
                                  title={'Add a ' + group.label.toLowerCase() + ' ' + typeId.toLowerCase() + ' token'}
                                  aria-label={'Add a token to ' + typeId + ' ' + group.label}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '20px', height: '20px', marginLeft: 'auto', flexShrink: 0,
                                    background: 'none', border: 'none', borderRadius: '5px',
                                    color: 'var(--text-secondary)', cursor: 'pointer', padding: 0,
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {layerOpen && layerTokens.length === 0 && (
                              <div style={{
                                padding: '0.5rem 1rem 0.5rem 5.6rem', fontSize: '0.72rem',
                                color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)',
                              }}>
                                None yet
                              </div>
                            )}

                            {/* Third tier, where a group has one: a text style is a set of
                                tokens, so it reads as one row that expands into its parts. */}
                            {layerOpen && (group.subgroups || []).map(sub => {
                              const visible = sub.tokens.filter(matchesTokenSearch);
                              if (tokenTableSearchLower && visible.length === 0) return null;
                              const styleKey = layerKey + '/' + sub.key;
                              const styleOpen = tokenTableSearchLower
                                ? true
                                : toggledTokenFolders.has(styleKey);
                              const spec = styleSpecimen(sub);
                              return (
                                <div key={styleKey}>
                                  <div
                                    className="pd-tree-folder-row pd-tree-style-row"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleTokenFolder(styleKey)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTokenFolder(styleKey); } }}
                                    title={styleOpen ? 'Collapse ' + sub.label : 'Expand ' + sub.label}
                                    style={{
                                      display: 'grid', gridTemplateColumns: TOKEN_TABLE_COLS,
                                      gap: '0.75rem', alignItems: 'center',
                                      padding: '0.45rem 1rem', cursor: 'pointer',
                                      background: 'var(--bg-secondary)',
                                      borderBottom: '1px solid var(--border)',
                                      userSelect: 'none',
                                    }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, paddingLeft: '3.6rem' }}>
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                        style={{ flexShrink: 0, color: 'var(--text-tertiary)', transform: styleOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                                        <polyline points="9 18 15 12 9 6" />
                                      </svg>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                        {sub.label}
                                      </span>
                                      <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>{sub.tokens.length}</span>
                                    </span>

                                    {/* size / line-height, the way the reference reads */}
                                    <span style={{
                                      fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {spec.size || '—'}{spec.lineHeight ? ' / ' + spec.lineHeight : ''}
                                    </span>

                                    {/* the style, drawn as itself */}
                                    <span
                                      title={sub.label + ' specimen'}
                                      style={{
                                        fontFamily: spec.family || undefined,
                                        fontSize: spec.size || undefined,
                                        fontWeight: spec.weight || undefined,
                                        lineHeight: 1.1,
                                        color: 'var(--text-primary)',
                                        maxWidth: '120px', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block',
                                      }}
                                    >
                                      Ag
                                    </span>
                                  </div>

                                  {styleOpen && visible.map((token, i) =>
                                    renderTokenRow(token, typeId, typeIcon, i === visible.length - 1, true))}
                                </div>
                              );
                            })}

                            {layerOpen && !group.subgroups && layerTokens.map((token, i) =>
                              renderTokenRow(token, typeId, typeIcon, i === layerTokens.length - 1))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Empty states. The tree renders its own folders, so these only cover the
                  cases where the whole table would be meaningless. */}
              {tokenTotal === 0 && (
                <div style={{ padding: '2.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    No tokens yet
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    Import tokens or add one from any folder above to get started.
                  </div>
                </div>
              )}
              {tokenTotal > 0 && tokenTableSearchLower && visibleTokenCount === 0 && (
                <div style={{ padding: '2.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    No tokens match "{tokenTableSearch.trim()}"
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    Clear the search to see all {tokenTotal} tokens.
                  </div>
                </div>
              )}
            </>
          )}


          {activeTab === 'components' && (() => {
            // Rows on screen. Folders no longer filter — they collapse — so search is the
            // only thing that narrows this, and every selection helper below follows it.
            const componentQuery = componentSearch.trim().toLowerCase();
            const visibleComponents = componentQuery
              ? components.filter(c => (c.name || '').toLowerCase().includes(componentQuery))
              : components;
            const componentFolders = componentFoldersFor(components);
            // Same "toggled away from default" model as the token tree, so collapse and
            // expand name the folders whose default is the opposite of what is wanted.
            const componentFolderKeys = componentFoldersFor(components).flatMap(({ category, types }) => [
              { key: category, defaultOpen: components.some(c => componentTreeCategory(c) === category) },
              ...types.map(type => ({ key: category + '/' + type, defaultOpen: true })),
            ]);
            const anyComponentFolderOpen = componentFolderKeys.some(
              ({ key, defaultOpen }) => (toggledComponentFolders.has(key) ? !defaultOpen : defaultOpen)
            );
            const setAllComponentFolders = (open) => setToggledComponentFolders(
              new Set(componentFolderKeys.filter(k => k.defaultOpen !== open).map(k => k.key))
            );

            const toggleComponentFolder = (group) => setToggledComponentFolders(prev => {
              const next = new Set(prev);
              if (next.has(group)) next.delete(group); else next.add(group);
              return next;
            });

            const isPresetComp = (comp) => comp.isPreset || String(comp.id).startsWith('preset-') || comp.id === '1' || comp.id === '2' || comp.id === '3' || comp.id === '4';
            // Selection helpers work on what's visible, so "select all" can't
            // silently tick rows hidden by the search.
            const deletableSelected = visibleComponents.filter(c => selectedComponentIds.has(c.id) && !isPresetComp(c));
            const toggleComponentSelected = (compId) => setSelectedComponentIds(prev => {
              const next = new Set(prev);
              if (next.has(compId)) next.delete(compId); else next.add(compId);
              return next;
            });
            // No checkbox column any more — selecting is an action in the row menu.
            const LIST_TABLE_COLS = 'minmax(0, 1fr) 104px';

            // The tiles are a browsing aid. Once a component is open in the rail there is a
            // full-size preview a few hundred pixels away, so twenty-two small copies of it
            // are noise — they collapse, the rows go back to their compact height, and the
            // tree is scannable again next to the 380px rail.
            const showThumbs = !previewComponentId;

            // Same treatment as the header's Export button, so the panel's
            // controls sit in the app's dark palette.
            const toolbarBtn = {
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '0.5rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            };
            const toolbarIconBtn = { ...toolbarBtn, padding: '0.5rem 0.6rem' };
            // ── Shared panel chrome ──────────────────────────────────────────
            // The all-components list and the single-component editor both use
            // this, so the page header can't drift apart between the two views.
            // Edit history is tracked now, so these do what they look like. The tooltip
            // names the action rather than just saying "Undo", because after a few edits
            // the useful question is what exactly is about to come back.
            const canUndo = history.past.length > 0;
            const canRedo = history.future.length > 0;
            const undoLabel = canUndo ? history.past[history.past.length - 1].label : null;
            const redoLabel = canRedo ? history.future[0].label : null;
            const undoRedoBtns = (
              <>
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  title={canUndo ? 'Undo: ' + undoLabel + '  (Ctrl+Z)' : 'Nothing to undo'}
                  style={{
                    ...toolbarIconBtn,
                    color: canUndo ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    cursor: canUndo ? 'pointer' : 'not-allowed',
                    opacity: canUndo ? 1 : 0.5,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  title={canRedo ? 'Redo: ' + redoLabel + '  (Ctrl+Y)' : 'Nothing to redo'}
                  style={{
                    ...toolbarIconBtn,
                    color: canRedo ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    cursor: canRedo ? 'pointer' : 'not-allowed',
                    opacity: canRedo ? 1 : 0.5,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
                </button>
              </>
            );

            const renderComponentPanel = (breadcrumbTail, info, actions) => (
              <div className="pd-component-toolbar" style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1.1rem 1.25rem',
                display: 'flex', flexDirection: 'column', gap: '0.85rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>›</span>
                  {breadcrumbTail}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>{info}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>
                </div>
              </div>
            );

            return (
              <div>
                {!uploadBannerDismissed && (
                  <UploadAnnouncementBanner
                    message="✨ New: Upload a screenshot of a full screen and we'll detect the distinct components in it — look for the Upload Image tab when adding a component."
                    onDismiss={dismissUploadBanner}
                  />
                )}

                {components.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-tertiary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>No components yet</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                      Add a component to start mapping tokens to its style properties.
                    </p>
                    {can(myRole, 'components', 'create') && (
                      <button onClick={() => setComponentModal({ mode: 'add' })} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
                        Create first component
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* All components — click a row to open its property editor */}
                    {renderComponentPanel(
                      <span style={{ color: 'var(--text-tertiary)' }}>Components</span>,
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            All components
                          </h2>
                          <span style={{
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                            borderRadius: '9999px', padding: '0.2rem 0.6rem',
                            color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 500,
                          }}>
                            {visibleComponents.length} total
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0.35rem 0 0' }}>
                          Pick a component to map tokens to its style properties.
                        </p>
                      </>,
                      <>
                        {deletableSelected.length > 0 && can(myRole, 'components', 'edit') && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete ' + deletableSelected.length + ' component' + (deletableSelected.length === 1 ? '' : 's') + '?')) {
                                handleDeleteComponents(deletableSelected.map(c => c.id));
                                setSelectedComponentIds(new Set());
                              }
                            }}
                            style={{ ...toolbarBtn, color: '#EF4444' }}
                          >
                            Delete {deletableSelected.length} selected
                          </button>
                        )}
                        {undoRedoBtns}
                      </>
                    )}

                    {/* Search sits directly above the table it filters. */}
                    <div className="pd-table-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        className="pd-component-search"
                        value={componentSearch}
                        onChange={(e) => setComponentSearch(e.target.value)}
                        placeholder="Search components..."
                        style={{
                          display: 'block', width: '260px', maxWidth: '100%',
                          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '0.45rem 0.75rem',
                          color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      {collapseAllBtn(anyComponentFolderOpen, () => setAllComponentFolders(!anyComponentFolderOpen), 'folders')}
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div className="pd-component-list-row pd-component-list-row-head" style={{
                        display: 'grid', gridTemplateColumns: LIST_TABLE_COLS, gap: '0.75rem',
                        alignItems: 'center', padding: '0.9rem 1rem',
                        background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Component</span>
                      </div>

                      {componentFolders.map(({ category, types }) => {
                        const catComps = visibleComponents.filter(c => componentTreeCategory(c) === category);
                        // With a search active, folders with no match drop out entirely; without
                        // one an empty folder still shows its row, which is how a folder list reads.
                        if (componentQuery && catComps.length === 0) return null;
                        // Open by default once it has content; a type folder inside an open
                        // category defaults to open so every type stays visible.
                        const catDefaultOpen = catComps.length > 0;
                        const catOpen = componentQuery ? true
                          : (toggledComponentFolders.has(category) ? !catDefaultOpen : catDefaultOpen);
                        return (
                          <div key={category}>
                            {/* Folder row spans the table rather than sitting in the 4-column
                                grid, so the columns stay aligned for the component rows. */}
                            <div
                              className="pd-tree-folder-row"
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleComponentFolder(category)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleComponentFolder(category); } }}
                              title={catOpen ? 'Collapse ' + category : 'Expand ' + category}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1rem', cursor: 'pointer',
                                background: 'var(--bg-tertiary)',
                                borderBottom: '1px solid var(--border)',
                                userSelect: 'none',
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ flexShrink: 0, color: 'var(--text-secondary)', transform: catOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <span style={{ display: 'flex', color: 'var(--accent)' }}>{folderIcon(13)}</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{category}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                {catComps.length}
                              </span>
                            </div>

                            {catOpen && types.map(type => {
                              const typeComps = catComps.filter(c => componentTreeType(c) === type);
                              if (componentQuery && typeComps.length === 0) return null;
                              const typeKey = category + '/' + type;
                              const typeOpen = componentQuery ? true : !toggledComponentFolders.has(typeKey);
                              return (
                                <div key={typeKey}>
                                  {/* Second tier: the component type. Indented past its category
                                      so the three levels read as a tree. */}
                                  <div
                                    className="pd-tree-folder-row pd-tree-type-row"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleComponentFolder(typeKey)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleComponentFolder(typeKey); } }}
                                    title={TYPE_DESCRIPTIONS[type] || (typeOpen ? 'Collapse ' + type : 'Expand ' + type)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.5rem 1rem 0.5rem 2.2rem', cursor: 'pointer',
                                      background: 'var(--bg-secondary)',
                                      borderBottom: '1px solid var(--border)',
                                      userSelect: 'none',
                                    }}
                                  >
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                      style={{ flexShrink: 0, color: 'var(--text-tertiary)', transform: typeOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                    <span style={{ display: 'flex', color: 'var(--accent)' }}>{folderIcon(11)}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{type}</span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                                      {typeComps.length}
                                    </span>

                                    {can(myRole, 'components', 'create') && (
                                      <button
                                        className="pd-tree-folder-add"
                                        onClick={(e) => { e.stopPropagation(); setComponentModal({ mode: 'add', category, type }); }}
                                        title={'Add to ' + type}
                                        aria-label={'Add a component to ' + type}
                                        style={{
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          width: '20px', height: '20px', marginLeft: 'auto', flexShrink: 0,
                                          background: 'none', border: 'none', borderRadius: '5px',
                                          color: 'var(--text-secondary)', cursor: 'pointer', padding: 0,
                                        }}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                            {typeOpen && typeComps.map((comp, i) => {
                        const preset = isPresetComp(comp);
                        const isChecked = selectedComponentIds.has(comp.id);
                            const row = (
                          <div
                            key={comp.id}
                            className={'pd-component-list-row' + (isChecked ? ' pd-component-list-row-selected' : '')}
                            style={{
                              display: 'grid', gridTemplateColumns: LIST_TABLE_COLS, gap: '0.75rem',
                              alignItems: 'center', padding: showThumbs ? '0.5rem 1rem' : '0.8rem 1rem',
                              borderBottom: i < typeComps.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewComponentId(comp.id)}
                            title={'View ' + comp.name}
                          >
                            {/* The indent lives on this span rather than the name button, because
                                the tile cannot sit inside it: a button template renders a real
                                <button>, and nesting one inside another is invalid HTML. The name
                                stays a real button, so it keeps its focus ring and Enter. */}
                            <span
                              className="pd-tree-name-cell"
                              style={{
                                display: 'flex', alignItems: 'center', minWidth: 0,
                                gap: showThumbs ? '0.7rem' : '0.4rem',
                              }}
                            >
                              {showThumbs && (
                                <ComponentThumb className="pd-component-thumb">
                                  {renderThumbPreview(comp)}
                                </ComponentThumb>
                              )}
                            <button
                              onClick={() => setPreviewComponentId(comp.id)}
                              title={'View ' + comp.name}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0,
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                                fontFamily: 'inherit', textAlign: 'left',
                              }}
                            >
                              {/* The icon and the tile take turns: the tile says what the
                                  component looks like while you browse, and the icon marks the
                                  row as a component once the tile is away. The row is never
                                  left with no marker at all. */}
                              {!showThumbs && (
                                <span style={{ display: 'flex', color: 'var(--accent)', flexShrink: 0 }}>
                                  {componentIcon(12)}
                                </span>
                              )}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.name}</span>
                              {preset && (
                                <span style={{
                                  fontSize: '0.58rem', background: 'var(--accent-glow)', color: 'var(--accent)',
                                  padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(252,6,148,0.2)',
                                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                                }}>Preset</span>
                              )}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </button>
                            </span>


                            <div
                              style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end', alignItems: 'center' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* The row's only actions live here: revealed on hover, always
                                  present for keyboard and touch (see the CSS). */}
                              <button
                                className={'pd-tree-row-kebab' + (componentMenu && componentMenu.id === comp.id ? ' is-open' : '')}
                                title={'Actions for ' + comp.name}
                                onClick={(e) => {
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setComponentMenu(prev => prev && prev.id === comp.id
                                    ? null
                                    : { id: comp.id, top: r.bottom + 6, right: window.innerWidth - r.right });
                                }}
                                style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', alignItems: 'center' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                                </svg>
                              </button>

                              {componentMenu && componentMenu.id === comp.id && (
                                <>
                                  <div
                                    onClick={() => setComponentMenu(null)}
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 160, background: 'transparent' }}
                                  />
                                  <div style={{
                                    position: 'fixed', top: componentMenu.top, right: componentMenu.right,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '0.25rem', minWidth: '150px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 161,
                                    display: 'flex', flexDirection: 'column', gap: '0.1rem',
                                  }}>
                                    <button
                                      style={menuItemStyle}
                                      onClick={() => { setPreviewComponentId(comp.id); setComponentMenu(null); }}
                                    >
                                      View
                                    </button>
                                    <button
                                      style={menuItemStyle}
                                      onClick={() => { toggleComponentSelected(comp.id); setComponentMenu(null); }}
                                    >
                                      {isChecked ? 'Deselect' : 'Select'}
                                    </button>
                                    {can(myRole, 'components', 'edit') && (
                                      <button
                                        style={menuItemStyle}
                                        onClick={() => { setComponentModal({ mode: 'edit', component: comp }); setComponentMenu(null); }}
                                      >
                                        Edit component
                                      </button>
                                    )}
                                    {can(myRole, 'components', 'edit') && !preset && (
                                      <button
                                        style={{ ...menuItemStyle, color: '#EF4444' }}
                                        onClick={() => {
                                          setComponentMenu(null);
                                          if (window.confirm('Delete component "' + comp.name + '"?')) handleDeleteComponent(comp.id);
                                        }}
                                      >
                                        Delete component
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}

                            </div>
                          </div>
                            );
                            // A fragment shows what it holds, one tier deeper. These are
                            // references: the same component still lives in its own type
                            // folder, so the link glyph marks this as a use, not a copy.
                            if (!isFragment(comp)) return row;
                            const kids = childrenOf(comp, componentsById);
                            if (!kids.length) return row;
                            return (
                              <React.Fragment key={comp.id}>
                                {row}
                                {kids.map(kid => (
                                  <div
                                    key={comp.id + ':' + kid.id}
                                    className="pd-component-list-row pd-tree-child-row"
                                    style={{
                                      display: 'grid', gridTemplateColumns: LIST_TABLE_COLS, gap: '0.75rem',
                                      alignItems: 'center', padding: showThumbs ? '0.5rem 1rem' : '0.55rem 1rem',
                                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                    }}
                                    onClick={() => setPreviewComponentId(kid.id)}
                                    title={kid.name + ' — used by ' + comp.name}
                                  >
                                    <span className="pd-tree-name-cell pd-tree-child-name" style={{
                                      display: 'flex', alignItems: 'center', minWidth: 0,
                                      gap: showThumbs ? '0.7rem' : '0.4rem',
                                      color: 'var(--text-secondary)', fontSize: '0.82rem',
                                    }}>
                                      {showThumbs && (
                                        <ComponentThumb className="pd-component-thumb">
                                          {renderThumbPreview(kid)}
                                        </ComponentThumb>
                                      )}
                                      <span style={{ display: 'flex', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                                        </svg>
                                      </span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kid.name}</span>
                                    </span>
                                    <div />
                                  </div>
                                ))}
                              </React.Fragment>
                            );
                            })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    {componentQuery && visibleComponents.length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '1rem 0 0' }}>
                        No components match "{componentSearch.trim()}".
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })()}


          {activeTab === 'handoff' && (() => {
            const formats = [
              {
                id: 'css',
                badge: 'CSS',
                badgeBg: 'rgba(59, 130, 246, 0.1)',
                badgeColor: '#3B82F6',
                filename: 'variables.css',
                desc: 'For any website — paste into your stylesheet. Works everywhere with no build step required.',
                recommended: true,
                snippet: `@import url("https://strata.charisol.io/api/public/v1/projects/${project.id}/css");`
              },
              {
                id: 'tailwind',
                badge: 'TAILWIND',
                badgeBg: 'rgba(6, 182, 212, 0.1)',
                badgeColor: '#06B6D4',
                filename: 'tailwind.config.json',
                desc: 'For React/Next.js apps built with Tailwind CSS — merge the theme tokens into your tailwind.config.js.',
                recommended: true,
                snippet: `// tailwind.config.js\nconst strataTheme = require("./tailwind.config.json");\nmodule.exports = {\n  theme: {\n    extend: strataTheme\n  }\n}`
              },
              {
                id: 'scss',
                badge: 'SCSS',
                badgeBg: 'rgba(236, 72, 153, 0.1)',
                badgeColor: '#EC7299',
                filename: 'variables.scss',
                desc: 'For SASS/SCSS stylesheets — $variable-name syntax compatible with any Sass project.',
                recommended: false,
                snippet: `@import "https://strata.charisol.io/api/public/v1/projects/${project.id}/scss";`
              },
              {
                id: 'ts',
                badge: 'TS',
                badgeBg: 'rgba(37, 99, 235, 0.1)',
                badgeColor: '#2563EB',
                filename: 'tokens.ts',
                desc: 'For typed TypeScript projects — fully typed named constants with IDE autocomplete.',
                recommended: false,
                snippet: `import { tokens } from "./tokens";\n// Use tokens.Color.primary`
              },
              {
                id: 'js',
                badge: 'JS',
                badgeBg: 'rgba(234, 179, 8, 0.1)',
                badgeColor: '#EAB308',
                filename: 'tokens.js',
                desc: 'For JavaScript projects — ES Module with named exports, works with any modern bundler.',
                recommended: false,
                snippet: `import { tokens } from "./tokens.js";\nconsole.log(tokens.color.primary);`
              },
              {
                id: 'swift',
                badge: 'SWIFT',
                badgeBg: 'rgba(249, 115, 22, 0.1)',
                badgeColor: '#F97316',
                filename: 'tokens.swift',
                desc: 'For iOS and macOS apps — UIColor and CGFloat extensions ready to use in Xcode.',
                recommended: false,
                snippet: `import SwiftUI\nextension Color {\n    static let strataPrimary = Color(hex: "#FC0694")\n}`
              },
              {
                id: 'dart',
                badge: 'DART',
                badgeBg: 'rgba(20, 184, 166, 0.1)',
                badgeColor: '#14B8A6',
                filename: 'tokens.dart',
                desc: 'For Flutter apps — MaterialColor and constant definitions for Dart.',
                recommended: false,
                snippet: `import 'tokens.dart';\nfinal brandColor = StrataColors.primary;`
              },
              {
                id: 'json',
                badge: 'DTCG',
                badgeBg: 'rgba(245, 158, 11, 0.1)',
                badgeColor: '#F59E0B',
                filename: 'tokens.json',
                desc: 'For design tools like Figma Tokens plugin — W3C Design Token Community Group format compatible with Style Dictionary.',
                recommended: false,
                snippet: `{\n  "color": {\n    "primary": {\n      "$value": "#FC0694",\n      "$type": "color"\n    }\n  }\n}`
              },
              {
                id: 'strata',
                badge: 'STRATA',
                badgeBg: 'rgba(139, 92, 246, 0.1)',
                badgeColor: '#8B5CF6',
                filename: 'strata.json',
                desc: 'For Strata SDK integration — full token hierarchy with component metadata and schema version.',
                recommended: false,
                snippet: `{\n  "projectId": "${project.id}",\n  "version": "1.0.0"\n}`
              }
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1200px' }}>
                
                {/* Integration Card */}
                <div className="pd-handoff-card" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  
                  {/* Tab Selector */}
                  <div className="pd-handoff-subtabs" style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.75rem',
                    marginBottom: '2rem',
                    gap: '1rem',
                  }}>
                    {[
                      { id: 'connect', label: 'Connect your app' },
                      { id: 'sync', label: 'Publish & Sync' }
                    ].map(subTab => {
                      const isActive = activeHandoffSubTab === subTab.id;
                      return (
                        <button
                          key={subTab.id}
                          className="pd-handoff-subtab-btn"
                          onClick={() => setActiveHandoffSubTab(subTab.id)}
                          style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '6px',
                            border: `1.5px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                            background: 'none',
                            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {subTab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Connect your app Content */}
                  {activeHandoffSubTab === 'connect' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Project ID copy card */}
                      <div className="pd-handoff-id-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '0.875rem 1.25rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', minWidth: 0 }}>
                          <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Project ID:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.id}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(project.id);
                            alert('Project ID copied!');
                          }}
                          className="btn btn-secondary"
                          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', padding: '0.35rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
                        >
                          Copy
                        </button>
                      </div>

                      {/* Install & configure */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Install & configure</h4>
                        
                        {/* Code box */}
                        <div style={{ position: 'relative', background: '#09090C', border: '1px solid #1A1A24', borderRadius: '12px', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#A3A3B8', overflowX: 'auto', marginBottom: '1rem' }}>
                          <button
                            onClick={() => {
                              const code = `import { StrataProvider } from "@strata-ds/core";\n\nexport default function RootLayout({ children }) {\n  return (\n    <StrataProvider\n      syncEnabled={true}\n      projectId="${project.id}"\n      snapshotCdnBase="snapshot.strata.charisol.io/snapshot"\n      syncToken="pt_live_your_token_here"\n      syncInterval={5000}\n    >\n      {children}\n    </StrataProvider>\n  );\n}`;
                              navigator.clipboard.writeText(code);
                              alert('Configuration code copied!');
                            }}
                            style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            Copy
                          </button>
                          <pre style={{ margin: 0, lineHeight: 1.5, color: '#F1F1F4' }}>
{`import { StrataProvider } from "@strata-ds/core";

export default function RootLayout({ children }) {
  return (
    <StrataProvider
      syncEnabled={true}
      projectId="${project.id}"
      snapshotCdnBase="snapshot.strata.charisol.io/snapshot"
      syncToken="pt_live_your_token_here"
      syncInterval={5000}
    >
      {children}
    </StrataProvider>
  );
}`}
                          </pre>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                          Install <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '4px', color: 'var(--text-primary)' }}>@strata-ds/core</code> from npm, then wrap your app root with <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '4px', color: 'var(--text-primary)' }}>StrataProvider</code>. Pass your <code style={{ fontFamily: 'var(--font-mono)' }}>projectId</code>, <code style={{ fontFamily: 'var(--font-mono)' }}>snapshotCdnBase</code>, and <code style={{ fontFamily: 'var(--font-mono)' }}>syncToken</code> from the <strong>Publish & Sync</strong> tab.
                        </p>

                        <a 
                          href="#/docs/integration" 
                          style={{ 
                            fontSize: '0.82rem', 
                            color: 'var(--accent)', 
                            textDecoration: 'none', 
                            fontWeight: 600, 
                            marginTop: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Opening full integration guide...');
                          }}
                        >
                          Read full integration guide &rarr;
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Publish & Sync Content */}
                  {activeHandoffSubTab === 'sync' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                      
                      {/* Project Visibility */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Project visibility</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Public projects are discoverable and readable without a token. Private projects require a sync token for read access.</p>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '3px',
                            gap: '2px'
                          }}>
                            {['Public', 'Private'].map(visibility => {
                              const isSelected = projectVisibility === visibility;
                              return (
                                <button
                                  key={visibility}
                                  onClick={() => handleVisibilityChange(visibility)}
                                  style={{
                                    padding: '0.4rem 1.25rem',
                                    borderRadius: '18px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: isSelected ? 600 : 400,
                                    background: isSelected ? 'var(--bg-secondary)' : 'none',
                                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {visibility}
                                </button>
                              );
                            })}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            Current: <strong>{projectVisibility}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Sync Token */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Sync token</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Your sync token authenticates read requests from <code style={{ fontFamily: 'var(--font-mono)' }}>@strata-ds/core</code>. Pass it as the <code style={{ fontFamily: 'var(--font-mono)' }}>syncToken</code> prop on <code style={{ fontFamily: 'var(--font-mono)' }}>StrataProvider</code>.
                        </p>
                        
                        <div className="pd-handoff-token-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', maxWidth: '580px' }}>
                          <input
                            type="text"
                            readOnly
                            value={syncToken ? 'pt_live_' + '*'.repeat(16) : ''} 
                            style={{ 
                              flex: 1, 
                              background: 'var(--bg-tertiary)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px', 
                              padding: '0.5rem 0.75rem', 
                              color: 'var(--text-secondary)', 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '0.82rem',
                              height: '38px'
                            }} 
                          />
                          <button 
                            onClick={handleGenerateSyncToken}
                            className="btn btn-primary"
                            style={{ 
                              background: 'var(--accent)', 
                              borderColor: 'var(--accent)', 
                              color: '#fff', 
                              padding: '0.5rem 1.25rem', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Generate sync token
                          </button>
                        </div>
                      </div>

                      {/* Integration Snippet */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Integration snippet</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>CDN-first sync pattern — a single edge-cached request replaces 3 Lambda calls.</p>
                        
                        <div style={{ position: 'relative', background: '#09090C', border: '1px solid #1A1A24', borderRadius: '12px', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#A3A3B8', overflowX: 'auto', marginTop: '0.5rem' }}>
                          <button
                            onClick={() => {
                              const code = `import { StrataProvider } from "@strata-ds/core";\n\nexport default function RootLayout({ children }) {\n  return (\n    <StrataProvider\n      syncEnabled={true}\n      projectId="${project.id}"\n      snapshotCdnBase="snapshot.strata.charisol.io/snapshot"\n      syncToken="${syncToken}"\n      syncInterval={5000}\n    >\n      {children}\n    </StrataProvider>\n  );\n}`;
                              navigator.clipboard.writeText(code);
                              alert('CDN integration code copied!');
                            }}
                            style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            Copy
                          </button>
                          <pre style={{ margin: 0, lineHeight: 1.5, color: '#F1F1F4' }}>
{`import { StrataProvider } from "@strata-ds/core";

export default function RootLayout({ children }) {
  return (
    <StrataProvider
      syncEnabled={true}
      projectId="${project.id}"
      snapshotCdnBase="snapshot.strata.charisol.io/snapshot"
      syncToken="${syncToken}"
      syncInterval={5000}
    >
      {children}
    </StrataProvider>
  );
}`}
                          </pre>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Exporters / Formats Grid */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                    Available Formats & Exporters
                  </h3>
                  
                  <div className="pd-handoff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {formats.map(fmt => {
                      const isExpanded = expandedCard === fmt.id;
                      const url = `https://strata.charisol.io/api/public/v1/projects/${project.id}/${fmt.id}`;
                      return (
                        <div key={fmt.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {/* Header Row */}
                          <div className="pd-exporter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                background: fmt.badgeBg, color: fmt.badgeColor, letterSpacing: '0.05em' 
                              }}>
                                {fmt.badge}
                              </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {fmt.filename}
                              </span>
                            </div>
                            {fmt.recommended && (
                              <span style={{ 
                                fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px',
                                background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', letterSpacing: '0.05em'
                              }}>
                                RECOMMENDED
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, minHeight: '3rem', lineHeight: 1.4 }}>
                            {fmt.desc}
                          </p>

                          {/* URL box */}
                          <div style={{ display: 'flex', position: 'relative', width: '100%' }}>
                            <input 
                              readOnly 
                              className="form-input" 
                              value={url} 
                              style={{ 
                                fontSize: '0.72rem', height: '36px', padding: '0 50px 0 0.75rem', 
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border)', 
                                color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%',
                                borderRadius: '6px'
                              }} 
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                alert(`${fmt.filename} sync URL copied!`);
                              }}
                              style={{ 
                                position: 'absolute', right: '4px', top: '4px', height: '28px', 
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)', 
                                color: 'var(--text-primary)', padding: '0 0.5rem', fontSize: '0.7rem', 
                                borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' 
                              }}
                            >
                              Copy
                            </button>
                          </div>

                          {/* Toggler */}
                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                            <button 
                              onClick={() => setExpandedCard(isExpanded ? null : fmt.id)}
                              style={{ 
                                background: 'none', border: 'none', color: 'var(--accent)', 
                                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 
                              }}
                            >
                              <span>Show usage snippets</span>
                              <span style={{ 
                                display: 'inline-block', transition: 'transform 0.2s', 
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }}>
                                ▼
                              </span>
                            </button>

                            {/* Expanded Code Snippet */}
                            {isExpanded && (
                              <div style={{ 
                                marginTop: '0.75rem', background: '#09090C', border: '1px solid #1A1A24', 
                                borderRadius: '8px', padding: '0.75rem', fontFamily: 'var(--font-mono)', 
                                fontSize: '0.72rem', color: '#A3A3B8', overflowX: 'auto', position: 'relative'
                              }}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(fmt.snippet);
                                    alert('Usage snippet copied!');
                                  }}
                                  style={{ 
                                    position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', 
                                    padding: '0.2rem 0.4rem', color: '#fff', fontSize: '0.6rem', cursor: 'pointer' 
                                  }}
                                >
                                  Copy
                                </button>
                                <pre style={{ margin: 0, lineHeight: 1.4, color: '#E1E1E6' }}>{fmt.snippet}</pre>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Unified Token Dictionary */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="pd-handoff-dict-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Unified Token Dictionary</h3>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search tokens (name, value, type)..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ maxWidth: '240px', fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px' }}
                    />
                  </div>
                  <div className="pd-handoff-table-scroll" style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '1rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', fontWeight: 600, minWidth: '480px' }}>
                    {['Token Key', 'Value', 'Type'].map(h => (
                      <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto', minWidth: '480px' }}>
                    {Object.keys(activeTokens).flatMap(cat => activeTokens[cat] || []).filter(t => {
                      const q = searchQuery.toLowerCase();
                      return t.name.toLowerCase().includes(q) || t.value.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
                    }).map((token, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr',
                          gap: '1rem', alignItems: 'center',
                          padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{token.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {token.type === 'color' && (
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: token.value, border: '1px solid rgba(255,255,255,0.1)' }} />
                          )}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{token.value}</span>
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content',
                          fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                          background: `${TYPE_COLORS[token.type]}12`,
                          color: TYPE_COLORS[token.type],
                          border: `1px solid ${TYPE_COLORS[token.type]}22`,
                          fontWeight: 500
                        }}>{token.type}</span>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {activeTab === 'settings' && (
            <div style={{ maxWidth: '480px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Project settings</h2>
              {canViewTab(myRole, 'collaboration') && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px',
                  padding: '1rem 1.25rem', marginBottom: '1.5rem',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Team &amp; Permissions</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Manage who has access to this project and what they can do.
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', flexShrink: 0 }}
                    onClick={() => setActiveTab('collaboration')}
                  >
                    Manage &rarr;
                  </button>
                </div>
              )}
              {!can(myRole, 'projectManagement', 'updateSettings') ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  Only the project Owner or an Admin can change these settings.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Project name</label>
                    <input
                      className="form-input"
                      value={projectNameDraft}
                      onChange={(e) => setProjectNameDraft(e.target.value)}
                      onBlur={() => {
                        if (projectNameDraft.trim() && projectNameDraft !== project.name) {
                          updateProject(id, { name: projectNameDraft.trim() });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="What are we building?"
                      value={projectDescDraft}
                      onChange={(e) => setProjectDescDraft(e.target.value)}
                      onBlur={() => {
                        if (projectDescDraft !== (project.description || '')) {
                          updateProject(id, { description: projectDescDraft.trim() });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visibility</label>
                    <select
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                      value={project.visibility || 'Private'}
                      onChange={(e) => handleVisibilityChange(e.target.value)}
                    >
                      <option>Private</option>
                      <option>Public</option>
                    </select>
                  </div>

                  {can(myRole, 'projectManagement', 'transferOwnership') && (
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <label className="form-label">Transfer ownership</label>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0.75rem' }}>
                        Hand full ownership of this project to another member. You'll be downgraded to Admin.
                      </p>
                      {(project.members || []).filter(m => m.email?.toLowerCase() !== user?.email?.toLowerCase()).length === 0 ? (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Invite a teammate first to transfer ownership to them.</p>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select
                            className="form-input"
                            style={{ cursor: 'pointer', flex: 1 }}
                            value={transferTargetId}
                            onChange={(e) => setTransferTargetId(e.target.value)}
                          >
                            <option value="">Select a member…</option>
                            {(project.members || [])
                              .filter(m => m.email?.toLowerCase() !== user?.email?.toLowerCase())
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                              ))}
                          </select>
                          <button
                            className="btn btn-secondary"
                            disabled={!transferTargetId}
                            onClick={() => {
                              const target = (project.members || []).find(m => m.id === transferTargetId);
                              if (!target) return;
                              if (!window.confirm(`Make ${target.name} the Owner of this project? You will become an Admin.`)) return;
                              const updatedMembers = (project.members || []).map(m => {
                                if (m.id === target.id) return { ...m, role: 'Owner' };
                                if (m.email?.toLowerCase() === user?.email?.toLowerCase()) return { ...m, role: 'Admin' };
                                return m;
                              });
                              updateProject(id, { members: updatedMembers });
                              setTransferTargetId('');
                            }}
                          >
                            Transfer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {can(myRole, 'projectManagement', 'deleteProject') && (
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <button
                        style={{ ...actionBtnStyle, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}
                        onClick={() => {
                          if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                            deleteProject(id);
                            navigate('/projects');
                          }
                        }}
                      >
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'collaboration' && (() => {
            const members = project.members || [];
            const canInvite = can(myRole, 'collaboration', 'inviteMembers') || can(myRole, 'collaboration', 'manageMembers');
            const canRemove = can(myRole, 'collaboration', 'removeMembers') || can(myRole, 'collaboration', 'manageMembers');
            const canAssignRoles = can(myRole, 'collaboration', 'assignRoles') || can(myRole, 'collaboration', 'manageMembers');

            const handleInviteSubmit = () => {
              if (!inviteForm.email.trim()) {
                alert('Please fill in an email.');
                return;
              }
              const base = members.length
                ? members
                : [{ id: user.email, name: user.name, email: user.email, initials: user.initials, role: 'Owner', joinedAt: new Date().toISOString() }];
              const newMember = {
                id: String(Date.now()),
                name: '',
                email: inviteForm.email.trim(),
                initials: computeInitialsFromEmail(inviteForm.email),
                role: inviteForm.role,
                joinedAt: new Date().toISOString(),
              };
              updateProject(id, { members: [...base, newMember] });
              setInviteForm({ email: '', role: 'Designer' });
              setInviteModalOpen(false);
            };

            const handleRoleChange = (memberId, newRole) => {
              updateProject(id, { members: members.map(m => m.id === memberId ? { ...m, role: newRole } : m) });
            };

            const handleRemoveMember = (memberId, memberName) => {
              if (!window.confirm(`Remove ${memberName} from this project?`)) return;
              updateProject(id, { members: members.filter(m => m.id !== memberId) });
            };

            // A stored member row can stand for whoever is using this device rather than a
            // named person — the demo ships one, because it is seeded before anyone logs in.
            // It is filled in here with the real identity so the list never shows a marker.
            const asPerson = (m) => (m.email === LOCAL_OWNER_EMAIL
              ? { ...m, name: user?.name, email: user?.email, initials: user?.initials }
              : m);

            // If no team has been set up yet, show "you" as the implicit Owner.
            const displayMembers = members.length
              ? members.map(asPerson)
              : [{ id: 'me', name: user?.name, email: user?.email, initials: user?.initials, role: 'Owner', joinedAt: null }];

            // Everyone who is not the owner — what "invited" means on this page.
            const invitedCount = displayMembers.filter(m => m.role !== 'Owner').length;

            return (
              <div style={{ maxWidth: '640px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Team &amp; access</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Manage who has access to this project and what they can do.</p>
                  </div>
                  {canInvite && (
                    <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={() => setInviteModalOpen(true)}>
                      + Invite teammate
                    </button>
                  )}
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  {displayMembers.map((m, i) => {
                    const isSelf = m.email?.toLowerCase() === user?.email?.toLowerCase();
                    const canEditThisRow = canAssignRoles && m.role !== 'Owner' && !isSelf;
                    return (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        borderBottom: i < displayMembers.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-heading)',
                          }}>
                            {m.initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {m.name || m.email}{isSelf ? ' (you)' : ''}
                            </div>
                            {m.name && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.email}
                              </div>
                            )}
                            {/* joinedAt is only set once someone has actually come in, so an
                                invitation still outstanding says so rather than looking joined. */}
                            {!m.joinedAt && m.role !== 'Owner' && (
                              <div style={{ fontSize: '0.68rem', color: '#F59E0B', marginTop: '0.1rem' }}>
                                Invite pending
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {canEditThisRow ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                            >
                              {ROLES.filter(r => r !== 'Owner').map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '100px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                              {m.role}
                            </span>
                          )}
                          {canRemove && m.role !== 'Owner' && !isSelf && (
                            <button
                              onClick={() => handleRemoveMember(m.id, m.name || m.email)}
                              title="Remove member"
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {invitedCount === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                    Nobody has been invited to this project yet.
                  </p>
                )}

                {inviteModalOpen && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(9, 9, 12, 0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                  }}>
                    <div style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: '16px', padding: '2rem', width: '460px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      display: 'flex', flexDirection: 'column', gap: '1.25rem',
                      maxHeight: '90vh', overflowY: 'auto',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Invite teammate</h3>
                        <button onClick={() => setInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Email</label>
                        <input
                          type="email" className="form-input" value={inviteForm.email}
                          onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="jordan@company.com"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Role</label>

                        {/* Each option carries its own summary, so the choice is informed
                            without leaving the dialog. Text is derived from the permission
                            matrix, never written twice. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                          {ROLES.filter(r => r !== 'Owner').map(r => {
                            const selected = inviteForm.role === r;
                            return (
                              <button
                                key={r}
                                onClick={() => setInviteForm(f => ({ ...f, role: r }))}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                  textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: '10px',
                                  background: selected ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                                  border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--border)'),
                                  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                <span style={{
                                  width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                                  border: '1.5px solid ' + (selected ? 'var(--accent)' : 'var(--text-tertiary)'),
                                  background: selected ? 'var(--accent)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {selected && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />}
                                </span>
                                <span style={{ minWidth: 0 }}>
                                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>{r}</span>
                                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.1rem' }}>
                                    {roleSummary(r)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Per-area breakdown for whatever is selected */}
                        <div style={{ marginTop: '0.8rem', padding: '0.7rem 0.8rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                            What {/[AEIOU]/.test(inviteForm.role[0]) ? 'an' : 'a'} {inviteForm.role} can do
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.9rem' }}>
                            {describeRole(inviteForm.role).map(area => (
                              <div key={area.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{area.label}</span>
                                <span style={{
                                  fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                                  color: area.level === 'No access' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                }}>{area.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
                        No email is sent — this adds a teammate directly (local simulation, like your sync token).
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                          onClick={() => setInviteModalOpen(false)}
                          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Cancel
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }} onClick={handleInviteSubmit}>
                          Send invite
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      </div>

      {/* ── Modals ── */}
      {tokenModal && (
        <TokenModal
          // Every field is seeded from props on mount, so reusing one instance for a
          // different token would leave the previous token's values in the form.
          key={tokenModal.mode + ':' + (tokenModal.token?.name || [tokenModal.category, tokenModal.defaultLayer, tokenModal.defaultName, tokenModal.defaultType].join('/'))}
          modal={tokenModal}
          activeTokens={activeTokens}
          onClose={() => setTokenModal(null)}
          onSave={(updatedToken) => {
            if (Array.isArray(updatedToken)) {
              handleAddTokens(updatedToken);
            } else if (tokenModal.mode === 'add') {
              handleAddToken(getCategoryForType(updatedToken.type), updatedToken);
            } else {
              handleEditToken(tokenModal.category, tokenModal.token.name, updatedToken);
            }
            setTokenModal(null);
          }}
        />
      )}

      {componentModal && (
        <ComponentModal
          activeTokens={activeTokens}
          existingNames={components.map(c => c.name)}
          componentToEdit={componentModal.component}
          initialCategory={componentModal.category}
          initialType={componentModal.type}
          allComponents={components}
          parentOptions={eligibleParents(componentModal.component, components)}
          // The same helpers the properties rail below is given, so a property offers the
          // identical tokens, presets and new-token form wherever it is edited.
          tokensForProperty={getTokenNamesForProperty}
          presetsForProperty={getPresetTokensForProperty}
          onCreateToken={createTokenForProperty}
          existingTokenNames={allTokenNames}
          resolve={resolveTokenValue}
          onClose={() => setComponentModal(null)}
          onSave={(compData) => {
            if (Array.isArray(compData)) {
              handleAddComponents(compData);
            } else if (componentModal.mode === 'add') {
              handleAddComponent(compData);
            } else {
              handleEditComponent({ ...componentModal.component, ...compData });
            }
            setComponentModal(null);
          }}
        />
      )}

      {scaleModalOpen && (
        <ScaleModal
          existingTypographyTokens={activeTokens.Typography || []}
          onClose={() => setScaleModalOpen(false)}
          onCreate={(tokens) => { handleAddTokens(tokens); setScaleModalOpen(false); }}
        />
      )}

      {rampModalOpen && (
        <RampModal
          existingColorTokens={activeTokens.Color || []}
          background={activeTokens.Color?.find(t => t.name === 'brand.color.background')?.value || '#0D0D12'}
          onClose={() => setRampModalOpen(false)}
          onCreate={(tokens) => { handleAddTokens(tokens); setRampModalOpen(false); }}
        />
      )}

      {/* ── Token usages ── */}
      {/* What depends on a token. The other direction was always visible — the row prints
          "Resolves to" and the value cell's tooltip carries the chain — but dependents were
          only ever computable as a side effect of editing, through the impact panel. */}
      {usageTokenName && (() => {
        const token = tokenUsage.byName.get(usageTokenName);
        if (!token) return null;
        const u = usageOf(usageTokenName, tokenUsage);
        const resolved = resolveTokenValue(token.value);
        const chain = getTokenInheritanceChain(token.value);
        const isAlias = String(token.value || '').trim().startsWith('{');

        const toggle = (key) => setExpandedUsage(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key); else next.add(key);
          return next;
        });

        const componentLink = (c) => (
          <button
            type="button"
            onClick={() => {
              setUsageTokenName(null);
              setActiveTab('components');
              setPreviewComponentId(c.id);
            }}
            title={'Open ' + c.name}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
              textAlign: 'left', background: 'none', border: 'none', padding: '0.16rem 0',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'flex', color: 'var(--accent)', flexShrink: 0 }}>{componentIcon(11)}</span>
            <span style={{
              minWidth: 0, fontSize: '0.7rem', color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{c.name}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {c.prop}
            </span>
          </button>
        );

        // Depth-capped for the same reason the walk is: a hand-written alias loop must not
        // recurse forever just because someone opened the panel on it.
        const renderReferrer = (name, path, depth) => {
          const key = path + '/' + name;
          const own = referrersOf(name, tokenUsage);
          const kids = own.tokens.length + own.components.length;
          const open = expandedUsage.has(key);
          const cap = depth >= 8;
          return (
            <div key={key} style={{ paddingLeft: depth ? '0.85rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.16rem 0' }}>
                {kids > 0 && !cap ? (
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    title={open ? 'Collapse' : 'Expand'}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ) : (
                  <span style={{ width: '9px', flexShrink: 0 }} />
                )}
                <button
                  type="button"
                  onClick={() => openUsage(name)}
                  title={'Open ' + name}
                  style={{
                    flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem', color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </button>
                {kids > 0 && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{kids}</span>
                )}
              </div>
              {open && !cap && (
                <>
                  {own.tokens.map(n => renderReferrer(n, key, depth + 1))}
                  {own.components.map(c => (
                    <div key={key + '/c/' + c.id + c.prop} style={{ paddingLeft: '1.7rem' }}>
                      {componentLink(c)}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        };

        const sectionLabel = {
          fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--text-tertiary)', marginBottom: '0.3rem',
        };

        return (
          <div className="pd-preview-drawer" style={{
            position: 'fixed', right: 0, bottom: 0, width: '380px',
            background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
            boxShadow: '-12px 0 32px rgba(0,0,0,0.4)', zIndex: 400,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.9rem 1rem 0.7rem', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)',
                  overflowWrap: 'anywhere',
                }}>
                  {token.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                    background: layerColorFor(token.layer),
                  }} />
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
                    {(TOKEN_LAYER_LABELS[token.layer] || token.layer || 'Scoped') + ' · ' + token.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsageTokenName(null)}
                title="Close"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-tertiary)',
                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.1rem 0.2rem', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0.9rem 1rem' }}>
              {/* Downstream: what this token resolves through. Already computed for the
                  row's tooltip, so the same chain rather than a second opinion. */}
              <div style={{ marginBottom: '1.1rem' }}>
                <div style={sectionLabel}>Resolves to</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {renderTokenPreview({ ...token, value: resolved })}
                </div>
                {isAlias && chain.length > 1 && (
                  <div style={{
                    marginTop: '0.4rem', fontSize: '0.66rem', color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)', lineHeight: 1.6, overflowWrap: 'anywhere',
                  }}>
                    {chain.join(' ➔ ')}
                  </div>
                )}
                {!isAlias && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
                    a literal — nothing behind it
                  </div>
                )}
              </div>

              {/* Upstream. */}
              <div style={sectionLabel}>
                Used by
                {!u.unused && (
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                    {' · ' + (u.direct.tokens.length + u.direct.components.length) + ' direct, '
                      + (u.totalTokens + u.totalComponents) + ' in all'}
                  </span>
                )}
              </div>

              {u.unused ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  Nothing references this yet.
                  {isDeadToken(token, tokenUsage)
                    ? ' A ' + (TOKEN_LAYER_LABELS[token.layer] || token.layer).toLowerCase()
                      + ' token exists to be referenced, so this one is not doing anything.'
                    : ' That is normal for a palette or scale entry — they are generated as a set for you to pick from.'}
                </div>
              ) : (
                <>
                  {u.direct.tokens.length > 0 && (
                    <div style={{ marginBottom: '0.7rem' }}>
                      {u.direct.tokens.map(n => renderReferrer(n, 'root', 0))}
                    </div>
                  )}
                  {u.direct.components.length > 0 && (
                    <div>
                      <div style={{ ...sectionLabel, marginTop: '0.5rem' }}>Components</div>
                      {u.direct.components.map(c => (
                        <div key={'c/' + c.id + c.prop}>{componentLink(c)}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Properties inspector ── */}
      {/* Selecting a component fills this rail. It used to be a read-only preview
          drawer; it is now where properties are edited, so every change commits
          straight through handleEditComponent with no Save step. The Details button
          still opens the dialog for name/type/description and the code view. */}
      {(() => {
        const comp = components.find(c => c.id === previewComponentId);
        if (!comp) return null;
        // Components created from presets store the legacy short keys (bg, textColor,
        // borderRadius…). The inspector is keyed on real CSS properties, so normalise on
        // the way in — otherwise those mappings are invisible here and editing would add a
        // second mapping for the same property while the old key still applied.
        // cssPropForTokenKey passes anything already-a-CSS-property straight through, so
        // this is lossless, and saving the normalised map migrates the component.
        const normalizedTokens = {};
        for (const [k, v] of Object.entries(comp.tokens || {})) {
          if (v) normalizedTokens[cssPropForTokenKey(k)] = v;
        }
        // What the parent chain provides, normalised the same way. Taken from the PARENT,
        // not from the merged result: a row needs to know what it would fall back to even
        // when this component overrides it, or an override cannot offer a reset.
        const parent = comp.extends ? componentsById[comp.extends] : null;
        const inheritedTokens = {};
        if (parent) {
          for (const [k, v] of Object.entries(effectiveTokens(parent, componentsById))) {
            if (v) inheritedTokens[cssPropForTokenKey(k)] = v;
          }
        }
        return (
          <div ref={previewDrawerRef} className="pd-preview-drawer" style={{
            position: 'fixed', right: 0, bottom: 0, width: '380px',
            background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
            boxShadow: '-12px 0 32px rgba(0,0,0,0.4)', zIndex: 400,
            display: 'flex', flexDirection: 'column',
          }}>
            <ComponentInspector
              component={{ ...comp, tokens: normalizedTokens }}
              inheritedTokens={inheritedTokens}
              parent={parent}
              parentOptions={eligibleParents(comp, components)}
              onSetParent={(parentId) => handleEditComponent(
                parentId ? { ...comp, extends: parentId } : (() => { const n = { ...comp }; delete n.extends; return n; })()
              )}
              childComponents={childrenOf(comp, componentsById)}
              childOptions={eligibleChildren(comp, components)}
              onSetChildren={(ids) => handleEditComponent({ ...comp, children: ids })}
              onSelectComponent={setPreviewComponentId}
              tokensForProperty={getTokenNamesForProperty}
              presetsForProperty={getPresetTokensForProperty}
              onCreateToken={createTokenForProperty}
              existingTokenNames={allTokenNames}
              resolve={resolveTokenValue}
              onChange={handleEditComponent}
              onOpenEditor={(c) => setComponentModal({ mode: 'edit', component: c })}
              onClose={() => setPreviewComponentId(null)}
              renderPreview={renderLivePreview}
              canEdit={can(myRole, 'components', 'edit')}
            />
          </div>
        );
      })()}


      {/* ── Downstream Impact Review Bottom Panel ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '360px',
        background: 'rgba(19, 19, 26, 0.95)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1000,
        transform: pendingChange ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit'
      }}>
        {pendingChange && (() => {
          const impact = computeImpact(pendingChange);
          const totalImpacts = impact.brandBible.length + impact.tokens.length + impact.components.length;
          
          return (
            <>
              {/* Header */}
              <div style={{ 
                padding: '1rem 2rem', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Downstream Impact Review
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                      {pendingChange.type === 'token' ? (
                        <>Modified token <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pendingChange.originalName}</span> ({pendingChange.oldValue} &rarr; {pendingChange.newValue})</>
                      ) : (
                        <>Updated brand attribute <span style={{ color: 'var(--text-secondary)' }}>{pendingChange.field}</span></>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={cancelChange} 
                    style={{ 
                      background: 'none', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text-secondary)', 
                      padding: '0.5rem 1.25rem', 
                      borderRadius: '8px', 
                      fontSize: '0.82rem', 
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => applyChange(selectedImpacts)} 
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.5rem 1.25rem', 
                      borderRadius: '8px', 
                      fontSize: '0.82rem', 
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                      background: 'transparent'
                    }}
                  >
                    Accept Selected
                  </button>
                  <button 
                    onClick={() => {
                      const allTokens = {};
                      impact.tokens.forEach(t => allTokens[t.name] = true);
                      const allComps = {};
                      impact.components.forEach(c => allComps[c.id] = true);
                      applyChange({ tokens: allTokens, components: allComps });
                    }} 
                    className="btn btn-primary"
                    style={{ 
                      padding: '0.5rem 1.5rem', 
                      borderRadius: '8px', 
                      fontSize: '0.82rem'
                    }}
                  >
                    Accept All ({totalImpacts} change{totalImpacts !== 1 ? 's' : ''})
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Tab selector */}
                <div style={{ 
                  width: '220px', 
                  borderRight: '1px solid var(--border)', 
                  background: 'rgba(0,0,0,0.15)', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {[
                    { id: 'brandBible', label: 'Brand Bible', count: impact.brandBible.length },
                    { id: 'tokens', label: 'Downstream Tokens', count: impact.tokens.length },
                    { id: 'components', label: 'Components Affected', count: impact.components.length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setImpactPanelTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        background: impactPanelTab === tab.id ? 'var(--bg-tertiary)' : 'none',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.6rem 0.75rem',
                        color: impactPanelTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        fontWeight: impactPanelTab === tab.id ? 500 : 400
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '10px', 
                        background: tab.count > 0 ? 'var(--accent-glow)' : 'rgba(255,255,255,0.04)', 
                        color: tab.count > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                        fontWeight: 600
                      }}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
                  
                  {/* Brand Bible Tab */}
                  {impactPanelTab === 'brandBible' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {impact.brandBible.map((sec, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '1.25rem' }}>📄</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sec.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>{sec.description}</div>
                          </div>
                        </div>
                      ))}
                      {impact.brandBible.length === 0 && (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No Brand Bible sections are affected by this change.</div>
                      )}
                    </div>
                  )}

                  {/* Downstream Tokens Tab */}
                  {impactPanelTab === 'tokens' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {impact.tokens.map((tok, i) => {
                        const isChecked = selectedImpacts.tokens?.[tok.name] !== false;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => {
                                  setSelectedImpacts(prev => ({
                                    ...prev,
                                    tokens: {
                                      ...prev.tokens,
                                      [tok.name]: !isChecked
                                    }
                                  }));
                                }}
                                style={{ accentColor: 'var(--accent)' }}
                              />
                              <div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{tok.name}</span>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                                  Path: {tok.path.join(' → ')}
                                </div>
                              </div>
                            </label>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textDecoration: isChecked ? 'none' : 'line-through' }}>{tok.oldValue}</span>
                              <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                              <span style={{ fontFamily: 'var(--font-mono)', color: isChecked ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                                {isChecked ? tok.newValue : tok.oldValue + ' (Detached)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {impact.tokens.length === 0 && (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No downstream tokens reference this token.</div>
                      )}
                    </div>
                  )}

                  {/* Components Tab */}
                  {impactPanelTab === 'components' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {impact.components.map((comp, i) => {
                        const isChecked = selectedImpacts.components?.[comp.id] !== false;
                        const origComp = components.find(c => c.id === comp.id);
                        const previewComp = isChecked ? {
                          ...origComp,
                          tokens: origComp?.tokens ? (() => {
                            const tCopy = { ...origComp.tokens };
                            comp.changedProps.forEach(cp => {
                              tCopy[cp.prop] = cp.newValue;
                            });
                            return tCopy;
                          })() : null
                        } : origComp;

                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => {
                                    setSelectedImpacts(prev => ({
                                      ...prev,
                                      components: {
                                        ...prev.components,
                                        [comp.id]: !isChecked
                                      }
                                    }));
                                  }}
                                  style={{ accentColor: 'var(--accent)' }}
                                />
                                <div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{comp.name}</span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'capitalize' }}>Template: {comp.template}</span>
                                </div>
                              </label>
                            </div>

                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.75rem' }}>
                              {comp.changedProps.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{p.prop}:</span>
                                  <span style={{ color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {p.oldValue} → {isChecked ? p.newValue : p.oldValue + ' (Detached)'}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div style={{ 
                              background: 'var(--bg-secondary)', 
                              borderRadius: '8px', 
                              padding: '0.75rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              minHeight: '60px',
                              border: '1px solid var(--border)',
                              opacity: isChecked ? 1 : 0.4,
                              transition: 'opacity 0.2s'
                            }}>
                              {previewComp && renderLivePreview(previewComp)}
                            </div>
                          </div>
                        );
                      })}
                      {impact.components.length === 0 && (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem', gridColumn: 'span 2' }}>No components are affected by this change.</div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Brand Bible AI Suggestions Modal ── */}
      {suggestionsModalData && (
        <BrandBibleSuggestionsModal 
          suggestions={suggestionsModalData}
          onClose={() => setSuggestionsModalData(null)}
          onApply={handleApplySuggestions}
        />
      )}

      {/* ── Undo Toast Alert ── */}
      {showUndoToast && (
        <div style={{
          position: 'fixed',
          bottom: pendingChange ? '380px' : '24px',
          right: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 1050,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            Changes applied successfully.
          </span>
          <button 
            onClick={handleUndo}
            style={{
              background: 'var(--accent-glow)',
              border: '1px solid rgba(252,6,148,0.2)',
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              color: 'var(--accent)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Undo
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* All-components list: the whole row opens the component, so it needs a
           hover affordance. Selection lives in a class rather than an inline
           style so hover can layer over it without needing !important. */
        /* The kebab is the only row action, so it must stay reachable without a pointer:
           :focus-within covers keyboard, and the mobile rule below pins it visible. */
        /* Three tiers, so the tree reads top to bottom: the category row is 1rem in,
           the type row 2.2rem, and a component name deeper still than its type label.
           Only the name cell is indented — the Type/Properties/Action columns stay
           aligned with the header row. */
        .pd-tree-name-cell { padding: 0 0 0 5.6rem; }
        /* Fourth tier: a fragment's children sit one step inside the fragment itself. */
        .pd-tree-child-name { padding-left: 7.2rem !important; }
        .pd-tree-style-row:hover { background: rgba(255,255,255,0.03); }
        .pd-tree-type-row:hover { background: var(--bg-tertiary) !important; }

        .pd-tree-row-kebab,
        .pd-tree-folder-add {
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        /* The inspector is fixed to the right, so the page reserves its width rather
           than letting it sit on top of the component tree. */
        /* Starts below the project toolbar, which ends at 92px — the old 52px was set
           when this was a transient preview and covered Share and Publish. The top
           offset lives here rather than inline so the mobile override can win. */
        .pd-preview-drawer { top: 92px; }

        ${entranceKeyframesCss()}

        /* Respect a reduced-motion preference: the button still works, it just does not
           fling the component around. */
        @media (prefers-reduced-motion: reduce) {
          .pd-preview-stage { animation-duration: 1ms !important; }
        }

        /* Eight of the property names are wider than the label column (Grid Template
           Columns, Text Decoration Color and friends). Hovering lifts the label out of
           its cell to show the whole name, using a ring of the panel colour so it reads
           over whatever sits beside it — no reflow, unlike widening the column. */
        .pd-inspector-label:hover {
          overflow: visible !important;
          position: relative;
          z-index: 3;
          background: var(--bg-secondary);
          box-shadow: 0 0 0 4px var(--bg-secondary);
          border-radius: 3px;
        }
        .pd-main.has-inspector { padding-right: calc(380px + 2rem) !important; }

        .pd-tree-folder-row:hover .pd-tree-folder-add,
        .pd-tree-folder-row:focus-within .pd-tree-folder-add {
          opacity: 1;
        }
        .pd-tree-folder-add:hover { background: var(--bg-secondary) !important; color: var(--accent) !important; }
        /* Both trees: the kebab appears on hover, but must stay reachable without a
           pointer and must not vanish out from under one while its menu is open. */
        .pd-component-list-row:hover .pd-tree-row-kebab,
        .pd-component-list-row:focus-within .pd-tree-row-kebab,
        .pd-token-row:hover .pd-tree-row-kebab,
        .pd-token-row:focus-within .pd-tree-row-kebab,
        .pd-tree-row-kebab:focus-visible,
        .pd-tree-row-kebab.is-open {
          opacity: 1;
        }
        .pd-token-row:hover { background: rgba(255,255,255,0.045); }

        .pd-component-list-row:not(.pd-component-list-row-head):hover {
          background: rgba(255,255,255,0.045);
        }
        .pd-component-list-row.pd-component-list-row-selected {
          background: var(--accent-glow);
        }
        .pd-component-list-row.pd-component-list-row-selected:hover {
          background: rgba(252,6,148,0.16);
        }

        /* Mobile-only surfaces, collapsed on desktop by default */
        .pd-sidebar-rail-bottom, .pd-mobile-nav-toggle { display: none; }

        /* ── Collapsible sidebar (desktop) ──────────────────────────────────────
           NOTE: .pd-sidebar.is-collapsed below duplicates the rail declarations in
           the max-width:768px block further down. They are the same 52px rail, but
           one is class-driven and the other media-driven, so they cannot be merged
           into a single rule — change them together. */
        .pd-sidebar { width: 200px; transition: width 0.18s ease; }

        .pd-sidebar.is-collapsed { width: 52px; align-items: center; }
        .pd-sidebar.is-collapsed .pd-sidebar-tabs {
          width: 100%;
          align-items: center;
          padding: 0 0.6rem !important;
        }
        .pd-sidebar.is-collapsed .pd-sidebar-tab-btn {
          width: 32px;
          height: 32px;
          justify-content: center;
          padding: 0;
        }
        .pd-sidebar.is-collapsed .pd-sidebar-tab-label { display: none; }
        /* with the labels gone the glyph is the only cue, so give it a little more size */
        .pd-sidebar.is-collapsed .pd-sidebar-tab-btn svg { width: 15px !important; height: 15px !important; flex: none; }
        .pd-sidebar.is-collapsed .pd-sidebar-categories { display: none; }
        .pd-sidebar.is-collapsed .pd-sidebar-divider { width: 32px; }

        .pd-sidebar-collapse-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          margin: 0 0.75rem 0.5rem auto;
          background: none; border: none; border-radius: 6px;
          color: var(--text-tertiary); cursor: pointer; flex-shrink: 0;
        }
        .pd-sidebar-collapse-toggle:hover { color: var(--accent); background: var(--accent-glow); }
        .pd-sidebar.is-collapsed .pd-sidebar-collapse-toggle { margin: 0 auto 0.5rem; }


        @media (max-width: 768px) {
          /* Three columns is a desktop layout; on a phone the rows need the full width. */
          .pd-setup-grid { grid-template-columns: 1fr !important; }
          .pd-header { padding: 0 0.875rem !important; gap: 0.625rem !important; }
          .pd-status-pill { display: none !important; }
          .pd-btn-label { display: none; }
          .pd-export-btn, .pd-header-sync, .pd-header-avatar { display: none !important; }
          .pd-header-saved, .pd-header-branch { display: none !important; }
          .pd-header-live-dot { display: inline-block !important; }

          /* Sidebar collapses to a 52px icon-only rail, same row layout as desktop */
          .pd-sidebar {
            width: 52px !important;
            flex-shrink: 0;
            align-items: center;
            padding: 0.75rem 0 !important;
          }
          .pd-sidebar-tabs {
            width: 100%;
            display: flex !important;
            flex-direction: column !important;
            align-items: center;
            padding: 0 0.6rem !important;
            gap: 0.3rem;
          }
          .pd-sidebar-tab-btn {
            width: 32px !important;
            height: 32px;
            justify-content: center !important;
            padding: 0 !important;
          }
          .pd-sidebar-tab-btn-active { background: rgba(252,6,148,0.08) !important; color: var(--accent) !important; }
          .pd-sidebar-tab-label { display: none; }

          .pd-mobile-nav-toggle {
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; margin: 0 0 0.5rem;
            background: none; border: none; border-radius: 6px;
            color: var(--text-secondary); cursor: pointer;
          }

          /* Both tabs now group inside their own table, so nothing needs to move out
             of the rail here — the fixed bottom chip bar is gone with it. */
          .pd-sidebar-categories { display: none !important; }
          .pd-sidebar-collapse-toggle { display: none !important; }
          .pd-sidebar, .pd-sidebar.is-collapsed { width: 52px !important; }
          .pd-token-search-wrap { width: 100% !important; }
          .pd-table-controls { width: 100%; }
          .pd-table-controls > * { flex: 1 1 auto; }
          /* A 380px drawer would be a squeezed sliver on a phone */
          /* Full-screen on a phone — a 380px side panel is a sliver there,
             and top:0 covers the app header so it truly fills the screen. */
          .pd-preview-drawer { width: 100% !important; top: 0 !important; }
          .pd-main.has-inspector { padding-right: 1rem !important; }

          /* Expanded nav overlay — the rail's hamburger toggle opens this */
          .pd-mobile-nav-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 300;
          }
          .pd-mobile-nav-overlay {
            position: fixed; top: 0; left: 0; bottom: 0;
            width: 240px; max-width: 80vw;
            background: var(--bg-secondary); border-right: 1px solid var(--border);
            padding: 1rem 0 1.25rem; overflow-y: auto; z-index: 301;
            box-shadow: 8px 0 24px rgba(0,0,0,0.4);
            display: flex; flex-direction: column;
          }
          .pd-mobile-nav-overlay .pd-sidebar-tab-btn {
            width: 100% !important; height: auto !important;
            justify-content: flex-start !important; padding: 0.5rem 0.625rem !important;
          }
          .pd-mobile-nav-overlay .pd-sidebar-tab-label { display: inline !important; }
          .pd-mobile-nav-bottom {
            margin-top: auto; padding: 1rem 0.75rem 0; border-top: 1px solid var(--border);
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          }

          /* Sync / Export / Account relocate from the header into the rail's bottom section */
          .pd-sidebar-rail-bottom {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
            margin-top: auto;
            padding-top: 0.75rem;
            border-top: 1px solid var(--border);
          }
          .pd-rail-btn {
            width: 32px; height: 32px; border-radius: 6px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);
          }
          .pd-rail-btn-accent { background: rgba(252,6,148,0.13); border-color: rgba(252,6,148,0.25); color: var(--accent); }
          .pd-rail-btn-ghost { background: transparent; border-color: #333; }
          .pd-rail-avatar {
            width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
            background: var(--accent); color: #fff; font-family: var(--font-heading); font-weight: 700; font-size: 0.7rem;
            display: flex; align-items: center; justify-content: center;
          }

          .pd-tokens-header { flex-direction: column !important; align-items: stretch !important; }
          .pd-tokens-header-actions { justify-content: space-between !important; }
          .pd-tokens-header-actions button { flex: 1; }

          .pd-token-table-header { display: none !important; }
          /* Three cells now the type badge is gone — the folder above states the type.
             Rows sit inside the tree's own bordered container, so they keep the tree's
             padding rather than becoming free-floating cards. */
          .pd-token-row {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 0.35rem 0.5rem !important;
            padding: 0.6rem 1rem !important;
          }
          /* The name takes row 1 outright. Sharing it with the preview left the
             indented name column with no width at all on a 390px screen. */
          .pd-token-row > *:nth-child(1) {
            grid-column: 1 / -1; grid-row: 1; min-width: 0; align-self: center;
          }
          /* Row 2: value on the left, preview flush right */
          .pd-token-row > *:nth-child(2) { grid-column: 1; grid-row: 2; min-width: 0; }
          .pd-token-row > *:nth-child(3) {
            grid-column: 2; grid-row: 2; justify-self: end; align-self: center;
          }
          /* Row 3: description */
          .pd-token-row-desc { display: block !important; grid-column: 1 / -1; grid-row: 3; }
          .pd-token-row-value-duplicate { display: none !important; }

          .pd-token-copy-btn { display: inline-flex !important; }

          .pd-brand-subtabs {
            display: flex !important;
            position: fixed;
            left: 52px; right: 0; bottom: 0;
            width: auto;
            background: var(--bg-secondary);
            border: none;
            border-top: 1px solid var(--border);
            border-radius: 0;
            padding: 0.625rem 0.75rem;
            margin-bottom: 0 !important;
            overflow-x: auto;
            z-index: 150;
          }
          .pd-brand-subtab-btn { flex-shrink: 0; white-space: nowrap; }

          .pd-brand-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .pd-brand-grid > * { min-width: 0; }
          .pd-brand-minigrid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }

          .pd-manifesto-header { flex-direction: column !important; align-items: stretch !important; gap: 0.75rem; }
          .pd-manifesto-actions { width: 100%; }
          .pd-manifesto-actions button { flex: 1; text-align: center; }

          .pd-assets-header { flex-direction: column; align-items: flex-start !important; gap: 0.75rem; }
          .pd-bible-download-btn { border-radius: 100px !important; align-self: flex-start; }
          .pd-bible-cover-label { font-size: 0.65rem; white-space: nowrap; }


          /* All-components list: the columns can't stay legible on a phone, so
             each row becomes a stacked card. Its header row is dropped — the
             labels mean nothing once the columns are stacked. */
          /* No room for a side-by-side preview on a phone, so the editor stacks
             and the preview leads — seeing the component matters more than
             seeing the fields first. */
          .pd-editor-split { grid-template-columns: 1fr !important; }
          .pd-component-code { height: 200px !important; }
          .pd-editor-preview { position: static !important; order: -1; }

          /* A fixed-width search box wastes a phone's width. */
          .pd-component-search { width: 100% !important; }

          /* Just the name and its kebab now, so the row stays a single line even
             on a phone — no stacked card needed. */
          .pd-component-list-row {
            grid-template-columns: 1fr auto !important;
          }
          .pd-component-list-row-head { display: none !important; }
          /* Three icons crowd the card's top-right corner, so they collapse
             into a kebab menu here. Desktop keeps them inline in the column. */
          /* The desktop indent costs a phone too much of the name column, so the tiers
             tighten here — still stepped, just less far. */
          .pd-tree-name-cell { padding-left: 4rem !important; }
          /* 4rem of indent plus a 120px tile plus the name overflows 390px. */
          .pd-component-thumb { width: 84px !important; height: 48px !important; }
          .pd-tree-child-name { padding-left: 5.2rem !important; }
          .pd-tree-type-row { padding-left: 1.8rem !important; }
          /* touch has no hover, so the row and folder actions are always shown */
          .pd-tree-row-kebab, .pd-tree-folder-add { opacity: 1 !important; }

          .pd-handoff-card { padding: 1.25rem !important; }
          .pd-codeassets-card { padding: 1.25rem !important; }
          /* Sub-tab switcher becomes a fixed bottom navbar on mobile, matching Figma's Frame 8 */
          .pd-handoff-subtabs {
            position: fixed;
            left: 52px; right: 0; bottom: 0;
            display: flex !important;
            gap: 0.5rem !important;
            background: var(--bg-tertiary);
            border: none !important;
            border-top: 1px solid var(--border);
            padding: 0.75rem !important;
            margin-bottom: 0 !important;
            z-index: 150;
          }
          .pd-handoff-subtabs .pd-handoff-subtab-btn {
            flex: 1;
            white-space: nowrap;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.78rem !important;
          }
          .pd-handoff-id-row { flex-wrap: wrap; gap: 0.5rem; }
          .pd-handoff-token-row { flex-direction: column !important; max-width: 100% !important; }
          .pd-handoff-token-row input { width: 100%; }
          .pd-handoff-grid { grid-template-columns: 1fr !important; }
          .pd-exporter-header { flex-wrap: wrap; gap: 0.5rem; }
          .pd-handoff-dict-header { flex-direction: column !important; align-items: stretch !important; gap: 0.75rem; }
          .pd-handoff-dict-header input { max-width: 100% !important; }
        }
      `}} />


      {/* How do you want to start? — the step between Get Started and either path. */}
      {startChoice && (
        <div
          onClick={() => setStartChoice(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
            background: 'rgba(9, 9, 12, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '2rem', width: 'min(680px, 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <StartChoice
              onClose={() => setStartChoice(false)}
              onPick={(key) => {
                setStartChoice(false);
                if (key === 'scratch') setScratchWizard(true);
                else openBrandEngine();
              }}
            />
          </div>
        </div>
      )}

      {scratchWizard && (
        <ScratchWizard
          projectName={project?.name}
          onClose={() => setScratchWizard(false)}
          onSaveContext={saveBrandContext}
          onApply={(payload) => { applyBrandContext(payload); setScratchWizard(false); }}
        />
      )}
      {engine && (
        <BrandContextEngine
          project={project}
          owner={user?.email || ''}
          initialStep={engine.step}
          initialSource={engine.source}
          onClose={() => setEngine(null)}
          onSave={saveBrandContext}
          onApply={applyBrandContext}
        />
      )}
    </div>
  );
}

/* ── Utility functions for token translation ── */
// Maps every selectable "type" (legacy camelCase + the full CSS-property
// taxonomy from the Category dropdown) to its sidebar/data bucket.
const TYPE_TO_CATEGORY = {
  color: 'Color', 'background-color': 'Color', 'border-color': 'Color', 'outline-color': 'Color',
  'text-decoration-color': 'Color', 'accent-color': 'Color', fill: 'Color', stroke: 'Color',

  fontFamily: 'Typography', 'font-family': 'Typography', fontSize: 'Typography', 'font-size': 'Typography',
  'font-weight': 'Typography', 'font-style': 'Typography', 'line-height': 'Typography',
  'letter-spacing': 'Typography', 'text-align': 'Typography', 'text-transform': 'Typography',
  'text-decoration': 'Typography', 'word-spacing': 'Typography',

  spacing: 'Spacing', padding: 'Spacing', 'padding-top': 'Spacing', 'padding-right': 'Spacing',
  'padding-bottom': 'Spacing', 'padding-left': 'Spacing', margin: 'Spacing', 'margin-top': 'Spacing',
  'margin-right': 'Spacing', 'margin-bottom': 'Spacing', 'margin-left': 'Spacing',

  width: 'Sizing', height: 'Sizing', 'min-width': 'Sizing', 'min-height': 'Sizing',
  'max-width': 'Sizing', 'max-height': 'Sizing',

  borderRadius: 'Border', border: 'Border', 'border-width': 'Border', 'border-style': 'Border',
  'border-radius': 'Border', outline: 'Border', 'outline-width': 'Border', 'outline-style': 'Border',
  'outline-offset': 'Border',

  shadow: 'Shadow', opacity: 'Shadow', 'box-shadow': 'Shadow', 'text-shadow': 'Shadow',
  transform: 'Shadow', cursor: 'Shadow', filter: 'Shadow', 'backdrop-filter': 'Shadow',

  duration: 'Motion', easing: 'Motion', transition: 'Motion', 'transition-duration': 'Motion',
  'animation-duration': 'Motion', 'animation-name': 'Motion', animationName: 'Motion',

  display: 'Layout', position: 'Layout', top: 'Layout', right: 'Layout', bottom: 'Layout',
  left: 'Layout', 'z-index': 'Layout', overflow: 'Layout',

  'flex-direction': 'Flexbox', 'flex-wrap': 'Flexbox', 'flex-grow': 'Flexbox', 'flex-shrink': 'Flexbox',
  'flex-basis': 'Flexbox', 'justify-content': 'Flexbox', 'align-items': 'Flexbox', 'align-content': 'Flexbox',
  'align-self': 'Flexbox', order: 'Flexbox', gap: 'Flexbox', 'row-gap': 'Flexbox', 'column-gap': 'Flexbox',
  'grid-template-columns': 'Flexbox', 'grid-template-rows': 'Flexbox', 'grid-column': 'Flexbox',
  'grid-row': 'Flexbox', 'grid-area': 'Flexbox',

  'list-style': 'Lists', 'list-style-type': 'Lists',
};

const getCategoryForType = (type) => TYPE_TO_CATEGORY[type] || 'Color';

const getDefaultTypeForCategory = (category) => {
  if (category === 'Color') return 'color';
  if (category === 'Typography') return 'fontFamily';
  if (category === 'Spacing') return 'spacing';
  if (category === 'Sizing') return 'width';
  if (category === 'Border') return 'borderRadius';
  if (category === 'Shadow') return 'shadow';
  if (category === 'Motion') return 'duration';
  if (category === 'Layout') return 'display';
  if (category === 'Flexbox') return 'flex-direction';
  if (category === 'Lists') return 'list-style';
  return 'color';
};

// Groups shown in the Add/Edit Token "Category" dropdown — one group per
// sidebar bucket (Color/Typography/Spacing/Sizing/Border/Shadow/Motion/
// Layout/Flexbox/Lists), in the same order as the sidebar. Every group's
// `display` name matches its bucket exactly, so TYPE_TO_CATEGORY and the
// dropdown never disagree about where a property lives.
const CATEGORY_GROUPS = [
  { display: 'Color', items: [
    { type: 'color', label: 'color' },
    { type: 'background-color', label: 'background-color' },
    { type: 'border-color', label: 'border-color' },
    { type: 'outline-color', label: 'outline-color' },
    { type: 'text-decoration-color', label: 'text-decoration-color' },
    { type: 'accent-color', label: 'accent-color' },
    { type: 'fill', label: 'fill' },
    { type: 'stroke', label: 'stroke' },
  ] },
  { display: 'Typography', items: [
    { type: 'font-family', label: 'font-family' },
    { type: 'font-size', label: 'font-size' },
    { type: 'font-weight', label: 'font-weight' },
    { type: 'font-style', label: 'font-style' },
    { type: 'line-height', label: 'line-height' },
    { type: 'letter-spacing', label: 'letter-spacing' },
    { type: 'text-align', label: 'text-align' },
    { type: 'text-transform', label: 'text-transform' },
    { type: 'text-decoration', label: 'text-decoration' },
    { type: 'word-spacing', label: 'word-spacing' },
  ] },
  { display: 'Spacing', items: [
    { type: 'padding', label: 'padding' },
    { type: 'padding-top', label: 'padding-top' },
    { type: 'padding-right', label: 'padding-right' },
    { type: 'padding-bottom', label: 'padding-bottom' },
    { type: 'padding-left', label: 'padding-left' },
    { type: 'margin', label: 'margin' },
    { type: 'margin-top', label: 'margin-top' },
    { type: 'margin-right', label: 'margin-right' },
    { type: 'margin-bottom', label: 'margin-bottom' },
    { type: 'margin-left', label: 'margin-left' },
  ] },
  { display: 'Sizing', items: [
    { type: 'width', label: 'width' },
    { type: 'height', label: 'height' },
    { type: 'min-width', label: 'min-width' },
    { type: 'min-height', label: 'min-height' },
    { type: 'max-width', label: 'max-width' },
    { type: 'max-height', label: 'max-height' },
  ] },
  { display: 'Border', items: [
    { type: 'border', label: 'border' },
    { type: 'border-width', label: 'border-width' },
    { type: 'border-style', label: 'border-style' },
    { type: 'border-radius', label: 'border-radius' },
    { type: 'outline', label: 'outline' },
    { type: 'outline-width', label: 'outline-width' },
    { type: 'outline-style', label: 'outline-style' },
    { type: 'outline-offset', label: 'outline-offset' },
  ] },
  { display: 'Shadow', items: [
    { type: 'opacity', label: 'opacity' },
    { type: 'box-shadow', label: 'box-shadow' },
    { type: 'text-shadow', label: 'text-shadow' },
    { type: 'transform', label: 'transform' },
    { type: 'cursor', label: 'cursor' },
    { type: 'filter', label: 'filter' },
    { type: 'backdrop-filter', label: 'backdrop-filter' },
  ] },
  { display: 'Motion', items: [
    { type: 'transition', label: 'transition' },
    { type: 'transition-duration', label: 'transition-duration' },
    { type: 'animation-duration', label: 'animation-duration' },
    { type: 'animation-name', label: 'animation-name' },
  ] },
  { display: 'Layout', items: [
    { type: 'display', label: 'display' },
    { type: 'position', label: 'position' },
    { type: 'top', label: 'top' },
    { type: 'right', label: 'right' },
    { type: 'bottom', label: 'bottom' },
    { type: 'left', label: 'left' },
    { type: 'z-index', label: 'z-index' },
    { type: 'overflow', label: 'overflow' },
  ] },
  { display: 'Flexbox', items: [
    { type: 'flex-direction', label: 'flex-direction' },
    { type: 'flex-wrap', label: 'flex-wrap' },
    { type: 'flex-grow', label: 'flex-grow' },
    { type: 'flex-shrink', label: 'flex-shrink' },
    { type: 'flex-basis', label: 'flex-basis' },
    { type: 'justify-content', label: 'justify-content' },
    { type: 'align-items', label: 'align-items' },
    { type: 'align-content', label: 'align-content' },
    { type: 'align-self', label: 'align-self' },
    { type: 'order', label: 'order' },
    { type: 'gap', label: 'gap' },
    { type: 'row-gap', label: 'row-gap' },
    { type: 'column-gap', label: 'column-gap' },
    { type: 'grid-template-columns', label: 'grid-template-columns' },
    { type: 'grid-template-rows', label: 'grid-template-rows' },
    { type: 'grid-column', label: 'grid-column' },
    { type: 'grid-row', label: 'grid-row' },
    { type: 'grid-area', label: 'grid-area' },
  ] },
  { display: 'Lists', items: [
    { type: 'list-style', label: 'list-style' },
    { type: 'list-style-type', label: 'list-style-type' },
  ] },
];

// Normalizes camelCase and kebab-case variants of the same property (e.g.
// "fontSize" / "font-size") to one key, so lookups match regardless of which
// convention a given caller's token `type` happens to use.
const getGroupDisplayForType = (type) => {
  const norm = normalizeTypeKey(type);
  const group = CATEGORY_GROUPS.find(g => g.items.some(i => normalizeTypeKey(i.type) === norm));
  return group ? group.display : 'Color';
};

// ── Component style-property mapping ──────────────────────────────────────
// A component's `tokens` object maps a CSS property to a token name. The six
// keys below predate the free-form property table, so they're still written
// and read as-is (existing saved components keep working); any property added
// since is stored under its real CSS property name.
const LEGACY_TOKEN_KEY_TO_CSS = {
  bg: 'background-color',
  textColor: 'color',
  padding: 'padding',
  borderRadius: 'border-radius',
  fontFamily: 'font-family',
  fontSize: 'font-size',
};

const cssPropForTokenKey = (key) => LEGACY_TOKEN_KEY_TO_CSS[key] || key;

// "padding-top" → "paddingTop", so it can be handed to a React style object.
const cssPropToStyleKey = (prop) => prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());


/* ── Announcement bar promoting the Upload Image tab ── */
function UploadAnnouncementBanner({ message, onDismiss }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      background: 'var(--accent-glow)', border: '1px solid rgba(252,6,148,0.25)',
      borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
    }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, lineHeight: 1, padding: '0.1rem' }}
      >
        ×
      </button>
    </div>
  );
}

/* ── Searchable, grouped Category dropdown for the Token modal ── */
function CategoryDropdown({ type, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(getGroupDisplayForType(type));
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const query = search.trim().toLowerCase();
  const filteredGroups = CATEGORY_GROUPS
    .map(group => ({ ...group, items: query ? group.items.filter(i => i.label.includes(query)) : group.items }))
    .filter(group => !query || group.items.length > 0);

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '10px 12.8px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '13px', color: '#D9D9E5' }}>{getGroupDisplayForType(type)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px',
          maxHeight: '260px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search CSS properties..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '8px' }}>
            {filteredGroups.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>No matches</div>
            )}
            {filteredGroups.map(group => {
              const isOpen = query ? true : expandedGroup === group.display;
              return (
                <div key={group.display} style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isOpen ? null : group.display)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', padding: '6px 12px', borderRadius: '8px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.25px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                      {group.display}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '4px', paddingTop: '2px' }}>
                      {group.items.map(item => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => { onSelect(item.type); setOpen(false); setSearch(''); }}
                          onMouseEnter={e => { if (item.type !== type) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                          onMouseLeave={e => { if (item.type !== type) e.currentTarget.style.background = 'none'; }}
                          style={{
                            textAlign: 'left', background: item.type === type ? 'var(--bg-secondary)' : 'none',
                            border: 'none', color: item.type === type ? 'var(--text-primary)' : '#A6A6B2',
                            fontSize: '12px', padding: '6px 12px 6px 24px', borderRadius: '6px',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.1s',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Visual token preview helper ── */
const renderTokenPreview = (token) => {
  const { type, value } = token;
  if (!value) return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>-</span>;

  let cleanValue = String(value).trim();

  switch (type) {
    case 'color':
    case 'background-color':
    case 'border-color':
    case 'outline-color':
    case 'text-decoration-color':
    case 'accent-color':
    case 'fill':
    case 'stroke':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '4px',
            background: cleanValue, border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexShrink: 0
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cleanValue}
          </span>
        </div>
      );
      
    case 'fontSize':
    case 'font-size':
      let sizeVal = cleanValue;
      if (/^\d+$/.test(sizeVal)) sizeVal += 'px';
      return (
        <span style={{ fontSize: sizeVal, color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
          Aa
        </span>
      );
      
    case 'fontFamily':
    case 'font-family':
      return (
        <span style={{ fontFamily: cleanValue, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
          Aa Bb Cc
        </span>
      );
      
    case 'spacing':
    case 'padding':
    case 'padding-top':
    case 'padding-right':
    case 'padding-bottom':
    case 'padding-left':
    case 'margin':
    case 'margin-top':
    case 'margin-right':
    case 'margin-bottom':
    case 'margin-left':
    case 'gap':
    case 'row-gap':
    case 'column-gap':
    case 'width':
    case 'height':
    case 'min-width':
    case 'min-height':
    case 'max-width':
    case 'max-height':
    case 'top':
    case 'right':
    case 'bottom':
    case 'left':
      let spacingVal = cleanValue;
      if (/^\d+$/.test(spacingVal)) spacingVal += 'px';
      return (
        <div style={{
          height: '10px',
          width: spacingVal,
          maxWidth: '100px',
          minWidth: '4px',
          background: 'var(--accent)',
          borderRadius: '3px',
          opacity: 0.8
        }} title={value} />
      );
      
    case 'borderRadius':
    case 'border-radius':
      let radiusVal = cleanValue;
      if (/^\d+$/.test(radiusVal)) radiusVal += 'px';
      return (
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid var(--accent)',
          borderRadius: radiusVal,
          background: 'var(--accent-glow)'
        }} />
      );
      
    case 'shadow':
    case 'box-shadow':
    case 'text-shadow':
      return (
        <div style={{
          width: '32px', height: '32px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          boxShadow: cleanValue,
          border: '1px solid var(--border)'
        }} />
      );

    case 'duration':
    case 'easing':
    case 'transition-duration':
    case 'animation-duration':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            className="motion-preview-box"
            style={{
              width: '16px', height: '16px',
              borderRadius: '50%',
              background: 'var(--accent)',
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
            onMouseEnter={e => {
              const animDuration = (type === 'duration' || type === 'transition-duration' || type === 'animation-duration') ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(12px)';
            }}
            onMouseLeave={e => {
              const animDuration = (type === 'duration' || type === 'transition-duration' || type === 'animation-duration') ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            title="Hover to test transition"
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', userSelect: 'none' }}>Hover</span>
        </div>
      );
      
    default:
      return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{value}</span>;
  }
};

/* ── Token Add/Edit Dialog Component ── */
/* ── Single-token code view ── */
// Same DTCG shape the whole-project export emits (getDTCGJsonText), narrowed to one
// token, so what you copy out of here pastes back into an exported file and vice versa.
// The layer has no DTCG equivalent, so it rides in $extensions rather than being lost.
const tokenToDtcgText = ({ name, value, type, layer }) => {
  const leaf = { '$value': value || '', '$type': type || '' };
  if (layer) leaf['$extensions'] = { strata: { layer } };
  const parts = String(name || '').split('.').filter(Boolean);
  if (!parts.length) return JSON.stringify(leaf, null, 2);
  const root = {};
  let cur = root;
  parts.forEach((part, i) => {
    if (i === parts.length - 1) cur[part] = leaf;
    else { cur[part] = {}; cur = cur[part]; }
  });
  return JSON.stringify(root, null, 2);
};

const tokenToCssText = ({ name, value }) =>
  `--${String(name || '').replace(/\./g, '-')}: ${value || ''};`;

/**
 * Reads one token back out of DTCG JSON. Accepts the nested form this view emits and
 * the flat form ({ "$value": ... }), walking to the first leaf that carries a $value.
 * Returns { error } instead of throwing, so a half-typed paste never wipes the fields.
 */
const parseTokenJson = (text) => {
  if (!String(text).trim()) return { error: 'Empty — paste a token, or switch back to the fields above.' };
  let data;
  try { data = JSON.parse(text); }
  catch (e) { return { error: 'Not valid JSON: ' + e.message }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'Expected a JSON object describing one token.' };

  const path = [];
  let node = data;
  for (let depth = 0; depth < 12; depth++) {
    if (node && typeof node === 'object' && '$value' in node) {
      const layer = node.$extensions?.strata?.layer;
      return {
        name: path.join('.') || undefined,
        value: node.$value == null ? '' : String(node.$value),
        type: node.$type ? String(node.$type) : undefined,
        layer: TOKEN_LAYERS.includes(layer) ? layer : undefined,
      };
    }
    const keys = Object.keys(node || {}).filter(k => !k.startsWith('$'));
    if (keys.length !== 1) {
      return { error: keys.length === 0
        ? 'No $value found — a token needs a "$value".'
        : 'Expected one token, found ' + keys.length + ' at this level.' };
    }
    path.push(keys[0]);
    node = node[keys[0]];
  }
  return { error: 'Nested too deeply to read as a single token.' };
};

function TokenModal({ modal, onClose, onSave, activeTokens }) {
  const isEdit = modal.mode === 'edit';
  // A blank token opened from a ramp folder starts on that ramp's name, so adding a step
  // to Primary does not mean retyping `color.primary.` every time.
  const [name, setName] = useState(isEdit ? modal.token.name : (modal.defaultName || ''));
  const [value, setValue] = useState(isEdit ? modal.token.value : '');
  // A folder that stands for one property says so, and its + opens on that property
  // rather than on the category's default — which for Typography was always fontFamily.
  const [type, setType] = useState(
    isEdit ? modal.token.type : (modal.defaultType || getDefaultTypeForCategory(modal.category))
  );
  const [layer, setLayer] = useState(isEdit ? (modal.token.layer || 'Brand') : (modal.defaultLayer || 'Brand'));

  const layerColor = layerColorFor(layer);

  // Code view: `codeDraft` holds what the user is typing; null means "show the fields".
  const [codeFormat, setCodeFormat] = useState('json');
  const [codeDraft, setCodeDraft] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const generatedCode = codeFormat === 'json'
    ? tokenToDtcgText({ name, value, type, layer })
    : tokenToCssText({ name, value });
  const codeText = codeDraft === null ? generatedCode : codeDraft;

  const existingNamesForType = (t) => (activeTokens?.[getCategoryForType(t)] || []).map(tok => tok.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) {
      alert('Please fill in all fields');
      return;
    }
    onSave({ name: name.trim(), value: value.trim(), type, layer });
  };

  // ── Upload Image tab — every detected color AND every measured text size
  // becomes its own row: ticked by default, each with its own editable
  // suggested name and category, so the whole batch is reviewed and created
  // together in one submit. Font sizes are measured directly from pixel data
  // (text-line heights) — never guessed — so an image with no readable text
  // simply contributes no Typography rows.
  const [entryTab, setEntryTab] = useState('manual');
  const [uploadScan, setUploadScan] = useState(null); // { scanning, failed, rows: [{ kind, hex|px, checked, name, type }] }
  const [uploadImagePreview, setUploadImagePreview] = useState(null);

  const handleUploadFile = async (file) => {
    if (!file) return;
    setUploadScan({ scanning: true });
    try {
      const [{ colors, extracted: colorsExtracted }, { sizes, extracted: sizesExtracted }, preview] = await Promise.all([
        extractColorsFromImage(file, 8),
        extractFontSizesFromImage(file, 5),
        resizeImageToDataUrl(file).catch(() => null),
      ]);
      if (!colorsExtracted && !sizesExtracted) {
        setUploadScan({ scanning: false, failed: true });
        return;
      }
      setUploadImagePreview(preview);
      const takenByType = {};
      const nextName = (baseName, rowType) => {
        const taken = takenByType[rowType] || existingNamesForType(rowType);
        const rowName = suggestUniqueName(baseName, taken);
        takenByType[rowType] = [...taken, rowName];
        return rowName;
      };
      const colorRows = colors.map((hex) => ({
        kind: 'color', hex, checked: true, name: nextName('color.upload', 'color'), type: 'color',
      }));
      const fontSizeRows = sizes.map((px) => ({
        kind: 'fontSize', px, checked: true, name: nextName('font.size.upload', 'fontSize'), type: 'fontSize',
      }));
      setUploadScan({ scanning: false, rows: [...colorRows, ...fontSizeRows] });
    } catch (err) {
      setUploadScan({ scanning: false, failed: true });
    }
  };

  const resetUpload = () => {
    setUploadScan(null);
    setUploadImagePreview(null);
  };

  const updateUploadRow = (index, updates) => {
    setUploadScan((scan) => ({
      ...scan,
      rows: scan.rows.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    }));
  };

  const uploadRowError = (row, index, rows) => {
    if (!row.checked) return null;
    const trimmed = row.name.trim();
    if (!trimmed) return 'Name required';
    if (rows.some((r, i) => i !== index && r.checked && r.name.trim() === trimmed)) {
      return 'Duplicate name in this batch';
    }
    if (existingNamesForType(row.type).includes(trimmed)) {
      return `Already exists in ${getCategoryForType(row.type)}`;
    }
    return null;
  };

  const indexedUploadRows = (uploadScan?.rows || []).map((r, i) => ({ ...r, _index: i }));
  const colorUploadRows = indexedUploadRows.filter(r => r.kind === 'color');
  const fontSizeUploadRows = indexedUploadRows.filter(r => r.kind === 'fontSize');
  const checkedUploadRows = uploadScan?.rows?.filter(r => r.checked) || [];
  const uploadHasBlockingError = uploadScan?.rows?.some((r, i) => uploadRowError(r, i, uploadScan.rows)) || false;

  const renderUploadRow = (row) => {
    const i = row._index;
    const error = uploadRowError(row, i, uploadScan.rows);
    return (
      <div
        key={i}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          background: 'var(--bg-tertiary)', border: `1px solid ${error ? '#EF4444' : 'var(--border)'}`,
          borderRadius: '8px', padding: '0.6rem', opacity: row.checked ? 1 : 0.55,
        }}
      >
        <input
          type="checkbox"
          checked={row.checked}
          onChange={(e) => updateUploadRow(i, { checked: e.target.checked })}
          style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', flexShrink: 0, marginTop: '10px', cursor: 'pointer' }}
        />
        {row.kind === 'color' ? (
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: row.hex, flexShrink: 0, marginTop: '6px', border: '1px solid rgba(255,255,255,0.15)' }} title={row.hex} />
        ) : (
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, marginTop: '6px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}
            title={`${row.px}px measured text height`}
          >
            <span style={{ fontSize: `${Math.min(20, Math.max(9, row.px * 0.5))}px`, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>Aa</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Name</label>
            <input
              type="text"
              className="form-input"
              value={row.name}
              onChange={(e) => updateUploadRow(i, { name: e.target.value })}
              disabled={!row.checked}
              placeholder="e.g. color.primary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            />
          </div>
          <div style={{ pointerEvents: row.checked ? 'auto' : 'none' }}>
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Category</label>
            <CategoryDropdown type={row.type} onSelect={(t) => updateUploadRow(i, { type: t })} />
          </div>
          {row.kind === 'fontSize' && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Measured text height: ~{row.px}px</span>
          )}
          {error && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>{error}</span>}
        </div>
      </div>
    );
  };

  const handleUploadSubmit = () => {
    if (!checkedUploadRows.length) {
      alert('Please tick at least one row to add.');
      return;
    }
    const tokens = checkedUploadRows.map(r => ({
      name: r.name.trim(),
      value: r.kind === 'color' ? r.hex : `${r.px}px`,
      type: r.type,
      layer: 'Brand',
    }));
    onSave(tokens);
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
        borderRadius: '16px', padding: '2rem', width: entryTab === 'upload' ? '640px' : 'min(860px, 94vw)',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        transition: 'width 0.15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Token' : 'Add Token'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {!isEdit && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {[{ id: 'manual', label: 'Add Manually' }, { id: 'upload', label: 'Upload Image' }].map(t => {
              const isActive = entryTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEntryTab(t.id)}
                  style={{
                    flex: 1, padding: '0.5rem 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: isActive ? 'var(--bg-secondary)' : 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {entryTab === 'manual' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Fields left, preview and code right. Stacked, this modal ran past the
              bottom of a laptop screen and the code panel sat below the fold. */}
          <div className="pd-editor-split" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: '1.5rem', alignItems: 'start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
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
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'block' }}>Category *</label>
            <CategoryDropdown type={type} onSelect={setType} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'block' }}>Tier</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {TOKEN_LAYERS.map(l => {
                const lColor = l === 'Brand' ? '#F59E0B' : l === 'Semantic' ? '#3B82F6' : '#10B981';
                const isActive = layer === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLayer(l)}
                    style={{
                      flex: 1, padding: '0.45rem 0', borderRadius: '6px', cursor: 'pointer',
                      border: isActive ? `1px solid ${lColor}50` : '1px solid var(--border)',
                      background: isActive ? `${lColor}15` : 'var(--bg-tertiary)',
                      color: isActive ? lColor : 'var(--text-secondary)',
                      fontSize: '0.78rem', fontWeight: isActive ? 600 : 400,
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? lColor : 'var(--text-tertiary)', flexShrink: 0 }} />
                    {TOKEN_LAYER_LABELS[l]}
                  </button>
                );
              })}
            </div>
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
                <ColorSwatchButton
                  value={value.startsWith('#') ? value : '#FFFFFF'}
                  onChange={setValue}
                  title="Edit colour"
                  size={36}
                />
              )}
            </div>
          </div>
            </div>

            <aside className="pd-editor-preview" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Visual Preview</span>
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '48px'
            }}>
              {renderTokenPreview({ type, value })}
            </div>
          </div>
          {/* ── Code view ──
              The same DTCG shape the project exports, for one token. Editing or pasting
              JSON here drives the fields above; the fields drive it back. CSS is offered
              for copying only — turning `--button-padding-x` back into a dotted name is
              guesswork, so it is not a safe thing to parse. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                Code
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px' }}>
                  {[['json', 'JSON'], ['css', 'CSS']].map(([fmt, label]) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => { setCodeFormat(fmt); setCodeDraft(null); setCodeError(''); }}
                      style={{
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '0.2rem 0.5rem', fontSize: '0.68rem',
                        background: codeFormat === fmt ? 'var(--bg-secondary)' : 'none',
                        color: codeFormat === fmt ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: codeFormat === fmt ? 600 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(codeText);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 1400);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '0.25rem 0.55rem',
                    color: codeCopied ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  {codeCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <textarea
              value={codeText}
              readOnly={codeFormat !== 'json'}
              spellCheck={false}
              onChange={(e) => {
                const text = e.target.value;
                setCodeDraft(text);
                const parsed = parseTokenJson(text);
                if (parsed.error) { setCodeError(parsed.error); return; }
                setCodeError('');
                if (parsed.name !== undefined) setName(parsed.name);
                if (parsed.value !== undefined) setValue(parsed.value);
                if (parsed.type !== undefined) setType(parsed.type);
                if (parsed.layer !== undefined) setLayer(parsed.layer);
              }}
              // Snapping back to generated text on blur keeps formatting canonical without
              // reformatting under the cursor mid-edit.
              onBlur={() => { if (!codeError) setCodeDraft(null); }}
              rows={codeFormat === 'json' ? 9 : 3}
              style={{
                width: '100%', resize: 'vertical',
                background: 'var(--bg)', color: 'var(--text-primary)',
                border: `1px solid ${codeError ? '#EF4444' : 'var(--border)'}`,
                borderRadius: '8px', padding: '0.65rem 0.75rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.55,
                outline: 'none', tabSize: 2,
              }}
            />

            {codeError ? (
              <span style={{ fontSize: '0.68rem', color: '#EF4444' }}>{codeError}</span>
            ) : (
              <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
                {codeFormat === 'json'
                  ? 'Edit or paste DTCG JSON — the fields above follow along.'
                  : 'CSS is copy-only: a custom property name cannot be turned back into a token name reliably.'}
              </span>
            )}
          </div>
            </aside>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ ...actionBtnStyle, borderRadius: '9999px', background: 'none', padding: '0.65rem 1.3rem' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              {isEdit ? 'Save Changes' : 'Create Token'}
            </button>
          </div>
        </form>
        )}

        {entryTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!uploadScan?.rows && (
              <label
                style={{
                  border: '2px dashed var(--border)', borderRadius: '12px', padding: '1.75rem 1rem',
                  textAlign: 'center', cursor: 'pointer', display: 'block', background: 'var(--bg-tertiary)',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { handleUploadFile(e.target.files?.[0]); e.target.value = ''; }}
                />
                {uploadScan?.scanning ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <div className="loading-spinner" style={{ width: '18px', height: '18px' }}></div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sampling colors and text sizes…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Drop an image here, or click to browse</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Colors and text sizes are measured directly from the image</div>
                  </>
                )}
              </label>
            )}

            {uploadScan?.failed && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Couldn't find distinct colors or readable text sizes in that image — try a different screenshot.
              </p>
            )}

            {uploadScan?.rows && (
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'sticky', top: 0 }}>
                  {uploadImagePreview && (
                    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                      <img src={uploadImagePreview} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '6px' }} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={resetUpload}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    Upload a different image
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '2px' }}>
                  {colorUploadRows.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
                        Colors detected in this image ({colorUploadRows.length})
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {colorUploadRows.map(renderUploadRow)}
                      </div>
                    </div>
                  )}

                  {fontSizeUploadRows.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
                        Typography sizes detected in this image ({fontSizeUploadRows.length})
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {fontSizeUploadRows.map(renderUploadRow)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} style={{ ...actionBtnStyle, borderRadius: '9999px', background: 'none', padding: '0.65rem 1.3rem' }}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem', opacity: (!checkedUploadRows.length || uploadHasBlockingError) ? 0.5 : 1, cursor: (!checkedUploadRows.length || uploadHasBlockingError) ? 'not-allowed' : 'pointer' }}
                onClick={handleUploadSubmit}
                disabled={!checkedUploadRows.length || uploadHasBlockingError}
              >
                {checkedUploadRows.length ? `Add ${checkedUploadRows.length} Token${checkedUploadRows.length === 1 ? '' : 's'}` : 'Add Tokens'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Every CSS property a component can map to a token, plus the token
// category each one draws its options from. `key` is the internal storage
// key inside `comp.tokens` (kept as-is for backward compatibility with
// already-saved components); `cssName` is what's shown in the table's
// Property column.
// The properties a brand-new component starts with. These six use the legacy
// storage keys (see LEGACY_TOKEN_KEY_TO_CSS) so components saved before the
// free-form property table keep loading unchanged; every other property the
// user adds is stored under its real CSS property name.
const DEFAULT_COMPONENT_PROPERTY_KEYS = ['bg', 'textColor', 'padding', 'borderRadius', 'fontFamily', 'fontSize'];

// "background-color" → "Background Color"
/* ── Designer-facing helpers for the component editor ── */

// Resolves a token name to the value it ends up as, following {alias} chains the
// same way the live preview does. Returns '' when the name resolves to nothing,
// so the editor never shows a value the project does not actually define.
const resolveTokenName = (activeTokens, name) => {
  if (!name) return '';
  const findByName = (n) => {
    for (const cat in activeTokens || {}) {
      const hit = Array.isArray(activeTokens[cat]) && activeTokens[cat].find(t => t?.name === n);
      if (hit) return hit;
    }
    return null;
  };
  let token = findByName(name);
  let value = token ? token.value : '';
  for (let i = 0; i < 10; i++) {
    const ref = typeof value === 'string' && value.match(/^\{(.+)\}$/);
    if (!ref) break;
    const next = findByName(ref[1]);
    if (!next) return '';
    value = next.value;
  }
  return value || '';
};

// The inspector's controls accept a literal as readily as a token name, so a resolver used
// with them has to hand back an unrecognised value unchanged — returning an empty string
// would make a perfectly good `12px` read as unresolved.
const resolveTokenOrLiteral = (activeTokens, value) =>
  resolveTokenName(activeTokens, value) || (value ? String(value).trim() : '');




// Detected regions from an uploaded screenshot are saved as image components.
const UPLOAD_TYPE = TEMPLATE_TO_TYPE.image;

/* ── Component code view ── */
// Custom-property names must match what the project exports (getCSSVariablesText),
// otherwise CSS copied out of Handoff would not paste back in here.
const tokenToCssVar = (tokenName) => `--${String(tokenName).replace(/\./g, '-')}`;

// PrimaryButton → primary-button
const componentClassName = (name) =>
  String(name || 'component')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'component';

// The element each template renders, so the JSX names something real.
const TEMPLATE_ELEMENT = {
  button: 'button', input: 'input', card: 'div', badge: 'span', image: 'img',
  dropdown: 'div', tooltip: 'div', selection: 'label', selector: 'div',
  accordion: 'div', tabs: 'div', modal: 'div', table: 'table',
  chart: 'figure', breadcrumb: 'nav', pagination: 'nav', navbar: 'nav',
};

// `inheritedRows` are declarations the component gets from its parent. They are included
// because the preview includes them — a rule that omitted them would not reproduce what
// is on screen — and marked so it is clear where they came from.
const componentToCssText = (name, rows, inheritedRows = [], parentName = '') => {
  const decl = (r) => `  ${cssPropForTokenKey(r.key)}: var(${tokenToCssVar(r.value)});`;
  const own = new Set((rows || []).filter(r => r.value).map(r => cssPropForTokenKey(r.key)));
  const note = parentName ? ` /* inherited from ${parentName} */` : ' /* inherited */';
  const decls = [
    ...(inheritedRows || []).filter(r => r.value && !own.has(cssPropForTokenKey(r.key))).map(r => decl(r) + note),
    ...(rows || []).filter(r => r.value).map(decl),
  ];
  const body = decls.length ? decls.join('\n') : '  /* no tokens mapped yet */';
  return `.${componentClassName(name)} {\n${body}\n}`;
};

const componentToJsxText = (name, template) => {
  const el = TEMPLATE_ELEMENT[template] || 'div';
  const cls = componentClassName(name);
  const comp = String(name || 'Component').replace(/[^a-zA-Z0-9]/g, '') || 'Component';
  const selfClosing = el === 'input' || el === 'img';
  return selfClosing
    ? `export function ${comp}(props) {\n  return <${el} className="${cls}" {...props} />;\n}`
    : `export function ${comp}({ children, ...props }) {\n  return (\n    <${el} className="${cls}" {...props}>\n      {children}\n    </${el}>\n  );\n}`;
};

const componentToJsonText = (name, type, template, description, rows, extra = {}) => {
  const tokens = {};
  for (const r of rows || []) {
    if (r.value) tokens[cssPropForTokenKey(r.key)] = r.value;
  }
  return JSON.stringify({
    name: name || '', type: type || '', template: template || '',
    description: description || '', tokens,
    // present only when they mean something, so an ordinary component's spec is unchanged
    ...(extra.extends ? { extends: extra.extends } : {}),
    ...(extra.children && extra.children.length ? { children: extra.children } : {}),
  }, null, 2);
};

/** Every token name defined in the project, for matching a var() back to a real token. */
const tokenNameIndex = (activeTokens) => {
  const byVar = new Map();
  for (const cat in activeTokens || {}) {
    if (!Array.isArray(activeTokens[cat])) continue;
    for (const t of activeTokens[cat]) {
      if (t?.name) byVar.set(tokenToCssVar(t.name), t.name);
    }
  }
  return byVar;
};

/**
 * Reads a CSS rule back into token-mapping rows.
 *
 * A var() is matched against the project's real token names rather than being
 * un-dashed by guesswork — `--button-padding-x` is ambiguous on its own, but there
 * is no ambiguity when checking it against the tokens that actually exist.
 *
 * Anything that cannot become a mapping (an unknown var, or a literal value, which
 * has nowhere to live in a map of token *names*) is counted and reported, never
 * dropped silently. Returns `error` instead of throwing.
 */
const parseComponentCss = (text, activeTokens) => {
  const src = String(text || '');
  if (!src.trim()) return { error: 'Empty — paste a CSS rule, or switch back to Token Mappings.' };
  const open = src.indexOf('{');
  const close = src.lastIndexOf('}');
  if (open === -1 || close === -1 || close < open) {
    return { error: 'Expected a CSS rule like .my-component { … }' };
  }
  const byVar = tokenNameIndex(activeTokens);
  const rows = [];
  const skipped = [];
  const seen = new Set();

  for (const chunk of src.slice(open + 1, close).split(';')) {
    const line = chunk.trim();
    if (!line || line.startsWith('/*')) continue;
    const at = line.indexOf(':');
    if (at === -1) { skipped.push(line.slice(0, 24)); continue; }
    const prop = line.slice(0, at).trim();
    const raw = line.slice(at + 1).trim();
    if (!prop) { skipped.push(line.slice(0, 24)); continue; }
    const ref = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!ref) { skipped.push(prop); continue; }
    const tokenName = byVar.get(ref[1]);
    if (!tokenName) { skipped.push(prop); continue; }
    if (seen.has(prop)) continue;
    seen.add(prop);
    rows.push({ key: prop, value: tokenName });
  }

  if (!rows.length) {
    // Applying an empty result would silently clear every mapping the component has.
    // A rule we could not read is a failure to report, not an instruction to wipe.
    return { error: skipped.length
      ? 'Nothing here maps to a token in this project: ' + skipped.slice(0, 4).join(', ')
      : 'No declarations found inside the rule.' };
  }
  return { rows, skipped };
};

/** Reads the JSON spec back. Returns `error` rather than throwing. */
const parseComponentJson = (text) => {
  if (!String(text).trim()) return { error: 'Empty — paste a component, or switch back to Token Mappings.' };
  let data;
  try { data = JSON.parse(text); }
  catch (e) { return { error: 'Not valid JSON: ' + e.message }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'Expected a JSON object describing one component.' };
  }
  if (data.tokens != null && (typeof data.tokens !== 'object' || Array.isArray(data.tokens))) {
    return { error: '"tokens" must be an object of property → token name.' };
  }
  const rows = Object.entries(data.tokens || {})
    .filter(([, v]) => typeof v === 'string' && v)
    .map(([key, value]) => ({ key, value }));
  return {
    name: typeof data.name === 'string' ? data.name : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    template: typeof data.template === 'string' ? data.template : undefined,
    type: typeof data.type === 'string' ? data.type : undefined,
    rows,
  };
};

/* ── Component Wizard dialog ── */
// A blank component created inside a type folder starts on that type's template,
// via TYPE_TO_TEMPLATE from the taxonomy — so it renders as the thing the folder says
// it is instead of defaulting to a button.

function ComponentModal({
  onClose, onSave, activeTokens, componentToEdit, existingNames, initialCategory, initialType,
  allComponents = [], parentOptions = [],
  // The same set the properties rail is given, passed in rather than reimplemented.
  tokensForProperty, presetsForProperty, onCreateToken, existingTokenNames, resolve,
}) {
  const isEdit = !!componentToEdit;

  // Code view state. Declared at the top of this component on purpose: anything below
  // an early return, or accidentally anchored into ProjectDetail, becomes a conditional
  // hook and crashes the page with "Rendered more hooks than during the previous render".
  // The two relationship toggles from the reference dialog. Both off gives exactly the
  // previous behaviour.
  const [asFragment, setAsFragment] = useState(isEdit ? componentToEdit.template === 'fragment' : false);
  const [extendsId, setExtendsId] = useState(isEdit ? (componentToEdit.extends || '') : '');

  // What this component inherits. Driven by the dialog's own Extends picker rather than the
  // saved value, so choosing a parent shows the inherited mappings straight away and the
  // emitted CSS matches the toggle. Resolved through the whole chain, and normalised the
  // same way as own mappings so an inherited legacy key lines up with the row overriding it.
  const parentComp = extendsId ? allComponents.find(c => c.id === extendsId) : null;
  const parentName = parentComp ? parentComp.name : '';
  const inheritedTokens = {};
  if (parentComp) {
    for (const [k, v] of Object.entries(effectiveTokens(parentComp, indexById(allComponents)))) {
      if (v) inheritedTokens[cssPropForTokenKey(k)] = v;
    }
  }
  const inheritedRows = Object.entries(inheritedTokens).map(([key, value]) => ({ key, value }));
  const [editorTab, setEditorTab] = useState('properties');
  const [codeFormat, setCodeFormat] = useState('css');
  const [codeDraft, setCodeDraft] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [codeNote, setCodeNote] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Presets covering every type in the taxonomy. Each carries its `type`, and the
  // category/template are derived from it so a preset can never disagree with the
  // folder it appears under. The token values are fallback chains: findToken walks
  // each list and takes the first name that exists in the project.
  const PRESET_COMPONENTS = React.useMemo(() => {
    const SURFACE = ['color.background.surface', 'brand.color.surface'];
    const TEXT = ['color.text.primary', 'brand.color.text'];
    const ACTION = ['button.bg', 'color.action', 'brand.color.primary'];
    const PAD = ['button.padding', 'spacing.component', 'brand.spacing.base'];
    const RADIUS = ['button.radius', 'radius.component', 'brand.radius.base'];
    const FONT = ['brand.font.body', 'brand.font.heading'];
    const SIZE = ['font.size.base', 'font.size.md'];
    const SMALL = ['font.size.xs', 'font.size.sm'];

    // [id, name, label, type, description, bg, textColor, fontSize]
    const SPECS = [
      ['primary-button', 'PrimaryButton', 'Primary Button', 'Buttons', 'Standard brand action button', ACTION, TEXT, SIZE],
      ['secondary-button', 'SecondaryButton', 'Secondary Button', 'Buttons', 'Supporting action for auxiliary choices', SURFACE, TEXT, SIZE],
      ['outline-button', 'OutlineButton', 'Outline Button', 'Buttons', 'Bordered button for secondary actions', [], ACTION, SIZE],
      ['ghost-button', 'GhostButton', 'Ghost Button', 'Buttons', 'Borderless button for low-emphasis actions', [], ACTION, SIZE],
      ['destructive-button', 'DestructiveButton', 'Destructive Button', 'Buttons', 'Button for irreversible actions', [], TEXT, SIZE],
      ['icon-button', 'IconButton', 'Icon Button', 'Buttons', 'Compact icon-only action', SURFACE, TEXT, SMALL],
      ['split-button', 'SplitButton', 'Split Button', 'Buttons', 'Primary action with an attached menu toggle', ACTION, TEXT, SIZE],
      ['link-button', 'LinkButton', 'Link Button', 'Buttons', 'Action styled as an inline text link', [], ACTION, SIZE],
      ['loading-button', 'LoadingButton', 'Loading Button', 'Buttons', 'Action showing work in progress', ACTION, TEXT, SIZE],
      ['fab-button', 'FloatingActionButton', 'Floating Action Button', 'Buttons', 'Circular action floating above the page', ACTION, TEXT, SIZE],
      ['button-group', 'ButtonGroup', 'Button Group', 'Buttons', 'Related actions joined into one control', SURFACE, TEXT, SIZE],

      ['dropdown-menu', 'DropdownMenu', 'Dropdown Menu', 'Dropdowns & Menus', 'Menu overlay opened from a trigger', SURFACE, TEXT, SIZE],
      ['context-menu', 'ContextMenu', 'Context Menu', 'Dropdowns & Menus', 'Contextual actions for the selected item', SURFACE, TEXT, SMALL],
      ['select-dropdown', 'SelectDropdown', 'Select Dropdown', 'Dropdowns & Menus', 'Single choice from a list of options', SURFACE, TEXT, SIZE],
      ['multi-select', 'MultiSelect', 'Multi-select Dropdown', 'Dropdowns & Menus', 'Several choices from a list of options', SURFACE, TEXT, SIZE],
      ['nav-dropdown', 'NavDropdown', 'Navigation Dropdown', 'Dropdowns & Menus', 'Menu of destinations opened from the nav', SURFACE, TEXT, SIZE],
      ['action-menu', 'ActionMenu', 'Action Menu', 'Dropdowns & Menus', 'Overflow menu of row or card actions', SURFACE, TEXT, SMALL],
      ['combo-box', 'ComboBox', 'Combo Box', 'Dropdowns & Menus', 'Type-ahead field that filters its options', SURFACE, TEXT, SIZE],
      ['user-menu', 'UserMenu', 'User Menu', 'Dropdowns & Menus', 'Account actions opened from an avatar', SURFACE, TEXT, SMALL],

      ['tooltip', 'Tooltip', 'Tooltip', 'Tooltips', 'Short helper text shown on hover or focus', SURFACE, TEXT, SMALL],
      ['info-tooltip', 'InfoTooltip', 'Info Tooltip', 'Tooltips', 'Explains a label or field on demand', SURFACE, TEXT, SMALL],
      ['rich-tooltip', 'RichTooltip', 'Rich Tooltip', 'Tooltips', 'Longer helper text with a title', SURFACE, TEXT, SMALL],
      ['shortcut-tooltip', 'ShortcutTooltip', 'Keyboard Shortcut Tooltip', 'Tooltips', 'Names the action and its shortcut', SURFACE, TEXT, SMALL],
      ['error-tooltip', 'ErrorTooltip', 'Error Tooltip', 'Tooltips', 'Explains why an input is invalid', [], TEXT, SMALL],
      ['onboarding-tooltip', 'OnboardingTooltip', 'Onboarding Tooltip', 'Tooltips', 'Points out a feature on first use', ACTION, TEXT, SMALL],

      ['input-field', 'InputField', 'Text Input Field', 'Text Inputs', 'Standard text input field', ['input.bg', ...SURFACE], ['input.text', ...TEXT], SIZE],
      ['email-input', 'EmailInput', 'Email Input', 'Text Inputs', 'Email address field', ['input.bg'], ['input.text'], SIZE],
      ['password-input', 'PasswordInput', 'Password Input', 'Text Inputs', 'Masked credential field', ['input.bg'], ['input.text'], SIZE],
      ['search-input', 'SearchInput', 'Search Input', 'Text Inputs', 'Search field with query text', ['input.bg'], ['input.text'], SIZE],
      ['textarea-input', 'TextareaInput', 'Textarea', 'Text Inputs', 'Multi-line text field', ['input.bg'], ['input.text'], SIZE],
      ['number-input', 'NumberInput', 'Number Input', 'Text Inputs', 'Numeric field with stepper affordance', ['input.bg'], ['input.text'], SIZE],
      ['phone-input', 'PhoneInput', 'Phone Input', 'Text Inputs', 'Telephone number field', ['input.bg'], ['input.text'], SIZE],
      ['url-input', 'UrlInput', 'URL Input', 'Text Inputs', 'Web address field', ['input.bg'], ['input.text'], SIZE],
      ['input-with-label', 'LabelledInput', 'Labelled Input', 'Text Inputs', 'Field paired with its label and hint', ['input.bg'], ['input.text'], SIZE],
      ['input-error', 'InputWithError', 'Input With Error', 'Text Inputs', 'Field in its invalid state', ['input.bg'], ['input.text'], SIZE],

      ['checkbox', 'Checkbox', 'Checkbox', 'Selection Controls', 'Binary tick control', ACTION, TEXT, SMALL],
      ['checkbox-group', 'CheckboxGroup', 'Checkbox Group', 'Selection Controls', 'Several independent tick options', ACTION, TEXT, SMALL],
      ['radio-group', 'RadioGroup', 'Radio Group', 'Selection Controls', 'Single choice from a set', ACTION, TEXT, SMALL],
      ['toggle-switch', 'ToggleSwitch', 'Toggle / Switch', 'Selection Controls', 'On-off state switch', ACTION, TEXT, SMALL],
      ['segmented-control', 'SegmentedControl', 'Segmented Control', 'Selection Controls', 'Mutually exclusive options in one bar', SURFACE, TEXT, SMALL],
      ['star-rating', 'StarRating', 'Star Rating', 'Selection Controls', 'Score picked from a row of stars', ACTION, TEXT, SMALL],
      ['choice-chips', 'ChoiceChips', 'Choice Chips', 'Selection Controls', 'Selectable chips for quick filtering', SURFACE, TEXT, SMALL],

      ['color-picker', 'ColorPicker', 'Color Picker', 'Advanced Selectors', 'Swatch-based colour selector', ACTION, TEXT, SMALL],
      ['date-picker', 'DatePicker', 'Date Picker', 'Advanced Selectors', 'Date and time selector field', SURFACE, TEXT, SMALL],
      ['date-range-picker', 'DateRangePicker', 'Date Range Picker', 'Advanced Selectors', 'Start and end date selector', SURFACE, TEXT, SMALL],
      ['time-picker', 'TimePicker', 'Time Picker', 'Advanced Selectors', 'Hour and minute selector', SURFACE, TEXT, SMALL],
      ['file-upload', 'FileUpload', 'File Upload Zone', 'Advanced Selectors', 'Drop target for file uploads', ACTION, TEXT, SMALL],
      ['image-upload', 'ImageUpload', 'Image Upload', 'Advanced Selectors', 'Drop target that previews the image', ACTION, TEXT, SMALL],
      ['slider-input', 'SliderInput', 'Slider', 'Advanced Selectors', 'Value picked along a track', ACTION, TEXT, SMALL],

      ['accordion', 'Accordion', 'Accordion', 'Accordions', 'Stacked expandable content panels', SURFACE, TEXT, SIZE],
      ['faq-accordion', 'FaqAccordion', 'FAQ Accordion', 'Accordions', 'Question and answer disclosure list', SURFACE, TEXT, SIZE],
      ['settings-accordion', 'SettingsAccordion', 'Settings Accordion', 'Accordions', 'Grouped settings that expand in place', SURFACE, TEXT, SIZE],
      ['nested-accordion', 'NestedAccordion', 'Nested Accordion', 'Accordions', 'Disclosure panels inside another panel', SURFACE, TEXT, SIZE],
      ['collapsible-panel', 'CollapsiblePanel', 'Collapsible Panel', 'Accordions', 'A single section that folds away', SURFACE, TEXT, SIZE],

      ['info-card', 'InformationCard', 'Information Card', 'Cards', 'Container for structured content', ['input.bg', ...SURFACE], TEXT, SIZE],
      ['media-card', 'MediaCard', 'Media Card', 'Cards', 'Card leading with an image or media block', SURFACE, TEXT, SIZE],
      ['product-card', 'ProductCard', 'Product Card', 'Cards', 'Item with image, price and an action', SURFACE, TEXT, SIZE],
      ['stat-card', 'StatCard', 'Stat Card', 'Cards', 'Single metric with a label and trend', SURFACE, TEXT, SIZE],
      ['profile-card', 'ProfileCard', 'Profile Card', 'Cards', 'Person with avatar, role and actions', SURFACE, TEXT, SIZE],
      ['pricing-card', 'PricingCard', 'Pricing Card', 'Cards', 'Plan with price, features and a call to action', SURFACE, TEXT, SIZE],
      ['empty-state-card', 'EmptyStateCard', 'Empty State Card', 'Cards', 'Explains an empty area and what to do next', SURFACE, TEXT, SIZE],

      ['tab-bar', 'TabBar', 'Tab Bar', 'Tabs', 'Tabbed switcher between panels', SURFACE, TEXT, SIZE],
      ['underline-tabs', 'UnderlineTabs', 'Underline Tabs', 'Tabs', 'Tabs marked by an underline indicator', SURFACE, TEXT, SIZE],
      ['pill-tabs', 'PillTabs', 'Pill Tabs', 'Tabs', 'Tabs shaped as filled pills', ACTION, TEXT, SIZE],
      ['vertical-tabs', 'VerticalTabs', 'Vertical Tabs', 'Tabs', 'Tabs stacked down the side of the panel', SURFACE, TEXT, SIZE],
      ['scrollable-tabs', 'ScrollableTabs', 'Scrollable Tabs', 'Tabs', 'Overflowing tabs that scroll sideways', SURFACE, TEXT, SIZE],

      ['modal-dialog', 'ModalDialog', 'Modal Dialog', 'Modals & Dialogs', 'Overlay window for a focused task', SURFACE, TEXT, SIZE],
      ['confirm-dialog', 'ConfirmDialog', 'Confirmation Dialog', 'Modals & Dialogs', 'Dialog requiring an explicit response', SURFACE, TEXT, SIZE],
      ['alert-dialog', 'AlertDialog', 'Alert Dialog', 'Modals & Dialogs', 'Warns before a destructive action', SURFACE, TEXT, SIZE],
      ['form-dialog', 'FormDialog', 'Form Dialog', 'Modals & Dialogs', 'Short form completed without leaving the page', SURFACE, TEXT, SIZE],
      ['fullscreen-modal', 'FullscreenModal', 'Fullscreen Modal', 'Modals & Dialogs', 'Takeover for a longer task', SURFACE, TEXT, SIZE],
      ['sheet-dialog', 'SheetDialog', 'Sheet Dialog', 'Modals & Dialogs', 'Panel that slides in from an edge', SURFACE, TEXT, SIZE],

      ['data-table', 'DataTable', 'Data Table', 'Grids & Tables', 'Sortable rows and columns of data', SURFACE, TEXT, SMALL],
      ['compact-table', 'CompactTable', 'Compact Table', 'Grids & Tables', 'Dense table for scanning many rows', SURFACE, TEXT, SMALL],
      ['selectable-table', 'SelectableTable', 'Selectable Table', 'Grids & Tables', 'Table whose rows can be picked in bulk', SURFACE, TEXT, SMALL],
      ['data-grid', 'DataGrid', 'Data Grid', 'Grids & Tables', 'Editable grid with pinned columns', SURFACE, TEXT, SMALL],
      ['empty-table', 'EmptyTable', 'Empty Table', 'Grids & Tables', 'Table with no rows yet', SURFACE, TEXT, SMALL],

      ['brand-badge', 'StatusBadge', 'Status Badge', 'Badges & Tags', 'Compact status indicator', ['color.action', 'brand.color.accent'], TEXT, SMALL],
      ['tag-chip', 'TagChip', 'Tag / Chip', 'Badges & Tags', 'Category label chip', SURFACE, TEXT, SMALL],
      ['count-badge', 'CountBadge', 'Count Badge', 'Badges & Tags', 'Numeric counter on an icon or tab', ACTION, TEXT, SMALL],
      ['dot-badge', 'DotBadge', 'Dot Badge', 'Badges & Tags', 'Small dot marking unread or active state', ACTION, TEXT, SMALL],
      ['removable-tag', 'RemovableTag', 'Removable Tag', 'Badges & Tags', 'Chip the user can dismiss', SURFACE, TEXT, SMALL],
      ['priority-tag', 'PriorityTag', 'Priority Tag', 'Badges & Tags', 'Severity or priority label', [], TEXT, SMALL],

      ['bar-chart', 'BarChart', 'Bar Chart', 'Charts', 'Categorical bar comparison', ACTION, TEXT, SMALL],
      ['line-chart', 'LineChart', 'Line Chart', 'Charts', 'Trend over a continuous range', ACTION, TEXT, SMALL],
      ['area-chart', 'AreaChart', 'Area Chart', 'Charts', 'Filled trend showing volume over time', ACTION, TEXT, SMALL],
      ['pie-chart', 'PieChart', 'Pie Chart', 'Charts', 'Parts of a whole', ACTION, TEXT, SMALL],
      ['doughnut-chart', 'DoughnutChart', 'Doughnut Chart', 'Charts', 'Parts of a whole with a centre label', ACTION, TEXT, SMALL],
      ['sparkline', 'Sparkline', 'Sparkline', 'Charts', 'Tiny inline trend beside a metric', ACTION, TEXT, SMALL],

      ['avatar', 'Avatar', 'Avatar', 'Images & Avatars', 'Circular representation of a user or entity', ACTION, TEXT, SMALL],
      ['avatar-group', 'AvatarGroup', 'Avatar Group', 'Images & Avatars', 'Overlapping avatars for a set of people', ACTION, TEXT, SMALL],
      ['image-thumbnail', 'ImageThumbnail', 'Image Thumbnail', 'Images & Avatars', 'Small preview of a larger image', SURFACE, TEXT, SMALL],
      ['logo-mark', 'LogoMark', 'Logo Mark', 'Images & Avatars', 'Brand mark used in nav and headers', SURFACE, TEXT, SMALL],
      ['image-placeholder', 'ImagePlaceholder', 'Image Placeholder', 'Images & Avatars', 'Stand-in shown while an image loads', SURFACE, TEXT, SMALL],

      ['breadcrumbs', 'Breadcrumbs', 'Breadcrumbs', 'Breadcrumbs', 'Hierarchical path to the current page', [], TEXT, SMALL],
      ['compact-breadcrumbs', 'CompactBreadcrumbs', 'Compact Breadcrumbs', 'Breadcrumbs', 'Long path collapsed with an ellipsis', [], TEXT, SMALL],
      ['icon-breadcrumbs', 'IconBreadcrumbs', 'Icon Breadcrumbs', 'Breadcrumbs', 'Path whose first crumb is a home icon', [], TEXT, SMALL],

      ['pagination', 'Pagination', 'Pagination', 'Pagination', 'Steps across multi-page content', ACTION, TEXT, SMALL],
      ['simple-pagination', 'SimplePagination', 'Simple Pagination', 'Pagination', 'Previous and next only', SURFACE, TEXT, SMALL],
      ['load-more', 'LoadMore', 'Load More', 'Pagination', 'Appends the next page in place', SURFACE, TEXT, SMALL],
      ['page-size-picker', 'PageSizePicker', 'Page Size Picker', 'Pagination', 'Chooses how many rows per page', SURFACE, TEXT, SMALL],

      ['nav-bar', 'NavBar', 'Navigation Bar', 'Nav Bars / Drawers', 'Top-level application navigation', SURFACE, TEXT, SIZE],
      ['side-drawer', 'SideDrawer', 'Side Drawer', 'Nav Bars / Drawers', 'Side sheet holding global paths', SURFACE, TEXT, SIZE],
      ['side-nav', 'SideNav', 'Side Navigation', 'Nav Bars / Drawers', 'Persistent vertical navigation rail', SURFACE, TEXT, SIZE],
      ['mobile-drawer', 'MobileDrawer', 'Mobile Drawer', 'Nav Bars / Drawers', 'Off-canvas menu for small screens', SURFACE, TEXT, SIZE],
      ['bottom-nav', 'BottomNav', 'Bottom Navigation', 'Nav Bars / Drawers', 'Primary destinations along the bottom edge', SURFACE, TEXT, SIZE],
      ['toolbar', 'Toolbar', 'Toolbar', 'Nav Bars / Drawers', 'Row of tools above a working area', SURFACE, TEXT, SIZE],
    ];

    return [
      {
        id: 'custom',
        name: '',
        label: 'Custom Component (Blank)',
        category: CATEGORY_LIST[0],
        type: TYPES_FOR_CATEGORY(CATEGORY_LIST[0])[0],
        description: '',
        template: 'button',
        tokens: { bg: '', textColor: '', padding: '', borderRadius: '', fontFamily: '', fontSize: '' },
      },
      ...SPECS.map(([id, name, label, type, description, bg, textColor, fontSize]) => ({
        id,
        name,
        label,
        type,
        category: COMPONENT_TYPE_CATEGORY[type],
        template: TYPE_TO_TEMPLATE[type],
        description,
        tokens: { bg, textColor, padding: PAD, borderRadius: RADIUS, fontFamily: FONT, fontSize },
      })),
    ];
  }, []);

  const getTokensOfType = (type) => {
    const list = [];
    if (!activeTokens || typeof activeTokens !== 'object') return list;
    for (const cat in activeTokens) {
      const catTokens = activeTokens[cat];
      if (!Array.isArray(catTokens)) continue;
      catTokens.forEach(t => {
        if (t && t.type === type) {
          list.push(t.name);
        }
      });
    }
    return list;
  };

  const findToken = (type, preferredNames) => {
    const available = getTokensOfType(type);
    for (const pref of preferredNames) {
      if (available.includes(pref)) return pref;
    }
    return available[0] || '';
  };

  // Any CSS property can be mapped, so the Value options come from whichever
  // token category that property belongs to (e.g. padding-top → Spacing),
  // rather than from a hardcoded per-property token type.
  // Editing resolves through the taxonomy, which already handles every legacy category
  // name (including the old Atom/Molecule/Organism values) via LEGACY_CATEGORY_ALIAS.
  const getInitialCategory = () => {
    if (!isEdit) return initialCategory || CATEGORY_LIST[0];
    return categoryForComponent(componentToEdit);
  };

  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [name, setName] = useState(isEdit ? componentToEdit.name : '');
  const [description, setDescription] = useState(isEdit ? componentToEdit.description : '');
  const [category, setCategory] = useState(getInitialCategory());
  // Opened from a type folder, a blank component starts on that type's template so it
  // renders as the thing the folder says it is rather than defaulting to a button.
  const [template, setTemplate] = useState(
    isEdit ? componentToEdit.template : (TYPE_TO_TEMPLATE[initialType] || 'button')
  );

  // Preview ground, so a designer can check the component on both.
  const [previewLight, setPreviewLight] = useState(false);

  // What the mappings currently add up to, so the preview beside the form
  // shows the component as it will actually look — no save-and-reopen loop.
  const previewStyle = () => {
    const out = {};
    for (const [prop, token] of Object.entries(tokens)) {
      const resolved = resolveTokenOrLiteral(activeTokens, token);
      if (resolved) out[cssPropToStyleKey(prop)] = resolved;
    }
    return out;
  };

  // Token mappings, keyed by CSS property. Legacy storage keys (`bg`, `borderRadius`, …)
  // are normalised on read through cssPropForTokenKey — the same thing the properties rail
  // does — so a component saved before the rename shows its mappings instead of an empty
  // panel, and saving migrates the keys.
  //
  // Add mode starts empty on purpose. Every property is listed under its section whether
  // mapped or not, so there is nothing to pre-seed, and an empty string stored against a
  // property would mean nothing while still shadowing an inherited value.
  const [tokens, setTokens] = useState(() => {
    const out = {};
    for (const [key, value] of Object.entries((isEdit && componentToEdit.tokens) || {})) {
      if (value) out[cssPropForTokenKey(key)] = value;
    }
    return out;
  });
  // Sections to open beyond the defaults — set when a preset or a pasted rule fills some in.
  const [revealSections, setRevealSections] = useState([]);

  // Same patch shape the rail commits with, so PropertySections needs no adapter.
  const patchTokens = (changes) => setTokens(prev => {
    const next = { ...prev };
    for (const [k, v] of Object.entries(changes)) {
      if (v) next[k] = v; else delete next[k];
    }
    return next;
  });

  // Only mappings that resolve to a real value count — a property pointing at a token the
  // project no longer defines is not styling anything.
  const mappedCount = Object.values(tokens).filter(
    v => v && resolveTokenOrLiteral(activeTokens, v)
  ).length;
  // The code generators speak rows; the form stores an object. Derived here rather than
  // stored, so there is only ever one copy of what is mapped.
  const tokenRows = Object.entries(tokens).map(([key, value]) => ({ key, value }));
  // Generated from the fields, so the code always reflects what is mapped right now.
  const generatedComponentCode =
    codeFormat === 'css' ? componentToCssText(name, tokenRows, inheritedRows, parentName)
    : codeFormat === 'jsx' ? componentToJsxText(name, template)
    : componentToJsonText(name, TEMPLATE_TO_TYPE[template] || '', template, description, tokenRows, { extends: extendsId || undefined, children: componentToEdit?.children });
  const componentCodeText = codeDraft === null ? generatedComponentCode : codeDraft;

  // Applies a parsed result to the form. Anything that failed to parse never reaches
  // here, so a bad paste always leaves the component exactly as it was.
  const applyParsedCode = (parsed) => {
    if (parsed.error) { setCodeError(parsed.error); return; }
    setCodeError('');
    if (parsed.rows) {
      const next = {};
      for (const r of parsed.rows) if (r.value) next[cssPropForTokenKey(r.key)] = r.value;
      setTokens(next);
      setRevealSections(sectionIdsForProperties(Object.keys(next)));
    }
    if (parsed.name !== undefined) setName(parsed.name);
    if (parsed.description !== undefined) setDescription(parsed.description);
    if (parsed.template && TEMPLATE_TO_TYPE[parsed.template]) {
      setTemplate(parsed.template);
      setCategory(COMPONENT_TYPE_CATEGORY[TEMPLATE_TO_TYPE[parsed.template]] || category);
    }
    const skipped = parsed.skipped || [];
    setCodeNote(skipped.length
      ? skipped.length + ' declaration' + (skipped.length === 1 ? '' : 's') + ' skipped — no matching token: ' + skipped.slice(0, 4).join(', ')
      : '');
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = PRESET_COMPONENTS.find(p => p.id === presetId);
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      // The Custom preset carries a default category. Opened from a folder that would
      // silently refile the component elsewhere, so the folder wins for Custom.
      const blank = preset.id === 'custom';
      setCategory(blank && initialCategory ? initialCategory : preset.category);
      setTemplate(blank && initialType ? (TYPE_TO_TEMPLATE[initialType] || preset.template) : preset.template);
      // A preset's mappings are keyed by CSS property like everything else, and the
      // sections holding them are opened, so what the preset did is visible rather than
      // hidden behind a collapsed header.
      const next = {};
      if (preset.id !== 'custom') {
        for (const key of DEFAULT_COMPONENT_PROPERTY_KEYS) {
          const prop = cssPropForTokenKey(key);
          const value = findToken(getDefaultTypeForCategory(getCategoryForType(prop)), preset.tokens[key] || []);
          if (value) next[prop] = value;
        }
      }
      setTokens(next);
      setRevealSections(sectionIdsForProperties(Object.keys(next)));
    }
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
      // Stored for readability only — the tree derives the type from `template`,
      // so a component can never be filed somewhere it cannot be drawn.
      type: asFragment ? 'Fragments' : (TEMPLATE_TO_TYPE[template] || undefined),
      template: asFragment ? 'fragment' : template,
      ...(extendsId ? { extends: extendsId } : {}),
      tokens,
    });
  };

  // ── Upload Image tab — detects every distinct UI-element-shaped region in
  // the uploaded screenshot (e.g. a full Figma screen export) and shows each
  // as its own tickable row: editable name, category, and a real cropped
  // thumbnail. A screenshot of just one button still works fine — it simply
  // detects one region and shows a table with one row. Submitting creates
  // every ticked row as its own component in one batch.
  const [entryTab, setEntryTab] = useState('manual');
  const [uploadScan, setUploadScan] = useState(null); // { scanning, failed, rows: [], truncated, totalDetected }
  const [uploadImagePreview, setUploadImagePreview] = useState(null);

  const handleUploadFile = async (file) => {
    if (!file) return;
    setUploadScan({ scanning: true });
    try {
      const [{ regions, extracted, truncated, totalDetected, image }, preview] = await Promise.all([
        detectComponentRegions(file),
        resizeImageToDataUrl(file).catch(() => null),
      ]);
      if (!extracted) {
        setUploadScan({ scanning: false, failed: true });
        return;
      }
      const cropped = await Promise.all(
        regions.map((r) => cropImageRegionToDataUrl(image, r.x, r.y, r.width, r.height))
      );
      const naturalW = image.width || 1;
      const naturalH = image.height || 1;
      const takenNames = [...(existingNames || [])];
      const rows = regions.map((r, i) => {
        const rowName = suggestUniqueName('Component', takenNames, ' ');
        takenNames.push(rowName);
        return {
          checked: true,
          name: rowName,
          category: COMPONENT_TYPE_CATEGORY[UPLOAD_TYPE],
          imageUrl: cropped[i],
          accentColor: r.dominantColor,
          xPct: (r.x / naturalW) * 100,
          yPct: (r.y / naturalH) * 100,
          wPct: (r.width / naturalW) * 100,
          hPct: (r.height / naturalH) * 100,
        };
      });
      setUploadImagePreview(preview);
      setUploadScan({ scanning: false, rows, truncated, totalDetected });
    } catch (err) {
      setUploadScan({ scanning: false, failed: true });
    }
  };

  const resetUpload = () => {
    setUploadScan(null);
    setUploadImagePreview(null);
  };

  const updateUploadRow = (index, updates) => {
    setUploadScan((scan) => ({
      ...scan,
      rows: scan.rows.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    }));
  };

  const uploadRowError = (row, index, rows) => {
    if (!row.checked) return null;
    const trimmed = row.name.trim();
    if (!trimmed) return 'Name required';
    if (rows.some((r, i) => i !== index && r.checked && r.name.trim() === trimmed)) {
      return 'Duplicate name in this batch';
    }
    if ((existingNames || []).includes(trimmed)) {
      return 'A component with this name already exists';
    }
    return null;
  };

  const checkedUploadRows = uploadScan?.rows?.filter((r) => r.checked) || [];
  const uploadHasBlockingError = uploadScan?.rows?.some((r, i) => uploadRowError(r, i, uploadScan.rows)) || false;

  const handleUploadSubmit = () => {
    if (!checkedUploadRows.length) {
      alert('Please tick at least one component to add.');
      return;
    }
    const comps = checkedUploadRows.map((r) => ({
      name: r.name.trim(),
      description: '',
      category: r.category,
      type: UPLOAD_TYPE,
      template: 'image',
      imageUrl: r.imageUrl,
      accentColor: r.accentColor,
      accentFontSize: null,
      tokens: {},
    }));
    onSave(comps);
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
        borderRadius: '16px', padding: '2rem', width: 'min(940px, 94vw)',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Component' : 'Create New Component'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {!isEdit && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {[{ id: 'manual', label: 'Add Manually' }, { id: 'upload', label: 'Upload Image' }].map(t => {
              const isActive = entryTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEntryTab(t.id)}
                  style={{
                    flex: 1, padding: '0.5rem 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: isActive ? 'var(--bg-secondary)' : 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {entryTab === 'manual' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Fields on the left, the component itself on the right. A designer
              mapping a token sees the result immediately instead of saving,
              closing and reopening the preview drawer to check. */}
          <div className="pd-editor-split" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 268px',
            gap: '1.5rem', alignItems: 'start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {!isEdit && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Choose Preset Template</label>
              <select
                className="form-input"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                style={{ cursor: 'pointer', borderColor: 'var(--accent)' }}
              >
                {/* Opened from a folder, only that folder's presets are offered (Custom
                    always is, so a blank component can be started anywhere). */}
                {(asFragment ? [] : PRESET_COMPONENTS)
                  .filter(p => p.id === 'custom'
                    || (initialType ? p.type === initialType
                      : !initialCategory || p.category === initialCategory))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
              </select>
            </div>
          )}

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
              {/* One control for both: the type decides which template draws the
                  preview and which folder the component files into, so a separate
                  category picker could only ever disagree with the tree. */}
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Type</label>
              <select
                className="form-input"
                value={TEMPLATE_TO_TYPE[template] || ''}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setTemplate(TYPE_TO_TEMPLATE[nextType] || template);
                  setCategory(COMPONENT_TYPE_CATEGORY[nextType] || category);
                }}
                style={{ cursor: 'pointer' }}
              >
                {COMPONENT_TAXONOMY.map(group => (
                  <optgroup key={group.category} label={group.category}>
                    {group.types.map(t => (
                      <option key={t.type} value={t.type}>{t.type}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* What kind of component this is. Fragment and Extends are mutually exclusive
              — a fragment composes other components, an extending component inherits its
              mappings from one, and a component doing neither is the ordinary case. That
              makes it one choice of three rather than two switches that could both be on. */}
          {(() => {
            const canFragment = !isEdit || componentToEdit.template === 'fragment';
            const canExtend = parentOptions.length > 0;
            // Nothing to choose between, so no group at all — as before.
            if (!canFragment && !canExtend) return null;

            const kind = asFragment ? 'fragment' : (extendsId ? 'extends' : 'standalone');
            const choose = (next) => {
              setAsFragment(next === 'fragment');
              setExtendsId(next === 'extends' ? (parentOptions[0]?.id || '') : '');
            };

            const options = [
              {
                id: 'standalone',
                title: 'Standalone',
                desc: 'A component in its own right, styled by the mappings you set below.',
                show: true,
              },
              {
                id: 'fragment',
                title: 'Fragment',
                desc: 'A container that groups related components together.',
                show: canFragment,
              },
              {
                id: 'extends',
                title: 'Extends a component',
                desc: 'This component inherits mappings from an existing component.',
                show: canExtend,
              },
            ].filter(o => o.show);

            return (
              <div
                role="radiogroup"
                aria-label="Component kind"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
              >
                {options.map(o => {
                  const on = kind === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => choose(o.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem', width: '100%',
                        textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: '10px', padding: '0.8rem 0.9rem',
                      }}
                    >
                      {/* Spans rather than divs: this is a button, and a button may not
                          contain block-level content. */}
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                        marginTop: '0.12rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--text-tertiary)'),
                      }}>
                        {on && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                        )}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {o.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                          {o.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}

                {/* Keyed off the stored link rather than the chosen kind, so a component
                    saved with both — which the two independent switches used to allow —
                    still shows its parent instead of hiding it. */}
                {Boolean(extendsId) && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Inherits from</label>
                    <select className="form-input" value={extendsId} onChange={(e) => setExtendsId(e.target.value)} style={{ cursor: 'pointer' }}>
                      {/* itself and its descendants are absent, so a loop cannot be chosen */}
                      {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })()}

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


          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {/* Mappings and code are two views of the same thing, so they swap in place
                rather than stacking — the dialog already runs past the bottom of a
                laptop screen, and a panel added below here would never be seen. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '2px' }}>
                {[['properties', 'Token Mappings'], ['code', 'Code']].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEditorTab(tab)}
                    style={{
                      border: 'none', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit',
                      padding: '0.3rem 0.7rem', fontSize: '0.73rem',
                      background: editorTab === tab ? 'var(--bg-secondary)' : 'none',
                      color: editorTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontWeight: editorTab === tab ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {editorTab === 'code' && (
                <>
                  <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px', marginLeft: 'auto' }}>
                    {[['css', 'CSS'], ['jsx', 'JSX'], ['json', 'JSON']].map(([fmt, label]) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => { setCodeFormat(fmt); setCodeDraft(null); setCodeError(''); setCodeNote(''); }}
                        style={{
                          border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                          padding: '0.2rem 0.5rem', fontSize: '0.67rem',
                          background: codeFormat === fmt ? 'var(--bg-secondary)' : 'none',
                          color: codeFormat === fmt ? 'var(--text-primary)' : 'var(--text-tertiary)',
                          fontWeight: codeFormat === fmt ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(componentCodeText);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 1400);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '0.25rem 0.55rem',
                      color: codeCopied ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '0.67rem', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    {codeCopied ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
            </div>

            {editorTab === 'code' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <textarea
                  className="pd-component-code"
                  value={componentCodeText}
                  readOnly={codeFormat === 'jsx'}
                  spellCheck={false}
                  onChange={(e) => {
                    const text = e.target.value;
                    setCodeDraft(text);
                    if (codeFormat === 'css') applyParsedCode(parseComponentCss(text, activeTokens));
                    else if (codeFormat === 'json') applyParsedCode(parseComponentJson(text));
                  }}
                  onBlur={() => { if (!codeError) setCodeDraft(null); }}
                  style={{
                    width: '100%', height: '240px', resize: 'vertical',
                    background: 'var(--bg)', color: 'var(--text-primary)',
                    border: `1px solid ${codeError ? '#EF4444' : 'var(--border)'}`,
                    borderRadius: '8px', padding: '0.7rem 0.8rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.73rem', lineHeight: 1.6,
                    outline: 'none', tabSize: 2,
                  }}
                />
                {codeError ? (
                  <span style={{ fontSize: '0.68rem', color: '#EF4444' }}>{codeError}</span>
                ) : codeNote ? (
                  <span style={{ fontSize: '0.68rem', color: '#F59E0B' }}>{codeNote}</span>
                ) : (
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {codeFormat === 'jsx'
                      ? 'JSX is copy-only — component markup cannot be read back into token mappings.'
                      : codeFormat === 'css'
                        ? 'Edit or paste a CSS rule — each var() is matched against your tokens and becomes a mapping.'
                        : 'Edit or paste the component spec — name, type and mappings all follow along.'}
                  </span>
                )}
              </div>
            )}

            {editorTab === 'properties' && (
              <div
                className="pd-modal-sections"
                style={{
                  border: '1px solid var(--border)', borderRadius: '10px',
                  // Deliberately unbounded. The dialog shell already scrolls at 90vh and the
                  // preview beside it is sticky, so it stays in view while the sections are
                  // read — giving the sections their own scrollbar as well would nest one
                  // inside the other for no gain.
                }}
              >
                <PropertySections
                  tokens={tokens}
                  onPatch={patchTokens}
                  tokensForProperty={tokensForProperty}
                  presetsForProperty={presetsForProperty}
                  onCreateToken={onCreateToken}
                  existingTokenNames={existingTokenNames}
                  inheritedTokens={inheritedTokens}
                  inheritedFrom={parentName}
                  resolve={resolve}
                  reveal={revealSections}
                />
              </div>
            )}
          </div>
            </div>

            <aside className="pd-editor-preview" style={{ position: 'sticky', top: 0, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '0.5rem', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
                  Preview
                </span>
                {/* Designers check a component against both grounds, so the
                    preview can be flipped without leaving the editor. */}
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px' }}>
                  {[['dark', 'Dark'], ['light', 'Light']].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewLight(mode === 'light')}
                      style={{
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '0.15rem 0.4rem', fontSize: '0.63rem',
                        background: (mode === 'light') === previewLight ? 'var(--bg-secondary)' : 'none',
                        color: (mode === 'light') === previewLight ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '170px', padding: '1rem', overflow: 'hidden',
                borderRadius: '10px', border: '1px solid var(--border)',
                background: previewLight ? '#F4F4F6' : 'var(--bg)',
              }}>
                {renderComponentPreview(
                  { ...(componentToEdit || {}), name: name || 'Component', template },
                  previewStyle(),
                  previewLight
                    ? { surface: '#ffffff', surfaceAlt: '#f1f1f4', text: '#171717', muted: '#71717a', border: '#e4e4e7', shadow: '0 4px 12px rgba(0,0,0,0.12)' }
                    : {}
                )}
              </div>

              <p style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                {mappedCount
                  ? mappedCount + ' propert' + (mappedCount === 1 ? 'y' : 'ies') + ' mapped. Unmapped ones fall back to the preview’s own styling.'
                  : 'Nothing mapped yet — this is the untouched ' + (TEMPLATE_TO_TYPE[template] || template) + ' preview.'}
              </p>
            </aside>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={actionBtnStyle}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.25rem' }}>
              {isEdit ? 'Save Changes' : 'Create Component'}
            </button>
          </div>
        </form>
        )}

        {entryTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!uploadScan?.rows && (
              <label
                style={{
                  border: '2px dashed var(--border)', borderRadius: '12px', padding: '1.75rem 1rem',
                  textAlign: 'center', cursor: 'pointer', display: 'block', background: 'var(--bg-tertiary)',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { handleUploadFile(e.target.files?.[0]); e.target.value = ''; }}
                />
                {uploadScan?.scanning ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <div className="loading-spinner" style={{ width: '18px', height: '18px' }}></div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Detecting components…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Drop a design screenshot here, or click to browse</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                      Works best with a full Figma screen export — we'll detect each distinct UI element as its own region. Detection works best when elements have visible contrast with their surroundings.
                    </div>
                  </>
                )}
              </label>
            )}

            {uploadScan?.failed && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Couldn't detect any distinct regions in that image — it works best when elements have visible contrast with their surroundings. Try a different screenshot.
              </p>
            )}

            {uploadScan?.rows && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
                    Regions detected in this image ({uploadScan.rows.length})
                  </label>
                  <button
                    type="button"
                    onClick={resetUpload}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Upload a different image
                  </button>
                </div>

                {uploadScan.truncated && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                    Showing the {uploadScan.rows.length} largest of {uploadScan.totalDetected} detected regions.
                  </p>
                )}

                {uploadImagePreview && (
                  <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
                      <img src={uploadImagePreview} alt="Uploaded design" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }} />
                      {uploadScan.rows.map((row, i) => (
                        <div
                          key={i}
                          onClick={() => updateUploadRow(i, { checked: !row.checked })}
                          title={row.name}
                          style={{
                            position: 'absolute',
                            left: `${row.xPct}%`, top: `${row.yPct}%`, width: `${row.wPct}%`, height: `${row.hPct}%`,
                            border: `2px solid ${row.checked ? 'var(--accent)' : 'rgba(255,255,255,0.35)'}`,
                            background: row.checked ? 'rgba(252,6,148,0.12)' : 'rgba(0,0,0,0.15)',
                            borderRadius: '3px', cursor: 'pointer', boxSizing: 'border-box',
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: '-9px', left: '-9px',
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: row.checked ? 'var(--accent)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)', color: '#fff',
                            fontSize: '0.62rem', fontWeight: 700, lineHeight: '16px', textAlign: 'center',
                          }}>
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '2px' }}>
                  {uploadScan.rows.map((row, i) => {
                    const error = uploadRowError(row, i, uploadScan.rows);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                          background: 'var(--bg-tertiary)', border: `1px solid ${error ? '#EF4444' : 'var(--border)'}`,
                          borderRadius: '8px', padding: '0.6rem', opacity: row.checked ? 1 : 0.55,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={(e) => updateUploadRow(i, { checked: e.target.checked })}
                          style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', flexShrink: 0, marginTop: '10px', cursor: 'pointer' }}
                        />
                        <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                          <div style={{
                            width: '64px', height: '48px', borderRadius: '6px', flexShrink: 0,
                            border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}>
                            <img
                              src={row.imageUrl}
                              alt={row.name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <span style={{
                            position: 'absolute', top: '-7px', left: '-7px',
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                            fontSize: '0.6rem', fontWeight: 700, lineHeight: '14px', textAlign: 'center',
                          }}>
                            {i + 1}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={row.name}
                              onChange={(e) => updateUploadRow(i, { name: e.target.value })}
                              disabled={!row.checked}
                              placeholder="e.g. Pricing Card"
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                            />
                          </div>
                          {/* Every uploaded region is saved as an image component, so it
                              always files under Images & Avatars. A category picker here
                              would set a field the tree does not read. */}
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                            Files under <span style={{ color: 'var(--text-secondary)' }}>
                              {COMPONENT_TYPE_CATEGORY[UPLOAD_TYPE]} › {UPLOAD_TYPE}
                            </span>
                          </div>
                          {error && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>{error}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} style={actionBtnStyle}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.4rem 1.25rem', opacity: (!checkedUploadRows.length || uploadHasBlockingError) ? 0.5 : 1, cursor: (!checkedUploadRows.length || uploadHasBlockingError) ? 'not-allowed' : 'pointer' }}
                onClick={handleUploadSubmit}
                disabled={!checkedUploadRows.length || uploadHasBlockingError}
              >
                {checkedUploadRows.length ? `Add ${checkedUploadRows.length} Component${checkedUploadRows.length === 1 ? '' : 's'}` : 'Add Components'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandBibleSuggestionsModal({ suggestions, onClose, onApply }) {
  const [selected, setSelected] = useState({
    primaryColor: true,
    accentColor: true,
    headingFont: true,
    bodyFont: true,
    toneKeywords: true,
    voice: true,
  });

  const handleToggle = (key) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '640px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>✨</span> AI Brand Bible Analyzer
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          We scanned your uploaded document <strong style={{ color: 'var(--text-primary)' }}>{suggestions.fileName}</strong> and extracted the following brand styles. Check the values you want to apply to your project.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
          {/* Colors */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>Brand Colors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.primaryColor} onChange={() => handleToggle('primaryColor')} style={{ accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Primary Color:</span>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: suggestions.primaryColor, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{suggestions.primaryColor}</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.accentColor} onChange={() => handleToggle('accentColor')} style={{ accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Accent Color:</span>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: suggestions.accentColor, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{suggestions.accentColor}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Typography */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.75rem' }}>Typography</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.headingFont} onChange={() => handleToggle('headingFont')} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Headings Font:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: suggestions.headingFont }}>{suggestions.headingFont}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.bodyFont} onChange={() => handleToggle('bodyFont')} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Body Font:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: suggestions.bodyFont }}>{suggestions.bodyFont}</span>
              </label>
            </div>
          </div>

          {/* Tone & Voice */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.75rem' }}>Tone & Voice</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.toneKeywords} onChange={() => handleToggle('toneKeywords')} style={{ accentColor: 'var(--accent)', marginTop: '3px' }} />
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Keywords:</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {suggestions.toneKeywords.map(k => (
                      <span key={k} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>{k}</span>
                    ))}
                  </div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.voice} onChange={() => handleToggle('voice')} style={{ accentColor: 'var(--accent)', marginTop: '3px' }} />
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block' }}>Voice Guidelines:</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>"{suggestions.voice}"</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>Discard</button>
          <button 
            onClick={() => {
              const applied = {};
              for (const k in selected) {
                if (selected[k]) applied[k] = suggestions[k];
              }
              onApply(applied);
            }} 
            className="btn btn-primary" 
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Apply Suggestions
          </button>
        </div>
      </div>
    </div>
  );
}

