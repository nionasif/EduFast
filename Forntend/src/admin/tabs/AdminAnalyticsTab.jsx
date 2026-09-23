import React from 'react';

export default function AdminAnalyticsTab({
  students,
  totalCount,
  admissions
}) {
  const gpa5 = students.filter(s => Number(s.hscGpa) >= 5).length;
  const gpa4_5 = students.filter(s => Number(s.hscGpa) >= 4.5 && Number(s.hscGpa) < 5).length;
  const gpa4 = students.filter(s => Number(s.hscGpa) >= 4.0 && Number(s.hscGpa) < 4.5).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>🎯</span> GPA Performance Tiers</h3>
        </div>
        <div className="admin-bar-wrapper">
          <div className="admin-bar-info"><span>GPA 5.00 (Golden)</span><span>{gpa5} Candidates</span></div>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${totalCount > 0 ? (gpa5 / totalCount) * 100 : 0}%`, background: '#10b981' }} />
          </div>
        </div>
        <div className="admin-bar-wrapper">
          <div className="admin-bar-info"><span>GPA 4.50 - 4.99</span><span>{gpa4_5} Candidates</span></div>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${totalCount > 0 ? (gpa4_5 / totalCount) * 100 : 0}%`, background: '#14b8a6' }} />
          </div>
        </div>
        <div className="admin-bar-wrapper">
          <div className="admin-bar-info"><span>GPA 4.00 - 4.49</span><span>{gpa4} Candidates</span></div>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${totalCount > 0 ? (gpa4 / totalCount) * 100 : 0}%`, background: '#f59e0b' }} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>🏛️</span> Active Universities in System</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {admissions.length === 0 ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No universities added yet. Use "Add New University" to publish circulars.
            </div>
          ) : (
            admissions.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.5)', borderRadius: '8px' }}>
                <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{u.logo} {u.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{u.units ? u.units.length : 0} Units</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
