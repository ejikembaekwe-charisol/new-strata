import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewProjectModal from '../components/NewProjectModal';
import { useProjects } from '../context/ProjectContext';

const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoaded, addProject, updateProject, deleteProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded) return <div className="loading-screen"><div className="loading-spinner"></div></div>;

  const handleCreate = (data) => {
    const newProject = addProject(data);
    // Navigate to the newly created project
    navigate(`/projects/${newProject.id}`);
  };

  const handleUpdate = (id, newName) => {
    updateProject(id, { name: newName });
    setEditingProject(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'left', maxWidth: '100%', padding: '6rem 0 3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Your projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your design systems and brand tokens.</p>
        </div>
        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.5rem 1.25rem', width: '260px' }}>
              <span style={{ marginRight: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }} 
              />
            </div>
            <button
              id="new-project-btn"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
              onClick={() => setShowModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New project
            </button>
          </div>
        )}
      </div>

      {/* Project Grid / Empty State */}
      <div className="page-section" style={{ paddingTop: '0' }}>
        {projects.length === 0 ? (
          <div className="empty-state" style={{ 
            textAlign: 'center', 
            padding: '5rem 2rem', 
            background: 'var(--bg-secondary)', 
            borderRadius: '24px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: 'var(--text-tertiary)', border: '1px solid var(--border)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Create your first project</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem', fontSize: '1rem', lineHeight: '1.5' }}>
              Start by defining your brand identity or importing your existing tokens. Strata will handle the rest.
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              + New project
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </h2>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filteredProjects.map(project => (
                <div key={project.id} className="card project-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: project.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#fff',
                        flexShrink: 0,
                      }}>
                        {project.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingProject === project.id ? (
                          <input
                            autoFocus
                            className="form-input"
                            style={{ height: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.95rem' }}
                            defaultValue={project.name}
                            onBlur={(e) => handleUpdate(project.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate(project.id, e.target.value)}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</h3>
                            <button 
                              onClick={() => setEditingProject(project.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          </div>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {project.websiteUrl || project.figmaUrl ? '✓ Context provided' : 'No context provided'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '100px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                        color: project.status === 'Active' ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: 600, letterSpacing: '0.05em',
                      }}>
                        {project.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer', padding: '2px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>Last synced</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{project.updated}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.25rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Open project
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new card placeholder */}
              <div
                className="card"
                onClick={() => setShowModal(true)}
                style={{
                  padding: '1.5rem', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                  border: '1px dashed var(--border)', background: 'transparent',
                  minHeight: '210px', cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '1px solid var(--border)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem',
                  color: 'var(--text-tertiary)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>New project</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default Projects;
