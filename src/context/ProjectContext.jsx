import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

const DEFAULT_TOKENS = {
  Color: [
    { name: 'color.primary', value: '#FC0694', type: 'color' },
    { name: 'color.secondary', value: '#1A1A24', type: 'color' },
    { name: 'color.accent', value: '#3B82F6', type: 'color' },
    { name: 'color.background', value: '#0D0D12', type: 'color' },
    { name: 'color.surface', value: '#13131A', type: 'color' },
    { name: 'color.text.primary', value: '#FFFFFF', type: 'color' },
    { name: 'color.text.secondary', value: '#8C8CA1', type: 'color' },
  ],
  Typography: [
    { name: 'font.heading', value: 'Outfit', type: 'fontFamily' },
    { name: 'font.body', value: 'Inter', type: 'fontFamily' },
    { name: 'font.size.xs', value: '0.75rem', type: 'fontSize' },
    { name: 'font.size.sm', value: '0.875rem', type: 'fontSize' },
    { name: 'font.size.base', value: '1rem', type: 'fontSize' },
    { name: 'font.size.lg', value: '1.25rem', type: 'fontSize' },
    { name: 'font.size.xl', value: '1.5rem', type: 'fontSize' },
  ],
  Spacing: [
    { name: 'spacing.1', value: '4px', type: 'spacing' },
    { name: 'spacing.2', value: '8px', type: 'spacing' },
    { name: 'spacing.3', value: '12px', type: 'spacing' },
    { name: 'spacing.4', value: '16px', type: 'spacing' },
    { name: 'spacing.6', value: '24px', type: 'spacing' },
    { name: 'spacing.8', value: '32px', type: 'spacing' },
  ],
  Sizing: [],
  Layout: [],
  Flexbox: [],
  Lists: [],
  Border: [
    { name: 'border.radius.sm', value: '4px', type: 'borderRadius' },
    { name: 'border.radius.md', value: '8px', type: 'borderRadius' },
    { name: 'border.radius.lg', value: '16px', type: 'borderRadius' },
    { name: 'border.radius.full', value: '9999px', type: 'borderRadius' },
  ],
  Shadow: [
    { name: 'shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)', type: 'shadow' },
    { name: 'shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)', type: 'shadow' },
    { name: 'shadow.lg', value: '0 16px 48px rgba(0,0,0,0.5)', type: 'shadow' },
  ],
  Motion: [
    { name: 'duration.fast', value: '150ms', type: 'duration' },
    { name: 'duration.base', value: '250ms', type: 'duration' },
    { name: 'duration.slow', value: '500ms', type: 'duration' },
    { name: 'easing.default', value: 'cubic-bezier(0.4,0,0.2,1)', type: 'easing' },
  ],
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
      tokens: projectData.tokens || DEFAULT_TOKENS,
      components: projectData.components || [],
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
