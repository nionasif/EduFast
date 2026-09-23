import React from 'react';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';

export default function TeacherCoursesTab({
  filteredCoursesList,
  courseFilterGroup,
  setCourseFilterGroup,
  handleOpenAddCourse,
  handleOpenEditCourse,
  handleDeleteCourse,
  handleOpenCurriculum = () => {},
  theme
}) {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen style={{ width: '22px', height: '22px', color: 'var(--primary-teal)' }} />
            Course Studio & Curriculum Management
          </h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.9rem' }}>
            Build full preparation masterclasses, design modules, configure video lessons, and set pricing.
          </p>
        </div>

        <button
          onClick={handleOpenAddCourse}
          className="btn btn-teal"
          style={{ padding: '0.55rem 1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} /> Create New Course
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['All', 'Science', 'Commerce', 'Arts'].map(grp => (
          <button
            key={grp}
            onClick={() => setCourseFilterGroup(grp)}
            className={`btn ${courseFilterGroup === grp ? 'btn-teal' : 'btn-secondary'}`}
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.82rem',
              backgroundColor: courseFilterGroup === grp ? 'var(--primary-teal)' : theme.cardBgElevated,
              color: courseFilterGroup === grp ? '#fff' : theme.text,
              borderColor: theme.cardBorder
            }}
          >
            {grp === 'All' ? 'All Groups' : grp}
          </button>
        ))}
      </div>

      {/* Courses Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredCoursesList.map(course => (
          <div
            key={course.id}
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '12px',
              overflow: 'hidden',
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}
          >
            <div>
              {/* Header Media */}
              <div style={{
                height: '140px',
                background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                position: 'relative'
              }}>
                <span>{course.image || '📚'}</span>
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.4rem' }}>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {course.badge}
                  </span>
                  <span style={{ backgroundColor: 'var(--accent-yellow)', color: '#1a202c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {course.group}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: theme.text, lineHeight: 1.4 }}>
                  {course.title}
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: theme.textMuted, lineHeight: 1.5 }}>
                  {course.description || 'Comprehensive exam preparation masterclass authored by lead instructor.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: theme.textSecondary, marginBottom: '1rem' }}>
                  <div>⏱ Duration: <strong>{course.duration}</strong></div>
                  <div>👥 Students: <strong>{course.enrolledCount || 0}</strong></div>
                  <div>⭐ Rating: <strong>{course.reviewsCount > 0 ? (course.rating || 0) : '0 (New)'}</strong></div>
                  <div>
                    💰 Fee:{' '}
                    <strong style={{ color: 'var(--primary-teal)' }}>
                      ৳{course.discountedPrice || course.price}
                    </strong>{' '}
                    {course.discountedPrice && course.price > course.discountedPrice && (
                      <span style={{ textDecoration: 'line-through', color: theme.textMuted, fontSize: '0.75rem' }}>
                        ৳{course.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Modules Summary */}
                <div style={{ backgroundColor: theme.cardBgElevated, padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', color: theme.textSecondary }}>
                  📚 Curriculum Structure: <strong>{course.modules?.length || 1} Modules</strong> (
                  {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} Video Lessons)
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: theme.cardBgElevated,
              borderTop: `1px solid ${theme.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {course.isApproved ? (
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ● ওয়েবসাইটে প্রকাশিত (Live)
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ⏳ এডমিন অনুমোদনের অপেক্ষায়
                </span>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleOpenCurriculum(course)}
                  className="btn btn-teal"
                  style={{ padding: '0.38rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  title="আপনার কম্পিউটার/পিসি থেকে টপিক অনুযায়ী ভিডিও লেকচার আপলোড ও কারিকুলাম ম্যানেজ করুন"
                >
                  🎬 ভিডিও আপলোড ও লেকচার
                </button>

                <button
                  onClick={() => handleOpenEditCourse(course)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Edit2 style={{ width: '13px', height: '13px' }} /> Edit Info
                </button>

                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="btn"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#e53e3e', border: '1px solid #fed7d7', background: theme.cardBg }}
                  title="Delete Course"
                >
                  <Trash2 style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCoursesList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, marginTop: '1rem', transition: 'all 0.3s ease' }}>
          <BookOpen style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', color: theme.textMuted }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text }}>No Courses Found</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: theme.textMuted, fontSize: '0.9rem' }}>
            Get started by creating your first complete preparation course for admission aspirants.
          </p>
          <button onClick={handleOpenAddCourse} className="btn btn-teal">
            + Create First Course
          </button>
        </div>
      )}
    </div>
  );
}
