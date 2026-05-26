import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authVisual from '../assets/auth-visual.png';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [accountType, setAccountType] = useState('individual');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSignup = (e) => {
    e.preventDefault();
    signup({ 
      name: `${formData.firstName} ${formData.lastName}`, 
      email: formData.email,
      initials: (formData.firstName[0] || '') + (formData.lastName[0] || '')
    });
    navigate('/projects');
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
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Build for the future of design ops.</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Join thousands of teams scaling their design system infrastructure with runtime delivery.
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
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Create your account</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Start shipping design changes in seconds, not sprints.
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>First Name</label>
              <input 
                type="text" 
                placeholder="First name" 
                required
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                style={{ 
                  background: 'transparent', 
                  borderBottom: '1px solid var(--border)', 
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  padding: '0.75rem 0', 
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
                className="auth-input"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Last Name</label>
              <input 
                type="text" 
                placeholder="Last name" 
                required
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                style={{ 
                  background: 'transparent', 
                  borderBottom: '1px solid var(--border)', 
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  padding: '0.75rem 0', 
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
                className="auth-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ 
                background: 'transparent', 
                borderBottom: '1px solid var(--border)', 
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                padding: '0.75rem 0', 
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1rem'
              }} 
              className="auth-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ 
                background: 'transparent', 
                borderBottom: '1px solid var(--border)', 
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                padding: '0.75rem 0', 
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1rem'
              }} 
              className="auth-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Type</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setAccountType('individual')}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid', 
                  borderColor: accountType === 'individual' ? 'var(--accent)' : 'var(--border)',
                  background: accountType === 'individual' ? 'rgba(252, 6, 148, 0.1)' : 'transparent',
                  color: accountType === 'individual' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Individual
              </button>
              <button 
                type="button"
                onClick={() => setAccountType('organization')}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid', 
                  borderColor: accountType === 'organization' ? 'var(--accent)' : 'var(--border)',
                  background: accountType === 'organization' ? 'rgba(252, 6, 148, 0.1)' : 'transparent',
                  color: accountType === 'organization' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Organization
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem', width: '100%', marginTop: '0.5rem', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}>Create account</button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.1rem' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Sign up with Google
        </button>

        <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Log in</Link>
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

export default Signup;
