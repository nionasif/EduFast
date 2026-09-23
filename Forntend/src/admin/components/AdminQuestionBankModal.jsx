import React from 'react';

export default function AdminQuestionBankModal({
  isOpen,
  onClose,
  qbForm,
  setQbForm,
  handleSaveQbAdmin
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Add Past Exam Question Paper</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSaveQbAdmin}>
          <div className="admin-details-grid">
            <div className="admin-form-group">
              <label className="admin-form-label">University / Institution *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., BUET, DU Ka Unit, Medical"
                value={qbForm.varsity}
                onChange={e => setQbForm({ ...qbForm, varsity: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Exam Name *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., BUET Engineering Admission Test"
                value={qbForm.examName}
                onChange={e => setQbForm({ ...qbForm, examName: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Exam Year *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., 2024, 2023"
                value={qbForm.year}
                onChange={e => setQbForm({ ...qbForm, year: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Subject *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Physics, Chemistry, Math"
                value={qbForm.subject}
                onChange={e => setQbForm({ ...qbForm, subject: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Academic Group</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={qbForm.group}
                onChange={e => setQbForm({ ...qbForm, group: e.target.value })}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Number of Questions</label>
              <input
                type="number"
                className="admin-input"
                value={qbForm.questionsCount}
                onChange={e => setQbForm({ ...qbForm, questionsCount: Number(e.target.value) })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Total Marks</label>
              <input
                type="number"
                className="admin-input"
                value={qbForm.totalMarks}
                onChange={e => setQbForm({ ...qbForm, totalMarks: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn" style={{ background: '#059669', color: '#fff' }}>
              Save to Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
