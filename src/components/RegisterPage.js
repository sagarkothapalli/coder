import React, { useState } from 'react';

const RegisterPage = ({ onRegisterSuccess, onShowLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! Please log in.');
        onRegisterSuccess();
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {message && <p className="message">{message}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account?{' '}
        <button className="link-button" onClick={onShowLogin}>
          Login
        </button>
      </p>
    </div>
  );
};

export default RegisterPage;
