import React, { useState, useEffect } from 'react';

const RegisterPage = ({ onRegisterSuccess, onShowLogin, onShowPrivacy, googleData }) => {
  const [username, setUsername] = useState(googleData ? googleData.name : '');
  const [email, setEmail] = useState(googleData ? googleData.email : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (googleData) {
      setUsername(googleData.name || '');
      setEmail(googleData.email || '');
    }
  }, [googleData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const isGoogle = !!googleData;
    const endpoint = isGoogle ? '/api/users/google-register' : '/api/users/register';
    // Force role to STUDENT
    const body = { 
        username, 
        email, 
        role: 'STUDENT', 
        rollNumber: parseInt(rollNumber, 10) 
    };
    if (isGoogle) body.token = localStorage.getItem('tempGoogleToken');
    else body.password = password;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message);
        if (isGoogle) {
            localStorage.removeItem('tempGoogleToken');
            localStorage.removeItem('tempEmail');
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            localStorage.setItem('email', data.email);
            localStorage.setItem('isEmailVerified', 'true');
            setTimeout(() => window.location.reload(), 1500);
        } else setTimeout(() => onRegisterSuccess(), 2000);
      } else setError(data.message || 'Registration failed.');
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '540px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>{googleData ? 'Complete Profile' : 'Join Us'}</h2>
          <p className="welcome-text">{googleData ? 'Just a few more details' : 'Start tracking your attendance like a pro'}</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name / Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} disabled={!!googleData} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
            <label>Roll Number</label>
            <input type="number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
        </div>

        {!googleData && (
            <div className="form-group" style={{marginBottom: '30px'}}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, width: 'auto', boxShadow: 'none' }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
        )}

        {error && <div style={{color:'var(--danger-glow)', textAlign:'center', marginBottom:'15px'}}>{error}</div>}
        {successMsg && <div style={{color:'var(--success-glow)', textAlign:'center', marginBottom:'15px'}}>{successMsg}</div>}
        
        <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Processing...' : (googleData ? 'Finish Up' : 'Create Account')}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <button className="btn-glass" onClick={() => {
              if (googleData) {
                  localStorage.removeItem('tempGoogleToken');
                  localStorage.removeItem('tempEmail');
              }
              onShowLogin();
          }}>
            {googleData ? 'Cancel' : 'Back to Login'}
          </button>

          <button className="btn-glass" onClick={onShowPrivacy} style={{ fontSize: '0.8rem', opacity: 0.6, border: 'none', background: 'transparent' }}>
              Privacy Policy
          </button>
      </div>
    </div>
  );
};

export default RegisterPage;