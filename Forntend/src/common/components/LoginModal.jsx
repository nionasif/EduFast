import { useState, useEffect } from 'react';
import { DEFAULT_USER, DEFAULT_TEACHER, getTeacherProfile } from '../../data/mockData';
import EmailOTPModal from './EmailOTPModal';

export default function LoginModal({
  isOpen,
  onClose,
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

  // Synchronize role whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole || 'student');
      setEmail('');
      setPassword('');
      setUnverifiedEmail('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handlePreFill = () => {
    if (role === 'teacher') {
      setEmail('teacher@edufast.com');
      setPassword('password123');
    } else {
      setEmail('student@edufast.com');
      setPassword('password123');
    }
  };

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
          onClose();
          return;
        }
      } catch { }

      if (email.includes('@') && password.length >= 6) {
        // Authenticated Teacher User
        const teacherData = {
          ...DEFAULT_TEACHER,
          id: `teacher-${Date.now()}`,
          name: email.split('@')[0],
          email: email
        };
        localStorage.setItem('edufast_teacher_session', JSON.stringify(teacherData));
        if (onTeacherLoginSuccess) {
          onTeacherLoginSuccess(teacherData);
        } else {
          onNavigate('teacher');
        }
        addToast(`Logged in successfully as ${teacherData.name}.`, 'success');
        onClose();
      } else {
        addToast('Invalid teacher credentials. Password must be at least 6 characters.', 'error');
      }
    } else {
      // Student Login with Backend Verification Check
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

          // If user is unverified (status 403)
          if (status === 403 || data.requiresVerification) {
            addToast(data.error || 'Please verify your email before logging in.', 'error');
            setUnverifiedEmail(data.email || cleanIdentifier);
            setIsVerifyingOtp(true);
            return;
          }

          if (ok && data.success) {
            try {
              localStorage.setItem('edufast_student_session', JSON.stringify(data.user));
            } catch (e) { }
            onLoginSuccess(data.user);
            addToast('Welcome back to Edufast!', 'success');
            onClose();
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Role Toggle Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          backgroundColor: 'var(--gray-100, #f1f5f9)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => handleSwitchRole('student')}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: role === 'student' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--gray-700, #4a5568)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            🎓 Student (শিক্ষার্থী)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('teacher')}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: role === 'teacher' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : 'var(--gray-700, #4a5568)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            👨‍🏫 Teacher (শিক্ষক)
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'var(--primary-teal)', fontSize: '1.65rem', margin: 0 }}>
            {role === 'teacher' ? 'Teacher Studio Log In' : 'Log In to Edufast'}
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {role === 'teacher'
              ? 'Enter instructor credentials or use the auto-fill helper.'
              : 'Enter student credentials or use the auto-fill helper.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'teacher' ? 'Email Address' : 'Email or Mobile Number (ইমেইল অথবা মোবাইল নম্বর)'}
            </label>
            <input
              type={role === 'teacher' ? 'email' : 'text'}
              className="form-input"
              placeholder={role === 'teacher' ? 'e.g. teacher@edufast.com' : 'e.g. student@edufast.com or 018xxxxxxxx'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Quick Pre-fill helper */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handlePreFill}
              style={{ background: 'none', border: 'none', color: 'var(--primary-teal)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
            >
              💡 Auto-fill {role === 'teacher' ? 'Teacher' : 'Student'} Test Credentials
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', height: '46px', backgroundColor: role === 'teacher' ? 'var(--primary-teal, #319795)' : 'var(--cta-orange, #dd6b20)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
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
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffaf0', border: '1px solid #feebc8', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              addToast('Password reset link sent to your email!', 'success');
            }}
            style={{ color: 'var(--gray-500)', textDecoration: 'none' }}
          >
            Forgot Password?
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              if (onNavigate) {
                onNavigate('signup', role);
              }
            }}
            style={{ color: 'var(--primary-teal)', fontWeight: '600', textDecoration: 'none' }}
          >
            {role === 'teacher' ? 'Create Teacher Account →' : 'Create an Account →'}
          </a>
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
          onClose();
        }}
        addToast={addToast}
      />
    </div>
  );
}
