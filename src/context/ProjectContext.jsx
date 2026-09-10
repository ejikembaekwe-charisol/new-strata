import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildDemoProject, DEMO_PROJECT_ID } from '../data/demoProject';

const ProjectContext = createContext();

// Demo components a new project opens with, weighted to buttons and inputs so those
// folders are not one row deep. Note this is the opposite of how tokens behave — a new
// project has no tokens at all — and it is deliberate: the components table is meant to
// show something on first open.
//
// Every template here is one the preview renderer can actually draw (button | input |
// card | badge | image); nothing claims a template that does not exist.
// Demo content a new project starts with. Spread across the taxonomy so several
// categories open with something in them rather than only buttons and inputs.
// `category`/`type` are written for readability; the Components tree derives both
// from `template`, which is what the preview actually draws.
const DEMO_COMPONENTS = [
  { name: 'PrimaryButton', category: 'Actions & Triggers', type: 'Buttons', template: 'button', description: 'Main call to action' },
  { name: 'SecondaryButton', category: 'Actions & Triggers', type: 'Buttons', template: 'button', description: 'Supporting action' },
  { name: 'GhostButton', category: 'Actions & Triggers', type: 'Buttons', template: 'button', description: 'Low-emphasis action' },
  { name: 'OutlineButton', category: 'Actions & Triggers', type: 'Buttons', template: 'button', description: 'Bordered secondary action' },
  { name: 'DropdownMenu', category: 'Actions & Triggers', type: 'Dropdowns & Menus', template: 'dropdown', description: 'Menu opened from a trigger' },
  { name: 'SelectDropdown', category: 'Actions & Triggers', type: 'Dropdowns & Menus', template: 'dropdown', description: 'Single choice from a list' },
  { name: 'ContextMenu', category: 'Actions & Triggers', type: 'Dropdowns & Menus', template: 'dropdown', description: 'Actions for the selected item' },
  { name: 'Tooltip', category: 'Actions & Triggers', type: 'Tooltips', template: 'tooltip', description: 'Short helper text on hover' },
  { name: 'InfoTooltip', category: 'Actions & Triggers', type: 'Tooltips', template: 'tooltip', description: 'Explains a label or field' },
  { name: 'TextInput', category: 'Forms & Inputs', type: 'Text Inputs', template: 'input', description: 'Single-line text field' },
  { name: 'EmailInput', category: 'Forms & Inputs', type: 'Text Inputs', template: 'input', description: 'Email address field' },
  { name: 'PasswordInput', category: 'Forms & Inputs', type: 'Text Inputs', template: 'input', description: 'Masked credential field' },
  { name: 'ToggleSwitch', category: 'Forms & Inputs', type: 'Selection Controls', template: 'selection', description: 'On-off state switch' },
  { name: 'InformationCard', category: 'Layout & Containers', type: 'Cards', template: 'card', description: 'Content container' },
  { name: 'TabBar', category: 'Layout & Containers', type: 'Tabs', template: 'tabs', description: 'Switcher between panels' },
  { name: 'ModalDialog', category: 'Layout & Containers', type: 'Modals & Dialogs', template: 'modal', description: 'Overlay for a focused task' },
  { name: 'DataTable', category: 'Data Display & Visualization', type: 'Grids & Tables', template: 'table', description: 'Sortable rows of data' },
  { name: 'StatusBadge', category: 'Data Display & Visualization', type: 'Badges & Tags', template: 'badge', description: 'Compact status indicator' },
  { name: 'NavBar', category: 'Navigation', type: 'Nav Bars / Drawers', template: 'navbar', description: 'Top-level navigation' },
];

const demoComponents = () => DEMO_COMPONENTS.map((c, i) => ({
  id: 'demo-' + i + '-' + Date.now().toString(36),
  ...c,
  tokens: {},
}));

export const useProjects = () => useContext(ProjectContext);

// A new project starts with no tokens at all — the user imports them or adds their own.
// Every type key must be present as an array: ProjectDetail's migrateTokensToLayers only
// treats a token map as "already migrated" when it finds type keys holding arrays, and
// otherwise falls back to seeding MOCK_TOKENS. An all-empty map keeps the project empty.
const EMPTY_TOKENS = {
  Color: [],
  Typography: [],
  Spacing: [],
  Sizing: [],
  Layout: [],
  Flexbox: [],
  Lists: [],
  Border: [],
  Shadow: [],
  Motion: [],
};

