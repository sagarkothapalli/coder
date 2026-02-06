import React, { useState } from 'react';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setStep(2);
      } else setError(data.message);
    } catch (err) { setError("Network error."); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Password reset successful! Please login.");
        onBack();
      } else setError(data.message);
    } catch (err) { setError("Network error."); }
  };

  return (
    <div className="glass-panel" style={{maxWidth: '480px', margin: '40px auto'}}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Recover Account</h2>
          <p className="welcome-text">
            {step === 1 ? "We'll send you a verification code" : "Check your email for the code"}
          </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleRequestOtp}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <div style={{color:'var(--danger-glow)', textAlign:'center', marginBottom:'10px'}}>{error}</div>}
          {message && <div style={{color:'var(--success-glow)', textAlign:'center', marginBottom:'10px'}}>{message}</div>}
          <button type="submit" className="btn-primary" style={{width: '100%'}}>Send Code</button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label>Code</label>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          </div>
          <div className="form-group" style={{marginBottom: '30px'}}>
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, width: 'auto', boxShadow: 'none' }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && <div style={{color:'var(--danger-glow)', textAlign:'center', marginBottom:'10px'}}>{error}</div>}
          <button type="submit" className="btn-primary" style={{width: '100%'}}>Reset Password</button>
        </form>
      )}

      <div style={{textAlign: 'center', marginTop: '30px'}}>
        <button className="btn-glass" onClick={onBack}>Back to Login</button>
      </div>
    </div>
  );
};

export default ForgotPassword;