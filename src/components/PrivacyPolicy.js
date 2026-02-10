import React from 'react';

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="attendance-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Privacy Policy</h1>
          <p className="welcome-text">Last Updated: Tuesday, 10 February 2026</p>
        </div>
        <button className="btn-glass" onClick={onBack}>Back to Login</button>
      </header>

      <div className="glass-panel" style={{ textAlign: 'left', lineHeight: '1.8', fontSize: '1.1rem' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>1. Our Privacy Philosophy: "Student First"</h2>
          <p>The App is designed as a <strong>personal academic productivity tool</strong>. We believe that your academic data belongs to you. Unlike institutional systems, this App is for your personal tracking and does not automatically share your data with universities, professors, or coordinators.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>2. Information We Collect</h2>
          <div style={{ paddingLeft: '20px' }}>
            <h3 style={{ color: 'var(--text-main)', marginTop: '20px' }}>A. Personal Information</h3>
            <ul>
              <li><strong>Account Data:</strong> Name, Email Address, and Password. For Google Sign-In users, we collect the email address and basic profile info provided by Google.</li>
              <li><strong>Academic Identifiers:</strong> Roll Number, Semester, and Section (used solely for your personal profile).</li>
            </ul>
            
            <h3 style={{ color: 'var(--text-main)', marginTop: '20px' }}>B. Educational & Behavioral Data</h3>
            <ul>
              <li><strong>Attendance Records:</strong> Subject names, counts of attended/total/canceled classes, and calculated percentages.</li>
              <li><strong>Attendance History Logs:</strong> Specific timestamps of when you mark yourself present or absent to generate trend analytics.</li>
              <li><strong>Performance Data:</strong> SGPA and CGPA records you choose to input for weighted average calculations.</li>
              <li><strong>Productivity Data:</strong> Task lists and notes created in the "Todo" section.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>3. How We Use Your Data</h2>
          <ul>
            <li><strong>Service Functionality:</strong> To calculate attendance safety buffers, visualize SGPA trends, and provide reminders.</li>
            <li><strong>Cloud Synchronization:</strong> To securely back up your academic records so they are accessible across your devices.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>4. Data Sharing and Protection</h2>
          <p><strong>We do NOT sell, trade, or rent student data to third parties.</strong></p>
          <ul>
            <li><strong>No Targeted Advertising:</strong> We do not use your academic data or behavioral patterns to serve advertisements.</li>
            <li><strong>No Institutional Sharing:</strong> We do not share your attendance patterns with your educational institution. This is a private tool for your personal use.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>5. Security Measures</h2>
          <ul>
            <li><strong>Encryption:</strong> All data in transit is protected via HTTPS (TLS/SSL).</li>
            <li><strong>Password Safety:</strong> Passwords are salted and hashed; we never store them in plain text.</li>
            <li><strong>Database Security:</strong> Synced data is stored in a production-grade, firewalled database.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>6. Your Rights & Control</h2>
          <ul>
            <li><strong>Data Access:</strong> You can view all your stored data directly within the App's dashboard.</li>
            <li><strong>Data Deletion:</strong> You can delete individual subjects, logs, or your entire account at any time.</li>
            <li><strong>Correction:</strong> You have full control to edit any attendance count or CGPA record.</li>
          </ul>
        </section>

        <section>
            <h2 style={{ color: 'var(--primary-glow)', marginBottom: '15px' }}>7. Contact Us</h2>
            <p>For privacy-related inquiries or data deletion requests:</p>
            <p style={{ fontWeight: '700' }}>Email: support@furina.app</p>
        </section>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '60px' }}>
        <button className="btn-primary" onClick={onBack} style={{ padding: '20px 60px' }}>I Understand & Agree</button>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
