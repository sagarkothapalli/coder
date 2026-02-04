import React, { useState } from 'react';

const RegisterPage = ({ onRegisterSuccess, onShowLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username, 
            email, 
            password, 
            role, 
            rollNumber: role === 'STUDENT' ? parseInt(rollNumber, 10) : undefined 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message);
        setTimeout(() => {
             onRegisterSuccess(); // Switch to login view
        }, 2000);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration Error:', err);
    }
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Create Account</h2>
          <p className="welcome-text">Join us to track your attendance</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            required
          />
        </div>

        <div className="form-group">
             <label>Role</label>
             <select value={role} onChange={(e) => setRole(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}>
                 <option value="STUDENT">Student</option>
                 <option value="COORDINATOR">Coordinator</option>
             </select>
        </div>

        {role === 'STUDENT' && (
            <div className="form-group">
              <label>Roll Number</label>
              <input
                type="number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 123"
                required
              />
            </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
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
        </div>

        {error && <div className="error-msg">{error}</div>}
        {successMsg && <div className="status-success" style={{textAlign: 'center', marginBottom: '10px'}}>{successMsg}</div>}
        
        <button type="submit">Create Account</button>
      </form>
      <div className="footer-text">
        Already have an account?{' '}
        <button className="link-button" onClick={onShowLogin}>
          Sign In
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
