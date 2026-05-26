import React from 'react';

const Problem = () => {
  return (
    <section id="problem" className="section reveal">
      <div className="section-header">
        <span className="section-label">The Conflict</span>
        <h2>Why design systems stall in production.</h2>
      </div>
      <div className="comparison">
        <div className="pain-list">
          <div className="pain-item">
            <h4>The Implementation Gap</h4>
            <p>Designers update Figma, but developers are 3 sprints behind. Production is a graveyard of "good enough" implementations.</p>
          </div>
          <div className="pain-item">
            <h4>Package Hell</h4>
            <p>Bumping design system versions across 12 micro-frontends is a full-week job for an engineer who'd rather be building features.</p>
          </div>
          <div className="pain-item">
            <h4>Silent Drift</h4>
            <p>Hardcoded hex values and one-off components creep into repos, slowly eroding brand integrity until "the big rewrite."</p>
          </div>
        </div>
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <span className="section-label" style={{ color: '#fff', marginBottom: '2rem' }}>The Strata Solution</span>
          <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>One source of truth. Zero friction.</h3>
          <p>Strata decouples design assets from deployment cycles. When a designer hits "publish" in Figma, your production apps update via our lightweight runtime in seconds.</p>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>System Active: Production Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
