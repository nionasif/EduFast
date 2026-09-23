import React, { useState, useEffect, useMemo } from 'react';

const BACKEND_URL = 'http://localhost:5001';

const SUBJECT_OPTIONS = [
  { id: 'Physics', label: 'Physics (পদার্থবিজ্ঞান)', icon: '⚛️', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'Chemistry', label: 'Chemistry (রসায়ন)', icon: '🧪', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 'Higher Math', label: 'Higher Math (উচ্চতর গণিত)', icon: '📐', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'Biology', label: 'Biology (জীববিজ্ঞান)', icon: '🧬', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { id: 'English', label: 'English (ইংরেজি)', icon: '📖', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'Bangla', label: 'Bangla (বাংলা)', icon: '🇧🇩', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'ICT', label: 'ICT (তথ্যপ্রযুক্তি)', icon: '💻', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  { id: 'General Knowledge', label: 'General Knowledge (সাধারণ জ্ঞান)', icon: '🌐', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }
];

const INITIAL_FORM = {
  subject: 'Physics',
  chapter: '',
  difficulty: 'medium',
  yearTag: '',
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: ''
};

export default function QuestionBankManager({ roleTitle = 'Portal', userName = 'Admin' }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [expandedSolutions, setExpandedSolutions] = useState({});

  // Show Toast
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Fetch Questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/questions?limit=200`;
      if (selectedSubject !== 'All') url += `&subject=${encodeURIComponent(selectedSubject)}`;
      if (selectedDifficulty !== 'All') url += `&difficulty=${encodeURIComponent(selectedDifficulty)}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setQuestions(data.data);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      showToast('Backend connection failed. Please ensure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      ...INITIAL_FORM,
      subject: selectedSubject !== 'All' ? selectedSubject : 'Physics'
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (q) => {
    setIsEditing(true);
    // Normalize correct answer to A, B, C, or D
    let normAns = q.correctAnswer;
    if (normAns === q.optionA) normAns = 'A';
    else if (normAns === q.optionB) normAns = 'B';
    else if (normAns === q.optionC) normAns = 'C';
    else if (normAns === q.optionD) normAns = 'D';

    setFormData({
      id: q.id,
      subject: q.subject || 'Physics',
      chapter: q.chapter || '',
      difficulty: (q.difficulty || 'medium').toLowerCase(),
      yearTag: q.yearTag || '',
      question: q.question || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: normAns || 'A',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  // Save / Submit Question (Create or Edit)
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() || !formData.optionD.trim()) {
      showToast('অনুগ্রহ করে প্রশ্ন এবং ৪টি অপশন সঠিকভাবে পূরণ করুন।', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: formData.subject,
        chapter: formData.chapter,
        difficulty: formData.difficulty,
        yearTag: formData.yearTag,
        question: formData.question,
        optionA: formData.optionA,
        optionB: formData.optionB,
        optionC: formData.optionC,
        optionD: formData.optionD,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation
      };

      const url = isEditing
        ? `${BACKEND_URL}/api/questions/${formData.id}`
        : `${BACKEND_URL}/api/questions`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        showToast(
          isEditing ? 'প্রশ্ন সফলভাবে আপডেট করা হয়েছে!' : 'নতুন প্রশ্ন সফলভাবে তৈরি ও সংরক্ষণ করা হয়েছে!',
          'success'
        );
        setIsModalOpen(false);
        fetchQuestions();
      } else {
        showToast(result.error || 'প্রশ্ন সংরক্ষণ ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err) {
      console.error('Error saving question:', err);
      showToast('সার্ভার এরর: প্রশ্ন সেভ করা যায়নি।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (q) => {
    setQuestionToDelete(q);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions/${questionToDelete.id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        showToast(`প্রশ্ন #${questionToDelete.id} সফলভাবে ডিলিট করা হয়েছে!`, 'success');
        setIsDeleteModalOpen(false);
        setQuestionToDelete(null);
        fetchQuestions();
      } else {
        showToast(result.error || 'ডিলিট করতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      showToast('সার্ভার সংযোগে ব্যর্থতা।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Solution
  const toggleSolution = (id) => {
    setExpandedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Export CSV
  const handleExportCSV = () => {
    if (questions.length === 0) {
      showToast('এক্সপোর্ট করার জন্য কোনো প্রশ্ন নেই।', 'error');
      return;
    }
    const headers = ['ID', 'Subject', 'Chapter', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation', 'Difficulty', 'Year Tag'];
    const rows = questions.map(q => [
      q.id,
      `"${(q.subject || '').replace(/"/g, '""')}"`,
      `"${(q.chapter || '').replace(/"/g, '""')}"`,
      `"${(q.question || '').replace(/"/g, '""')}"`,
      `"${(q.optionA || '').replace(/"/g, '""')}"`,
      `"${(q.optionB || '').replace(/"/g, '""')}"`,
      `"${(q.optionC || '').replace(/"/g, '""')}"`,
      `"${(q.optionD || '').replace(/"/g, '""')}"`,
      `"${(q.correctAnswer || '').replace(/"/g, '""')}"`,
      `"${(q.explanation || '').replace(/"/g, '""')}"`,
      q.difficulty || 'medium',
      `"${(q.yearTag || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduFast_Question_Bank_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('প্রশ্ন ব্যাংকের CSV সফলভাবে ডাউনলোড হয়েছে!', 'success');
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = questions.length;
    const easy = questions.filter(q => (q.difficulty || '').toLowerCase() === 'easy').length;
    const medium = questions.filter(q => (q.difficulty || '').toLowerCase() === 'medium').length;
    const hard = questions.filter(q => (q.difficulty || '').toLowerCase() === 'hard').length;
    const subjectsCount = new Set(questions.map(q => q.subject)).size;
    return { total, easy, medium, hard, subjectsCount };
  }, [questions]);

  // Helper for option checking
  const isOptionCorrect = (q, optionKey, optionValue) => {
    const ans = (q.correctAnswer || '').trim().toUpperCase();
    return ans === optionKey || ans === (optionValue || '').trim().toUpperCase();
  };

  return (
    <div style={{ color: '#f8fafc', animation: 'fadeIn 0.2s ease-in' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backdropFilter: 'blur(8px)'
        }}>
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP STATS & HEADER */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📑</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Question Bank Creator & Manager
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  {roleTitle}
                </span>
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                সম্পূর্ণ এমসিকিউ প্রশ্ন তৈরি, এডিট, অপশন ও সমাধান ম্যানেজ করার ইন্টারেক্টিভ সিস্টেম।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          >
            <span>📥</span> Export CSV
          </button>

          <button
            onClick={fetchQuestions}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          >
            <span>🔄</span> Refresh
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '1.1rem' }}>➕</span> নতুন প্রশ্ন তৈরি করুন
          </button>
        </div>
      </div>

      {/* QUICK METRICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>মোট প্রশ্ন (Total)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>{metrics.total} টি</div>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>বিষয় সংখ্যা (Subjects)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>{metrics.subjectsCount} টি</div>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>সহজ (Easy)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{metrics.easy}</div>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>মাঝারি (Medium)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>{metrics.medium}</div>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>কঠিন (Hard)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem' }}>{metrics.hard}</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {/* Search Bar + Difficulty */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="প্রশ্ন, অধ্যায় বা বিশ্ববিদ্যালয়ের নাম লিখে খুঁজুন..."
                style={{
                  width: '100%',
                  background: 'rgba(11, 15, 25, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.6rem 1rem 0.6rem 2.4rem',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1.1rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>

          {/* Difficulty Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>লেভেল:</span>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              style={{
                background: 'rgba(11, 15, 25, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Levels (সব)</option>
              <option value="easy">🟢 Easy (সহজ)</option>
              <option value="medium">🟡 Medium (মাঝারি)</option>
              <option value="hard">🔴 Hard (কঠিন)</option>
            </select>
          </div>
        </div>

        {/* Subject Pills Filter */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'thin' }}>
          <button
            onClick={() => setSelectedSubject('All')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: selectedSubject === 'All' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: selectedSubject === 'All' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedSubject === 'All' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            📚 All Subjects
          </button>

          {SUBJECT_OPTIONS.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                border: selectedSubject === sub.id ? `1px solid ${sub.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedSubject === sub.id ? sub.bg : 'rgba(255, 255, 255, 0.03)',
                color: selectedSubject === sub.id ? sub.color : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s'
              }}
            >
              <span>{sub.icon}</span>
              <span>{sub.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION CARDS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 1s infinite linear' }}>🔄</div>
          <p>প্রশ্ন ডাটা লোড হচ্ছে...</p>
        </div>
      ) : questions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          background: 'rgba(17, 24, 39, 0.4)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: '16px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>কোনো প্রশ্ন পাওয়া যায়নি</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            আপনার সিলেক্ট করা ফিল্টারে কোনো প্রশ্ন নেই। নতুন প্রশ্ন তৈরি করতে নিচের বাটনে ক্লিক করুন।
          </p>
          <button
            onClick={handleOpenCreate}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.2rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ➕ নতুন প্রশ্ন যোগ করুন
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => {
            const subjectMeta = SUBJECT_OPTIONS.find(s => s.id.toLowerCase() === (q.subject || '').toLowerCase()) || {
              icon: '📝',
              color: '#38bdf8',
              bg: 'rgba(56, 189, 248, 0.15)'
            };

            const diffColor = q.difficulty === 'easy' ? '#10b981' : q.difficulty === 'hard' ? '#ef4444' : '#f59e0b';
            const isSolExpanded = !!expandedSolutions[q.id];

            return (
              <div
                key={q.id}
                style={{
                  background: 'rgba(17, 24, 39, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'border-color 0.2s, transform 0.2s'
                }}
              >
                {/* Header row: Subject, Chapter, Difficulty, Year, and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.07)',
                      color: '#cbd5e1'
                    }}>
                      #{q.id}
                    </span>

                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: subjectMeta.bg,
                      color: subjectMeta.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <span>{subjectMeta.icon}</span>
                      <span>{q.subject}</span>
                    </span>

                    {q.chapter && (
                      <span style={{
                        fontSize: '0.78rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        📖 {q.chapter}
                      </span>
                    )}

                    {q.yearTag && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(234, 179, 8, 0.12)',
                        color: '#facc15',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        fontWeight: 600
                      }}>
                        🏛️ {q.yearTag}
                      </span>
                    )}

                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: `rgba(${diffColor === '#10b981' ? '16, 185, 129' : diffColor === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.15)`,
                      color: diffColor,
                      textTransform: 'capitalize',
                      fontWeight: 600
                    }}>
                      ● {q.difficulty || 'Medium'}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                    >
                      <span>✏️</span> Edit
                    </button>

                    <button
                      onClick={() => handleOpenDelete(q)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {q.question}
                </div>

                {/* 4 Options Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.65rem',
                  marginBottom: '1rem'
                }}>
                  {[
                    { key: 'A', text: q.optionA },
                    { key: 'B', text: q.optionB },
                    { key: 'C', text: q.optionC },
                    { key: 'D', text: q.optionD }
                  ].map(opt => {
                    const isCorrect = isOptionCorrect(q, opt.key, opt.text);
                    return (
                      <div
                        key={opt.key}
                        style={{
                          background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(11, 15, 25, 0.6)',
                          border: isCorrect ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.6rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                            color: isCorrect ? '#ffffff' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {opt.key}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: isCorrect ? '#34d399' : '#e2e8f0', fontWeight: isCorrect ? 700 : 500 }}>
                            {opt.text}
                          </span>
                        </div>

                        {isCorrect && (
                          <span style={{
                            fontSize: '0.7rem',
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation & Solution Accordion */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => toggleSolution(q.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: 0
                    }}
                  >
                    <span>{isSolExpanded ? '🔼' : '💡'}</span>
                    <span>{isSolExpanded ? 'সমাধান লুকান' : 'বিস্তারিত সমাধান ও ব্যাখ্যা দেখুন'}</span>
                  </button>

                  {isSolExpanded && (
                    <div style={{
                      marginTop: '0.65rem',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      color: '#e0f2fe',
                      fontSize: '0.85rem',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem' }}>
                        📌 সমাধান ও শর্টকাট নোট:
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {q.explanation || 'এই প্রশ্নের জন্য কোনো অতিরিক্ত ব্যাখ্যা যুক্ত করা হয়নি।'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT QUESTION MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                  {isEditing ? `✏️ প্রশ্ন এডিট করুন (#${formData.id})` : '➕ নতুন MCQ প্রশ্ন তৈরি করুন'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  সঠিক বিষয়, অধ্যায়, ৪টি অপশন এবং সঠিক উত্তর সিলেক্ট করে প্রশ্নটি সেভ করুন।
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitQuestion}>
              {/* Row 1: Subject & Chapter */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    বিষয় (Subject) *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    required
                  >
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    অধ্যায় বা টপিক (Chapter / Topic)
                  </label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="যেমন: গতির সমীকরণ, গুণগত রসায়ন"
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Difficulty & Year/Varsity Tag */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    কঠিনতার মাত্রা (Difficulty Level)
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  >
                    <option value="easy">🟢 Easy (সহজ)</option>
                    <option value="medium">🟡 Medium (মাঝারি)</option>
                    <option value="hard">🔴 Hard (কঠিন)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                    পরীক্ষা বা বিশ্ববিদ্যালয়ের ট্যাগ (Year / Tag)
                  </label>
                  <input
                    type="text"
                    value={formData.yearTag}
                    onChange={e => setFormData({ ...formData, yearTag: e.target.value })}
                    placeholder="যেমন: BUET 2023, DU Ka 2022, Medical 2024"
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Question Text */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                  মূল প্রশ্ন (Question Statement) *
                </label>
                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="এখানে সম্পূর্ণ প্রশ্নটি লিখুন..."
                  style={{
                    width: '100%',
                    background: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* Row 4: 4 Options */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 600 }}>
                  ৪টি অপশন (Option A, B, C, D) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { key: 'A', field: 'optionA', placeholder: 'অপশন A এর মান' },
                    { key: 'B', field: 'optionB', placeholder: 'অপশন B এর মান' },
                    { key: 'C', field: 'optionC', placeholder: 'অপশন C এর মান' },
                    { key: 'D', field: 'optionD', placeholder: 'অপশন D এর মান' }
                  ].map(opt => (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: formData.correctAnswer === opt.key ? '#10b981' : 'rgba(255,255,255,0.08)',
                        color: formData.correctAnswer === opt.key ? '#fff' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {opt.key}
                      </span>
                      <input
                        type="text"
                        value={formData[opt.field]}
                        onChange={e => setFormData({ ...formData, [opt.field]: e.target.value })}
                        placeholder={opt.placeholder}
                        style={{
                          width: '100%',
                          background: '#0b0f19',
                          border: formData.correctAnswer === opt.key ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Correct Answer Selector */}
              <div style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#34d399', marginBottom: '0.45rem', fontWeight: 700 }}>
                  ✓ সঠিক উত্তর নির্ধারণ করুন (Select Correct Answer) *
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['A', 'B', 'C', 'D'].map(letter => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setFormData({ ...formData, correctAnswer: letter })}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        borderRadius: '8px',
                        border: formData.correctAnswer === letter ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: formData.correctAnswer === letter ? '#10b981' : 'rgba(11, 15, 25, 0.6)',
                        color: formData.correctAnswer === letter ? '#ffffff' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      Option {letter} {formData.correctAnswer === letter && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 6: Explanation */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                  বিস্তারিত সমাধান ও ব্যাখ্যা (Explanation & Solution Steps)
                </label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="ধাপ অনুযায়ী ব্যাখ্যা, সূত্র বা শর্টকাট ট্রিকস এখানে লিখুন..."
                  style={{
                    width: '100%',
                    background: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.88rem',
                    outline: 'none',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  বাতিল (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : isEditing ? 'আপডেট করুন (Update Question)' : 'সংরক্ষণ করুন (Save Question)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && questionToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#ef4444', fontSize: '1.15rem' }}>
              ⚠️ প্রশ্ন ডিলিট করতে চান?
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              আপনি কি নিশ্চিত যে প্রশ্ন <strong>#{questionToDelete.id} ({questionToDelete.subject})</strong> ডিলিট করতে চান? এই প্রক্রিয়াটি ফিরিয়ে আনা যাবে না।
            </p>
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.82rem',
              color: '#fca5a5',
              marginBottom: '1.25rem'
            }}>
              "{questionToDelete.question}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                {submitting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
