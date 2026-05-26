import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="nav">
      <div className="logo">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Strata<span className="dot-accent">.</span>
        </Link>
      </div>

      <div className="nav-links">
        <div className="dropdown">
          <button className="dropdown-toggle">Built for</button>
          <div className="dropdown-menu">
            <Link to="/designers">Designers</Link>
            <Link to="/developers">Developers</Link>
            <Link to="/design-teams">Design teams</Link>
            <Link to="/vibe-coders">Vibe Coders</Link>
          </div>
        </div>
        <Link to="/explore">Explore</Link>
        <Link to="/docs">Docs</Link>
        <Link to="/pricing">Pricing</Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          /* ── Logged-in: avatar + dropdown ── */
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              id="nav-avatar-btn"
              onClick={() => setShowUserMenu(p => !p)}
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid transparent',
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
                fontWeight: 700, fontSize: '0.75rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'box-shadow 0.2s',
                boxShadow: showUserMenu ? '0 0 0 3px var(--accent-glow)' : 'none',
              }}
            >
              {user.initials}
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '0.375rem',
                minWidth: '200px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                zIndex: 2000, animation: 'panelIn 0.2s ease',
              }}>
                {/* User info */}
                <div style={{ padding: '0.625rem 0.875rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{user.email}</div>
                </div>

                <Link
                  to="/projects"
                  onClick={() => setShowUserMenu(false)}
                  style={navMenuItemStyle}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  My projects
                </Link>

                <button style={{ ...navMenuItemStyle, color: 'var(--text-secondary)' }} onClick={() => setShowUserMenu(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Profile
                </button>

                <div style={{ height: '1px', background: 'var(--border)', margin: '0.375rem 0' }} />

                <button
                  style={{ ...navMenuItemStyle, color: '#EF4444' }}
                  onClick={() => { logout(); setShowUserMenu(false); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Logged-out: Get Started ── */
          <Link to="/signup" className="nav-cta" style={{ textDecoration: 'none' }}>
            Get started
          </Link>
        )}
      </div>
    </nav>
  );
};

const navMenuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '0.625rem',
  width: '100%', background: 'none', border: 'none',
  padding: '0.525rem 0.875rem', borderRadius: '7px',
  fontSize: '0.82rem', color: 'var(--text-secondary)',
  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
};

export default Navigation;
