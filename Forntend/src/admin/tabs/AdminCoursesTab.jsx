import React, { useState } from 'react';

export default function AdminCoursesTab({
  courseSearch,
  setCourseSearch,
  courseGroupFilter,
  setCourseGroupFilter,
  filteredCourses,
  setDeleteCourseConfirmId,
  handleOpenCurriculum = () => {},
  handleToggleCourseApproval = () => {}
}) {
  const [approvalFilter, setApprovalFilter] = useState('All'); // 'All' | 'Pending' | 'Approved'

  // Apply approval status filter
  const displayedCourses = filteredCourses.filter(c => {
    if (approvalFilter === 'Pending') return !c.isApproved;
    if (approvalFilter === 'Approved') return !!c.isApproved;
    return true;
  });

  const pendingCount = filteredCourses.filter(c => !c.isApproved).length;
  const approvedCount = filteredCourses.filter(c => !!c.isApproved).length;

  return (
    <div>
      {/* Admin Role Scope Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          fontSize: '2.4rem',
          width: '54px',
          height: '54px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          🛡️
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.35rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>
            টিচার কোর্স অনুমোদন ও নিয়ন্ত্রণ ড্যাশবোর্ড (Teacher Course Approvals)
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
            শিক্ষকগণ তাদের স্টুডিও থেকে কোর্স ও ভিডিও লেকচার তৈরি করেন। এডমিন হিসেবে আপনার ক্ষমতা শুধুমাত্র কোর্সটি পর্যালোচনা করে <strong>ওয়েবসাইটে আপলোড করার পারমিশন (অনুমোদন) দেওয়া</strong> অথবা অনুপযুক্ত কোর্স <strong>মুছে ফেলা (Delete)</strong>। কোর্সের মূল কনটেন্ট বা তথ্যে এডমিন থেকে কোনো মডিফিকেশন করার সুযোগ নেই।
          </p>
        </div>
      </div>

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>মোট জমাকৃত কোর্স</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>{filteredCourses.length}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: 0, borderColor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
          <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>⏳ অনুমোদনের অপেক্ষায় (Pending)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>{pendingCount}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: 0, borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>🟢 ওয়েবসাইটে লাইভ (Approved)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{approvedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="admin-search-wrapper" style={{ flex: '1 1 280px' }}>
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="কোর্স বা শিক্ষকের নাম দিয়ে খুঁজুন..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setApprovalFilter('All')}
              className="admin-btn"
              style={{
                background: approvalFilter === 'All' ? 'var(--primary-teal, #14b8a6)' : 'transparent',
                color: approvalFilter === 'All' ? '#fff' : '#94a3b8',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                borderRadius: '6px'
              }}
            >
              সকল কোর্স ({filteredCourses.length})
            </button>
            <button
              onClick={() => setApprovalFilter('Pending')}
              className="admin-btn"
              style={{
                background: approvalFilter === 'Pending' ? '#f59e0b' : 'transparent',
                color: approvalFilter === 'Pending' ? '#fff' : '#94a3b8',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                borderRadius: '6px'
              }}
            >
              অপেক্ষারত ({pendingCount})
            </button>
            <button
              onClick={() => setApprovalFilter('Approved')}
              className="admin-btn"
              style={{
                background: approvalFilter === 'Approved' ? '#10b981' : 'transparent',
                color: approvalFilter === 'Approved' ? '#fff' : '#94a3b8',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                borderRadius: '6px'
              }}
            >
              অনুমোদিত ({approvedCount})
            </button>
          </div>

          <select
            className="admin-select"
            value={courseGroupFilter}
            onChange={(e) => setCourseGroupFilter(e.target.value)}
          >
            <option value="All">All Groups</option>
            <option value="Science">Science</option>
            <option value="Commerce">Commerce</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.25rem' }}>
        {displayedCourses.map((c) => (
          <div
            key={c.id}
            className="admin-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              border: c.isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              background: c.isApproved ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 27, 20, 0.5)'
            }}
          >
            {/* Header Badge Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span className="admin-group-tag">{c.group}</span>
                {c.badge && (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                    {c.badge}
                  </span>
                )}
              </div>

              {/* Status Badge */}
              {c.isApproved ? (
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  ● ওয়েবসাইটে লাইভ (Approved)
                </span>
              ) : (
                <span style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  ⏳ অনুমোদনের অপেক্ষায় (Pending)
                </span>
              )}
            </div>

            {/* Course Title and Teacher */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '2.5rem', width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {c.image || '📚'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35 }}>
                  {c.title}
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                  👨‍🏫 শিক্ষক: {c.instructor || 'EduFast Lead Instructor'}
                </div>
                {c.instructorTitle && (
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{c.instructorTitle}</div>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 1rem 0', flex: 1, lineHeight: 1.45 }}>
              {c.description || 'শিক্ষক কর্তৃক তৈরিকৃত বিশ্ববিদ্যালয় ভর্তি প্রস্তুতিমূলক স্পেশাল কোর্স।'}
            </p>

            {/* Price & Modules info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>৳{c.discountedPrice || c.price}</span>
                {c.price > c.discountedPrice && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '0.35rem' }}>৳{c.price}</span>
                )}
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>⏱️ {c.duration || '40 Hours'}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <div>📚 <strong>{c.modules?.length || 1}</strong> Modules</div>
                <div style={{ color: '#94a3b8' }}>🎬 {c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} Lessons</div>
              </div>
            </div>

            {/* Admin Action Row: ONLY Permission & Delete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', gap: '0.5rem' }}>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: 'rgba(14, 165, 233, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  fontSize: '0.74rem',
                  padding: '0.4rem 0.65rem'
                }}
                onClick={() => handleOpenCurriculum(c)}
                title="ভিডিও লেকচার ও কারিকুলাম তালিকা দেখুন"
              >
                🎬 লেকচার দেখুন
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Permission Toggle Button */}
                {c.isApproved ? (
                  <button
                    type="button"
                    onClick={() => handleToggleCourseApproval(c)}
                    className="admin-btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="ওয়েবসাইট থেকে এই কোর্সটির পারমিশন প্রত্যাহার করুন"
                  >
                    ⛔ পারমিশন প্রত্যাহার
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleCourseApproval(c)}
                    className="admin-btn"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      padding: '0.42rem 0.85rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                    }}
                    title="ওয়েবসাইটে এই কোর্সটি লাইভ প্রদর্শনের জন্য অনুমোদন দিন"
                  >
                    ✅ পাবলিশ পারমিশন দিন
                  </button>
                )}

                {/* Delete Button */}
                <button
                  className="admin-icon-btn delete"
                  onClick={() => setDeleteCourseConfirmId(c.id)}
                  title="কোর্সটি স্থায়ীভাবে মুছে ফেলুন (Delete)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayedCourses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginTop: '1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
          <div style={{ fontWeight: 600, color: '#94a3b8' }}>কোনো কোর্স পাওয়া যায়নি।</div>
          <p style={{ fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>শিক্ষকরা যখন তাদের স্টুডিও থেকে কোর্স তৈরি করবেন, তা এখানে অনুমোদনের জন্য জমা হবে।</p>
        </div>
      )}
    </div>
  );
}
