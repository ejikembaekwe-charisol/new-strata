import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';

// Which projects the user has open as workspace tabs, and where they were inside each one.
//
// Only ever one ProjectDetail is mounted — tabs navigate rather than keeping instances alive —
// so `sections` is what makes returning to a tab feel continuous.

const KEY = 'strata_open_tabs';

const TabsContext = createContext(null);

const readStore = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('Could not read the open-tabs store', e);
    return {};
  }
};

const writeStore = (store) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Could not write the open-tabs store', e);
  }
};

const ownerOf = (user) => user?.email || '';

export const TabsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { projects, isLoaded } = useProjects();
  const owner = ownerOf(user);

  // { ids, sections, sidebarCollapsed, opened: { [projectId]: iso } }
  const [state, setState] = useState({ ids: [], sections: {}, sidebarCollapsed: false, opened: {} });
  // False until the load effect below has run. Consumers must not write until it is true.
  const [hydrated, setHydrated] = useState(false);

  // Load this account's tabs, and reload when the account changes so two users never share a set
  useEffect(() => {
    // AuthContext hydrates in its own effect, so `owner` is '' on the first render. Loading
    // then would read the wrong key and report hydrated before the real data exists — which
    // consumers use as their cue to restore, so they would restore from nothing.
    if (authLoading) return;
    const forOwner = readStore()[owner];
    setState({
      ids: Array.isArray(forOwner?.ids) ? forOwner.ids.map(String) : [],
      sections: forOwner?.sections && typeof forOwner.sections === 'object' ? forOwner.sections : {},
      sidebarCollapsed: !!forOwner?.sidebarCollapsed,
      opened: forOwner?.opened && typeof forOwner.opened === 'object' ? forOwner.opened : {},
    });
    setHydrated(true);
  }, [owner, authLoading]);

  const persist = useCallback((next) => {
    setState(next);
    const store = readStore();
    store[owner] = next;
    writeStore(store);
  }, [owner, hydrated]);

  // Persisted ids outlive the projects they point at — the list page can delete one — so resolve
  // against the live project list and drop anything that no longer exists.
  const openTabs = useMemo(() => {
    if (!isLoaded) return [];
    const byId = new Map(projects.map(p => [String(p.id), p]));
    return state.ids.map(id => byId.get(String(id))).filter(Boolean);
  }, [state.ids, projects, isLoaded]);

  // Write the pruned set back once the projects have loaded, so dead ids do not linger in storage
  useEffect(() => {
    if (!isLoaded) return;
    const live = new Set(projects.map(p => String(p.id)));
    const kept = state.ids.filter(id => live.has(String(id)));
    if (kept.length === state.ids.length) return;
    const sections = {};
    for (const id of kept) if (state.sections[id] !== undefined) sections[id] = state.sections[id];
    persist({ ...state, ids: kept, sections });
  }, [isLoaded, projects, state.ids, state.sections, persist]);

  const openTab = useCallback((id) => {
    const key = String(id);
    if (!key || !hydrated) return;   // see the note above the writers
    setState(prev => {
      if (prev.ids.includes(key)) return prev;
      const next = { ...prev, ids: [...prev.ids, key] };
      const store = readStore();
      store[owner] = next;
      writeStore(store);
      return next;
    });
  }, [owner, hydrated]);

  const closeTab = useCallback((id) => {
    const key = String(id);
    if (!hydrated) return;
    setState(prev => {
      const ids = prev.ids.filter(x => x !== key);
      const sections = { ...prev.sections };
      delete sections[key];
      // spread prev so preferences like sidebarCollapsed survive a tab close
      const next = { ...prev, ids, sections };
      const store = readStore();
      store[owner] = next;
      writeStore(store);
      return next;
    });
  }, [owner, hydrated]);

  const sectionFor = useCallback((id) => state.sections[String(id)] || null, [state.sections]);

  const setSection = useCallback((id, sectionId) => {
    const key = String(id);
    if (!key || !sectionId || !hydrated) return;
    setState(prev => {
      if (prev.sections[key] === sectionId) return prev;
      const next = { ...prev, sections: { ...prev.sections, [key]: sectionId } };
      const store = readStore();
      store[owner] = next;
      writeStore(store);
      return next;
    });
  }, [owner, hydrated]);

  // `project.updated` is a display string, so recency has to be recorded rather than derived.
  const markOpened = useCallback((id) => {
    const key = String(id);
    if (!key || !hydrated) return;
    setState(prev => {
      const next = { ...prev, opened: { ...prev.opened, [key]: new Date().toISOString() } };
      const store = readStore();
      store[owner] = next;
      writeStore(store);
      return next;
    });
  }, [owner, hydrated]);

  // Projects opened before, most recent first, excluding whatever is already a tab. Only
  // projects with a recorded open time appear — nothing is presented as recent on a guess.
  const recentProjects = useMemo(() => {
    if (!isLoaded) return [];
    const open = new Set(state.ids.map(String));
    return projects
      .filter(p => !open.has(String(p.id)) && state.opened[String(p.id)])
      .sort((a, b) => String(state.opened[String(b.id)]).localeCompare(String(state.opened[String(a.id)])));
  }, [projects, isLoaded, state.ids, state.opened]);

  // A workspace preference rather than a per-project one, so it applies to every project
  const setSidebarCollapsed = useCallback((value) => {
    if (!hydrated) return;
    setState(prev => {
      const next = { ...prev, sidebarCollapsed: !!value };
      const store = readStore();
      store[owner] = next;
      writeStore(store);
      return next;
    });
  }, [owner, hydrated]);

  /** The tab to land on after closing `id`: left neighbour, else right, else null. */
  const neighbourOf = useCallback((id) => {
    const key = String(id);
    const i = openTabs.findIndex(p => String(p.id) === key);
    if (i < 0) return null;
    return openTabs[i - 1] || openTabs[i + 1] || null;
  }, [openTabs]);

  return (
    <TabsContext.Provider value={{
      hydrated,
      openTabs, openTab, closeTab, sectionFor, setSection, neighbourOf,
      markOpened, recentProjects,
      sidebarCollapsed: state.sidebarCollapsed, setSidebarCollapsed,
    }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = () => useContext(TabsContext);
