import React, { useState, useEffect } from 'react';
import { getTaskChallengeContent } from '../../data/dailyTaskBank';
import './DailyTaskSolverModal.css';

export default function DailyTaskSolverModal({
  task,
  user,
  userGroup,
  isOpen,
  onClose,
  onCompleteTask
}) {
  if (!isOpen || !task) return null;

  const currentGroup = userGroup || user?.group || task?.group || 'Science';
  const challenge = getTaskChallengeContent(task, currentGroup);
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'formulas'
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(Boolean(task.done));
  const [submitResult, setSubmitResult] = useState(null);

  const questions = challenge?.questions || [];
  const formulas = challenge?.formulas || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length || 20;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  useEffect(() => {
    // Reset or initialize state when task changes
    setSelectedAnswers({});
    setIsSubmitted(Boolean(task.done));
    setSubmitResult(null);
    setActiveTab('quiz');
  }, [task?.id]);

  const handleSelectOption = (qIdx, optIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const scrollToQuestion = (idx) => {
    const el = document.getElementById(`daily-task-q-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitQuiz = (e) => {
    e.preventDefault();
    if (!allAnswered || isSubmitted) return;

    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    // Penalty: 1 point per wrong answer
    const penaltyDeduction = wrongCount * 1;
    // Net earned coins: Math.max(0, correct - penalty)
    const netCoins = Math.max(0, correctCount - penaltyDeduction);

    setIsSubmitted(true);
    setSubmitResult({
      total: totalQuestions,
      correct: correctCount,
      wrong: wrongCount,
      penalty: penaltyDeduction,
      netCoins
    });

    // Mark task done and award exact net coins
    if (onCompleteTask) {
      onCompleteTask(task.id, netCoins);
    }
  };

  return (
    <div className="daily-task-solver-backdrop" onClick={onClose}>
      <div className="daily-task-solver-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="daily-task-solver-header">
          <div>
            <div className="daily-task-solver-badges">
              <span className="badge-subject">
                {task.subject}
              </span>
              <span className="badge-coins">
                🪙 সর্বোচ্চ ২০ EduCoins
              </span>
              <span className="badge-penalty">
                ⚠️ ১ ভুল = -১ পয়েন্ট পেনাল্টি
              </span>
            </div>
            <h3 className="daily-task-solver-title">
              🤖 AI ফোকাস প্ল্যান: {task.task}
            </h3>
          </div>
          <button
            type="button"
            className="daily-task-solver-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Tab switcher */}
        <div className="daily-task-tabs">
          <button
            type="button"
            className={`daily-task-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            📝 ২০টি প্রশ্ন সমাধান (MCQ Quiz)
          </button>
          <button
            type="button"
            className={`daily-task-tab-btn ${activeTab === 'formulas' ? 'active' : ''}`}
            onClick={() => setActiveTab('formulas')}
          >
            💡 AI রিভিশন নোটস ও নিয়মাবলী
          </button>
        </div>

        {/* Content Body */}
        <div className="daily-task-body">
          {/* TAB 1: FORMULAS & CONCEPTS */}
          {activeTab === 'formulas' && (
            <div>
              <div className="formula-banner">
                <span className="formula-banner-subtitle">
                  টপিক ও পরীক্ষার নিয়মাবলী
                </span>
                <h4 className="formula-banner-title">
                  {challenge.topic || `${task.subject} রিভিশন ড্রিল`}
                </h4>
                <p className="formula-banner-desc">
                  মনোযোগ দিয়ে নিয়মাবলী পড়ুন। প্রতিটি ভুল উত্তরের জন্য ১ পয়েন্ট কাটা যাবে এবং কাটা যাওয়া পয়েন্ট আপনার অ্যাকাউন্টে যোগ হবে না:
                </p>
              </div>

              <div className="formula-list">
                <div className="formula-item">
                  <span style={{ color: '#0d9488', fontSize: '1.2rem' }}>🎯</span>
                  <div>
                    <strong>মোট প্রশ্ন: ২০টি</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      প্রতিটি টাস্কে এডমিশন স্ট্যান্ডার্ডের ২০টি নৈর্ব্যক্তিক প্রশ্ন থাকবে।
                    </p>
                  </div>
                </div>
                <div className="formula-item">
                  <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✅</span>
                  <div>
                    <strong>সঠিক উত্তরের মান: +১ কয়েন</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      যেকোনো প্রশ্নের সঠিক উত্তরের জন্য আপনি ১ কয়েন পাবেন।
                    </p>
                  </div>
                </div>
                <div className="formula-item">
                  <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <strong>নেগেটিভ মার্কিং: প্রতিটি ভুলের জন্য ১ পয়েন্ট কর্তন (-১)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      ভুল উত্তর দিলে ১ পয়েন্ট কাটা যাবে যা যোগ হবে না। মোট অর্জিত কয়েন = (সঠিক উত্তর - ভুল উত্তর)।
                    </p>
                  </div>
                </div>
                {formulas.map((form, fIdx) => (
                  <div key={fIdx} className="formula-item">
                    <span style={{ color: '#6366f1', fontSize: '1.2rem' }}>📌</span>
                    <span>{form}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="submit-quiz-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setActiveTab('quiz')}
              >
                📝 ২০টি প্রশ্ন সমাধান করতে কুইজে যান →
              </button>
            </div>
          )}

          {/* TAB 2: INTERACTIVE QUIZ & QUESTIONS */}
          {activeTab === 'quiz' && (
            <div>
              {/* Exam Rule Notification Bar */}
              <div className="exam-rule-bar">
                <div className="exam-rule-stats">
                  <span className="rule-stat-item total">
                    📋 মোট প্রশ্ন: {totalQuestions}টি
                  </span>
                  <span className="rule-stat-item correct">
                    ✓ সঠিক: +১
                  </span>
                  <span className="rule-stat-item penalty">
                    ✗ ভুল: -১ পেনাল্টি
                  </span>
                </div>
                <div className="rule-progress-badge">
                  {isSubmitted
                    ? 'ফলাফল প্রকাশিত'
                    : `উত্তর দেওয়া হয়েছে: ${answeredCount} / ${totalQuestions}`}
                </div>
              </div>

              {/* 20 Questions Quick Navigator Grid */}
              <div className="question-nav-container">
                <div className="question-nav-header">
                  <span>প্রশ্ন নেভিগেটর (১ থেকে ২০)</span>
                  <span>{allAnswered ? '✅ সবগুলোর উত্তর দেওয়া হয়েছে' : 'বাকি প্রশ্নগুলো দ্রুত নির্বাচন করুন'}</span>
                </div>
                <div className="question-nav-grid">
                  {questions.map((q, idx) => {
                    const isAns = selectedAnswers[idx] !== undefined;
                    let pillClass = '';
                    if (isSubmitted) {
                      pillClass = selectedAnswers[idx] === q.answer ? 'correct-pill' : 'wrong-pill';
                    } else if (isAns) {
                      pillClass = 'answered';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`question-nav-btn ${pillClass}`}
                        onClick={() => scrollToQuestion(idx)}
                        title={`প্রশ্ন ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Result Scorecard after Submission */}
              {isSubmitted && submitResult && (
                <div className={`scorecard-banner ${submitResult.netCoins > 0 ? 'success' : 'warning'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2.2rem' }}>
                        {submitResult.netCoins > 10 ? '🏆' : submitResult.netCoins > 0 ? '🎉' : '⚠️'}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
                          টাস্ক ফলাফল ও মার্ক বিশ্লেষণ
                        </h4>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#047857' }}>
                          ভুলের জন্য পেনাল্টি পয়েন্ট বাদ দিয়ে আপনার অ্যাকাউন্টে মোট <strong>+{submitResult.netCoins} EduCoins</strong> যোগ হয়েছে।
                        </p>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: submitResult.netCoins > 0 ? '#10b981' : '#f59e0b',
                      color: '#ffffff',
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}>
                      +{submitResult.netCoins} Coins অর্জিত
                    </div>
                  </div>

                  {/* 4-Column Metric Breakdown */}
                  <div className="scorecard-row">
                    <div className="scorecard-stat-box">
                      <span className="val" style={{ color: '#334155' }}>{submitResult.total}</span>
                      <span className="lbl">মোট প্রশ্ন</span>
                    </div>
                    <div className="scorecard-stat-box">
                      <span className="val" style={{ color: '#059669' }}>{submitResult.correct}</span>
                      <span className="lbl">সঠিক (+{submitResult.correct})</span>
                    </div>
                    <div className="scorecard-stat-box">
                      <span className="val" style={{ color: '#dc2626' }}>{submitResult.wrong}</span>
                      <span className="lbl">ভুল (-{submitResult.penalty} কাটা)</span>
                    </div>
                    <div className="scorecard-stat-box" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
                      <span className="val" style={{ color: '#047857' }}>+{submitResult.netCoins}</span>
                      <span className="lbl" style={{ color: '#065f46', fontWeight: 800 }}>চূড়ান্ত কয়েন</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="question-cards-list">
                {questions.map((q, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  const isCorrect = selectedAnswers[qIdx] === q.answer;

                  return (
                    <div
                      key={q.id || qIdx}
                      id={`daily-task-q-${qIdx}`}
                      className="question-card"
                    >
                      <div className="question-card-header">
                        <span className="question-num-badge">
                          {qIdx + 1}
                        </span>
                        <div className="question-text">
                          {q.question}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="question-options-list">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === optIdx;
                          let extraClass = '';

                          if (isSubmitted) {
                            if (optIdx === q.answer) {
                              extraClass = 'correct-highlight';
                            } else if (isSelected && !isCorrect) {
                              extraClass = 'wrong-highlight';
                            }
                          } else if (isSelected) {
                            extraClass = 'selected';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`option-btn ${extraClass}`}
                            >
                              <span className="option-circle">
                                {['A', 'B', 'C', 'D'][optIdx]}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {isSubmitted && (
                        <div className={`explanation-box ${isCorrect ? '' : 'wrong-expl'}`}>
                          <div className="explanation-title" style={{ color: isCorrect ? '#065f46' : '#b91c1c' }}>
                            {isCorrect ? '✅ চমৎকার! সঠিক উত্তর' : '❌ ভুল উত্তর! (১ পয়েন্ট পেনাল্টি কাটা হয়েছে)'}
                          </div>
                          <div>
                            <strong>ব্যাখ্যা:</strong> {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className="daily-task-solver-footer">
                {!isSubmitted ? (
                  <>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      {allAnswered
                        ? '🎉 সবগুলো প্রশ্নের উত্তর দেওয়া হয়েছে! সাবমিট করতে নিচের বাটনে ক্লিক করুন।'
                        : `⚠️ আরও ${totalQuestions - answeredCount}টি প্রশ্নের উত্তর বাকি রয়েছে।`}
                    </div>
                    <button
                      type="button"
                      className="submit-quiz-btn"
                      disabled={!allAnswered}
                      onClick={handleSubmitQuiz}
                    >
                      ✓ সাবমিট ও ফলাফল দেখুন (নেগেটিভ মার্কিং সহ)
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.86rem', color: '#047857', fontWeight: 700 }}>
                      ✓ আজকের ২০টি প্রশ্নের AI ড্রিল সম্পন্ন হয়েছে।
                    </div>
                    <button
                      type="button"
                      className="submit-quiz-btn"
                      onClick={onClose}
                    >
                      ড্যাশবোর্ডে ফিরে যান
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
