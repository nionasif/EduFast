import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../socket';
import { useLanguage } from '../../context/LanguageContext';

export default function CourseHubPage({ user, onEnrollCourse, addToast, onOpenCoursePlayer }) {
  const { language } = useLanguage();
  const [coursesList, setCoursesList] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-courses'
  const [groupFilter, setGroupFilter] = useState('auto'); // 'auto', 'all', 'Science', 'Commerce', 'Arts'
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/courses');
      const list = Array.isArray(res?.data) 
        ? res.data 
        : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      if (list.length > 0) {
        setCoursesList(list);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      if (addToast) addToast('Could not load courses from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const res = await api.get('/student/enrolled-courses', {
        params: { email: user?.email || 'student@edufast.com' }
      });
      const list = Array.isArray(res?.data) 
        ? res.data 
        : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      if (list.length > 0) {
        setEnrolledCourses(list);
      }
    } catch (err) {
      console.warn('Failed to load enrolled courses:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();

    const handleCourseDeleted = (deletedData) => {
      const deletedId = deletedData?.id;
      if (!deletedId) return;

      // 1. Immediately prune from courses list
      setCoursesList(prev => prev.filter(c => String(c.id) !== String(deletedId)));

      // 2. Immediately prune from enrolled courses list
      setEnrolledCourses(prev => prev.filter(c => String(c.id || c.courseId) !== String(deletedId)));

      // 3. Prune from student session in localStorage if present
      try {
        const studentSaved = localStorage.getItem('edufast_student_session');
        if (studentSaved) {
          const parsed = JSON.parse(studentSaved);
          if (Array.isArray(parsed?.purchasedCourses)) {
            parsed.purchasedCourses = parsed.purchasedCourses.filter(cid => String(cid) !== String(deletedId));
            localStorage.setItem('edufast_student_session', JSON.stringify(parsed));
          }
        }
      } catch (e) {}
    };

    const handleDataUpdate = (e) => {
      const detail = e.detail;
      if (detail && detail.type === 'course:deleted') {
        handleCourseDeleted(detail);
      } else {
        fetchCourses();
        fetchEnrolledCourses();
      }
    };

    socket.on('course:deleted', handleCourseDeleted);
    window.addEventListener('edufast-data-update', handleDataUpdate);
    window.addEventListener('edufast-subscription-update', handleDataUpdate);

    return () => {
      socket.off('course:deleted', handleCourseDeleted);
      window.removeEventListener('edufast-data-update', handleDataUpdate);
      window.removeEventListener('edufast-subscription-update', handleDataUpdate);
    };
  }, [user?.email]);

  // Combined enrolled IDs: either from user session or from backend enrollments
  const enrolledCourseIds = new Set([
    ...(user?.purchasedCourses || []).map(String),
    ...enrolledCourses.map(c => String(c.id || c.courseId))
  ]);

  // Get enrolled courses details for the "My Courses" tab
  const myEnrolledCourses = enrolledCourses.length > 0
    ? enrolledCourses
    : coursesList.filter(course => enrolledCourseIds.has(String(course.id)));

  // Filter courses for explorer (only approved courses live on website)
  const getFilteredCourses = () => {
    const liveCourses = coursesList.filter(c => c.isApproved === true || c.status === 'Approved' || c.isApproved === 1);
    const candidateCourses = liveCourses;

    const userGroup = user?.group || 'Science';
    if (groupFilter === 'auto') {
      return candidateCourses.filter(course => 
        (course.academicGroup || course.group || '').toLowerCase() === userGroup.toLowerCase()
      );
    }
    if (groupFilter === 'all') {
      return candidateCourses;
    }
    return candidateCourses.filter(course => 
      (course.academicGroup || course.group || '').toLowerCase() === groupFilter.toLowerCase()
    );
  };

  const filteredCourses = getFilteredCourses();

  const handleEnroll = async (course) => {
    if (enrolledCourseIds.has(course.id)) {
      if (addToast) addToast(`You are already enrolled in ${course.title}.`, 'info');
      return;
    }

    const price = Number(course.discountedPrice !== undefined ? course.discountedPrice : course.price) || 0;

    // If paid course, launch bKash / Nagad checkout modal!
    if (price > 0) {
      window.dispatchEvent(new CustomEvent('open-payment-modal', {
        detail: {
          item: {
            id: course.id,
            title: course.title,
            price: price,
            instructor: course.instructor,
            type: 'course'
          }
        }
      }));
      return;
    }

    // Direct enrollment for free courses
    try {
      setEnrollingCourseId(course.id);
      const res = await api.post(`/courses/${course.id}/enroll`, {
        studentEmail: user?.email,
        studentName: user?.name
      });

      if (res.data?.success) {
        if (addToast) addToast(res.data.message || `Successfully enrolled in ${course.title}!`, 'success');
        if (onEnrollCourse) {
          onEnrollCourse(course.id);
        }
        await fetchEnrolledCourses();
      } else {
        if (addToast) addToast(res.data?.error || 'Enrollment failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      const msg = err.response?.data?.error || 'Failed to enroll in course. Please check connection.';
      if (addToast) addToast(msg, 'error');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleStartLearning = (course) => {
    if (onOpenCoursePlayer) {
      onOpenCoursePlayer(course);
    } else if (addToast) {
      addToast(`Opening classroom for ${course.title}`, 'info');
    }
  };

  return (
    <div>
      {/* Course Banner */}
      <div className="course-hub-banner">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="badge badge-new" style={{ marginBottom: '0.75rem' }}>University Admission & Board Prep</span>
          <h1 style={{ color: 'white', fontSize: '2.3rem', marginBottom: '0.5rem' }}>EduFast Course Hub</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
            Master test-taking methodologies, standard board preps, and video lectures tailored to your university target.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        
        {/* Navigation Tabs (Explore vs My Courses) */}
        <div className="course-tabs-nav">
          <button 
            type="button"
            className={`course-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <span>🔍 {language === 'bn' ? 'সকল কোর্স' : 'Explore Courses'}</span>
            <span className="notranslate" style={{ marginLeft: '6px', fontWeight: 800 }}>({coursesList.length})</span>
          </button>
          <button 
            type="button"
            className={`course-tab-btn ${activeTab === 'my-courses' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('my-courses');
              fetchEnrolledCourses();
            }}
          >
            <span>📚 {language === 'bn' ? 'আমার এনরোল করা কোর্স' : 'My Enrolled Courses'}</span>
            <span className="notranslate" style={{ marginLeft: '6px', fontWeight: 800 }}>({myEnrolledCourses.length})</span>
          </button>
        </div>

        {/* TAB 1: EXPLORE COURSES */}
        {activeTab === 'explore' && (
          <div>
            {/* Category / Group Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-light)', padding: '1.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--gray-200)', marginBottom: '2rem' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', display: 'block' }}>
                  Target Filters
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Highlighting: <strong>{groupFilter === 'auto' ? `Recommended for ${user?.group || 'Science'} Group` : `Group - ${groupFilter}`}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${groupFilter === 'auto' ? 'btn-teal' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                  onClick={() => setGroupFilter('auto')}
                >
                  ⭐ Recommended ({user?.group || 'Science'})
                </button>
                <button 
                  className={`btn ${groupFilter === 'all' ? 'btn-teal' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                  onClick={() => setGroupFilter('all')}
                >
                  All Groups
                </button>
                {['Science', 'Commerce', 'Arts'].map((g) => (
                  <button 
                    key={g}
                    className={`btn ${groupFilter === g ? 'btn-teal' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                    onClick={() => setGroupFilter(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--gray-500)' }}>Connecting to EduFast course catalog...</p>
              </div>
            )}

            {/* Courses Grid */}
            {!isLoading && (
              <div className="course-hub-grid">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isThisEnrolling = enrollingCourseId === course.id;
                  
                  return (
                    <div key={course.id} className="course-card">
                      <div className="course-media" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff' }}>
                        {course.image || '📖'}
                        <div className="course-badge-overlay">
                          <span className={`badge ${course.badge === 'AI-Powered' ? 'badge-ai' : 'badge-new'}`}>
                            {course.badge || 'Verified'}
                          </span>
                        </div>
                      </div>
                      <div className="course-content">
                        <span className="badge" style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--gray-300)', color: 'var(--gray-600)', fontSize: '0.65rem', marginBottom: '0.5rem', alignSelf: 'flex-start', textTransform: 'none' }}>
                          {course.academicGroup || course.group || 'Admission'} Module
                        </span>
                        <h4 className="course-title">{course.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                          By {course.instructor} • {course.duration || 'Comprehensive'}
                        </p>
                        
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem', height: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.description}
                        </p>

                        <div className="course-rating">
                          {(course.reviewsCount && course.reviewsCount > 0) ? (
                            <>
                              <span className="star-rating">★ {course.rating || 4.9}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>({course.reviewsCount} reviews)</span>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>নতুন কোর্স • ০ রিভিউ</span>
                          )}
                        </div>

                        <div className="course-footer">
                          <div className="course-price">
                            {course.price > 0 && <span className="price-old">৳ {course.price}</span>}
                            <span className="price-new">৳ {course.discountedPrice !== undefined ? course.discountedPrice : (course.price || 0)}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => handleStartLearning(course)}
                            >
                              Classroom ▶
                            </button>

                            {isEnrolled ? (
                              <button 
                                className="btn btn-teal" 
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                                onClick={() => handleStartLearning(course)}
                              >
                                ✓ Enrolled
                              </button>
                            ) : (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                                onClick={() => handleEnroll(course)}
                                disabled={isThisEnrolling}
                              >
                                {isThisEnrolling ? 'Enrolling...' : 'Enroll'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && filteredCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--gray-500)', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--gray-200)', marginTop: '1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-charcoal)' }}>No courses available in this category</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Check back soon or choose "All Groups" to explore all available masterclasses.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ENROLLED COURSES */}
        {activeTab === 'my-courses' && (
          <div className="my-courses-container">
            <h3 style={{ borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-teal)' }}>
              Your Classroom Dashboard
            </h3>

            {myEnrolledCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'white', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--gray-300)' }}>
                <span style={{ fontSize: '3rem' }}>📁</span>
                <h4 style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>You haven't enrolled in any courses yet.</h4>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1.25rem' }} 
                  onClick={() => setActiveTab('explore')}
                >
                  Find Recommended Courses
                </button>
              </div>
            ) : (
              <div>
                {myEnrolledCourses.map((course) => {
                  const progress = course.progressPercent || 0;
                  const completed = course.completedLessons || 0;
                  const total = course.totalLessons || 20;

                  return (
                    <div key={course.id || course.courseId} className="my-course-row">
                      <div className="my-course-img" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {course.image || '📖'}
                      </div>
                      
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{course.title || course.courseTitle}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Instructor: {course.instructor || 'EduFast Academic Faculty'}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                          <span>Course Progress</span>
                          <span style={{ color: 'var(--primary-teal)' }}>{progress}%</span>
                        </div>
                        <div className="progress-bar-outer">
                          <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                          {completed} of {total} lectures completed
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-teal" 
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                          onClick={() => handleStartLearning(course)}
                        >
                          Resume Learning ▶
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
