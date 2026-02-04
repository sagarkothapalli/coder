import React, { useState, useEffect, useCallback } from 'react';

const CoordinatorDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'requests'
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // For Modal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  // --- Fetch Methods ---

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
        if (response.ok) {
            const data = await response.json();
            setPendingUsers(data);
        }
    } catch (err) { console.error(err); }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    if (!selectedSection) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/coordinator/section/${selectedSection}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      } else {
        setError(data.message || "Failed to load students");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [selectedSection, token]);

  // --- Effects ---

  useEffect(() => {
    if (token) {
        fetchSections();
        fetchPending();
    } else {
        setLoading(false);
    }
  }, [token, fetchSections, fetchPending]);

  useEffect(() => {
    if (activeTab === 'classes') fetchStudents();
  }, [activeTab, fetchStudents]);

  // --- Handlers ---

  const handleReview = async (userId, action) => {
      try {
          const response = await fetch('/api/coordinator/review', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ userId, action })
          });
          if (response.ok) {
              // Refresh pending list
              fetchPending();
              alert(action === 'APPROVE' ? "User Approved" : "User Denied");
          } else {
              alert("Action failed");
          }
      } catch (err) {
          alert("Network error");
      }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return 'var(--success-color)';
    if (percentage >= 65) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  return (
    <div className="coordinator-dashboard">
      <header>
        <div className="header-title">
            <h1>Coordinator Dashboard</h1>
            <p className="welcome-text">Logged in as: <strong>{username}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
                className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
                onClick={() => setActiveTab('classes')}
            >
                Class View
            </button>
            <button 
                className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
                style={{ position: 'relative' }}
            >
                Access Requests
                {pendingUsers.length > 0 && (
                    <span className="badge">{pendingUsers.length}</span>
                )}
            </button>
            <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      {/* --- CLASS VIEW TAB --- */}
      {activeTab === 'classes' && (
          <>
            <div className="controls-container">
                <div className="form-group" style={{ maxWidth: '250px' }}>
                    <label>Select Section</label>
                    <select 
                        value={selectedSection || ''} 
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={sections.length === 0}
                    >
                        {sections.map(sec => (
                            <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading student data...</div>
                ) : error ? (
                    <div className="error-msg">{error}</div>
                ) : students.length === 0 ? (
                    <div className="empty-state">No students found in Section {selectedSection}</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Roll No.</th>
                                <th style={{ width: '25%' }}>Student Name</th>
                                <th>Attendance Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const color = getStatusColor(student.percentage);
                                                        return (
                                                            <tr key={student.id} onClick={() => setSelectedStudent(student)} style={{ cursor: 'pointer' }}>
                                                                <td><strong>#{student.rollNumber}</strong></td>
                                                                <td>{student.username}</td>
                                                                <td>
                                                                    <div className="progress-wrapper">
                                                                        <div className="progress-track">
                                                                            <div 
                                                                                className="progress-fill" 
                                                                                style={{ 
                                                                                    width: `${student.percentage}%`,
                                                                                    backgroundColor: color
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="percentage-badge" style={{ 
                                                                            color: color, 
                                                                            backgroundColor: `${color}15` // 10% opacity hex
                                                                        }}>
                                                                            {student.percentage}%
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                      </div>
                                
                                      {/* --- STUDENT DETAIL MODAL --- */}
                                      {selectedStudent && (
                                        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                                <header className="modal-header">
                                                    <h3>{selectedStudent.username} <span style={{fontSize: '0.9rem', color: '#666'}}>#{selectedStudent.rollNumber}</span></h3>
                                                    <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
                                                </header>
                                                
                                                <div className="modal-body">
                                                    {selectedStudent.subjects.length === 0 ? (
                                                        <p>No subjects enrolled.</p>
                                                    ) : (
                                                        <table className="detail-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Subject</th>
                                                                    <th>Attended</th>
                                                                    <th>Total</th>
                                                                    <th>%</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedStudent.subjects.map(sub => (
                                                                    <tr key={sub.id}>
                                                                        <td>{sub.name}</td>
                                                                        <td>{sub.attended}</td>
                                                                        <td>{sub.total - sub.canceled}</td>
                                                                        <td>
                                                                            <span style={{ 
                                                                                color: getStatusColor(sub.percentage),
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {sub.percentage}%
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                      )}
                                    </>
                                  )}
      {/* --- ACCESS REQUESTS TAB --- */}
      {activeTab === 'requests' && (
          <div className="table-container">
              <h3>Pending Coordinator Requests</h3>
              {pendingUsers.length === 0 ? (
                  <div className="empty-state">No pending requests at this time.</div>
              ) : (
                  <table>
                      <thead>
                          <tr>
                              <th>Username</th>
                              <th>Requested On</th>
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
                                          <button 
                                            className="action-btn approve"
                                            onClick={() => handleReview(user.id, 'APPROVE')}
                                          >
                                              Approve
                                          </button>
                                          <button 
                                            className="action-btn deny"
                                            onClick={() => handleReview(user.id, 'DENY')}
                                          >
                                              Deny
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
          </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
