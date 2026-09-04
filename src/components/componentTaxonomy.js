// The component taxonomy: five categories, each holding component types.
//
// This is the single source of truth. Every category/type list, every
// template↔category mapping and every folder in the Components table derives
// from the array below, so the app can never disagree with itself about where
// a component belongs.
//
// Each type owns exactly one `template`, and a template is what the preview
// renderer draws (see componentPreviews.jsx). That 1:1 relationship is what
// lets a component's category and type be *derived* from the `template` it
// already stores — no new field, and no migration of saved projects.

export const COMPONENT_TAXONOMY = [
  {
    category: 'Actions & Triggers',
    types: [
      { type: 'Buttons', template: 'button', desc: 'Standard, icon, and split actions.' },
      { type: 'Dropdowns & Menus', template: 'dropdown', desc: 'Contextual list overlays triggered by user interaction.' },
      { type: 'Tooltips', template: 'tooltip', desc: 'Small context boxes appearing on hover or focus.' },
    ],
  },
  {
    category: 'Forms & Inputs',
    types: [
      { type: 'Text Inputs', template: 'input', desc: 'Text fields, textareas, and password entries.' },
      { type: 'Selection Controls', template: 'selection', desc: 'Checkboxes, radio buttons, toggles, and switches.' },
      { type: 'Advanced Selectors', template: 'selector', desc: 'Color pickers, date/time pickers, and file upload zones.' },
    ],
  },
  {
    category: 'Layout & Containers',
    types: [
      { type: 'Accordions', template: 'accordion', desc: 'Vertically stacked, expandable content panels.' },
      { type: 'Cards', template: 'card', desc: 'Visual blocks enclosing structured content and media actions.' },
      { type: 'Tabs', template: 'tabs', desc: 'Tabbed navigation panels separating view content.' },
      { type: 'Modals & Dialogs', template: 'modal', desc: 'Overlay windows requiring immediate attention.' },
      // Not a kind of UI but a way of composing it: a fragment holds other components.
      { type: 'Fragments', template: 'fragment', desc: 'A container that groups related components together.' },
    ],
  },
  {
    category: 'Data Display & Visualization',
    types: [
      { type: 'Grids & Tables', template: 'table', desc: 'Sortable, filterable tabular data containers.' },
      { type: 'Badges & Tags', template: 'badge', desc: 'Status indicators and category labels.' },
      { type: 'Charts', template: 'chart', desc: 'Line, bar, pie, and doughnut charts.' },
      // Not part of the reference taxonomy. The Upload Image tab creates
      // components with template 'image', and without a type they would
      // orphan into an "Uncategorised" folder.
      { type: 'Images & Avatars', template: 'image', desc: 'Uploaded imagery and entity avatars.' },
    ],
  },
  {
    category: 'Navigation',
    types: [
      { type: 'Breadcrumbs', template: 'breadcrumb', desc: 'Hierarchical paths indicating page location.' },
      { type: 'Pagination', template: 'pagination', desc: 'Navigation steps across multi-page content blocks.' },
      { type: 'Nav Bars / Drawers', template: 'navbar', desc: 'Side sheets or top banners holding global application paths.' },
    ],
  },
];

/* ── Derived lookups. Built from the array above so they cannot drift. ── */

export const CATEGORY_LIST = COMPONENT_TAXONOMY.map(c => c.category);

const ALL_TYPES = COMPONENT_TAXONOMY.flatMap(c =>
  c.types.map(t => ({ ...t, category: c.category }))
);

export const TEMPLATE_TO_TYPE = Object.fromEntries(ALL_TYPES.map(t => [t.template, t.type]));
export const TEMPLATE_TO_CATEGORY = Object.fromEntries(ALL_TYPES.map(t => [t.template, t.category]));
export const TYPE_TO_TEMPLATE = Object.fromEntries(ALL_TYPES.map(t => [t.type, t.template]));
export const TYPE_TO_CATEGORY = Object.fromEntries(ALL_TYPES.map(t => [t.type, t.category]));
export const TYPE_DESCRIPTIONS = Object.fromEntries(ALL_TYPES.map(t => [t.type, t.desc]));

export const TYPES_FOR_CATEGORY = (category) =>
  (COMPONENT_TAXONOMY.find(c => c.category === category)?.types || []).map(t => t.type);

// Every template the preview renderer knows how to draw.
export const KNOWN_TEMPLATES = ALL_TYPES.map(t => t.template);

// Categories used before the taxonomy landed, plus the names the Brand Context
// Engine and the old atomic-design wizard produced. Only consulted when a
// component's template is unrecognised — template is the more reliable signal.
export const LEGACY_CATEGORY_ALIAS = {
  'Actions & Buttons': 'Actions & Triggers',
  'Form Inputs': 'Forms & Inputs',
  'Display & Data': 'Layout & Containers',
  'Feedback & Status': 'Data Display & Visualization',
  'Inputs & Forms': 'Forms & Inputs',
  'Navigation & Layout': 'Navigation',
  'Data Display': 'Data Display & Visualization',
  'Feedback & Overlays': 'Data Display & Visualization',
  Atom: 'Actions & Triggers',
  Molecule: 'Layout & Containers',
  Organism: 'Navigation',
};

/**
 * Which category a component belongs to. Derived from its template first —
 * that is what the preview actually draws, so it is the honest answer — and
 * only falls back to the stored category (aliased) when the template is one
 * this build does not know.
 */
export const categoryForComponent = (comp) =>
  TEMPLATE_TO_CATEGORY[comp?.template] ||
  LEGACY_CATEGORY_ALIAS[comp?.category] ||
  comp?.category ||
  'Uncategorised';

/** Which type within that category. Same derivation, same reasoning. */
export const typeForComponent = (comp) =>
  TEMPLATE_TO_TYPE[comp?.template] || comp?.type || 'Other';

/**
 * The category/type folders to render for a set of components: the full
 * taxonomy first, then any group the components actually use that the
 * taxonomy does not list. A stray category can never orphan a component.
 */
export const componentFoldersFor = (comps) => {
  const folders = COMPONENT_TAXONOMY.map(c => ({ category: c.category, types: c.types.map(t => t.type) }));
  const byCategory = new Map(folders.map(f => [f.category, f]));

  for (const comp of comps || []) {
    const category = categoryForComponent(comp);
    const type = typeForComponent(comp);
    let folder = byCategory.get(category);
    if (!folder) {
      folder = { category, types: [] };
      byCategory.set(category, folder);
      folders.push(folder);
    }
    if (!folder.types.includes(type)) folder.types.push(type);
  }
  return folders;
};
