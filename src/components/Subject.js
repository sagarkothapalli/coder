import React, { useState, useEffect } from 'react';

const Subject = ({ subject, onUpdate, onDelete }) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = subject;
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate initial Absent count
  const initialAbsent = Math.max(0, totalClasses - attendedClasses - canceledClasses);

  // Edit States
  const [editName, setEditName] = useState(name);
  const [editAttended, setEditAttended] = useState(attendedClasses);
  const [editCanceled, setEditCanceled] = useState(canceledClasses);
  const [editAbsent, setEditAbsent] = useState(initialAbsent);

  // Sync state with props whenever subject changes
  useEffect(() => {
    setEditName(name);
    setEditAttended(attendedClasses);
    setEditCanceled(canceledClasses);
    setEditAbsent(Math.max(0, totalClasses - attendedClasses - canceledClasses));
  }, [subject, name, totalClasses, attendedClasses, canceledClasses]);

  const effectiveTotal = totalClasses - canceledClasses;
  
  const calculatePercentage = () => {
    if (effectiveTotal <= 0) return 0;
    return ((attendedClasses / effectiveTotal) * 100).toFixed(2);
  };

  const percentage = parseFloat(calculatePercentage());

  // Calculation for 75% target
  // Formula: (A + X) / (T + X) >= 0.75
  // A + X >= 0.75T + 0.75X
  // 0.25X >= 0.75T - A
  // X >= 3T - 4A
  const neededFor75 = Math.max(0, Math.ceil(3 * effectiveTotal - 4 * attendedClasses));
  
  // Buffer Calculation: How many can I miss?
  // A / (T + Y) >= 0.75 => Y <= (4A - 3T) / 3
  const bufferClasses = Math.max(0, Math.floor((4 * attendedClasses - 3 * effectiveTotal) / 3));

  const handleSave = () => {
    const newAttended = parseInt(editAttended, 10) || 0;
    const newCanceled = parseInt(editCanceled, 10) || 0;
    const newAbsent = parseInt(editAbsent, 10) || 0;
    
    // Recalculate Total based on the components
    const newTotal = newAttended + newCanceled + newAbsent;

    onUpdate({ 
      ...subject, 
      name: editName,
      totalClasses: newTotal,
      attendedClasses: newAttended,
      canceledClasses: newCanceled
    });
    setIsEditing(false);
  };

  const getBarColor = (p) => {
      if (p >= 75) return 'var(--success-color)';
      if (p >= 65) return 'var(--warning-color)';
      return 'var(--danger-color)';
  };

  return (
    <div className="subject-card">
      <div className="subject-header">
          <h3>{name}</h3>
          <div className="attendance-badge" style={{color: getBarColor(percentage)}}>
              {percentage}%
          </div>
      </div>
      
      {/* Sleek Bar Graph */}
      <div className="student-progress-bg">
          <div 
              className="student-progress-fill" 
              style={{ 
                  width: `${Math.min(100, percentage)}%`,
                  backgroundColor: getBarColor(percentage)
              }}
          ></div>
      </div>

      <div className="stats-row">
          <span>Attended: <strong>{attendedClasses} / {effectiveTotal}</strong></span>
          <span>Canceled: {canceledClasses}</span>
      </div>

      {/* Recommendation Message */}
      <div className="recommendation-box">
          {percentage < 75 ? (
              <p className="status-danger">
                  ⚠️ <strong>Action Required:</strong> Attend the next <strong>{neededFor75}</strong> class{neededFor75 !== 1 ? 'es' : ''} to reach 75%.
              </p>
          ) : (
              <p className="status-success">
                  ✅ <strong>On Track:</strong> {bufferClasses > 0 ? `You can safely miss ${bufferClasses} class${bufferClasses !== 1 ? 'es' : ''}.` : 'Keep maintaining your streak!'}
              </p>
          )}
      </div>

      {isEditing ? (
        <div className="edit-form-container">
          <div className="form-group">
            <label>Subject Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Attended Classes</label>
            <input
              type="number"
              min="0"
              value={editAttended}
              onChange={(e) => setEditAttended(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Canceled Classes</label>
            <input
              type="number"
              min="0"
              value={editCanceled}
              onChange={(e) => setEditCanceled(e.target.value)}
            />
          </div>
          <div className="edit-actions">
            <button onClick={() => {
                setEditAttended(0);
                setEditAbsent(0);
                setEditCanceled(0);
            }} className="action-btn deny" style={{backgroundColor: '#ffc107', color: 'black', marginRight: 'auto'}}>
                Reset Stats
            </button>
            <button onClick={handleSave} className="action-btn approve">Save & Recalculate</button>
            <button onClick={() => setIsEditing(false)} className="action-btn deny">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="subject-actions">
            <button onClick={() => onUpdate({ ...subject, attendedClasses: attendedClasses + 1, totalClasses: totalClasses + 1 })}>
              Present
            </button>
            <button onClick={() => onUpdate({ ...subject, totalClasses: totalClasses + 1 })}>
              Absent
            </button>
            <button 
                onClick={() => {
                    const currentAbsent = totalClasses - attendedClasses - canceledClasses;
                    if (currentAbsent > 0) {
                        onUpdate({ ...subject, totalClasses: totalClasses - 1 });
                    }
                }}
                style={{ backgroundColor: '#dc3545', color: 'white' }} 
                title="Remove one Absent"
            >
              Absent -
            </button>
            <button onClick={() => onUpdate({ ...subject, canceledClasses: canceledClasses + 1, totalClasses: totalClasses + 1 })}>
              Canceled
            </button>
            <button className="delete" onClick={() => onDelete(subject.id)}>
              Delete
            </button>
            <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default Subject;
