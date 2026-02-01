import React, { useState } from 'react';

const Subject = ({ subject, onUpdate, onDelete }) => {
  const { name, totalClasses, attendedClasses, canceledClasses } = subject;
  const [isEditing, setIsEditing] = useState(false);
  const [newTotalClasses, setNewTotalClasses] = useState(totalClasses);

  const calculatePercentage = () => {
    const effectiveTotal = totalClasses - canceledClasses;
    if (effectiveTotal <= 0) {
      return 0;
    }
    return ((attendedClasses / effectiveTotal) * 100).toFixed(2);
  };

  const handleSave = () => {
    onUpdate({ ...subject, totalClasses: parseInt(newTotalClasses, 10) });
    setIsEditing(false);
  };

  return (
    <div className="subject-card">
      <h3>{name}</h3>
      {isEditing ? (
        <div className="form-group">
          <label>Total Classes</label>
          <input
            type="number"
            value={newTotalClasses}
            onChange={(e) => setNewTotalClasses(e.target.value)}
          />
        </div>
      ) : (
        <p>
          Attended: {attendedClasses} / {totalClasses - canceledClasses}
        </p>
      )}
      <p>Canceled: {canceledClasses}</p>
      <p>Attendance: {calculatePercentage()}%</p>
      <div className="subject-actions">
        {isEditing ? (
          <button onClick={handleSave}>Save</button>
        ) : (
          <>
            <button onClick={() => onUpdate({ ...subject, attendedClasses: attendedClasses + 1 })}>
              + Attended
            </button>
            <button onClick={() => onUpdate({ ...subject, canceledClasses: canceledClasses + 1 })}>
              + Canceled
            </button>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button className="delete" onClick={() => onDelete(subject.id)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Subject;
