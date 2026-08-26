import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

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

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('strata_projects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse projects from localStorage', e);
      return [];
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('strata_projects', JSON.stringify(projects));
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
      components: projectData.components || [],
      members: projectData.members || [],
      branchOf: projectData.branchOf,
      branchName: projectData.branchName,
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

  return (
    <ProjectContext.Provider value={{ projects, isLoaded, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
