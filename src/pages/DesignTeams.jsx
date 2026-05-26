import React from 'react';
import { Link } from 'react-router-dom';

const DesignTeams = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>FOR DESIGN SYSTEMS TEAMS</span>
        <h1>One system definition. Every team, always current.</h1>
        <p>Strata turns your design system into a runtime layer every consuming app connects to. When you update a token or component, adoption isn't a campaign — it's automatic.</p>
        
        <div className="cta-group" style={{ marginTop: '2rem' }}>
          <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start your system</Link>
          <button className="btn btn-secondary">See how engineering integrates it</button>
        </div>
      </div>

      <div className="page-section">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>What breaks at scale</h3>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>Version skew compounds silently. Teams pin to old releases.</li>
              <li>Token updates require coordination across 6+ repos.</li>
              <li>Enforcement is manual. Drift is invisible until it's a brand incident.</li>
            </ul>
          </div>
          <div className="card" style={{ background: 'var(--bg-secondary)' }}>
            <h3>What Strata changes</h3>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>One runtime definition. Consuming apps don't pin — they subscribe.</li>
              <li>Token and component updates propagate in 3 seconds or at build time.</li>
              <li>You choose the control model: runtime for speed, build-time for governance.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2>How teams use it</h2>
        <div className="grid">
          <div className="card">
            <h3>Platform teams</h3>
            <p style={{ fontSize: '0.9rem' }}>Define once. Every product team inherits the same runtime layer automatically.</p>
          </div>
          <div className="card">
            <h3>Brand migrations</h3>
            <p style={{ fontSize: '0.9rem' }}>Update the token, not the tickets. Every connected app reflects the new brand without a release.</p>
          </div>
          <div className="card">
            <h3>Multi-framework orgs</h3>
            <p style={{ fontSize: '0.9rem' }}>One system definition powers React packages and Web Components from the same source.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Runtime adoption as the default</h2>
          <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>The biggest cost of a design system isn't building it — it's keeping every team on it. Strata removes that coordination layer. Once engineering wires the client, your system is the source of truth for every connected product surface, automatically.</p>
          <p style={{ fontSize: '1rem' }}>Build-time mode gives you governance: locked, versioned, auditable. Runtime mode gives you speed: 3-second propagation, no redeploy required. You choose per environment.</p>
        </div>
      </div>

      <div className="page-section" style={{ paddingBottom: '8rem' }}>
        <div style={{ background: '#111', color: 'white', padding: '3rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Make adoption the default, not the ask</h2>
          <button className="btn btn-secondary" style={{ background: 'white', color: 'black', border: 'none' }}>Create your system</button>
        </div>
      </div>
    </div>
  );
};

export default DesignTeams;
