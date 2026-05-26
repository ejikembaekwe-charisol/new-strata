import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="cta-banner">
      <div className="reveal">
        <h2>Start shipping design.<br />Stop implementation tickets.</h2>
        <div className="cta-group" style={{ marginTop: '3rem' }}>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', textDecoration: 'none' }}>Get Started for Free</Link>
          <button className="btn btn-secondary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem' }}>Book a Demo</button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
