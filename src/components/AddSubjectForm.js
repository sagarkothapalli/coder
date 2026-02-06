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
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '25px', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Add New Subject</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        <div className="form-group">
            <label>Subject Name</label>
            <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mathematics"
            required
            />
        </div>
        <div className="form-group">
            <label>Current Total Classes (Optional)</label>
            <input
            type="number"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            placeholder="0"
            />
        </div>
      </div>
      <button type="submit" className="btn-primary" style={{ width: 'auto', minWidth: '220px', height: '50px' }}>
        Create Subject
      </button>
    </form>
  );
};

export default AddSubjectForm;
