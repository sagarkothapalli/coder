import React, { useState, useEffect } from 'react';

const Subject = ({ subject, onUpdate, onDelete }) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = subject;
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState(name);
  const [editAttended, setEditAttended] = useState(attendedClasses);
  const [editCanceled, setEditCanceled] = useState(canceledClasses);

  useEffect(() => {
    setEditName(name);
    setEditAttended(attendedClasses);
    setEditCanceled(canceledClasses);
  }, [subject, name, attendedClasses, canceledClasses]);

  const effectiveTotal = totalClasses - canceledClasses;
  
  const calculatePercentage = () => {
    if (effectiveTotal <= 0) return 0;
    return ((attendedClasses / effectiveTotal) * 100).toFixed(1);
  };

  const percentage = parseFloat(calculatePercentage());
  const neededFor75 = Math.max(0, Math.ceil(3 * effectiveTotal - 4 * attendedClasses));
  const bufferClasses = Math.max(0, Math.floor((4 * attendedClasses - 3 * effectiveTotal) / 3));

  const handleSave = () => {
    onUpdate({ 
      ...subject, 
      name: editName,
      totalClasses: (parseInt(editAttended) || 0) + (totalClasses - attendedClasses - canceledClasses) + (parseInt(editCanceled) || 0),
      attendedClasses: parseInt(editAttended) || 0,
      canceledClasses: parseInt(editCanceled) || 0
    });
    setIsEditing(false);
  };

  const getStatusColor = (p) => {
      if (p >= 75) return 'var(--success-glow)';
      if (p >= 65) return 'var(--warning-glow)';
      return 'var(--danger-glow)';
  };

  return (
    <div className="subject-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{name}</h3>
              <p className="welcome-text" style={{ marginTop: '5px' }}>
                  {attendedClasses} / {effectiveTotal} attended
              </p>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: getStatusColor(percentage) }}>
              {Math.round(percentage)}%
          </div>
      </div>

      <div className="progress-container">
          <div 
              className="progress-bar" 
              style={{ 
                  width: `${Math.min(100, percentage)}%`, 
                  background: getStatusColor(percentage),
                  boxShadow: `0 0 20px ${getStatusColor(percentage)}`,
                  willChange: 'width'
              }}
          />
      </div>

      <div style={{ marginBottom: '25px' }}>
          {percentage < 75 ? (
              <div style={{ color: 'var(--danger-glow)', fontWeight: '700', fontSize: '1rem' }}>
                  ⚠️ Attend next {neededFor75} classes to hit 75%.
              </div>
          ) : (
              <div style={{ color: 'var(--success-glow)', fontWeight: '700', fontSize: '1rem' }}>
                  ✅ Safe to miss {bufferClasses} classes.
              </div>
          )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label>Subject Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
                <label>Attended</label>
                <input type="number" value={editAttended} onChange={(e) => setEditAttended(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Canceled</label>
                <input type="number" value={editCanceled} onChange={(e) => setEditCanceled(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>Save</button>
            <button onClick={() => setIsEditing(false)} className="btn-glass">Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button className="btn-primary" onClick={() => onUpdate({ ...subject, attendedClasses: attendedClasses + 1, totalClasses: totalClasses + 1 })}>
              Present
            </button>
            <button className="btn-danger" onClick={() => onUpdate({ ...subject, totalClasses: totalClasses + 1 })}>
              Absent
            </button>
            <button 
                className="btn-glass"
                onClick={() => {
                    const currentAbsent = totalClasses - attendedClasses - canceledClasses;
                    if (currentAbsent > 0) onUpdate({ ...subject, totalClasses: totalClasses - 1 });
                }}
                style={{ color: 'var(--danger-glow)', border: '1px solid rgba(255,59,48,0.3)' }}
            >
              Absent -
            </button>
            <button className="btn-glass" onClick={() => onUpdate({ ...subject, canceledClasses: canceledClasses + 1, totalClasses: totalClasses + 1 })}>
              Canceled
            </button>
            <button className="btn-glass" style={{ gridColumn: 'span 2', fontSize: '0.9rem', opacity: 0.8 }} onClick={() => setIsEditing(true)}>
                Edit Subject
            </button>
            <button className="btn-glass" style={{ gridColumn: 'span 2', color: 'var(--danger-glow)', border: 'none', background: 'transparent', fontSize: '0.8rem', opacity: 0.5 }} onClick={() => onDelete(subject.id)}>
              Delete Subject
            </button>
        </div>
      )}
    </div>
  );
};

export default Subject;