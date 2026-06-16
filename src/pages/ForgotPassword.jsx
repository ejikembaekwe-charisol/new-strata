import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authVisual from '../assets/auth-visual.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Step state: 'email' | 'otp' | 'new-password' | 'success'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Step 1: Send OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    // Mock sending OTP, advance to step 2
    setStep('otp');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError('');
    // Mock validation, advance to step 3
    setStep('new-password');
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    if (value && isNaN(value)) return;
    
    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs[index - 1].current.focus();
      }
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    // Mock password update, advance to success step
    setStep('success');
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
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#EF4444', 
            padding: '1rem', 
            borderRadius: '8px', 
            fontSize: '0.9rem', 
            marginBottom: '2rem' 
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <div>
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Reset Password</h1>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Enter the email address associated with your account, and we'll send you a 6-digit code to verify your identity.
              </p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} onSubmit={handleSendOtp}>
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
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
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
                style={{ padding: '1.25rem', width: '100%', marginTop: '1rem', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
              >
                Send Code
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 'otp' && (
          <div>
            <div style={{ marginBottom: '3.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Verify identity</h1>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                We've sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Enter the code below.
              </p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} onSubmit={handleVerifyOtp}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '52px',
                      height: '58px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                    className="otp-input"
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '1.25rem', width: '100%', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
              >
                Verify Code
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Didn't receive code? </span>
                <button 
                  type="button" 
                  onClick={() => { setOtp(['', '', '', '', '', '']); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', padding: 0 }}
                >
                  Resend code
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Create New Password */}
        {step === 'new-password' && (
          <div>
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Create New Password</h1>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Please enter a secure password that is at least 6 characters long.
              </p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} onSubmit={handleResetPassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    borderBottom: '1px solid var(--border)', 
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    padding: '1rem 0', 
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '1.1rem'
                  }} 
                  className="auth-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    borderBottom: '1px solid var(--border)', 
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
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
                style={{ padding: '1.25rem', width: '100%', marginTop: '1rem', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
              >
                Reset Password
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Success State */}
        {step === 'success' && (
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
              ✓
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password Reset Successful</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              Your password has been changed. You can now use your new credentials to log in.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary" 
              style={{ padding: '1rem 2rem', margin: '1rem auto 0', cursor: 'pointer', border: 'none' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {step !== 'success' && (
          <div style={{ marginTop: '3rem', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Back to Log In</Link>
            <span>•</span>
            <Link to="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Home</Link>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .auth-visual-side { display: none !important; }
        }
        .auth-input:focus {
          border-bottom-color: var(--accent) !important;
        }
        .otp-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 2px var(--accent-glow) !important;
        }
      `}} />
    </div>
  );
};

export default ForgotPassword;
