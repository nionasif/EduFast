import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMockTests,
  recordStudentMockTestResult,
  getStudentMockSubmissions,
  getMockSubmission,
  fetchBackendMockAttempts
} from '../../data/mockData';

// ─── Test List / Selection View ─────────────────────────────────────────────
function TestSelectionView({ user, onStartTest, submissions = {} }) {
  const [tests, setTests] = useState(() => getMockTests());

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

  const studentGroup = (user?.group || '').trim();
  const groupTests = tests.filter(t => {
    if (!studentGroup) return true;
    return t.group && t.group.toLowerCase() === studentGroup.toLowerCase();
  });

  const groupColors = {
    Science: { bg: '#ebf8ff', color: '#2b6cb0', border: '#bee3f8' },
    Commerce: { bg: '#fefcbf', color: '#744210', border: '#faf089' },
    Arts: { bg: '#fff5f5', color: '#742a2a', border: '#fed7d7' },
  };

  function TestCard({ test, isRecommended }) {
    const gc = groupColors[test.group] || groupColors['Arts'];
    const isAttempted = Boolean(submissions && submissions[test.id]);

    return (
      <div className="mock-test-card" style={{
        background: 'var(--white)',
        border: `1px solid var(--gray-200)`,
        borderRadius: 'var(--border-radius-md)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {/* Accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary-teal), var(--cta-orange))' }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem', color: 'var(--text-charcoal)' }}>{test.title}</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', margin: 0 }}>{test.subject}</p>
          </div>
          <span style={{ fontSize: '0.7rem', background: gc.bg, color: gc.color, border: `1px solid ${gc.border}`, borderRadius: '20px', padding: '0.2rem 0.6rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
            {test.group}
          </span>
        </div>

        {/* Badge & Mentor Creator & Attempted Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{test.badge}</div>
          {test.mentorName && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.1rem 0.5rem' }}>
              👨‍🏫 {test.mentorName}
            </span>
          )}
          {isAttempted && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.1rem 0.5rem' }}>
              ✓ Attempted (সম্পন্ন)
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.4rem 0.75rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-teal)' }}>⏱ {test.duration}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>Minutes</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.4rem 0.75rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>📝 {test.questions.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>Questions</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.4rem 0.75rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cta-orange)' }}>🏆 {test.totalMarks}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>Total Marks</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.4rem 0.75rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e53e3e' }}>{test.negativeMarking}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>Negative</div>
          </div>
        </div>

        {/* Exam target */}
        <p style={{ fontSize: '0.78rem', color: 'var(--gray-600)', margin: 0 }}>
          🎯 Targets: <strong>{test.examTarget}</strong>
        </p>

        <button
          className={`btn ${isAttempted ? 'btn-secondary' : 'btn-teal'}`}
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
          onClick={() => onStartTest(test)}
        >
          {isAttempted ? '📋 View Result / Solutions' : isRecommended ? '⚡ Start Recommended Test' : '▶ Start Test'}
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
          📝 Mock <span style={{ color: 'var(--primary-teal)' }}>Test Center</span>
        </h1>
        <p style={{ color: 'var(--gray-600)', margin: 0 }}>
          Practice with timed MCQ tests designed to simulate real university admission exams.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'linear-gradient(135deg, #e6fffa 0%, #ebf8ff 100%)',
        border: '1px solid #b2f5ea',
        borderRadius: 'var(--border-radius-md)',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>⏱</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-teal)' }}>Timed Tests</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-600)' }}>Auto-submit on timeout</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>➖</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e53e3e' }}>Negative Marking</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-600)' }}>-0.25 per wrong answer</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📊</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-charcoal)' }}>Detailed Results</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-600)' }}>With explanations for each Q</div>
          </div>
        </div>
      </div>

      {/* Student's Group Specific Mock Tests */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--primary-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>⭐ {studentGroup ? `${studentGroup} Group Admission Mock Tests` : 'Admission Mock Tests'}</span>
            <span style={{ fontSize: '0.72rem', background: '#e6fffa', color: '#276749', border: '1px solid #b2f5ea', borderRadius: '20px', padding: '0.2rem 0.65rem', fontWeight: 700 }}>
              {groupTests.length} Tests Available
            </span>
          </h3>
        </div>

        {groupTests.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {groupTests.map(t => <TestCard key={t.id} test={t} isRecommended={true} />)}
          </div>
        ) : (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
            <h4 style={{ color: 'var(--text-charcoal)', marginBottom: '0.25rem' }}>কোনো মক টেস্ট পাওয়া যায়নি</h4>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', margin: 0 }}>
              {studentGroup} গ্রুপের জন্য নতুন টেস্ট মেন্টররা যুক্ত করার সাথে সাথে এখানে প্রদর্শিত হবে।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveTestView({ test, user, onFinish }) {
  const totalSeconds = test.duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: optionIndex }
  const [flagged, setFlagged] = useState({}); // { qId: boolean }
  const [submitted, setSubmitted] = useState(false);
  const [navFilter, setNavFilter] = useState('all'); // 'all' | 'unanswered' | 'flagged' | 'answered'
  const timerRef = useRef(null);

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    setSubmitted(true);
  }, []);

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isWarning = timeLeft <= 120; // last 2 minutes
  const isCritical = timeLeft <= 30;

  const q = test.questions[currentQ];
  const answered = Object.keys(answers).length;
  const totalQ = test.questions.length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = totalQ - answered;
  const progressPercent = Math.round((answered / totalQ) * 100);

  const jumpToNextUnanswered = () => {
    for (let i = currentQ + 1; i < totalQ; i++) {
      if (answers[test.questions[i].id] === undefined) {
        setCurrentQ(i);
        return;
      }
    }
  };

  const selectAnswer = (optIdx) => {
    if (submitted) return;
    // Lock: Once answered, cannot be modified
    if (answers[q.id] !== undefined) return;

    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));

    // Auto-advance to the next question automatically after 400ms without clicking Next
    setTimeout(() => {
      setCurrentQ(curr => {
        if (curr < totalQ - 1) {
          return curr + 1;
        }
        return curr;
      });
    }, 400);
  };

  const toggleFlag = (qId) => {
    setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (submitted) {
    return <ResultView test={test} user={user} answers={answers} totalSeconds={totalSeconds} timeUsed={totalSeconds - timeLeft} onFinish={onFinish} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', padding: '0' }}>
      {/* Sticky Top Bar */}
      <div style={{
        background: 'var(--white)',
        borderBottom: `3px solid ${isCritical ? '#e53e3e' : isWarning ? 'var(--cta-orange)' : 'var(--primary-teal)'}`,
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-charcoal)' }}>{test.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{answered}/{totalQ} answered</div>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: isCritical ? '#fff5f5' : isWarning ? '#fffaf0' : '#e6fffa',
          border: `2px solid ${isCritical ? '#fc8181' : isWarning ? 'var(--cta-orange)' : 'var(--primary-teal)'}`,
          borderRadius: 'var(--border-radius-sm)',
          padding: '0.4rem 1rem',
          animation: isCritical ? 'pulse 1s infinite' : 'none',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{isCritical ? '🚨' : isWarning ? '⚠️' : '⏱'}</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'monospace', color: isCritical ? '#e53e3e' : isWarning ? '#c05621' : 'var(--primary-teal)' }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button
          className="btn btn-secondary"
          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', color: '#e53e3e', borderColor: '#e53e3e' }}
          onClick={() => {
            if (window.confirm('Are you sure you want to submit the test now?')) handleSubmit();
          }}
        >
          Submit Test
        </button>
      </div>

      <div className="active-test-layout" style={{ display: 'flex', maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', gap: '1.5rem' }}>

        {/* Question Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--border-radius-md)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-teal)', background: '#e6fffa', borderRadius: '20px', padding: '0.25rem 0.75rem' }}>
                Question {currentQ + 1} of {totalQ}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                +{(test.totalMarks / totalQ).toFixed(1)} correct | {test.negativeMarking} wrong
              </span>
            </div>

            <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.6, color: 'var(--text-charcoal)', marginBottom: '1.5rem' }}>
              {q.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === idx;
                const isAlreadyAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={isAlreadyAnswered}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--border-radius-sm)',
                      border: `2px solid ${isSelected ? 'var(--primary-teal)' : 'var(--gray-200)'}`,
                      background: isSelected ? '#e6fffa' : 'var(--bg-light)',
                      cursor: isAlreadyAnswered ? 'default' : 'pointer',
                      textAlign: 'left',
                      fontSize: '0.95rem',
                      color: 'var(--text-charcoal)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s ease',
                      opacity: isAlreadyAnswered && !isSelected ? 0.6 : 1
                    }}
                    onMouseEnter={e => { if (!isSelected && !isAlreadyAnswered) { e.currentTarget.style.borderColor = 'var(--gray-400)'; e.currentTarget.style.background = 'var(--white)'; } }}
                    onMouseLeave={e => { if (!isSelected && !isAlreadyAnswered) { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--bg-light)'; } }}
                  >
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--primary-teal)' : 'var(--white)',
                      border: `2px solid ${isSelected ? 'var(--primary-teal)' : 'var(--gray-300)'}`,
                      color: isSelected ? 'white' : 'var(--gray-500)',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.25rem', opacity: 0.5, cursor: 'not-allowed' }}
              disabled={true}
              title="একবার পরবর্তী প্রশ্নে চলে গেলে পূর্ববর্তী প্রশ্নে ফিরে আসা যাবে না"
            >
              🔒 Previous
            </button>
            
            {/* Flag button */}
            <button
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.25rem', borderColor: flagged[q.id] ? '#f6ad55' : 'var(--gray-300)', color: flagged[q.id] ? '#7b341e' : 'var(--gray-600)', backgroundColor: flagged[q.id] ? '#feebc8' : 'transparent' }}
              onClick={() => toggleFlag(q.id)}
            >
              🚩 {flagged[q.id] ? 'Flagged' : 'Flag for Review'}
            </button>

            {currentQ < totalQ - 1 ? (
              <button
                className="btn btn-teal"
                style={{ padding: '0.6rem 1.25rem' }}
                onClick={() => setCurrentQ(q => q + 1)}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn btn-teal"
                style={{ padding: '0.6rem 1.25rem', background: 'var(--cta-orange)', border: 'none' }}
                onClick={() => { if (window.confirm('Submit the test now?')) handleSubmit(); }}
              >
                🏁 Submit Test
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="test-navigator-sidebar">
          <div className="q-nav-card">
            {/* Header */}
            <div className="q-nav-header">
              <div className="q-nav-title-box">
                <div className="q-nav-title-row">
                  <span className="q-nav-icon">🧭</span>
                  <div>
                    <h4 className="q-nav-title">Question Navigator</h4>
                    <span className="q-nav-subtitle">প্রশ্ন নির্দেশক ও স্ট্যাটাস</span>
                  </div>
                </div>
                <span className="q-nav-progress-badge">
                  {progressPercent}% সম্পন্ন
                </span>
              </div>

              {/* Progress Bar */}
              <div className="q-nav-progress-track">
                <div 
                  className="q-nav-progress-fill" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>

            {/* Status Filter Tabs / Counter Chips */}
            <div className="q-nav-tabs">
              <button
                type="button"
                className={`q-nav-tab ${navFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNavFilter('all')}
                title="সব প্রশ্ন দেখুন"
              >
                <span>সব</span>
                <span className="tab-counter">{totalQ}</span>
              </button>
              <button
                type="button"
                className={`q-nav-tab answered-tab ${navFilter === 'answered' ? 'active' : ''}`}
                onClick={() => setNavFilter('answered')}
                title="শুধু উত্তর দেওয়া প্রশ্ন দেখুন"
              >
                <span>উত্তর</span>
                <span className="tab-counter">{answered}</span>
              </button>
              <button
                type="button"
                className={`q-nav-tab flagged-tab ${navFilter === 'flagged' ? 'active' : ''}`}
                onClick={() => setNavFilter('flagged')}
                title="রিভিউ ফ্ল্যাগ করা প্রশ্ন দেখুন"
              >
                <span>ফ্ল্যাগ</span>
                <span className="tab-counter">{flaggedCount}</span>
              </button>
              <button
                type="button"
                className={`q-nav-tab unanswered-tab ${navFilter === 'unanswered' ? 'active' : ''}`}
                onClick={() => setNavFilter('unanswered')}
                title="শুধু বাকি প্রশ্নগুলো দেখুন"
              >
                <span>বাকি</span>
                <span className="tab-counter">{unansweredCount}</span>
              </button>
            </div>

            {/* Quick Jump to Next Unanswered */}
            {unansweredCount > 0 && (
              <button
                type="button"
                className="q-nav-jump-btn"
                onClick={jumpToNextUnanswered}
                title="পরবর্তী বাকি প্রশ্নে সরাসরি যান"
              >
                <span>পরবর্তী বাকি প্রশ্ন</span>
                <span className="jump-arrow">⏩</span>
              </button>
            )}

            {/* Scrollable grid container for questions */}
            <div className="q-nav-grid-container">
              {test.questions.map((tq, idx) => {
                const isAns = answers[tq.id] !== undefined;
                const isCurr = idx === currentQ;
                const isFlagged = flagged[tq.id];

                // Filter condition
                if (navFilter === 'answered' && !isAns) return null;
                if (navFilter === 'unanswered' && isAns) return null;
                if (navFilter === 'flagged' && !isFlagged) return null;

                let stateClass = 'is-unattempted';
                if (isCurr) {
                  stateClass = 'is-current';
                } else if (isFlagged && isAns) {
                  stateClass = 'is-flagged is-answered';
                } else if (isFlagged) {
                  stateClass = 'is-flagged';
                } else if (isAns) {
                  stateClass = 'is-answered';
                }

                const isLockedPast = idx < currentQ || (isAns && !isCurr);

                return (
                  <button
                    key={tq.id || idx}
                    type="button"
                    onClick={() => {
                      if (isLockedPast) return;
                      setCurrentQ(idx);
                    }}
                    disabled={isLockedPast}
                    className={`q-nav-btn ${stateClass}`}
                    style={isLockedPast ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                    title={isLockedPast ? `প্রশ্ন ${idx + 1}: পূর্ববর্তী প্রশ্নে ফিরে যাওয়া যাবে না (লকড)` : `প্রশ্ন ${idx + 1}: ${isAns ? 'উত্তর দেওয়া হয়েছে' : 'বাকি'} ${isFlagged ? '(ফ্ল্যাগ করা)' : ''}`}
                  >
                    <span className="q-num">{idx + 1}</span>
                    {isFlagged && <span className="flag-dot" title="ফ্ল্যাগড">🚩</span>}
                  </button>
                );
              })}
            </div>

            {/* Empty filter message */}
            {navFilter === 'flagged' && flaggedCount === 0 && (
              <div className="q-nav-empty-state">
                <span>🚩</span> কোনো প্রশ্ন ফ্ল্যাগ করা নেই
              </div>
            )}
            {navFilter === 'unanswered' && unansweredCount === 0 && (
              <div className="q-nav-empty-state success">
                <span>🎉</span> অসাধারণ! সব প্রশ্নের উত্তর দেওয়া শেষ
              </div>
            )}

            {/* Status Legend */}
            <div className="q-nav-legend">
              <div className="legend-item">
                <span className="legend-dot current-dot" />
                <span>বর্তমান প্রশ্ন</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot answered-dot" />
                <span>উত্তর দেওয়া ({answered})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot flagged-dot" />
                <span>ফ্ল্যাগড ({flaggedCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot pending-dot" />
                <span>বাকি আছে ({unansweredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        /* Question Navigator Premium Styles */
        .test-navigator-sidebar {
          width: 290px;
          flex-shrink: 0;
        }
        .q-nav-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 1.25rem;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
          position: sticky;
          top: 85px;
          transition: all 0.2s ease;
        }
        .q-nav-header {
          margin-bottom: 0.85rem;
        }
        .q-nav-title-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.65rem;
        }
        .q-nav-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .q-nav-icon {
          font-size: 1.15rem;
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .q-nav-title {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .q-nav-subtitle {
          font-size: 0.7rem;
          font-weight: 500;
          color: #64748b;
        }
        .q-nav-progress-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          background: #f0fdfa;
          padding: 0.2rem 0.55rem;
          border-radius: 20px;
          border: 1px solid #ccfbf1;
          white-space: nowrap;
        }
        .q-nav-progress-track {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
        }
        .q-nav-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d9488 0%, #10b981 100%);
          border-radius: 10px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Filter Tabs */
        .q-nav-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          background: #f8fafc;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          margin-bottom: 0.75rem;
        }
        .q-nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5px 2px;
          border-radius: 7px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.68rem;
          font-weight: 600;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .q-nav-tab .tab-counter {
          font-size: 0.75rem;
          font-weight: 800;
          margin-top: 1px;
        }
        .q-nav-tab:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .q-nav-tab.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        .q-nav-tab.answered-tab.active .tab-counter { color: #10b981; }
        .q-nav-tab.flagged-tab.active .tab-counter { color: #f59e0b; }
        .q-nav-tab.unanswered-tab.active .tab-counter { color: #64748b; }

        /* Quick Jump Button */
        .q-nav-jump-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: #f0fdfa;
          border: 1.5px dashed #99f6e4;
          border-radius: 10px;
          color: #0f766e;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }
        .q-nav-jump-btn:hover {
          background: #ccfbf1;
          border-color: #0d9488;
          transform: translateY(-1px);
        }
        .q-nav-jump-btn .jump-arrow {
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }
        .q-nav-jump-btn:hover .jump-arrow {
          transform: translateX(3px);
        }

        /* Question Grid Container */
        .q-nav-grid-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          max-height: 270px;
          overflow-y: auto;
          padding: 2px 4px 2px 2px;
          margin-bottom: 0.85rem;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        .q-nav-grid-container::-webkit-scrollbar {
          width: 5px;
        }
        .q-nav-grid-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }

        /* Question Box Button */
        .q-nav-btn {
          height: 38px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .q-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        .q-nav-btn:active {
          transform: scale(0.95);
        }

        /* States */
        .q-nav-btn.is-unattempted {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #64748b;
        }
        .q-nav-btn.is-unattempted:hover {
          border-color: #94a3b8;
          color: #334155;
          background: #f1f5f9;
        }

        .q-nav-btn.is-answered {
          background: #ecfdf5;
          border: 2px solid #10b981;
          color: #047857;
        }
        .q-nav-btn.is-answered:hover {
          background: #d1fae5;
        }

        .q-nav-btn.is-flagged {
          background: #fffbeb;
          border: 2px solid #f59e0b;
          color: #b45309;
        }
        .q-nav-btn.is-flagged.is-answered {
          background: #ecfdf5;
          border: 2px solid #f59e0b;
          color: #047857;
        }
        .q-nav-btn .flag-dot {
          position: absolute;
          top: -4px;
          right: -3px;
          font-size: 0.62rem;
          line-height: 1;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
        }

        .q-nav-btn.is-current {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%) !important;
          border: 2px solid #0d9488 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.35), 0 4px 10px rgba(13, 148, 136, 0.25) !important;
          transform: scale(1.06);
          z-index: 2;
        }

        /* Empty Filter States */
        .q-nav-empty-state {
          text-align: center;
          padding: 1.25rem 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
          margin-bottom: 0.85rem;
        }
        .q-nav-empty-state.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
        }

        /* Legend */
        .q-nav-legend {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 500;
          color: #475569;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .legend-dot.current-dot {
          background: #0d9488;
          box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25);
        }
        .legend-dot.answered-dot {
          background: #10b981;
        }
        .legend-dot.flagged-dot {
          background: #f59e0b;
        }
        .legend-dot.pending-dot {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }

        /* Tablet & Mobile Responsiveness */
        @media (max-width: 992px) {
          .test-navigator-sidebar {
            width: 100% !important;
          }
          .q-nav-card {
            position: static !important;
            margin-top: 1rem;
          }
          .q-nav-grid-container {
            grid-template-columns: repeat(10, 1fr) !important;
            max-height: 200px;
          }
        }
        @media (max-width: 600px) {
          .q-nav-grid-container {
            grid-template-columns: repeat(6, 1fr) !important;
          }
          .q-nav-tabs {
            font-size: 0.62rem;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Already Attempted Alert View ──────────────────────────────────────────
function AlreadyAttemptedView({ test, submission, onViewResult, onViewSolutions, onBack }) {
  return (
    <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '650px', textAlign: 'center' }}>
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--border-radius-lg, 16px)',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>
          ⚠️
        </div>
        
        <h2 style={{
          fontSize: '1.55rem',
          fontWeight: 800,
          color: 'var(--text-charcoal)',
          marginBottom: '0.5rem'
        }}>
          You have already attempted this mock test.
        </h2>

        <p style={{
          fontSize: '0.92rem',
          color: 'var(--gray-600)',
          marginBottom: '1.75rem',
          lineHeight: 1.5
        }}>
          <strong>{test.title}</strong><br />
          Each mock test can be attempted only once. You can review your previous score and check the correct solutions with explanations.
        </p>

        {submission && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            background: 'var(--bg-light)',
            borderRadius: 'var(--border-radius-md)',
            padding: '1rem 1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-teal)' }}>
                {submission.score !== undefined ? Number(submission.score).toFixed(1) : '0'} / {submission.totalMarks || test.totalMarks}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Score</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--gray-300)' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cta-orange)' }}>
                {submission.percentage !== undefined ? submission.percentage : '0'}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Accuracy</div>
            </div>
            {submission.timeUsed !== undefined && submission.timeUsed > 0 && (
              <>
                <div style={{ borderLeft: '1px solid var(--gray-300)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                    {Math.floor(submission.timeUsed / 60)}m {submission.timeUsed % 60}s
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Time Used</div>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-teal"
            style={{ padding: '0.75rem 1.6rem', fontSize: '0.92rem', fontWeight: 700 }}
            onClick={onViewResult}
          >
            📊 View Result
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.6rem', fontSize: '0.92rem', fontWeight: 700 }}
            onClick={onViewSolutions}
          >
            💡 View Solutions
          </button>
        </div>

        <div style={{ marginTop: '1.75rem' }}>
          <button
            type="button"
            className="btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gray-600)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={onBack}
          >
            ← Back to Test List
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Result View ──────────────────────────────────────────────────────────────
function ResultView({
  test,
  user,
  answers = {},
  totalSeconds = 0,
  timeUsed = 0,
  onFinish,
  isReviewOnly = false,
  initialTab = 'result'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'result'); // 'result' | 'solutions'
  const [showExplanation, setShowExplanation] = useState(null);

  const perQMark = test.totalMarks / test.questions.length;
  let correct = 0, wrong = 0, unattempted = 0;

  test.questions.forEach(q => {
    if (answers[q.id] === undefined) {
      unattempted++;
    } else if (answers[q.id] === q.correct) {
      correct++;
    } else {
      wrong++;
    }
  });

  const raw = correct * perQMark + wrong * test.negativeMarking;
  const score = Math.max(0, raw);
  const percentage = ((score / test.totalMarks) * 100).toFixed(1);
  const timeUsedMins = Math.floor(timeUsed / 60);
  const timeUsedSecs = timeUsed % 60;

  // Record test result to student's history once (only if not viewing an existing attempt)
  useEffect(() => {
    if (!isReviewOnly) {
      recordStudentMockTestResult(user, {
        testId: test.id,
        score: Number(score.toFixed(2)),
        totalMarks: test.totalMarks,
        percentage: Number(percentage),
        answers,
        timeUsed
      });
    }
  }, []);

  const getGrade = () => {
    if (percentage >= 85) return { label: 'Excellent! 🏆', color: '#276749', bg: '#c6f6d5' };
    if (percentage >= 70) return { label: 'Good Job! 🎯', color: '#2b6cb0', bg: '#bee3f8' };
    if (percentage >= 50) return { label: 'Average 📚', color: '#744210', bg: '#fefcbf' };
    return { label: 'Needs Improvement 💪', color: '#742a2a', bg: '#fed7d7' };
  };
  const grade = getGrade();

  // SVG circular gauge properties
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>

      {/* View Switcher Tabs: View Result vs View Solutions */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
        background: 'var(--white)',
        padding: '0.4rem',
        borderRadius: '12px',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            padding: '0.7rem 1.5rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'result' ? 'var(--primary-teal)' : 'transparent',
            color: activeTab === 'result' ? '#ffffff' : 'var(--gray-600)'
          }}
          onClick={() => setActiveTab('result')}
        >
          📊 View Result
        </button>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            padding: '0.7rem 1.5rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'solutions' ? 'var(--primary-teal)' : 'transparent',
            color: activeTab === 'solutions' ? '#ffffff' : 'var(--gray-600)'
          }}
          onClick={() => setActiveTab('solutions')}
        >
          💡 View Solutions
        </button>
      </div>

      {activeTab === 'result' && (
        <>
          {/* Result Banner with SVG Gauge */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
            background: 'linear-gradient(135deg, var(--primary-teal) 0%, #2c7a7b 100%)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '2.5rem 3rem',
            color: 'white',
            textAlign: 'center',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '8rem', opacity: 0.07 }}>📝</div>
            
            {/* SVG Radial Accuracy Progress Bar */}
            <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg height="150" width="150" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  stroke="rgba(255, 255, 255, 0.15)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx="75"
                  cy="75"
                />
                <circle
                  stroke="#ffffff"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx="75"
                  cy="75"
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800 }}>{percentage}%</span>
                <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>Accuracy</span>
              </div>
            </div>

            <div style={{ textAlign: 'left', flex: 1, minWidth: '220px' }}>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontWeight: 600, display: 'inline-block', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
                🎓 EXAM COMPLETED SUMMARY
              </span>
              <h2 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{test.title}</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                You scored <strong>{score.toFixed(1)}</strong> out of {test.totalMarks} points.<br />
                Time used: <strong>{timeUsedMins}m {timeUsedSecs}s</strong> of {test.duration} mins.
              </p>
              <span style={{ background: grade.bg, color: grade.color, borderRadius: '20px', padding: '0.45rem 1.25rem', fontWeight: 700, fontSize: '0.92rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                {grade.label}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: '✅', label: 'Correct', value: correct, color: '#276749', bg: '#c6f6d5' },
              { icon: '❌', label: 'Wrong', value: wrong, color: '#742a2a', bg: '#fed7d7' },
              { icon: '⏭', label: 'Skipped', value: unattempted, color: '#744210', bg: '#fefcbf' },
              { icon: '📊', label: 'Percentage', value: `${percentage}%`, color: '#2b6cb0', bg: '#bee3f8' },
              { icon: '⏱', label: 'Time Used', value: `${timeUsedMins}m ${timeUsedSecs}s`, color: 'var(--gray-600)', bg: 'var(--gray-200)' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--white)', border: `1px solid var(--gray-200)`, borderRadius: 'var(--border-radius-md)', padding: '1.25rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, background: stat.bg, borderRadius: '8px', padding: '0.2rem 0.5rem', display: 'inline-block', marginBottom: '0.3rem' }}>{stat.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Marking breakdown info */}
          <div style={{ background: '#fffaf0', border: '1px solid #faf089', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem 1rem', marginBottom: '2rem', fontSize: '0.8rem', color: '#744210' }}>
            📌 Marking: +{perQMark.toFixed(2)} per correct answer, {test.negativeMarking} per wrong answer. Final score = max(0, raw score).
          </div>

          {/* Prompt to view solutions */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button
              type="button"
              className="btn btn-teal"
              style={{ padding: '0.7rem 1.8rem' }}
              onClick={() => setActiveTab('solutions')}
            >
              💡 View Detailed Solutions & Explanations →
            </button>
          </div>
        </>
      )}

      {activeTab === 'solutions' && (
        <>
          {/* Question Review */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-charcoal)' }}>📋 Question-wise Review & Solutions</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Total {test.questions.length} Questions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {test.questions.map((q, idx) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correct;
              const isSkipped = userAns === undefined;
              const status = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';
              const colors = {
                correct: { border: '#68d391', bg: '#f0fff4', badge: '#c6f6d5', badgeText: '#276749' },
                wrong: { border: '#fc8181', bg: '#fff5f5', badge: '#fed7d7', badgeText: '#742a2a' },
                skipped: { border: 'var(--gray-300)', bg: 'var(--bg-light)', badge: 'var(--gray-200)', badgeText: 'var(--gray-600)' },
              };
              const c = colors[status];

              return (
                <div key={q.id} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 'var(--border-radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-charcoal)', flex: 1 }}>
                      <span style={{ color: 'var(--gray-500)', fontWeight: 400, marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                      {q.question}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: '0.72rem', background: c.badge, color: c.badgeText, borderRadius: '20px', padding: '0.2rem 0.6rem', fontWeight: 700 }}>
                      {status === 'correct' ? '✅ Correct' : status === 'wrong' ? '❌ Wrong' : '⏭ Skipped'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {q.options.map((opt, oi) => {
                      const isUser = userAns === oi;
                      const isAns = q.correct === oi;
                      return (
                        <div key={oi} style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          background: isAns ? '#c6f6d5' : isUser && !isAns ? '#fed7d7' : 'transparent',
                          border: `1px solid ${isAns ? '#68d391' : isUser && !isAns ? '#fc8181' : 'transparent'}`,
                          fontSize: '0.85rem',
                          color: 'var(--text-charcoal)',
                        }}>
                          <span style={{ fontWeight: 700, color: isAns ? '#276749' : isUser && !isAns ? '#742a2a' : 'var(--gray-400)', minWidth: '20px' }}>
                            {isAns ? '✓' : isUser && !isAns ? '✗' : ['A','B','C','D'][oi]}
                          </span>
                          {opt}
                          {isAns && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#276749', fontWeight: 700 }}>Correct Answer</span>}
                          {isUser && !isAns && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#742a2a', fontWeight: 700 }}>Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation toggle */}
                  <button
                    onClick={() => setShowExplanation(prev => prev === idx ? null : idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-teal)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {showExplanation === idx ? '▲ Hide' : '▼ Show'} Explanation
                  </button>
                  {showExplanation === idx && (
                    <div style={{ marginTop: '0.6rem', padding: '0.75rem', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '6px', fontSize: '0.82rem', color: '#2b6cb0', lineHeight: 1.6 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.7rem 1.5rem' }}
          onClick={() => onFinish('list')}
        >
          ← Back to Test List
        </button>
        <button
          className="btn btn-teal"
          style={{ padding: '0.7rem 1.5rem' }}
          onClick={() => onFinish('dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main MockTestPage Export ─────────────────────────────────────────────────
export default function MockTestPage({ user, onNavigate }) {
  const [activeTest, setActiveTest] = useState(null); // null = list view
  const [viewingAttempt, setViewingAttempt] = useState(null); // { test, submission, tab }
  const [blockedAttemptTest, setBlockedAttemptTest] = useState(null); // { test, submission }
  const [submissions, setSubmissions] = useState(() => getStudentMockSubmissions(user));

  useEffect(() => {
    fetchBackendMockAttempts(user).then(latest => {
      if (latest) setSubmissions(latest);
    });

    const handleUpdate = () => {
      setSubmissions(getStudentMockSubmissions(user));
    };
    window.addEventListener('edufast-mock-submissions-update', handleUpdate);
    return () => window.removeEventListener('edufast-mock-submissions-update', handleUpdate);
  }, [user]);

  const handleStartTest = (test) => {
    const existing = getMockSubmission(user, test.id) || (submissions && submissions[test.id]);
    if (existing) {
      // BLOCK RETAKE - Show "You have already attempted this mock test."
      setBlockedAttemptTest({ test, submission: existing });
      setActiveTest(null);
      setViewingAttempt(null);
      return;
    }
    setBlockedAttemptTest(null);
    setViewingAttempt(null);
    setActiveTest(test);
  };

  const handleFinish = (dest) => {
    setActiveTest(null);
    setViewingAttempt(null);
    setBlockedAttemptTest(null);
    setSubmissions(getStudentMockSubmissions(user));
    if (dest === 'dashboard') onNavigate('dashboard');
  };

  if (blockedAttemptTest) {
    return (
      <AlreadyAttemptedView
        test={blockedAttemptTest.test}
        submission={blockedAttemptTest.submission}
        onViewResult={() => {
          setViewingAttempt({
            test: blockedAttemptTest.test,
            submission: blockedAttemptTest.submission,
            tab: 'result'
          });
          setBlockedAttemptTest(null);
        }}
        onViewSolutions={() => {
          setViewingAttempt({
            test: blockedAttemptTest.test,
            submission: blockedAttemptTest.submission,
            tab: 'solutions'
          });
          setBlockedAttemptTest(null);
        }}
        onBack={() => setBlockedAttemptTest(null)}
      />
    );
  }

  if (viewingAttempt) {
    return (
      <ResultView
        test={viewingAttempt.test}
        user={user}
        answers={viewingAttempt.submission?.answers || {}}
        totalSeconds={viewingAttempt.test.duration * 60}
        timeUsed={viewingAttempt.submission?.timeUsed || 0}
        onFinish={handleFinish}
        isReviewOnly={true}
        initialTab={viewingAttempt.tab || 'result'}
      />
    );
  }

  if (activeTest) {
    return (
      <ActiveTestView
        test={activeTest}
        user={user}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <TestSelectionView
      user={user}
      submissions={submissions}
      onStartTest={handleStartTest}
    />
  );
}
