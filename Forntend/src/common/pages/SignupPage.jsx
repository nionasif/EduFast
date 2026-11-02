import { useState, useEffect } from 'react';
import EmailVerification from '../components/EmailVerification';
import EmailOTPModal from '../components/EmailOTPModal';
import api from '../../services/api';

const BOARDS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Comilla', 'Barisal',
  'Jessore', 'Sylhet', 'Dinajpur', 'Mymensingh', 'Madrasah', 'Technical'
];

// Generates 35 years of passing history (e.g. 2026 down to 1990)
const CURRENT_YEAR = new Date().getFullYear();
const PASSING_YEARS = Array.from({ length: 37 }, (_, i) => String(CURRENT_YEAR - i));

export default function SignupPage({
  onRegisterSuccess,
  onTeacherRegisterSuccess,
  addToast,
  onNavigate,
  initialRole = 'student',
  onOpenLogin
}) {
  const [role, setRole] = useState(initialRole); // 'student' | 'teacher'

  // Email OTP Modal State
  const [isEmailOtpOpen, setIsEmailOtpOpen] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState('');
  const [pendingStudent, setPendingStudent] = useState(null);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
    try {
      const saved = localStorage.getItem('edufast_student_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || (parsed.name && parsed.name.trim()))) {
          if (onNavigate) onNavigate('dashboard');
        }
      }
    } catch { }
  }, [initialRole, onNavigate]);

  // -------------------------------------------------------------
  // STUDENT FLOW STATE
  // -------------------------------------------------------------
  const [studentMobile, setStudentMobile] = useState('');
  const [isStudentEmailVerified, setIsStudentEmailVerified] = useState(false);
  const isStudentMobileVerified = isStudentEmailVerified; // Link form unlock state to email verification

  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    fathersName: '',
    mothersName: '',
    dob: '',
    email: '',
    group: 'Science'
  });

  const [sscDetails, setSscDetails] = useState({
    roll: '',
    reg: '',
    board: 'Dhaka',
    year: '2024',
    gpa: '',
    school: ''
  });

  const [hscDetails, setHscDetails] = useState({
    roll: '',
    reg: '',
    board: 'Dhaka',
    year: '2026',
    gpa: '',
    college: ''
  });

  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });

  const [isVerifyingSsc, setIsVerifyingSsc] = useState(false);
  const [isVerifyingHsc, setIsVerifyingHsc] = useState(false);
  const [isSscVerified, setIsSscVerified] = useState(false);
  const [isHscVerified, setIsHscVerified] = useState(false);

  // Live Education Board Captcha Modal State
  const [showBoardCaptchaModal, setShowBoardCaptchaModal] = useState(false);
  const [captchaSessionId, setCaptchaSessionId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isSubmittingCaptcha, setIsSubmittingCaptcha] = useState(false);
  const [isReloadingCaptcha, setIsReloadingCaptcha] = useState(false);
  const [activeExamType, setActiveExamType] = useState('ssc');
  const [captchaError, setCaptchaError] = useState('');

  // Manual Year Input Toggle States (supports students who passed 10+ years ago)
  const [isManualSscYear, setIsManualSscYear] = useState(false);
  const [isManualHscYear, setIsManualHscYear] = useState(false);

  const isStudentFormValid = () => {
    if (!isStudentEmailVerified) return false;
    if (!studentMobile || studentMobile.length < 11) return false;
    if (!personalInfo.name || !personalInfo.fathersName || !personalInfo.mothersName || !personalInfo.dob || !personalInfo.group) {
      return false;
    }
    if (!sscDetails.roll || !sscDetails.reg || !sscDetails.board || !sscDetails.year || !sscDetails.gpa || !sscDetails.school) {
      return false;
    }
    if (!hscDetails.roll || !hscDetails.reg || !hscDetails.board || !hscDetails.year || !hscDetails.gpa || !hscDetails.college) {
      return false;
    }
    if (!passwords.password || !passwords.confirmPassword) {
      return false;
    }
    if (passwords.password !== passwords.confirmPassword) {
      return false;
    }
    const sscGpa = parseFloat(sscDetails.gpa);
    const hscGpa = parseFloat(hscDetails.gpa);
    if (isNaN(sscGpa) || sscGpa < 1.0 || sscGpa > 5.0) return false;
    if (isNaN(hscGpa) || hscGpa < 1.0 || hscGpa > 5.0) return false;

    return true;
  };

  const applyVerifiedResult = (examType, resultInfo) => {
    if (!resultInfo) return;
    if (resultInfo.name) {
      setPersonalInfo((prev) => ({
        ...prev,
        name: prev.name && prev.name.trim() ? prev.name : resultInfo.name,
        fathersName: prev.fathersName && prev.fathersName.trim() ? prev.fathersName : (resultInfo.fathersName || prev.fathersName),
        mothersName: prev.mothersName && prev.mothersName.trim() ? prev.mothersName : (resultInfo.mothersName || prev.mothersName),
        group: resultInfo.group || prev.group
      }));
    }

    if (examType === 'ssc') {
      setSscDetails((prev) => {
        const hasValidGpa = resultInfo.gpa !== undefined && resultInfo.gpa !== null && parseFloat(resultInfo.gpa) > 0;
        const hasValidInst = resultInfo.institute && resultInfo.institute !== 'School/College';
        return {
          ...prev,
          gpa: hasValidGpa ? String(resultInfo.gpa) : prev.gpa,
          school: hasValidInst ? resultInfo.institute : prev.school
        };
      });
      setIsSscVerified(true);
    } else {
      setHscDetails((prev) => {
        const hasValidGpa = resultInfo.gpa !== undefined && resultInfo.gpa !== null && parseFloat(resultInfo.gpa) > 0;
        const hasValidInst = resultInfo.institute && resultInfo.institute !== 'School/College';
        return {
          ...prev,
          gpa: hasValidGpa ? String(resultInfo.gpa) : prev.gpa,
          college: hasValidInst ? resultInfo.institute : prev.college
        };
      });
      setIsHscVerified(true);
    }
  };

  const verifyResult = async (examType) => {
    const details = examType === 'ssc' ? sscDetails : hscDetails;
    const setVerifying = examType === 'ssc' ? setIsVerifyingSsc : setIsVerifyingHsc;

    if (!details.roll || !details.board || !details.year) {
      addToast(`Please fill Roll, Board, and Year to verify.`, 'error');
      return;
    }

    setVerifying(true);
    try {
      const resData = await api.post('/board/start-session', {
        examType,
        roll: details.roll,
        reg: details.reg || '',
        board: details.board,
        year: parseInt(details.year, 10)
      });
      setVerifying(false);

      if (resData && resData.success) {
        // Case 1: Instant match from registry
        if (resData.isInstant && resData.data) {
          applyVerifiedResult(examType, resData.data);
          addToast(`✅ ${examType.toUpperCase()} Result verified & autofilled! (GPA: ${resData.data.gpa})`, 'success');
          return;
        }

        // Case 2: Live session started on government portal with official CAPTCHA
        if (resData.captchaImage && resData.sessionId) {
          setActiveExamType(examType);
          setCaptchaSessionId(resData.sessionId);
          setCaptchaImage(resData.captchaImage);
          setCaptchaInput('');
          setCaptchaError('');
          setShowBoardCaptchaModal(true);
          return;
        }
      }

      addToast(resData?.error || `Failed to connect to education board portal. You can enter GPA manually.`, 'error');
    } catch (err) {
      console.error(`Verification error for ${examType}:`, err);
      addToast(`Education Board verification service unreachable. You can enter GPA manually.`, 'info');
      setVerifying(false);
    }
  };

  const handleCancelBoardVerification = () => {
    if (captchaSessionId) {
      api.post('/board/cancel-session', { sessionId: captchaSessionId }).catch(() => {});
    }
    setShowBoardCaptchaModal(false);
    setCaptchaSessionId('');
    setCaptchaImage('');
    setCaptchaInput('');
    setCaptchaError('');
    setIsSubmittingCaptcha(false);
  };

  const handleBoardCaptchaSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!captchaInput || captchaInput.trim().length !== 4) {
      setCaptchaError('Please enter the 4 digits shown in the security image.');
      return;
    }

    setIsSubmittingCaptcha(true);
    setCaptchaError('');
    try {
      const res = await api.post('/board/submit-captcha', {
        sessionId: captchaSessionId,
        captcha: captchaInput.trim()
      });
      setIsSubmittingCaptcha(false);

      if (res && res.success && res.data) {
        applyVerifiedResult(activeExamType, res.data);
        setShowBoardCaptchaModal(false);
        addToast(`🎉 Real-Time ${activeExamType.toUpperCase()} Result Verified directly from Education Board! (GPA: ${res.data.gpa})`, 'success');
      } else {
        setCaptchaError(res?.error || 'Security code did not match. Please try again.');
        setCaptchaInput('');
      }
    } catch (err) {
      setIsSubmittingCaptcha(false);
      setCaptchaError('Error submitting to education board portal. Please retry.');
    }
  };

  const handleReloadBoardCaptcha = async () => {
    if (!captchaSessionId) return;
    setIsReloadingCaptcha(true);
    setCaptchaError('');
    try {
      const res = await api.post('/board/reload-captcha', { sessionId: captchaSessionId });
      setIsReloadingCaptcha(false);
      if (res && res.success && res.captchaImage) {
        setCaptchaImage(res.captchaImage);
        setCaptchaInput('');
      } else {
        setCaptchaError('Could not reload image. Please try verifying again.');
      }
    } catch (err) {
      setIsReloadingCaptcha(false);
      setCaptchaError('Error reloading image.');
    }
  };

  const handleStudentSignup = (e) => {
    e.preventDefault();
    if (!isStudentFormValid()) {
      addToast('Please fill all required fields correctly, verify email, and verify passwords match.', 'error');
      return;
    }

    const newUser = {
      name: personalInfo.name,
      fathersName: personalInfo.fathersName,
      mothersName: personalInfo.mothersName,
      dob: personalInfo.dob,
      mobile: studentMobile,
      email: personalInfo.email,
      group: personalInfo.group,
      password: passwords.password,
      ssc: {
        roll: sscDetails.roll,
        reg: sscDetails.reg,
        board: sscDetails.board,
        year: sscDetails.year || '2024',
        gpa: parseFloat(sscDetails.gpa),
        school: sscDetails.school
      },
      hsc: {
        roll: hscDetails.roll,
        reg: hscDetails.reg,
        board: hscDetails.board,
        year: hscDetails.year || '2026',
        gpa: parseFloat(hscDetails.gpa),
        school: hscDetails.college,
        college: hscDetails.college
      },
      avatar: null,
      purchasedCourses: []
    };

    setPendingStudent(newUser);
    setIsSubmittingStudent(true);

    api.post('/auth/register', { ...newUser, isPreVerified: isStudentEmailVerified })
      .then((data) => {
        setIsSubmittingStudent(false);
        if (data.success) {
          if (data.isVerified) {
            addToast('🎉 স্বাগতম! অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে এবং ১০০ EduCoins ওয়েলকাম বোনাস যুক্ত হয়েছে!', 'success');
            const studentWithCoins = { ...(data.user || newUser), coins: (data.user?.coins || 100), isVerified: true };
            if (onRegisterSuccess) {
              onRegisterSuccess(studentWithCoins);
            } else {
              localStorage.setItem('edufast_student_session', JSON.stringify(studentWithCoins));
              onNavigate('dashboard');
            }
          } else {
            setEmailForOtp(personalInfo.email);
            setIsEmailOtpOpen(true);
            addToast('Verification code sent to your email! Please check your inbox.', 'success');
          }
        } else {
          addToast(data.error || 'Registration failed. Please check details.', 'error');
        }
      })
      .catch((err) => {
        setIsSubmittingStudent(false);
        if (err.status === 429 || (err.message && err.message.includes('wait'))) {
          setEmailForOtp(personalInfo.email);
          setIsEmailOtpOpen(true);
        }
        addToast(err.message || 'Unable to connect to backend server.', 'error');
      });
  };

  // -------------------------------------------------------------
  // TEACHER FLOW STATE & LOGIC
  // -------------------------------------------------------------
  const [teacherMobile, setTeacherMobile] = useState('');
  const [isTeacherEmailVerified, setIsTeacherEmailVerified] = useState(false);
  const isTeacherMobileVerified = isTeacherEmailVerified; // Link form unlock state to email verification

  const [teacherInfo, setTeacherInfo] = useState({
    name: '',
    email: '',
    fathersName: '',
    dob: '',
    group: 'Science'
  });

  const [teacherProfessional, setTeacherProfessional] = useState({
    subject: 'Higher Mathematics',
    institution: '',
    qualification: '',
    experience: '5+ Years',
    designation: 'Senior Instructor',
    bio: ''
  });

  const [teacherPasswords, setTeacherPasswords] = useState({
    password: '',
    confirmPassword: ''
  });

  const isTeacherFormValid = () => {
    if (!isTeacherEmailVerified) return false;
    if (!teacherMobile || teacherMobile.length < 11) return false;
    if (!teacherInfo.name.trim() || !teacherInfo.email.trim() || !teacherInfo.dob) return false;
    if (!teacherProfessional.subject || !teacherProfessional.institution.trim() || !teacherProfessional.qualification.trim()) return false;
    if (!teacherPasswords.password || teacherPasswords.password.length < 6) return false;
    if (teacherPasswords.password !== teacherPasswords.confirmPassword) return false;
    return true;
  };

  const handleTeacherSignup = (e) => {
    e.preventDefault();
    if (!isTeacherFormValid()) {
      addToast('Please fill all required teacher fields and ensure passwords match (min 6 characters).', 'error');
      return;
    }

    const newTeacher = {
      id: `teacher-${Date.now()}`,
      name: teacherInfo.name.trim(),
      email: teacherInfo.email.trim(),
      mobile: teacherMobile,
      fathersName: teacherInfo.fathersName?.trim() || '',
      dob: teacherInfo.dob || '',
      group: teacherInfo.group || 'Science',
      wing: teacherInfo.group || 'Science',
      academicGroup: teacherInfo.group || 'Science',
      subject: teacherProfessional.subject || 'Higher Mathematics',
      institution: teacherProfessional.institution?.trim() || '',
      qualification: teacherProfessional.qualification?.trim() || '',
      experience: teacherProfessional.experience || '5+ Years',
      designation: teacherProfessional.designation?.trim() || 'Senior Instructor',
      department: `${teacherProfessional.designation?.trim() || 'Senior Instructor'}, ${teacherInfo.group || 'Science'} Wing`,
      bio: teacherProfessional.bio?.trim() || `${teacherProfessional.subject || 'Higher Mathematics'} Lead Instructor with ${teacherProfessional.experience || '5+ Years'} of mentoring experience.`,
      avatar: null,
      rating: 5.0,
      studentsCount: 0,
      coursesCount: 0,
      liveHours: 0,
      isVerified: true
    };

    // Asynchronously sync with backend SQLite
    fetch('/api/teachers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTeacher,
        password: teacherPasswords.password
      })
    }).catch(err => console.warn('Teacher backend register notice:', err));

    localStorage.setItem('edufast_teacher_session', JSON.stringify(newTeacher));
    localStorage.setItem('edufast_teacher_profile', JSON.stringify(newTeacher));
    window.dispatchEvent(new CustomEvent('edufast-teacher-update', { detail: newTeacher }));

    if (onTeacherRegisterSuccess) {
      onTeacherRegisterSuccess(newTeacher);
    } else {
      addToast(`Welcome ${newTeacher.name}! Teacher Studio account created.`, 'success');
      onNavigate('teacher');
    }
  };

  const handleOpenLoginModal = (targetRole) => {
    if (onOpenLogin) {
      onOpenLogin(targetRole);
    } else {
      onNavigate('landing');
      setTimeout(() => {
        document.getElementById('login-modal-btn')?.click();
      }, 100);
    }
  };

  return (
    <div className="container">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Role Selection Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '1.75rem 0 1.25rem 0'
      }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--card-bg, #ffffff)',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color, #e2e8f0)',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: role === 'student' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--text-charcoal, #2d3748)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            🎓 Student Registration (শিক্ষার্থী)
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: role === 'teacher' ? 'var(--primary-teal, #319795)' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : 'var(--text-charcoal, #2d3748)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            👨‍🏫 Teacher Registration (শিক্ষক)
          </button>
        </div>
      </div>

      <div className="signup-container">
        {/* Banner Section */}
        <div className="signup-banner">
          <h2>
            {role === 'teacher' ? 'Create Your Teacher Studio Account' : 'Create Your Edufast Account'}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
            {role === 'teacher'
              ? 'Join EduFast as an instructor. Verify your mobile number and register your professional credentials to broadcast classes.'
              : 'Enter your academic and personal details to match with running admissions and courses.'}
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: STUDENT REGISTRATION                                 */}
        {/* ------------------------------------------------------------- */}
        {role === 'student' && (
          <div className="signup-content">
            {/* EMAIL OTP VERIFICATION FLOW */}
            <EmailVerification
              email={personalInfo.email}
              setEmail={(val) => setPersonalInfo({ ...personalInfo, email: val })}
              name={personalInfo.name}
              isVerified={isStudentEmailVerified}
              setIsVerified={setIsStudentEmailVerified}
              addToast={addToast}
              role="student"
            />

            {!isStudentEmailVerified && (
              <div className="phone-locked-notification" style={{ backgroundColor: '#fffaf0', borderColor: '#feebc8', color: '#7b341e' }}>
                <span>✉️</span>
                <strong>Email Verification Required:</strong> Enter your email address above and verify via the 6-digit OTP code sent from Gmail to unlock the full sign-up form.
              </div>
            )}

            <form onSubmit={handleStudentSignup}>
              <div className={`signup-locked-overlay ${!isStudentMobileVerified ? 'locked' : ''}`}>

                {/* Personal Information Section */}
                <h3 className="signup-section-title">👤 Personal Details</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter student full name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number (মোবাইল নম্বর) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 01712345678"
                      value={studentMobile}
                      onChange={(e) => setStudentMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Father's full name"
                      value={personalInfo.fathersName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, fathersName: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Mother's full name"
                      value={personalInfo.mothersName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, mothersName: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={personalInfo.dob}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Group <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={personalInfo.group}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, group: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    >
                      <option value="Science">Science (বিজ্ঞান)</option>
                      <option value="Commerce">Commerce / Business Studies (ব্যবসায় শিক্ষা)</option>
                      <option value="Arts">Humanities / Arts (মানবিক)</option>
                    </select>
                  </div>
                </div>

                {/* SSC Information Section */}
                <h3 className="signup-section-title">
                  🎓 SSC / Equivalent Academic Record
                  {isSscVerified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '1rem' }}>
                      <span className="verified-badge" style={{ fontSize: '0.75rem' }}>✓ Verified</span>
                      <button
                        type="button"
                        onClick={() => setIsSscVerified(false)}
                        title="Click to edit fields"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        (Edit)
                      </button>
                    </span>
                  )}
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">SSC Roll <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 102938"
                      value={sscDetails.roll}
                      onChange={(e) => setSscDetails({ ...sscDetails, roll: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isSscVerified}
                      style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SSC Registration <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1718293041"
                      value={sscDetails.reg}
                      onChange={(e) => setSscDetails({ ...sscDetails, reg: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isSscVerified}
                      style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Education Board <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={sscDetails.board}
                      onChange={(e) => setSscDetails({ ...sscDetails, board: e.target.value })}
                      disabled={!isStudentMobileVerified || isSscVerified}
                      style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    >
                      {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Passing Year <span style={{ color: 'red' }}>*</span></label>
                      <button
                        type="button"
                        onClick={() => setIsManualSscYear(!isManualSscYear)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isManualSscYear ? '📋 ড্রপডাউন নির্বাচন' : '✍️ মেনুয়ালি লিখুন'}
                      </button>
                    </div>

                    {isManualSscYear ? (
                      <input
                        type="number"
                        min="1980"
                        max="2035"
                        className="form-input"
                        placeholder="e.g. 2014 বা যেকোনো সাল"
                        value={sscDetails.year}
                        onChange={(e) => setSscDetails({ ...sscDetails, year: e.target.value.slice(0, 4) })}
                        disabled={!isStudentMobileVerified || isSscVerified}
                        style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                        required
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={sscDetails.year}
                        onChange={(e) => setSscDetails({ ...sscDetails, year: e.target.value })}
                        disabled={!isStudentMobileVerified || isSscVerified}
                        style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                        required
                      >
                        {PASSING_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {!isSscVerified && (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => verifyResult('ssc')}
                      disabled={!isStudentMobileVerified || isVerifyingSsc}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      {isVerifyingSsc ? (
                        <>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          Verifying SSC Board...
                        </>
                      ) : (
                        '🔍 Verify SSC & Auto-Fill'
                      )}
                    </button>
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">SSC GPA (Scale 5.00) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="5.0"
                      className="form-input"
                      placeholder="e.g. 5.00"
                      value={sscDetails.gpa}
                      onChange={(e) => setSscDetails({ ...sscDetails, gpa: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isSscVerified}
                      style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">School Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ideal School and College"
                      value={sscDetails.school}
                      onChange={(e) => setSscDetails({ ...sscDetails, school: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isSscVerified}
                      style={isSscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                </div>

                {/* HSC Information Section */}
                <h3 className="signup-section-title">
                  🏛️ HSC / Equivalent Academic Record
                  {isHscVerified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '1rem' }}>
                      <span className="verified-badge" style={{ fontSize: '0.75rem' }}>✓ Verified</span>
                      <button
                        type="button"
                        onClick={() => setIsHscVerified(false)}
                        title="Click to edit fields"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        (Edit)
                      </button>
                    </span>
                  )}
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">HSC Roll <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 654321"
                      value={hscDetails.roll}
                      onChange={(e) => setHscDetails({ ...hscDetails, roll: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isHscVerified}
                      style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HSC Registration <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1718293041"
                      value={hscDetails.reg}
                      onChange={(e) => setHscDetails({ ...hscDetails, reg: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isHscVerified}
                      style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Education Board <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={hscDetails.board}
                      onChange={(e) => setHscDetails({ ...hscDetails, board: e.target.value })}
                      disabled={!isStudentMobileVerified || isHscVerified}
                      style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    >
                      {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Passing Year <span style={{ color: 'red' }}>*</span></label>
                      <button
                        type="button"
                        onClick={() => setIsManualHscYear(!isManualHscYear)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isManualHscYear ? '📋 ড্রপডাউন নির্বাচন' : '✍️ মেনুয়ালি লিখুন'}
                      </button>
                    </div>

                    {isManualHscYear ? (
                      <input
                        type="number"
                        min="1980"
                        max="2035"
                        className="form-input"
                        placeholder="e.g. 2016 বা যেকোনো সাল"
                        value={hscDetails.year}
                        onChange={(e) => setHscDetails({ ...hscDetails, year: e.target.value.slice(0, 4) })}
                        disabled={!isStudentMobileVerified || isHscVerified}
                        style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                        required
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={hscDetails.year}
                        onChange={(e) => setHscDetails({ ...hscDetails, year: e.target.value })}
                        disabled={!isStudentMobileVerified || isHscVerified}
                        style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                        required
                      >
                        <option value="2026">2026 (Candidate)</option>
                        {PASSING_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {!isHscVerified && (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => verifyResult('hsc')}
                      disabled={!isStudentMobileVerified || isVerifyingHsc}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      {isVerifyingHsc ? (
                        <>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          Verifying HSC Board...
                        </>
                      ) : (
                        '🔍 Verify HSC & Auto-Fill'
                      )}
                    </button>
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">HSC GPA (Scale 5.00) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="5.0"
                      className="form-input"
                      placeholder="e.g. 5.00"
                      value={hscDetails.gpa}
                      onChange={(e) => setHscDetails({ ...hscDetails, gpa: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isHscVerified}
                      style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">College Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Notre Dame College"
                      value={hscDetails.college}
                      onChange={(e) => setHscDetails({ ...hscDetails, college: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      readOnly={isHscVerified}
                      style={isHscVerified ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      required
                    />
                  </div>
                </div>

                {/* Password Section */}
                <h3 className="signup-section-title">🔑 Authentication Credentials</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Set Password <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 characters"
                      value={passwords.password}
                      onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Re-enter password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      disabled={!isStudentMobileVerified}
                      required
                    />
                    {passwords.password && passwords.confirmPassword && passwords.password !== passwords.confirmPassword && (
                      <span className="size-error" style={{ display: 'block', marginTop: '0.25rem' }}>Passwords do not match.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', maxWidth: '300px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={!isStudentFormValid() || isSubmittingStudent}
                >
                  {isSubmittingStudent ? (
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
                      Sending Verification Code...
                    </>
                  ) : (
                    'Sign Up & Verify Email'
                  )}
                </button>

                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Already have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenLoginModal('student');
                    }}
                    style={{ color: 'var(--primary-teal)', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Log In here
                  </a>
                </p>
              </div>

            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: TEACHER REGISTRATION                                 */}
        {/* ------------------------------------------------------------- */}
        {role === 'teacher' && (
          <div className="signup-content">
            {/* EMAIL OTP VERIFICATION FLOW */}
            <EmailVerification
              email={teacherInfo.email}
              setEmail={(val) => setTeacherInfo({ ...teacherInfo, email: val })}
              name={teacherInfo.name}
              isVerified={isTeacherEmailVerified}
              setIsVerified={setIsTeacherEmailVerified}
              addToast={addToast}
              role="teacher"
            />

            {!isTeacherEmailVerified && (
              <div className="phone-locked-notification" style={{ backgroundColor: '#fffaf0', borderColor: '#feebc8', color: '#7b341e' }}>
                <span>✉️</span>
                <strong>Instructor Email Verification Required:</strong> Enter your official email address above and verify via the 6-digit OTP code sent from Gmail to unlock the registration form.
              </div>
            )}

            <form onSubmit={handleTeacherSignup}>
              <div className={`signup-locked-overlay ${!isTeacherMobileVerified ? 'locked' : ''}`}>

                {/* Personal Information Section */}
                <h3 className="signup-section-title">👤 Instructor Personal Details</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name (শিক্ষকের নাম) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Engr. Tanvir Ahmed / Dr. Mahfuzur Rahman"
                      value={teacherInfo.name}
                      onChange={(e) => setTeacherInfo({ ...teacherInfo, name: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number (মোবাইল নম্বর) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 01712345678"
                      value={teacherMobile}
                      onChange={(e) => setTeacherMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father's / Guardian's Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Father's full name"
                      value={teacherInfo.fathersName}
                      onChange={(e) => setTeacherInfo({ ...teacherInfo, fathersName: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={teacherInfo.dob}
                      onChange={(e) => setTeacherInfo({ ...teacherInfo, dob: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Teaching Category / Wing <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={teacherInfo.group}
                      onChange={(e) => setTeacherInfo({ ...teacherInfo, group: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    >
                      <option value="Science">Science Wing (বিজ্ঞান শাখা - BUET, Medical & Engineering)</option>
                      <option value="Commerce">Commerce Wing (ব্যবসায় শিক্ষা শাখা - IBA, DU C-Unit)</option>
                      <option value="Arts">Humanities Wing (মানবিক শাখা - DU B-Unit & Law)</option>
                      <option value="General">General / Skill Wing (আইসিটি, ভাষা ও দক্ষতা উন্নয়ন)</option>
                    </select>
                  </div>
                </div>

                {/* Professional Qualifications Section */}
                <h3 className="signup-section-title">🎓 Professional & Academic Credentials</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Primary Teaching Subject <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={teacherProfessional.subject}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, subject: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    >
                      <option value="Higher Mathematics">Higher Mathematics (উচ্চতর গণিত)</option>
                      <option value="Physics">Physics (পদার্থবিজ্ঞান)</option>
                      <option value="Chemistry">Chemistry (রসায়ন)</option>
                      <option value="Biology">Biology (জীববিজ্ঞান)</option>
                      <option value="ICT & Computer">ICT & Computer (তথ্য ও যোগাযোগ প্রযুক্তি)</option>
                      <option value="English">English (ইংরেজি)</option>
                      <option value="Bangla">Bangla (বাংলা)</option>
                      <option value="Accounting">Accounting (হিসাববিজ্ঞান)</option>
                      <option value="Finance & Banking">Finance & Banking (অর্থায়ন ও ব্যাংকিং)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current College / University / Organization <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. BUET / Dhaka College / Notre Dame College"
                      value={teacherProfessional.institution}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, institution: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Highest Degree / Qualification <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. B.Sc in Civil Engineering (BUET) / M.Sc in Physics (DU)"
                      value={teacherProfessional.qualification}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, qualification: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teaching Experience <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="form-select"
                      value={teacherProfessional.experience}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, experience: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    >
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5+ Years">5+ Years</option>
                      <option value="8+ Years">8+ Years</option>
                      <option value="10+ Years">10+ Years (Senior Lead)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation / Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Instructor / Department Lead"
                      value={teacherProfessional.designation}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, designation: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Short Bio / Tagline</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Passionate educator mentoring 10,000+ students for admission."
                      value={teacherProfessional.bio}
                      onChange={(e) => setTeacherProfessional({ ...teacherProfessional, bio: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                    />
                  </div>
                </div>

                {/* Password Section */}
                <h3 className="signup-section-title">🔑 Teacher Studio Authentication Credentials</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Set Password <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 characters"
                      value={teacherPasswords.password}
                      onChange={(e) => setTeacherPasswords({ ...teacherPasswords, password: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Re-enter password"
                      value={teacherPasswords.confirmPassword}
                      onChange={(e) => setTeacherPasswords({ ...teacherPasswords, confirmPassword: e.target.value })}
                      disabled={!isTeacherMobileVerified}
                      required
                    />
                    {teacherPasswords.password && teacherPasswords.confirmPassword && teacherPasswords.password !== teacherPasswords.confirmPassword && (
                      <span className="size-error" style={{ display: 'block', marginTop: '0.25rem' }}>Passwords do not match.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="btn btn-teal"
                  style={{ width: '100%', maxWidth: '320px', height: '52px', fontWeight: 700, fontSize: '1rem' }}
                  disabled={!isTeacherFormValid()}
                >
                  Register as Teacher & Launch Studio 🚀
                </button>

                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Already have a teacher account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenLoginModal('teacher');
                    }}
                    style={{ color: 'var(--primary-teal)', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Log In here
                  </a>
                </p>
              </div>

            </form>
          </div>
        )}

        {/* Dedicated Email OTP Verification Modal Overlay */}
        <EmailOTPModal
          isOpen={isEmailOtpOpen}
          onClose={() => setIsEmailOtpOpen(false)}
          email={emailForOtp}
          onVerificationSuccess={(verifiedUser) => {
            const userPayload = (verifiedUser && verifiedUser.user) ? verifiedUser.user : verifiedUser;
            const finalUser = {
              ...pendingStudent,
              ...userPayload,
              coins: (userPayload && userPayload.coins !== undefined && userPayload.coins > 0) ? userPayload.coins : 100,
              isVerified: true
            };
            onRegisterSuccess(finalUser);
            addToast('🎉 স্বাগতম! অ্যাকাউন্ট ভেরিফাই হয়েছে এবং ১০০ EduCoins ওয়েলকাম বোনাস যুক্ত হয়েছে!', 'success');
          }}
          addToast={addToast}
        />

        {/* Real-Time Education Board Security Verification Modal */}
        {showBoardCaptchaModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
                  padding: '1.25rem 1.5rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🎓</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                      শিক্ষা বোর্ড লাইভ রেজাল্ট ভেরিফিকেশন
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.9 }}>
                      Official Bangladesh Education Board Portal (v2)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelBoardVerification}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    color: '#166534',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>Exam:</strong> {activeExamType.toUpperCase()} ({activeExamType === 'ssc' ? sscDetails.year : hscDetails.year})</span>
                    <span><strong>Board:</strong> {activeExamType === 'ssc' ? sscDetails.board : hscDetails.board}</span>
                  </div>
                  <div>
                    <span><strong>Roll:</strong> {activeExamType === 'ssc' ? sscDetails.roll : hscDetails.roll}</span>
                    <span style={{ marginLeft: '1rem' }}><strong>Reg:</strong> {activeExamType === 'ssc' ? (sscDetails.reg || 'N/A') : (hscDetails.reg || 'N/A')}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#374151', margin: '0 0 0.75rem 0', fontWeight: 500 }}>
                  নিচের শিক্ষা বোর্ডের সিকিউরিটি ইমেজটি দেখে ৪টি সংখ্যা টাইপ করুন:
                </p>

                {/* Captcha Image Container */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    backgroundColor: '#f8fafc',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    marginBottom: '1rem'
                  }}
                >
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="Education Board Captcha"
                      style={{
                        height: '52px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading security image...</span>
                  )}

                  <button
                    type="button"
                    onClick={handleReloadBoardCaptcha}
                    disabled={isReloadingCaptcha}
                    title="Reload Image"
                    style={{
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    {isReloadingCaptcha ? '...' : '🔄 পরিবর্তন'}
                  </button>
                </div>

                {/* 4-digit input */}
                <form onSubmit={handleBoardCaptchaSubmit}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
                      ৪ ডিজিট সিকিউরিটি কোড (4-digit Security Code) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      autoFocus
                      placeholder="e.g. 4952"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        letterSpacing: '6px',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '2px solid #0d9488',
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {captchaError && (
                    <div
                      style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '0.6rem',
                        color: '#b91c1c',
                        fontSize: '0.82rem',
                        marginBottom: '1rem',
                        fontWeight: 500
                      }}
                    >
                      ⚠️ {captchaError}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleCancelBoardVerification}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      বাতিল (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCaptcha || captchaInput.length !== 4}
                      style={{
                        flex: 2,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: (isSubmittingCaptcha || captchaInput.length !== 4) ? '#94a3b8' : '#0d9488',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: (isSubmittingCaptcha || captchaInput.length !== 4) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {isSubmittingCaptcha ? (
                        <>
                          <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          লাইভ রেজাল্ট আনা হচ্ছে...
                        </>
                      ) : (
                        '⚡ রেজাল্ট ফেচ করুন'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
