import { useState, useEffect } from 'react';
import { getCourses } from '../../data/mockData';

export default function CourseHubPage({ user, onEnrollCourse, addToast, onOpenCoursePlayer }) {
  const [coursesList, setCoursesList] = useState(getCourses);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-courses'
  const [groupFilter, setGroupFilter] = useState('auto'); // 'auto', 'all', 'Science', 'Commerce', 'Arts'

  useEffect(() => {
    const handleUpdate = () => {
      setCoursesList(getCourses());
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => window.removeEventListener('edufast-data-update', handleUpdate);
  }, []);

  // Get enrolled courses details
  const myEnrolledCourses = coursesList.filter(course => 
    (user?.purchasedCourses || []).includes(course.id)
  );

  // Filter courses for explorer (only approved courses live on website)
  const getFilteredCourses = () => {
    const liveCourses = coursesList.filter(c => c.isApproved === true || c.status === 'Approved');
    if (groupFilter === 'auto') {
      return liveCourses.filter(course => course.group === user?.group);
    }
    if (groupFilter === 'all') {
      return liveCourses;
    }
    return liveCourses.filter(course => course.group === groupFilter);
  };

  const filteredCourses = getFilteredCourses();

  const handleEnroll = (course) => {
    if ((user?.purchasedCourses || []).includes(course.id)) {
      addToast(`You are already enrolled in ${course.title}.`, 'info');
      return;
    }
    onEnrollCourse(course.id);
    addToast(`Successfully enrolled in ${course.title}! Added to your Courses.`, 'success');
  };

  const handleStartLearning = (course) => {
    if (onOpenCoursePlayer) {
      onOpenCoursePlayer(course);
    } else {
      addToast(`Opening classroom for ${course.title}`, 'info');
    }
  };

  return (
    <div>
      {/* Course Banner */}
      <div className="course-hub-banner">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="badge badge-new" style={{ marginBottom: '0.75rem' }}>Udemy Partner Hub</span>
          <h1 style={{ color: 'white', fontSize: '2.3rem', marginBottom: '0.5rem' }}>Edufast Course Hub</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
            Acquire test-taking methodologies, standard board preps, and live solutions matching your syllabus.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        
        {/* Navigation Tabs (Explore vs My Courses) */}
        <div className="course-tabs-nav">
          <button 
            className={`course-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            🔍 Explore Courses
          </button>
          <button 
            className={`course-tab-btn ${activeTab === 'my-courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-courses')}
          >
            📚 My Enrolled Courses ({myEnrolledCourses.length})
          </button>
        </div>

        {/* TAB 1: EXPLORE COURSES */}
        {activeTab === 'explore' && (
          <div>
            {/* Category / Group Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-light)', padding: '1.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--gray-200)', marginBottom: '2rem' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', display: 'block' }}>
                  Smart Filters
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Highlighting: <strong>{groupFilter === 'auto' ? `Recommended for ${user.group} Group` : `Group - ${groupFilter}`}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${groupFilter === 'auto' ? 'btn-teal' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '36px' }}
                  onClick={() => setGroupFilter('auto')}
                >
                  ⭐ Recommended ({user.group})
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

            {/* Courses Grid */}
            <div className="course-hub-grid">
              {filteredCourses.map((course) => {
                const isEnrolled = user.purchasedCourses.includes(course.id);
                
                return (
                  <div key={course.id} className="course-card">
                    <div className="course-media">
                      {course.image}
                      <div className="course-badge-overlay">
                        <span className={`badge ${course.badge === 'AI-Powered' ? 'badge-ai' : 'badge-new'}`}>
                          {course.badge}
                        </span>
                      </div>
                    </div>
                    <div className="course-content">
                      <span className="badge" style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--gray-300)', color: 'var(--gray-600)', fontSize: '0.65rem', marginBottom: '0.5rem', alignSelf: 'flex-start', textTransform: 'none' }}>
                        {course.group} Module
                      </span>
                      <h4 className="course-title">{course.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                        By {course.instructor} • {course.duration}
                      </p>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem', height: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', webkitLineClamp: 2, webkitBoxOrient: 'vertical' }}>
                        {course.description}
                      </p>

                      <div className="course-rating">
                        {(course.reviewsCount && course.reviewsCount > 0) ? (
                          <>
                            <span className="star-rating">★ {course.rating}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>({course.reviewsCount} reviews)</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>নতুন কোর্স • ০ রিভিউ</span>
                        )}
                      </div>

                      <div className="course-footer">
                        <div className="course-price">
                          <span className="price-old">৳ {course.price}</span>
                          <span className="price-new">৳ {course.discountedPrice}</span>
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
                            >
                              Enroll
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--gray-500)', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--gray-200)', marginTop: '1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-charcoal)' }}>No courses available currently</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Courses added by the administrator from the Admin Portal will appear here.</p>
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
                  // Mock enrollment progress
                  const mockProgressPercent = course.id === 'course-phy-hsc' ? 45 : 12;
                  const mockLessonsCompleted = course.id === 'course-phy-hsc' ? 18 : 3;
                  const mockLessonsTotal = course.id === 'course-phy-hsc' ? 40 : 25;

                  return (
                    <div key={course.id} className="my-course-row">
                      <div className="my-course-img">{course.image}</div>
                      
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{course.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Instructor: {course.instructor}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                          <span>Course Progress</span>
                          <span style={{ color: 'var(--primary-teal)' }}>{mockProgressPercent}%</span>
                        </div>
                        <div className="progress-bar-outer">
                          <div className="progress-bar-inner" style={{ width: `${mockProgressPercent}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                          {mockLessonsCompleted} of {mockLessonsTotal} lectures completed
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
