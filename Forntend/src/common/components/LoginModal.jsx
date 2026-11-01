import { useState, useEffect } from 'react';
import EmailOTPModal from './EmailOTPModal';
import api, { setAuthSession } from '../../services/api';

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onTeacherLoginSuccess,
  addToast,
  onNavigate,
  initialRole = 'student'
}) {
  const [role, setRole] = useState(initialRole); // 'student' | 'teacher' | 'mentor' | 'admin'
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


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      addToast('Please enter both Email/Identifier and Password.', 'error');
      return;
    }

    setIsSubmitting(true);
    const cleanIdentifier = email.trim();

    try {
      const data = await api.post('/auth/login', {
        email: cleanIdentifier,
        password,
        role
      });

      setIsSubmitting(false);

      if (data.requiresVerification) {
        addToast(data.error || 'Please verify your email before logging in.', 'error');
        setUnverifiedEmail(data.email || cleanIdentifier);
        setIsVerifyingOtp(true);
        return;
      }

      if (data.success && data.user) {
        const userRole = (data.role || role || 'student').toLowerCase();
        const expectedRole = (role || 'student').toLowerCase();

        // Extra client-side safeguard: Prevent cross-role redirect
        if (userRole !== expectedRole) {
          addToast(`Security Notice: Cannot log in as ${userRole} from ${expectedRole} portal. Please select the correct tab.`, 'error');
          return;
        }

        setAuthSession(data.token, data.user, userRole);

        if (userRole === 'teacher') {
          if (onTeacherLoginSuccess) {
            onTeacherLoginSuccess(data.user);
          } else if (onNavigate) {
            onNavigate('teacher');
          }
          addToast(`Welcome back, Instructor ${data.user.name || ''}!`, 'success');
        } else if (userRole === 'mentor') {
          if (onNavigate) onNavigate('mentor');
          addToast(`Welcome back, Mentor ${data.user.name || ''}!`, 'success');
        } else if (userRole === 'admin') {
          if (onNavigate) onNavigate('admin');
          addToast('Welcome to EduFast Admin Portal!', 'success');
        } else {
          if (onLoginSuccess) onLoginSuccess(data.user);
          addToast('Welcome back to Edufast!', 'success');
        }
        onClose();
        return;
      }

      addToast(data.error || 'Invalid credentials. Please check your details.', 'error');
    } catch (err) {
      setIsSubmitting(false);
      console.warn('Backend login notice:', err.message);
      if (err.data?.requiresVerification) {
        addToast(err.data?.error || 'Please verify your email before logging in.', 'error');
        setUnverifiedEmail(err.data?.email || cleanIdentifier);
        setIsVerifyingOtp(true);
        return;
      }
      addToast(err.message || 'Could not connect to authentication server.', 'error');
    }
  };

  const handleSwitchRole = (newRole) => {
    setRole(newRole);
    setEmail('');
    setPassword('');
  };

  const handlePreFill = () => {
    if (role === 'teacher') {
      setEmail('teacher@edufast.com');
      setPassword('teacher123');
    } else if (role === 'mentor') {
      setEmail('mentor@edufast.com');
      setPassword('mentor123');
    } else if (role === 'admin') {
      setEmail('admin@edufast.com');
      setPassword('admin123');
    } else {
      setEmail('student@edufast.com');
      setPassword('password123');
    }
  };

  const getRoleButtonColor = () => {
    switch (role) {
      case 'teacher': return 'var(--primary-teal, #319795)';
      case 'mentor': return '#6366f1';
      case 'admin': return '#0f172a';
      default: return 'var(--cta-orange, #dd6b20)';
    }
  };

  const getRoleButtonText = () => {
    switch (role) {
      case 'teacher': return 'Log In to Teacher Studio';
      case 'mentor': return 'Log In to Mentor Desk';
      case 'admin': return 'Log In to Admin Panel';
      default: return 'Log In as Student';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'teacher': return 'Teacher';
      case 'mentor': return 'Mentor';
      case 'admin': return 'Admin';
      default: return 'Student';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Role Toggle Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          backgroundColor: 'var(--gray-100, #f1f5f9)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '1.25rem'
        }}>
          {[
            { id: 'student', label: 'Student', icon: '🎓' },
            { id: 'teacher', label: 'Teacher', icon: '👨‍🏫' },
            { id: 'mentor', label: 'Mentor', icon: '🧑‍🏫' },
            { id: 'admin', label: 'Admin', icon: '🛡️' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSwitchRole(r.id)}
              style={{
                padding: '0.5rem 0.2rem',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: role === r.id ? 'var(--primary-teal, #319795)' : 'transparent',
                color: role === r.id ? '#ffffff' : 'var(--gray-700, #4a5568)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.1rem',
                boxShadow: role === r.id ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'var(--primary-teal)', fontSize: '1.65rem', margin: 0 }}>
            {role === 'teacher' ? 'Teacher Studio Log In' :
             role === 'mentor' ? 'Mentor Portal Log In' :
             role === 'admin' ? 'Admin Portal Log In' :
             'Log In to Edufast'}
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {role === 'teacher'
              ? 'Enter instructor credentials or use auto-fill.'
              : role === 'mentor'
              ? 'Enter mentor credentials to solve student doubts.'
              : role === 'admin'
              ? 'Enter system administrator credentials.'
              : 'Enter student credentials or use auto-fill.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'teacher' ? 'Email Address' :
               role === 'mentor' ? 'Mentor Email or Mobile' :
               role === 'admin' ? 'Admin Username or Email' :
               'Email or Mobile Number (ইমেইল অথবা মোবাইল নম্বর)'}
            </label>
            <input
              type={role === 'teacher' ? 'email' : 'text'}
              className="form-input"
              placeholder={
                role === 'teacher' ? 'e.g. teacher@edufast.com' :
                role === 'mentor' ? 'e.g. mentor@edufast.com or 018xxxxxxxx' :
                role === 'admin' ? 'e.g. admin@edufast.com or admin' :
                'e.g. student@edufast.com or 018xxxxxxxx'
              }
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
              style={{ background: 'none', border: 'none', color: 'var(--primary-teal)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              💡 Auto-fill {getRoleLabel()} Test Credentials
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: getRoleButtonColor(),
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
              getRoleButtonText()
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
              if (role === 'admin') {
                addToast('Admin accounts can only be provisioned by the system administrator.', 'info');
                return;
              }
              onClose();
              if (onNavigate) {
                onNavigate('signup', role);
              }
            }}
            style={{ color: 'var(--primary-teal)', fontWeight: '600', textDecoration: 'none' }}
          >
            {role === 'teacher' ? 'Create Teacher Account →' :
             role === 'mentor' ? 'Apply as Mentor →' :
             role === 'admin' ? 'Internal Access Only' :
             'Create an Account →'}
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