// Set once the demo project has been offered. Kept separate from the project list so
// deleting the demo sticks — a user who removes it should not find it back next visit.
const DEMO_SEEDED_KEY = 'strata_demo_seeded';

/**
 * Writes the project list, returning the error rather than throwing it.
 *
 * @returns {null | { full: boolean, message: string }} null when the write succeeded.
 */
const writeProjects = (list) => {
  try {
    localStorage.setItem('strata_projects', JSON.stringify(list));
    return null;
  } catch (e) {
    const full = Boolean(e) && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      full,
      message: full
        ? 'There is no room left in this browser to save this. Deleting a project, or an older '
          + 'release, will free some up.'
        : 'This browser refused to save the change.',
    };
  }
};

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    let saved = [];
    try {
      const raw = localStorage.getItem('strata_projects');
      saved = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse projects from localStorage', e);
      saved = [];
    }
    // First run only: open with a worked example rather than an empty screen.
    try {
      if (!localStorage.getItem(DEMO_SEEDED_KEY)) {
        localStorage.setItem(DEMO_SEEDED_KEY, '1');
        if (!saved.some(p => String(p.id) === DEMO_PROJECT_ID)) {
          return [...saved, buildDemoProject()];
        }
      }
    } catch (e) {
      // storage unavailable (private mode) — just skip the demo
    }

    // The demo was seeded with no team before it shipped one. Backfilling it here is what
    // lets an existing install see the Collaboration page populated, rather than only
    // whoever installs next. Scoped to the demo and to an empty list, so a real project is
    // never touched — the trade is that emptying the demo's team refills it on next load.
    try {
      const demoIndex = saved.findIndex(p => String(p.id) === DEMO_PROJECT_ID);
      if (demoIndex !== -1 && !(saved[demoIndex].members || []).length) {
        const withTeam = saved.slice();
        withTeam[demoIndex] = { ...withTeam[demoIndex], members: buildDemoProject().members };
        return withTeam;
      }
    } catch {
      // a malformed demo entry is not worth failing the whole app over
    }

    return saved;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Every read in this file was already guarded; this write was not, so a browser out of
    // room threw here and the save was lost with nothing said. It matters more now that
    // publishing stores design snapshots, and a project whose components carry uploaded
    // images as data URLs can be large against a few megabytes for everything.
    //
    // This is the background safety net and it only logs. A user doing something deliberate
    // deserves to be told to their face instead, so `saveNow` below reports back and the
    // publish path uses it.
    const err = writeProjects(projects);
    if (err) console.error('Failed to persist projects', err);
  }, [projects]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const addProject = (projectData) => {
    const newId = String(Date.now());
    const newProject = {
      id: newId,
      name: projectData.title,
      description: projectData.description,
      color: projectData.color,
      status: 'Active',
      websiteUrl: projectData.websiteUrl || '',
      figmaUrl: projectData.figmaUrl || '',
      updated: 'Just now',
      formats: '0 formats',
      brand: {
        ...projectData.brand,
        toneKeywords: projectData.brand?.toneKeywords || [],
      },
      tokens: projectData.tokens || EMPTY_TOKENS,
      // A caller that brings its own components (the create wizard's engine path) wins;
      // otherwise the project opens with the demo set.
      components: projectData.components?.length ? projectData.components : demoComponents(),
      members: projectData.members || [],
      branchOf: projectData.branchOf,
      branchName: projectData.branchName,
      // Who forked it and when, so a branch list can say. Absent on branches made before
      // this existed, so every reader has to cope without them.
      branchedAt: projectData.branchedAt,
      branchAuthor: projectData.branchAuthor,
      // Published releases, newest first. Empty until someone publishes — an unpublished
      // project must never look as though it has shipped something.
      releases: [],
      liveReleaseId: null,
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id, updates) => {
    setProjects(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...updates } : p));
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => String(p.id) !== String(id)));
  };

  /**
   * Applies `updates` to a project and writes immediately, reporting whether it stuck.
   *
   * The effect above also persists, but it cannot tell anyone when it fails. Publishing is
   * deliberate and irreversible-feeling, so it goes through here and gets an answer.
   */
  const updateProjectNow = (id, updates) => {
    const next = projects.map(p => (String(p.id) === String(id) ? { ...p, ...updates } : p));
    const err = writeProjects(next);
    if (!err) setProjects(next);
    return err;
  };

  return (
    <ProjectContext.Provider value={{
      projects, isLoaded, addProject, updateProject, updateProjectNow, deleteProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
