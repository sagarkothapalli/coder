import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPassword from './components/ForgotPassword';
import AttendanceTracker from './components/AttendanceTracker';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [googleData, setGoogleData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = useCallback((userRole) => {
    setIsLoggedIn(true);
    setShowRegister(false);
    setShowForgot(false);
    setShowPrivacy(false);
    setGoogleData(null);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('isEmailVerified');
    setIsLoggedIn(false);
    setShowRegister(false);
    setShowForgot(false);
    setShowPrivacy(false);
    setGoogleData(null);
  }, []);

  const handleRegisterSuccess = useCallback(() => {
    setShowRegister(false);
    setShowPrivacy(false);
    setGoogleData(null);
  }, []);

  const handleShowRegister = useCallback((gData = null) => {
      setGoogleData(gData);
      setShowRegister(true);
      setShowPrivacy(false);
  }, []);

  return (
    <div className="App-Wrapper">
      <div className="liquid-bg">
        <div className="blob"></div>
      </div>
      <div className="disclaimer-banner">
        ⚠️ This is a student project for demonstration purposes only. Not valid for official college access.
      </div>
      <div className="App">
        {showPrivacy ? (
            <PrivacyPolicy onBack={() => setShowPrivacy(false)} />
        ) : isLoggedIn ? (
            <AttendanceTracker onLogout={handleLogout} onShowPrivacy={() => setShowPrivacy(true)} />
        ) : showRegister ? (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onShowLogin={() => setShowRegister(false)}
            onShowPrivacy={() => setShowPrivacy(true)}
            googleData={googleData}
          />
        ) : showForgot ? (
          <ForgotPassword onBack={() => setShowForgot(false)} />
        ) : (
          <LoginPage 
            onLogin={handleLogin} 
            onShowRegister={handleShowRegister} 
            onShowForgot={() => setShowForgot(true)}
            onShowPrivacy={() => setShowPrivacy(true)}
          />
        )}
      </div>
    </div>
  );
}

export default App;