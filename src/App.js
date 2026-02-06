import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPassword from './components/ForgotPassword';
import AttendanceTracker from './components/AttendanceTracker';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [googleData, setGoogleData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
  }, []);

  const handleLogin = useCallback((userRole) => {
    setIsLoggedIn(true);
    setRole(userRole);
    setShowRegister(false);
    setShowForgot(false);
    setGoogleData(null);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('isEmailVerified');
    setIsLoggedIn(false);
    setRole(null);
    setShowRegister(false);
    setShowForgot(false);
    setGoogleData(null);
  }, []);

  const handleRegisterSuccess = useCallback(() => {
    setShowRegister(false);
    setGoogleData(null);
  }, []);

  const handleShowRegister = useCallback((gData = null) => {
      setGoogleData(gData);
      setShowRegister(true);
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
        {isLoggedIn ? (
          role === 'COORDINATOR' ? (
              <CoordinatorDashboard onLogout={handleLogout} />
          ) : (
              <AttendanceTracker onLogout={handleLogout} />
          )
        ) : showRegister ? (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onShowLogin={() => setShowRegister(false)}
            googleData={googleData}
          />
        ) : showForgot ? (
          <ForgotPassword onBack={() => setShowForgot(false)} />
        ) : (
          <LoginPage 
            onLogin={handleLogin} 
            onShowRegister={handleShowRegister} 
            onShowForgot={() => setShowForgot(true)}
          />
        )}
      </div>
    </div>
  );
}

export default App;