import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authVisual from '../assets/auth-visual.png';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Where to land after signing in. A page that sent you here to log in can say where it
  // wants you back — the public design-system page does, so that Remix finishes the job
  // you asked for instead of stranding you on the project list with nothing copied.
  //
  // Only same-site paths are honoured: anything that is not a bare `/...` path could be an
  // absolute URL to somewhere else, which would make this an open redirect.
  const from = location.state && location.state.from;
  const backTo = typeof from === 'string' && /^\/[^/]/.test(from) ? from : '/projects';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Visual Side */}
      <div style={{ 
        flex: '1', 
        position: 'relative', 
        // No inline `display`. It used to say 'none' with a '@media (min-width: 1024px)'
        // key beside it — React has no such thing, so it logged "Unsupported style
        // property" on every render and the inline none beat the stylesheet at every
        // width, meaning this panel never appeared at all. The <style> block below
        // already hides it under 1024px, which is all that was wanted.
      }} className="auth-visual-side">
        <img 
          src={authVisual} 
          alt="Auth Visual" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: 0.8
          }} 
        />
        <div style={{ 
          position: 'absolute', 
          bottom: '4rem', 
          left: '4rem', 
          right: '4rem',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Design system delivery, simplified.</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Connect your Figma source once. See updates in production in ~3 seconds.
          </p>
        </div>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'linear-gradient(to top, var(--bg) 0%, transparent 40%)' 
        }}></div>
      </div>

      {/* Form Side */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '4rem',
        maxWidth: '650px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome back</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Log in to manage your design system propagation.
          </p>
        </div>

        <form 
          style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            login({ name: 'Abdul-Qayyum', email: 'user@example.com', initials: 'AQ' });
            navigate(backTo, { replace: true });
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              required
              style={{ 
                background: 'transparent', 
                borderBottom: '1px solid var(--border)', 
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                padding: '1rem 0', 
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1.1rem'
              }} 
              className="auth-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              required
              style={{ 
                background: 'transparent', 
                borderBottom: '1px solid var(--border)', 
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                padding: '1rem 0', 
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1.1rem'
              }} 
              className="auth-input"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem', width: '100%', marginTop: '1rem', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}>Log in</button>
        </form>

        <div style={{ margin: '2.5rem 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.1rem' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Google Account
        </button>

        <p style={{ marginTop: '3rem', fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          New to Strata? <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Create an account</Link>
        </p>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .auth-visual-side { display: none !important; }
        }
        .auth-input:focus {
          border-bottom-color: var(--accent) !important;
        }
      `}} />
    </div>
  );
};

export default Login;
