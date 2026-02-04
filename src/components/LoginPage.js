import React, { useState } from 'react';

const LoginPage = ({ onLogin, onShowRegister, onShowForgot }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.email) localStorage.setItem('email', data.email);
        
        onLogin(data.role); // Pass ONLY the role string up to App.js
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login Error:', err);
    }
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Welcome Back</h2>
          <p className="welcome-text">Please sign in to continue</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: '100%', paddingRight: '40px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#666'
              }}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button type="button" className="link-button" onClick={onShowForgot} style={{fontSize: '0.8rem', marginTop: '5px'}}>
            Forgot Password?
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit">Sign In</button>
      </form>
      <div className="footer-text">
        Don't have an account?{' '}
        <button className="link-button" onClick={onShowRegister}>
          Create Account
        </button>
      </div>
    </div>
  );
};

export default LoginPage;