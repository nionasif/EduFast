import React from 'react';

export default function AdminSettingsTab({
  pwdMsg,
  setPwdMsg,
  pwdForm,
  setPwdForm,
  backendLive,
  courses,
  admissions,
  totalCount,
  setCourses,
  setAdmissions,
  setNotices
}) {
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (pwdForm.newPwd.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    localStorage.setItem('edufast_custom_admin_pwd', pwdForm.newPwd);
    setPwdMsg({ type: 'success', text: 'Password successfully updated!' });
    setPwdForm({ current: '', newPwd: '', confirmPwd: '' });
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all dynamic courses, universities, and notices to a clean slate?')) {
      localStorage.removeItem('edufast_dynamic_courses');
      localStorage.removeItem('edufast_dynamic_admissions');
      localStorage.removeItem('edufast_admin_notices');
      setCourses([]);
      setAdmissions([]);
      setNotices([]);
      window.dispatchEvent(new CustomEvent('edufast-data-update'));
      alert('Platform successfully reset to a clean state! All dummy data removed.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>🔐</span> Security & Credentials</h3>
        </div>
        {pwdMsg.text && <div style={{ color: '#34d399', marginBottom: '1rem', fontSize: '0.88rem' }}>{pwdMsg.text}</div>}
        <form onSubmit={handleUpdatePassword}>
          <div className="admin-form-group">
            <label className="admin-form-label">New Password</label>
            <input
              type="password"
              className="admin-input"
              value={pwdForm.newPwd}
              onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-teal">Update Password</button>
        </form>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>⚙️</span> Backend Health & Reset</h3>
        </div>
        <div style={{ color: backendLive ? '#34d399' : '#fbbf24', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {backendLive ? '🟢 SQLite3 Database Active on http://localhost:5001' : '🟡 Local Dynamic Storage Active'}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          Total Courses: {courses.length} | Total Varsities: {admissions.length} | Total Applicants: {totalCount}
        </div>
        <button
          type="button"
          className="admin-btn"
          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', width: '100%', justifyContent: 'center' }}
          onClick={handleClearAllData}
        >
          🧹 Clear All Data (Reset to Fresh Clean Slate)
        </button>
      </div>
    </div>
  );
}
