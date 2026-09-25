import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  Copy,
  Check,
  Camera,
  Trash2,
  Building,
  ShieldCheck,
  Video,
  Radio,
  Clock,
  Sparkles,
  X,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import './TeacherProfileModal.css';

export default function TeacherProfileModal({
  isOpen,
  onClose,
  teacherUser,
  onUpdateTeacher,
  addToast,
  coursesCount = 0,
  liveCount = 0,
  recordingsCount = 0
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'academic' | 'edit' | 'stats'
  const [copiedField, setCopiedField] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fileSizeError, setFileSizeError] = useState('');

  // Editable form state synced with teacherUser
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    fathersName: '',
    dob: '',
    group: 'Science',
    wing: 'Science',
    subject: 'Higher Mathematics',
    institution: '',
    qualification: '',
    experience: '5+ Years',
    designation: 'Senior Instructor',
    department: '',
    bio: '',
    avatar: null
  });

  useEffect(() => {
    if (teacherUser && isOpen) {
      setFormData({
        name: teacherUser.name || '',
        email: teacherUser.email || '',
        mobile: teacherUser.mobile || '',
        fathersName: teacherUser.fathersName || '',
        dob: teacherUser.dob || '',
        group: teacherUser.group || teacherUser.wing || teacherUser.academicGroup || 'Science',
        wing: teacherUser.wing || teacherUser.group || 'Science',
        subject: teacherUser.subject || 'Higher Mathematics',
        institution: teacherUser.institution || '',
        qualification: teacherUser.qualification || '',
        experience: teacherUser.experience || '5+ Years',
        designation: teacherUser.designation || 'Senior Instructor',
        department: teacherUser.department || '',
        bio: teacherUser.bio || '',
        avatar: teacherUser.avatar || null
      });
      setFileSizeError('');
      setIsSaving(false);
    }
  }, [teacherUser, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !teacherUser) return null;

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    if (addToast) addToast(`কপি করা হয়েছে: ${text}`, 'info');
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleAvatarChange = (e) => {
    setFileSizeError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setFileSizeError('ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।');
      if (addToast) addToast('ছবির আকার ২ মেগাবাইটের বেশি হতে পারবে না।', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar: reader.result }));
      if (addToast) addToast('প্রোফাইল ছবি নির্বাচিত হয়েছে! পরিবর্তন নিশ্চিত করতে Save চাপুন।', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile = {
      ...teacherUser,
      ...formData,
      department: `${formData.designation || 'Instructor'}, ${formData.group} Wing`,
      isVerified: true
    };

    // Save locally
    try {
      localStorage.setItem('edufast_teacher_session', JSON.stringify(updatedProfile));
      localStorage.setItem('edufast_teacher_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('edufast-teacher-update', { detail: updatedProfile }));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // Sync with backend API
    try {
      await fetch('/api/teachers/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
    } catch (err) {
      console.warn('Backend update-profile notice:', err);
    }

    setIsSaving(false);
    if (onUpdateTeacher) {
      onUpdateTeacher(updatedProfile);
    }
    if (addToast) {
      addToast('শিক্ষক প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!', 'success');
    }
    setActiveTab('overview');
  };

  return (
    <div className="tp-modal-overlay" onClick={onClose}>
      <div className="tp-modal-container" onClick={e => e.stopPropagation()}>
        {/* Banner Header */}
        <div className="tp-banner">
          <button
            type="button"
            className="tp-close-btn"
            onClick={onClose}
            title="বন্ধ করুন"
            aria-label="Close"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>

          <div className="tp-header-flex">
            <div className="tp-avatar-wrapper">
              {teacherUser.avatar ? (
                <img src={teacherUser.avatar} alt={teacherUser.name} />
              ) : (
                <span>{(teacherUser.name || 'T').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="tp-header-info">
              <h2 className="tp-instructor-name">
                {teacherUser.name || 'Instructor Name'}
                <span className="tp-verified-badge">
                  <CheckCircle style={{ width: '13px', height: '13px' }} />
                  Verified Instructor
                </span>
              </h2>

              <div className="tp-badges-row">
                <span className="tp-badge-pill">
                  <Briefcase style={{ width: '13px', height: '13px' }} />
                  {teacherUser.designation || 'Senior Instructor'}
                </span>
                <span className="tp-badge-pill">
                  <BookOpen style={{ width: '13px', height: '13px' }} />
                  {teacherUser.subject || 'Higher Mathematics'}
                </span>
                <span className="tp-badge-pill">
                  <GraduationCap style={{ width: '13px', height: '13px' }} />
                  {teacherUser.group || teacherUser.wing || 'Science'} Wing
                </span>
                {teacherUser.email && (
                  <span className="tp-badge-pill">
                    <Mail style={{ width: '13px', height: '13px' }} />
                    {teacherUser.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tp-tabs-nav">
          <button
            type="button"
            className={`tp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <User style={{ width: '16px', height: '16px' }} />
            📋 শিক্ষক বিবরণী (Overview)
          </button>
          <button
            type="button"
            className={`tp-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            <Award style={{ width: '16px', height: '16px' }} />
            🎓 অ্যাকাডেমিক ও পেশাগত তথ্য
          </button>
          <button
            type="button"
            className={`tp-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            ✏️ তথ্য এডিট করুন (Edit Profile)
          </button>
          <button
            type="button"
            className={`tp-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Radio style={{ width: '16px', height: '16px' }} />
            📊 স্টুডিও পরিসংখ্যান (Stats)
          </button>
        </div>

        {/* Modal Body */}
        <div className="tp-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Top Verified Alert */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)',
                border: '1px solid rgba(13, 148, 136, 0.3)',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: '#0d9488', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f766e' }}>
                      অনুমোদিত শিক্ষক প্রোফাইল (Verified Instructor Profile)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                      সাইনআপের সময় প্রদত্ত আপনার সকল ব্যক্তিগত, যোগাযোগ ও শিক্ষকতা সংক্রান্ত তথ্য সংরক্ষিত রয়েছে।
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="tp-btn tp-btn-primary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                  onClick={() => setActiveTab('edit')}
                >
                  ✏️ তথ্য পরিবর্তন করুন
                </button>
              </div>

              {/* Grid Cards */}
              <div className="tp-info-grid">
                {/* 1. Email Address (Verified) */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Mail style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      ইমেইল অ্যাড্রেস (Email Address)
                    </span>
                    <button
                      type="button"
                      className={`tp-copy-btn ${copiedField === 'email' ? 'copied' : ''}`}
                      onClick={() => handleCopy(teacherUser.email, 'email')}
                      title="কপি করুন"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check style={{ width: '12px', height: '12px' }} />
                          কপি হয়েছে!
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: '12px', height: '12px' }} />
                          কপি
                        </>
                      )}
                    </button>
                  </div>
                  <div className="tp-card-value" style={{ color: '#0f766e' }}>
                    {teacherUser.email || 'teacher@edufast.com'}
                  </div>
                  <div className="tp-card-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                    <CheckCircle style={{ width: '12px', height: '12px' }} />
                    ইমেইল ওটিপি দ্বারা সম্পূর্ণ ভেরিফাইড (OTP Verified)
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Phone style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      মোবাইল নম্বর (Mobile Number)
                    </span>
                    <button
                      type="button"
                      className={`tp-copy-btn ${copiedField === 'mobile' ? 'copied' : ''}`}
                      onClick={() => handleCopy(teacherUser.mobile, 'mobile')}
                      title="কপি করুন"
                    >
                      {copiedField === 'mobile' ? (
                        <>
                          <Check style={{ width: '12px', height: '12px' }} />
                          কপি হয়েছে!
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: '12px', height: '12px' }} />
                          কপি
                        </>
                      )}
                    </button>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.mobile || '01711111111'}
                  </div>
                  <div className="tp-card-sub" style={{ color: '#059669', fontWeight: 600 }}>
                    ● সক্রিয় প্রাইমারি যোগাযোগ নম্বর
                  </div>
                </div>

                {/* 3. Father's / Guardian's Name */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <User style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      পিতার নাম / অভিভাবক (Father's Name)
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.fathersName || 'প্রযোজ্য নয়'}
                  </div>
                  <div className="tp-card-sub">ব্যক্তিগত তথ্য বিবরণী</div>
                </div>

                {/* 4. Date of Birth */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Calendar style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      জন্ম তারিখ (Date of Birth)
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.dob || '1988-06-15'}
                  </div>
                  <div className="tp-card-sub">অফিসিয়াল শিক্ষক ডেটাবেজ</div>
                </div>

                {/* 5. Current Institution */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Building style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      বর্তমান প্রতিষ্ঠান / কর্মক্ষেত্র
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.institution || 'BUET / Dhaka College'}
                  </div>
                  <div className="tp-card-sub">সংযুক্ত শিক্ষা প্রতিষ্ঠান বা বিশ্ববিদ্যালয়</div>
                </div>

                {/* 6. Highest Degree & Qualification */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <GraduationCap style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      সর্বোচ্চ ডিগ্রি ও যোগ্যতা
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.qualification || 'M.Sc / B.Sc in Engineering'}
                  </div>
                  <div className="tp-card-sub">সার্টিফায়েড শিক্ষাগত যোগ্যতা</div>
                </div>

                {/* 7. Primary Subject */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <BookOpen style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      প্রধান পাঠদান বিষয় (Primary Subject)
                    </span>
                  </div>
                  <div className="tp-card-value" style={{ color: '#0f766e' }}>
                    {teacherUser.subject || 'Higher Mathematics'}
                  </div>
                  <div className="tp-card-sub">লাইভ স্টুডিও ও কোর্স বিশেষজ্ঞ</div>
                </div>

                {/* 8. Teaching Experience */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Clock style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      শিক্ষকতার অভিজ্ঞতা (Experience)
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.experience || '5+ Years'}
                  </div>
                  <div className="tp-card-sub">ভর্তি পরীক্ষা ও এইচএসসি মেন্টরিং</div>
                </div>

                {/* 9. Teaching Category / Wing */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Briefcase style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      অ্যাকাডেমিক শাখা (Teaching Wing)
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.group || teacherUser.wing || 'Science'} Wing
                  </div>
                  <div className="tp-card-sub">
                    {teacherUser.group === 'Commerce' ? 'ব্যবসায় শিক্ষা শাখা' : teacherUser.group === 'Arts' ? 'মানবিক শাখা' : 'বিজ্ঞান শাখা (ইঞ্জিনিয়ারিং ও মেডিকেল)'}
                  </div>
                </div>

                {/* 10. Designation / Title */}
                <div className="tp-card">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <Award style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      বর্তমান পদবি (Designation)
                    </span>
                  </div>
                  <div className="tp-card-value">
                    {teacherUser.designation || 'Senior Instructor'}
                  </div>
                  <div className="tp-card-sub">{teacherUser.department || 'Senior Instructor, Science Wing'}</div>
                </div>

                {/* 11. Short Bio (Full Width) */}
                <div className="tp-card full-width">
                  <div className="tp-card-header">
                    <span className="tp-card-label">
                      <User style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                      শিক্ষক পরিচিতি ও বায়ো (Instructor Biography)
                    </span>
                  </div>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
                    {teacherUser.bio || `${teacherUser.subject || 'Higher Mathematics'} Lead Instructor mentoring students for admission & board examinations.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC & PROFESSIONAL CREDENTIALS */}
          {activeTab === 'academic' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Award style={{ width: '20px', height: '20px', color: '#0f766e' }} />
                অ্যাকাডেমিক স্বীকৃতি ও শিক্ষকতা ট্র্যাক
              </h3>

              <div className="tp-info-grid">
                <div className="tp-card">
                  <span className="tp-card-label">🏛️ শিক্ষাপ্রতিষ্ঠান স্বীকৃতি</span>
                  <div className="tp-card-value">{teacherUser.institution || 'BUET'}</div>
                  <div className="tp-card-sub">প্রধান অধিভুক্তি বা সাবেক ডিগ্রি প্রতিষ্ঠান</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">🎓 ডিগ্রি ও বিভাগ</span>
                  <div className="tp-card-value">{teacherUser.qualification || 'M.Sc in Physics'}</div>
                  <div className="tp-card-sub">যাচাইকৃত স্নাতক/স্নাতকোত্তর ডিগ্রি</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">⏳ অভিজ্ঞতার বছর</span>
                  <div className="tp-card-value">{teacherUser.experience || '5+ Years'}</div>
                  <div className="tp-card-sub">সরাসরি শ্রেণীকক্ষ ও অনলাইন টিচিং</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">🛡️ স্টুডিও অনুমোদন স্ট্যাটাস</span>
                  <div className="tp-card-value" style={{ color: '#059669' }}>✓ অনুমোদিত শিক্ষক (Active)</div>
                  <div className="tp-card-sub">লাইভ স্টুডিও ক্লাস ও কোর্স পাবলিশিং সচল</div>
                </div>
              </div>

              {/* Studio Permissions Card */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                marginTop: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  🔑 আপনার শিক্ষাদানের অনুমোদিত সুবিধাসমূহ:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#0d9488' }} />
                    রিয়েলটাইম লাইভ ক্লাস ব্রডকাস্টিং
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#0d9488' }} />
                    ইন্টারেক্টিভ হোয়াইটবোর্ড ও স্ক্রিন শেয়ার
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#0d9488' }} />
                    রেকর্ডেড লেকচার ও ক্লাস আর্কাইভ আপলোড
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#0d9488' }} />
                    সম্পূর্ণ কোর্স ও কারিকুলাম বিল্ডার অ্যাক্সেস
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile}>
              {/* Avatar Selector */}
              <div className="tp-avatar-picker">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Preview" className="tp-avatar-preview" />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 800
                  }}>
                    {(formData.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.2rem' }}>
                    প্রোফাইল ছবি পরিবর্তন করুন (Profile Photo)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.6rem' }}>
                    সর্বোচ্চ ফাইলের আকার: ২ মেগাবাইট (2MB)। জেপিজি বা পিএনজি ফরম্যাট।
                  </div>

                  {fileSizeError && (
                    <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      ⚠️ {fileSizeError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      backgroundColor: '#0f766e',
                      color: '#ffffff',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      <Camera style={{ width: '14px', height: '14px' }} />
                      ছবি আপলোড করুন
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: null })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '7px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                        ছবি মুছুন
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Row 1: Name & Mobile */}
              <div className="tp-form-row">
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    শিক্ষকের পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    className="tp-form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    মোবাইল নম্বর (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    className="tp-form-input"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    required
                  />
                </div>
              </div>

              {/* Form Row 2: Father's Name & DOB */}
              <div className="tp-form-row">
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    পিতার নাম / অভিভাবক (Father's Name)
                  </label>
                  <input
                    type="text"
                    className="tp-form-input"
                    value={formData.fathersName}
                    onChange={e => setFormData({ ...formData, fathersName: e.target.value })}
                  />
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    জন্ম তারিখ (Date of Birth) *
                  </label>
                  <input
                    type="date"
                    className="tp-form-input"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Form Row 3: Teaching Wing & Subject */}
              <div className="tp-form-row">
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    পাঠদান শাখা / উইং (Academic Wing) *
                  </label>
                  <select
                    className="tp-form-select"
                    value={formData.group}
                    onChange={e => setFormData({ ...formData, group: e.target.value, wing: e.target.value })}
                    required
                  >
                    <option value="Science">Science Wing (বিজ্ঞান শাখা - BUET, Medical & Engg)</option>
                    <option value="Commerce">Commerce Wing (ব্যবসায় শিক্ষা - IBA, DU C-Unit)</option>
                    <option value="Arts">Humanities Wing (মানবিক শাখা - DU B-Unit & Law)</option>
                    <option value="General">General / Skill Wing (আইসিটি ও দক্ষতা উন্নয়ন)</option>
                  </select>
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    প্রধান পাঠদান বিষয় (Primary Subject) *
                  </label>
                  <select
                    className="tp-form-select"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    required
                  >
                    <option value="Higher Mathematics">Higher Mathematics (উচ্চতর গণিত)</option>
                    <option value="Physics">Physics (পদার্থবিজ্ঞান)</option>
                    <option value="Chemistry">Chemistry (রসায়ন)</option>
                    <option value="Biology">Biology (জীববিজ্ঞান)</option>
                    <option value="ICT & Computer">ICT & Computer (তথ্য ও প্রযুক্তি)</option>
                    <option value="English">English (ইংরেজি)</option>
                    <option value="Bangla">Bangla (বাংলা)</option>
                    <option value="Accounting">Accounting (হিসাববিজ্ঞান)</option>
                    <option value="Finance & Banking">Finance & Banking (অর্থায়ন ও ব্যাংকিং)</option>
                  </select>
                </div>
              </div>

              {/* Form Row 4: Institution & Qualification */}
              <div className="tp-form-row">
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    বর্তমান প্রতিষ্ঠান / কর্মক্ষেত্র (Institution) *
                  </label>
                  <input
                    type="text"
                    className="tp-form-input"
                    value={formData.institution}
                    onChange={e => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="e.g. BUET / Dhaka College / Notre Dame"
                    required
                  />
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    সর্বোচ্চ শিক্ষাগত ডিগ্রি ও যোগ্যতা (Qualification) *
                  </label>
                  <input
                    type="text"
                    className="tp-form-input"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. B.Sc in Civil Engineering (BUET)"
                    required
                  />
                </div>
              </div>

              {/* Form Row 5: Experience & Designation */}
              <div className="tp-form-row">
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    শিক্ষকতার অভিজ্ঞতা (Experience) *
                  </label>
                  <select
                    className="tp-form-select"
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                    required
                  >
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                    <option value="8+ Years">8+ Years</option>
                    <option value="10+ Years">10+ Years (Senior Lead)</option>
                  </select>
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">
                    বর্তমান পদবি / টাইটেল (Designation)
                  </label>
                  <input
                    type="text"
                    className="tp-form-input"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Instructor / Department Lead"
                  />
                </div>
              </div>

              {/* Form Row 6: Bio */}
              <div className="tp-form-group full" style={{ marginBottom: '1.5rem' }}>
                <label className="tp-form-label">
                  শিক্ষক পরিচিতি ও বায়ো (Instructor Biography)
                </label>
                <textarea
                  rows={3}
                  className="tp-form-textarea"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="আপনার শিক্ষকতা অভিজ্ঞতা, ছাত্রদের ফলাফল ও পাঠদান দর্শন লিখুন..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="tp-btn tp-btn-secondary"
                  onClick={() => setActiveTab('overview')}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="tp-btn tp-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: STUDIO STATS */}
          {activeTab === 'stats' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Radio style={{ width: '20px', height: '20px', color: '#0f766e' }} />
                শিক্ষক স্টুডিও কার্যক্রম ও পারফরম্যান্স
              </h3>

              <div className="tp-info-grid">
                <div className="tp-card">
                  <span className="tp-card-label">📚 মোট প্রকাশিত কোর্স</span>
                  <div className="tp-card-value" style={{ fontSize: '1.8rem', color: '#0f766e' }}>
                    {coursesCount || teacherUser.coursesCount || 6}
                  </div>
                  <div className="tp-card-sub">অ্যাক্টিভ ও উন্মুক্ত কোর্স</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">🔴 লাইভ মাস্টারক্লাস</span>
                  <div className="tp-card-value" style={{ fontSize: '1.8rem', color: '#e11d48' }}>
                    {liveCount || teacherUser.liveHours || 12}
                  </div>
                  <div className="tp-card-sub">পরিচালিত ইন্টারেক্টিভ সেশন</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">🎥 ক্লাস ভিডিও লেকচার</span>
                  <div className="tp-card-value" style={{ fontSize: '1.8rem', color: '#4f46e5' }}>
                    {recordingsCount || 8}
                  </div>
                  <div className="tp-card-sub">সংরক্ষিত ভিডিও আর্কাইভ</div>
                </div>

                <div className="tp-card">
                  <span className="tp-card-label">⭐ শিক্ষার্থী রেটিং</span>
                  <div className="tp-card-value" style={{ fontSize: '1.8rem', color: '#f59e0b' }}>
                    {teacherUser.rating ? Number(teacherUser.rating).toFixed(1) : '4.9'} ★
                  </div>
                  <div className="tp-card-sub">শিক্ষার্থীদের ইতিবাচক ফিডব্যাক</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="tp-footer">
          <div style={{ marginRight: 'auto', fontSize: '0.78rem', color: '#64748b' }}>
            আইডি: <strong style={{ color: '#0f766e' }}>{teacherUser.id || 'teacher-default'}</strong>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-secondary"
            onClick={onClose}
          >
            বন্ধ করুন
          </button>
          {activeTab !== 'edit' ? (
            <button
              type="button"
              className="tp-btn tp-btn-primary"
              onClick={() => setActiveTab('edit')}
            >
              ✏️ প্রোফাইল এডিট
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
