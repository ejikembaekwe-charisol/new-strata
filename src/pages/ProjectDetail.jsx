import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import branchIcon from '../assets/branch-icon.svg';
import { resolveMyRole, can, canViewTab, ROLES } from '../utils/permissions';
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

// Token LAYERS (for the pill switcher)
const TOKEN_LAYERS = ['Brand', 'Semantic', 'Component'];
const TOKEN_LAYER_LABELS = { Brand: 'Brand', Semantic: 'Semantic', Component: 'Scoped' };

// Types whose "Visual Preview" cell already renders a swatch + the raw value
// (must match the color cases in renderTokenPreview) — used to skip the
// redundant duplicate value line on the mobile token card.
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

// Which sidebar group a component falls under in the Components tree.
const componentTreeGroup = (comp) => {
  switch (comp.template) {
    case 'button': return 'Button';
    case 'card': return 'Container / Layout';
    case 'badge': return 'Text / Typography';
    case 'image': return 'Fragment';
    default: return 'Other';
  }
};

const COMPONENT_TREE_GROUPS = ['Button', 'Container / Layout', 'Fragment', 'Other', 'Text / Typography'];

// Flat token store: { Color: [{name, value, type, layer}, ...], Typography: [...], ... }
const MOCK_TOKENS = {
  Color: [
    { name: 'brand.color.primary',    value: '#FC0694', type: 'color', layer: 'Brand', description: 'Primary brand identity color' },
    { name: 'brand.color.secondary',  value: '#1A1A24', type: 'color', layer: 'Brand', description: 'Secondary brand slate color' },
    { name: 'brand.color.accent',     value: '#3B82F6', type: 'color', layer: 'Brand', description: 'Vibrant high-contrast accent' },
    { name: 'brand.color.background', value: '#0D0D12', type: 'color', layer: 'Brand', description: 'Deep dark application canvas' },
    { name: 'brand.color.surface',    value: '#13131A', type: 'color', layer: 'Brand', description: 'Elevated panel and card background' },
    { name: 'brand.color.text',       value: '#FFFFFF', type: 'color', layer: 'Brand', description: 'High-contrast reading text' },
    { name: 'color.action',           value: '{brand.color.primary}',    type: 'color', layer: 'Semantic' },
    { name: 'color.bg.primary',       value: '{brand.color.background}', type: 'color', layer: 'Semantic' },
    { name: 'color.bg.surface',       value: '{brand.color.surface}',    type: 'color', layer: 'Semantic' },
    { name: 'color.text.primary',     value: '{brand.color.text}',       type: 'color', layer: 'Semantic' },
    { name: 'color.text.secondary',   value: '#8C8CA1',                  type: 'color', layer: 'Semantic' },
    { name: 'button.bg',   value: '{color.action}',        type: 'color', layer: 'Component' },
    { name: 'button.text', value: '{color.text.primary}',  type: 'color', layer: 'Component' },
    { name: 'input.bg',    value: '{color.bg.surface}',    type: 'color', layer: 'Component' },
    { name: 'input.text',  value: '{color.text.primary}',  type: 'color', layer: 'Component' },
  ],
  Typography: [
    { name: 'brand.font.heading', value: 'Outfit', type: 'fontFamily', layer: 'Brand' },
    { name: 'brand.font.body',    value: 'Inter',  type: 'fontFamily', layer: 'Brand' },
    { name: 'brand.font.size.xs',   value: '0.75rem',  type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.sm',   value: '0.875rem', type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.base', value: '1rem',     type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.lg',   value: '1.25rem',  type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.xl',   value: '1.5rem',   type: 'fontSize', layer: 'Brand' },
    { name: 'text.heading',  value: '{brand.font.heading}',    type: 'fontFamily', layer: 'Semantic' },
    { name: 'text.body',     value: '{brand.font.body}',       type: 'fontFamily', layer: 'Semantic' },
    { name: 'text.size.ui',  value: '{brand.font.size.sm}',    type: 'fontSize',   layer: 'Semantic' },
    { name: 'button.font-family', value: '{text.heading}', type: 'fontFamily', layer: 'Component' },
    { name: 'button.font-size',   value: '{text.size.ui}', type: 'fontSize',   layer: 'Component' },
  ],
  Spacing: [
    { name: 'brand.space.1', value: '4px',  type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.2', value: '8px',  type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.3', value: '12px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.4', value: '16px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.6', value: '24px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.8', value: '32px', type: 'spacing', layer: 'Brand' },
    { name: 'space.tight',       value: '{brand.space.2}', type: 'spacing', layer: 'Semantic' },
    { name: 'space.comfortable', value: '{brand.space.4}', type: 'spacing', layer: 'Semantic' },
    { name: 'space.loose',       value: '{brand.space.8}', type: 'spacing', layer: 'Semantic' },
    { name: 'button.padding-x', value: '{space.comfortable}', type: 'spacing', layer: 'Component' },
    { name: 'button.padding-y', value: '{space.tight}',       type: 'spacing', layer: 'Component' },
    { name: 'input.padding',    value: '{space.comfortable}', type: 'spacing', layer: 'Component' },
  ],
  Sizing: [],
  Layout: [],
  Flexbox: [],
  Lists: [],
  Border: [
    { name: 'brand.radius.none', value: '0px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.sm',   value: '4px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.md',   value: '8px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.lg',   value: '16px',   type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.full', value: '9999px', type: 'borderRadius', layer: 'Brand' },
    { name: 'radius.interactive', value: '{brand.radius.md}',   type: 'borderRadius', layer: 'Semantic' },
    { name: 'radius.container',   value: '{brand.radius.lg}',   type: 'borderRadius', layer: 'Semantic' },
    { name: 'button.radius', value: '{radius.interactive}', type: 'borderRadius', layer: 'Component' },
    { name: 'input.radius',  value: '{radius.interactive}', type: 'borderRadius', layer: 'Component' },
    { name: 'card.radius',   value: '{radius.container}',   type: 'borderRadius', layer: 'Component' },
  ],
  Shadow: [
    { name: 'brand.shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)',   type: 'shadow', layer: 'Brand' },
    { name: 'brand.shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)',  type: 'shadow', layer: 'Brand' },
    { name: 'brand.shadow.lg', value: '0 16px 48px rgba(0,0,0,0.5)', type: 'shadow', layer: 'Brand' },
    { name: 'shadow.subtle',  value: '{brand.shadow.sm}', type: 'shadow', layer: 'Semantic' },
    { name: 'shadow.overlay', value: '{brand.shadow.lg}', type: 'shadow', layer: 'Semantic' },
    { name: 'card.shadow',   value: '{shadow.subtle}',  type: 'shadow', layer: 'Component' },
    { name: 'modal.shadow',  value: '{shadow.overlay}', type: 'shadow', layer: 'Component' },
  ],
  Motion: [
    { name: 'brand.duration.fast',   value: '150ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.duration.base',   value: '250ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.duration.slow',   value: '500ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.easing.default',  value: 'cubic-bezier(0.4,0,0.2,1)', type: 'easing', layer: 'Brand' },
    { name: 'duration.transition', value: '{brand.duration.base}',   type: 'duration', layer: 'Semantic' },
    { name: 'easing.standard',     value: '{brand.easing.default}',  type: 'easing',   layer: 'Semantic' },
    { name: 'button.transition-duration', value: '{duration.transition}', type: 'duration', layer: 'Component' },
    { name: 'button.easing',             value: '{easing.standard}',      type: 'easing',   layer: 'Component' },
  ],
};

// Migrate old formats to the new flat-by-type structure
const migrateTokensToLayers = (saved) => {
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
  const { user, logout } = useAuth();
  const { projects, isLoaded, updateProject, addProject, deleteProject } = useProjects();

  // Find project from list
  const project = projects.find(p => String(p.id) === String(id));
  const myRole = resolveMyRole(project, user);

  const [activeTab, setActiveTab] = useState('tokens');
  const [activeCategory, setActiveCategory] = useState('Color');  // token type
  const [activeLayer, setActiveLayer] = useState('Brand');          // Brand | Semantic | Component
  const [tokenTableSearch, setTokenTableSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date());
  const [brandData, setBrandData] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [projectNameDraft, setProjectNameDraft] = useState(project?.name || '');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Designer' });
  // Session-only: dismissing just hides it for this visit — it comes back on
  // the next page refresh, so it keeps catching the user's eye rather than
  // vanishing for good after one click.
  const [uploadBannerDismissed, setUploadBannerDismissed] = useState(false);
  const dismissUploadBanner = () => setUploadBannerDismissed(true);

  // Components tree in the sidebar. Opening a component shows the preview
  // drawer (previewComponentId) — there is no separate in-page detail view.
  const [componentSearch, setComponentSearch] = useState('');
  const [expandedComponentGroups, setExpandedComponentGroups] = useState(() => new Set(['Button']));

  // Component group filter, driven by the mobile bottom navbar. Defaults to
  // 'All' so the desktop view — which has no group-filter control — is unchanged.
  const [activeComponentGroup, setActiveComponentGroup] = useState('All');

  // Kebab menu on a component card (mobile). Holds the trigger's measured
  // screen position because the rows live in an `overflow: hidden` container,
  // which would clip an absolutely-positioned panel — so the menu is `fixed`.
  const [componentMenu, setComponentMenu] = useState(null); // { id, top, right }

  // Component Preview drawer. `previewOnLight` is deliberately local to the
  // drawer — it swaps only the preview surface, unlike the app-wide isLightTheme.
  const [previewComponentId, setPreviewComponentId] = useState(null);
  const [previewOnLight, setPreviewOnLight] = useState(false);
  const previewDrawerRef = useRef(null);

  // Handoff state variables
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
  const [brandBibleDirty, setBrandBibleDirty] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [selectedImpacts, setSelectedImpacts] = useState({ tokens: {}, components: {} });
  const [impactPanelTab, setImpactPanelTab] = useState('brandBible');
  const [suggestionsModalData, setSuggestionsModalData] = useState(null);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [undoState, setUndoState] = useState(null);
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

  // Adds many tokens (e.g. a batch from the token-upload table) in one state
  // update — calling handleAddToken in a loop would have every iteration read
  // the same stale `activeTokens` closure and only the last token would stick.
  const handleAddTokens = (tokens) => {
    const updated = { ...activeTokens };
    for (const token of tokens) {
      const category = getCategoryForType(token.type);
      updated[category] = [...(updated[category] || []), token];
    }
    updateTokensState(updated);
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
      newValue: updatedToken.value
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

  // Adds many components (e.g. a batch of regions detected from one design
  // screenshot) in one state update — calling handleAddComponent in a loop
  // would have every iteration read the same stale `components` closure and
  // only the last one would stick. Each item also needs its own unique id:
  // String(Date.now()) per item in a tight synchronous loop can collide.
  const handleAddComponents = (comps) => {
    const newComps = comps.map((c, i) => ({ id: `${Date.now()}-${i}`, ...c }));
    updateComponentsState([...components, ...newComps]);
  };

  const handleEditComponent = (updatedComp) => {
    updateComponentsState(components.map(c => c.id === updatedComp.id ? updatedComp : c));
  };

  const handleDeleteComponent = (compId) => {
    updateComponentsState(components.filter(c => c.id !== compId));
    setSelectedComponentIds(prev => { const next = new Set(prev); next.delete(compId); return next; });
  };

  const handleDeleteComponents = (compIds) => {
    const ids = new Set(compIds);
    updateComponentsState(components.filter(c => !ids.has(c.id)));
    setSelectedComponentIds(new Set());
  };

  // Recursive token value resolver for references (e.g. {brand.color.primary})
  const resolveTokenValue = (tokenValueOrName) => {
    if (!tokenValueOrName) return '';
    let val = String(tokenValueOrName).trim();
    
    // Check if it's a token name directly (legacy mappings)
    if (!val.startsWith('{')) {
      for (const cat in activeTokens) {
        const found = activeTokens[cat]?.find(t => t.name === val);
        if (found) return resolveTokenValue(found.value);
      }
    }
    
    // Check if it's a bracketed reference
    const match = val.match(/^\{(.+)\}$/);
    if (match) {
      const refName = match[1];
      for (const cat in activeTokens) {
        const found = activeTokens[cat]?.find(t => t.name === refName);
        if (found) return resolveTokenValue(found.value);
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

  // Turns a component's whole `tokens` map into a resolved React style object,
  // so any CSS property the user mapped (not just the original six) actually
  // shows up in the live preview.
  const resolveMappedStyle = (comp) => {
    const out = {};
    for (const [key, tokenName] of Object.entries(comp.tokens || {})) {
      if (!tokenName) continue;
      const resolved = resolveTokenValue(tokenName);
      if (!resolved) continue;
      out[cssPropToStyleKey(cssPropForTokenKey(key))] = resolved;
    }
    return out;
  };

  // Live Component Preview Renderer
  const renderLivePreview = (comp) => {
    const mapped = resolveMappedStyle(comp);
    const style = {
      border: 'none',
      cursor: 'pointer',
      display: 'inline-block',
      textAlign: 'center',
      fontWeight: 500,
      transition: 'opacity 0.2s',
      ...mapped,
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
        <span style={{ ...style, display: 'inline-block', textTransform: 'uppercase', fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.05em', ...mapped }}>
          New
        </span>
      );
    }
    if (comp.template === 'card') {
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'left',
          width: '100%',
          maxWidth: '240px',
          ...mapped,
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
          style={(() => {
            // The input template renders its mapped background-color as the
            // field's border instead, so the field itself stays legible.
            const { background, backgroundColor, ...rest } = mapped;
            return {
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              maxWidth: '200px',
              ...rest,
              background: 'var(--bg-tertiary)',
              border: `1px solid ${background || backgroundColor || 'var(--border)'}`,
            };
          })()}
          disabled
        />
      );
    }
    if (comp.template === 'image') {
      return (
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '100%', maxHeight: '100%',
          borderLeft: comp.accentColor ? `4px solid ${comp.accentColor}` : 'none',
          paddingLeft: comp.accentColor ? '0.5rem' : 0,
        }}>
          <img
            src={comp.imageUrl}
            alt={comp.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
          />
          {comp.accentFontSize && (
            <span
              title={`Detected text size: ~${comp.accentFontSize}px`}
              style={{
                position: 'absolute', top: '2px', right: '2px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '0.1rem 0.35rem',
                fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4,
              }}
            >
              Aa {comp.accentFontSize}px
            </span>
          )}
        </div>
      );
    }
    return null;
  };

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
    const oldBrand = JSON.parse(JSON.stringify(brandData));
    const oldTokens = JSON.parse(JSON.stringify(activeTokens));
    const oldComponents = JSON.parse(JSON.stringify(components));
    setUndoState({ brand: oldBrand, tokens: oldTokens, components: oldComponents });
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

    setBrandData(finalBrand);
    setActiveTokens(finalTokens);
    setComponents(finalComponents);
    
    updateProject(id, {
      brand: finalBrand,
      tokens: finalTokens,
      components: finalComponents
    });

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

  const handleUndo = () => {
    if (undoState) {
      setBrandData(undoState.brand);
      setActiveTokens(undoState.tokens);
      setComponents(undoState.components);
      updateProject(id, {
        brand: undoState.brand,
        tokens: undoState.tokens,
        components: undoState.components
      });
      setUndoState(null);
      setShowUndoToast(false);
    }
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

  // Filter tokens by both type (sidebar) and layer (pill), then by the table search box
  const tokenTableSearchLower = tokenTableSearch.trim().toLowerCase();
  const tokens = (activeTokens[activeCategory] || [])
    .filter(t => t.layer === activeLayer)
    .filter(t => !tokenTableSearchLower || [t.name, t.value, t.type].some(v => String(v).toLowerCase().includes(tokenTableSearchLower)));

  // Shared main-tab button list — rendered in the desktop sidebar, the mobile icon
  // rail (icon-only), and the mobile nav overlay (icon + label, like desktop).
  const renderMainTabButtons = () => MAIN_TABS.filter(tab => canViewTab(myRole, tab.id)).map(tab => (
    <button
      key={tab.id}
      className={`pd-sidebar-tab-btn${activeTab === tab.id ? ' pd-sidebar-tab-btn-active' : ''}`}
      title={tab.label}
      onClick={() => { setActiveTab(tab.id); setMobileNavExpanded(false); }}
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
      <span className="pd-sidebar-tab-label">{tab.label}</span>
    </button>
  ));

  // Shared button list for the Token Type categories — rendered both in the desktop
  // sidebar and as a mobile chip row (the mobile icon rail has no room for labels).
  const renderTokenTypeCategoryButtons = () => TOKEN_TYPES.map(({ id, icon }) => {
    const total = (activeTokens[id] || []).length;
    const layerCount = (activeTokens[id] || []).filter(t => t.layer === activeLayer).length;
    return (
      <button
        key={id}
        className="pd-sidebar-category-btn"
        onClick={() => { setActiveCategory(id); setMobileNavExpanded(false); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: activeCategory === id ? 'var(--accent-glow)' : 'none',
          border: activeCategory === id ? '1px solid rgba(252,6,148,0.2)' : '1px solid transparent',
          borderRadius: '6px', padding: '0.45rem 0.625rem', marginBottom: '0.1rem',
          color: activeCategory === id ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          gap: '0.5rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ opacity: 0.7 }}>{icon}</span>
          <span className="pd-sidebar-category-label">{id}</span>
        </span>
        <span className="pd-sidebar-category-count" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
          {layerCount}/{total}
        </span>
      </button>
    );
  });

  // Components sidebar: a search box over a collapsible tree of components
  // grouped by kind, with the open component highlighted.
  const renderComponentCategoryButtons = () => {
    const query = componentSearch.trim().toLowerCase();
    const matching = query
      ? components.filter(c => (c.name || '').toLowerCase().includes(query))
      : components;

    const toggleGroup = (group) => setExpandedComponentGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });

    return (
      <>
        <input
          value={componentSearch}
          onChange={(e) => setComponentSearch(e.target.value)}
          placeholder="Search components..."
          style={{
            width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0.5rem 0.625rem', marginBottom: '0.75rem',
            color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none',
          }}
        />
        {COMPONENT_TREE_GROUPS.map(group => {
          const groupComps = matching.filter(c => componentTreeGroup(c) === group);
          if (query && groupComps.length === 0) return null;
          const isOpen = query ? true : expandedComponentGroups.has(group);
          const hasSelected = groupComps.some(c => c.id === previewComponentId);
          return (
            <div key={group}>
              <button
                className="pd-sidebar-category-btn"
                onClick={() => toggleGroup(group)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  width: '100%', background: 'none', border: '1px solid transparent',
                  borderRadius: '6px', padding: '0.45rem 0.625rem', marginBottom: '0.1rem',
                  color: hasSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  fontWeight: hasSelected ? 600 : 400,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className="pd-sidebar-category-label" style={{ flex: 1 }}>{group}</span>
                {groupComps.length > 0 && (
                  <span className="pd-sidebar-category-count" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    {groupComps.length}
                  </span>
                )}
              </button>
              {isOpen && groupComps.map(comp => {
                const isActive = comp.id === previewComponentId;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setPreviewComponentId(comp.id);
                      setMobileNavExpanded(false);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: isActive ? 'rgba(252,6,148,0.08)' : 'none',
                      border: 'none', borderRadius: '6px',
                      padding: '0.4rem 0.625rem 0.4rem 1.6rem', marginBottom: '0.1rem',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                      fontWeight: isActive ? 600 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {comp.name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  // Flat component-group chips for the mobile bottom navbar. The desktop
  // sidebar keeps its tree (renderComponentCategoryButtons) — this is the
  // bar-only equivalent, matching how the token types render there.
  const renderComponentGroupChips = () => ['All', ...COMPONENT_TREE_GROUPS].map(group => {
    const count = group === 'All'
      ? components.length
      : components.filter(c => componentTreeGroup(c) === group).length;
    const isActive = activeComponentGroup === group;
    return (
      <button
        key={group}
        className="pd-sidebar-category-btn"
        onClick={() => {
          setActiveComponentGroup(group);
          // Close any open preview so the newly filtered list is visible —
          // on mobile the drawer covers the whole screen.
          setPreviewComponentId(null);
          setMobileNavExpanded(false);
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: isActive ? 'var(--accent-glow)' : 'none',
          border: isActive ? '1px solid rgba(252,6,148,0.2)' : '1px solid transparent',
          borderRadius: '6px', padding: '0.45rem 0.625rem', marginBottom: '0.1rem',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          gap: '0.5rem',
        }}
      >
        <span className="pd-sidebar-category-label">{group}</span>
        <span className="pd-sidebar-category-count" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
          {count}
        </span>
      </button>
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── App Top Bar ── */}
      <header className="pd-header" style={{
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

        <span className="pd-breadcrumb-sep" style={{ color: 'var(--border)', fontSize: '1.2rem', marginLeft: '0.25rem' }}>/</span>

        <Link to="/projects" className="pd-breadcrumb-projects" style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Projects
        </Link>

        <span className="pd-breadcrumb-sep" style={{ color: 'var(--border)', fontSize: '1.2rem' }}>/</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
          <span className="pd-status-pill" style={
            project.status === 'Active'
              ? { fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '100px', background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
              : { fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: '100px', border: '1px solid var(--border)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
          }>{project.status}</span>
        </div>

        <div style={{ flex: 1 }} />

        <span className="pd-header-live-dot" style={{
          display: 'none', width: '10px', height: '10px', borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0,
        }} />

        {/* Last saved timestamp */}
        <span className="pd-header-saved" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          Saved {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>

        {/* Branch selector */}
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

        {/* Publish changes button */}
        <button
          className="pd-header-publish"
          onClick={() => setActiveTab('branch')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent)', border: '1px solid var(--accent)',
            borderRadius: '6px', padding: '0.4rem 0.875rem',
            color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="pd-btn-label">Publish changes</span>
        </button>

        {/* Export button */}
        <button
          className="pd-export-btn"
          onClick={() => setActiveTab('handoff')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0.4rem 0.875rem',
            color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className="pd-btn-label">Export</span>
        </button>

        {/* Theme toggle */}
        <button
          className="pd-header-theme-toggle"
          title={isLightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
          onClick={() => { setIsLightTheme(p => !p); document.body.classList.toggle('light-theme'); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', borderRadius: '100px',
            background: 'transparent', border: '1px solid var(--border)',
            fontSize: '0.75rem', cursor: 'pointer',
          }}
        >
          {isLightTheme ? '🌙' : '☀️'}
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
        <aside className="pd-sidebar" style={{
          width: '200px', flexShrink: 0,
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
          {activeTab === 'tokens' && (
            <div className="pd-sidebar-categories" style={{ padding: '0 0.75rem' }}>
              <div className="pd-sidebar-categories-label" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', padding: '0 0.625rem' }}>
                Token Type
              </div>
              {renderTokenTypeCategoryButtons()}
            </div>
          )}

          {/* Component tree */}
          {activeTab === 'components' && (
            <div className="pd-sidebar-categories" style={{ padding: '0 0.75rem' }}>
              {renderComponentCategoryButtons()}
            </div>
          )}
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
        <main className="pd-main" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

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
                              <input
                                type="color"
                                value={brandData[c.field]}
                                onChange={(e) => handleBrandUpdate(c.field, e.target.value)}
                                disabled={!can(myRole, 'brandBible', 'edit')}
                                style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: 'none', cursor: can(myRole, 'brandBible', 'edit') ? 'pointer' : 'not-allowed' }}
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
                            value={brandData.headingFont}
                            onChange={(e) => handleBrandUpdate('headingFont', e.target.value)}
                            disabled={!can(myRole, 'brandBible', 'edit')}
                            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: can(myRole, 'brandBible', 'edit') ? 'pointer' : 'not-allowed' }}
                          >
                            <option>Outfit</option>
                            <option>Inter</option>
                            <option>Roboto</option>
                          </select>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Body Font</span>
                          <select
                            value={brandData.bodyFont}
                            onChange={(e) => handleBrandUpdate('bodyFont', e.target.value)}
                            disabled={!can(myRole, 'brandBible', 'edit')}
                            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: can(myRole, 'brandBible', 'edit') ? 'pointer' : 'not-allowed' }}
                          >
                            <option>Inter</option>
                            <option>Roboto</option>
                            <option>Outfit</option>
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
              {/* Token table header */}
              <div className="pd-tokens-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {activeCategory} Tokens
                    </h2>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '0.15rem 0.5rem',
                    }}>
                      {(activeTokens[activeCategory] || []).length} defined
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {tokens.length} {TOKEN_LAYER_LABELS[activeLayer].toLowerCase()} token{tokens.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {can(myRole, 'tokens', 'create') && (
                  <div className="pd-tokens-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setTokenModal({ mode: 'add', category: activeCategory, defaultLayer: activeLayer })} style={actionBtnStyle}>+ Add token</button>
                    <button style={actionBtnStyle} onClick={() => alert('Importing tokens... (mock)')}>Import</button>
                  </div>
                )}
              </div>

              {/* Token search */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={tokenTableSearch}
                  onChange={(e) => setTokenTableSearch(e.target.value)}
                  placeholder={`Search ${activeCategory.toLowerCase()}, spacing, typography...`}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '0.65rem 1rem 0.65rem 2.25rem', color: 'var(--text-primary)',
                    fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* ── Layer pill switcher ── */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px',
                marginBottom: '1.25rem',
                gap: '2px',
                position: 'relative',
                maxWidth: '100%',
                overflowX: 'auto',
              }}>
                {TOKEN_LAYERS.map(layer => {
                  const count = (activeTokens[activeCategory] || []).filter(t => t.layer === layer).length;
                  const isActive = activeLayer === layer;
                  const layerColor = layer === 'Brand' ? '#F59E0B' : layer === 'Semantic' ? '#3B82F6' : '#10B981';
                  return (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer)}
                      style={{
                        position: 'relative',
                        padding: '0.35rem 0.875rem',
                        borderRadius: '5px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 600 : 400,
                        fontFamily: 'inherit',
                        transition: 'all 0.18s ease',
                        background: isActive ? 'var(--bg-secondary)' : 'transparent',
                        color: isActive ? layerColor : 'var(--text-tertiary)',
                        boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      {/* Layer colour dot */}
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: isActive ? layerColor : 'var(--text-tertiary)',
                        opacity: isActive ? 1 : 0.4,
                        transition: 'all 0.18s',
                        flexShrink: 0,
                      }} />
                      {TOKEN_LAYER_LABELS[layer]}
                      <span style={{
                        fontSize: '0.65rem',
                        background: isActive ? `${layerColor}20` : 'transparent',
                        color: isActive ? layerColor : 'var(--text-tertiary)',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '100px',
                        transition: 'all 0.18s',
                        minWidth: '18px',
                        textAlign: 'center',
                      }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Column headers */}
              <div className="pd-token-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: '1rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                {['Name', 'Value', 'Type', 'Visual Preview'].map(h => (
                  <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {/* Token rows */}
              {tokens.map((token, i) => {
                const displayValue = editingTokenName === token.name ? editingTokenValue : token.value;
                const resolvedPreviewValue = resolveTokenValue(displayValue);
                const previewToken = { ...token, value: resolvedPreviewValue };
                const isAlias = String(displayValue).trim().startsWith('{');
                const chain = getTokenInheritanceChain(displayValue);

                return (
                  <div
                    key={i}
                    className="pd-token-row"
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr',
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
                      ) : isAlias ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span
                            onDoubleClick={() => {
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
              })}
            </>
          )}

          {/* Token types live in a fixed bottom navbar on mobile */}
          {activeTab === 'tokens' && (
            <div className="pd-mobile-category-row">{renderTokenTypeCategoryButtons()}</div>
          )}

          {activeTab === 'components' && (() => {
            // Rows on screen, narrowed by the group chosen in the mobile bar.
            const visibleComponents = activeComponentGroup === 'All'
              ? components
              : components.filter(c => componentTreeGroup(c) === activeComponentGroup);

            const isPresetComp = (comp) => comp.isPreset || String(comp.id).startsWith('preset-') || comp.id === '1' || comp.id === '2' || comp.id === '3' || comp.id === '4';
            // Selection helpers work on what's visible, so "select all" can't
            // silently tick rows hidden by the group filter.
            const deletableSelected = visibleComponents.filter(c => selectedComponentIds.has(c.id) && !isPresetComp(c));
            const allComponentsSelected = visibleComponents.length > 0 && visibleComponents.every(c => selectedComponentIds.has(c.id));
            const toggleComponentSelected = (compId) => setSelectedComponentIds(prev => {
              const next = new Set(prev);
              if (next.has(compId)) next.delete(compId); else next.add(compId);
              return next;
            });
            const toggleAllComponents = () => setSelectedComponentIds(prev => {
              const next = new Set(prev);
              if (allComponentsSelected) visibleComponents.forEach(c => next.delete(c.id));
              else visibleComponents.forEach(c => next.add(c.id));
              return next;
            });
            const LIST_TABLE_COLS = '40px minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 1.2fr) 90px 104px';

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
            const savedIndicator = (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-tertiary)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Saved {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            );
            const undoRedoBtns = (
              <>
                <button
                  style={{ ...toolbarIconBtn, color: 'var(--text-tertiary)', cursor: 'not-allowed', opacity: 0.5 }}
                  title="Undo isn't available yet — edit history isn't tracked"
                  disabled
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
                </button>
                <button
                  style={{ ...toolbarIconBtn, color: 'var(--text-tertiary)', cursor: 'not-allowed', opacity: 0.5 }}
                  title="Redo isn't available yet — edit history isn't tracked"
                  disabled
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
                </button>
              </>
            );
            const unpublishedBtn = (
              <button style={toolbarBtn} onClick={() => setActiveTab('branch')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--accent)' }}>
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Unpublished changes
              </button>
            );
            const addComponentBtn = can(myRole, 'components', 'create') ? (
              <button
                onClick={() => setComponentModal({ mode: 'add' })}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem', whiteSpace: 'nowrap' }}
              >
                + Add component
              </button>
            ) : null;

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
                            {activeComponentGroup === 'All' ? 'All components' : activeComponentGroup}
                          </h2>
                          <span style={{
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                            borderRadius: '9999px', padding: '0.2rem 0.6rem',
                            color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 500,
                          }}>
                            {visibleComponents.length} total
                          </span>
                          {activeComponentGroup !== 'All' && (
                            // The group chips are mobile-only, so without this a
                            // filter set on a phone would be stuck on desktop.
                            <button
                              onClick={() => setActiveComponentGroup('All')}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: '0.75rem', fontFamily: 'inherit' }}
                            >
                              Show all
                            </button>
                          )}
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
                        {savedIndicator}
                        {undoRedoBtns}
                        {unpublishedBtn}
                        {addComponentBtn}
                      </>
                    )}

                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div className="pd-component-list-row pd-component-list-row-head" style={{
                        display: 'grid', gridTemplateColumns: LIST_TABLE_COLS, gap: '0.75rem',
                        alignItems: 'center', padding: '0.9rem 1rem',
                        background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
                      }}>
                        <input
                          type="checkbox"
                          checked={allComponentsSelected}
                          onChange={toggleAllComponents}
                          title="Select all components"
                          style={{ accentColor: 'var(--accent)', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Component</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Type</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Preview</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Properties</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>Tools</span>
                      </div>

                      {visibleComponents.map((comp, i) => {
                        const mapped = Object.values(comp.tokens || {}).filter(Boolean).length;
                        const preset = isPresetComp(comp);
                        const isChecked = selectedComponentIds.has(comp.id);
                        return (
                          <div
                            key={comp.id}
                            className={'pd-component-list-row' + (isChecked ? ' pd-component-list-row-selected' : '')}
                            style={{
                              display: 'grid', gridTemplateColumns: LIST_TABLE_COLS, gap: '0.75rem',
                              alignItems: 'center', padding: '0.8rem 1rem',
                              borderBottom: i < visibleComponents.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewComponentId(comp.id)}
                            title={'View ' + comp.name}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleComponentSelected(comp.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ accentColor: 'var(--accent)', width: '15px', height: '15px', cursor: 'pointer' }}
                            />

                            <button
                              onClick={() => setPreviewComponentId(comp.id)}
                              title={'View ' + comp.name}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0,
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                                fontFamily: 'inherit', textAlign: 'left',
                              }}
                            >
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

                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {comp.template === 'image' ? 'Uploaded image' : comp.template}
                            </span>

                            <div style={{
                              background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px',
                              minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0.35rem', overflow: 'hidden',
                              // Decorative here: the button template carries its own
                              // onClick alert and the input template is `disabled`
                              // (which swallows clicks without bubbling), both of
                              // which would otherwise block the row from opening.
                              pointerEvents: 'none',
                            }}>
                              {renderLivePreview(comp)}
                            </div>

                            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                              {mapped} mapped
                            </span>

                            <div
                              style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end', alignItems: 'center' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Mobile: the three actions collapse into a kebab */}
                              <button
                                className="pd-component-row-kebab"
                                title={'Actions for ' + comp.name}
                                onClick={(e) => {
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setComponentMenu(prev => prev && prev.id === comp.id
                                    ? null
                                    : { id: comp.id, top: r.bottom + 6, right: window.innerWidth - r.right });
                                }}
                                style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', alignItems: 'center' }}
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
                                      Preview
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

                              <button
                                className="pd-component-row-actions"
                                onClick={() => setPreviewComponentId(comp.id)}
                                title={'Preview ' + comp.name}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                              {can(myRole, 'components', 'edit') && (
                                <button
                                  className="pd-component-row-actions"
                                  onClick={() => setComponentModal({ mode: 'edit', component: comp })}
                                  title="Edit component"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                              {can(myRole, 'components', 'edit') && (preset ? (
                                <button
                                  className="pd-component-row-actions"
                                  disabled
                                  title="Preset components cannot be deleted"
                                  style={{ background: 'none', border: 'none', cursor: 'not-allowed', color: 'var(--text-tertiary)', padding: '0.25rem', display: 'flex', alignItems: 'center', opacity: 0.3 }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  className="pd-component-row-actions"
                                  onClick={() => { if (window.confirm('Delete component "' + comp.name + '"?')) handleDeleteComponent(comp.id); }}
                                  title="Delete component"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {visibleComponents.length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '1rem 0 0' }}>
                        No components in this group.
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* Component groups live in a fixed bottom navbar on mobile */}
          {activeTab === 'components' && (
            <div className="pd-mobile-category-row">{renderComponentGroupChips()}</div>
          )}

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

            // If no team has been set up yet, show "you" as the implicit fallback Owner.
            const displayMembers = members.length
              ? members
              : [{ id: 'me', name: user?.name, email: user?.email, initials: user?.initials, role: 'Owner', joinedAt: null }];

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
                {members.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                    It's just you right now. Invite teammates to collaborate on this design system.
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
                        <select
                          className="form-input" style={{ cursor: 'pointer' }}
                          value={inviteForm.role}
                          onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))}
                        >
                          {ROLES.filter(r => r !== 'Owner').map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
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

      {/* ── Component Preview drawer ── */}
      {(() => {
        const comp = components.find(c => c.id === previewComponentId);
        if (!comp) return null;

        const rows = Object.entries(comp.tokens || {})
          .filter(([, tokenName]) => tokenName)
          .map(([key, tokenName]) => {
            const cssName = cssPropForTokenKey(key);
            return {
              key,
              cssName,
              tokenName,
              resolved: resolveTokenValue(tokenName),
              category: getGroupDisplayForType(cssName),
            };
          });

        return (
          <div ref={previewDrawerRef} className="pd-preview-drawer" style={{
            position: 'fixed', top: '52px', right: 0, bottom: 0, width: '380px',
            background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
            boxShadow: '-12px 0 32px rgba(0,0,0,0.4)', zIndex: 400,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0,
              padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Component Preview</span>
              <span style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '9999px',
                padding: '0.15rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>
                {rows.length} {rows.length === 1 ? 'property' : 'properties'}
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setPreviewOnLight(v => !v)}
                title={previewOnLight ? 'Preview on a dark background' : 'Preview on a light background'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.2rem', display: 'flex', fontSize: '0.95rem' }}
              >
                {previewOnLight ? '🌙' : '☀️'}
              </button>
              {can(myRole, 'components', 'edit') && (
                // Full-screen on mobile hides the row this was opened from, so
                // without this the drawer would be a dead end for editing.
                <button
                  onClick={() => { setComponentModal({ mode: 'edit', component: comp }); setPreviewComponentId(null); }}
                  title={'Edit ' + comp.name}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setPreviewComponentId(null)}
                title="Close preview"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.25rem', lineHeight: 1, padding: '0 0.2rem' }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  {comp.name}
                </div>
                <div style={{
                  background: previewOnLight ? '#F4F4F6' : 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '1.25rem', overflow: 'hidden',
                }}>
                  {renderLivePreview(comp)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  Properties ({rows.length})
                </div>
                {rows.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                    No properties mapped on this component yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {rows.map(r => (
                      <div key={r.key} style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        borderRadius: '10px', padding: '0.65rem 0.75rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.cssName}
                          </span>
                          <div style={{ flex: 1 }} />
                          <span style={{
                            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '5px',
                            padding: '0.1rem 0.4rem', color: 'var(--text-secondary)', fontSize: '0.63rem',
                            fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            {r.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                          {/^#[0-9A-Fa-f]{3,8}$/.test(r.resolved) && (
                            <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: r.resolved, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.resolved || '—'}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          → {r.tokenName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
        .pd-mobile-category-row, .pd-sidebar-rail-bottom, .pd-mobile-nav-toggle { display: none; }

        @media (max-width: 768px) {
          .pd-header { padding: 0 0.875rem !important; gap: 0.625rem !important; }
          .pd-status-pill { display: none !important; }
          .pd-btn-label { display: none; }
          .pd-export-btn, .pd-header-sync, .pd-header-avatar { display: none !important; }
          .pd-header-saved, .pd-header-branch, .pd-header-theme-toggle { display: none !important; }
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

          /* Category lists move out of the rail on mobile. Token types are a
             flat chip list, so they go in a fixed bottom navbar. The component
             list is a search box + tree, which a horizontal flex strip can't
             hold (the input claims the full width and pushes the groups
             off-screen), so it gets an inline collapsible card instead.
             Padding-bottom clears the bottom bars. */
          .pd-sidebar-categories { display: none !important; }
          .pd-main { padding-bottom: 4.5rem !important; }
          .pd-mobile-category-row {
            display: flex !important;
            position: fixed;
            left: 52px; right: 0; bottom: 0;
            background: var(--bg-secondary);
            border-top: 1px solid var(--border);
            overflow-x: auto;
            gap: 0.4rem;
            padding: 0.625rem 0.75rem;
            z-index: 150;
          }
          .pd-mobile-category-row .pd-sidebar-category-btn {
            width: auto !important;
            flex-shrink: 0;
            white-space: nowrap;
            border-radius: 100px !important;
          }
          .pd-mobile-category-row .pd-sidebar-category-count { display: none; }
          /* A 380px drawer would be a squeezed sliver on a phone */
          /* Full-screen on a phone — a 380px side panel is a sliver there,
             and top:0 covers the app header so it truly fills the screen. */
          .pd-preview-drawer { width: 100% !important; top: 0 !important; }

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
          /* Grid instead of flex-column so the name and badge can share row 1 as two real
             columns (badge auto-sized + flush to the card's edge) — matches Figma exactly
             and, unlike fixed pixel offsets, never overlaps for long type names. */
          .pd-token-row {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 0.5rem 0.75rem !important;
            position: relative;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1rem !important;
            margin-bottom: 0.75rem;
          }
          /* Row 1: name (col 1, truncates) ── type badge (col 2, flush right — extreme end) */
          .pd-token-row > *:nth-child(1) {
            grid-column: 1; grid-row: 1;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            align-self: center;
          }
          .pd-token-row > *:nth-child(3) { grid-column: 2; grid-row: 1; justify-self: end; align-self: center; }

          /* Row 2: description, spans the full card width */
          .pd-token-row-desc { display: block !important; grid-column: 1 / -1; grid-row: 2; }

          /* Row 3: swatch + value (extreme left) ── Copy + ⋮ menu (extreme right) */
          .pd-token-row > *:nth-child(4) { grid-column: 1 / -1; grid-row: 3; }

          /* Row 4: the raw editable value — redundant for simple color tokens (already shown in row 3), kept for aliases/other types */
          .pd-token-row > *:nth-child(2) { grid-column: 1 / -1; grid-row: 4; }
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


          /* All-components list: 6 columns can't stay legible on a phone, so
             each row becomes a stacked card. Its header row is dropped — the
             labels mean nothing once the columns are stacked. */
          .pd-component-list-row {
            grid-template-columns: 20px 1fr auto !important;
            grid-template-areas: "check name tools" ". type props" ". preview preview" !important;
            row-gap: 0.5rem !important;
          }
          .pd-component-list-row > *:nth-child(1) { grid-area: check; }
          .pd-component-list-row > *:nth-child(2) { grid-area: name; }
          .pd-component-list-row > *:nth-child(3) { grid-area: type; }
          .pd-component-list-row > *:nth-child(4) { grid-area: preview; }
          .pd-component-list-row > *:nth-child(5) { grid-area: props; }
          .pd-component-list-row > *:nth-child(6) { grid-area: tools; }
          .pd-component-list-row-head { display: none !important; }
          /* Three icons crowd the card's top-right corner, so they collapse
             into a kebab menu here. Desktop keeps them inline in the column. */
          .pd-component-row-actions { display: none !important; }
          .pd-component-row-kebab { display: flex !important; }

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
  'animation-duration': 'Motion',

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
const normalizeTypeKey = (type) => (type || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

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

// Every CSS property a component can map, grouped exactly like the token
// sidebar. Derived from CATEGORY_GROUPS so the two never drift apart.
const CSS_PROPERTY_GROUPS = CATEGORY_GROUPS.map(g => ({
  display: g.display,
  properties: g.items.map(i => i.type),
}));

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
function TokenModal({ modal, onClose, onSave, activeTokens }) {
  const isEdit = modal.mode === 'edit';
  const [name, setName] = useState(isEdit ? modal.token.name : '');
  const [value, setValue] = useState(isEdit ? modal.token.value : '');
  const [type, setType] = useState(isEdit ? modal.token.type : getDefaultTypeForCategory(modal.category));
  const [layer, setLayer] = useState(isEdit ? (modal.token.layer || 'Brand') : (modal.defaultLayer || 'Brand'));

  const layerColor = layer === 'Brand' ? '#F59E0B' : layer === 'Semantic' ? '#3B82F6' : '#10B981';

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
        borderRadius: '16px', padding: '2rem', width: entryTab === 'upload' ? '640px' : '480px',
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
                <input
                  type="color"
                  value={value.startsWith('#') && value.length === 7 ? value : '#ffffff'}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                />
              )}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            marginTop: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
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
const humanizeCssProp = (prop) => prop
  .split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

/* ── Component Wizard dialog ── */
function ComponentModal({ onClose, onSave, activeTokens, componentToEdit, existingNames }) {
  const isEdit = !!componentToEdit;

  // Preset component templates
  const PRESET_COMPONENTS = [
    {
      id: 'custom',
      name: '',
      label: 'Custom Component (Blank)',
      category: 'Actions & Buttons',
      description: '',
      template: 'button',
      tokens: { bg: '', textColor: '', padding: '', borderRadius: '', fontFamily: '', fontSize: '' }
    },
    {
      id: 'primary-button',
      name: 'PrimaryButton',
      label: 'Primary Button',
      category: 'Actions & Buttons',
      description: 'Standard brand action button',
      template: 'button',
      tokens: {
        bg: ['button.bg', 'color.action', 'brand.color.primary'],
        textColor: ['button.text', 'color.text.primary', 'brand.color.text'],
        padding: ['button.padding', 'spacing.component', 'brand.spacing.base'],
        borderRadius: ['button.radius', 'radius.component', 'brand.radius.base'],
        fontFamily: ['brand.font.body', 'brand.font.heading'],
        fontSize: ['font.size.base', 'font.size.md']
      }
    },
    {
      id: 'secondary-button',
      name: 'SecondaryButton',
      label: 'Secondary Button',
      category: 'Actions & Buttons',
      description: 'Secondary action button for auxiliary choices',
      template: 'button',
      tokens: {
        bg: ['color.background.surface', 'brand.color.surface'],
        textColor: ['color.text.primary', 'brand.color.text'],
        padding: ['button.padding', 'spacing.component', 'brand.spacing.base'],
        borderRadius: ['button.radius', 'radius.component', 'brand.radius.base'],
        fontFamily: ['brand.font.body', 'brand.font.heading'],
        fontSize: ['font.size.base', 'font.size.md']
      }
    },
    {
      id: 'input-field',
      name: 'InputField',
      label: 'Text Input Field',
      category: 'Form Inputs',
      description: 'Standard text input field component',
      template: 'input',
      tokens: {
        bg: ['input.bg', 'color.background.surface', 'brand.color.surface'],
        textColor: ['input.text', 'color.text.primary', 'brand.color.text'],
        padding: ['button.padding', 'spacing.component', 'brand.spacing.base'],
        borderRadius: ['input.radius', 'radius.component', 'brand.radius.base'],
        fontFamily: ['brand.font.body', 'brand.font.heading'],
        fontSize: ['font.size.base', 'font.size.md']
      }
    },
    {
      id: 'brand-badge',
      name: 'BrandBadge',
      label: 'Status/Brand Badge',
      category: 'Feedback & Status',
      description: 'Decorative badge or label tag',
      template: 'badge',
      tokens: {
        bg: ['color.action', 'brand.color.accent'],
        textColor: ['color.text.primary', 'brand.color.text'],
        padding: ['button.padding', 'spacing.component', 'brand.spacing.base'],
        borderRadius: ['button.radius', 'radius.component', 'brand.radius.base'],
        fontFamily: ['brand.font.body', 'brand.font.heading'],
        fontSize: ['font.size.xs', 'font.size.sm']
      }
    },
    {
      id: 'info-card',
      name: 'InformationCard',
      label: 'Information Card',
      category: 'Display & Data',
      description: 'Card container block for structured content display',
      template: 'card',
      tokens: {
        bg: ['input.bg', 'color.background.surface', 'brand.color.surface'],
        textColor: ['color.text.primary', 'brand.color.text'],
        padding: ['button.padding', 'spacing.component', 'brand.spacing.base'],
        borderRadius: ['button.radius', 'radius.component', 'brand.radius.base'],
        fontFamily: ['brand.font.body', 'brand.font.heading'],
        fontSize: ['font.size.base', 'font.size.md']
      }
    }
  ];

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
  const getTokensForProperty = (cssProp) => {
    const category = getCategoryForType(cssProp);
    const list = activeTokens?.[category];
    return Array.isArray(list) ? list.map(t => t.name).filter(Boolean) : [];
  };

  const getInitialCategory = () => {
    if (!isEdit) return 'Actions & Buttons';
    let cat = componentToEdit.category;
    if (cat === 'Atom') {
      if (componentToEdit.template === 'button') return 'Actions & Buttons';
      else if (componentToEdit.template === 'input') return 'Form Inputs';
      else if (componentToEdit.template === 'badge') return 'Feedback & Status';
      else return 'Actions & Buttons';
    } else if (cat === 'Molecule') {
      if (componentToEdit.template === 'card') return 'Display & Data';
      else return 'Display & Data';
    } else if (cat === 'Organism') {
      return 'Navigation';
    }
    return cat || 'Actions & Buttons';
  };

  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [name, setName] = useState(isEdit ? componentToEdit.name : '');
  const [description, setDescription] = useState(isEdit ? componentToEdit.description : '');
  const [category, setCategory] = useState(getInitialCategory());
  const [template, setTemplate] = useState(isEdit ? componentToEdit.template : 'button');

  // Token mappings — one row per mapped CSS property. A row's `key` is either
  // a legacy storage key or a raw CSS property name; `cssPropForTokenKey`
  // resolves either to the property shown in the table. Edit mode lists every
  // property already saved on the component (so free-form ones round-trip),
  // while add mode starts from the familiar six.
  const [tokenRows, setTokenRows] = useState(() => {
    if (isEdit) {
      return Object.entries(componentToEdit.tokens || {})
        .filter(([, value]) => value)
        .map(([key, value]) => ({ key, value }));
    }
    return DEFAULT_COMPONENT_PROPERTY_KEYS.map(key => ({ key, value: '' }));
  });
  const [checkedRowKeys, setCheckedRowKeys] = useState(() => new Set());

  const updateRowValue = (key, value) => setTokenRows(rows => rows.map(r => (r.key === key ? { ...r, value } : r)));
  const addRow = (key) => setTokenRows(rows => [...rows, { key, value: '' }]);

  // Repointing a row at a different CSS property: the row's storage key
  // becomes that property name, and the mapped token is cleared unless it's
  // still valid for the new property's token category.
  const changeRowProperty = (oldKey, newCssProp) => setTokenRows(rows => {
    if (rows.some(r => r.key !== oldKey && cssPropForTokenKey(r.key) === newCssProp)) return rows;
    return rows.map(r => {
      if (r.key !== oldKey) return r;
      const stillValid = getTokensForProperty(newCssProp).includes(r.value);
      return { key: newCssProp, value: stillValid ? r.value : '' };
    });
  });
  const removeRow = (key) => {
    setTokenRows(rows => rows.filter(r => r.key !== key));
    setCheckedRowKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
  };
  const toggleRowChecked = (key) => setCheckedRowKeys(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const allRowsChecked = tokenRows.length > 0 && tokenRows.every(r => checkedRowKeys.has(r.key));
  const toggleAllRowsChecked = () => setCheckedRowKeys(allRowsChecked ? new Set() : new Set(tokenRows.map(r => r.key)));
  const removeCheckedRows = () => {
    setTokenRows(rows => rows.filter(r => !checkedRowKeys.has(r.key)));
    setCheckedRowKeys(new Set());
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = PRESET_COMPONENTS.find(p => p.id === presetId);
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      setCategory(preset.category);
      setTemplate(preset.template);
      if (preset.id === 'custom') {
        setTokenRows(DEFAULT_COMPONENT_PROPERTY_KEYS.map(key => ({ key, value: '' })));
      } else {
        setTokenRows(DEFAULT_COMPONENT_PROPERTY_KEYS.map(key => ({
          key,
          value: findToken(getDefaultTypeForCategory(getCategoryForType(cssPropForTokenKey(key))), preset.tokens[key] || []),
        })));
      }
      setCheckedRowKeys(new Set());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a component name');
      return;
    }
    const tokens = {};
    tokenRows.forEach(r => { tokens[r.key] = r.value; });
    onSave({
      name: name.trim(),
      description: description.trim() || 'Custom component',
      category,
      template,
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
          category: 'Actions & Buttons',
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
        borderRadius: '16px', padding: '2rem', width: '600px',
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
          {!isEdit && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Choose Preset Template</label>
              <select
                className="form-input"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                style={{ cursor: 'pointer', borderColor: 'var(--accent)' }}
              >
                {PRESET_COMPONENTS.map(p => (
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
              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Actions & Buttons">Actions & Buttons</option>
                <option value="Form Inputs">Form Inputs</option>
                <option value="Display & Data">Display & Data</option>
                <option value="Feedback & Status">Feedback & Status</option>
                <option value="Navigation">Navigation</option>
                <option value="Overlays">Overlays</option>
                <option value="Layout Primitives">Layout Primitives</option>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token Mappings</h4>
              {checkedRowKeys.size > 0 && (
                <button
                  type="button"
                  onClick={removeCheckedRows}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  Remove {checkedRowKeys.size} selected
                </button>
              )}
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '24px 1.1fr 1fr 1.3fr 56px', gap: '0.5rem', alignItems: 'center',
                padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderBottom: tokenRows.length ? '1px solid var(--border)' : 'none',
              }}>
                <input
                  type="checkbox"
                  checked={allRowsChecked}
                  onChange={toggleAllRowsChecked}
                  disabled={!tokenRows.length}
                  style={{ accentColor: 'var(--accent)', cursor: tokenRows.length ? 'pointer' : 'default', width: '14px', height: '14px' }}
                />
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>Property</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>Name</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>Value</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.03em', textAlign: 'right' }}>Tools</span>
              </div>

              {tokenRows.length === 0 && (
                <div style={{ padding: '1rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  No properties mapped yet — add one below.
                </div>
              )}

              {tokenRows.map((row, i) => {
                const cssProp = cssPropForTokenKey(row.key);
                const tokenOptions = getTokensForProperty(cssProp);
                const usedProps = tokenRows.map(r => cssPropForTokenKey(r.key));
                return (
                  <div
                    key={row.key}
                    style={{
                      display: 'grid', gridTemplateColumns: '24px 1.1fr 1fr 1.3fr 56px', gap: '0.5rem', alignItems: 'center',
                      padding: '0.5rem 0.75rem', borderBottom: i < tokenRows.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedRowKeys.has(row.key)}
                      onChange={() => toggleRowChecked(row.key)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: '14px', height: '14px' }}
                    />
                    <select
                      value={cssProp}
                      onChange={(e) => changeRowProperty(row.key, e.target.value)}
                      title="CSS property this row maps"
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-primary)',
                        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px',
                        padding: '0.25rem 0.3rem', maxWidth: '100%', cursor: 'pointer',
                      }}
                    >
                      {CSS_PROPERTY_GROUPS.map(group => (
                        <optgroup key={group.display} label={group.display}>
                          {group.properties.map(p => (
                            <option key={p} value={p} disabled={p !== cssProp && usedProps.includes(p)}>{p}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {humanizeCssProp(cssProp)}
                    </span>
                    <select
                      className="form-input"
                      value={row.value}
                      onChange={(e) => updateRowValue(row.key, e.target.value)}
                      title={tokenOptions.length ? undefined : `No ${getCategoryForType(cssProp)} tokens defined yet`}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.4rem' }}
                    >
                      <option value="">
                        {tokenOptions.length ? '-- None --' : `No ${getCategoryForType(cssProp)} tokens yet`}
                      </option>
                      {tokenOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <span
                        title={row.value ? `Linked to ${row.value}` : 'Not linked to a token yet'}
                        style={{ color: row.value ? 'var(--accent)' : 'var(--text-tertiary)', opacity: row.value ? 1 : 0.4, display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        title="Remove property"
                        style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const usedProps = new Set(tokenRows.map(r => cssPropForTokenKey(r.key)));
              const groups = CSS_PROPERTY_GROUPS
                .map(g => ({ ...g, properties: g.properties.filter(p => !usedProps.has(p)) }))
                .filter(g => g.properties.length > 0);
              if (!groups.length) return null;
              return (
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) addRow(e.target.value); }}
                  className="form-input"
                  style={{ marginTop: '0.75rem', fontSize: '0.78rem', maxWidth: '260px', cursor: 'pointer' }}
                >
                  <option value="">+ Add token property…</option>
                  {groups.map(g => (
                    <optgroup key={g.display} label={g.display}>
                      {g.properties.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  ))}
                </select>
              );
            })()}
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
                          <div>
                            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.2rem' }}>Category</label>
                            <select
                              className="form-input"
                              value={row.category}
                              onChange={(e) => updateUploadRow(i, { category: e.target.value })}
                              disabled={!row.checked}
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                            >
                              <option value="Actions & Buttons">Actions & Buttons</option>
                              <option value="Form Inputs">Form Inputs</option>
                              <option value="Display & Data">Display & Data</option>
                              <option value="Feedback & Status">Feedback & Status</option>
                              <option value="Navigation">Navigation</option>
                              <option value="Overlays">Overlays</option>
                              <option value="Layout Primitives">Layout Primitives</option>
                            </select>
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

