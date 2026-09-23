import React from 'react';

export default function AdminStudentDetailModal({
  selectedStudent,
  onClose
}) {
  if (!selectedStudent) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Student Dossier: {selectedStudent.name}</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="admin-details-grid">
          <div className="admin-detail-item">
            <div className="admin-detail-label">Mobile Number</div>
            <div className="admin-detail-val">{selectedStudent.mobile}</div>
          </div>
          <div className="admin-detail-item">
            <div className="admin-detail-label">Email Address</div>
            <div className="admin-detail-val">{selectedStudent.email || 'N/A'}</div>
          </div>
          <div className="admin-detail-item">
            <div className="admin-detail-label">Academic Group</div>
            <div className="admin-detail-val">{selectedStudent.academicGroup}</div>
          </div>
          <div className="admin-detail-item">
            <div className="admin-detail-label">HSC GPA / Board</div>
            <div className="admin-detail-val">{selectedStudent.hscGpa} ({selectedStudent.hscBoard})</div>
          </div>
          <div className="admin-detail-item">
            <div className="admin-detail-label">SSC GPA / Board</div>
            <div className="admin-detail-val">{selectedStudent.sscGpa} ({selectedStudent.sscBoard})</div>
          </div>
          <div className="admin-detail-item">
            <div className="admin-detail-label">Institution / College</div>
            <div className="admin-detail-val">{selectedStudent.hscCollege || 'N/A'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>Close Dossier</button>
        </div>
      </div>
    </div>
  );
}
