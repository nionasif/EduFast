import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Filter,
  Check,
  Zap,
  TrendingUp,
  Brain,
  Award,
  ChevronRight,
  Search,
  RotateCcw,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  UNIVERSITY_CATALOG,
  getEligibleUniversitiesForProfile,
  generateAdaptiveMultiExamRoutine,
  calculateCrossExamMasteryStats,
  SYLLABUS_DATABASE
} from '../../services/studyPlannerEngine';

export default function AdaptiveMultiExamPlannerWidget({
  user,
  onNavigate,
  onOpenMlPredictor,
  addToast
}) {
  const { language } = useLanguage();
  const currentUserId = user?.id || user?._id || 'guest';

  // 1. Settings State (Persisted in localStorage)
  const [selectedUnivIds, setSelectedUnivIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`edufast_planner_univs_${currentUserId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default to top 3 eligible universities for user's stream
    const eligible = getEligibleUniversitiesForProfile(user);
    return eligible.slice(0, 3).map(u => u.id);
  });

  const [totalDays, setTotalDays] = useState(() => {
    try {
      const saved = localStorage.getItem(`edufast_planner_days_${currentUserId}`);
      if (saved) return Number(saved) || 50;
    } catch (e) {}
    return 50;
  });

  const [dailyHours, setDailyHours] = useState(() => {
    try {
      const saved = localStorage.getItem(`edufast_planner_hours_${currentUserId}`);
      if (saved) return Number(saved) || 8;
    } catch (e) {}
    return 8;
  });

  const [completedTopicKeys, setCompletedTopicKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(`edufast_planner_completed_topics_${currentUserId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Current active day (1 to totalDays)
  const [selectedDay, setSelectedDay] = useState(1);

  // Sub-view within widget: 'routine' (Day-by-Day) or 'mastery' (Cross-Exam History)
  const [subView, setSubView] = useState('routine'); // 'routine' | 'mastery'

  // Search and filter for Mastery History tab
  const [masteryFilterSubject, setMasteryFilterSubject] = useState('ALL');
  const [masterySearchQuery, setMasterySearchQuery] = useState('');
  const [masteryFilterStatus, setMasteryFilterStatus] = useState('ALL'); // 'ALL' | 'DONE' | 'PENDING'

  // Eligible universities based on user's profile
  const eligibleUniversities = useMemo(() => {
    return getEligibleUniversitiesForProfile(user);
  }, [user]);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem(`edufast_planner_univs_${currentUserId}`, JSON.stringify(selectedUnivIds));
    } catch (e) {}
  }, [selectedUnivIds, currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`edufast_planner_days_${currentUserId}`, totalDays.toString());
    } catch (e) {}
  }, [totalDays, currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`edufast_planner_hours_${currentUserId}`, dailyHours.toString());
    } catch (e) {}
  }, [dailyHours, currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(`edufast_planner_completed_topics_${currentUserId}`, JSON.stringify(completedTopicKeys));
    } catch (e) {}
  }, [completedTopicKeys, currentUserId]);

  // Generate Adaptive Plan using Engine
  const adaptivePlan = useMemo(() => {
    return generateAdaptiveMultiExamRoutine({
      user,
      selectedUnivIds,
      totalDays,
      dailyHours,
      completedTopicKeys
    });
  }, [user, selectedUnivIds, totalDays, dailyHours, completedTopicKeys]);

  // Calculate Cross-Exam Mastery Stats
  const masteryStats = useMemo(() => {
    return calculateCrossExamMasteryStats({
      user,
      selectedUnivIds,
      completedTopicKeys
    });
  }, [user, selectedUnivIds, completedTopicKeys]);

  // Toggle university selection
  const handleToggleUniversity = (univId) => {
    setSelectedUnivIds(prev => {
      let updated;
      if (prev.includes(univId)) {
        if (prev.length === 1) {
          if (addToast) addToast('কমপক্ষে ১টি বিশ্ববিদ্যালয় সিলেক্ট রাখা আবশ্যক!', 'warning');
          return prev;
        }
        updated = prev.filter(id => id !== univId);
      } else {
        updated = [...prev, univId];
      }
      return updated;
    });
  };

  // Toggle session / topic completion
  const handleToggleSession = (sessionId, taskLabel, chapterKey) => {
    setCompletedTopicKeys(prev => {
      const isNowDone = !prev[sessionId];
      const updated = { ...prev, [sessionId]: isNowDone };
      
      // Also cross-credit chapter key if provided
      if (chapterKey) {
        updated[chapterKey] = isNowDone;
      }

      if (isNowDone) {
        // Award 10 EduCoins
        const currentCoins = parseInt(localStorage.getItem(`edufast_coins_${currentUserId}`) || '100', 10);
        const newCoins = currentCoins + 10;
        localStorage.setItem(`edufast_coins_${currentUserId}`, newCoins.toString());
        window.dispatchEvent(new CustomEvent('edufast-coins-update', { detail: { coins: newCoins } }));

        if (addToast) {
          addToast(`🎉 টাস্ক সম্পন্ন হয়েছে! +10 EduCoins যোগ হয়েছে (মোট: ${newCoins})`, 'success');
        }
      } else {
        if (addToast) {
          addToast('টাস্ক রি-ওপেন করা হয়েছে।', 'info');
        }
      }
      return updated;
    });
  };

  // Get active day plan
  const currentDayPlan = adaptivePlan.dailyPlans.find(p => p.dayNumber === selectedDay) || adaptivePlan.dailyPlans[0];

  // Filtered chapter list for Mastery History Tab
  const filteredMasteryList = useMemo(() => {
    return masteryStats.chapterMasteryList.filter(item => {
      const matchSearch = masterySearchQuery === '' || 
        item.chapterName.toLowerCase().includes(masterySearchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(masterySearchQuery.toLowerCase()) ||
        item.subtopics.some(st => st.toLowerCase().includes(masterySearchQuery.toLowerCase()));

      const matchSubject = masteryFilterSubject === 'ALL' || item.subject.includes(masteryFilterSubject);

      const matchStatus = masteryFilterStatus === 'ALL' ||
        (masteryFilterStatus === 'DONE' && item.isCompleted) ||
        (masteryFilterStatus === 'PENDING' && !item.isCompleted);

      return matchSearch && matchSubject && matchStatus;
    });
  }, [masteryStats, masterySearchQuery, masteryFilterSubject, masteryFilterStatus]);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderTop: '4px solid #0d9488',
      borderRadius: '20px',
      padding: '1.75rem',
      boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.06)',
      textAlign: 'left',
      marginBottom: '2rem'
    }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & STUDENT PROFILE SMART BADGE
      ────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              ⚡ ADAPTIVE MULTI-EXAM ENGINE
            </span>
            <span style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
              🎓 প্রোফাইল: {user?.group || user?.academicGroup || 'Science'}
              {user?.sscGpa ? ` • SSC: ${user.sscGpa}` : ''}
              {user?.hscGpa ? ` • HSC: ${user.hscGpa}` : ''}
            </span>
            <span style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
              🎯 প্রাইমারি ফোকাস: {adaptivePlan.primaryVarsity.shortName} (বাকি {adaptivePlan.primaryVarsity.defaultDays} দিন)
            </span>
          </div>

          <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
            {language === 'bn' 
              ? 'মাল্টি-ভার্সিটি এডাপ্টিভ স্টাডি প্ল্যানার ও ক্রস-এক্সাম ট্র্যাকার' 
              : 'Multi-Exam Adaptive Study Engine & Cross-Varsity Tracker'}
          </h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: '#64748b' }}>
            সবচেয়ে কাছের পরীক্ষাকে প্রাধান্য দিয়ে (৬৫% সময়) অন্য আবেদনকৃত ভার্সিটির পড়া ব্যালেন্সিং এবং অধ্যায়ভিত্তিক ক্রস-এক্সাম মাস্টারি হিস্টোরি
          </p>
        </div>

        {/* View Switcher: Routine vs Mastery History */}
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setSubView('routine')}
            style={{
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: subView === 'routine' ? 800 : 600,
              cursor: 'pointer',
              background: subView === 'routine' ? '#0d9488' : 'transparent',
              color: subView === 'routine' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} />
            <span>৫০ দিনের দৈনিক রুটিন</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('mastery')}
            style={{
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: subView === 'mastery' ? 800 : 600,
              cursor: 'pointer',
              background: subView === 'mastery' ? '#0d9488' : 'transparent',
              color: subView === 'mastery' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={14} />
            <span>মাস্টারি হিস্টোরি ও ওভারল্যাপ ({masteryStats.overallMasteryPct}%)</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CONFIGURATION BAR: APPLIED VARSITIES & DAILY BUDGET
      ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Applied Universities Toggle */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.6rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#0d9488" />
              <span>আপনার আবেদনকৃত / টার্গেট বিশ্ববিদ্যালয়সমূহ (ক্লিক করে নির্বাচন করুন):</span>
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              💡 আপনার স্টুডেন্ট প্রোফাইল অনুযায়ী ফিল্টারকৃত
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {eligibleUniversities.map(univ => {
              const isSelected = selectedUnivIds.includes(univ.id);
              const isPrimary = adaptivePlan.primaryVarsity.id === univ.id;

              return (
                <button
                  key={univ.id}
                  type="button"
                  onClick={() => handleToggleUniversity(univ.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                    background: isSelected ? '#f0fdfa' : '#ffffff',
                    color: isSelected ? '#0f766e' : '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{univ.logo}</span>
                  <span>{univ.shortName}</span>
                  {isPrimary && (
                    <span style={{
                      background: '#0d9488',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 800
                    }}>
                      নিকটতম (Top Priority)
                    </span>
                  )}
                  <span style={{
                    background: isSelected ? 'rgba(13, 148, 136, 0.15)' : '#f1f5f9',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}>
                    {univ.defaultDays} দিন
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Days & Hours Slider Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #e2e8f0'
        }}>
          {/* Days Remaining Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#0d9488" />
                <span>পরিকল্পিত পরীক্ষার সময়সীমা:</span>
              </span>
              <span style={{ color: '#0d9488', fontWeight: 900 }}>{totalDays} দিন</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={totalDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalDays(val);
                if (selectedDay > val) setSelectedDay(val);
              }}
              style={{ width: '100%', accentColor: '#0d9488', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>১৫ দিন (ক্র্যাশ কোর্স)</span>
              <span>৫০ দিন (স্ট্যান্ডার্ড)</span>
              <span>৯০ দিন (ফুল টার্ম)</span>
            </div>
          </div>

          {/* Daily Study Budget Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="#0284c7" />
                <span>প্রতিদিনের পড়ার সময় বাজেট:</span>
              </span>
              <span style={{ color: '#0284c7', fontWeight: 900 }}>{dailyHours} ঘণ্টা / দিন</span>
            </div>
            <input
              type="range"
              min="4"
              max="14"
              step="1"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>৪ ঘণ্টা (লাইট)</span>
              <span>৮ ঘণ্টা (অপটিমাল)</span>
              <span>১৪ ঘণ্টা (হার্ডকোর স্প্রিন্ট)</span>
            </div>
          </div>

          {/* Dynamic AI Allocation Metric */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
              🤖 AI ডাইনামিক সময় বণ্টন:
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              🎯 {adaptivePlan.primaryVarsity.shortName}: {Number((dailyHours * 0.65).toFixed(1))} ঘণ্টা (৬৫%)
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
              🔄 {adaptivePlan.secondaryVarsity.shortName}: {Number((dailyHours * 0.35).toFixed(1))} ঘণ্টা (৩৫%)
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-VIEW 1: 50-DAY DAY-BY-DAY ROUTINE VIEW
      ────────────────────────────────────────────────────────────── */}
      {subView === 'routine' ? (
        <div>
          {/* Day Selector Strip */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#0d9488" />
                <span>দিন নির্বাচন করুন (Day 1 থেকে Day {totalDays}):</span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={selectedDay <= 1}
                  onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: selectedDay <= 1 ? '#f8fafc' : '#ffffff',
                    color: selectedDay <= 1 ? '#cbd5e1' : '#334155',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: selectedDay <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ◀ আগের দিন
                </button>

                <button
                  type="button"
                  disabled={selectedDay >= totalDays}
                  onClick={() => setSelectedDay(prev => Math.min(totalDays, prev + 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: selectedDay >= totalDays ? '#f8fafc' : '#ffffff',
                    color: selectedDay >= totalDays ? '#cbd5e1' : '#334155',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: selectedDay >= totalDays ? 'not-allowed' : 'pointer'
                  }}
                >
                  পরের দিন ▶
                </button>
              </div>
            </div>

            {/* Quick Day Chips Scrollbar */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin'
            }}>
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => {
                const dayPlan = adaptivePlan.dailyPlans[dayNum - 1];
                const doneSessions = dayPlan?.sessions.filter(s => completedTopicKeys[s.id]).length || 0;
                const isAllDone = doneSessions === 3;
                const isSelected = selectedDay === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    style={{
                      minWidth: '58px',
                      padding: '6px 8px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0d9488' : (isAllDone ? '1px solid #a7f3d0' : '1px solid #e2e8f0'),
                      background: isSelected ? '#0d9488' : (isAllDone ? '#ecfdf5' : '#ffffff'),
                      color: isSelected ? '#ffffff' : (isAllDone ? '#065f46' : '#334155'),
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>দিন {dayNum}</span>
                    <span style={{
                      fontSize: '0.64rem',
                      opacity: isSelected ? 0.9 : 0.7
                    }}>
                      {isAllDone ? '✓ শেষ' : `${doneSessions}/৩`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Card */}
          {currentDayPlan && (
            <div>
              {/* Day Overview Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #0d9488 160%)',
                color: '#ffffff',
                borderRadius: '18px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      background: '#f59e0b',
                      color: '#000000',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 900
                    }}>
                      {currentDayPlan.dayTitle}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      দৈনিক পড়ার মোট সময়: <strong>{dailyHours} ঘণ্টা</strong>
                    </span>
                  </div>

                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    প্রধান ফোকাস: {currentDayPlan.primaryFocus.varsity.name} ({currentDayPlan.primaryFocus.weight})
                  </h4>

                  {currentDayPlan.primaryFocus.isShared && (
                    <div style={{ fontSize: '0.78rem', color: '#2dd4bf', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={14} />
                      <span>
                        ক্রস-এক্সাম বোনাস: আজকের পড়া <strong>{currentDayPlan.primaryFocus.sharedWith.join(', ')}</strong> পরীক্ষার সিলেবাসেও প্রযোজ্য!
                      </span>
                    </div>
                  )}
                </div>

                {/* Day Completion Counter */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '0.65rem 1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                    আজকের সেশন সম্পন্ন
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>
                    {currentDayPlan.sessions.filter(s => completedTopicKeys[s.id]).length} / 3
                  </div>
                </div>
              </div>

              {/* 3 Dedicated Study Sessions Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}>
                {currentDayPlan.sessions.map((session, sIdx) => {
                  const isDone = Boolean(completedTopicKeys[session.id]);

                  return (
                    <div
                      key={session.id}
                      style={{
                        background: isDone ? '#f0fdf4' : '#ffffff',
                        border: isDone ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1.35rem',
                        boxShadow: isDone ? '0 4px 14px rgba(34, 197, 94, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        {/* Time Slot & Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            background: session.badgeColor || '#0d9488',
                            color: '#ffffff',
                            padding: '3px 9px',
                            borderRadius: '6px'
                          }}>
                            {session.badge}
                          </span>

                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={13} color="#0d9488" />
                            <span>{session.timeSlot} ({session.duration})</span>
                          </span>
                        </div>

                        {/* Paper & Chapter Title */}
                        <div style={{ marginBottom: '0.65rem' }}>
                          <div style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            marginBottom: '4px'
                          }}>
                            📖 {session.paper} • {session.subjectShort}
                          </div>
                          <h5 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                            {session.chapterTitle}
                          </h5>
                        </div>

                        {/* Task Details */}
                        <div style={{
                          background: isDone ? '#ffffff' : '#f8fafc',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          fontSize: '0.8rem',
                          color: '#334155',
                          lineHeight: 1.45,
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{ fontWeight: 800, color: '#0f766e', marginBottom: '4px', fontSize: '0.74rem' }}>
                            📌 আজ যা যা পড়তে হবে (Detailed Subtopics):
                          </div>
                          <div>{session.taskDetails}</div>
                          {session.practiceGoal && (
                            <div style={{ marginTop: '4px', color: '#7c3aed', fontWeight: 700 }}>
                              🎯 লক্ষ্য: {session.practiceGoal}
                            </div>
                          )}
                        </div>

                        {/* Key Formulas / Highlights */}
                        {session.keyFormulas && session.keyFormulas.length > 0 && (
                          <div style={{
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.75rem',
                            color: '#1e293b'
                          }}>
                            <span style={{ fontWeight: 800, color: '#475569' }}>🧮 মূল সূত্রাবলি: </span>
                            <code style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>
                              {session.keyFormulas.join('  |  ')}
                            </code>
                          </div>
                        )}
                      </div>

                      {/* Interactive Completion Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSession(session.id, session.chapterTitle)}
                        style={{
                          border: isDone ? '1px solid #22c55e' : 'none',
                          background: isDone ? '#22c55e' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: isDone ? 'none' : '0 3px 10px rgba(13, 148, 136, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>টাস্ক সম্পন্ন হয়েছে (+10 Coins অর্জিত)</span>
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            <span>টাস্ক সম্পন্ন করুন (+10 Coins)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SUB-VIEW 2: CROSS-EXAM MASTERY HISTORY & OVERLAP VIEW
        ────────────────────────────────────────────────────────────── */
        <div>
          {/* 4 Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                মোট সিলেবাস কভারেজ
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0d9488', marginTop: '2px' }}>
                {masteryStats.totalMasteredCount} / {masteryStats.totalChapters}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 700, marginTop: '2px' }}>
                {masteryStats.overallMasteryPct}% অধ্যায় সম্পন্ন
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                কমন সিলেবাস ওভারল্যাপ
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                {masteryStats.sharedOverlapPct}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, marginTop: '2px' }}>
                একাধিক ভার্সিটিতে হুবহু কমন
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                ক্রস-প্রস্তুতিতে সময় সাশ্রয়
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
                +{masteryStats.hoursSaved} ঘণ্টা
              </div>
              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                ডুপ্লিকেট পড়া পড়ার প্রয়োজন নেই
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                টার্গেট ভার্সিটি সংখ্যা
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', marginTop: '2px' }}>
                {selectedUnivIds.length} টি
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: 700, marginTop: '2px' }}>
                সমন্বিত প্রস্তুতি সক্রিয়
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
            background: '#ffffff',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="অধ্যায় বা টপিকের নাম দিয়ে খুঁজুন..."
                value={masterySearchQuery}
                onChange={(e) => setMasterySearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.84rem',
                  color: '#1e293b'
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'সকল অধ্যায়' },
                { id: 'DONE', label: '✓ সম্পন্ন' },
                { id: 'PENDING', label: '⏳ বাকি' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setMasteryFilterStatus(st.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: masteryFilterStatus === st.id ? '#0d9488' : '#ffffff',
                    color: masteryFilterStatus === st.id ? '#ffffff' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Chapter Mastery Table */}
          <div style={{
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            background: '#ffffff'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>পত্র ও বিষয়</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>অধ্যায় ও মূল সাব-টপিক</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>স্ট্যাটাস</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>যে যে ভার্সিটিতে কমন</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasteryList.map(item => {
                  const isDone = item.isCompleted;

                  return (
                    <tr
                      key={item.key}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isDone ? 'rgba(34, 197, 94, 0.03)' : '#ffffff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Subject & Paper */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#0f172a',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          display: 'inline-block',
                          marginBottom: '3px'
                        }}>
                          {item.subject}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {item.paper}
                        </div>
                      </td>

                      {/* Chapter & Subtopics */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          অধ্যায় {item.chapterNo}: {item.chapterName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                          {item.subtopics.slice(0, 3).join(' • ')}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        {isDone ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.74rem'
                          }}>
                            <CheckCircle2 size={13} />
                            <span>সম্পন্ন (Mastered)</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.74rem'
                          }}>
                            <Circle size={13} />
                            <span>বাকি আছে</span>
                          </span>
                        )}
                      </td>

                      {/* Shared Varsities & Cross Benefit */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.applicableVarsities.map((vName, vIdx) => (
                            <span
                              key={vIdx}
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}
                            >
                              {vName}
                            </span>
                          ))}
                        </div>
                        {item.crossExamBenefits.length > 0 && isDone && (
                          <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '4px', fontWeight: 700 }}>
                            ✓ {item.crossExamBenefits.join(', ')}-এর প্রস্তুতিও অর্জিত!
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSession(item.key, item.chapterName, item.key)}
                          style={{
                            border: '1px solid #cbd5e1',
                            background: isDone ? '#ffffff' : '#0d9488',
                            color: isDone ? '#475569' : '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isDone ? 'আন-চেক' : '✓ মার্ক সম্পন্ন'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

