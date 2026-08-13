import React from 'react';
import ScreenshotImportDemo from './ScreenshotImportDemo';

const ImportShowcase = () => {
  return (
    <section id="import-showcase" className="section reveal">
      <div className="section-header">
        <span className="section-label">Bootstrap</span>
        <h2>Already shipped a design? Just upload it.</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', marginBottom: '3rem' }}>
        No Figma file, no Style Dictionary — just a screenshot. Drop in a Figma export, or any screenshot of a
        web or app UI, and Strata parses the real pixels to extract color and typography tokens, and detects
        the distinct components inside it. Review what it found, tick what you want, and your design system
        is bootstrapped in minutes instead of days.
      </p>
      <ScreenshotImportDemo />
    </section>
  );
};

export default ImportShowcase;
