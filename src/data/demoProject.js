// A worked example project, so the app can be seen populated rather than empty.
//
// Unlike a project the user creates — which deliberately starts with no tokens —
// this one ships the full layered token set AND components whose properties are
// already mapped onto it, so every preview renders in the brand's own styling.
//
// Every token name referenced below exists in MOCK_TOKENS; `demoProjectIssues()`
// checks that, and the tests call it so a typo here cannot ship silently.

import { MOCK_TOKENS } from './designSystemSeed.js';

// Component property keys are the legacy short names the editor still stores:
// bg → background-color, textColor → color, and so on.
const BTN = {
  padding: 'button.padding-x',
  borderRadius: 'button.radius',
  fontFamily: 'button.font-family',
  fontSize: 'button.font-size',
};
const FIELD = {
  padding: 'input.padding',
  borderRadius: 'input.radius',
  fontFamily: 'text.body',
  fontSize: 'text.size.ui',
};
const PANEL = {
  padding: 'space.comfortable',
  borderRadius: 'card.radius',
  fontFamily: 'text.body',
  fontSize: 'text.size.ui',
};

const DEMO_COMPONENTS = [
  // Actions & Triggers
  { name: 'PrimaryButton', type: 'Buttons', template: 'button', description: 'Main call to action',
    tokens: { bg: 'button.bg', textColor: 'button.text', ...BTN } },
  { name: 'SecondaryButton', type: 'Buttons', template: 'button', description: 'Supporting action',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', ...BTN } },
  { name: 'GhostButton', type: 'Buttons', template: 'button', description: 'Low-emphasis action',
    tokens: { textColor: 'color.action', ...BTN } },
  { name: 'DestructiveButton', type: 'Buttons', template: 'button', description: 'Irreversible action',
    tokens: { bg: 'color.feedback.danger', textColor: 'color.text.primary', ...BTN } },
  { name: 'DropdownMenu', type: 'Dropdowns & Menus', template: 'dropdown', description: 'Menu opened from a trigger',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', ...PANEL } },
  { name: 'Tooltip', type: 'Tooltips', template: 'tooltip', description: 'Short helper text on hover',
    tokens: { bg: 'brand.color.secondary', textColor: 'color.text.primary', padding: 'space.tight', borderRadius: 'brand.radius.sm', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },

  // Forms & Inputs
  { name: 'TextInput', type: 'Text Inputs', template: 'input', description: 'Single-line text field',
    tokens: { bg: 'input.bg', textColor: 'input.text', ...FIELD } },
  { name: 'EmailInput', type: 'Text Inputs', template: 'input', description: 'Email address field',
    tokens: { bg: 'input.bg', textColor: 'input.text', ...FIELD } },
  { name: 'PasswordInput', type: 'Text Inputs', template: 'input', description: 'Masked credential field',
    tokens: { bg: 'input.bg', textColor: 'input.text', ...FIELD } },
  { name: 'ToggleSwitch', type: 'Selection Controls', template: 'selection', description: 'On-off state switch',
    tokens: { bg: 'color.action', textColor: 'color.text.primary', borderRadius: 'brand.radius.full', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },
  { name: 'DatePicker', type: 'Advanced Selectors', template: 'selector', description: 'Date selector field',
    tokens: { bg: 'color.action', textColor: 'color.text.primary', borderRadius: 'input.radius', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },

  // Layout & Containers
  { name: 'InformationCard', type: 'Cards', template: 'card', description: 'Content container',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', ...PANEL } },
  { name: 'Accordion', type: 'Accordions', template: 'accordion', description: 'Expandable content panels',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', borderRadius: 'card.radius', fontFamily: 'text.body', fontSize: 'text.size.ui' } },
  { name: 'TabBar', type: 'Tabs', template: 'tabs', description: 'Switcher between panels',
    tokens: { bg: 'color.action', textColor: 'color.text.primary', fontFamily: 'text.heading', fontSize: 'text.size.ui' } },
  { name: 'ModalDialog', type: 'Modals & Dialogs', template: 'modal', description: 'Overlay for a focused task',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', padding: 'space.comfortable', borderRadius: 'card.radius', fontFamily: 'text.body', fontSize: 'text.size.ui' } },

  // Data Display & Visualization
  { name: 'DataTable', type: 'Grids & Tables', template: 'table', description: 'Sortable rows of data',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', borderRadius: 'card.radius', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },
  { name: 'StatusBadge', type: 'Badges & Tags', template: 'badge', description: 'Compact status indicator',
    tokens: { bg: 'color.feedback.success', textColor: 'color.text.primary', padding: 'space.tight', borderRadius: 'brand.radius.full', fontFamily: 'text.heading', fontSize: 'brand.font.size.xs' } },
  { name: 'RevenueChart', type: 'Charts', template: 'chart', description: 'Monthly revenue trend',
    tokens: { bg: 'color.action', textColor: 'color.text.primary', borderRadius: 'card.radius', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },
  { name: 'Avatar', type: 'Images & Avatars', template: 'image', description: 'Circular user representation',
    tokens: { bg: 'brand.color.accent', textColor: 'color.text.primary', borderRadius: 'brand.radius.full', fontFamily: 'text.heading', fontSize: 'text.size.ui' } },

  // Navigation
  { name: 'Breadcrumbs', type: 'Breadcrumbs', template: 'breadcrumb', description: 'Path to the current page',
    tokens: { textColor: 'color.text.secondary', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },
  { name: 'Pagination', type: 'Pagination', template: 'pagination', description: 'Steps across pages',
    tokens: { bg: 'color.action', textColor: 'color.text.primary', borderRadius: 'brand.radius.sm', fontFamily: 'text.body', fontSize: 'brand.font.size.xs' } },
  { name: 'NavBar', type: 'Nav Bars / Drawers', template: 'navbar', description: 'Top-level navigation',
    tokens: { bg: 'color.bg.surface', textColor: 'color.text.primary', padding: 'space.tight', borderRadius: 'card.radius', fontFamily: 'text.heading', fontSize: 'text.size.ui' } },
];

// A couple of extra semantic colours the components above reference for state.
const FEEDBACK_COLORS = [
  { name: 'color.feedback.success', value: '#10B981', type: 'color', layer: 'Semantic', description: 'Positive or complete state' },
  { name: 'color.feedback.warning', value: '#F59E0B', type: 'color', layer: 'Semantic', description: 'Needs attention' },
  { name: 'color.feedback.danger', value: '#EF4444', type: 'color', layer: 'Semantic', description: 'Destructive or failed state' },
];

export const demoTokens = () => ({
  ...MOCK_TOKENS,
  Color: [...MOCK_TOKENS.Color, ...FEEDBACK_COLORS],
});

export const DEMO_PROJECT_ID = 'demo-design-system';

export const buildDemoProject = () => {
  const tokens = demoTokens();
  return {
    id: DEMO_PROJECT_ID,
    name: 'Strata Demo',
    description: 'A worked example: layered tokens with components already mapped to them.',
    color: '#FC0694',
    status: 'Active',
    isDemo: true,
    updated: 'Just now',
    formats: '3 formats',
    websiteUrl: '',
    figmaUrl: '',
    brand: {
      primaryColor: '#FC0694',
      secondaryColor: '#1A1A24',
      accentColor: '#3B82F6',
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      toneKeywords: ['Bold', 'Precise', 'Modern'],
      manifesto: '## Strata Demo\n\nA sample design system showing how brand tokens flow through to components. Every component below maps to the same token set, so changing a brand colour updates all of them at once.',
    },
    tokens,
    components: DEMO_COMPONENTS.map((c, i) => ({
      id: 'demo-' + i,
      ...c,
      isPreset: false,
    })),
    members: [],
  };
};

/**
 * Every token name the demo components reference, paired with whether the demo
 * token set actually defines it. Used by the tests — a mapping pointing at a
 * token that does not exist would render as an unstyled preview, which is
 * exactly what this demo is meant to disprove.
 */
export const demoProjectIssues = () => {
  const tokens = demoTokens();
  const defined = new Set(
    Object.values(tokens).flat().map(t => t && t.name).filter(Boolean)
  );
  const issues = [];
  for (const comp of DEMO_COMPONENTS) {
    for (const [key, name] of Object.entries(comp.tokens || {})) {
      if (name && !defined.has(name)) issues.push(comp.name + '.' + key + ' -> ' + name);
    }
  }
  return issues;
};
