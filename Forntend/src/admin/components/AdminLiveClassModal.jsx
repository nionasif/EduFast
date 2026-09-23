import React from 'react';

export default function AdminLiveClassModal({
  isOpen,
  onClose,
  liveForm,
  setLiveForm,
  handleSaveLiveClassAdmin
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Schedule New Live Masterclass</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSaveLiveClassAdmin}>
          <div className="admin-details-grid">
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Masterclass Title *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., BUET Mathematics: Master Differential Equations"
                value={liveForm.title}
                onChange={e => setLiveForm({ ...liveForm, title: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Lead Instructor *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Engr. Tanvir Ahmed (BUET)"
                value={liveForm.instructor}
                onChange={e => setLiveForm({ ...liveForm, instructor: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Instructor Designation</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Lead Instructor, Engineering Wing"
                value={liveForm.instructorTitle}
                onChange={e => setLiveForm({ ...liveForm, instructorTitle: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Target Academic Group</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={liveForm.group}
                onChange={e => setLiveForm({ ...liveForm, group: e.target.value })}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Duration</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., 90 Minutes"
                value={liveForm.duration}
                onChange={e => setLiveForm({ ...liveForm, duration: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Live Status</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={liveForm.status}
                onChange={e => setLiveForm({ ...liveForm, status: e.target.value })}
              >
                <option value="Upcoming">Upcoming (Scheduled)</option>
                <option value="Live">Live Now</option>
                <option value="Ended">Ended / Recorded</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Estimated Registered Students</label>
              <input
                type="number"
                className="admin-input"
                value={liveForm.registeredCount}
                onChange={e => setLiveForm({ ...liveForm, registeredCount: Number(e.target.value) })}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Session Overview & Syllabus</label>
              <textarea
                className="admin-input"
                rows="2"
                placeholder="Key concepts, shortcut techniques to be covered..."
                value={liveForm.overview}
                onChange={e => setLiveForm({ ...liveForm, overview: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn" style={{ background: '#e11d48', color: '#fff' }}>
              Broadcast Live Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
