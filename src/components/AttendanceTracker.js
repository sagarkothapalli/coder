import React, { useState, useEffect, useCallback, useRef } from 'react';
import Subject from './Subject';
import AddSubjectForm from './AddSubjectForm';
import Dashboard from './Dashboard';

const GoogleLinkBanner = ({ onVerifySuccess }) => {
    const googleButton = useRef(null);

    const handleGoogleResponse = useCallback(async (response) => {
        try {
            const res = await fetch('/api/users/link-google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Success! Your Google Account is now linked.');
                localStorage.setItem('email', data.email);
                onVerifySuccess(data.email);
            } else {
                alert('Error linking account: ' + data.message);
            }
        } catch (error) {
            console.error('Google Link Error:', error);
            alert('Failed to connect to server.');
        }
    }, [onVerifySuccess]);

    useEffect(() => {
        /* eslint-disable-next-line no-undef */
        if (window.google && window.google.accounts) {
            const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
            if (!clientId) {
                console.warn("Google Client ID not found in environment variables.");
                return;
            }

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleResponse
            });
            
            window.google.accounts.id.renderButton(
                googleButton.current,
                { theme: "outline", size: "large", text: "continue_with" } 
            );
        }
    }, [handleGoogleResponse]);

    return (
        <div style={{
            backgroundColor: '#e8f0fe', 
            border: '1px solid #4285f4', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
        }}>
            <div>
                <strong style={{color: '#1a73e8'}}>⚠️ Security Update</strong>
                <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', color: '#5f6368'}}>
                    Please link your Google Account to secure your profile and enable easy login.
                </p>
            </div>
            <div ref={googleButton}></div>
        </div>
    );
};

const EmailVerificationBanner = ({ onVerifySuccess }) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Input Email, 2: Input OTP
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const sendOtp = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/send-verification-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setStep(2);
                setMsg('OTP sent to ' + email);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error sending OTP');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/verify-email-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Email verified successfully!');
                localStorage.setItem('email', data.email);
                onVerifySuccess(data.email);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeeba', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px'
        }}>
            <h4 style={{margin: '0 0 10px 0', color: '#856404'}}>⚠️ Action Required: Verify Email</h4>
            <p style={{fontSize: '0.9rem', marginBottom: '10px'}}>
                Please verify your email address to enable password recovery.
            </p>
            
            {step === 1 ? (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        style={{flex: 1, minWidth: '200px'}}
                    />
                    <button onClick={sendOtp} disabled={loading} className="cyber-btn" style={{marginTop: 0, width: 'auto'}}>
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </div>
            ) : (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <input 
                        type="text" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        style={{flex: 1, minWidth: '150px'}}
                    />
                    <button onClick={verifyOtp} disabled={loading} className="cyber-btn" style={{marginTop: 0, width: 'auto'}}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                    <button onClick={() => setStep(1)} style={{background:'none', border:'none', textDecoration:'underline', cursor:'pointer'}}>Change Email</button>
                </div>
            )}
            {msg && <p style={{fontSize: '0.85rem', color: 'green', marginTop: '5px'}}>{msg}</p>}
        </div>
    );
};

const AttendanceTracker = ({ onLogout }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email'));
  const [isVerified, setIsVerified] = useState(localStorage.getItem('isEmailVerified') === 'true');

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  const onVerificationComplete = (email) => {
      setUserEmail(email);
      setIsVerified(true);
      localStorage.setItem('isEmailVerified', 'true');
  };

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
      } else {
        setError(data.message + (data.error ? `: ${data.error}` : ''));
        if (response.status === 401) { // Token expired or invalid
          onLogout();
        }
      }
    } catch (err) {
      setError('Network error or server unreachable.');
      console.error("Fetch subjects error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    if (token) {
      fetchSubjects();
    } else {
      setLoading(false);
    }
  }, [token, fetchSubjects]);

  const addSubject = async (subject) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subject),
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects((prevSubjects) => [...prevSubjects, data]);
      } else {
        setError(data.message || 'Failed to add subject');
        if (response.status === 401) {
          onLogout();
        }
      }
    } catch (err) {
      setError('Network error or server unreachable.');
      console.error("Add subject error:", err);
    }
  };

  const updateSubject = async (updatedSubject) => {
    try {
      const response = await fetch(`/api/subjects/${updatedSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSubject),
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.id === updatedSubject.id ? data : subject
          )
        );
      } else {
        setError(data.message || 'Failed to update subject');
        if (response.status === 401) {
          onLogout();
        }
      }
    } catch (err) {
      setError('Network error or server unreachable.');
      console.error("Update subject error:", err);
    }
  };

  const deleteSubject = async (subjectId) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setSubjects((prevSubjects) => prevSubjects.filter((subject) => subject.id !== subjectId));
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete subject');
        if (response.status === 401) {
          onLogout();
        }
      }
    } catch (err) {
      setError('Network error or server unreachable.');
      console.error("Delete subject error:", err);
    }
  };

  if (loading) {
    return <div className="attendance-tracker">Loading subjects...</div>;
  }

  if (error) {
    return <div className="attendance-tracker error">Error: {error}</div>;
  }

  if (showDashboard) {
    return <Dashboard subjects={subjects} onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="attendance-tracker">
      <header>
        <div className="header-title">
            <h1>My Attendance</h1>
            <p className="welcome-text">Student: <strong>{username}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="logout-btn" onClick={() => setShowDashboard(true)}>Dashboard</button>
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      {/* Show Google Link Banner OR Email Verification if no email is linked or not verified */}
      {!isVerified && (
        <>
            <GoogleLinkBanner onVerifySuccess={onVerificationComplete} />
            <div style={{textAlign: 'center', margin: '10px 0', color: '#666'}}>- OR -</div>
            <EmailVerificationBanner onVerifySuccess={onVerificationComplete} />
        </>
      )}

      <AddSubjectForm onAddSubject={addSubject} />
      <div className="subjects-list">
        {subjects.length === 0 ? (
          <p>No subjects added yet. Add your first subject above!</p>
        ) : (
          subjects.map((subject) => (
            <Subject
              key={subject.id}
              subject={subject}
              onUpdate={updateSubject}
              onDelete={deleteSubject}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
