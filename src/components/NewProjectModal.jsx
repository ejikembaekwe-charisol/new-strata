import { useState } from 'react';

const initialData = {
  title: '',
  description: '',
  visibility: 'private',
  color: '#FC0694', // default project banner colour
};

export default function NewProjectModal({ onClose, onCreate }) {
  const [data, setData] = useState(initialData);

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const canCreate = data.title.trim().length > 0;

  const submit = () => {
    if (!canCreate) return;
    onCreate({
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">New project</h2>
            <p className="modal-subtitle">Just a name is enough to start — brand colours, logo, website and Figma can all be added later.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-section">
            <div className="form-group">
              <label className="form-label">Project title <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="e.g. Acme Corp Mobile App"
                value={data.title}
                onChange={e => update('title', e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description <span className="form-optional">Optional</span></label>
              <textarea
                className="form-textarea"
                placeholder="What are we building?"
                value={data.description}
                onChange={e => update('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select className="form-input" value={data.visibility} onChange={e => update('visibility', e.target.value)}>
                <option value="private">Private (Restricted)</option>
                <option value="public">Public (Open)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nothing here is a commitment — say so where the user is about to commit */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          margin: '0 1.5rem 0.25rem', padding: '0.75rem 0.9rem',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span style={{ fontSize: '0.76rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            You can leave the rest for now. Your project tracks how much brand context you have
            provided, so you can come back and fill in the gaps whenever you like.
          </span>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary modal-btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary modal-btn" onClick={submit} disabled={!canCreate}>
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
