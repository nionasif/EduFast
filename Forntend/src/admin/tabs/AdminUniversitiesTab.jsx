import React from 'react';

export default function AdminUniversitiesTab({
  univSearch,
  setUnivSearch,
  handleOpenAddUniv,
  filteredUniversities,
  handleOpenEditUniv,
  setDeleteUnivConfirmId
}) {
  return (
    <div>
      <div className="admin-actions-bar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search universities by name, description, unit..."
            value={univSearch}
            onChange={(e) => setUnivSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <button className="admin-btn" style={{ background: '#2563eb', color: '#ffffff' }} onClick={handleOpenAddUniv}>
            <span>➕</span> Add New University / Varsity
          </button>
        </div>
      </div>

      {/* Universities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredUniversities.map((u) => (
          <div key={u.id} className="admin-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem', width: '56px', height: '56px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.logo || '🏛️'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>{u.name}</h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{u.description}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700 }}>Fee: ৳{u.applicationFee}</div>
                  <div style={{ color: '#94a3b8' }}>Exam: {u.examDate}</div>
                </div>
                <div className="admin-actions-cell">
                  <button className="admin-icon-btn" onClick={() => handleOpenEditUniv(u)} title="Edit University">
                    ✏️
                  </button>
                  <button className="admin-icon-btn delete" onClick={() => setDeleteUnivConfirmId(u.id)} title="Delete University">
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            {/* Units Table */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.65rem' }}>
                Admission Units ({u.units ? u.units.length : 0})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {u.units && u.units.map((unit, idx) => (
                  <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{unit.name}</strong>
                      <span className="admin-group-tag" style={{ fontSize: '0.7rem' }}>{unit.group}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                      Min GPA: {unit.minGpa} (Individual: {unit.minIndividualGpa})
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Subjects: {unit.subjects}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredUniversities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            No universities found. Click "+ Add New University" above to add one.
          </div>
        )}
      </div>
    </div>
  );
}
