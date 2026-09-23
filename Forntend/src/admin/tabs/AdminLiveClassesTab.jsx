import React from 'react';

export default function AdminLiveClassesTab({
  liveClassesList,
  setIsLiveModalOpen,
  handleDeleteLiveClassAdmin
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Live Classes & Webinar Schedule</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Manage live masterclasses, interactive room streaming links, and student countdowns.
          </p>
        </div>

        <button 
          className="admin-btn"
          style={{ background: '#e11d48', color: '#fff' }}
          onClick={() => setIsLiveModalOpen(true)}
        >
          <span>➕</span> Schedule Live Masterclass
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {liveClassesList.map(session => (
          <div key={session.id} className="admin-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px', 
                  background: session.status === 'Live' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: session.status === 'Live' ? '#ef4444' : '#10b981',
                  fontWeight: 'bold'
                }}>
                  {session.status || 'Upcoming'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {session.group}
                </span>
              </div>

              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1rem', lineHeight: '1.4' }}>
                {session.title}
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '500' }}>
                👨‍🏫 {session.instructor}
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.4' }}>
                {session.overview}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ⏱️ {session.duration} • 👥 {session.registeredCount} students
              </span>
              <button 
                className="admin-btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#ef4444', color: '#fff' }}
                onClick={() => handleDeleteLiveClassAdmin(session.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {liveClassesList.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            No live sessions scheduled. Click above to add a new masterclass.
          </div>
        )}
      </div>
    </div>
  );
}
