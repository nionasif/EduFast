import { useState, useEffect } from 'react';
import { 
  getAdmissions, 
  getCourses, 
  getMockTests, 
  getStudentCoins, 
  getDailyAIFocusPlan, 
  completeDailyTask, 
  regenerateDailyAIFocusPlan,
  getStudentMockStats,
  getStudentStreak
} from '../../data/mockData';
import Leaderboard from '../components/Leaderboard';
import CountdownTimer from '../../common/components/CountdownTimer';
import DailyTaskSolverModal from '../components/DailyTaskSolverModal';

export default function StudentDashboardPage({ user, onNavigate }) {
  const [admissions, setAdmissions] = useState(getAdmissions);
  const [courses, setCourses] = useState(getCourses);
  const [coins, setCoins] = useState(() => getStudentCoins(user));
  const [focusPlan, setFocusPlan] = useState(() => getDailyAIFocusPlan(user));
  const [availableTests, setAvailableTests] = useState(getMockTests);
  const [rewardNotice, setRewardNotice] = useState(null);
  const [mockStats, setMockStats] = useState(() => getStudentMockStats(user));
  const [streakDays, setStreakDays] = useState(() => getStudentStreak(user));

  useEffect(() => {
    const handleUpdate = () => {
      setAdmissions(getAdmissions());
      setCourses(getCourses());
      setAvailableTests(getMockTests());
    };
    const handleCoins = (e) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };
    const handlePlan = (e) => {
      if (e.detail?.plan) {
        setFocusPlan(e.detail.plan);
        setStreakDays(getStudentStreak(user));
      }
    };
    const handleTestsUpdate = () => {
      setAvailableTests(getMockTests());
    };
    const handleMockHistory = () => {
      setMockStats(getStudentMockStats(user));
      setStreakDays(getStudentStreak(user));
    };

    window.addEventListener('edufast-data-update', handleUpdate);
    window.addEventListener('edufast-coins-update', handleCoins);
    window.addEventListener('edufast-focus-plan-update', handlePlan);
    window.addEventListener('edufast-mock-tests-update', handleTestsUpdate);
    window.addEventListener('edufast-mock-history-update', handleMockHistory);

    return () => {
      window.removeEventListener('edufast-data-update', handleUpdate);
      window.removeEventListener('edufast-coins-update', handleCoins);
      window.removeEventListener('edufast-focus-plan-update', handlePlan);
      window.removeEventListener('edufast-mock-tests-update', handleTestsUpdate);
      window.removeEventListener('edufast-mock-history-update', handleMockHistory);
    };
  }, [user]);

  // Sync plan, coins, stats & streak when user session changes
  useEffect(() => {
    setCoins(getStudentCoins(user));
    setFocusPlan(getDailyAIFocusPlan(user));
    setMockStats(getStudentMockStats(user));
    setStreakDays(getStudentStreak(user));
  }, [user]);

  // Modal state for interactive AI task solver
  const [activeTaskForSolver, setActiveTaskForSolver] = useState(null);

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
      } else {
        setRewardNotice({
          type: 'info',
          message: `⚠️ "${result.taskName}" সম্পন্ন হয়েছে। ভুল উত্তরের পেনাল্টির কারণে কোনো অতিরিক্ত কয়েন যোগ হয়নি। (মোট ব্যালেন্স: ${result.newCoins})`
        });
      }
      setTimeout(() => setRewardNotice(null), 5000);
    }
  };

  // Handle manual regeneration of fresh AI tasks
  const handleRegeneratePlan = () => {
    const freshPlan = regenerateDailyAIFocusPlan(user);
    setFocusPlan(freshPlan);
    setRewardNotice({
      type: 'info',
      message: '✨ আজকের জন্য নতুন পার্সোনালাইজড AI রিভিশন প্ল্যান লোড করা হয়েছে!'
    });
    setTimeout(() => setRewardNotice(null), 3500);
  };

  // Show all university circulars on the dashboard
  const admissionsPreview = admissions;
  
  // Recommend courses based on group, but fall back to first 3 if none
  const recommendedCourses = courses
    .filter(course => (course.isApproved === true || course.status === 'Approved') && (!user?.group || course.group === user.group))
    .slice(0, 3);

  // Recommended mock tests strictly for user's group
  const userGroupClean = (user?.group || '').trim().toLowerCase();
  const recommendedTests = availableTests
    .filter(t => !userGroupClean || (t.group && t.group.toLowerCase() === userGroupClean))
    .slice(0, 3);

  // Calculate dynamic admission eligibility matching based on student's real GPA
  const sscGpa = user?.ssc?.gpa !== undefined && user?.ssc?.gpa !== null && !isNaN(Number(user.ssc.gpa)) ? Number(user.ssc.gpa) : 0;
  const hscGpa = user?.hsc?.gpa !== undefined && user?.hsc?.gpa !== null && !isNaN(Number(user.hsc.gpa)) ? Number(user.hsc.gpa) : 0;
  const totalGpa = sscGpa + hscGpa;

  let totalMatchingUnits = 0;
  let eligibleUnitsCount = 0;
  admissions.forEach(univ => {
    if (Array.isArray(univ.units)) {
      univ.units.forEach(unit => {
        const matchesGroup = !user?.group || !unit.group || unit.group === 'All' || unit.group.toLowerCase() === (user?.group || '').toLowerCase();
        if (matchesGroup) {
          totalMatchingUnits++;
          if (totalGpa > 0 && totalGpa >= (Number(unit.minGpa) || 0)) {
            eligibleUnitsCount++;
          }
        }
      });
    }
  });

  return (
    <div className="container" style={{ padding: '2rem 0 6rem 0' }}>
      
      {/* Top Welcome Banner with Mentor Connect */}
      <div 
        className="dashboard-welcome-banner"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--white, #ffffff)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--gray-200, #e2e8f0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.9rem', marginBottom: '0.35rem' }}>
            Welcome back, <span style={{ color: 'var(--primary-teal, #319795)' }}>{user?.name || 'Student'}</span>!
          </h1>
          <p style={{ color: 'var(--gray-600)', margin: 0, fontSize: '0.9rem' }}>
            Group: <strong>{user?.group || 'General'}</strong> • SSC GPA: <strong>{user?.ssc?.gpa ? Number(user.ssc.gpa).toFixed(2) : 'N/A'}</strong> • HSC GPA: <strong>{user?.hsc?.gpa ? Number(user.hsc.gpa).toFixed(2) : 'N/A'}</strong>
          </p>
        </div>

        {/* Dedicated Mentor Communication Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-mentor-chat'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
            transition: 'transform 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.86rem', lineHeight: '1.1' }}>মেন্টরের সাথে কথা বলুন</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>২৪/৭ লাইভ ডাউট সলভিং</div>
          </div>
        </button>
      </div>

      {/* Stats Panel Grid (4 Columns) */}
      <div 
        className="dashboard-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
          marginTop: '1.5rem'
        }}
      >
        {/* Stat Card 1: Average Accuracy */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--border-radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#e6fffa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--primary-teal)', flexShrink: 0 }}>🎯</div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Avg Mock Accuracy</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-charcoal)', display: 'block', lineHeight: 1.2 }}>
              {mockStats.totalTests > 0 ? `${mockStats.avgAccuracy}%` : '0%'}
            </span>
            <span style={{ fontSize: '0.7rem', color: mockStats.totalTests > 0 ? '#48bb78' : 'var(--gray-400)', display: 'block' }}>
              {mockStats.totalTests > 0 ? `${mockStats.totalTests}টি টেস্ট সম্পন্ন` : 'কোনো টেস্ট দেওয়া হয়নি'}
            </span>
          </div>
        </div>

        {/* Stat Card 2: Admission Target Match */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--border-radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ebf8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#2b6cb0', flexShrink: 0 }}>🎓</div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Eligible Units Match</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-charcoal)', display: 'block', lineHeight: 1.2 }}>
              {totalGpa > 0 ? `${eligibleUnitsCount} of ${totalMatchingUnits} Units` : `${totalMatchingUnits || admissions.length} Units Available`}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#2b6cb0', display: 'block' }}>
              {totalGpa > 0 ? `Based on GPA (${totalGpa.toFixed(2)})` : 'Based on SSC & HSC GPA'}
            </span>
          </div>
        </div>

        {/* Stat Card 3: EduCoins & Daily Streak */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--border-radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#d97706', flexShrink: 0 }}>🪙</div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>EduCoins & Streak</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', display: 'block', lineHeight: 1.2 }}>{coins} Coins</span>
            <span style={{ fontSize: '0.7rem', color: streakDays > 0 ? '#ef4444' : 'var(--gray-400)', fontWeight: 700, display: 'block' }}>
              {streakDays > 0 ? `🔥 ${streakDays}-Day Study Streak` : '🌱 0-Day Streak (নতুন শিক্ষার্থী)'}
            </span>
          </div>
        </div>

        {/* Stat Card 4: Study Lounge Shortcut */}
        <div 
          onClick={() => onNavigate('study-lounge')}
          style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(14, 165, 233, 0.1))', 
            border: '1px solid rgba(99, 102, 241, 0.3)', 
            borderRadius: 'var(--border-radius-md)', 
            padding: '1.25rem', 
            cursor: 'pointer',
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#ffffff', flexShrink: 0 }}>🎧</div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6366f1', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>24/7 Study Room</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-charcoal)', display: 'block', lineHeight: 1.2 }}>Join Live Peers</span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'block' }}>● 184 Students Active</span>
          </div>
        </div>
      </div>

      {/* 🌟 AI PERSONALIZED STUDY ROUTINE PLANNER WIDGET (24-HOUR CYCLE) */}
      {(() => {
        const tasks = focusPlan?.tasks || [];
        const completedCount = tasks.filter(t => t.done).length;
        const totalCount = tasks.length;
        const earnedCoinsToday = tasks.filter(t => t.done).reduce((sum, t) => sum + (t.coins || 20), 0);
        const totalCoinsToday = tasks.reduce((sum, t) => sum + (t.coins || 20), 0);
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allCompleted = totalCount > 0 && completedCount === totalCount;

        // Calculate hours remaining until midnight (new day)
        const hoursLeft = 23 - new Date().getHours();
        const minsLeft = 59 - new Date().getMinutes();

        return (
          <div style={{
            background: 'var(--white, #ffffff)',
            border: '1px solid var(--gray-200, #e2e8f0)',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.06)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  <span>🤖 AI SMART TIMETABLE</span>
                  <span>•</span>
                  <span>২৪ ঘণ্টার দৈনিক রিভিশন চক্র</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-charcoal, #1e293b)' }}>
                  আজকের পার্সোনালাইজড রিভিশন রুটিন (Today's AI Focus Plan)
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.86rem', color: 'var(--gray-600, #4a5568)' }}>
                  প্রতি ২৪ ঘণ্টা পর পর AI নতুন টাস্ক দেয়। প্রতিটি টাস্কে <strong>২০টি করে প্রশ্ন</strong> থাকবে। প্রতিটি ভুলের জন্য <strong>১ পয়েন্ট কাটা যাবে</strong> (পেনাল্টি কাটা পয়েন্ট যোগ হবে না)।
                </p>
              </div>

              {/* Right Controls & 24h Reset Timer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <button 
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-light, #f8fafc)',
                    borderColor: 'var(--gray-300, #cbd5e1)',
                    cursor: 'pointer'
                  }}
                  onClick={handleRegeneratePlan}
                  title="নতুন AI রিভিশন প্ল্যান তৈরি করুন"
                >
                  <span>🔄</span> নতুন AI প্ল্যান জেনারেট
                </button>
                <span style={{ fontSize: '0.74rem', color: '#6366f1', fontWeight: 600 }}>
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
                gap: '8px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <span>{rewardNotice.type === 'earn' ? '🪙' : 'ℹ️'}</span>
                <span>{rewardNotice.message}</span>
              </div>
            )}

            {/* Daily Progress & Coins Bar */}
            <div style={{
              backgroundColor: 'var(--bg-light, #f8fafc)',
              border: '1px solid var(--gray-200, #e2e8f0)',
              borderRadius: '14px',
              padding: '0.9rem 1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-charcoal, #1e293b)' }}>
                  🎯 আজকের অগ্রগতি: {completedCount}/{totalCount} সম্পন্ন ({progressPercent}%)
                </span>
                <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🪙 আজকের অর্জিত রিওয়ার্ড:</span>
                  <strong>{earnedCoinsToday} / {totalCoinsToday} Coins</strong>
                </span>
              </div>

              {/* Progress track */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--gray-200, #e2e8f0)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: allCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #0d9488)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Routine Checklist Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {tasks.map(t => (
                <div 
                  key={t.id}
                  style={{
                    background: t.done ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-light, #f8fafc)',
                    border: `1.5px solid ${t.done ? '#10b981' : 'var(--gray-200, #e2e8f0)'}`,
                    borderRadius: '16px',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem',
                    transition: 'all 0.2s ease',
                    boxShadow: t.done ? '0 4px 12px rgba(16, 185, 129, 0.12)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        color: t.done ? '#059669' : 'var(--primary-teal, #0d9488)',
                        backgroundColor: t.done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(13, 148, 136, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {t.subject}
                      </span>
                      <span style={{ color: 'var(--gray-500, #64748b)', fontWeight: 600, fontSize: '0.74rem' }}>
                        ⏱ {t.time}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: t.done ? '#065f46' : 'var(--text-charcoal, #1e293b)',
                      lineHeight: '1.45',
                      marginBottom: '0.5rem'
                    }}>
                      {t.task}
                    </div>
                  </div>

                  {/* Card Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: t.done ? '#065f46' : '#b45309',
                      backgroundColor: t.done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                      padding: '3px 9px',
                      borderRadius: '999px'
                    }}>
                      {t.done ? `✓ +${t.earnedCoins !== undefined ? t.earnedCoins : (t.coins || 20)} Coins অর্জিত` : `🪙 ২০টি প্রশ্ন (সর্বোচ্চ ২০ Coins)`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenTaskSolver(t)}
                      style={{
                        backgroundColor: t.done ? '#f1f5f9' : 'var(--primary-teal, #319795)',
                        color: t.done ? '#475569' : '#ffffff',
                        border: t.done ? '1px solid #cbd5e1' : 'none',
                        padding: '0.42rem 0.95rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: t.done ? 'none' : '0 2px 6px rgba(49, 151, 149, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {t.done ? '🔍 সমাধান দেখুন' : '🎯 টাস্ক সমাধান করুন →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* All Completed Celebration */}
            {allCompleted && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)',
                border: '1.5px dashed #10b981',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🏆</span>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#065f46' }}>
                    অসাধারণ পারফরম্যান্স! আজকের সকল AI রিভিশন টাস্ক সম্পন্ন হয়েছে!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                    আপনি আজকের মোট {totalCoinsToday} EduCoins সংগ্রহ করেছেন। পরবর্তী নতুন প্ল্যান আগামীকাল রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে আপডেট হবে।
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Dynamic Student Leaderboard */}
      <Leaderboard user={user} coins={coins} onNavigate={onNavigate} />

      {/* ── Mock Test Quick Access Widget ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2c7a7b 60%, #319795 100%)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem 2.5rem',
        marginTop: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        {/* Background decorative icons */}
        <div style={{ position: 'absolute', top: '-20px', right: '20px', fontSize: '8rem', opacity: 0.06 }}>📝</div>
        <div style={{ position: 'absolute', bottom: '-30px', right: '180px', fontSize: '6rem', opacity: 0.05 }}>⏱</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left: Title & description */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '0.2rem 0.7rem', display: 'inline-block', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
              🔥 MOCK TEST CENTER
            </div>
            <h2 style={{ color: 'white', fontSize: '1.6rem', margin: '0 0 0.4rem 0' }}>
              Ready to Practice?
            </h2>
            <p style={{ color: '#ffffff', opacity: 1, margin: '0 0 1.2rem 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Simulate real university admission exams with timed MCQ tests, negative marking, and instant result analysis.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[
                { icon: '📊', text: `${availableTests.length} Tests Available` },
                { icon: '⏱', text: 'Timed & Auto-submit' },
                { icon: '📋', text: 'Detailed Results' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', opacity: 0.85 }}>
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>
            <button
              className="btn"
              style={{
                background: 'var(--cta-orange)',
                color: 'white',
                border: 'none',
                padding: '0.7rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-orange)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              onClick={() => onNavigate('mocktest')}
            >
              ▶ Go to Test Center
            </button>
          </div>

          {/* Right: Recommended test cards */}
          {recommendedTests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '260px', maxWidth: '320px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⭐ Recommended for {user?.group || 'You'}
              </div>
              {recommendedTests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => onNavigate('mocktest')}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>{test.title}</div>
                  <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.72rem', opacity: 0.8 }}>
                    <span>⏱ {test.duration} min</span>
                    <span>📝 {test.questions.length} Qs</span>
                    <span>🏆 {test.totalMarks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="two-col-layout" style={{ padding: 0, marginTop: '2rem' }}>
        
        {/* Left Column: University Admissions Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-teal)' }}>University Admissions</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => onNavigate('admissions')}
            >
              See All Circulars ({admissions.length})
            </button>
          </div>
          
          <div className="admissions-list">
            {admissionsPreview.map((univ) => {
              // Check eligibility for quick dashboard badge display using actual GPA
              const hasGpa = totalGpa > 0;
              const userGroup = (user?.group || '').trim().toLowerCase();
              const eligibleUnitsCount = (univ.units || []).filter(
                unit => (!userGroup || !unit.group || unit.group === 'All' || unit.group.toLowerCase() === userGroup) &&
                        hasGpa && totalGpa >= (Number(unit.minGpa) || 0)
              ).length;
              const totalUnivUnits = Array.isArray(univ.units) ? univ.units.length : 0;

              return (
                <div key={univ.id} className="admission-card">
                  <div className="admission-header">
                    <div className="univ-info">
                      <div className="univ-icon" style={{ width: '40px', height: '40px', fontSize: '1.6rem' }}>
                        {univ.logo}
                      </div>
                      <div>
                        <h4 className="univ-title" style={{ fontSize: '1.1rem' }}>{univ.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Exams: {univ.examDate}</p>
                      </div>
                    </div>
                    <div>
                      {hasGpa ? (
                        eligibleUnitsCount > 0 ? (
                          <span className="badge" style={{ backgroundColor: '#c6f6d5', color: '#22543d', fontSize: '0.65rem' }}>
                            {eligibleUnitsCount} Unit(s) Match
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#fed7d7', color: '#742a2a', fontSize: '0.65rem' }}>
                            0 Matches
                          </span>
                        )
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem', border: '1px solid #bae6fd' }}>
                          {totalUnivUnits} Active Units
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'block', marginBottom: '0.1rem' }}>
                        Deadline Counter
                      </span>
                      <CountdownTimer deadline={univ.deadline} />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => onNavigate('admissions', univ.id)}
                    >
                      Check Eligibility
                    </button>
                  </div>
                </div>
              );
            })}
            {admissionsPreview.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>No admission notices yet</div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Active circulars will appear here once published.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Courses Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-teal)' }}>Recommended Courses</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => onNavigate('courses')}
            >
              Course Hub
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {recommendedCourses.map((course) => {
              const isEnrolled = Array.isArray(user?.purchasedCourses) && user.purchasedCourses.includes(course.id);
              
              return (
                <div key={course.id} className="course-card" style={{ flexDirection: 'row', minHeight: '130px' }}>
                  <div className="course-media" style={{ width: '120px', height: 'auto', fontSize: '2.5rem', flexShrink: 0 }}>
                    {course.image}
                  </div>
                  <div className="course-content" style={{ padding: '1rem', justifyContent: 'center' }}>
                    <h4 className="course-title" style={{ fontSize: '1rem', height: 'auto', marginBottom: '0.25rem', display: 'block', webkitLineClamp: 'none' }}>
                      {course.title}
                    </h4>
                    <span className="course-meta" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>
                      By {course.instructor} • {course.duration}
                    </span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span className="price-new" style={{ fontSize: '1.1rem' }}>৳ {course.discountedPrice}</span>
                      {isEnrolled ? (
                        <span className="badge" style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', textTransform: 'none' }}>
                          ✓ Enrolled
                        </span>
                      ) : (
                        <button 
                          className="btn btn-teal" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onNavigate('courses')}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {recommendedCourses.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                <div style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>No recommended courses yet</div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Courses added by the admin will be recommended here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive AI Task Solver Modal */}
      <DailyTaskSolverModal
        task={activeTaskForSolver}
        user={user}
        userGroup={user?.group}
        isOpen={Boolean(activeTaskForSolver)}
        onClose={() => setActiveTaskForSolver(null)}
        onCompleteTask={handleCompleteTask}
      />
    </div>
  );
}
