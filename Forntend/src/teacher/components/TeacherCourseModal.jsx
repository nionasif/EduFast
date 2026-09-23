import React from 'react';
import { X, Trash2 } from 'lucide-react';

export default function TeacherCourseModal({
  isOpen,
  onClose,
  editingCourseId,
  courseFormData,
  setCourseFormData,
  handleSaveCourse,
  handleAddModule,
  handleRemoveModule,
  handleAddLesson,
  handleRemoveLesson,
  theme
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `1px solid ${theme.cardBorder}`, paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', color: theme.text, fontWeight: 800 }}>
            {editingCourseId ? 'Edit Course & Curriculum' : 'Create New Preparation Course'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSaveCourse}>
          {/* Step 1: General Info */}
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-teal)', fontSize: '0.95rem', fontWeight: 700 }}>
            1. General Course Details
          </h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Course Title *
            </label>
            <input
              type="text"
              value={courseFormData.title}
              onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })}
              placeholder="e.g.: Complete University Admission Physics Masterclass"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Academic Group
              </label>
              <select
                value={courseFormData.group}
                onChange={e => setCourseFormData({ ...courseFormData, group: e.target.value })}
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
                Estimated Duration
              </label>
              <input
                type="text"
                value={courseFormData.duration}
                onChange={e => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                placeholder="e.g. 45 Hours"
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Highlight Badge
              </label>
              <input
                type="text"
                value={courseFormData.badge}
                onChange={e => setCourseFormData({ ...courseFormData, badge: e.target.value })}
                placeholder="e.g. Masterclass, Best Seller"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Original Price (BDT)
              </label>
              <input
                type="number"
                value={courseFormData.price}
                onChange={e => setCourseFormData({ ...courseFormData, price: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Offer Price (BDT)
              </label>
              <input
                type="number"
                value={courseFormData.discountedPrice}
                onChange={e => setCourseFormData({ ...courseFormData, discountedPrice: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Course Icon Emoji
              </label>
              <input
                type="text"
                value={courseFormData.image}
                onChange={e => setCourseFormData({ ...courseFormData, image: e.target.value })}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Course Overview & Description
            </label>
            <textarea
              rows={3}
              value={courseFormData.description}
              onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
              placeholder="Provide a comprehensive summary of what students will master..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          {/* Step 2: Dynamic Curriculum Builder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '1.25rem' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--primary-teal)', fontSize: '0.95rem', fontWeight: 700 }}>
                2. Curriculum Modules & Lessons ({courseFormData.modules.length} Modules)
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: theme.textMuted }}>
                💡 কোর্স তৈরির পর '🎬 ভিডিও আপলোড ও লেকচার' স্টুডিও থেকে সরাসরি আপনার পিসি থেকে প্রতিটি লেকচারের ভিডিও আপলোড করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddModule}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              + Add Module
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {courseFormData.modules.map((mod, modIdx) => (
              <div
                key={mod.id || modIdx}
                style={{
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: theme.cardBgElevated
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={e => {
                      const updated = [...courseFormData.modules];
                      updated[modIdx].title = e.target.value;
                      setCourseFormData({ ...courseFormData, modules: updated });
                    }}
                    className="form-input"
                    style={{
                      flex: 1,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      marginRight: '0.5rem',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText
                    }}
                    placeholder="Module Title (e.g. Module 1: Foundation Concepts)"
                  />
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(modIdx)}
                      className="btn btn-teal"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      + Add Lesson
                    </button>
                    {courseFormData.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(modIdx)}
                        className="btn"
                        style={{ padding: '0.25rem 0.5rem', color: '#e53e3e', border: '1px solid #fed7d7', background: theme.cardBg }}
                        title="Remove Module"
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lessons list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                  {mod.lessons.map((les, lesIdx) => (
                    <div
                      key={les.id || lesIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 80px 2fr 30px',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: theme.cardBg,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: `1px solid ${theme.cardBorder}`
                      }}
                    >
                      <input
                        type="text"
                        value={les.title}
                        onChange={e => {
                          const updated = [...courseFormData.modules];
                          updated[modIdx].lessons[lesIdx].title = e.target.value;
                          setCourseFormData({ ...courseFormData, modules: updated });
                        }}
                        className="form-input"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          height: '32px',
                          backgroundColor: theme.inputBg,
                          borderColor: theme.inputBorder,
                          color: theme.inputText
                        }}
                        placeholder="Lesson title"
                      />
                      <input
                        type="text"
                        value={les.duration}
                        onChange={e => {
                          const updated = [...courseFormData.modules];
                          updated[modIdx].lessons[lesIdx].duration = e.target.value;
                          setCourseFormData({ ...courseFormData, modules: updated });
                        }}
                        className="form-input"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          height: '32px',
                          backgroundColor: theme.inputBg,
                          borderColor: theme.inputBorder,
                          color: theme.inputText
                        }}
                        placeholder="Duration"
                      />
                      <input
                        type="text"
                        value={les.videoUrl}
                        onChange={e => {
                          const updated = [...courseFormData.modules];
                          updated[modIdx].lessons[lesIdx].videoUrl = e.target.value;
                          setCourseFormData({ ...courseFormData, modules: updated });
                        }}
                        className="form-input"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          height: '32px',
                          backgroundColor: theme.inputBg,
                          borderColor: theme.inputBorder,
                          color: theme.inputText
                        }}
                        placeholder="Video URL (.mp4 or YouTube)"
                      />
                      {mod.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(modIdx, lesIdx)}
                          style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-teal" style={{ fontWeight: 700 }}>
              {editingCourseId ? 'Update & Publish Changes' : 'Publish New Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
