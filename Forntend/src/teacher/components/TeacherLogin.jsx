import React, { useState } from 'react';
import { 
  Radio, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft, 
  Sun, 
  Moon, 
  GraduationCap, 
  Key, 
  User, 
  BookOpen, 
  Building 
} from 'lucide-react';

export default function TeacherLogin({
  loginForm,
  setLoginForm,
  loginError,
  handleTeacherLogin,
  handleTeacherRegister,
  onExitToPublic,
  isDarkMode,
  toggleDarkMode
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Sign up state
  const [signupForm, setSignupForm] = useState({
    name: '',
    subject: 'Higher Mathematics',
    institution: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signupError, setSignupError] = useState('');

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setSignupError('');

    if (!signupForm.name.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!signupForm.institution.trim()) {
      setSignupError('Please enter your institution or college name.');
      return;
    }
    if (!signupForm.email.trim() || !signupForm.email.includes('@')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (signupForm.password.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (handleTeacherRegister) {
      handleTeacherRegister({
        name: signupForm.name.trim(),
        subject: signupForm.subject,
        institution: signupForm.institution.trim(),
        email: signupForm.email.trim(),
        designation: `Senior Instructor (${signupForm.subject})`
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode 
        ? 'radial-gradient(circle at top right, #134e4a 0%, #0f172a 50%, #020617 100%)' 
        : 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Floating Theme Switcher */}
      <button
        type="button"
        onClick={toggleDarkMode}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.15)',
          border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '20px',
          padding: '0.4rem 0.85rem',
          color: isDarkMode ? '#fbbf24' : '#f1f5f9',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        {isDarkMode ? <Sun style={{ width: '15px', height: '15px', color: '#fbbf24' }} /> : <Moon style={{ width: '15px', height: '15px', color: '#cbd5e1' }} />}
        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        borderRadius: '16px',
        boxShadow: isDarkMode 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)' 
          : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        padding: '2.5rem 2rem',
        border: isDarkMode ? '1px solid #1f2937' : '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(49, 151, 149, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            color: 'var(--primary-teal)'
          }}>
            <Radio style={{ width: '30px', height: '30px' }} />
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: isDarkMode ? '#f8fafc' : '#1a202c', margin: '0 0 0.4rem 0' }}>
            EduFast Teacher Studio
          </h2>
          <p style={{ color: isDarkMode ? '#94a3b8' : '#718096', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
            Broadcast live interactive classes, create complete courses, and upload recorded lectures.
          </p>
        </div>

        {/* Tab Toggle: Login vs Sign-Up */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
          backgroundColor: isDarkMode ? '#1e293b' : '#edf2f7',
          padding: '0.35rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: authMode === 'login' ? 'var(--primary-teal)' : 'transparent',
              color: authMode === 'login' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#4a5568'),
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Key style={{ width: '14px', height: '14px' }} />
            Teacher Sign In (লগইন)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: authMode === 'signup' ? 'var(--primary-teal)' : 'transparent',
              color: authMode === 'signup' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#4a5568'),
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <GraduationCap style={{ width: '15px', height: '15px' }} />
            Teacher Sign Up (রেজিস্ট্রেশন)
          </button>
        </div>

        {/* Login Error */}
        {loginError && authMode === 'login' && (
          <div style={{
            backgroundColor: '#fed7d7',
            color: '#c53030',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{loginError}</span>
          </div>
        )}

        {/* Signup Error */}
        {signupError && authMode === 'signup' && (
          <div style={{
            backgroundColor: '#fed7d7',
            color: '#c53030',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{signupError}</span>
          </div>
        )}

        {/* ---------------- LOGIN MODE ---------------- */}
        {authMode === 'login' && (
          <form onSubmit={handleTeacherLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="teacher@edufast.com"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '42px',
                  fontSize: '0.9rem',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                  color: isDarkMode ? '#f8fafc' : '#1a202c'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.4rem' }}>
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '42px',
                  fontSize: '0.9rem',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                  color: isDarkMode ? '#f8fafc' : '#1a202c'
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-teal"
              style={{
                width: '100%',
                height: '44px',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              Enter Studio <Sparkles style={{ width: '16px', height: '16px' }} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: isDarkMode ? '#94a3b8' : '#718096' }}>Don't have a teacher account? </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onExitToPublic) onExitToPublic('signup', 'teacher');
                }}
                style={{ color: 'var(--primary-teal)', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign Up with Mobile OTP →
              </a>
            </div>
          </form>
        )}

        {/* ---------------- SIGN-UP MODE ---------------- */}
        {authMode === 'signup' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                Full Name (শিক্ষকের নাম)
              </label>
              <input
                type="text"
                value={signupForm.name}
                onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                placeholder="e.g. Dr. Mahfuzur Rahman"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '40px',
                  fontSize: '0.88rem',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                  color: isDarkMode ? '#f8fafc' : '#1a202c'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                  Teaching Subject
                </label>
                <select
                  value={signupForm.subject}
                  onChange={e => setSignupForm({ ...signupForm, subject: e.target.value })}
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '40px',
                    fontSize: '0.85rem',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                    color: isDarkMode ? '#f8fafc' : '#1a202c'
                  }}
                >
                  <option value="Higher Mathematics">Higher Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="ICT & Computer">ICT & Computer</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                  College / University
                </label>
                <input
                  type="text"
                  value={signupForm.institution}
                  onChange={e => setSignupForm({ ...signupForm, institution: e.target.value })}
                  placeholder="e.g. Dhaka College / BUET"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '40px',
                    fontSize: '0.85rem',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                    color: isDarkMode ? '#f8fafc' : '#1a202c'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                Email Address (ইমেইল)
              </label>
              <input
                type="email"
                value={signupForm.email}
                onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                placeholder="teacher.name@edufast.com"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '40px',
                  fontSize: '0.88rem',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                  color: isDarkMode ? '#f8fafc' : '#1a202c'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '40px',
                    fontSize: '0.85rem',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                    color: isDarkMode ? '#f8fafc' : '#1a202c'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#4a5568', marginBottom: '0.35rem' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '40px',
                    fontSize: '0.85rem',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? '#374151' : '#cbd5e0',
                    color: isDarkMode ? '#f8fafc' : '#1a202c'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-teal"
              style={{
                width: '100%',
                height: '44px',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              Register & Launch Studio 🚀
            </button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          borderTop: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem'
        }}>
          <button
            type="button"
            onClick={() => onExitToPublic('landing')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-teal)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft style={{ width: '15px', height: '15px' }} /> Public Home
          </button>

          <button
            type="button"
            onClick={() => onExitToPublic('login', 'student')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-teal)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎓 Student Login →
          </button>
        </div>
      </div>
    </div>
  );
}
