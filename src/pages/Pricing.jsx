import React from 'react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ paddingBottom: '2rem' }}>
        <span className="section-label" style={{ color: 'var(--text-secondary)' }}>PRICING</span>
        <h1>Simple, honest pricing</h1>
        <p>Strata is completely free while in beta. No credit card required — just sign up and start building.</p>
      </div>

      <div className="page-section" style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', paddingTop: '0' }}>
        <div className="card pricing-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent)' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', padding: '0.25rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>Beta</span>
          </div>
          
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1rem' }}>Free</h2>
          
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent)' }}>$0</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}> / month</span>
          </div>
          
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>While in beta • No credit card required</p>
          
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {['Unlimited projects', 'Figma import', 'Extract tokens & components from any screenshot', 'AI-powered token generation', 'Real-time sync to your apps', 'All export formats (Tailwind, CSS, Swift, Dart, and more)', 'Public CDN endpoints for your tokens', 'Style Dictionary and DTCG JSON compatible'].map((feature, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent)', marginTop: '2px' }}>✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <Link to="/signup" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Get Started Free</Link>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Questions? <Link to="/contact" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Contact us</Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
