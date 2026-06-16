import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authVisual from '../assets/auth-visual.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Visual Side */}
      <div style={{ 
        flex: '1', 
        position: 'relative', 
        display: 'none', 
        '@media (min-width: 1024px)': { display: 'block' } 
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
        margin: '0 auto',
        width: '100%'
      }}>
        {!isSubmitted ? (
          <div>
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Reset Password</h1>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Enter the email address associated with your account, and we'll email you a link to reset your password.
              </p>
            </div>

            <form 
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
              onSubmit={handleSubmit}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  padding: '1.25rem', 
                  width: '100%', 
                  marginTop: '1rem', 
                  fontSize: '1.1rem', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                Send reset link
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'var(--accent-glow)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent)',
              fontSize: '1.5rem',
              margin: '0 auto 1rem'
            }}>
              ✉️
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Check your inbox</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              We have sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please check your email to complete the process.
            </p>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="btn btn-secondary" 
              style={{ padding: '0.75rem 1.5rem', margin: '1rem auto 0', cursor: 'pointer', border: 'none' }}
            >
              Resend email
            </button>
          </div>
        )}

        <div style={{ marginTop: '3rem', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Back to Log In</Link>
          <span>•</span>
          <Link to="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Home</Link>
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

export default ForgotPassword;
