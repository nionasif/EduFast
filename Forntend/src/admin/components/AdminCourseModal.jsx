import React from 'react';

export default function AdminCourseModal({
  isOpen,
  onClose,
  editingCourseId,
  courseForm,
  setCourseForm,
  handleSaveCourse
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{editingCourseId ? 'Edit Course Details' : 'Add New Course to Platform'}</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSaveCourse}>
          <div className="admin-details-grid">
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Course Title *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Medical Admission Biology Crash Course"
                value={courseForm.title}
                onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Instructor & Designation *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Dr. A. K. Azad (PhD, BUET)"
                value={courseForm.instructor}
                onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Academic Group *</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={courseForm.group}
                onChange={e => setCourseForm({ ...courseForm, group: e.target.value })}
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
                placeholder="e.g., 45 Hours or 60 Classes"
                value={courseForm.duration}
                onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Icon / Emoji</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., ⚛️, 🧪, 🧬, 📐, 💻, 📊"
                value={courseForm.image}
                onChange={e => setCourseForm({ ...courseForm, image: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Regular Price (৳)</label>
              <input
                type="number"
                className="admin-input"
                value={courseForm.price}
                onChange={e => setCourseForm({ ...courseForm, price: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Discounted / Offer Price (৳)</label>
              <input
                type="number"
                className="admin-input"
                value={courseForm.discountedPrice}
                onChange={e => setCourseForm({ ...courseForm, discountedPrice: e.target.value })}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Badge Tag</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={courseForm.badge}
                onChange={e => setCourseForm({ ...courseForm, badge: e.target.value })}
              >
                <option value="AI-Powered">AI-Powered</option>
                <option value="Best Seller">Best Seller</option>
                <option value="Recommended">Recommended</option>
                <option value="New Feature">New Feature</option>
              </select>
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Description</label>
              <textarea
                className="admin-input"
                rows="3"
                placeholder="Brief description of the course contents..."
                value={courseForm.description}
                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-teal">
              {editingCourseId ? 'Save Changes' : 'Publish Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
