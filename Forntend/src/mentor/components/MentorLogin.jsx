import React, { useState } from 'react';
import api from '../../services/api';
import { 
  ShieldCheck, 
  Key, 
  Mail, 
  User, 
  Phone,
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

export default function MentorLogin({
  onLoginSuccess,
  onExitToPublic
}) {
  const [activeMode, setActiveMode] = useState('login'); // 'login' | 'signup'
  
  // Login State
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign-Up State
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    mobile: '',
    institution: '',
    subject: 'Physics',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccessMsg, setSignUpSuccessMsg] = useState('');

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const { identifier, password } = loginForm;
    const cleanId = identifier.trim().toLowerCase();

    try {
      const res = await api.post('/auth/login', {
        email: cleanId,
        password,
        role: 'mentor'
      });

      const data = res.data || res;
      if (data && (data.token || data.user || data.success)) {
        const authenticatedMentor = {
          name: data.user?.name || 'Academic Mentor',
          email: data.user?.email || cleanId,
          mentorId: data.user?.id ? `MENTOR-${data.user.id}` : `MENTOR-${Date.now().toString().slice(-4)}`,
          designation: data.user?.designation || 'Academic Teaching Assistant & Doubt Solver',
          institution: data.user?.institution || 'Top University',
          subject: data.user?.subject || 'Science',
          rating: 4.9,
          solvedCount: 0,
          coinsEarned: 0,
          token: data.token
        };

        localStorage.setItem('edufast_mentor_session', JSON.stringify(authenticatedMentor));
        if (data.token) {
          localStorage.setItem('edufast_token', data.token);
        }
        if (onLoginSuccess) {
          onLoginSuccess(authenticatedMentor);
        }
      } else {
        setLoginError(data?.error || data?.message || 'Invalid Mentor ID or Password.');
      }
    } catch (err) {
      console.error('Mentor login error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid Mentor credentials.';
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Sign-Up
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');

    if (!signUpForm.name.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (!signUpForm.mobile.trim() || signUpForm.mobile.trim().length < 11) {
      setSignUpError('Please enter a valid 11-digit mobile number.');
      return;
    }
    if (!signUpForm.institution.trim()) {
      setSignUpError('Please enter your current university or institution.');
      return;
    }
    if (!signUpForm.email.trim() || !signUpForm.email.includes('@')) {
      setSignUpError('Please enter a valid email address.');
      return;
    }
    if (signUpForm.password.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/register', {
        name: signUpForm.name.trim(),
        mobile: signUpForm.mobile.trim(),
        email: signUpForm.email.trim().toLowerCase(),
        password: signUpForm.password,
        role: 'mentor',
        institution: signUpForm.institution.trim(),
        subject: signUpForm.subject
      });

      const data = res.data || res;
      const returnedUser = data?.user || {};
      const newMentor = {
        name: returnedUser.name || signUpForm.name.trim(),
        email: returnedUser.email || signUpForm.email.trim().toLowerCase(),
        mobile: returnedUser.mobile || signUpForm.mobile.trim(),
        mentorId: returnedUser.id || `MENTOR-${Math.floor(1000 + Math.random() * 9000)}`,
        designation: "Academic Teaching Assistant & Doubt Solver",
        institution: returnedUser.institution || signUpForm.institution.trim(),
        subject: returnedUser.subject || signUpForm.subject,
        rating: returnedUser.rating || 5.0,
        solvedCount: returnedUser.doubtsResolved || 0,
        coinsEarned: 0,
        token: data?.token,
        role: 'mentor',
        registeredAt: new Date().toISOString()
      };

      localStorage.setItem('edufast_mentor_session', JSON.stringify(newMentor));
      if (data?.token) {
        localStorage.setItem('edufast_token', data.token);
      }
      setSignUpSuccessMsg('Account created successfully! Connecting you to duty shift...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(newMentor);
        }
      }, 700);
    } catch (err) {
      console.error('Mentor registration error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create mentor account.';
      setSignUpError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b14',
      backgroundImage: `
        radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(14, 165, 233, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      color: '#f8fafc',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1)',
        padding: '2.5rem 2rem',
        position: 'relative'
      }}>
        {/* Top Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            borderRadius: '999px',
            padding: '0.3rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            24/7 Academic Solver Squad
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EduFast Mentor Desk
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.88rem',
            margin: 0,
            lineHeight: 1.5
          }}>
            Isolated terminal for BUET/Medical Teaching Assistants to claim and solve live student doubts.
          </p>
        </div>

        {/* Tab Switcher: Login vs Sign Up */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => { setActiveMode('login'); setLoginError(''); setSignUpError(''); }}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeMode === 'login' ? '#10b981' : 'transparent',
              color: activeMode === 'login' ? '#022c22' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Key style={{ width: '14px', height: '14px' }} />
            Sign In (লগইন)
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('signup'); setLoginError(''); setSignUpError(''); }}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeMode === 'signup' ? '#10b981' : 'transparent',
              color: activeMode === 'signup' ? '#022c22' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <GraduationCap style={{ width: '15px', height: '15px' }} />
            Sign Up (মেন্টর সাইন আপ)
          </button>
        </div>

        {/* Errors & Alerts */}
        {loginError && activeMode === 'login' && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ef4444' }} />
            <span>{loginError}</span>
          </div>
        )}

        {signUpError && activeMode === 'signup' && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ef4444' }} />
            <span>{signUpError}</span>
          </div>
        )}

        {signUpSuccessMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0, color: '#10b981' }} />
            <span>{signUpSuccessMsg}</span>
          </div>
        )}

        {/* ----------------- MODE 1: LOGIN FORM ----------------- */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Mentor ID / Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Mail style={{ width: '16px', height: '16px' }} />
                </span>
                <input
                  type="text"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  placeholder="mentor@edufast.com or MENTOR-101"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.85rem 0 2.4rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Duty Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Key style={{ width: '16px', height: '16px' }} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.85rem 0 2.4rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#10b981',
                color: '#022c22',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              {isSubmitting ? 'Authenticating Shift...' : 'Enter 24/7 Mentor Desk ⚡'}
            </button>
          </form>
        )}

        {/* ----------------- MODE 2: SIGN UP FORM ----------------- */}
        {activeMode === 'signup' && (
          <form onSubmit={handleSignUpSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Full Name (পূর্ণ নাম)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <User style={{ width: '15px', height: '15px' }} />
                </span>
                <input
                  type="text"
                  value={signUpForm.name}
                  onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                  placeholder="e.g. Dr. Sadia / Engr. Tanvir Ahmed"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '42px',
                    padding: '0 0.85rem 0 2.4rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Mobile Number (মোবাইল নম্বর)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Phone style={{ width: '15px', height: '15px' }} />
                </span>
                <input
                  type="tel"
                  value={signUpForm.mobile}
                  onChange={(e) => setSignUpForm({ ...signUpForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="e.g. 01712345678"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '42px',
                    padding: '0 0.85rem 0 2.4rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Institution / University
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                    <GraduationCap style={{ width: '15px', height: '15px' }} />
                  </span>
                  <input
                    type="text"
                    value={signUpForm.institution}
                    onChange={(e) => setSignUpForm({ ...signUpForm, institution: e.target.value })}
                    placeholder="e.g. BUET, DMC, DU"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: '42px',
                      padding: '0 0.85rem 0 2.4rem',
                      backgroundColor: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Subject Expertise
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                    <BookOpen style={{ width: '15px', height: '15px' }} />
                  </span>
                  <select
                    value={signUpForm.subject}
                    onChange={(e) => setSignUpForm({ ...signUpForm, subject: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: '42px',
                      padding: '0 0.85rem 0 2.4rem',
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Higher Math">Higher Math</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="ICT">ICT & Programming</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Mail style={{ width: '15px', height: '15px' }} />
                </span>
                <input
                  type="email"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                  placeholder="your.email@university.edu"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '42px',
                    padding: '0 0.85rem 0 2.4rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={signUpForm.password}
                  onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                  placeholder="At least 6 chars"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '42px',
                    padding: '0 0.85rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '42px',
                    padding: '0 0.85rem',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#10b981',
                color: '#022c22',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              {isSubmitting ? 'Registering TA Account...' : 'Register & Enter Duty Shift 🚀'}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={onExitToPublic}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <ArrowLeft style={{ width: '15px', height: '15px' }} /> Return to EduFast Public Platform
          </button>
        </div>
      </div>
    </div>
  );
}
