import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [isLight, setIsLight] = useState(false);

  const toggleTheme = () => {
    setIsLight(!isLight);
    document.body.classList.toggle('light-theme');
  };

  return (
    <footer className="footer-container">
      <div>© 2026 Strata Infrastructure Inc.</div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Status</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Twitter</a>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            borderRadius: '100px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isLight ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </footer>
  );
};

export default Footer;
