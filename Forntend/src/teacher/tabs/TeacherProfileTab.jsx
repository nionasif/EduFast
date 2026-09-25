import React, { useState } from 'react';
import {
  Settings,
  Camera,
  Trash2,
  Mail,
  Phone,
  User,
  Calendar,
  Building,
  GraduationCap,
  BookOpen,
  Clock,
  Briefcase,
  Award,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function TeacherProfileTab({
  teacherUser,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  theme,
  coursesCount = 0,
  liveCount = 0,
  recordingsCount = 0
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'edit'
  const [copiedField, setCopiedField] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const currentTeacher = {
    ...teacherUser,
    ...profileForm
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleAvatarFileChange = (e) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setProfileForm(prev => ({ ...prev, avatar: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Profile Header Card */}
      <div style={{
        background: theme.isDark
          ? 'linear-gradient(135deg, #134e4a 0%, #0f172a 60%, #020617 100%)'
          : 'linear-gradient(135deg, #0d9488 0%, #0f766e 45%, #1e3a8a 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: '#ffffff',
        marginBottom: '1.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            backgroundColor: '#0d9488',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 800,
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(0,0,0,0.25)'
          }}>
            {currentTeacher.avatar ? (
              <img src={currentTeacher.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (currentTeacher.name || 'T').charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {currentTeacher.name || 'Instructor'}
              </h2>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                color: '#a7f3d0',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <CheckCircle style={{ width: '12px', height: '12px' }} />
                Verified Instructor
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.82rem', opacity: 0.95 }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase style={{ width: '13px', height: '13px' }} />
                {currentTeacher.designation || 'Senior Instructor'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <BookOpen style={{ width: '13px', height: '13px' }} />
                {currentTeacher.subject || 'Higher Mathematics'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <GraduationCap style={{ width: '13px', height: '13px' }} />
                {currentTeacher.group || currentTeacher.wing || 'Science'} Wing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: `1px solid ${theme.cardBorder}`,
        paddingBottom: '0.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          style={{
            padding: '0.6rem 1.25rem',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: activeSubTab === 'overview' ? 'var(--primary-teal)' : 'transparent',
            color: activeSubTab === 'overview' ? '#ffffff' : theme.textMuted,
            transition: 'all 0.15s ease'
          }}
        >
          <User style={{ width: '16px', height: '16px' }} />
          📋 শিক্ষক বিবরণী ও পরিচিতি (Overview)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('edit')}
          style={{
            padding: '0.6rem 1.25rem',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: activeSubTab === 'edit' ? 'var(--primary-teal)' : 'transparent',
            color: activeSubTab === 'edit' ? '#ffffff' : theme.textMuted,
            transition: 'all 0.15s ease'
          }}
        >
          <Settings style={{ width: '16px', height: '16px' }} />
          ✏️ তথ্য পরিবর্তন করুন (Edit Profile)
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div>
          {/* Verified Notice Alert */}
          <div style={{
            backgroundColor: theme.isDark ? '#064e3b' : '#ecfdf5',
            border: `1px solid ${theme.isDark ? '#059669' : '#a7f3d0'}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck style={{ width: '24px', height: '24px', color: '#10b981', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.isDark ? '#a7f3d0' : '#065f46' }}>
                  ইমেইল ও মোবাইল ভেরিফাইড শিক্ষক অ্যাকাউন্ট (Verified Profile)
                </div>
                <div style={{ fontSize: '0.8rem', color: theme.isDark ? '#cbd5e1' : '#047857' }}>
                  রেজিস্ট্রেশনের সময় প্রদত্ত সকল তথ্য নির্ভুলভাবে সংরক্ষিত ও ডেটাবেজে সিঙ্ক রয়েছে।
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('edit')}
              className="btn btn-teal"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              ✏️ প্রোফাইল এডিট
            </button>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            {/* Email Card */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                  ইমেইল অ্যাড্রেস (Email Address)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentTeacher.email, 'email')}
                  style={{
                    backgroundColor: theme.cardBgElevated || '#f1f5f9',
                    border: `1px solid ${theme.cardBorder}`,
                    color: copiedField === 'email' ? '#10b981' : 'var(--primary-teal)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {copiedField === 'email' ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  {copiedField === 'email' ? 'কপি হয়েছে' : 'কপি'}
                </button>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-teal)', wordBreak: 'break-all' }}>
                {currentTeacher.email || 'teacher@edufast.com'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle style={{ width: '12px', height: '12px' }} />
                ওটিপি দ্বারা সম্পূর্ণ ভেরিফাইড (OTP Verified)
              </div>
            </div>

            {/* Mobile Card */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                  মোবাইল নম্বর (Mobile Number)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentTeacher.mobile, 'mobile')}
                  style={{
                    backgroundColor: theme.cardBgElevated || '#f1f5f9',
                    border: `1px solid ${theme.cardBorder}`,
                    color: copiedField === 'mobile' ? '#10b981' : 'var(--primary-teal)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {copiedField === 'mobile' ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  {copiedField === 'mobile' ? 'কপি হয়েছে' : 'কপি'}
                </button>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.mobile || '01711111111'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, marginTop: '0.25rem' }}>
                ● সক্রিয় প্রাইমারি যোগাযোগ নম্বর
              </div>
            </div>

            {/* Father's Name Card */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <User style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                পিতার নাম / অভিভাবক (Father's Name)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.fathersName || 'প্রযোজ্য নয়'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                ব্যক্তিগত তথ্য বিবরণী
              </div>
            </div>

            {/* Date of Birth */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                জন্ম তারিখ (Date of Birth)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.dob || '1988-06-15'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                অফিসিয়াল শিক্ষক ডাটাবেজ
              </div>
            </div>

            {/* Institution */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Building style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                বর্তমান শিক্ষা প্রতিষ্ঠান / কর্মক্ষেত্র
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.institution || 'BUET / Dhaka College'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                কর্মক্ষেত্র বা ডিগ্রি প্রতিষ্ঠান
              </div>
            </div>

            {/* Highest Qualification */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <GraduationCap style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                সর্বোচ্চ ডিগ্রি ও যোগ্যতা
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.qualification || 'M.Sc / B.Sc in Engineering'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                সার্টিফায়েড শিক্ষাগত যোগ্যতা
              </div>
            </div>

            {/* Primary Subject */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <BookOpen style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                প্রধান পাঠদান বিষয় (Primary Subject)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-teal)' }}>
                {currentTeacher.subject || 'Higher Mathematics'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                লাইভ স্টুডিও ক্লাস ও প্রশ্নব্যাংক বিশেষজ্ঞ
              </div>
            </div>

            {/* Teaching Experience */}
            <div style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Clock style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                শিক্ষকতার অভিজ্ঞতা (Experience)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text }}>
                {currentTeacher.experience || '5+ Years'}
              </div>
              <div style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: '0.25rem' }}>
                অ্যাডমিশন ও এইচএসসি ব্যাচ মেন্টরিং
              </div>
            </div>
          </div>

          {/* Biography Full Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <User style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
              শিক্ষক পরিচিতি ও বায়ো (Instructor Biography)
            </span>
            <p style={{ margin: 0, fontSize: '0.95rem', color: theme.text, lineHeight: 1.6 }}>
              {currentTeacher.bio || `${currentTeacher.subject || 'Higher Mathematics'} Lead Instructor mentoring students for admission & board examinations.`}
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EDIT PROFILE FORM */}
      {activeSubTab === 'edit' && (
        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '12px',
          padding: '2rem',
          border: `1px solid ${theme.cardBorder}`
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: '20px', height: '20px', color: 'var(--primary-teal)' }} />
            শিক্ষক প্রোফাইল তথ্য এডিট করুন
          </h3>

          <form onSubmit={handleSaveProfile}>
            {/* Avatar Upload Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              marginBottom: '1.75rem',
              padding: '1.25rem',
              backgroundColor: theme.cardBgElevated || 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              border: `1px solid ${theme.cardBorder}`
            }}>
              <div style={{ position: 'relative' }}>
                {profileForm.avatar ? (
                  <img
                    src={profileForm.avatar}
                    alt="Profile"
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary-teal)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-teal)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.6rem',
                    border: '3px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    {(profileForm.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: '0.25rem' }}>
                  শিক্ষক প্রোফাইল ছবি (Profile Picture)
                </div>
                <div style={{ fontSize: '0.78rem', color: theme.textMuted || '#718096', marginBottom: '0.75rem' }}>
                  একটি স্পষ্ট পোর্ট্রেট ছবি আপলোড করুন। সর্বোচ্চ ফাইলের আকার: ২ মেগাবাইট (2MB)।
                </div>

                {avatarError && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    ⚠️ {avatarError}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.9rem',
                    backgroundColor: 'var(--primary-teal)',
                    color: '#fff',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}>
                    <Camera style={{ width: '15px', height: '15px' }} />
                    ছবি নির্বাচন করুন
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {profileForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar: null })}
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
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      ছবি মুছুন
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  পূর্ণ নাম (Full Name) *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  ইমেইল অ্যাড্রেস (Email Address) *
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  মোবাইল নম্বর (Mobile Number) *
                </label>
                <input
                  type="text"
                  value={profileForm.mobile}
                  onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  পিতার নাম / অভিভাবক (Father's Name)
                </label>
                <input
                  type="text"
                  value={profileForm.fathersName || ''}
                  onChange={e => setProfileForm({ ...profileForm, fathersName: e.target.value })}
                  placeholder="পিতার নাম লিখুন"
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  জন্ম তারিখ (Date of Birth) *
                </label>
                <input
                  type="date"
                  value={profileForm.dob || ''}
                  onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                  required
                />
              </div>

            {/* Dedicated Box: Academic Specialization (Wing, Subject & Experience) */}
            <div style={{
              gridColumn: '1 / -1',
              background: theme.isDark 
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                : 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)',
              border: `1.5px solid ${theme.isDark ? 'rgba(45, 212, 191, 0.25)' : '#99f6e4'}`,
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: theme.isDark 
                ? '0 8px 24px -4px rgba(0, 0, 0, 0.35)' 
                : '0 8px 20px -4px rgba(13, 148, 136, 0.08)',
              marginTop: '0.5rem',
              marginBottom: '0.75rem',
              position: 'relative'
            }}>
              {/* Header with badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(13, 148, 136, 0.15)'}`,
                paddingBottom: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(13, 148, 136, 0.15)',
                    color: 'var(--primary-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: theme.text,
                      display: 'block',
                      letterSpacing: '-0.01em'
                    }}>
                      পাঠদান ও শিক্ষাগত স্পেশালাইজেশন (Academic Specialization)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                      শিক্ষকের বিভাগ, মূল পাঠদান বিষয় ও অভিজ্ঞতা অনুযায়ী ব্যাচ ও ক্লাস নির্ধারণ করা হয়
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: theme.isDark ? 'rgba(13, 148, 136, 0.25)' : '#ccfbf1',
                  color: 'var(--primary-teal)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(13, 148, 136, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  ✨ ৩টি আবশ্যক তথ্য
                </span>
              </div>

              {/* 3 Fields in 3 neat cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem'
              }}>
                {/* 1. Academic Wing */}
                <div style={{
                  backgroundColor: theme.cardBg,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: `1px solid ${theme.cardBorder}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: theme.textSecondary,
                    marginBottom: '0.35rem'
                  }}>
                    <Award style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                    পাঠদান শাখা / উইং (Academic Wing) *
                  </label>
                  <select
                    value={profileForm.group || profileForm.wing || 'Science'}
                    onChange={e => setProfileForm({ ...profileForm, group: e.target.value, wing: e.target.value })}
                    className="form-select"
                    style={{
                      width: '100%',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '0.55rem 20px',
                      margin: '10px 0',
                      boxSizing: 'border-box'
                    }}
                    required
                  >
                    <option value="Science">🧪 Science Wing (বিজ্ঞান শাখা)</option>
                    <option value="Commerce">📊 Commerce Wing (ব্যবসায় শিক্ষা)</option>
                    <option value="Arts">📚 Humanities Wing (মানবিক শাখা)</option>
                    <option value="General">💡 General / ICT Wing (দক্ষতা উন্নয়ন)</option>
                  </select>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                    নির্ধারিত একাডেমিক উইং
                  </div>
                </div>

                {/* 2. Primary Subject */}
                <div style={{
                  backgroundColor: theme.cardBg,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: `1px solid ${theme.cardBorder}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: theme.textSecondary,
                    marginBottom: '0.35rem'
                  }}>
                    <BookOpen style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                    প্রধান বিষয় (Primary Subject) *
                  </label>
                  <select
                    value={profileForm.subject || 'Higher Mathematics'}
                    onChange={e => setProfileForm({ ...profileForm, subject: e.target.value })}
                    className="form-select"
                    style={{
                      width: '100%',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '0.55rem 20px',
                      margin: '10px 0',
                      boxSizing: 'border-box'
                    }}
                    required
                  >
                    <option value="Higher Mathematics">📐 Higher Mathematics (উচ্চতর গণিত)</option>
                    <option value="Physics">⚡ Physics (পদার্থবিজ্ঞান)</option>
                    <option value="Chemistry">⚗️ Chemistry (রসায়ন)</option>
                    <option value="Biology">🧬 Biology (জীববিজ্ঞান)</option>
                    <option value="ICT & Computer">💻 ICT & Computer (তথ্য ও প্রযুক্তি)</option>
                    <option value="English">🔤 English (ইংরেজি)</option>
                    <option value="Bangla">📖 Bangla (বাংলা)</option>
                    <option value="Accounting">📑 Accounting (হিসাববিজ্ঞান)</option>
                    <option value="Finance & Banking">💰 Finance & Banking (অর্থায়ন)</option>
                  </select>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                    বিশেষায়িত পাঠ্য বিষয়
                  </div>
                </div>

                {/* 3. Teaching Experience */}
                <div style={{
                  backgroundColor: theme.cardBg,
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: `1px solid ${theme.cardBorder}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: theme.textSecondary,
                    marginBottom: '0.35rem'
                  }}>
                    <Clock style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                    শিক্ষকতার অভিজ্ঞতা (Experience) *
                  </label>
                  <select
                    value={profileForm.experience || '5+ Years'}
                    onChange={e => setProfileForm({ ...profileForm, experience: e.target.value })}
                    className="form-select"
                    style={{
                      width: '100%',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '0.55rem 20px',
                      margin: '10px 0',
                      boxSizing: 'border-box'
                    }}
                    required
                  >
                    <option value="1-2 Years">🌱 1-2 Years (প্রারম্ভিক)</option>
                    <option value="3-5 Years">⭐ 3-5 Years (অভিজ্ঞ)</option>
                    <option value="5+ Years">🏆 5+ Years (সিনিয়র মেন্টর)</option>
                    <option value="8+ Years">🎖️ 8+ Years (বিশেষজ্ঞ ফ্যাকাল্টি)</option>
                    <option value="10+ Years">👑 10+ Years (লিড ইন্সট্রাক্টর)</option>
                  </select>
                  <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                    মোট শিক্ষকতা জীবনকাল
                  </div>
                </div>
              </div>
            </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                  বর্তমান পদবি / টাইটেল (Designation)
                </label>
                <input
                  type="text"
                  value={profileForm.designation || ''}
                  onChange={e => setProfileForm({ ...profileForm, designation: e.target.value })}
                  placeholder="e.g. Senior Instructor / Department Lead"
                  className="form-input"
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                শিক্ষক পরিচিতি ও বায়ো (Instructor Biography)
              </label>
              <textarea
                rows={3}
                value={profileForm.bio || ''}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="আপনার শিক্ষকতা দর্শন, বিশেষ অর্জন ও পাঠদান পদ্ধতি লিখুন..."
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-teal"
              style={{ padding: '0.65rem 1.6rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              💾 শিক্ষক প্রোফাইল তথ্য সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
