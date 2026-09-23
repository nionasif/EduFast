import { getAdmissions, getCourses } from '../../data/mockData';
import Leaderboard from '../../student/components/Leaderboard';
import CountdownTimer from '../components/CountdownTimer';

export default function DashboardPage({ user, onNavigate }) {
  // Show all university admissions
  const admissions = getAdmissions();
  const admissionsPreview = admissions;
  
  // Recommend courses based on group, but fall back to first 3 if none
  const courses = getCourses();
  const recommendedCourses = (courses || [])
    .filter(course => !user?.group || course.group === user.group || course.academicGroup === user.group)
    .slice(0, 3);

  const sscGpa = Number(user?.ssc?.gpa) || 0;
  const hscGpa = Number(user?.hsc?.gpa) || 0;
  const hasGpa = (sscGpa + hscGpa) > 0;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      
      {/* Top Welcome Banner */}
      <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
          Welcome back, <span style={{ color: 'var(--primary-teal)' }}>{user?.name || 'Student'}</span>!
        </h1>
        <p style={{ color: 'var(--gray-600)', margin: 0 }}>
          Group: <strong>{user?.group || 'General'}</strong> • SSC GPA: <strong>{sscGpa > 0 ? sscGpa.toFixed(2) : 'N/A'}</strong> • HSC GPA: <strong>{hscGpa > 0 ? hscGpa.toFixed(2) : 'N/A'}</strong>
        </p>
      </div>

      {/* Dynamic Leaderboard */}
      <Leaderboard user={user} onNavigate={onNavigate} />

      {/* Main Two-Column Layout */}
      <div className="two-col-layout" style={{ padding: 0, marginTop: '2rem' }}>
        
        {/* Left Column: University Admissions Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-teal)' }}>University Admissions</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => onNavigate('admissions')}
            >
              See All Circulars ({admissions.length})
            </button>
          </div>
          
          <div className="admissions-list">
            {admissionsPreview.map((univ) => {
              // Check eligibility for quick dashboard badge display
              const userGroup = (user?.group || '').trim().toLowerCase();
              const eligibleUnitsCount = (univ.units || []).filter(
                unit => (!userGroup || !unit.group || unit.group === 'All' || unit.group.toLowerCase() === userGroup) && 
                        hasGpa && (sscGpa + hscGpa) >= (unit.minGpa - 0.01)
              ).length;
              const totalUnivUnits = Array.isArray(univ.units) ? univ.units.length : 0;

              return (
                <div key={univ.id} className="admission-card">
                  <div className="admission-header">
                    <div className="univ-info">
                      <div className="univ-icon" style={{ width: '40px', height: '40px', fontSize: '1.6rem' }}>
                        {univ.logo}
                      </div>
                      <div>
                        <h4 className="univ-title" style={{ fontSize: '1.1rem' }}>{univ.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Exams: {univ.examDate}</p>
                      </div>
                    </div>
                    <div>
                      {hasGpa ? (
                        eligibleUnitsCount > 0 ? (
                          <span className="badge" style={{ backgroundColor: '#c6f6d5', color: '#22543d', fontSize: '0.65rem' }}>
                            {eligibleUnitsCount} Unit(s) Match
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#fed7d7', color: '#742a2a', fontSize: '0.65rem' }}>
                            0 Matches
                          </span>
                        )
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem', border: '1px solid #bae6fd' }}>
                          {totalUnivUnits} Active Units
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'block', marginBottom: '0.1rem' }}>
                        Deadline Counter
                      </span>
                      <CountdownTimer deadline={univ.deadline} />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => onNavigate('admissions', univ.id)}
                    >
                      Check Eligibility
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Courses Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-teal)' }}>Recommended Courses</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => onNavigate('courses')}
            >
              Course Hub
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {recommendedCourses.map((course) => {
              const isEnrolled = user.purchasedCourses.includes(course.id);
              
              return (
                <div key={course.id} className="course-card" style={{ flexDirection: 'row', minHeight: '130px' }}>
                  <div className="course-media" style={{ width: '120px', height: 'auto', fontSize: '2.5rem', flexShrink: 0 }}>
                    {course.image}
                  </div>
                  <div className="course-content" style={{ padding: '1rem', justifyContent: 'center' }}>
                    <h4 className="course-title" style={{ fontSize: '1rem', height: 'auto', marginBottom: '0.25rem', display: 'block', webkitLineClamp: 'none' }}>
                      {course.title}
                    </h4>
                    <span className="course-meta" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>
                      By {course.instructor} • {course.duration}
                    </span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span className="price-new" style={{ fontSize: '1.1rem' }}>৳ {course.discountedPrice}</span>
                      {isEnrolled ? (
                        <span className="badge" style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', textTransform: 'none' }}>
                          ✓ Enrolled
                        </span>
                      ) : (
                        <button 
                          className="btn btn-teal" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onNavigate('courses')}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
