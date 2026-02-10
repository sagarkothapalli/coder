import React, { useState, useEffect, useRef, useCallback } from 'react';

const LoginPage = ({ onLogin, onShowRegister, onShowForgot, onShowPrivacy }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleButton = useRef(null);

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isNewUser) {
          localStorage.setItem('tempGoogleToken', response.credential);
          localStorage.setItem('tempEmail', data.email);
          onShowRegister({ googleData: data });
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          localStorage.setItem('role', data.role);
          if (data.email) localStorage.setItem('email', data.email);
          localStorage.setItem('isEmailVerified', 'true');
          onLogin(data.role);
        }
      } else setError(data.message);
    } catch (err) { setError('Google Login failed.'); }
    finally { setLoading(false); }
  }, [onLogin, onShowRegister]);

  useEffect(() => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });
      window.google.accounts.id.renderButton(googleButton.current, { theme: "outline", size: "large", width: "100%", text: "continue_with" });
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.email) localStorage.setItem('email', data.email);
        localStorage.setItem('isEmailVerified', data.isEmailVerified);
        onLogin(data.role);
      } else setError(data.message || 'Login failed.');
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '500px', margin: '60px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '10px' }}>Track Yourself</h1>
          <p className="welcome-text" style={{ color: 'var(--danger-glow)', fontWeight: '800', letterSpacing: '2px' }}>OR YOU SUCK</p>
      </div>

      <div ref={googleButton} style={{ marginBottom: '30px' }}></div>
      <div style={{ textAlign: 'center', margin: '25px 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '700' }}>OR</div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        </div>
        <div className="form-group" style={{ marginBottom: '40px' }}>
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                width: 'auto', height: 'auto', padding: '0', boxShadow: 'none'
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button type="button" className="btn-glass" onClick={onShowForgot} style={{ fontSize: '0.9rem', marginTop: '15px', padding: '10px 20px', width: 'auto' }}>
            Forgot Password?
          </button>
        </div>
        {error && <div style={{ color: 'var(--danger-glow)', marginBottom: '20px', textAlign: 'center', fontWeight: '700' }}>{error}</div>}
        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
        New here?{' '}
        <button className="btn-glass" onClick={() => onShowRegister()} style={{ padding: '10px 25px', marginLeft: '10px', width: 'auto' }}>
          Create Account
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button className="btn-glass" onClick={onShowPrivacy} style={{ fontSize: '0.8rem', opacity: 0.6, border: 'none', background: 'transparent' }}>
              Privacy Policy
          </button>
      </div>
    </div>
  );
};

export default LoginPage;