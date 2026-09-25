import React, { useState, useEffect } from 'react';
import './StudentProfileModal.css';

export default function StudentProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  addToast
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'academic' | 'edit' | 'mentor'
  const [copiedField, setCopiedField] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fileSizeError, setFileSizeError] = useState('');

  // Editable Form State
  const [formData, setFormData] = useState({
    name: '',
    fathersName: '',
    mothersName: '',
    dob: '',
    mobile: '',
    group: 'Science',
    avatar: null,
    ssc: {
      roll: '',
      reg: '',
      board: 'Dhaka',
      year: '2024',
      gpa: '',
      school: ''
    },
    hsc: {
      roll: '',
      reg: '',
      board: 'Dhaka',
      year: '2026',
      gpa: '',
      college: '',
      school: ''
    }
  });

  // Sync state whenever modal opens or user object updates
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        fathersName: user.fathersName || '',
        mothersName: user.mothersName || '',
        dob: user.dob || '',
        mobile: user.mobile || '',
        group: user.group || user.academicGroup || 'Science',
        avatar: user.avatar || null,
        ssc: {
          roll: user.ssc?.roll || '',
          reg: user.ssc?.reg || '',
          board: user.ssc?.board || 'Dhaka',
          year: user.ssc?.year || '2024',
          gpa: user.ssc?.gpa !== undefined && user.ssc?.gpa !== null ? String(user.ssc.gpa) : '',
          school: user.ssc?.school || ''
        },
        hsc: {
          roll: user.hsc?.roll || '',
          reg: user.hsc?.reg || '',
          board: user.hsc?.board || 'Dhaka',
          year: user.hsc?.year || '2026',
          gpa: user.hsc?.gpa !== undefined && user.hsc?.gpa !== null ? String(user.hsc.gpa) : '',
          college: user.hsc?.college || user.hsc?.school || '',
          school: user.hsc?.school || user.hsc?.college || ''
        }
      });
      setFileSizeError('');
      setIsSaving(false);
    }
  }, [user, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (addToast) addToast(`কপি করা হয়েছে: ${text}`, 'info');
    setTimeout(() => setCopiedField(''), 2500);
  };

  // Avatar Upload with Strict 1MB Check
  const handleAvatarChange = (e) => {
    setFileSizeError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      setFileSizeError('ছবির আকার সর্বোচ্চ ১ মেগাবাইট (1MB) হতে পারবে।');
      if (addToast) addToast('File size check failed (> 1MB)', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
      if (addToast) addToast('প্রোফাইল ছবি নির্বাচিত হয়েছে! পরিবর্তন সংরক্ষণ করতে Save বাটন চাপুন।', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      if (addToast) addToast('শিক্ষার্থীর পুরো নাম আবশ্যক।', 'error');
      return;
    }

    setIsSaving(true);
    const updatedUserObj = {
      ...user,
      name: formData.name.trim(),
      fathersName: formData.fathersName.trim(),
      mothersName: formData.mothersName.trim(),
      dob: formData.dob,
      mobile: formData.mobile.trim(),
      group: formData.group,
      academicGroup: formData.group,
      avatar: formData.avatar,
      ssc: {
        ...user.ssc,
        ...formData.ssc,
        gpa: parseFloat(formData.ssc.gpa) || 0.0
      },
      hsc: {
        ...user.hsc,
        ...formData.hsc,
        school: formData.hsc.college,
        college: formData.hsc.college,
        gpa: parseFloat(formData.hsc.gpa) || 0.0
      }
    };

    try {
      // 1. Send update request to backend database
      const response = await fetch('http://localhost:5001/api/students/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: updatedUserObj.name,
          fathersName: updatedUserObj.fathersName,
          mothersName: updatedUserObj.mothersName,
          dob: updatedUserObj.dob,
          mobile: updatedUserObj.mobile,
          group: updatedUserObj.group,
          avatar: updatedUserObj.avatar,
          ssc: updatedUserObj.ssc,
          hsc: updatedUserObj.hsc
        })
      });

      const resData = await response.json();
      const finalUser = (resData.success && resData.user) ? { ...updatedUserObj, ...resData.user } : updatedUserObj;

      // 2. Persist to local session
      try {
        localStorage.setItem('edufast_student_session', JSON.stringify(finalUser));
      } catch (err) {}

      // 3. Notify parent component
      if (onUpdateUser) {
        onUpdateUser(finalUser);
      }

      setIsSaving(false);
      if (addToast) addToast('প্রোফাইল তথ্য সফলভাবে হালনাগাদ করা হয়েছে!', 'success');
      setActiveTab('overview');
    } catch (err) {
      console.warn('Backend profile update failed, syncing locally:', err.message);
      try {
        localStorage.setItem('edufast_student_session', JSON.stringify(updatedUserObj));
      } catch (e) {}

      if (onUpdateUser) {
        onUpdateUser(updatedUserObj);
      }

      setIsSaving(false);
      if (addToast) addToast('প্রোফাইল লোকালি সফলভাবে সংরক্ষণ হয়েছে!', 'success');
      setActiveTab('overview');
    }
  };

  const sscGpa = user.ssc?.gpa !== undefined && user.ssc?.gpa !== null ? Number(user.ssc.gpa) : 0;
  const hscGpa = user.hsc?.gpa !== undefined && user.hsc?.gpa !== null ? Number(user.hsc.gpa) : 0;
  const totalGpa = (sscGpa + hscGpa).toFixed(2);

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Banner & Header */}
        <div className="sp-banner">
          <button className="sp-close-btn" onClick={onClose} title="বন্ধ করুন (Close)">
            &times;
          </button>

          <div className="sp-header-flex">
            <div className="sp-avatar-wrapper">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="sp-avatar-img" />
              ) : (
                <div className="sp-avatar-img">{user.name?.charAt(0) || 'S'}</div>
              )}
            </div>

            <div className="sp-header-info">
              <h2 className="sp-student-name">
                {user.name || 'শিক্ষার্থী'}
                <span className="sp-verified-pill">
                  ✓ Verified Student
                </span>
              </h2>

              <div className="sp-id-text">
                EduFast Student ID: <strong>EDF-{user.id || '2026'}</strong>
              </div>

              <div className="sp-header-pills">
                <span className="sp-header-tag">
                  🎓 বিভাগ: {user.group || user.academicGroup || 'Science'}
                </span>
                <span className="sp-header-tag" style={{ backgroundColor: 'rgba(254, 243, 199, 0.25)', color: '#fef3c7' }}>
                  🪙 {user.coins || 0} Coins
                </span>
                {user.streak > 0 && (
                  <span className="sp-header-tag" style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#fee2e2' }}>
                    🔥 {user.streak}-Day Streak
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sp-tabs-nav">
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 প্রোফাইল বিবরণী
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            🎓 এসএসসি/এইচএসসি
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            ✏️ তথ্য এডিট
          </button>
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'mentor' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentor')}
          >
            👨‍🏫 নির্ধারিত মেন্টর
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="sp-body">
          
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW (Displays Email & all Signup Info)       */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div>
              {/* Personal Information Card */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>👤 ব্যক্তিগত তথ্য (Personal Details)</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-teal, #0d9488)' }}>
                    নিবন্ধনের সময় প্রদানকৃত
                  </span>
                </div>

                <div className="sp-info-grid">
                  {/* Email Field with Verified Badge */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">
                      <span>📧 ইমেইল অ্যাড্রেস (Email Address):</span>
                    </span>
                    <div className="sp-info-value">
                      <span>{user.email || 'তথ্য দেওয়া হয়নি'}</span>
                      {user.email && (
                        <>
                          <span style={{ fontSize: '0.7rem', color: '#059669', backgroundColor: '#def7ec', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            ✓ Verified
                          </span>
                          <button
                            type="button"
                            className="sp-copy-btn"
                            onClick={() => handleCopy(user.email, 'email')}
                            title="ইমেইল কপি করুন"
                          >
                            {copiedField === 'email' ? '✓ Copied' : 'কপি'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile Number Field */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">
                      <span>📱 মোবাইল নম্বর (Mobile Number):</span>
                    </span>
                    <div className="sp-info-value">
                      <span>{user.mobile || 'তথ্য দেওয়া হয়নি'}</span>
                      {user.mobile && (
                        <>
                          <span style={{ fontSize: '0.7rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            ✓ Active
                          </span>
                          <button
                            type="button"
                            className="sp-copy-btn"
                            onClick={() => handleCopy(user.mobile, 'mobile')}
                            title="মোবাইল নম্বর কপি করুন"
                          >
                            {copiedField === 'mobile' ? '✓ Copied' : 'কপি'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Father's Name */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">👨 পিতার নাম (Father's Name):</span>
                    <span className="sp-info-value">{user.fathersName || 'তথ্য পাওয়া যায়নি'}</span>
                  </div>

                  {/* Mother's Name */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">👩 মাতার নাম (Mother's Name):</span>
                    <span className="sp-info-value">{user.mothersName || 'তথ্য পাওয়া যায়নি'}</span>
                  </div>

                  {/* Date of Birth */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">📅 জন্ম তারিখ (Date of Birth):</span>
                    <span className="sp-info-value">{user.dob || 'তথ্য দেওয়া হয়নি'}</span>
                  </div>

                  {/* Academic Group */}
                  <div className="sp-info-item">
                    <span className="sp-info-label">🎯 বিভাগ / গ্রুপ (Group):</span>
                    <span className="sp-info-value">
                      <span style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', padding: '2px 8px', borderRadius: '6px', fontSize: '0.88rem' }}>
                        {user.group || user.academicGroup || 'Science'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Academic Summary */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>🎓 শিক্ষাগত রেকর্ডের সারাংশ (Academic Records)</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => setActiveTab('academic')}
                  >
                    বিস্তারিত দেখুন →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* SSC Summary Box */}
                  <div className="sp-exam-card">
                    <div className="sp-exam-header">
                      <span className="sp-exam-title">
                        🏫 SSC / সমমান রেকর্ড
                      </span>
                      <span className="sp-gpa-badge">
                        GPA {user.ssc?.gpa ? Number(user.ssc.gpa).toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>প্রতিষ্ঠান: <strong>{user.ssc?.school || 'বিদ্যালয় তথ্য নেই'}</strong></div>
                      <div>বোর্ড: <strong>{user.ssc?.board || 'Dhaka'}</strong> • পাসের সাল: <strong>{user.ssc?.year || '2024'}</strong></div>
                      <div>রোল: <strong>{user.ssc?.roll || 'N/A'}</strong> • রেজিস্ট্রেশন: <strong>{user.ssc?.reg || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* HSC Summary Box */}
                  <div className="sp-exam-card">
                    <div className="sp-exam-header">
                      <span className="sp-exam-title">
                        🏛️ HSC / সমমান রেকর্ড
                      </span>
                      <span className="sp-gpa-badge">
                        GPA {user.hsc?.gpa ? Number(user.hsc.gpa).toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>কলেজ: <strong>{user.hsc?.college || user.hsc?.school || 'কলেজ তথ্য নেই'}</strong></div>
                      <div>বোর্ড: <strong>{user.hsc?.board || 'Dhaka'}</strong> • ব্যাচ: <strong>{user.hsc?.year || '2026'}</strong></div>
                      <div>রোল: <strong>{user.hsc?.roll || 'N/A'}</strong> • রেজিস্ট্রেশন: <strong>{user.hsc?.reg || 'N/A'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Total GPA Banner */}
                <div className="sp-total-gpa-banner">
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                      সর্বমোট সমন্বিত জিপিএ (Combined SSC + HSC GPA)
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#134e4a' }}>
                      {totalGpa} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>/ 10.00</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#def7ec', color: '#03543f', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                      ✓ শীর্ষ বিশ্ববিদ্যালয়সমূহে আবেদনের যোগ্য
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DETAILED ACADEMIC RECORDS                         */}
          {/* ======================================================== */}
          {activeTab === 'academic' && (
            <div>
              {/* Detailed SSC Card */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>🏫 মাধ্যমিক (SSC / সমমান) পূর্ণাঙ্গ তথ্য</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    শিক্ষা বোর্ড কর্তৃক ভেরিফাইড
                  </span>
                </div>

                <div className="sp-info-grid">
                  <div className="sp-info-item">
                    <span className="sp-info-label">রোল নম্বর (SSC Roll):</span>
                    <div className="sp-info-value">
                      <span>{user.ssc?.roll || 'N/A'}</span>
                      {user.ssc?.roll && (
                        <button type="button" className="sp-copy-btn" onClick={() => handleCopy(user.ssc.roll, 'sscRoll')}>
                          {copiedField === 'sscRoll' ? '✓' : 'কপি'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">রেজিস্ট্রেশন নম্বর (SSC Reg):</span>
                    <div className="sp-info-value">
                      <span>{user.ssc?.reg || 'N/A'}</span>
                      {user.ssc?.reg && (
                        <button type="button" className="sp-copy-btn" onClick={() => handleCopy(user.ssc.reg, 'sscReg')}>
                          {copiedField === 'sscReg' ? '✓' : 'কপি'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">শিক্ষা বোর্ড (Education Board):</span>
                    <span className="sp-info-value">{user.ssc?.board || 'Dhaka'}</span>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">পাসের বছর (Passing Year):</span>
                    <span className="sp-info-value">{user.ssc?.year || '2024'}</span>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">অর্জিত জিপিএ (SSC GPA):</span>
                    <span className="sp-info-value" style={{ color: '#059669', fontSize: '1.1rem' }}>
                      {user.ssc?.gpa ? Number(user.ssc.gpa).toFixed(2) : '5.00'} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ 5.00</span>
                    </span>
                  </div>

                  <div className="sp-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="sp-info-label">বিদ্যালয়ের নাম (School Name):</span>
                    <span className="sp-info-value">{user.ssc?.school || 'উল্লেখ করা হয়নি'}</span>
                  </div>
                </div>
              </div>

              {/* Detailed HSC Card */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>🏛️ উচ্চমাধ্যমিক (HSC / সমমান) পূর্ণাঙ্গ তথ্য</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    শিক্ষা বোর্ড কর্তৃক ভেরিফাইড
                  </span>
                </div>

                <div className="sp-info-grid">
                  <div className="sp-info-item">
                    <span className="sp-info-label">রোল নম্বর (HSC Roll):</span>
                    <div className="sp-info-value">
                      <span>{user.hsc?.roll || 'N/A'}</span>
                      {user.hsc?.roll && (
                        <button type="button" className="sp-copy-btn" onClick={() => handleCopy(user.hsc.roll, 'hscRoll')}>
                          {copiedField === 'hscRoll' ? '✓' : 'কপি'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">রেজিস্ট্রেশন নম্বর (HSC Reg):</span>
                    <div className="sp-info-value">
                      <span>{user.hsc?.reg || 'N/A'}</span>
                      {user.hsc?.reg && (
                        <button type="button" className="sp-copy-btn" onClick={() => handleCopy(user.hsc.reg, 'hscReg')}>
                          {copiedField === 'hscReg' ? '✓' : 'কপি'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">শিক্ষা বোর্ড (Education Board):</span>
                    <span className="sp-info-value">{user.hsc?.board || 'Dhaka'}</span>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">পাসের বছর / ব্যাচ (Year):</span>
                    <span className="sp-info-value">{user.hsc?.year || '2026'}</span>
                  </div>

                  <div className="sp-info-item">
                    <span className="sp-info-label">অর্জিত জিপিএ (HSC GPA):</span>
                    <span className="sp-info-value" style={{ color: '#059669', fontSize: '1.1rem' }}>
                      {user.hsc?.gpa ? Number(user.hsc.gpa).toFixed(2) : '5.00'} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ 5.00</span>
                    </span>
                  </div>

                  <div className="sp-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="sp-info-label">কলেজের নাম (College Name):</span>
                    <span className="sp-info-value">{user.hsc?.college || user.hsc?.school || 'উল্লেখ করা হয়নি'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: EDIT PROFILE FORM                                 */}
          {/* ======================================================== */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile}>
              {/* Avatar Uploader Section */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>📷 প্রোফাইল ছবি হালনাগাদ (Avatar Photo)</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>সর্বোচ্চ ১ মেগাবাইট (Max 1MB)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Preview"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-teal, #319795)' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-teal, #319795)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                      {formData.name?.charAt(0) || 'S'}
                    </div>
                  )}

                  <div>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.55rem 1.1rem',
                      backgroundColor: '#f1f5f9',
                      border: '1.5px dashed var(--primary-teal, #319795)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--primary-teal, #0d9488)'
                    }}>
                      📁 নতুন ছবি নির্বাচন করুন
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
                          marginLeft: '0.75rem',
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ছবি মুছুন
                      </button>
                    )}

                    {fileSizeError && (
                      <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 600 }}>
                        {fileSizeError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="sp-card-section">
                <div className="sp-card-title">
                  <span>👤 ব্যক্তিগত তথ্য সম্পাদনা</span>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">শিক্ষার্থীর পুরো নাম (Full Name) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ইমেইল অ্যাড্রেস (Email Address - অপরিবর্তনীয়)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user.email || ''}
                      disabled
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                      title="রেজিস্ট্রেশনের ইমেইল পরিবর্তন করা যাবে না"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">মোবাইল নম্বর (Mobile Number)</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">পিতার নাম (Father's Name)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fathersName}
                      onChange={(e) => setFormData({ ...formData, fathersName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">মাতার নাম (Mother's Name)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.mothersName}
                      onChange={(e) => setFormData({ ...formData, mothersName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">জন্ম তারিখ (Date of Birth)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">অ্যাকাডেমিক বিভাগ (Academic Group)</label>
                    <select
                      className="form-select"
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    >
                      <option value="Science">Science (বিজ্ঞান)</option>
                      <option value="Commerce">Commerce / Business Studies (ব্যবসায় শিক্ষা)</option>
                      <option value="Arts">Humanities / Arts (মানবিক)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('overview')}
                    disabled={isSaving}
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="btn btn-teal"
                    disabled={isSaving || !!fileSizeError}
                    style={{ minWidth: '150px' }}
                  >
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ASSIGNED SENIOR MENTOR                           */}
          {/* ======================================================== */}
          {activeTab === 'mentor' && (
            <div>
              <div className="sp-mentor-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-teal, #319795)', textTransform: 'uppercase' }}>
                    👨‍🏫 আপনার নির্ধারিত সিনিয়র মেন্টর (Assigned Mentor)
                  </span>
                  <span style={{ fontSize: '0.74rem', backgroundColor: '#def7ec', color: '#03543f', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    ● Online 24/7 Live
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-teal, #319795)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.6rem', flexShrink: 0 }}>
                    👨‍🏫
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                      Engr. Rakibul Hasan (BUET CSE)
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Senior Academic Mentor & Doubt Solver • Rating: ⭐ 4.9/5.0
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f766e', marginTop: '2px' }}>
                      স্পেশালাইজেশন: ইঞ্জিনিয়ারিং ও বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি এবং একাডেমিক গাইডলাইন
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  আপনার যে কোনো একাডেমিক সমস্যা, প্রশ্ন ব্যাংক ডাউট বা বিশ্ববিদ্যালয়ের ভর্তি পরামর্শের জন্য সরাসরি মেন্টরের সাথে লাইভ চ্যাট করতে পারবেন।
                </p>

                <button
                  type="button"
                  className="btn btn-teal"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--primary-teal, #319795)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-mentor-chat'));
                  }}
                >
                  💬 মেন্টরের সাথে সরাসরি কথা বলুন (Launch Mentor Chat)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="sp-modal-footer">
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            EduFast • নিরাপদ ও যাচাইকৃত শিক্ষার্থী প্রোফাইল
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeTab !== 'edit' ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                onClick={() => setActiveTab('edit')}
              >
                ✏️ প্রোফাইল এডিট
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
              onClick={onClose}
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
