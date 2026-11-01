import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Clock, CheckCircle2, AlertCircle, Video, Layers, Eye } from 'lucide-react';

export default function TeacherCoursesTab({
  filteredCoursesList = [],
  courseFilterGroup,
  setCourseFilterGroup,
  handleOpenAddCourse,
  handleOpenEditCourse,
  handleDeleteCourse,
  handleOpenCurriculum = () => {},
  handlePreviewCourse = () => {},
  theme
}) {
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Approved'

  // Calculate approval counts
  const totalCourses = filteredCoursesList.length;
  const pendingCourses = filteredCoursesList.filter(c => !c.isApproved || c.status === 'Pending').length;
  const approvedCourses = filteredCoursesList.filter(c => !!c.isApproved && c.status !== 'Pending').length;

  // Filter list based on both group and approval status
  const displayedCourses = filteredCoursesList.filter(c => {
    const isApproved = !!c.isApproved && c.status !== 'Pending';
    if (statusFilter === 'Pending') return !isApproved;
    if (statusFilter === 'Approved') return isApproved;
    return true;
  });

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
            কোর্স তৈরি করুন, টপিক ভিত্তিক ভিডিও লেকচার আপলোড করুন এবং এডমিন অনুমোদনের বর্তমান অবস্থা ট্র্যাক করুন।
          </p>
        </div>

        <button
          onClick={handleOpenAddCourse}
          className="btn btn-teal"
          style={{ padding: '0.55rem 1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 10px rgba(20, 184, 166, 0.3)' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} /> Create New Course
        </button>
      </div>

      {/* Course Status Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: `1px solid ${theme.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            📚
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 600 }}>মোট তৈরিকৃত কোর্স</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text }}>{totalCourses}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: pendingCourses > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : `1px solid ${theme.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            ⏳
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>অনুমোদনের অপেক্ষায় (Pending)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{pendingCourses}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: `1px solid ${theme.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            🟢
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>ওয়েবসাইটে লাইভ (Approved)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{approvedCourses}</div>
          </div>
        </div>
      </div>

      {/* Info notice if courses are pending */}
      {pendingCourses > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '10px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem'
        }}>
          <AlertCircle style={{ width: '24px', height: '24px', color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: theme.text, lineHeight: 1.45 }}>
            <strong style={{ color: '#f59e0b' }}>নোটিশ:</strong> আপনার <strong>{pendingCourses}টি কোর্স</strong> বর্তমানে এডমিন পর্যালোচনায় (Pending) রয়েছে। এডমিন প্যানেল থেকে অনুমোদন দিলে কোর্সটি সরাসরি ওয়েবসাইটে ছাত্র-ছাত্রীদের জন্য লাইভ প্রকাশিত হবে। আপনি ইতিমধ্যে লেকচার ভিডিও আপলোড করে রাখতে পারেন।
          </div>
        </div>
      )}

      {/* Filter Tabs Bar (Status Filter + Academic Group Filter) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Status Filter */}
        <div style={{ display: 'flex', background: theme.cardBgElevated, borderRadius: '8px', padding: '0.25rem', border: `1px solid ${theme.cardBorder}` }}>
          <button
            onClick={() => setStatusFilter('All')}
            className="btn"
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: statusFilter === 'All' ? 'var(--primary-teal)' : 'transparent',
              color: statusFilter === 'All' ? '#fff' : theme.textMuted,
              borderRadius: '6px'
            }}
          >
            সকল কোর্স ({totalCourses})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className="btn"
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: statusFilter === 'Pending' ? '#f59e0b' : 'transparent',
              color: statusFilter === 'Pending' ? '#fff' : theme.textMuted,
              borderRadius: '6px'
            }}
          >
            ⏳ অনুমোদনের অপেক্ষায় ({pendingCourses})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className="btn"
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: statusFilter === 'Approved' ? '#10b981' : 'transparent',
              color: statusFilter === 'Approved' ? '#fff' : theme.textMuted,
              borderRadius: '6px'
            }}
          >
            🟢 লাইভ ও প্রকাশিত ({approvedCourses})
          </button>
        </div>

        {/* Academic Group Filter */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'Science', 'Commerce', 'Arts'].map(grp => (
            <button
              key={grp}
              onClick={() => setCourseFilterGroup(grp)}
              className={`btn ${courseFilterGroup === grp ? 'btn-teal' : 'btn-secondary'}`}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                backgroundColor: courseFilterGroup === grp ? 'var(--primary-teal)' : theme.cardBgElevated,
                color: courseFilterGroup === grp ? '#fff' : theme.text,
                borderColor: theme.cardBorder
              }}
            >
              {grp === 'All' ? 'All Groups' : grp}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
        {displayedCourses.map(course => {
          const isApproved = !!course.isApproved && course.status !== 'Pending';

          return (
            <div
              key={course.id}
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '12px',
                overflow: 'hidden',
                border: isApproved ? `1px solid ${theme.cardBorder}` : '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: isApproved ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 10px rgba(245, 158, 11, 0.1)',
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
                  background: isApproved
                    ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  position: 'relative'
                }}>
                  <span>{course.image || '📚'}</span>
                  
                  {/* Top Tags */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {course.badge || 'Course'}
                    </span>
                    <span style={{ backgroundColor: 'var(--accent-yellow)', color: '#1a202c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {course.group || course.academicGroup || 'Science'}
                    </span>
                  </div>

                  {/* Approval Indicator on Media */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {isApproved ? (
                      <span style={{
                        background: '#10b981',
                        color: '#fff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}>
                        <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Live
                      </span>
                    ) : (
                      <span style={{
                        background: '#f59e0b',
                        color: '#fff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}>
                        <Clock style={{ width: '12px', height: '12px' }} /> Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  {/* Status Banner */}
                  {isApproved ? (
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        ● ওয়েবসাইটে লাইভ প্রকাশিত
                      </span>
                      <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>ছাত্র-ছাত্রীরা দেখতে পাচ্ছে</span>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          ⏳ এডমিন অনুমোদনের অপেক্ষায়
                        </span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.2)', color: '#d97706', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          Pending Review
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: theme.textMuted, lineHeight: 1.35 }}>
                        কোর্সটি এডমিনের অনুমোদনের তালিকায় জমা হয়েছে। এডমিন অনুমোদন দেওয়া মাত্র এটি সরাসরি ওয়েবসাইটে উন্মুক্ত হবে।
                      </div>
                    </div>
                  )}

                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: theme.text, lineHeight: 1.4, fontWeight: 700 }}>
                    {course.title}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: theme.textMuted, lineHeight: 1.5 }}>
                    {course.description || 'Comprehensive exam preparation masterclass authored by lead instructor.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: theme.textSecondary, marginBottom: '1rem' }}>
                    <div>⏱ Duration: <strong>{course.duration || '40 Hours'}</strong></div>
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
                  <div style={{ backgroundColor: theme.cardBgElevated, padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}` }}>
                    📚 কারিকুলাম স্ট্রাকচার: <strong>{course.modules?.length || 1} Modules</strong> (
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
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  {isApproved ? (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Approved
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock style={{ width: '13px', height: '13px' }} /> Pending Approval
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePreviewCourse(course)}
                    className="btn btn-secondary"
                    style={{ padding: '0.38rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                    title="স্টুডেন্ট প্লেয়ারে কোর্সটি পরীক্ষা করুন"
                  >
                    <Eye style={{ width: '13px', height: '13px' }} /> প্রিভিউ
                  </button>

                  <button
                    onClick={() => handleOpenCurriculum(course)}
                    className="btn btn-teal"
                    style={{ padding: '0.38rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                    title="ভিডিও লেকচার আপলোড ও কারিকুলাম ম্যানেজ করুন"
                  >
                    <Video style={{ width: '13px', height: '13px' }} /> ভিডিও ও লেকচার
                  </button>

                  <button
                    onClick={() => handleOpenEditCourse(course)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    title="কোর্সের সাধারণ তথ্য এডিট করুন"
                  >
                    <Edit2 style={{ width: '13px', height: '13px' }} /> Edit
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
          );
        })}
      </div>

      {displayedCourses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, marginTop: '1rem', transition: 'all 0.3s ease' }}>
          <BookOpen style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', color: theme.textMuted }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text }}>
            {statusFilter === 'Pending' ? 'অনুমোদনের অপেক্ষায় কোনো কোর্স নেই' : statusFilter === 'Approved' ? 'লাইভ কোনো কোর্স পাওয়া যায়নি' : 'No Courses Found'}
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', color: theme.textMuted, fontSize: '0.9rem' }}>
            {statusFilter === 'Pending' 
              ? 'আপনার সকল কোর্স অনুমোদিত হয়েছে অথবা এখনো কোনো কোর্স পেন্ডিং নেই।' 
              : 'নতুন একটি কোর্স তৈরি করুন এবং এডমিন অনুমোদনের জন্য সাবমিট করুন।'}
          </p>
          <button onClick={handleOpenAddCourse} className="btn btn-teal">
            + Create New Course
          </button>
        </div>
      )}
    </div>
  );
}
