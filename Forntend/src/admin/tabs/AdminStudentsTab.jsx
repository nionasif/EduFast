import React from 'react';

export default function AdminStudentsTab({
  searchQuery,
  setSearchQuery,
  groupFilter,
  setGroupFilter,
  boardFilter,
  setBoardFilter,
  filteredStudents,
  setSelectedStudent,
  setDeleteConfirmId
}) {
  return (
    <div>
      <div className="admin-actions-bar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Name, Mobile, Email, Roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <select className="admin-select" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="All">All Groups</option>
            <option value="Science">Science</option>
            <option value="Business Studies">Business Studies</option>
            <option value="Humanities">Humanities</option>
          </select>

          <select className="admin-select" value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
            <option value="All">All Boards</option>
            <option value="Dhaka">Dhaka</option>
            <option value="Chittagong">Chittagong</option>
            <option value="Rajshahi">Rajshahi</option>
            <option value="Comilla">Comilla</option>
            <option value="Barisal">Barisal</option>
            <option value="Sylhet">Sylhet</option>
            <option value="Dinajpur">Dinajpur</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Group</th>
              <th>Contact Info</th>
              <th>SSC Creds</th>
              <th>HSC Creds</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="admin-student-cell">
                    <div className="admin-student-avatar">{s.name ? s.name.charAt(0) : 'S'}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{s.id}</div>
                    </div>
                  </div>
                </td>
                <td><span className="admin-group-tag">{s.academicGroup || 'Science'}</span></td>
                <td>
                  <div>{s.mobile}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email || 'N/A'}</div>
                </td>
                <td>
                  <div>Roll: {s.sscRoll || 'N/A'} ({s.sscBoard || 'Dhaka'})</div>
                  <span className={`admin-gpa-badge ${Number(s.sscGpa) >= 5 ? 'admin-gpa-5' : 'admin-gpa-4'}`}>
                    GPA {Number(s.sscGpa || 0).toFixed(2)}
                  </span>
                </td>
                <td>
                  <div>Roll: {s.hscRoll || 'N/A'} ({s.hscBoard || 'Dhaka'})</div>
                  <span className={`admin-gpa-badge ${Number(s.hscGpa) >= 5 ? 'admin-gpa-5' : 'admin-gpa-4'}`}>
                    GPA {Number(s.hscGpa || 0).toFixed(2)}
                  </span>
                </td>
                <td>
                  <div className="admin-actions-cell">
                    <button className="admin-icon-btn" onClick={() => setSelectedStudent(s)} title="View Dossier">👁️</button>
                    <button className="admin-icon-btn delete" onClick={() => setDeleteConfirmId(s.id)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No students found matching current search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
