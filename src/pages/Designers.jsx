import React from 'react';
import { Link } from 'react-router-dom';

const Designers = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>FOR DESIGNERS</span>
        <h1>Design decisions shouldn't need an engineering ticket to ship</h1>
        <p>When you update a component in your design system, Strata pushes it live. No handoff cycle. No implementation ticket. No waiting to see if it landed right.</p>
        
        <div className="cta-group" style={{ marginTop: '2rem' }}>
          <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start building</Link>
          <button className="btn btn-secondary">See how engineering integrates it</button>
        </div>
      </div>

      <div className="page-section">
        <h2>What keeps happening</h2>
        <div className="grid">
          <div className="card">
            <h3>You updated the component in Figma three weeks ago. It's still wrong in production.</h3>
            <p style={{ fontSize: '0.9rem' }}>The intent was clear. The handoff was thorough. But it's still in the backlog, waiting for the next sprint.</p>
          </div>
          <div className="card">
            <h3>You file a ticket. It gets prioritised — eventually.</h3>
            <p style={{ fontSize: '0.9rem' }}>The gap between design intent and shipped product is measured in sprint cycles, not hours. Every cycle adds interpretation drift.</p>
          </div>
          <div className="card">
            <h3>By the time it ships, the design has moved on again.</h3>
            <p style={{ fontSize: '0.9rem' }}>Consistency is a moving target when production always lags design by a sprint. The system never feels coherent.</p>
          </div>
        </div>

        <div className="comparison" style={{ marginTop: '2rem' }}>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--text-secondary)' }}>BEFORE STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>Update in Figma → write a ticket → wait for sprint → review the implementation → it's slightly off → leave a comment → wait again.</p>
          </div>
          <div className="card" style={{ background: 'transparent' }}>
            <span className="section-label" style={{ color: 'var(--accent)' }}>WITH STRATA</span>
            <p style={{ fontSize: '0.9rem' }}>Update your system definition → Strata pushes it live → production matches design. The loop closes in seconds, not sprints.</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Pitch this to your team</h2>
          <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>"We keep our existing frontend stack, but move design system delivery to runtime. That reduces redeployment work for UI changes and keeps production aligned with design across React and non-React apps."</p>
          <p style={{ fontSize: '1rem' }}>You do not need to manage build pipelines. Engineering wires the client once, then the same definition can power React packages, Web Components, and future native targets.</p>
          <p style={{ fontSize: '1rem', marginTop: '1rem' }}>Don't have your system defined in Strata yet? Upload a screenshot of your current UI and we'll extract a starter set of tokens and components for you to refine.</p>
        </div>
      </div>

      <div className="page-section">
        <h2>Explore further</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>For Developers</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>See how engineering wires Strata once and gets live sync across every connected app.</p>
            <Link to="/developers" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>See how engineering integrates it →</Link>
          </div>
          <div className="card">
            <h3>API docs</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Review the install guide, sync URL setup, and component usage reference.</p>
            <Link to="/docs" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Read the docs →</Link>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem' }}>Running a design system for multiple teams? <Link to="/design-teams" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>See how Strata scales across organisations →</Link></span>
        </div>
      </div>

      <div className="page-section" style={{ paddingBottom: '8rem' }}>
        <div style={{ background: '#111', color: 'white', padding: '3rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Design decisions should ship, not stall</h2>
          <button className="btn btn-secondary" style={{ background: 'white', color: 'black', border: 'none' }}>Start building</button>
        </div>
      </div>
    </div>
  );
};

export default Designers;
