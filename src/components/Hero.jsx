import React from 'react';
import { Link } from 'react-router-dom';
import heroVisual from '../assets/hero-visual.png';

const Hero = () => {
  return (
    <header className="hero">
      <div className="hero-background-layers">
        <div className="hero-grid"></div>
        <div className="layer layer-1"></div>
        <div className="layer layer-2"></div>
        <div className="layer layer-3"></div>
      </div>
      <div className="hero-content">
        <h1>Your design updates. <span>Live in 3 seconds.</span></h1>
        <p>Close the gap between Figma and Production. Strata pushes design system updates to every app instantly. No tickets. No redeploys.</p>
        <div className="cta-group">
          <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start Building</Link>
          <button className="btn btn-secondary">See how it works</button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
