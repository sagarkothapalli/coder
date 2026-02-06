import React, { useState, useEffect, useCallback } from 'react';

const CoordinatorDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('classes');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchSections = useCallback(async () => {
    try {
      const response = await fetch('/api/coordinator/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSections(data);
        if (data.length > 0 && !selectedSection) setSelectedSection(data[0]);
      }
    } catch (err) { console.error(err); }
  }, [token, selectedSection]);

  const fetchPending = useCallback(async () => {
    try {
        const response = await fetch('/api/coordinator/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setPendingUsers(await response.json());
    } catch (err) { console.error(err); }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/coordinator/section/${selectedSection}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setStudents(await response.json());
      else setError("Failed to load students");
    } catch (err) { setError("Network error"); }
    finally { setLoading(false); }
  }, [selectedSection, token]);

  useEffect(() => {
    if (token) { fetchSections(); fetchPending(); }
  }, [token, fetchSections, fetchPending]);

  useEffect(() => {
    if (activeTab === 'classes') fetchStudents();
  }, [activeTab, fetchStudents]);

  const handleReview = async (userId, action) => {
      try {
          const res = await fetch('/api/coordinator/review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ userId, action })
          });
          if (res.ok) { fetchPending(); alert("Success"); }
      } catch (err) { alert("Error"); }
  };

  const getStatusColor = (p) => {
    if (p >= 75) return 'var(--success-glow)';
    if (p >= 65) return 'var(--warning-glow)';
    return 'var(--danger-glow)';
  };

  return (
    <div className="attendance-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div className="header-title">
            <h1 style={{ margin: 0 }}>Coordinator Hub</h1>
            <p className="welcome-text" style={{ margin: 0 }}>Admin: <strong>{username}</strong></p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>Class View</button>
                <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                    Requests {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
                </button>
            </div>

            <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>

            <div className="user-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-glass" onClick={toggleTheme} style={{padding:'12px'}}>{theme === 'light' ? '🌙' : '☀️'}</button>
                <button className="btn-danger" onClick={onLogout} style={{ padding: '12px 24px' }}>Logout</button>
            </div>
        </div>
      </header>

      {activeTab === 'classes' && (
          <div className="glass-panel">
            <div className="controls" style={{maxWidth:'300px', marginBottom:'30px'}}>
                <label className="welcome-text">Select Section</label>
                <select value={selectedSection || ''} onChange={(e) => setSelectedSection(e.target.value)}>
                    {sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                </select>
            </div>

            <div className="table-container">
                {loading ? <p>Loading...</p> : error ? <p style={{color:'var(--danger-glow)'}}>{error}</p> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Roll No.</th>
                                <th>Name</th>
                                <th>Attendance Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} onClick={() => setSelectedStudent(student)} style={{ cursor: 'pointer' }}>
                                    <td><strong>#{student.rollNumber}</strong></td>
                                    <td>{student.username}</td>
                                    <td>
                                        <div className="progress-container" style={{width:'200px'}}>
                                            <div className="progress-bar" style={{ width: `${student.percentage}%`, backgroundColor: getStatusColor(student.percentage) }} />
                                        </div>
                                        <span style={{color: getStatusColor(student.percentage), fontWeight:'700', marginLeft:'10px'}}>{student.percentage}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
          </div>
      )}

      {activeTab === 'requests' && (
          <div className="glass-panel">
              <h3>Pending Authorizations</h3>
              <div className="table-container">
                  {pendingUsers.length === 0 ? <p>No pending requests.</p> : (
                      <table>
                          <thead>
                              <tr>
                                  <th>Username</th>
                                  <th>Date</th>
                                  <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {pendingUsers.map(user => (
                                  <tr key={user.id}>
                                      <td>{user.username}</td>
                                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                      <td>
                                          <div style={{ display: 'flex', gap: '10px' }}>
                                              <button className="btn-success" onClick={() => handleReview(user.id, 'APPROVE')}>Approve</button>
                                              <button className="btn-danger" onClick={() => handleReview(user.id, 'DENY')}>Deny</button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                    <h2>{selectedStudent.username} <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>#{selectedStudent.rollNumber}</span></h2>
                    <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
                </header>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Subject</th><th>Attended</th><th>Total</th><th>%</th></tr></thead>
                        <tbody>
                            {selectedStudent.subjects.map(sub => (
                                <tr key={sub.id}>
                                    <td>{sub.name}</td>
                                    <td>{sub.attended}</td>
                                    <td>{sub.total - sub.canceled}</td>
                                    <td><span style={{ color: getStatusColor(sub.percentage), fontWeight: 'bold' }}>{sub.percentage}%</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;