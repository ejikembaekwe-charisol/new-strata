import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractColorsFromImage, parseBrandText, parseJsonTokens } from '../utils/colorExtract';

const initialData = {
  title: '',
  description: '',
  visibility: 'private',
  color: '#FC0694', // default fallback project banner color
  websiteUrl: '',
  figmaUrl: '',
  brand: {
    logo: null,
    logoPreview: null,
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    headingFont: 'Outfit',
    bodyFont: 'Inter',
    toneKeywords: [],
    guidelinesDoc: null,
  },
  tokens: {
    importMethod: 'json', // 'json' (text paste) or 'file' (upload)
    jsonContent: '',
    jsonFileName: '',
  },
};

export default function NewProjectModal({ onClose, onCreate }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const logoRef = useRef();
  const docRef = useRef();
  const jsonFileRef = useRef();

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const updateBrand = (key, value) => setData(prev => ({ ...prev, brand: { ...prev.brand, [key]: value } }));
  const updateTokens = (key, value) => setData(prev => ({ ...prev, tokens: { ...prev.tokens, [key]: value } }));

  const toggleTone = (word) => {
    const cur = data.brand.toneKeywords;
    updateBrand('toneKeywords', cur.includes(word) ? cur.filter(w => w !== word) : [...cur, word]);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateBrand('logo', file);
    updateBrand('logoPreview', URL.createObjectURL(file));

    // Infer colors from logo
    const colors = await extractColorsFromImage(file);
    if (colors.extracted) {
      if (colors.primaryColor) {
        updateBrand('primaryColor', colors.primaryColor);
        update('color', colors.primaryColor);
      }
      if (colors.secondaryColor) updateBrand('secondaryColor', colors.secondaryColor);
      if (colors.accentColor) updateBrand('accentColor', colors.accentColor);
    }
  };

  const handleDocChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateBrand('guidelinesDoc', file);

    // If it's a text-based file, try to parse it
    if (file.type === 'text/markdown' || file.type === 'text/plain' || file.name.endsWith('.md')) {
      const text = await file.text();
      const brandData = parseBrandText(text);
      if (brandData.extracted) {
        if (brandData.primaryColor) {
          updateBrand('primaryColor', brandData.primaryColor);
          update('color', brandData.primaryColor);
        }
        if (brandData.secondaryColor) updateBrand('secondaryColor', brandData.secondaryColor);
        if (brandData.accentColor) updateBrand('accentColor', brandData.accentColor);
        if (brandData.headingFont) updateBrand('headingFont', brandData.headingFont);
        if (brandData.bodyFont) updateBrand('bodyFont', brandData.bodyFont);
        if (brandData.toneKeywords.length > 0) {
          updateBrand('toneKeywords', Array.from(new Set([...data.brand.toneKeywords, ...brandData.toneKeywords])));
        }
      }
    }
  };

  const handleJsonTextChange = (text) => {
    updateTokens('jsonContent', text);
    const colors = parseJsonTokens(text);
    if (colors.extracted) {
      if (colors.primaryColor) {
        updateBrand('primaryColor', colors.primaryColor);
        update('color', colors.primaryColor);
      }
      if (colors.secondaryColor) updateBrand('secondaryColor', colors.secondaryColor);
      if (colors.accentColor) updateBrand('accentColor', colors.accentColor);
    }
  };

  const handleJsonFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateTokens('jsonFileName', file.name);

    try {
      const text = await file.text();
      updateTokens('jsonContent', text);

      const colors = parseJsonTokens(text);
      if (colors.extracted) {
        if (colors.primaryColor) {
          updateBrand('primaryColor', colors.primaryColor);
          update('color', colors.primaryColor);
        }
        if (colors.secondaryColor) updateBrand('secondaryColor', colors.secondaryColor);
        if (colors.accentColor) updateBrand('accentColor', colors.accentColor);
      }
    } catch (err) {
      console.error("Failed to read JSON file", err);
      alert("Could not read JSON file.");
    }
  };


  const canAdvanceStep1 = data.title.trim().length > 0;
  const nextStep = () => {
    if (step === 2) {
      navigate('/projects/generate', { state: { brandData: data } });
      onClose();
      return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const stepLabels = ['Project identity', 'Context intake'];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">New project</h2>
            <p className="modal-subtitle">
              {step === 1 && 'Name your project and set the base style.'}
              {step === 2 && 'Provide any context you have—website, Figma, or brand assets.'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="modal-steps">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <React.Fragment key={n}>
                <div className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="step-dot">{isDone ? '✓' : n}</div>
                  <span className="step-label">{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* ── STEP 1: Basic Identity ── */}
          {step === 1 && (
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
          )}

          {/* ── STEP 2: Context Intake (Everything Optional) ── */}
          {step === 2 && (
            <div className="modal-section">
              <div style={{ background: 'rgba(252,6,148,0.03)', border: '1px solid rgba(252,6,148,0.1)', borderRadius: '12px', padding: '1rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <strong style={{ color: 'var(--accent)' }}>Pro tip:</strong> Drop whatever you have. Strata will structure your brand assets from these sources.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                    Live website URL
                  </label>
                  <input
                    className="form-input"
                    placeholder="https://example.com"
                    value={data.websiteUrl}
                    onChange={e => update('websiteUrl', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 110 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/><path d="M5 19.5A3.5 3.5 0 018.5 16H12v3.5a3.5 3.5 0 01-7 0z"/><path d="M5 12.5A3.5 3.5 0 018.5 9H12v7H8.5A3.5 3.5 0 015 12.5z"/></svg>
                    Figma file URL
                  </label>
                  <input
                    className="form-input"
                    placeholder="https://figma.com/file/..."
                    value={data.figmaUrl}
                    onChange={e => update('figmaUrl', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Brand logo</label>
                  <div className="upload-zone compact" onClick={() => logoRef.current.click()} style={{ height: '80px' }}>
                    {data.brand.logoPreview ? (
                      <img src={data.brand.logoPreview} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    ) : (
                      <span className="upload-text" style={{ fontSize: '0.75rem' }}>Click to upload logo</span>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guidelines / Brand book</label>
                  <div className="upload-zone compact" onClick={() => docRef.current.click()} style={{ height: '80px' }}>
                    <span className="upload-text" style={{ fontSize: '0.75rem' }}>
                      {data.brand.guidelinesDoc ? data.brand.guidelinesDoc.name : 'Upload PDF/MD'}
                    </span>
                  </div>
                  <input ref={docRef} type="file" accept=".pdf,.md,.txt" style={{ display: 'none' }} onChange={handleDocChange} />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2zM7 10h4m-4 4h4m4-4h.01M15 14h.01"/></svg>
                    JSON Tokens Context (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => updateTokens('importMethod', 'json')}
                      style={{
                        background: data.tokens.importMethod === 'json' ? 'var(--accent)' : 'none',
                        color: data.tokens.importMethod === 'json' ? '#fff' : 'var(--text-secondary)',
                        border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
                      }}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTokens('importMethod', 'file')}
                      style={{
                        background: data.tokens.importMethod === 'file' ? 'var(--accent)' : 'none',
                        color: data.tokens.importMethod === 'file' ? '#fff' : 'var(--text-secondary)',
                        border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
                      }}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {data.tokens.importMethod === 'json' ? (
                  <textarea 
                    className="form-textarea"
                    placeholder='Paste tokens.json content here (e.g. { "color": { "primary": "#FC0694" } })'
                    value={data.tokens.jsonContent}
                    onChange={e => handleJsonTextChange(e.target.value)}
                    style={{ height: '80px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                  />
                ) : (
                  <div>
                    <div 
                      className="upload-zone compact" 
                      onClick={() => jsonFileRef.current.click()} 
                      style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <span className="upload-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {data.tokens.jsonFileName ? `✓ ${data.tokens.jsonFileName}` : 'Click to upload tokens.json file'}
                      </span>
                    </div>
                    <input 
                      ref={jsonFileRef} 
                      type="file" 
                      accept=".json" 
                      style={{ display: 'none' }} 
                      onChange={handleJsonFileChange} 
                    />
                  </div>
                )}
              </div>

              {!!(data.brand.primaryColor || data.brand.secondaryColor || data.brand.accentColor) && (
                <div className="form-group">
                  <label className="form-label">Extracted colors (Review & adjust)</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {['primaryColor', 'secondaryColor', 'accentColor'].map(key => {
                      const val = data.brand[key];
                      if (!val) return null;
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: val }} />
                          <input type="color" value={val} onChange={e => updateBrand(key, e.target.value)} style={{ width: '0', height: '0', visibility: 'hidden', position: 'absolute' }} id={key} />
                          <label htmlFor={key} style={{ fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{val.toUpperCase()}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step > 1 ? (
            <button className="btn btn-secondary modal-btn" onClick={prevStep}>Back</button>
          ) : (
            <button className="btn btn-secondary modal-btn" onClick={onClose}>Cancel</button>
          )}
          <button
            className="btn btn-primary modal-btn"
            onClick={nextStep}
            disabled={step === 1 && !canAdvanceStep1}
          >
            {step === 2 ? 'Create & Generate' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
