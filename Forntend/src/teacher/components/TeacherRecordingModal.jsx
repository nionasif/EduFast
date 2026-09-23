import React from 'react';
import { X } from 'lucide-react';

export default function TeacherRecordingModal({
  isOpen,
  onClose,
  editingRecordingId,
  recordingFormData,
  setRecordingFormData,
  handleSaveRecording,
  theme
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: theme.text, fontWeight: 800 }}>
            {editingRecordingId ? 'Edit Class Recording' : 'Upload New Class Recording'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSaveRecording}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Class Title *
            </label>
            <input
              type="text"
              value={recordingFormData.title}
              onChange={e => setRecordingFormData({ ...recordingFormData, title: e.target.value })}
              placeholder="e.g.: Higher Math: Matrix & Determinants Crash Course"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Group
              </label>
              <select
                value={recordingFormData.group}
                onChange={e => setRecordingFormData({ ...recordingFormData, group: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Duration
              </label>
              <input
                type="text"
                value={recordingFormData.duration}
                onChange={e => setRecordingFormData({ ...recordingFormData, duration: e.target.value })}
                placeholder="e.g. 50 Minutes"
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Video Resource URL (.mp4 / YouTube embed) *
            </label>
            <input
              type="text"
              value={recordingFormData.videoUrl}
              onChange={e => setRecordingFormData({ ...recordingFormData, videoUrl: e.target.value })}
              placeholder="https://...mp4 or https://www.youtube.com/embed/..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Lecture Sheet URL / Filename
            </label>
            <input
              type="text"
              value={recordingFormData.sheetUrl}
              onChange={e => setRecordingFormData({ ...recordingFormData, sheetUrl: e.target.value })}
              placeholder="e.g. physics_vector_shortcuts.pdf"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Lecture Description & Topics Covered
            </label>
            <textarea
              rows={3}
              value={recordingFormData.description}
              onChange={e => setRecordingFormData({ ...recordingFormData, description: e.target.value })}
              placeholder="Provide key notes, highlights, or tips for students..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-teal" style={{ fontWeight: 700 }}>
              {editingRecordingId ? 'Save Changes' : 'Upload Recording'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
