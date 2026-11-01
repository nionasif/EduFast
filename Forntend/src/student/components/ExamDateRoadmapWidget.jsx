import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import AdaptiveMultiExamPlannerWidget from './AdaptiveMultiExamPlannerWidget';
import {
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  Circle,
  Flag,
  Target,
  Sparkles,
  ChevronRight,
  BookOpen,
  Award,
  Layers,
  RotateCcw,
  Zap,
  TrendingUp,
  Brain,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function ExamDateRoadmapWidget({ user, onNavigate, onOpenMlPredictor, addToast }) {
  const { language } = useLanguage();
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUnivId, setActiveUnivId] = useState('');
  const [completedTasks, setCompletedTasks] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(user?.group || 'Science');
  const [activeViewMode, setActiveViewMode] = useState('adaptive-50'); // 'adaptive-50' | 'phases-3'

  const currentUserId = user?.id || user?._id || 'guest';

  // Load completed tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`edufast_roadmap_completed_${currentUserId}`);
      if (saved) {
        setCompletedTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load completed roadmap tasks', e);
    }
  }, [currentUserId]);

  const toggleTaskCompletion = (univId, phaseIndex, taskText) => {
    setCompletedTasks(prev => {
      const key = `${univId}_p${phaseIndex}_${taskText}`;
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`edufast_roadmap_completed_${currentUserId}`, JSON.stringify(updated));
      } catch (e) {}
      if (!prev[key] && addToast) {
        addToast('🎉 মাইলস্টোন টাস্ক সম্পন্ন হয়েছে!', 'success');
      }
      return updated;
    });
  };

  const fetchRoadmap = async (groupToFetch) => {
    setLoading(true);
    try {
      const res = await api.post('/ml/exam-date-roadmap', {
        studentGroup: groupToFetch || selectedGroup
      });
      if (res.data?.success && Array.isArray(res.data.roadmap)) {
        setRoadmap(res.data.roadmap);
        if (!activeUnivId && res.data.roadmap.length > 0) {
          setActiveUnivId(res.data.roadmap[0].universityId);
        }
      }
    } catch (err) {
      console.warn('Could not load date-driven roadmap:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(selectedGroup);
  }, [selectedGroup]);

  const handleGroupChange = (newGroup) => {
    setSelectedGroup(newGroup);
    if (addToast) {
      addToast(`🎓 ${newGroup} বিভাগের উপযোগী স্টাডি প্ল্যান লোড করা হচ্ছে...`, 'info');
    }
  };

  const handleRecalculatePlan = () => {
    fetchRoadmap(selectedGroup);
    if (addToast) {
      addToast('✨ AI অ্যালগরিদম দ্বারা পরীক্ষার নতুন মাইলস্টোন প্ল্যান তৈরি হয়েছে!', 'success');
    }
  };

  const activeRoadmapItem = roadmap.find(r => r.universityId === activeUnivId) || roadmap[0];

  return (
    <div style={{
      background: 'var(--white, #ffffff)',
      border: '1px solid var(--gray-200, #e2e8f0)',
      borderTop: '4px solid #0d9488',
      borderRadius: '20px',
      padding: '1.75rem',
      boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.06)',
      textAlign: 'left'
    }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(13, 148, 136, 0.1)',
            color: '#0d9488',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            marginBottom: '0.5rem'
          }}>
            <span>📅 AI EXAM-DATE TARGET PLANNER</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{language === 'bn' ? 'পরীক্ষার তারিখভিত্তিক মাস্টার রোডম্যাপ' : 'Exam-Date Master Roadmap'}</span>
          </div>

          <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {language === 'bn' 
              ? 'টার্গেট বিশ্ববিদ্যালয়ের পরীক্ষার তারিখ অনুযায়ী দীর্ঘমেয়াদী প্রস্তুতি প্ল্যান' 
              : 'Target University Exam-Date Driven Long-Term Study Plan'}
          </h3>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            {language === 'bn'
              ? 'বাকি থাকা দিন, বিশ্ববিদ্যালয়ের মানবণ্টন ও বিগত বছরের কাট-অফ স্কোর বিশ্লেষণ করে প্রস্তুতকৃত পূর্ণাঙ্গ রোডম্যাপ'
              : 'Automated 3-Phase milestone roadmap based on pending days, exam pattern & safe target scores'}
          </p>
        </div>

        {/* Group Filter & Recalculate CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            {[
              { id: 'Science', label: 'বিজ্ঞান (Science)' },
              { id: 'Commerce', label: 'ব্যবসায় (Commerce)' },
              { id: 'Humanities', label: 'মানবিক (Arts)' }
            ].map(grp => (
              <button
                key={grp.id}
                type="button"
                onClick={() => handleGroupChange(grp.id)}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: selectedGroup === grp.id ? 800 : 600,
                  cursor: 'pointer',
                  background: selectedGroup === grp.id ? '#0d9488' : 'transparent',
                  color: selectedGroup === grp.id ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                {grp.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRecalculatePlan}
            title="AI দ্বারা প্ল্যান পুনরায় আপডেট করুন"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f766e',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0fdfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            <RotateCcw size={14} />
            <span>AI প্ল্যান রি-ক্যালকুলেট</span>
          </button>
        </div>
      </div>

      {/* 🚀 MODE SELECTOR: 3-Phase Milestone vs 50-Day Routine */}
      <div style={{
        display: 'inline-flex',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: '12px',
        gap: '4px',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveViewMode('phases-3')}
          style={{
            border: 'none',
            padding: '7px 15px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeViewMode === 'phases-3' ? 800 : 600,
            cursor: 'pointer',
            background: activeViewMode === 'phases-3' ? '#0d9488' : 'transparent',
            color: activeViewMode === 'phases-3' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Layers size={14} />
          <span>৩-ধাপের মাস্টার মাইলস্টোন রোডম্যাপ (Interactive Milestones)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewMode('adaptive-50')}
          style={{
            border: 'none',
            padding: '7px 15px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: activeViewMode === 'adaptive-50' ? 800 : 600,
            cursor: 'pointer',
            background: activeViewMode === 'adaptive-50' ? '#0d9488' : 'transparent',
            color: activeViewMode === 'adaptive-50' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} />
          <span>৫০ দিনের এডাপ্টিভ রুটিন ও ক্রস-এক্সাম ট্র্যাকার</span>
        </button>
      </div>

      {activeViewMode === 'adaptive-50' ? (
        <AdaptiveMultiExamPlannerWidget
          user={user}
          onNavigate={onNavigate}
          onOpenMlPredictor={onOpenMlPredictor}
          addToast={addToast}
        />
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              2. UNIVERSITY SELECTOR PILLS
          ────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
          🎯 আপনার টার্গেট বিশ্ববিদ্যালয় নির্বাচন করুন ({roadmap.length}টি প্রধান বিশ্ববিদ্যালয় অন্তর্ভুক্ত):
        </div>
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {roadmap.map(item => {
            const isSelected = activeUnivId === item.universityId;
            return (
              <button
                key={item.universityId}
                type="button"
                onClick={() => setActiveUnivId(item.universityId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.55rem 1.05rem',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0fdfa' : '#ffffff',
                  color: isSelected ? '#0f766e' : '#334155',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.logo}</span>
                <span>{item.universityName}</span>
                <span style={{
                  background: isSelected ? '#0d9488' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#64748b',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 800
                }}>
                  {item.daysLeft} দিন
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE UNIVERSITY HERO CARD & AI PREP METRICS
      ────────────────────────────────────────────────────────────── */}
      {activeRoadmapItem && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d9488 150%)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.75rem',
            boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Institution Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {activeRoadmapItem.logo}
                </div>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#2dd4bf',
                    fontWeight: 800,
                    marginBottom: '4px'
                  }}>
                    <Zap size={13} />
                    <span>TARGET INSTITUTION • {selectedGroup} WING</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
                    {activeRoadmapItem.universityName}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#94a3b8" />
                    <span>সম্ভাব্য পরীক্ষার তারিখ: <strong>{activeRoadmapItem.examDateFormatted}</strong></span>
                  </div>
                </div>
              </div>

              {/* Countdown Big Badge */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '0.85rem 1.4rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800, display: 'block', letterSpacing: '0.05em' }}>
                  পরীক্ষার বাকি আছে
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1, margin: '2px 0' }}>
                  {activeRoadmapItem.daysLeft} দিন
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                  স্বয়ংক্রিয় কাউন্টডাউন
                </span>
              </div>
            </div>

            {/* AI 4-Metric Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
                  <Clock size={14} color="#38bdf8" />
                  <span>দৈনিক টার্গেট পড়াশোনা</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {activeRoadmapItem.dailyHoursRecommended}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
                  <Target size={14} color="#f59e0b" />
                  <span>কাট-অফ ও সেইফ স্কোর</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {activeRoadmapItem.cutoffScore}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
                  <Brain size={14} color="#a855f7" />
                  <span>AI প্রস্তুতি স্ট্যাটাস</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2dd4bf', marginTop: '4px' }}>
                  {activeRoadmapItem.readinessLevel}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
                  <FileText size={14} color="#34d399" />
                  <span>পরীক্ষার মানবণ্টন</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginTop: '4px', lineHeight: 1.3 }}>
                  {activeRoadmapItem.examPattern}
                </div>
              </div>
            </div>

            {/* Special Strategic AI Tips */}
            {activeRoadmapItem.strategyTips && activeRoadmapItem.strategyTips.length > 0 && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(13, 148, 136, 0.15)',
                border: '1px solid rgba(45, 212, 191, 0.25)',
                borderRadius: '12px',
                padding: '0.85rem 1.1rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={14} />
                  <span>{activeRoadmapItem.universityName}-এর জন্য AI বিশেষ স্ট্র্যাটেজি ও হ্যাকস:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activeRoadmapItem.strategyTips.map((tip, idx) => (
                    <div key={idx} style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                      <span style={{ color: '#2dd4bf' }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. SUBJECT-WISE TIME ALLOCATION & HIGH-YIELD CHAPTERS
          ────────────────────────────────────────────────────────────── */}
          {activeRoadmapItem.subjectBreakdown && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                    📊 {selectedGroup} বিভাগের বিষয়ভিত্তিক AI সময় বণ্টন ও শীর্ষ অধ্যায়সমূহ
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    ভর্তি পরীক্ষায় বিগত বছরের প্রশ্নের গুরুত্ব ও ওয়েটেজ অনুযায়ী প্রস্তাবিত রুটিন
                  </p>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0f766e', background: '#f0fdfa', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                  মোট দৈনিক সময়: {activeRoadmapItem.dailyHoursRecommended}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem'
              }}>
                {activeRoadmapItem.subjectBreakdown.map((subj, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${subj.color || '#0d9488'}`,
                      borderRadius: '14px',
                      padding: '1.1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                          {subj.name}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: `${subj.color}15`,
                          color: subj.color,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {subj.weight} • {subj.dailyTime}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, margin: '8px 0 6px 0' }}>
                        📌 ভর্তি পরীক্ষায় বেশি আসা শীর্ষ অধ্যায়সমূহ:
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {subj.chapters.map((ch, cIdx) => (
                          <span
                            key={cIdx}
                            style={{
                              fontSize: '0.72rem',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('question-bank')}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: subj.color,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: 0
                        }}
                      >
                        <span>প্রশ্নব্যাংকে প্র্যাকটিস</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              5. DEEP 3-PHASE MILESTONE ROADMAP (INTERACTIVE CHECKLIST)
          ────────────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  🎯 ৩-ধাপের মাস্টার মাইলস্টোন রোডম্যাপ (Interactive Study Milestones)
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  প্রতিটি মাইলস্টোন শেষ করে চেকমার্ক দিন; আপনার অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে
                </p>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                💡 চেকমার্কে ক্লিক করে প্রগ্রেস ট্র্যাক করুন
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}>
              {activeRoadmapItem.phases.map(phase => {
                const isCurrent = phase.status === 'in-progress';
                const totalTasks = phase.tasks.length;
                const completedCount = phase.tasks.filter(t => completedTasks[`${activeRoadmapItem.universityId}_p${phase.phaseIndex}_${t}`]).length;
                const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

                return (
                  <div
                    key={phase.phaseIndex}
                    style={{
                      background: isCurrent ? '#f0fdfa' : '#ffffff',
                      border: isCurrent ? '2px solid #0d9488' : '1px solid #e2e8f0',
                      borderRadius: '18px',
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      position: 'relative',
                      boxShadow: isCurrent ? '0 8px 24px -4px rgba(13, 148, 136, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Phase Badge & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: phase.badgeColor || '#0d9488',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Layers size={13} />
                          <span>Phase {phase.phaseIndex} • {phase.durationDays}</span>
                        </span>

                        {isCurrent ? (
                          <span style={{
                            fontSize: '0.74rem',
                            color: '#0d9488',
                            background: 'rgba(13, 148, 136, 0.12)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ● চলছে (Active Focus)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            পরবর্তী ধাপ
                          </span>
                        )}
                      </div>

                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                        {phase.title}
                      </h5>

                      {/* Phase Goal Banner */}
                      <div style={{
                        background: isCurrent ? '#ffffff' : '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Target size={13} />
                          <span>সাপ্তাহিক লক্ষ্যমাত্রা:</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                          {phase.weeklyGoal}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                          <span>অগ্রগতি ({completedCount}/{totalTasks} টাস্ক)</span>
                          <span style={{ color: progressPct === 100 ? '#059669' : '#0d9488' }}>{progressPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: progressPct === 100 ? '#10b981' : (phase.badgeColor || '#0d9488'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Actionable Tasks Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {phase.tasks.map((task, tIdx) => {
                          const taskKey = `${activeRoadmapItem.universityId}_p${phase.phaseIndex}_${task}`;
                          const isDone = Boolean(completedTasks[taskKey]);

                          return (
                            <div
                              key={tIdx}
                              onClick={() => toggleTaskCompletion(activeRoadmapItem.universityId, phase.phaseIndex, task)}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '8px',
                                background: isDone ? 'rgba(16, 185, 129, 0.08)' : (isCurrent ? '#ffffff' : '#f8fafc'),
                                border: isDone ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ marginTop: '2px', color: isDone ? '#059669' : '#94a3b8' }}>
                                {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </div>
                              <span style={{
                                fontSize: '0.8rem',
                                color: isDone ? '#065f46' : '#334155',
                                textDecoration: isDone ? 'line-through' : 'none',
                                lineHeight: 1.4,
                                flex: 1
                              }}>
                                {task}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div style={{
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('mocktest')}
                        style={{
                          border: 'none',
                          background: phase.badgeColor || '#0d9488',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        <span>মক টেস্টে যান</span>
                        <ChevronRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('question-bank')}
                        style={{
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <BookOpen size={13} />
                        <span>প্রশ্নব্যাংক</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              6. GLOBAL STUDY ACTION HUB
          ────────────────────────────────────────────────────────────── */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                🚀 প্রতিদিনের শিডিউল শেষ করে প্রস্তুতি যাচাই করুন
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                EduFast AI ইঞ্জিন আপনার দৈনিক কুইজ ও মক টেস্ট পারফরম্যান্স পর্যবেক্ষণ করে স্বয়ংক্রিয়ভাবে প্ল্যান আপডেট করবে।
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('mocktest')}
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                }}
              >
                <span>✍️ মক টেস্ট সেন্টারে যান</span>
              </button>

              {onOpenMlPredictor && (
                <button
                  type="button"
                  onClick={onOpenMlPredictor}
                  style={{
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f766e',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} />
                  <span>ML চান্স প্রেডিকশন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
);
}
