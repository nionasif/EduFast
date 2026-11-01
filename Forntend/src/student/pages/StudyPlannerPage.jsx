import React, { useState, useEffect } from 'react';
import { 
  getStudentCoins, 
  getDailyAIFocusPlan, 
  completeDailyTask, 
  regenerateDailyAIFocusPlan,
  getStudentStreak
} from '../../data/mockData';
import DailyTaskSolverModal from '../components/DailyTaskSolverModal';
import ExamDateRoadmapWidget from '../components/ExamDateRoadmapWidget';
import AdaptiveMultiExamPlannerWidget from '../components/AdaptiveMultiExamPlannerWidget';
import MLChancePredictorModal from '../components/MLChancePredictorModal';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Calendar, Sparkles, CheckCircle2, Clock, RotateCcw, Brain, Target, Award } from 'lucide-react';

export default function StudyPlannerPage({ user, onNavigate, addToast }) {
  const { language } = useLanguage();
  const [coins, setCoins] = useState(() => getStudentCoins(user));
  const [focusPlan, setFocusPlan] = useState(() => getDailyAIFocusPlan(user));
  const [streakDays, setStreakDays] = useState(() => getStudentStreak(user));
  const [plannerTab, setPlannerTab] = useState('daily'); // 'daily' | 'targetPlanner'
  const [isMlPredictorOpen, setIsMlPredictorOpen] = useState(false);
  const [activeTaskForSolver, setActiveTaskForSolver] = useState(null);
  const [rewardNotice, setRewardNotice] = useState(null);

  // Sync state when focus plan or coins update
  useEffect(() => {
    const handlePlanUpdate = (e) => {
      if (e.detail?.plan) {
        setFocusPlan(e.detail.plan);
        setStreakDays(getStudentStreak(user));
      }
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };

    const handleCoinsUpdate = (e) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };

    window.addEventListener('edufast-focus-plan-update', handlePlanUpdate);
    window.addEventListener('edufast-coins-update', handleCoinsUpdate);

    return () => {
      window.removeEventListener('edufast-focus-plan-update', handlePlanUpdate);
      window.removeEventListener('edufast-coins-update', handleCoinsUpdate);
    };
  }, [user]);

  useEffect(() => {
    setCoins(getStudentCoins(user));
    setFocusPlan(getDailyAIFocusPlan(user));
    setStreakDays(getStudentStreak(user));
  }, [user]);

  const handleOpenTaskSolver = (task) => {
    setActiveTaskForSolver(task);
  };

  const handleCompleteTask = (taskId, customEarnedCoins) => {
    const result = completeDailyTask(user, taskId, customEarnedCoins);
    if (result) {
      setFocusPlan(result.updatedPlan);
      setCoins(result.newCoins);
      if (result.delta > 0) {
        setRewardNotice({
          type: 'earn',
          message: `🎉 চমৎকার! "${result.taskName}" সফলভাবে সমাধান করে +${result.delta} EduCoins অর্জন করেছেন! (মোট ব্যালেন্স: ${result.newCoins})`
        });
        if (addToast) {
          addToast(`🎉 +${result.delta} EduCoins অর্জিত হয়েছে!`, 'success');
        }
      } else {
        setRewardNotice({
          type: 'info',
          message: `⚠️ "${result.taskName}" সম্পন্ন হয়েছে। ভুল উত্তরের পেনাল্টির কারণে কোনো অতিরিক্ত কয়েন যোগ হয়নি। (মোট ব্যালেন্স: ${result.newCoins})`
        });
      }
      setTimeout(() => setRewardNotice(null), 5000);
    }
  };

  const handleRegeneratePlan = () => {
    const freshPlan = regenerateDailyAIFocusPlan(user);
    setFocusPlan(freshPlan);
    setRewardNotice({
      type: 'info',
      message: '✨ আজকের জন্য নতুন পার্সোনালাইজড AI রিভিশন প্ল্যান লোড করা হয়েছে!'
    });
    if (addToast) {
      addToast('✨ নতুন AI রিভিশন প্ল্যান লোড হয়েছে!', 'info');
    }
    setTimeout(() => setRewardNotice(null), 3500);
  };

  const tasks = focusPlan?.tasks || [];
  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const earnedCoinsToday = tasks.filter(t => t.done).reduce((sum, t) => sum + (t.coins || 20), 0);
  const totalCoinsToday = tasks.reduce((sum, t) => sum + (t.coins || 20), 0);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  // Calculate hours remaining until midnight (new cycle)
  const hoursLeft = 23 - new Date().getHours();
  const minsLeft = 59 - new Date().getMinutes();

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '1.5rem 1rem 3rem',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* 🧭 Top Navigation & Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <ArrowLeft size={16} />
              <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                AI POWERED
              </span>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                AI Study Planner & Master Timetable
              </h1>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              আপনার লক্ষ্য ও উইকনেস অনুযায়ী পার্সোনালাইজড ২৪ ঘণ্টার রিভিশন চক্র এবং পরীক্ষার তারিখভিত্তিক রোডম্যাপ
            </p>
          </div>
        </div>

        {/* User Quick Badges: Streak & Coins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            padding: '0.45rem 0.9rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#b45309'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="7.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
              <text x="12" y="16" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="bold" fontFamily="sans-serif">৳</text>
            </svg>
            <span>{coins} Coins</span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '0.45rem 0.9rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#b91c1c'
          }}>
            <span>🔥</span>
            <span>{streakDays} Days Streak</span>
          </div>
        </div>
      </div>

      {/* 🌟 PLANNER TABS & ML PREDICTOR TRIGGER */}
      <div style={{
        display: 'flex',
        gap: '0.65rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          type="button"
          onClick={() => setPlannerTab('daily')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: plannerTab === 'daily' ? '2px solid #0d9488' : '1px solid #cbd5e1',
            background: plannerTab === 'daily' ? '#f0fdfa' : '#ffffff',
            color: plannerTab === 'daily' ? '#0d9488' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>⚡</span>
          <span>আজকের ২৪ ঘণ্টার রিভিশন চক্র (Daily Focus)</span>
        </button>

        <button
          type="button"
          onClick={() => setPlannerTab('targetPlanner')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: plannerTab === 'targetPlanner' ? '2px solid #0d9488' : '1px solid #cbd5e1',
            background: plannerTab === 'targetPlanner' ? '#f0fdfa' : '#ffffff',
            color: plannerTab === 'targetPlanner' ? '#0d9488' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>🎯</span>
          <span>Target University Exam Planner</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMlPredictorOpen(true)}
          style={{
            marginLeft: 'auto',
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)'
          }}
        >
          <Sparkles size={16} />
          <span>🤖 ML চান্স প্রেডিকশন</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT
      ────────────────────────────────────────────────────────────── */}
      {plannerTab === 'targetPlanner' ? (
        <div style={{ marginBottom: '2rem' }}>
          <ExamDateRoadmapWidget 
            user={user} 
            onNavigate={onNavigate} 
            onOpenMlPredictor={() => setIsMlPredictorOpen(true)}
            addToast={addToast}
          />
        </div>
      ) : (
        /* 🌟 24-HOUR DAILY AI FOCUS PLAN WIDGET */
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #0d9488',
          borderRadius: '20px',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(13, 148, 136, 0.1)',
                color: '#0d9488',
                padding: '0.3rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '0.45rem'
              }}>
                <span>🤖 AI SMART TIMETABLE</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>২৪ ঘণ্টার দৈনিক রিভিশন চক্র</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                আজকের পার্সোনালাইজড রিভিশন রুটিন (Today's AI Focus Plan)
              </h2>

              {/* Clean Feature Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                <span style={{
                  fontSize: '0.76rem',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>📝</span> প্রতিটি টাস্কে ২০টি প্রশ্ন
                </span>
                <span style={{
                  fontSize: '0.76rem',
                  color: '#b45309',
                  background: '#fef3c7',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚖️</span> ভুল উত্তরে -১ নেগেটিভ
                </span>
                <span style={{
                  fontSize: '0.76rem',
                  color: '#065f46',
                  background: '#d1fae5',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>🪙</span> টাস্ক সম্পন্ন করলেই EduCoins রিওয়ার্ড
                </span>
              </div>
            </div>

            {/* Right Controls: 24h Reset Countdown Timer */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.82rem',
                color: '#0d9488',
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⏳ পরবর্তী চক্র: {hoursLeft} ঘণ্টা {minsLeft} মিনিট পর
              </span>
            </div>
          </div>

          {/* Reward Notification Banner */}
          {rewardNotice && (
            <div style={{
              backgroundColor: rewardNotice.type === 'earn' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${rewardNotice.type === 'earn' ? '#10b981' : '#6366f1'}`,
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: rewardNotice.type === 'earn' ? '#065f46' : '#3730a3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{rewardNotice.type === 'earn' ? '🪙' : 'ℹ️'}</span>
              <span>{rewardNotice.message}</span>
            </div>
          )}

          {/* Daily Progress & Coins Bar */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.84rem',
              fontWeight: 700,
              marginBottom: '0.65rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <span style={{ color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} color="#0d9488" />
                <span>আজকের অগ্রগতি:</span>
                <span style={{ color: '#0d9488' }}>{completedCount}/{totalCount} সম্পন্ন ({progressPercent}%)</span>
              </span>
              <span style={{
                color: '#b45309',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '0.2rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>🪙</span>
                <span>অর্জিত রিওয়ার্ড:</span>
                <strong>{earnedCoinsToday} / {totalCoinsToday} Coins</strong>
              </span>
            </div>

            {/* Progress track */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: allCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0d9488, #3b82f6)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Routine Checklist Cards - Symmetrical 4-Card Responsive Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}>
            {tasks.map(t => (
              <div 
                key={t.id}
                style={{
                  background: t.done ? '#f0fdf4' : '#ffffff',
                  border: `1.5px solid ${t.done ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '1.15rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  boxShadow: t.done ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      color: t.done ? '#059669' : '#0d9488',
                      backgroundColor: t.done ? '#dcfce7' : 'rgba(13, 148, 136, 0.1)',
                      padding: '3px 9px',
                      borderRadius: '6px'
                    }}>
                      {t.subject}
                    </span>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {t.time}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: t.done ? '#065f46' : '#1e293b',
                    lineHeight: '1.5',
                    minHeight: '44px'
                  }}>
                    {t.task}
                  </div>
                </div>

                {/* Card Action Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  paddingTop: '0.85rem',
                  marginTop: 'auto',
                  gap: '0.35rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: t.done ? '#065f46' : '#b45309',
                    backgroundColor: t.done ? '#dcfce7' : '#fef3c7',
                    padding: '3px 6px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {t.done ? `✓ +${t.earnedCoins !== undefined ? t.earnedCoins : (t.coins || 20)} Coins` : `🪙 ২০টি প্রশ্ন (২০ Coins)`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenTaskSolver(t)}
                    style={{
                      backgroundColor: t.done ? '#f8fafc' : '#0d9488',
                      color: t.done ? '#475569' : '#ffffff',
                      border: t.done ? '1px solid #cbd5e1' : 'none',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '9px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: t.done ? 'none' : '0 2px 6px rgba(13, 148, 136, 0.25)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {t.done ? '🔍 সমাধান দেখুন' : '🎯 সমাধান করুন'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* All Completed Celebration */}
          {allCompleted && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1.15rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)',
              border: '1.5px dashed #10b981',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '2rem' }}>🏆</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46' }}>
                  অসাধারণ পারফরম্যান্স! আজকের সকল AI রিভিশন টাস্ক সম্পন্ন হয়েছে!
                </div>
                <div style={{ fontSize: '0.82rem', color: '#047857' }}>
                  আপনি আজকের মোট {totalCoinsToday} EduCoins সংগ্রহ করেছেন। পরবর্তী নতুন প্ল্যান আগামীকাল রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে আপডেট হবে।
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive AI Task Solver Modal */}
      <DailyTaskSolverModal
        task={activeTaskForSolver}
        user={user}
        userGroup={user?.group}
        isOpen={Boolean(activeTaskForSolver)}
        onClose={() => setActiveTaskForSolver(null)}
        onCompleteTask={handleCompleteTask}
      />

      {/* ML Admission Chance Predictor Modal */}
      <MLChancePredictorModal
        isOpen={isMlPredictorOpen}
        onClose={() => setIsMlPredictorOpen(false)}
        user={user}
        addToast={addToast}
      />
    </div>
  );
}

