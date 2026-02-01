import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AttendanceTracker from './components/AttendanceTracker';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check if a token exists in localStorage on app load
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowRegister(false); // Hide register page after successful login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setShowRegister(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false); // Go back to login after successful registration
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleShowLogin = () => {
    setShowRegister(false);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <AttendanceTracker onLogout={handleLogout} />
      ) : showRegister ? (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onShowLogin={handleShowLogin}
        />
      ) : (
        <LoginPage onLogin={handleLogin} onShowRegister={handleShowRegister} />
      )}
    </div>
  );
}

export default App;
