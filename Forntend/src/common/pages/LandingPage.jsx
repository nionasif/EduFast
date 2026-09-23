import { useState, useEffect } from 'react';
import { getAdmissions, getCourses } from '../../data/mockData';
import CountdownTimer from '../components/CountdownTimer';
import GPACalculator from '../../student/components/GPACalculator';

export default function LandingPage({ onNavigate, onOpenLogin }) {
  const [admissions, setAdmissions] = useState(getAdmissions);
  const [courses, setCourses] = useState(getCourses);

  useEffect(() => {
    const handleUpdate = () => {
      setAdmissions(getAdmissions());
      setCourses(getCourses());
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => window.removeEventListener('edufast-data-update', handleUpdate);
  }, []);

  // Take first 3 admissions and 3 courses for landing previews
  const admissionsPreview = admissions.slice(0, 3);
  const coursesPreview = courses
    .filter(c => c.isApproved === true || c.status === 'Approved')
    .slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">
            <span>✨</span> Edtech Revolutionized
          </div>
          <h1 style={{ marginBottom: '1.25rem' }}>
            Accelerate Your Journey to <span style={{ color: 'var(--primary-teal)' }}>Top Universities</span>
          </h1>
          <p className="hero-subtitle">
            Edufast is Bangladesh's premier AI-powered learning and university admission assistant. Prepare, match, and conquer your exam targets.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={() => onNavigate('signup')}>
              Get Started for Free
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('courses')}>
              Explore Courses
            </button>
          </div>
        </div>

        <div className="hero-visual" style={{ position: 'relative' }}>
          <div className="hero-image-placeholder" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2.5rem 2rem',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="logo-dot" style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Edufast Live Hub</span>
              </div>
              <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                ● 1,420 studying now
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                  <span>🎯 BUET target threshold</span>
                  <span style={{ color: 'var(--cta-orange)', fontWeight: 'bold' }}>92% match</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92%', background: 'linear-gradient(90deg, var(--primary-teal), var(--cta-orange))' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                  <span>🎓 DU Ka Unit eligibility</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>100% matched</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', backgroundColor: '#10b981' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.1rem' }}>⏱</span>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase' }}>Mock time</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', color: 'white' }}>150+ hours</span>
                </div>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.1rem' }}>🏆</span>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg score</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', color: 'white' }}>89.5%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="floating-card floating-card-1">
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>DU Ka Unit</strong>
              <span className="badge badge-new" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>AI-Powered Mock</span>
            </div>
          </div>

          <div className="floating-card floating-card-2">
            <span style={{ fontSize: '1.5rem' }}>🚀</span>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>98.6% Score</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Top Student Rank</span>
            </div>
          </div>
        </div>
      </section>

      {/* GPA Calculator Section */}
      <section className="container" style={{ paddingBottom: 0, paddingTop: '1rem' }}>
        <GPACalculator />
      </section>

      {/* Main Two-Column Layout */}
      <div className="two-col-layout container">
        {/* Left Column: University Admissions */}
        <div>
          <h2 className="section-title">University Admissions</h2>
          <p style={{ marginBottom: '2rem' }}>Check active circular deadlines and countdowns for top public and engineering universities.</p>
          
          <div className="admissions-list">
            {admissionsPreview.map((univ) => (
              <div key={univ.id} className="admission-card">
                <div className="admission-header">
                  <div className="univ-info">
                    <div className="univ-icon">{univ.logo}</div>
                    <div>
                      <h4 className="univ-title">{univ.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Exams starts: {univ.examDate}</p>
                    </div>
                  </div>
                  <div>
                    <span className="deadline-badge">Active</span>
                  </div>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', margin: '0.5rem 0' }}>
                  {univ.description}
                </p>

                <div className="admission-details-grid">
                  <div className="admission-detail-item">
                    <span className="detail-label">Application Fee</span>
                    <span className="detail-val">৳ {univ.applicationFee}</span>
                  </div>
                  <div className="admission-detail-item">
                    <span className="detail-label">Total Units</span>
                    <span className="detail-val">{univ.units.length} Admission Units</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', display: 'block', marginBottom: '0.2rem' }}>
                      Application Deadline
                    </span>
                    <CountdownTimer deadline={univ.deadline} />
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onOpenLogin}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {admissionsPreview.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>No university circulars active</div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Circulars published by the admin will show up here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Top Courses */}
        <div>
          <h2 className="section-title">Edufast Top Courses</h2>
          <p style={{ marginBottom: '2rem' }}>Boost your preparation with Bangladesh's most sought-after lectures, led by top instructors.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {coursesPreview.map((course) => (
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
                  <h4 className="course-title">{course.title}</h4>
                  <span className="course-meta">By {course.instructor} • {course.duration}</span>
                  
                  <div className="course-rating">
                    <span className="star-rating">★ {course.rating}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>({course.reviewsCount} reviews)</span>
                  </div>
                  
                  <div className="course-footer">
                    <div className="course-price">
                      <span className="price-old">৳ {course.price}</span>
                      <span className="price-new">৳ {course.discountedPrice}</span>
                    </div>
                    <button className="btn btn-teal" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onOpenLogin}>
                      Explore Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {coursesPreview.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                <div style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>No courses published yet</div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Courses added by the admin will be featured here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div
              className="logo-container"
              style={{ color: 'white', marginBottom: '1rem', cursor: 'pointer' }}
              title="Go to Landing Page"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (onNavigate) onNavigate('landing');
              }}
            >
              Edufast<span className="logo-dot">.</span>
            </div>
            <p>Your ultimate portal to master university admissions and competitive examinations. Tailored courseware, real-time matching, and standard guidelines.</p>
            <p style={{ marginTop: '1.5rem' }}>📞 Call us: +880 1823 456789</p>
            <p>📧 Email: info@edufast.com</p>
            <p style={{ marginTop: '0.85rem' }}>
              <a href="#teacher" onClick={(e) => { e.preventDefault(); onNavigate('teacher'); }} style={{ color: 'var(--accent-yellow)', fontWeight: 600, textDecoration: 'none' }}>
                👨‍🏫 শিক্ষক ও মেন্টর পোর্টাল (Teacher Studio) →
              </a>
            </p>
            <p style={{ marginTop: '0.45rem' }}>
              <a href="#mentor" onClick={(e) => { e.preventDefault(); onNavigate('mentor'); }} style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
                🎓 ২৪/৭ মেন্টর ও টিএ ডেক্স (Mentor Desk Portal) →
              </a>
            </p>
          </div>
          
          <div className="footer-col">
            <h3>Office Locations</h3>
            <p><strong>Dhaka Main Hub:</strong><br />Red Crescent Tower, Level 4, Motijheel C/A, Dhaka-1000, Bangladesh.</p>
            <p style={{ marginTop: '1rem' }}><strong>Chittagong Center:</strong><br />Agrabad Commercial Area, Double-Decker Building, Level 2, Chittagong.</p>
          </div>

          <div className="footer-col">
            <h3>Affiliates & Partners</h3>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Bangladesh University Grants Commission (UGC)</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Dhaka University Alumni Association</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>ICT Division - Ministry of Telecom</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Veda Interactive Systems Ltd.</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Edufast. All rights reserved. Built with precision for premium user experiences.</p>
        </div>
      </footer>
    </div>
  );
}
