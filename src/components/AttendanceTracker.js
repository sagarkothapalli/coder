import React, { useState, useEffect, useCallback } from 'react';
import Subject from './Subject';
import AddSubjectForm from './AddSubjectForm';
import Dashboard from './Dashboard';

const AttendanceTracker = ({ onLogout }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

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
        <h2>Welcome, <span className="username">{username}</span></h2>
        <div>
          <button onClick={() => setShowDashboard(true)}>Show Dashboard</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>
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