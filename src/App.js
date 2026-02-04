import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check token and role on app load
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
  }, []);

  const handleLogin = (userRole) => {
    setIsLoggedIn(true);
    // userRole should be a string 'STUDENT' or 'COORDINATOR'
    setRole(userRole);
    setShowRegister(false);
    setShowForgot(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
    setRole(null);
    setShowRegister(false);
    setShowForgot(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
  };

  return (
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
        />
      ) : showForgot ? (
        <ForgotPassword onBack={() => setShowForgot(false)} />
      ) : (
        <LoginPage 
          onLogin={handleLogin} 
          onShowRegister={() => setShowRegister(true)} 
          onShowForgot={() => setShowForgot(true)}
        />
      )}
    </div>
  );
}

export default App;