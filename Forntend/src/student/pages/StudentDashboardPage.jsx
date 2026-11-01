import { useState, useEffect } from 'react';
import api from '../../services/api';
import socket from '../../socket';
import { 
  getAdmissions, 
  getCourses, 
  getMockTests, 
  getStudentCoins, 
  getDailyAIFocusPlan, 
  completeDailyTask, 
  regenerateDailyAIFocusPlan,
  getStudentMockStats,
  getStudentStreak,
  getDoubtsQueue,
  submitDoubt,
  rateDoubtSolution
} from '../../data/mockData';
import Leaderboard from '../components/Leaderboard';
import CountdownTimer from '../../common/components/CountdownTimer';
import DailyTaskSolverModal from '../components/DailyTaskSolverModal';
import ExamDateRoadmapWidget from '../components/ExamDateRoadmapWidget';
import MLChancePredictorModal from '../components/MLChancePredictorModal';
import SponsoredPartnerBanner from '../../common/components/SponsoredPartnerBanner';
import { normalizeGroup, getBanglaGroup } from './MockTestPage';

export default function StudentDashboardPage({ user, onNavigate, onOpenProfile, addToast }) {
  const [admissions, setAdmissions] = useState(getAdmissions);
  const [courses, setCourses] = useState(getCourses);
  const [coins, setCoins] = useState(() => getStudentCoins(user));
  const [focusPlan, setFocusPlan] = useState(() => getDailyAIFocusPlan(user));
  const [availableTests, setAvailableTests] = useState(getMockTests);
  const [rewardNotice, setRewardNotice] = useState(null);
  const [mockStats, setMockStats] = useState(() => getStudentMockStats(user));
  const [streakDays, setStreakDays] = useState(() => getStudentStreak(user));
  const [plannerTab, setPlannerTab] = useState('daily'); // 'daily' | 'roadmap'
  const [isMlPredictorOpen, setIsMlPredictorOpen] = useState(false);

  // Doubt Corner Modal State
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [doubtModalTab, setDoubtModalTab] = useState('solutions'); // 'solutions' | 'ask'
  const [doubtForm, setDoubtForm] = useState({ subject: 'Physics', topic: '', question: '', priority: 'high' });
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [myDoubtsList, setMyDoubtsList] = useState([]);
  const [loadingDoubts, setLoadingDoubts] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/student/dashboard-stats');
      const stats = statsRes.data?.data || statsRes.data || statsRes.stats;
      if (stats) {
        if (stats.coins !== undefined) setCoins(stats.coins);
        if (stats.streak !== undefined) setStreakDays(stats.streak);
        if (stats.mockStats && typeof stats.mockStats.totalTests === 'number') {
          setMockStats(prev => {
            const bTests = stats.mockStats.totalTests;
            const lTests = prev?.totalTests || 0;
            if (bTests > 0 || lTests === 0) {
              const latestPct = stats.mockStats.latestAttempt?.percentage;
              const rawAcc = stats.mockStats.avgAccuracy;
              const finalAcc = (latestPct !== undefined && latestPct !== null && (rawAcc === undefined || rawAcc <= 1))
                ? latestPct
                : (rawAcc || 0);
              return {
                totalTests: bTests,
                avgAccuracy: finalAcc,
                lastAccuracy: latestPct || finalAcc
              };
            }
            return prev;
          });
        }
      }
      const univRes = await api.get('/universities');
      const univData = univRes.data?.data || univRes.data;
      if (Array.isArray(univData) && univData.length > 0) {
        setAdmissions(univData);
      }
      const coursesRes = await api.get('/courses');
      const coursesData = coursesRes.data?.data || coursesRes.data;
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      }
    } catch (err) {
      console.warn('Dashboard live stats fetch notice:', err.message);
    }
  };

  const fetchMyDoubts = async () => {
    setLoadingDoubts(true);
    try {
      const localDoubts = getDoubtsQueue().filter(
        d => !user?.email || !d.studentEmail || d.studentEmail.toLowerCase() === user.email.toLowerCase()
      );
      try {
        const res = await api.get('/doubts');
        const serverDoubts = res.data?.data || res.data;
        if (Array.isArray(serverDoubts) && serverDoubts.length > 0) {
          const map = new Map();
          [...serverDoubts, ...localDoubts].forEach(item => {
            const key = String(item.id);
            if (!map.has(key)) {
              map.set(key, item);
            } else {
              const existing = map.get(key);
              if (item.status === 'resolved' || item.solution || item.solutionText) {
                map.set(key, { ...existing, ...item });
              }
            }
          });
          setMyDoubtsList(Array.from(map.values()));
        } else {
          setMyDoubtsList(localDoubts);
        }
      } catch {
        setMyDoubtsList(localDoubts);
      }
    } finally {
      setLoadingDoubts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchMyDoubts();

    const handleCourseDeleted = (deletedData) => {
      const deletedId = deletedData?.id;
      if (!deletedId) return;

      // Immediately prune from recommended courses
      setCourses(prev => prev.filter(c => String(c.id) !== String(deletedId)));

      // Prune from student session in localStorage if present
      try {
        const studentSaved = localStorage.getItem('edufast_student_session');
        if (studentSaved) {
          const parsed = JSON.parse(studentSaved);
          if (Array.isArray(parsed?.purchasedCourses)) {
            parsed.purchasedCourses = parsed.purchasedCourses.filter(cid => String(cid) !== String(deletedId));
            localStorage.setItem('edufast_student_session', JSON.stringify(parsed));
          }
        }
      } catch (e) {}
    };

    const handleDataUpdate = (e) => {
      const detail = e.detail;
      if (detail && detail.type === 'course:deleted') {
        handleCourseDeleted(detail);
      } else {
        fetchDashboardData();
      }
    };

    socket.on('course:deleted', handleCourseDeleted);
    window.addEventListener('edufast-data-update', handleDataUpdate);

    return () => {
      socket.off('course:deleted', handleCourseDeleted);
      window.removeEventListener('edufast-data-update', handleDataUpdate);
    };
  }, [user?.email]);

  const handleOpenStudentProfile = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      window.dispatchEvent(new CustomEvent('open-student-profile'));
    }
  };

  const handleDoubtSubmit = async (e) => {
    e.preventDefault();
    if (!doubtForm.question.trim()) {
      alert('অনুগ্রহ করে আপনার প্রশ্ন বা ডাউট বিস্তারিত লিখুন।');
      return;
    }
    setIsSubmittingDoubt(true);
    try {
      const doubtId = `dbt-${Date.now()}`;
      const newDoubtData = {
        id: doubtId,
        subject: doubtForm.subject,
        topic: doubtForm.topic || 'General Problem',
        question: doubtForm.question.trim(),
        priority: doubtForm.priority,
        studentName: user?.name || 'শিক্ষার্থী',
        studentEmail: user?.email || 'student@edufast.com'
      };

      // 1. Submit to local shared queue
      submitDoubt(newDoubtData);

      // 2. Submit to backend API
      try {
        await api.post('/doubts', newDoubtData);
      } catch (err) {
        console.warn('Backend doubt API sync notice:', err.message);
      }

      setRewardNotice({
        type: 'earn',
        message: '🎉 আপনার ডাউটটি সফলভাবে ২৪/৭ মেন্টর ডেস্কে পাঠানো হয়েছে! মেন্টর সমাধান দিলে নোটিফিকেশন পাবেন।'
      });
      setDoubtForm({ subject: 'Physics', topic: '', question: '', priority: 'high' });
      setDoubtModalTab('solutions');
      fetchMyDoubts();
      setTimeout(() => setRewardNotice(null), 5000);
    } catch (err) {
      alert('ডাউট সাবমিট করতে সমস্যা হয়েছে: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleRateDoubt = (doubtId, stars) => {
    // 🔒 প্রতিটা প্রশ্নে রেটিং একবারই গ্রহণযোগ্য (একবার রেটিং দিলে আর পরিবর্তন করা যাবে না)
    const existing = (myDoubtsList || []).find(d => String(d.id) === String(doubtId));
    if (existing && Number(existing.rating) > 0) {
      return;
    }

    // Optimistically update the doubt rating in local list immediately
    setMyDoubtsList(prev => prev.map(d => String(d.id) === String(doubtId) ? { ...d, rating: stars } : d));

    rateDoubtSolution(doubtId, stars);
    fetchMyDoubts();

    // Exactly ONE single notification notice on student side
    setRewardNotice({
      coins: stars >= 4 ? 5 : 2,
      type: 'earn',
      message: `⭐ আপনার ${stars}★ রেটিং সফলভাবে জমা হয়েছে। ধন্যবাদ!`
    });
    setTimeout(() => setRewardNotice(null), 4000);
  };

  useEffect(() => {
    fetchDashboardData();

    const handleCourseDeleted = (deletedData) => {
      const deletedId = deletedData?.id;
      if (deletedId) {
        setCourses(prev => prev.filter(c => String(c.id) !== String(deletedId)));
      }
    };
    if (socket) {
      socket.on('course:deleted', handleCourseDeleted);
    }

    const handleUpdate = () => {
      fetchDashboardData();
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

    const handleDoubtsUpdate = (e) => {
      if (e.detail?.type === 'doubts_queue') {
        fetchMyDoubts();
      }
    };
    const handleOpenDoubtCorner = (e) => {
      setIsDoubtModalOpen(true);
      fetchMyDoubts();
      if (e.detail?.tab) {
        setDoubtModalTab(e.detail.tab);
      }
    };
    const handleOpenMlPredictor = () => {
      setIsMlPredictorOpen(true);
    };

    window.addEventListener('edufast-data-update', handleUpdate);
    window.addEventListener('edufast-data-update', handleDoubtsUpdate);
    window.addEventListener('open-doubt-corner', handleOpenDoubtCorner);
    window.addEventListener('open-ml-predictor-modal', handleOpenMlPredictor);
    window.addEventListener('edufast-coins-update', handleCoins);
    window.addEventListener('edufast-focus-plan-update', handlePlan);
    window.addEventListener('edufast-mock-tests-update', handleTestsUpdate);
    window.addEventListener('edufast-mock-history-update', handleMockHistory);
    return () => {
      if (socket) {
        socket.off('course:deleted', handleCourseDeleted);
      }
      window.removeEventListener('edufast-data-update', handleUpdate);
      window.removeEventListener('edufast-data-update', handleDoubtsUpdate);
      window.removeEventListener('open-doubt-corner', handleOpenDoubtCorner);
      window.removeEventListener('open-ml-predictor-modal', handleOpenMlPredictor);
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
  
  // Student's normalized group
  const studentGroup = normalizeGroup(user?.group || user?.academicGroup);

  // Helper to verify if course is approved and live
  const isCourseApproved = (c) => {
    if (!c) return false;
    return (
      c.isApproved === true ||
      c.isApproved === 1 ||
      c.isApproved === '1' ||
      c.status === 'Approved' ||
      c.status === 'approved' ||
      c.isApproved === undefined
    );
  };

  // All live courses available from Course Hub
  const liveCourses = (Array.isArray(courses) ? courses : []).filter(isCourseApproved);

  // 1. Group-matched courses
  const groupMatchedCourses = liveCourses.filter(course => {
    const cGroup = normalizeGroup(course.academicGroup || course.group || 'all');
    return !studentGroup || cGroup === 'all' || cGroup === studentGroup;
  });

  // 2. Recommend courses: prioritize student's group, fall back to live Course Hub courses so it's never empty if courses exist
  const recommendedCourses = (() => {
    const result = [...groupMatchedCourses];
    const pickedIds = new Set(result.map(c => String(c.id)));
    for (const c of liveCourses) {
      if (result.length >= 3) break;
      if (!pickedIds.has(String(c.id))) {
        result.push(c);
        pickedIds.add(String(c.id));
      }
    }
    return result.slice(0, 3);
  })();

  // Recommended mock tests strictly for user's group
  const recommendedTests = availableTests
    .filter(t => normalizeGroup(t.group) === studentGroup)
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
      
      {/* Top Welcome Banner with Profile & Mentor Connect */}
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
          padding: '1.4rem 1.75rem',
          borderRadius: '18px',
          border: '1px solid var(--gray-200, #e2e8f0)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ textAlign: 'left', flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>
              Welcome back, <span style={{ color: 'var(--primary-teal, #319795)' }}>{user?.name || 'Student'}</span>!
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#def7ec',
              color: '#03543f',
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✓ Verified Student
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.86rem', color: 'var(--gray-600, #4a5568)' }}>
            {user?.email && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0f766e', fontWeight: 600 }}>
                📧 {user.email}
              </span>
            )}
            {user?.mobile && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                • 📱 {user.mobile}
              </span>
            )}
            <span>
              • বিভাগ: <strong>{getBanglaGroup(user?.group || user?.academicGroup)}</strong>
            </span>
            <span>
              • SSC: <strong>{user?.ssc?.gpa ? Number(user.ssc.gpa).toFixed(2) : 'N/A'}</strong>
            </span>
            <span>
              • HSC: <strong>{user?.hsc?.gpa ? Number(user.hsc.gpa).toFixed(2) : 'N/A'}</strong>
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="dashboard-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Dedicated View Full Profile Button */}
          <button
            type="button"
            onClick={handleOpenStudentProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f0fdfa',
              color: '#0f766e',
              border: '1.5px solid #0d9488',
              borderRadius: '12px',
              padding: '0.75rem 1.15rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.1)'
            }}
            title="আপনার সম্পূর্ণ প্রোফাইল তথ্য দেখুন ও এডিট করুন"
          >
            <span style={{ fontSize: '1.15rem' }}>👤</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.86rem', lineHeight: '1.2' }}>আমার প্রোফাইল</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 600 }}>সকল তথ্য ও ফলাফল</div>
            </div>
          </button>


          {/* Ask a Doubt / Doubt Corner Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsDoubtModalOpen(true);
              fetchMyDoubts();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1.15rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
              transition: 'transform 0.2s ease',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '1.15rem' }}>❓</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.86rem', lineHeight: '1.2' }}>ডাউট কর্নার</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
                {myDoubtsList.filter(d => d.status === 'resolved' || d.solution || d.solutionText).length > 0
                  ? `💡 ${myDoubtsList.filter(d => d.status === 'resolved' || d.solution || d.solutionText).length}টি সমাধান`
                  : 'প্রশ্ন ও সমাধান'}
              </div>
            </div>
            {myDoubtsList.filter(d => d.status === 'resolved' || d.solution || d.solutionText).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#10b981',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}>
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 👑 Pro Admission Pass Status Card */}
      <div style={{
        background: user?.isPremium ? 'linear-gradient(135deg, #047857 0%, #0d9488 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '1.25rem 1.6rem',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0
          }}>
            {user?.isPremium ? '👑' : '⚡'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {user?.isPremium ? 'EduFast Pro Member (Active)' : 'Unlock Unlimited Admission Preparation'}
              </h4>
              <span style={{
                background: user?.isPremium ? '#10b981' : '#f59e0b',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                {user?.isPremium ? 'PRO ACTIVE' : 'FREE STARTER'}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              {user?.isPremium 
                ? 'আনলিমিটেড মডেল টেস্ট, বুয়েট/মেডিকেল মেন্টর ডাউট সলভ এবং ফুল কোর্স এক্সেস সক্রিয় রয়েছে।'
                : 'বিকাশ বা নগদে ৳৪৯৯ দিয়ে Pro Pass অ্যাক্টিভ করে আনলিমিটেড টেস্ট ও ২৪/৭ মেন্টর সাপোর্ট নিন!'}
            </p>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-payment-modal', {
                detail: { item: { id: 'pro_monthly', title: 'Pro Admission Pass', price: 499, type: 'subscription' } }
              }));
            }}
            style={{
              background: user?.isPremium ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: user?.isPremium ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.4)'
            }}
          >
            {user?.isPremium ? 'প্ল্যান রিনিউ / আপগ্রেড 💳' : 'বিকাশ / নগদে Pro নিন ⚡'}
          </button>
        </div>
      </div>

      {/* 🌟 Sponsored Partner University Ad Banner */}
      <SponsoredPartnerBanner />

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
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="7.5" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 1.5" fill="none" />
              <text x="12" y="15.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#78350f" fontFamily="sans-serif">৳</text>
            </svg>
          </div>
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

      {/* 🌟 COMPACT AI STUDY PLANNER SUMMARY BANNER (Clean, Fresh & Informative) */}
      {(() => {
        const tasks = focusPlan?.tasks || [];
        const completedCount = tasks.filter(t => t.done).length;
        const totalCount = tasks.length;
        const earnedCoinsToday = tasks.filter(t => t.done).reduce((sum, t) => sum + (t.coins || 20), 0);
        const totalCoinsToday = tasks.reduce((sum, t) => sum + (t.coins || 20), 0);
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allCompleted = totalCount > 0 && completedCount === totalCount;
        const hoursLeft = 23 - new Date().getHours();
        const minsLeft = 59 - new Date().getMinutes();

        return (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
            border: '1.5px solid #ccfbf1',
            borderLeft: '5px solid #0d9488',
            borderRadius: '20px',
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px -4px rgba(13, 148, 136, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Top row: Info & Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(13, 148, 136, 0.12)',
                    color: '#0d9488',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    <span>🤖 AI SMART TIMETABLE</span>
                    <span>•</span>
                    <span>২৪ ঘণ্টার দৈনিক চক্র</span>
                  </span>

                  <span style={{
                    fontSize: '0.75rem',
                    color: '#0f766e',
                    background: '#e6fffa',
                    border: '1px solid #b2f5ea',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700
                  }}>
                    ⏳ রিসেট: {hoursLeft} ঘণ্টা {minsLeft} মি. পর
                  </span>
                </div>

                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  আজকের পার্সোনালাইজড AI রিভিশন প্ল্যান
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  প্রতিটি টাস্কে ২০টি প্রশ্ন সমাধান করে দৈনিক সর্বোচ্চ {totalCoinsToday} EduCoins সংগ্রহ করুন
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsMlPredictorOpen(true)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '11px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f766e',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <span>🤖</span>
                  <span>ML চান্স প্রেডিকশন</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('study-planner')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '11px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.28)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>📅</span>
                  <span>সম্পূর্ণ স্টাডি প্ল্যানার খুলুন</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Progress & Quick Task Badges */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem 1.25rem'
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
                  <span>🎯</span>
                  <span>দৈনিক অগ্রগতি:</span>
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
                  <span>অর্জিত:</span>
                  <strong>{earnedCoinsToday} / {totalCoinsToday} Coins</strong>
                </span>
              </div>

              {/* Progress bar track */}
              <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: allCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0d9488, #3b82f6)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              {/* 4 Task quick status pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.65rem'
              }}>
                {tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate && onNavigate('study-planner')}
                    style={{
                      background: t.done ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${t.done ? '#86efac' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="ক্লিক করে স্টাডি প্ল্যানারে সমাধান করুন"
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: t.done ? '#059669' : '#0d9488',
                        marginRight: '6px'
                      }}>
                        {t.subject}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {t.task}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: t.done ? '#dcfce7' : '#e2e8f0',
                      color: t.done ? '#059669' : '#64748b',
                      flexShrink: 0
                    }}>
                      {t.done ? '✓ সম্পন্ন' : 'বাকি'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic Student Leaderboard */}
      <Leaderboard user={user} coins={coins} onNavigate={onNavigate} />



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
              const isEnrolled = Array.isArray(user?.purchasedCourses) && user.purchasedCourses.some(cid => String(cid) === String(course.id));
              const effectivePrice = course.discountedPrice !== undefined && course.discountedPrice !== null && course.discountedPrice !== ''
                ? course.discountedPrice
                : (course.price !== undefined ? course.price : 0);
              const instructorName = course.instructor || course.instructorName || 'EduFast Mentor';
              
              return (
                <div key={course.id} className="course-card" style={{ flexDirection: 'row', minHeight: '130px', alignItems: 'stretch' }}>
                  <div className="course-media" style={{ width: '120px', height: 'auto', minHeight: '120px', fontSize: '2.5rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'var(--gray-100, #f1f5f9)' }}>
                    {typeof course.image === 'string' && (course.image.startsWith('http') || course.image.startsWith('/') || course.image.startsWith('data:')) ? (
                      <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      course.image || '📚'
                    )}
                  </div>
                  <div className="course-content" style={{ padding: '1rem', justifyContent: 'center', flex: 1 }}>
                    <h4 className="course-title" style={{ fontSize: '1rem', height: 'auto', marginBottom: '0.25rem', display: 'block', WebkitLineClamp: 'none' }}>
                      {course.title}
                    </h4>
                    <span className="course-meta" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>
                      By {instructorName} {course.duration ? `• ${course.duration}` : ''}
                    </span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span className="price-new" style={{ fontSize: '1.1rem', fontWeight: 800 }}>৳ {effectivePrice}</span>
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

      {/* Ask a Doubt & Solution Corner Modal */}
      {isDoubtModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>❓</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 800 }}>
                    ২৪/৭ মেন্টর ডাউট কর্নার (Doubt Corner)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    যেকোনো বিষয়ভিত্তিক প্রশ্নের সমাধান সরাসরি বুয়েট ও ঢাবি মেন্টরদের থেকে
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDoubtModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              padding: '0 1rem'
            }}>
              <button
                type="button"
                onClick={() => setDoubtModalTab('solutions')}
                style={{
                  padding: '0.8rem 1.25rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: doubtModalTab === 'solutions' ? '3px solid #0d9488' : '3px solid transparent',
                  color: doubtModalTab === 'solutions' ? '#0d9488' : '#64748b',
                  fontWeight: doubtModalTab === 'solutions' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>💡 আমার ডাউট ও সমাধানসমূহ</span>
                <span style={{
                  backgroundColor: doubtModalTab === 'solutions' ? '#ccfbf1' : '#f1f5f9',
                  color: doubtModalTab === 'solutions' ? '#0f766e' : '#64748b',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {myDoubtsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDoubtModalTab('ask')}
                style={{
                  padding: '0.8rem 1.25rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: doubtModalTab === 'ask' ? '3px solid #ea580c' : '3px solid transparent',
                  color: doubtModalTab === 'ask' ? '#ea580c' : '#64748b',
                  fontWeight: doubtModalTab === 'ask' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>➕ নতুন প্রশ্ন পাঠান</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {doubtModalTab === 'solutions' ? (
                <div>
                  {loadingDoubts && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      ডাউটের তালিকা লোড হচ্ছে...
                    </div>
                  )}

                  {!loadingDoubts && myDoubtsList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                      <h4 style={{ margin: '0 0 0.35rem 0', color: '#1e293b' }}>এখনো কোনো প্রশ্ন পাঠাননি</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        পড়াশোনায় কোনো বিষয়ে সমস্যা থাকলে <strong>'নতুন প্রশ্ন পাঠান'</strong> ট্যাবে ক্লিক করে মেন্টরকে জানান।
                      </p>
                      <button
                        type="button"
                        onClick={() => setDoubtModalTab('ask')}
                        style={{
                          marginTop: '1.25rem',
                          padding: '0.55rem 1.25rem',
                          backgroundColor: '#ea580c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ➕ একটি প্রশ্ন করুন
                      </button>
                    </div>
                  )}

                  {!loadingDoubts && myDoubtsList.map((doubt) => {
                    const isResolved = doubt.status === 'resolved' || doubt.solution || doubt.solutionText;
                    const solutionObj = doubt.solution || (doubt.solutionText ? {
                      text: doubt.solutionText,
                      solvedBy: doubt.claimedBy,
                      hasVoiceNote: doubt.hasVoiceNote
                    } : null);

                    return (
                      <div
                        key={doubt.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isResolved ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          marginBottom: '1.25rem',
                          boxShadow: isResolved ? '0 4px 12px rgba(16, 185, 129, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              {doubt.subject || 'General'}
                            </span>
                            {doubt.topic && (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                • {doubt.topic}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isResolved ? (
                              <span style={{
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                ✓ সমাধান সম্পন্ন (Solved)
                              </span>
                            ) : doubt.status === 'claimed' ? (
                              <span style={{
                                backgroundColor: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                👨‍🏫 মেন্টর সমাধান করছেন...
                              </span>
                            ) : (
                              <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                ⏳ মেন্টর কিউতে অপেক্ষমান
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          borderLeft: '4px solid #ea580c',
                          marginBottom: '1rem',
                          fontSize: '0.9rem',
                          color: '#1e293b',
                          lineHeight: 1.5
                        }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>
                            আপনার প্রশ্ন:
                          </div>
                          {doubt.question}
                        </div>

                        {/* Solution Section (When Resolved) */}
                        {isResolved && solutionObj && (
                          <div style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: '10px',
                            padding: '1rem',
                            marginTop: '0.75rem'
                          }}>
                            {/* Mentor details */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                                <div>
                                  <strong style={{ fontSize: '0.85rem', color: '#166534' }}>
                                    {solutionObj.solvedBy || doubt.claimedBy || 'EduFast Academic Mentor'}
                                  </strong>
                                  {solutionObj.solvedByInstitute && (
                                    <span style={{ fontSize: '0.72rem', color: '#15803d', marginLeft: '0.35rem' }}>
                                      ({solutionObj.solvedByInstitute})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {solutionObj.hasVoiceNote && (
                                <span style={{
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                }}>
                                  🎙️ ভয়েস নোট যুক্ত আছে
                                </span>
                              )}
                            </div>

                            {/* Full Solution Explanation */}
                            <div style={{
                              fontSize: '0.88rem',
                              color: '#1e293b',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-line',
                              backgroundColor: '#ffffff',
                              padding: '0.85rem',
                              borderRadius: '8px',
                              border: '1px solid #bbf7d0'
                            }}>
                              {solutionObj.text}
                            </div>

                            {/* Rating Section */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px dashed #86efac', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                                  {Number(doubt.rating) > 0 ? 'আপনার দেওয়া রেটিং:' : 'মেন্টরের সমাধান কেমন লেগেছে? রেটিং দিন:'}
                                </span>
                                {Number(doubt.rating) > 0 && (
                                  <span style={{ fontSize: '0.75rem', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #86efac' }}>
                                    🔒 {doubt.rating}.0 ★ রেট সম্পন্ন (লকড)
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {[1, 2, 3, 4, 5].map(star => {
                                  const isRated = Number(doubt.rating) > 0;
                                  const isSelected = (Number(doubt.rating) || 0) >= star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      disabled={isRated}
                                      onClick={() => !isRated && handleRateDoubt(doubt.id, star)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: isRated ? 'default' : 'pointer',
                                        fontSize: '1.35rem',
                                        color: isSelected ? '#f59e0b' : '#cbd5e1',
                                        padding: '2px',
                                        transition: isRated ? 'none' : 'transform 0.15s ease, color 0.15s ease',
                                        opacity: isRated && !isSelected ? 0.35 : 1
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isRated) e.currentTarget.style.transform = 'scale(1.25)';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isRated) e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                      title={isRated ? `রেটিং লকড (${doubt.rating} Star দেওয়া হয়েছে)` : `${star} Star রেটিং দিন`}
                                    >
                                      ★
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Ask a Doubt Form */
                <form onSubmit={handleDoubtSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      বিষয় (Subject) *
                    </label>
                    <select
                      value={doubtForm.subject}
                      onChange={e => setDoubtForm({ ...doubtForm, subject: e.target.value })}
                      className="form-select"
                    >
                      <option value="Physics">Physics (পদার্থবিজ্ঞান)</option>
                      <option value="Chemistry">Chemistry (রসায়ন)</option>
                      <option value="Higher Math">Higher Math (উচ্চতর গণিত)</option>
                      <option value="Biology">Biology (জীববিজ্ঞান)</option>
                      <option value="English">English (ইংরেজি)</option>
                      <option value="Bangla">Bangla (বাংলা)</option>
                      <option value="Accounting">Accounting (হিসাববিজ্ঞান)</option>
                      <option value="Finance">Finance (ফিন্যান্স)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      টপিক বা অধ্যায় (Topic / Chapter)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ভেক্টর, নিউটনিয়ান বলবিদ্যা, জৈব রসায়ন, ত্রিকোণমিতি..."
                      value={doubtForm.topic}
                      onChange={e => setDoubtForm({ ...doubtForm, topic: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      আপনার প্রশ্ন বা সমস্যা বিস্তারিত লিখুন *
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder="প্রশ্নটি পরিষ্কারভাবে ব্যাখ্যা করুন যাতে মেন্টর নির্ভুল ও স্পষ্ট সমাধান দিতে পারেন..."
                      value={doubtForm.question}
                      onChange={e => setDoubtForm({ ...doubtForm, question: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setDoubtModalTab('solutions')}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                    >
                      পূর্ববর্তী সমাধান দেখুন
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingDoubt}
                      style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #ea580c, #c2410c)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isSubmittingDoubt ? 'পাঠানো হচ্ছে...' : 'মেন্টরকে পাঠান 🚀'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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

