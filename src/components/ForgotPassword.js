import React, { useState } from 'react';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error.");
    }
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
        onBack(); // Go back to login
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error.");
    }
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2>Account Recovery</h2>
          <p className="welcome-text">
            {step === 1 ? "Enter your email to receive a code" : "Enter the code sent to your email"}
          </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleRequestOtp}>
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
          {error && <div className="error-msg">{error}</div>}
          {message && <div className="status-success" style={{textAlign: 'center', marginBottom: '10px'}}>{message}</div>}
          <button type="submit">Send Verification Code</button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label>Verification Code (OTP)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New strong password"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit">Reset Password</button>
        </form>
      )}

      <div className="footer-text">
        <button className="link-button" onClick={onBack}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
