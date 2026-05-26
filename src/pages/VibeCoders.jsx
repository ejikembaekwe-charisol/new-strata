import React from 'react';
import { Link } from 'react-router-dom';

const VibeCoders = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>FOR VIBE CODERS</span>
        <h1>Every screen you ship should look like it came from the same product</h1>
        <p>AI can generate a screen in minutes. It can't give your apps shared design inheritance. Strata connects your token and component source once — every app you build or generate inherits it automatically.</p>
        
        <div className="cta-group" style={{ marginTop: '2rem' }}>
          <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get started</Link>
        </div>
      </div>

      <div className="page-section">
        <h2>What breaks without a shared system</h2>
        <div className="grid">
          <div className="card">
            <h3>AI built the app. Nobody built the design system.</h3>
            <p style={{ fontSize: '0.9rem' }}>The generated code works, but every screen invents its own spacing, colours, and type scale. There's no shared source of truth.</p>
          </div>
          <div className="card">
            <h3>Every component drifts. The product feels unfinished fast.</h3>
            <p style={{ fontSize: '0.9rem' }}>Three screens in and the buttons don't match, the type is inconsistent, and nothing looks intentional. Users notice before you do.</p>
          </div>
          <div className="card">
            <h3>Manual cleanup is expensive. You lose shipping momentum.</h3>
            <p style={{ fontSize: '0.9rem' }}>Going back to make it consistent means stopping feature work. The longer you wait, the more screens need fixing — and the harder the reset becomes.</p>
          </div>
        </div>

        <div className="comparison" style={{ marginTop: '2rem' }}>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--text-secondary)' }}>BEFORE STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>You build 3 apps in a weekend. Each one has slightly different button styles, spacing, and colours. It looks like 3 different products from 3 different companies.</p>
          </div>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--accent)' }}>WITH STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>Connect your source once. Every app you generate inherits the same token and component layer automatically. It looks like one product — because it is.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>One decision, infinite reach</h2>
          <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>Connect your source once. Every connected app inherits that system.</p>
          <p style={{ fontSize: '1rem' }}>Update the system definition and all consuming apps update from the same runtime layer.</p>
        </div>
      </div>

      <div className="page-section">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Where this is heading</h2>
        <p style={{ fontSize: '0.95rem' }}>App generation volume is increasing. Shared UI architecture is not. Strata is the infrastructure layer for giving AI-built apps a persistent design backbone across React, Web Components, and what comes next.</p>
      </div>

      <div className="page-section">
        <h2>For the rest of your team</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>For Developers</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>If you're using Cursor, v0, or Lovable alongside traditional engineering, Strata gives the whole stack one system to reference.</p>
            <Link to="/developers" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>See the developer integration →</Link>
          </div>
          <div className="card">
            <h3>For Designers</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>If you want your Figma decisions to reach production without filling tickets, Strata is the runtime layer between design and code.</p>
            <Link to="/designers" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>See the designer perspective →</Link>
          </div>
        </div>
      </div>

      <div className="page-section" style={{ paddingBottom: '8rem' }}>
        <div style={{ background: '#111', color: 'white', padding: '3rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Keep the speed. Lose the UI chaos.</h2>
          <button className="btn btn-secondary" style={{ background: 'white', color: 'black', border: 'none' }}>Build with Strata</button>
        </div>
      </div>
    </div>
  );
};

export default VibeCoders;
