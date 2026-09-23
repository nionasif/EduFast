import React, { useState, useEffect, useMemo } from 'react';
import './MentorMockTestManager.css';
import { 
  getMockTests, 
  saveMockTest, 
  deleteMockTest 
} from '../../data/mockData';

const BACKEND_URL = 'http://localhost:5001';

const SUBJECT_DEFAULTS = {
  Science: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান',
  Commerce: 'হিসাববিজ্ঞান, ব্যবসায় সংগঠন, ফিন্যান্স, মার্কেটিং',
  Arts: 'বাংলা, ইংরেজি, পৌরনীতি, ইতিহাস, অর্থনীতি'
};

const INITIAL_TEST_FORM = {
  title: '',
  group: 'Science',
  subject: 'পদার্থবিজ্ঞান ও রসায়ন',
  examTarget: 'DU Ka Unit, BUET, Medical',
  duration: 30,
  negativeMarking: -0.25,
  badge: '🔥 Mentor Special'
};

const INITIAL_QUESTION_FORM = {
  question: '',
  optA: '',
  optB: '',
  optC: '',
  optD: '',
  correct: 0,
  explanation: '',
  subject: ''
};

export default function MentorMockTestManager({ mentorProfile }) {
  const mentorId = mentorProfile?.id || mentorProfile?.email || 'mentor-1';
  const mentorName = mentorProfile?.name || 'Mentor Specialist';

  const [tests, setTests] = useState(() => getMockTests());
  const [filterGroup, setFilterGroup] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testForm, setTestForm] = useState(INITIAL_TEST_FORM);
  const [questionsList, setQuestionsList] = useState([]);
  const [currQ, setCurrQ] = useState(INITIAL_QUESTION_FORM);
  const [currentStep, setCurrentStep] = useState(1); // 1: Config, 2: MCQs, 3: Review

  // Question Bank Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // Preview Modal
  const [previewTest, setPreviewTest] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast(null);
    setTimeout(() => setToast({ message, type }), 10);
    setTimeout(() => setToast(null), 4000);
  };

  // Sync tests with cross-tab / window updates
  useEffect(() => {
    const handleUpdate = () => {
      setTests(getMockTests());
    };
    window.addEventListener('edufast-mock-tests-update', handleUpdate);
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => {
      window.removeEventListener('edufast-mock-tests-update', handleUpdate);
      window.removeEventListener('edufast-data-update', handleUpdate);
    };
  }, []);

  // Fetch Central Question Bank when picker opens
  const fetchBankQuestions = async () => {
    setLoadingBank(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions?limit=150`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBankQuestions(data.data);
      } else {
        setBankQuestions([]);
      }
    } catch (e) {
      console.warn('Could not fetch bank questions, using local cache:', e);
    } finally {
      setLoadingBank(false);
    }
  };

  // Open creation modal
  const handleStartCreate = () => {
    setTestForm({
      ...INITIAL_TEST_FORM,
      subject: SUBJECT_DEFAULTS['Science']
    });
    setQuestionsList([]);
    setCurrQ(INITIAL_QUESTION_FORM);
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  // Add Current Question to draft list
  const handleAddQuestionToDraft = (e) => {
    if (e) e.preventDefault();
    if (!currQ.question.trim()) {
      showToast('অনুগ্রহ করে প্রশ্নের বিবরণ লিখুন।', 'error');
      return;
    }
    if (!currQ.optA.trim() || !currQ.optB.trim() || !currQ.optC.trim() || !currQ.optD.trim()) {
      showToast('সবগুলো ৪টি অপশন (A, B, C, D) পূরণ করতে হবে।', 'error');
      return;
    }

    const newQuestionObj = {
      id: `q-${Date.now()}-${questionsList.length + 1}`,
      question: currQ.question.trim(),
      options: [
        currQ.optA.trim(),
        currQ.optB.trim(),
        currQ.optC.trim(),
        currQ.optD.trim()
      ],
      correct: parseInt(currQ.correct, 10),
      explanation: currQ.explanation.trim() || 'কোনো ব্যাখ্যা দেওয়া হয়নি।',
      subject: currQ.subject.trim() || testForm.subject.split(',')[0] || 'General'
    };

    setQuestionsList(prev => [...prev, newQuestionObj]);
    setCurrQ(INITIAL_QUESTION_FORM);
    showToast(`প্রশ্ন #${questionsList.length + 1} সফলভাবে যোগ হয়েছে!`, 'success');
  };

  // Remove a question from draft
  const handleRemoveQuestionFromDraft = (index) => {
    setQuestionsList(prev => prev.filter((_, i) => i !== index));
  };

  // Import question from bank
  const handleImportQuestion = (bq) => {
    const isAlreadyAdded = questionsList.some(q => q.question === bq.question);
    if (isAlreadyAdded) {
      showToast('এই প্রশ্নটি ইতিমধ্যে এই টেস্টে যোগ করা হয়েছে!', 'error');
      return;
    }

    let correctIndex = 0;
    if (bq.correctAnswer === 'B' || bq.correctAnswer === 'b') correctIndex = 1;
    else if (bq.correctAnswer === 'C' || bq.correctAnswer === 'c') correctIndex = 2;
    else if (bq.correctAnswer === 'D' || bq.correctAnswer === 'd') correctIndex = 3;

    const importedQ = {
      id: `q-${Date.now()}-${questionsList.length + 1}`,
      question: bq.question,
      options: [bq.optionA, bq.optionB, bq.optionC, bq.optionD],
      correct: correctIndex,
      explanation: bq.explanation || 'সঠিক উত্তর যাচাইকৃত।',
      subject: bq.subject || 'General'
    };

    setQuestionsList(prev => [...prev, importedQ]);
    showToast(`প্রশ্নব্যাংক থেকে প্রশ্ন যুক্ত করা হয়েছে!`, 'success');
  };

  // Final Publish Handler
  const handlePublishTest = () => {
    if (!testForm.title.trim()) {
      showToast('মক টেস্টের একটি শিরোনাম দিন।', 'error');
      setCurrentStep(1);
      return;
    }
    if (questionsList.length === 0) {
      showToast('টেস্টে অন্তত ১টি বা ততোধিক প্রশ্ন যুক্ত করতে হবে।', 'error');
      setCurrentStep(2);
      return;
    }

    const newTestPayload = {
      id: `test-mentor-${Date.now()}`,
      title: testForm.title.trim(),
      subject: testForm.subject.trim(),
      group: testForm.group,
      duration: parseInt(testForm.duration, 10) || 30,
      totalMarks: questionsList.length * 1,
      negativeMarking: parseFloat(testForm.negativeMarking) || -0.25,
      badge: testForm.badge || '🔥 Mentor Special',
      examTarget: testForm.examTarget.trim() || 'Admission Mock Test',
      mentorId,
      mentorName,
      mentorEmail: mentorProfile?.email || '',
      createdAt: new Date().toISOString(),
      questions: questionsList
    };

    saveMockTest(newTestPayload, mentorProfile);
    setTests(getMockTests());
    setIsModalOpen(false);
    showToast(`🎉 অভিনন্দন! "${newTestPayload.title}" টেস্টটি সফলভাবে লাইভ পাবলিশ করা হয়েছে!`, 'success');
  };

  // Delete test
  const handleDelete = (testId, title) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${title}" মক টেস্টটি ডিলিট করতে চান?`)) {
      deleteMockTest(testId);
      setTests(getMockTests());
      showToast('মক টেস্টটি ডিলিট করা হয়েছে।', 'info');
    }
  };

  // Check if a test belongs to this specific mentor
  const isMyTest = (t) => {
    if (!t) return false;
    if (t.mentorId && (t.mentorId === mentorId || t.mentorId === mentorProfile?.id || t.mentorId === mentorProfile?.email)) return true;
    if (t.mentorEmail && mentorProfile?.email && t.mentorEmail.toLowerCase() === mentorProfile.email.toLowerCase()) return true;
    if (t.mentorName && mentorProfile?.name && t.mentorName.trim().toLowerCase() === mentorProfile.name.trim().toLowerCase()) return true;
    return false;
  };

  // Filtered test cards
  const displayedTests = useMemo(() => {
    return tests.filter(t => {
      const matchGroup = filterGroup === 'All' || t.group === filterGroup;
      const matchSearch = !searchTerm.trim() || 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.mentorName && t.mentorName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchGroup && matchSearch;
    });
  }, [tests, filterGroup, searchTerm]);

  // Statistics
  const mentorCreatedList = tests.filter(isMyTest);
  const totalQuestionsDrafted = mentorCreatedList.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

  return (
    <div className="mmt-container">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`mmt-toast ${toast.type}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="mmt-header-banner">
        <div>
          <div className="mmt-header-title-row">
            <span style={{ fontSize: '1.6rem' }}>📝</span>
            <h2 className="mmt-header-title">Mock Test Creator & Exam Studio</h2>
            <span className="mmt-header-badge">MENTOR DESK</span>
          </div>
          <p className="mmt-header-desc">
            বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বাস্তব সিমুলেশন তৈরি করুন—এমসিকিউ প্রশ্ন, সময় ও নেগেটিভ মার্কিং সেট করে শিক্ষার্থীদের জন্য সরাসরি লাইভ করুন।
          </p>
        </div>

        <button type="button" className="mmt-btn-create" onClick={handleStartCreate}>
          <span style={{ fontSize: '1.1rem' }}>+</span> নতুন মক টেস্ট তৈরি করুন
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="mmt-stats-grid">
        <div className="mmt-stat-card">
          <div className="mmt-stat-icon blue">📋</div>
          <div>
            <div className="mmt-stat-label">আপনার তৈরি টেস্ট</div>
            <div className="mmt-stat-val">{mentorCreatedList.length} টি</div>
          </div>
        </div>

        <div className="mmt-stat-card">
          <div className="mmt-stat-icon green">❓</div>
          <div>
            <div className="mmt-stat-label">মোট ইনপুটকৃত প্রশ্ন</div>
            <div className="mmt-stat-val" style={{ color: '#10b981' }}>{totalQuestionsDrafted} টি</div>
          </div>
        </div>

        <div className="mmt-stat-card">
          <div className="mmt-stat-icon amber">🎯</div>
          <div>
            <div className="mmt-stat-label">প্ল্যাটফর্মে সক্রিয় টেস্ট</div>
            <div className="mmt-stat-val">{tests.length} টি</div>
          </div>
        </div>

        <div className="mmt-stat-card">
          <div className="mmt-stat-icon purple">⚡</div>
          <div>
            <div className="mmt-stat-label">স্টুডেন্ট ফিডব্যাক</div>
            <div className="mmt-stat-val">৪.৯/৫.০ (লাইভ)</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mmt-filter-bar">
        <div className="mmt-filter-group">
          {['All', 'Science', 'Commerce', 'Arts'].map(grp => (
            <button
              key={grp}
              type="button"
              className={`mmt-filter-btn ${filterGroup === grp ? 'active' : ''}`}
              onClick={() => setFilterGroup(grp)}
            >
              {grp === 'All' ? '🌐 সকল টেস্ট' : grp === 'Science' ? '🧪 বিজ্ঞান' : grp === 'Commerce' ? '💼 ব্যবসায়' : '📚 মানবিক'}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="mmt-search-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="টেস্টের নাম বা টার্গেট সার্চ করুন..."
        />
      </div>

      {/* Test Cards Grid */}
      <div className="mmt-grid">
        {displayedTests.map((test) => {
          const isMentorCreated = isMyTest(test);

          return (
            <div
              key={test.id}
              className={`mmt-card ${isMentorCreated ? 'mentor-created' : ''}`}
            >
              <div>
                <div className="mmt-card-top">
                  <span className={`mmt-group-badge ${test.group}`}>
                    {test.group}
                  </span>

                  {isMentorCreated ? (
                    <span className="mmt-mentor-tag">
                      ✨ আপনার তৈরি
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {test.badge || 'স্ট্যান্ডার্ড'}
                    </span>
                  )}
                </div>

                <h4 className="mmt-card-title">{test.title}</h4>
                <p className="mmt-card-subject">{test.subject}</p>

                {test.examTarget && (
                  <div className="mmt-card-target">
                    🎯 {test.examTarget}
                  </div>
                )}

                <div className="mmt-pills-row">
                  <div className="mmt-pill">
                    ⏱ <strong>{test.duration}</strong> মিনিট
                  </div>
                  <div className="mmt-pill">
                    📝 <strong>{test.questions?.length || 0}</strong> টি প্রশ্ন
                  </div>
                  <div className="mmt-pill negative">
                    ➖ <strong>{test.negativeMarking}</strong> নেগেটিভ
                  </div>
                </div>
              </div>

              <div className="mmt-card-footer">
                <button
                  type="button"
                  className="mmt-btn-preview"
                  onClick={() => setPreviewTest(test)}
                >
                  👁 প্রশ্ন দেখুন
                </button>

                {isMentorCreated && (
                  <button
                    type="button"
                    className="mmt-btn-delete"
                    onClick={() => handleDelete(test.id, test.title)}
                    title="ডিলিট করুন"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayedTests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px dashed rgba(51, 65, 85, 0.8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div>
          <h3 style={{ margin: 0, color: '#ffffff' }}>কোনো মক টেস্ট খুঁজে পাওয়া যায়নি</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            উপরের "+ নতুন মক টেস্ট তৈরি করুন" বাটনে ক্লিক করে প্রথম টেস্টটি তৈরি করুন!
          </p>
        </div>
      )}

      {/* MODAL: CREATE NEW MOCK TEST */}
      {isModalOpen && (
        <div className="mmt-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mmt-modal-content" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="mmt-modal-header">
              <div>
                <h3 className="mmt-modal-title">
                  <span>🎯</span> নতুন মক টেস্ট তৈরি করুন
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  ধাপ {currentStep}/৩: {currentStep === 1 ? 'পরীক্ষার তথ্য ও সেটিংস' : currentStep === 2 ? 'এমসিকিউ প্রশ্ন যুক্ত করুন' : 'প্রিভিউ ও পাবলিশ'}
                </div>
              </div>
              <button type="button" className="mmt-modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="mmt-stepper-bar">
              {[
                { step: 1, label: '১. টেস্টের সাধারণ তথ্য' },
                { step: 2, label: `২. প্রশ্ন তৈরি (${questionsList.length}টি যুক্ত)` },
                { step: 3, label: '৩. প্রিভিউ ও ফাইনাল পাবলিশ' }
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  className={`mmt-step-btn ${currentStep === s.step ? 'active' : ''}`}
                  onClick={() => setCurrentStep(s.step)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="mmt-modal-body">

              {/* STEP 1: EXAM BASIC CONFIG */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div className="mmt-form-group">
                    <label className="mmt-form-label">পরীক্ষার শিরোনাম (Exam Title) *</label>
                    <input
                      type="text"
                      className="mmt-form-input"
                      value={testForm.title}
                      onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                      placeholder="যেমন: DU 'Ka' Unit Physics & Chemistry Final Revision"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="mmt-form-group">
                      <label className="mmt-form-label">গ্রুপ / স্ট্রিম (Group) *</label>
                      <select
                        className="mmt-form-select"
                        value={testForm.group}
                        onChange={e => {
                          const newGrp = e.target.value;
                          setTestForm({
                            ...testForm,
                            group: newGrp,
                            subject: SUBJECT_DEFAULTS[newGrp] || ''
                          });
                        }}
                      >
                        <option value="Science">বিজ্ঞান (Science)</option>
                        <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                        <option value="Arts">মানবিক (Arts)</option>
                      </select>
                    </div>

                    <div className="mmt-form-group">
                      <label className="mmt-form-label">বিষয়সমূহ (Subject / Coverage)</label>
                      <input
                        type="text"
                        className="mmt-form-input"
                        value={testForm.subject}
                        onChange={e => setTestForm({ ...testForm, subject: e.target.value })}
                        placeholder="যেমন: Physics, Chemistry, Math"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="mmt-form-group">
                      <label className="mmt-form-label">টার্গেট এডমিশন (Target)</label>
                      <input
                        type="text"
                        className="mmt-form-input"
                        value={testForm.examTarget}
                        onChange={e => setTestForm({ ...testForm, examTarget: e.target.value })}
                        placeholder="যেমন: DU Ka, BUET, Medical"
                      />
                    </div>

                    <div className="mmt-form-group">
                      <label className="mmt-form-label">সময়কাল (মিনিট) *</label>
                      <select
                        className="mmt-form-select"
                        value={testForm.duration}
                        onChange={e => setTestForm({ ...testForm, duration: e.target.value })}
                      >
                        <option value={15}>১৫ মিনিট (স্পিড টেস্ট)</option>
                        <option value={30}>৩০ মিনিট (স্ট্যান্ডার্ড)</option>
                        <option value={45}>৪৫ মিনিট (ফুল মডিউল)</option>
                        <option value={60}>৬০ মিনিট (পূর্ণাঙ্গ পেপার)</option>
                        <option value={90}>৯০ মিনিট (মেগা এক্সাম)</option>
                      </select>
                    </div>

                    <div className="mmt-form-group">
                      <label className="mmt-form-label">নেগেটিভ মার্কিং</label>
                      <select
                        className="mmt-form-select"
                        value={testForm.negativeMarking}
                        onChange={e => setTestForm({ ...testForm, negativeMarking: parseFloat(e.target.value) })}
                      >
                        <option value={-0.25}>-0.25 (DU / Medical Standard)</option>
                        <option value={-0.20}>-0.20 (GST Standard)</option>
                        <option value={-0.50}>-0.50 (Strict Practice)</option>
                        <option value={0}>0.00 (কোনো নেগেটিভ নেই)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                    <button
                      type="button"
                      style={{
                        background: '#319795',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.6rem 1.4rem',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onClick={() => setCurrentStep(2)}
                    >
                      পরবর্তী ধাপ: প্রশ্ন যোগ করুন ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: MCQ BUILDER */}
              {currentStep === 2 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8' }}>
                      প্রশ্ন সংখ্যা: {questionsList.length} টি যুক্ত হয়েছে
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        fetchBankQuestions();
                        setIsPickerOpen(true);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>📂</span> সেন্ট্রাল প্রশ্নব্যাংক থেকে পিক করুন
                    </button>
                  </div>

                  {/* Input Form for Single Question */}
                  <div className="mmt-q-panel">
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✏️</span> নতুন প্রশ্ন তৈরি (Question #{questionsList.length + 1})
                    </div>

                    <div style={{ marginBottom: '0.85rem' }}>
                      <textarea
                        rows={3}
                        className="mmt-form-textarea"
                        value={currQ.question}
                        onChange={e => setCurrQ({ ...currQ, question: e.target.value })}
                        placeholder="প্রশ্নটি বাংলায় বা ইংরেজিতে লিখুন... (যেমন: স্থির তরঙ্গে দুটি পরপর নিষ্পন্দ বিন্দুর মধ্যবর্তী দূরত্ব কত?)"
                      />
                    </div>

                    {/* 4 Options Grid */}
                    <div className="mmt-options-grid">
                      {[
                        { key: 'optA', label: 'অপশন A', idx: 0 },
                        { key: 'optB', label: 'অপশন B', idx: 1 },
                        { key: 'optC', label: 'অপশন C', idx: 2 },
                        { key: 'optD', label: 'অপশন D', idx: 3 }
                      ].map(opt => (
                        <div key={opt.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{opt.label}</span>
                            <label style={{ fontSize: '0.72rem', color: currQ.correct === opt.idx ? '#34d399' : '#64748b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <input
                                type="radio"
                                name="correctOption"
                                checked={currQ.correct === opt.idx}
                                onChange={() => setCurrQ({ ...currQ, correct: opt.idx })}
                              />
                              সঠিক উত্তর
                            </label>
                          </div>
                          <input
                            type="text"
                            className="mmt-form-input"
                            value={currQ[opt.key]}
                            onChange={e => setCurrQ({ ...currQ, [opt.key]: e.target.value })}
                            placeholder={`${opt.label} এর মান...`}
                            style={{
                              background: currQ.correct === opt.idx ? 'rgba(16, 185, 129, 0.1)' : '#0f172a',
                              borderColor: currQ.correct === opt.idx ? '#10b981' : '#334155'
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="mmt-form-label" style={{ color: '#94a3b8' }}>
                        ব্যাখ্যা ও সমাধান (পরীক্ষা শেষে শিক্ষার্থীরা এটি দেখতে পারবে)
                      </label>
                      <input
                        type="text"
                        className="mmt-form-input"
                        value={currQ.explanation}
                        onChange={e => setCurrQ({ ...currQ, explanation: e.target.value })}
                        placeholder="যেমন: পরপর দুটি নিষ্পন্দ বিন্দুর দূরত্ব λ/2।"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestionToDraft}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>➕</span> এই প্রশ্নটি টেস্টে যোগ করুন
                    </button>
                  </div>

                  {/* Draft Questions List */}
                  {questionsList.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#e2e8f0', marginBottom: '0.75rem' }}>
                        যুক্ত হওয়া প্রশ্নসমূহ ({questionsList.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {questionsList.map((q, idx) => (
                          <div key={q.id} className="mmt-q-item-card">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                                #{idx + 1}. {q.question}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem', fontSize: '0.76rem', color: '#94a3b8' }}>
                                <div>A) {q.options[0]}</div>
                                <div>B) {q.options[1]}</div>
                                <div>C) {q.options[2]}</div>
                                <div>D) {q.options[3]}</div>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, marginTop: '0.3rem' }}>
                                ✓ সঠিক উত্তর: অপশন {['A', 'B', 'C', 'D'][q.correct]}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromDraft(idx)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#f87171',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              মুছুন
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      style={{
                        background: 'rgba(51, 65, 85, 0.6)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⬅ পূর্বে
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (questionsList.length === 0) {
                          showToast('অন্তত ১টি প্রশ্ন যুক্ত করুন।', 'error');
                          return;
                        }
                        setCurrentStep(3);
                      }}
                      style={{
                        background: '#319795',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.3rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      পরবর্তী ধাপ: প্রিভিউ ও পাবলিশ ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & PUBLISH */}
              {currentStep === 3 && (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(49, 151, 149, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%)',
                    border: '1px solid rgba(49, 151, 149, 0.4)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                      {testForm.title || 'Untitled Mock Test'}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      বিষয়: <strong>{testForm.subject}</strong> • গ্রুপ: <strong>{testForm.group}</strong> • টার্গেট: <strong>{testForm.examTarget}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="mmt-pill">
                        ⏱ সময়: <strong>{testForm.duration} মিনিট</strong>
                      </div>
                      <div className="mmt-pill">
                        📝 প্রশ্নসংখ্যা: <strong>{questionsList.length} টি</strong>
                      </div>
                      <div className="mmt-pill">
                        🏆 মোট নম্বর: <strong>{questionsList.length}</strong>
                      </div>
                      <div className="mmt-pill negative">
                        ➖ নেগেটিভ মার্ক: <strong>{testForm.negativeMarking}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.75rem', fontWeight: 700 }}>
                    পরীক্ষাপত্র নিশ্চিতকরণ ({questionsList.length}টি প্রশ্ন সংকলিত হয়েছে):
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {questionsList.map((q, idx) => (
                      <div key={q.id} style={{ background: '#1e293b', padding: '0.65rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>#{idx + 1}. {q.question}</div>
                        <div style={{ color: '#34d399', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          ✓ সঠিক উত্তর: {['A', 'B', 'C', 'D'][q.correct]} ({q.options[q.correct]})
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      style={{
                        background: 'rgba(51, 65, 85, 0.6)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⬅ প্রশ্ন সম্পাদনা করুন
                    </button>

                    <button
                      type="button"
                      onClick={handlePublishTest}
                      style={{
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.7rem 1.75rem',
                        borderRadius: '10px',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)'
                      }}
                    >
                      🚀 মক টেস্ট লাইভ পাবলিশ করুন
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUESTION BANK IMPORT PICKER */}
      {isPickerOpen && (
        <div className="mmt-modal-backdrop" onClick={() => setIsPickerOpen(false)}>
          <div className="mmt-modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="mmt-modal-header">
              <div>
                <h3 className="mmt-modal-title">
                  📂 সেন্ট্রাল প্রশ্নব্যাংক থেকে প্রশ্ন নির্বাচন করুন
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                  যে কোনো প্রশ্ন এক ক্লিকে আপনার মক টেস্টে যুক্ত করুন
                </p>
              </div>
              <button
                type="button"
                className="mmt-modal-close"
                onClick={() => setIsPickerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', background: 'rgba(15, 23, 42, 0.5)' }}>
              <input
                type="text"
                className="mmt-search-input"
                style={{ width: '100%' }}
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                placeholder="প্রশ্ন বা বিষয় সার্চ করুন..."
              />
            </div>

            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {loadingBank && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  প্রশ্ন লোড হচ্ছে...
                </div>
              )}

              {!loadingBank && bankQuestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  প্রশ্নব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি। আপনি নতুন প্রশ্ন ম্যানুয়ালি লিখে তৈরি করতে পারেন।
                </div>
              )}

              {bankQuestions
                .filter(q => !bankSearch.trim() || q.question.toLowerCase().includes(bankSearch.toLowerCase()) || q.subject.toLowerCase().includes(bankSearch.toLowerCase()))
                .map((bq, idx) => {
                  const alreadyAdded = questionsList.some(q => q.question === bq.question);
                  return (
                    <div
                      key={bq.id || idx}
                      className="mmt-q-item-card"
                      style={{
                        background: alreadyAdded ? 'rgba(16, 185, 129, 0.08)' : '#1e293b',
                        borderColor: alreadyAdded ? 'rgba(16, 185, 129, 0.3)' : '#334155',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                          {bq.question}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          বিষয়: {bq.subject} • সঠিক উত্তর: {bq.correctAnswer}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleImportQuestion(bq)}
                        style={{
                          background: alreadyAdded ? 'rgba(51, 65, 85, 0.5)' : '#319795',
                          color: alreadyAdded ? '#94a3b8' : '#ffffff',
                          border: 'none',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: alreadyAdded ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {alreadyAdded ? '✓ যুক্ত আছে' : '+ যুক্ত করুন'}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div style={{ padding: '0.85rem 1.5rem', background: '#1e293b', borderTop: '1px solid #334155', textAlign: 'right' }}>
              <button
                type="button"
                style={{
                  background: '#319795',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setIsPickerOpen(false)}
              >
                সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW EXAM QUESTIONS */}
      {previewTest && (
        <div className="mmt-modal-backdrop" onClick={() => setPreviewTest(null)}>
          <div className="mmt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="mmt-modal-header">
              <div>
                <h3 className="mmt-modal-title">
                  👁 {previewTest.title} (প্রশ্ন প্রিভিউ)
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {previewTest.subject} • {previewTest.group} • {previewTest.duration} মিনিট • {previewTest.questions?.length || 0} টি প্রশ্ন
                </div>
              </div>
              <button
                type="button"
                className="mmt-modal-close"
                onClick={() => setPreviewTest(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {previewTest.questions && previewTest.questions.map((q, idx) => (
                <div key={q.id || idx} style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                    #{idx + 1}. {q.question}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct === optIdx;
                      return (
                        <div
                          key={optIdx}
                          style={{
                            padding: '0.4rem 0.65rem',
                            borderRadius: '6px',
                            background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                            border: isCorrect ? '1px solid #10b981' : '1px solid #334155',
                            color: isCorrect ? '#34d399' : '#cbd5e1',
                            fontSize: '0.78rem',
                            fontWeight: isCorrect ? 700 : 400
                          }}
                        >
                          {['A', 'B', 'C', 'D'][optIdx]}) {opt}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', background: '#0f172a', padding: '0.45rem 0.75rem', borderRadius: '6px' }}>
                      💡 <strong>ব্যাখ্যা:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '0.85rem 1.5rem', background: '#1e293b', borderTop: '1px solid #334155', textAlign: 'right' }}>
              <button
                type="button"
                style={{
                  background: '#319795',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setPreviewTest(null)}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
