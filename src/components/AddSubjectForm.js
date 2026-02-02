import React, { useState } from 'react';

const AddSubjectForm = ({ onAddSubject }) => {
  const [name, setName] = useState('');
  const [totalClasses, setTotalClasses] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && totalClasses) {
      onAddSubject({
        name,
        totalClasses: parseInt(totalClasses, 10),
        attendedClasses: 0,
        canceledClasses: 0,
      });
      setName('');
      setTotalClasses('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-subject-form">
      <h3>Add New Subject</h3>
      <div className="form-group">
        <label>Subject Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Total Classes</label>
        <input
          type="number"
          value={totalClasses}
          onChange={(e) => setTotalClasses(e.target.value)}
        />
      </div>
      <button type="submit">Add Subject</button>
    </form>
  );
};

export default AddSubjectForm;