import { useState, useEffect } from 'react';
import EmailOTPModal from '../components/EmailOTPModal';

export default function LoginPage({
  onLoginSuccess,
  onTeacherLoginSuccess,
  addToast,
  onNavigate,
  initialRole = 'student'
}) {
  const [role, setRole] = useState(initialRole); // 'student' | 'teacher'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      addToast('Please enter both Email and Password.', 'error');
      return;
    }

    if (role === 'teacher') {
      // Teacher Login Logic
      try {
        const storedProfile = localStorage.getItem('edufast_teacher_profile');
        const teacherProfile = storedProfile ? JSON.parse(storedProfile) : null;
        
        if (teacherProfile && teacherProfile.email && email.toLowerCase() === teacherProfile.email.toLowerCase()) {
          localStorage.setItem('edufast_teacher_session', JSON.stringify(teacherProfile));
          if (onTeacherLoginSuccess) {
            onTeacherLoginSuccess(teacherProfile);
          } else {
            onNavigate('teacher');
          }
          addToast(`Welcome back, ${teacherProfile.name || 'Instructor'}!`, 'success');
          return;
        }
      } catch {}

      if (email.includes('@') && password.length >= 6) {
        const teacherData = {
          id: `teacher-${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          designation: 'Senior Instructor',
          subject: 'Higher Mathematics'
        };
        localStorage.setItem('edufast_teacher_session', JSON.stringify(teacherData));
        if (onTeacherLoginSuccess) {
          onTeacherLoginSuccess(teacherData);
        } else {
          onNavigate('teacher');
        }
        addToast(`Logged in successfully as ${teacherData.name}.`, 'success');
      } else {
        addToast('Invalid teacher credentials. Password must be at least 6 characters.', 'error');
      }
    } else {
      // Student Login
      setIsSubmitting(true);
      const cleanIdentifier = email.trim();

      fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanIdentifier, password })
      })
        .then(async (res) => {
          const data = await res.json();
          return { ok: res.ok, status: res.status, data };
        })
        .then(({ ok, status, data }) => {
          setIsSubmitting(false);

          if (status === 403 || data.requiresVerification) {
            addToast(data.error || 'Please verify your email before logging in.', 'error');
            setUnverifiedEmail(data.email || cleanIdentifier);
            setIsVerifyingOtp(true);
            return;
          }

          if (ok && data.success) {
            try {
              localStorage.setItem('edufast_student_session', JSON.stringify(data.user));
            } catch (e) {}
            onLoginSuccess(data.user);
            addToast('Welcome back to Edufast!', 'success');
            return;
          }

          addToast(data.error || 'Invalid credentials. Please check your email and password.', 'error');
        })
        .catch((err) => {
          setIsSubmitting(false);
          console.warn('Backend login unavailable:', err.message);
          addToast('Could not connect to authentication server. Please ensure backend is running.', 'error');
        });
    }
  };

  const handleSwitchRole = (newRole) => {
    setRole(newRole);
    setEmail('');
    setPassword('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, rgba(49, 151, 149, 0.05) 0%, rgba(15, 23, 42, 0.04) 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--card-bg, #ffffff)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-color, #e2e8f0)',
        padding: '2.25rem 2rem',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Role Toggle Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: 'var(--gray-100, #f1f5f9)',
          padding: '5px',
          borderRadius: '12px',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => handleSwitchRole('student')}
            style={{
              padding: '0.75rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: role === 'student' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--gray-700, #4a5568)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            🎓 Student (শিক্ষার্থী)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('teacher')}
            style={{
              padding: '0.75rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: role === 'teacher' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : 'var(--gray-700, #4a5568)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            👨‍🏫 Teacher (শিক্ষক)
          </button>
        </div>

        {/* Heading Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ color: 'var(--primary-teal)', fontSize: '1.75rem', margin: '0 0 0.4rem 0', fontWeight: 800 }}>
            {role === 'teacher' ? 'Teacher Studio Log In' : 'Student Log In'}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', margin: 0 }}>
            {role === 'teacher'
              ? 'Enter instructor credentials to manage courses and live streams.'
              : 'Enter your registered credentials to access your courses & mock tests.'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              {role === 'teacher' ? 'Email Address' : 'Email or Mobile Number (ইমেইল অথবা মোবাইল নম্বর)'}
            </label>
            <input
              type={role === 'teacher' ? 'email' : 'text'}
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder={role === 'teacher' ? 'e.g. teacher@edufast.com' : 'e.g. student@edufast.com or 018xxxxxxxx'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Password</label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  addToast('Password reset instructions will be sent to your registered email.', 'info');
                }}
                style={{ fontSize: '0.8rem', color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: role === 'teacher' ? 'var(--primary-teal, #319795)' : 'var(--cta-orange, #dd6b20)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Signing In...
              </>
            ) : (
              role === 'teacher' ? 'Log In to Teacher Studio' : 'Log In as Student'
            )}
          </button>
        </form>

        {unverifiedEmail && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: '#fffaf0', border: '1px solid #feebc8', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
            <span style={{ color: '#c05621' }}>⚠️ Account unverified. </span>
            <button
              type="button"
              onClick={() => setIsVerifyingOtp(true)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-teal)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Click here to verify email
            </button>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: 'var(--gray-600, #718096)' }}>
            {role === 'teacher' ? "Don't have a Teacher account yet?" : "Don't have an Edufast student account?"}{' '}
          </span>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate('signup', role);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-teal, #319795)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            {role === 'teacher' ? 'Register as Teacher →' : 'Create Free Account →'}
          </button>
        </div>
      </div>

      {/* Email OTP Verification Modal Overlay */}
      <EmailOTPModal
        isOpen={isVerifyingOtp}
        onClose={() => setIsVerifyingOtp(false)}
        email={unverifiedEmail}
        onVerificationSuccess={(verifiedUser) => {
          setIsVerifyingOtp(false);
          onLoginSuccess(verifiedUser);
          addToast('Email verified successfully! You are now logged in.', 'success');
        }}
        addToast={addToast}
      />
    </div>
  );
}
