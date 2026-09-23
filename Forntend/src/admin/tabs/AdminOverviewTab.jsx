import React from 'react';

export default function AdminOverviewTab({
  totalCount,
  courses,
  admissions,
  avgHsc,
  avgSsc,
  backendLive,
  setActiveTab,
  handleOpenAddCourse,
  handleOpenAddUniv
}) {
  return (
    <div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Applicants</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf' }}>🎓</div>
          </div>
          <div className="admin-stat-value">{totalCount}</div>
          <div className="admin-stat-subtext">Verified applicants in SQLite</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Live Courses</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>📚</div>
          </div>
          <div className="admin-stat-value">{courses.length}</div>
          <div className="admin-stat-subtext">Active in EduFast Course Hub</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Universities Listed</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>🏛️</div>
          </div>
          <div className="admin-stat-value">{admissions.length}</div>
          <div className="admin-stat-subtext">Integrated in GPA Matching</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Avg. HSC GPA</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>⭐</div>
          </div>
          <div className="admin-stat-value">{avgHsc}</div>
          <div className="admin-stat-subtext">Avg. SSC GPA: {avgSsc}</div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title"><span>⚡</span> Fast Add Controls</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button className="admin-btn admin-btn-teal" onClick={() => setActiveTab('courses')}>
              <span>🛡️</span> কোর্স পারমিশন ও অনুমোদন (Teacher Course Approvals)
            </button>
            <button className="admin-btn" style={{ background: '#2563eb', color: '#fff' }} onClick={() => { setActiveTab('universities'); handleOpenAddUniv(); }}>
              <span>➕</span> Add New University / Varsity to Website
            </button>
            <button className="admin-btn admin-btn-secondary" onClick={() => setActiveTab('students')}>
              <span>👥</span> Manage Student Candidates
            </button>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title"><span>📊</span> Platform Summary</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <div>• Active Academic Groups: <strong>Science, Commerce, Humanities</strong></div>
            <div>• Total Courses across catalog: <strong>{courses.length} courses</strong></div>
            <div>• Registered Universities: <strong>{admissions.length} varsities ({admissions.reduce((acc, u) => acc + (u.units ? u.units.length : 0), 0)} admission units)</strong></div>
            <div>• Database Sync: <strong>{backendLive ? 'Synchronized with SQLite3' : 'Local Storage Cache'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
