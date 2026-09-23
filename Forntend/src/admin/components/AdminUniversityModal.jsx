import React from 'react';

export default function AdminUniversityModal({
  isOpen,
  onClose,
  editingUnivId,
  univForm,
  setUnivForm,
  handleSaveUniv,
  handleAddUnitRow,
  handleRemoveUnitRow,
  handleUnitChange
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{editingUnivId ? 'Edit University & Admission' : 'Add New University to Website'}</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSaveUniv}>
          <div className="admin-details-grid">
            <div className="admin-form-group">
              <label className="admin-form-label">University Name *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Chittagong University (CU)"
                value={univForm.name}
                onChange={e => setUnivForm({ ...univForm, name: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Logo / Badge Emoji</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., 🏛️, 🚢, 🌿, 🎓"
                value={univForm.logo}
                onChange={e => setUnivForm({ ...univForm, logo: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Application Fee (৳)</label>
              <input
                type="number"
                className="admin-input"
                value={univForm.applicationFee}
                onChange={e => setUnivForm({ ...univForm, applicationFee: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Admission Exam Date</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., January 15, 2027"
                value={univForm.examDate}
                onChange={e => setUnivForm({ ...univForm, examDate: e.target.value })}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Application Deadline Date</label>
              <input
                type="date"
                className="admin-input"
                value={univForm.deadlineDate}
                onChange={e => setUnivForm({ ...univForm, deadlineDate: e.target.value })}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Description</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Chittagong University Honours Admission 2026-2027"
                value={univForm.description}
                onChange={e => setUnivForm({ ...univForm, description: e.target.value })}
              />
            </div>
          </div>

          {/* Units Management Section */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>Admission Units / Criteria</span>
              <button type="button" className="admin-btn admin-btn-teal" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={handleAddUnitRow}>
                ➕ Add Unit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {univForm.units.map((unit, idx) => (
                <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label className="admin-form-label" style={{ fontSize: '0.7rem' }}>Unit Name</label>
                      <input type="text" className="admin-input" value={unit.name} onChange={e => handleUnitChange(idx, 'name', e.target.value)} required />
                    </div>
                    <div>
                      <label className="admin-form-label" style={{ fontSize: '0.7rem' }}>Academic Group</label>
                      <select className="admin-select" style={{ width: '100%' }} value={unit.group} onChange={e => handleUnitChange(idx, 'group', e.target.value)}>
                        <option value="Science">Science</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>
                    <div>
                      <label className="admin-form-label" style={{ fontSize: '0.7rem' }}>Min Combined GPA</label>
                      <input type="number" step="0.1" className="admin-input" value={unit.minGpa} onChange={e => handleUnitChange(idx, 'minGpa', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="admin-form-label" style={{ fontSize: '0.7rem' }}>Required Subjects</label>
                      <input type="text" className="admin-input" value={unit.subjects} onChange={e => handleUnitChange(idx, 'subjects', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-btn"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', width: '100%', fontSize: '0.75rem', padding: '0.65rem' }}
                        onClick={() => handleRemoveUnitRow(idx)}
                        disabled={univForm.units.length <= 1}
                      >
                        Remove Unit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-teal">
              {editingUnivId ? 'Save Changes' : 'Publish University'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
