import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Subject from './Subject';
import AddSubjectForm from './AddSubjectForm';
import Dashboard from './Dashboard';
import CGPACalculator from './CGPACalculator';
import TodoList from './TodoList';

const GoogleLinkBanner = ({ onVerifySuccess }) => {
    const googleButton = useRef(null);
    const handleGoogleResponse = useCallback(async (response) => {
        try {
            const res = await fetch('/api/users/link-google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Success! Your Google Account is now linked.');
                localStorage.setItem('email', data.email);
                onVerifySuccess(data.email);
            }
        } catch (error) { console.error(error); }
    }, [onVerifySuccess]);

    useEffect(() => {
        if (window.google && window.google.accounts) {
            window.google.accounts.id.initialize({ client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
            window.google.accounts.id.renderButton(googleButton.current, { theme: "outline", size: "large", text: "continue_with" });
        }
    }, [handleGoogleResponse]);

    return (
        <div className="banner-glass info">
            <div className="banner-text">
                <strong>⚠️ Security Update</strong>
                <p>Please link your Google Account to secure your profile.</p>
            </div>
            <div ref={googleButton}></div>
        </div>
    );
};

const EmailVerificationBanner = ({ onVerifySuccess }) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const sendOtp = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/send-verification-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ email })
            });
            if (res.ok) setStep(2);
        } finally { setLoading(false); }
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/verify-email-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('email', data.email);
                onVerifySuccess(data.email);
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="banner-glass warning">
            <div className="banner-text">
                <h4>⚠️ Verify Email</h4>
                <p>Verify your email to enable password recovery.</p>
                <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <input type={step === 1 ? "email" : "text"} value={step === 1 ? email : otp} onChange={(e) => step === 1 ? setEmail(e.target.value) : setOtp(e.target.value)} placeholder={step === 1 ? "Email" : "OTP"} />
                    <button onClick={step === 1 ? sendOtp : verifyOtp} disabled={loading} className="btn-primary">{loading ? '...' : (step === 1 ? 'Send' : 'Verify')}</button>
                </div>
            </div>
        </div>
    );
};

const AttendanceTracker = ({ onLogout }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCgpa, setShowCgpa] = useState(false);
  const [showTodo, setShowTodo] = useState(false);
  const [isVerified, setIsVerified] = useState(localStorage.getItem('isEmailVerified') === 'true');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const switchView = (view) => {
    setShowDashboard(false);
    setShowCgpa(view === 'cgpa');
    setShowTodo(view === 'todo');
  };

  const onVerificationComplete = (email) => {
      setIsVerified(true);
      localStorage.setItem('isEmailVerified', 'true');
  };

  // Robust Fetcher
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
          if (res.status === 401) return onLogout();
          throw new Error("Failed to load.");
        }
        const data = await res.json();
        if (isMounted) {
          setSubjects(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [token, onLogout]);

  // AI Categorization
  const isLab = useCallback((name) => {
    const n = name.toLowerCase();
    return ['lab', 'laboratory', 'practical', 'workshop', 'project', 'viva'].some(k => n.includes(k));
  }, []);

  const labSubjects = useMemo(() => subjects.filter(s => isLab(s.name)), [subjects, isLab]);
  const basicSubjects = useMemo(() => subjects.filter(s => !isLab(s.name)), [subjects, isLab]);

  const addSubject = async (subject) => {
    // Duplicate Check (Case-Insensitive)
    const exists = subjects.some(s => s.name.toLowerCase() === subject.name.toLowerCase());
    if (exists) {
        alert("Subject already exists!");
        return;
    }

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subject),
      });
      if (res.ok) {
        const newSubject = await res.json();
        setSubjects(prev => [...prev, newSubject]);
      }
    } catch (e) {}
  };

  const updateSubject = async (updated) => {
    try {
      const res = await fetch(`/api/subjects/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
      if (res.ok) setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (e) {}
  };

  const deleteSubject = async (id) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (e) {}
  };

  if (loading) return <div className="glass-panel" style={{textAlign:'center', margin:'100px auto', maxWidth:'400px'}}><h2>Initializing Cockpit...</h2><p>Syncing mission data...</p></div>;
  if (error) return <div className="glass-panel" style={{textAlign:'center', color:'var(--danger-glow)'}}><h2>System Error</h2><p>{error}</p><button className="btn-primary" onClick={() => window.location.reload()}>Retry Ignition</button></div>;

  if (showDashboard) return <Dashboard subjects={subjects} onBack={() => setShowDashboard(false)} />;

  return (
    <div className="attendance-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div className="header-title">
            <h1 style={{ margin: 0 }}>My Attendance</h1>
            <p className="welcome-text" style={{ margin: 0 }}>Student: <strong>{username}</strong></p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className={`btn-glass ${!showCgpa && !showTodo ? 'active' : ''}`} onClick={() => switchView('attendance')}>
                    📅 App
                </button>
                <button className={`btn-glass ${showCgpa ? 'active' : ''}`} onClick={() => switchView('cgpa')}>
                    🎓 CGPA
                </button>
                <button className={`btn-glass ${showTodo ? 'active' : ''}`} onClick={() => switchView('todo')}>
                    ✓ Tasks
                </button>
                <button className="btn-glass" onClick={() => setShowDashboard(true)}>Stats</button>
            </div>

            <div className="user-actions" style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                <button className="btn-glass" onClick={toggleTheme} title="Toggle Theme" style={{ padding: '12px', width: 'auto' }}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <button className="btn-danger" onClick={onLogout} style={{ padding: '12px 24px' }}>
                    Logout
                </button>
            </div>
        </div>
      </header>

      {!isVerified && (
        <div style={{display:'flex', flexDirection:'column', gap:'20px', marginBottom: '40px'}}>
            <GoogleLinkBanner onVerifySuccess={onVerificationComplete} />
            <EmailVerificationBanner onVerifySuccess={onVerificationComplete} />
        </div>
      )}

      {showCgpa ? <CGPACalculator /> : showTodo ? <TodoList /> : (
        <>
          <div className="glass-panel" style={{marginBottom: '40px'}}><AddSubjectForm onAddSubject={addSubject} /></div>
          {basicSubjects.length > 0 && (
            <section>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', borderLeft: '6px solid var(--primary-glow)', paddingLeft: '15px' }}>Basic Subjects</h2>
              <div className="subjects-list">{basicSubjects.map((s) => (<Subject key={s.id} subject={s} onUpdate={updateSubject} onDelete={deleteSubject} />))}</div>
            </section>
          )}
          {labSubjects.length > 0 && (
            <section style={{ marginTop: '60px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', borderLeft: '6px solid var(--success-glow)', paddingLeft: '15px' }}>Lab Section</h2>
              <div className="subjects-list">{labSubjects.map((s) => (<Subject key={s.id} subject={s} onUpdate={updateSubject} onDelete={deleteSubject} />))}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceTracker;
