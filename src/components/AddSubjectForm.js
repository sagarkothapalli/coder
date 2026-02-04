import React, { useState } from 'react';

const AddSubjectForm = ({ onAddSubject }) => {
  const [name, setName] = useState('');
  const [totalClasses, setTotalClasses] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name) {
      onAddSubject({
        name,
        totalClasses: totalClasses ? parseInt(totalClasses, 10) : 0,
        attendedClasses: 0,
        canceledClasses: 0,
      });
      setName('');
      setTotalClasses('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
      <h3>Add New Subject</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="form-group">
            <label>Subject Name</label>
            <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mathematics"
            />
        </div>
        <div className="form-group">
            <label>Total Classes (Optional)</label>
            <input
            type="number"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            placeholder="0"
            />
        </div>
      </div>
      <button type="submit" className="cyber-btn" style={{ marginTop: '0' }}>Add Subject</button>
    </form>
  );
};

export default AddSubjectForm;
