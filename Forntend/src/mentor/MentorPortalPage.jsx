import React, { useState, useEffect } from 'react';
import './mentor.css';
import { 
  getDoubtsQueue, 
  claimDoubt, 
  resolveDoubt, 
  escalateDoubt,
  getMentorProfile,
  saveMentorProfile,
  DEFAULT_DOUBTS 
} from '../data/mockData';
import MentorLogin from './components/MentorLogin';
import QuestionBankManager from '../common/components/QuestionBankManager';
import MentorMockTestManager from './components/MentorMockTestManager';

export default function MentorPortalPage({ onExitToPublic }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('edufast_mentor_session');
  });

  const [mentorProfile, setMentorProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_mentor_session');
      return saved ? JSON.parse(saved) : getMentorProfile();
    } catch {
      return getMentorProfile();
    }
  });

  const handleLoginSuccess = (userObj) => {
    setMentorProfile(userObj);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('edufast_mentor_session');
    setIsAuthenticated(false);
  };

  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'solver', 'escalated', 'analytics'
  const [doubts, setDoubts] = useState(getDoubtsQueue);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState('All');
  
  // Active doubt being solved in solver workspace
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Mentor Shift & Profile State
  const [isShiftOnline, setIsShiftOnline] = useState(true);
  const [shiftTimeSec, setShiftTimeSec] = useState(0);


  // Listen to cross-tab / local doubt updates
  useEffect(() => {
    const handleDataUpdate = (e) => {
      if (e.detail?.type === 'doubts_queue') {
        setDoubts(getDoubtsQueue());
      }
    };
    window.addEventListener('edufast-data-update', handleDataUpdate);
    return () => window.removeEventListener('edufast-data-update', handleDataUpdate);
  }, []);

  // Shift timer ticker
  useEffect(() => {
    if (!isShiftOnline) return;
    const interval = setInterval(() => {
      setShiftTimeSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isShiftOnline]);

  // Voice recording simulation ticker
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatShiftTime = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Filtered doubts
  const pendingDoubts = doubts.filter(d => d.status === 'pending');
  const claimedDoubts = doubts.filter(d => d.status === 'claimed');
  const escalatedDoubts = doubts.filter(d => d.status === 'escalated');
  const resolvedDoubts = doubts.filter(d => d.status === 'resolved');

  // Dynamically filter mentor's own resolved doubts and compute authentic metrics
  const isMyResolved = (d) => {
    if (d.status !== 'resolved') return false;
    const myName = (mentorProfile?.name || '').trim().toLowerCase();
    const myEmail = (mentorProfile?.email || '').trim().toLowerCase();
    const claimedMatch = d.claimedBy && d.claimedBy.trim().toLowerCase() === myName;
    const solvedMatch = d.solution?.solvedBy && d.solution.solvedBy.trim().toLowerCase() === myName;
    const emailMatch = (d.claimedEmail && d.claimedEmail.toLowerCase() === myEmail) || (d.solution?.solvedByEmail && d.solution.solvedByEmail.toLowerCase() === myEmail);
    return claimedMatch || solvedMatch || emailMatch;
  };

  const myResolvedDoubts = doubts.filter(isMyResolved);
  const myRatedDoubts = myResolvedDoubts.filter(d => typeof d.rating === 'number' && d.rating > 0);
  const myAvgRating = myRatedDoubts.length > 0 
    ? (myRatedDoubts.reduce((sum, d) => sum + d.rating, 0) / myRatedDoubts.length).toFixed(1)
    : (mentorProfile?.rating > 0 ? mentorProfile.rating : 0);

  const visibleQueue = doubts.filter(d => {
    if (d.status === 'resolved') return false;
    if (activeSubjectFilter === 'All') return true;
    return d.subject.toLowerCase() === activeSubjectFilter.toLowerCase();
  });

  // Handle Claim
  const handleClaim = (doubt) => {
    claimDoubt(doubt.id, mentorProfile.name);
    setDoubts(getDoubtsQueue());
    setSelectedDoubt({ ...doubt, status: 'claimed', claimedBy: mentorProfile.name, claimedEmail: mentorProfile.email });
    setActiveTab('solver');
    setSolutionText('');
    setHasVoiceNote(false);
  };

  // Insert Math Symbol to solution
  const insertSymbol = (sym) => {
    setSolutionText(prev => prev + ' ' + sym + ' ');
  };

  // Handle Send Solution
  const handleSendSolution = (e) => {
    e.preventDefault();
    if (!selectedDoubt) return;
    if (!solutionText.trim() && !hasVoiceNote) {
      alert('Please provide a written explanation or voice note.');
      return;
    }

    resolveDoubt(selectedDoubt.id, {
      text: solutionText.trim(),
      hasVoiceNote: hasVoiceNote,
      solvedBy: mentorProfile.name,
      solvedByEmail: mentorProfile.email,
      solvedByInstitute: mentorProfile.institution
    });

    // Increment mentor's authentic personal solved count & award 20 EduCoins
    const updatedSolvedCount = (mentorProfile?.solvedCount || 0) + 1;
    const updatedCoinsEarned = (mentorProfile?.coinsEarned || 0) + 20;
    const updatedProfile = {
      ...mentorProfile,
      solvedCount: updatedSolvedCount,
      coinsEarned: updatedCoinsEarned
    };
    setMentorProfile(updatedProfile);
    localStorage.setItem('edufast_mentor_session', JSON.stringify(updatedProfile));
    saveMentorProfile(updatedProfile);

    setDoubts(getDoubtsQueue());
    setSelectedDoubt(null);
    setSolutionText('');
    setHasVoiceNote(false);
    setActiveTab('queue');
  };

  // Handle Escalate to Master Teacher
  const handleEscalate = () => {
    if (!selectedDoubt) return;
    const reason = prompt("Enter escalation reason for Senior Master Instructor:", "Syllabus anomaly / Multi-concept BUET written question requiring master review");
    if (reason) {
      escalateDoubt(selectedDoubt.id, reason);
      setDoubts(getDoubtsQueue());
      setSelectedDoubt(null);
      setActiveTab('escalated');
    }
  };

  if (!isAuthenticated) {
    return (
      <MentorLogin
        onLoginSuccess={handleLoginSuccess}
        onExitToPublic={onExitToPublic}
      />
    );
  }

  return (
    <div className="mentor-portal-wrapper">
      
      {/* 1. TOPBAR */}
      <header className="mentor-topbar">
        <div className="mentor-brand" onClick={onExitToPublic}>
          <div className="mentor-logo-badge">⚡</div>
          <div className="mentor-title-group">
            <h1>
              EduFast 24/7 Mentor Desk
              <span className="mentor-shift-chip">
                <span className="pulse-dot" />
                {isShiftOnline ? 'Shift Active' : 'Offline'}
              </span>
            </h1>
            <p>{mentorProfile.name} • {mentorProfile.institution} {mentorProfile.subject ? `(${mentorProfile.subject})` : ''}</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <div className="mentor-nav-tabs">
          <button 
            className={`mentor-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            📥 Live Doubt Queue
            {pendingDoubts.length > 0 && <span className="tab-badge">{pendingDoubts.length}</span>}
          </button>
          <button 
            className={`mentor-tab-btn ${activeTab === 'solver' ? 'active' : ''}`}
            onClick={() => setActiveTab('solver')}
          >
            ✍️ Active Workspace
            {selectedDoubt && <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} />}
          </button>
          <button 
            className={`mentor-tab-btn ${activeTab === 'escalated' ? 'active' : ''}`}
            onClick={() => setActiveTab('escalated')}
          >
            🚨 Escalations
            {escalatedDoubts.length > 0 && <span className="tab-badge" style={{ background: '#f59e0b' }}>{escalatedDoubts.length}</span>}
          </button>
          <button 
            className={`mentor-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Squad Analytics
          </button>
          <button 
            className={`mentor-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            📑 Question Bank
          </button>
          <button 
            className={`mentor-tab-btn ${activeTab === 'mocktest' ? 'active' : ''}`}
            onClick={() => setActiveTab('mocktest')}
          >
            🎯 Mock Test Creator
          </button>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Duty Duration</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{formatShiftTime(shiftTimeSec)}</div>
          </div>

          <button
            onClick={() => setIsShiftOnline(!isShiftOnline)}
            style={{
              background: isShiftOnline ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isShiftOnline ? '#ef4444' : '#10b981'}`,
              color: isShiftOnline ? '#ef4444' : '#10b981',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isShiftOnline ? 'Take Break' : 'Resume Shift'}
          </button>

          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Sign out of Mentor Desk"
          >
            🚪 Sign Out
          </button>

          <button
            onClick={onExitToPublic}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ← Exit Desk
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="mentor-content-body">
        
        {/* SUMMARY STATS ROW */}
        <section className="mentor-stats-row">
          <div className="mentor-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
              📥
            </div>
            <div>
              <div className="stat-val">{pendingDoubts.length}</div>
              <div className="stat-lbl">Waiting in Queue</div>
            </div>
          </div>

          <div className="mentor-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              ✅
            </div>
            <div>
              <div className="stat-val">{myResolvedDoubts.length}</div>
              <div className="stat-lbl">Your Solved Doubts</div>
            </div>
          </div>

          <div className="mentor-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              ⚡
            </div>
            <div>
              <div className="stat-val">{myResolvedDoubts.length > 0 ? '2.4m' : '—'}</div>
              <div className="stat-lbl">Avg Response SLA</div>
            </div>
          </div>

          <div className="mentor-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              ⭐
            </div>
            <div>
              <div className="stat-val">{myAvgRating > 0 ? `${myAvgRating} / 5.0` : 'New (০ রিভিউ)'}</div>
              <div className="stat-lbl">Student Satisfaction</div>
            </div>
          </div>
        </section>

        {/* TAB 1: LIVE DOUBT QUEUE */}
        {activeTab === 'queue' && (
          <div>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['All', 'Physics', 'Chemistry', 'Math', 'Biology'].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubjectFilter(sub)}
                    style={{
                      background: activeSubjectFilter === sub ? '#10b981' : 'rgba(255,255,255,0.05)',
                      color: activeSubjectFilter === sub ? '#000000' : '#94a3b8',
                      fontWeight: 700,
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{visibleQueue.length}</strong> active questions
              </div>
            </div>

            {/* Queue Grid */}
            <div className="doubt-grid">
              {visibleQueue.map(item => {
                const badgeClass = `badge-${item.subject.toLowerCase()}`;
                const isItemClaimed = item.status === 'claimed';
                const isItemEscalated = item.status === 'escalated';

                return (
                  <div key={item.id} className="doubt-card">
                    <div>
                      <div className="doubt-header">
                        <div className="student-info">
                          <div className="student-avatar">{item.studentAvatar || '👨‍🎓'}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted {item.time}</div>
                          </div>
                        </div>

                        <span className={`doubt-subject-badge ${badgeClass}`}>
                          {item.subject}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: 600 }}>
                        📌 Topic: {item.topic}
                      </div>

                      <div className="doubt-question-text">
                        "{item.question}"
                      </div>
                    </div>

                    <div className="doubt-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          background: item.priority === 'high' ? '#ef4444' : '#10b981' 
                        }} />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                          {item.priority} Priority
                        </span>
                      </div>

                      {isItemClaimed ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Claimed by {item.claimedBy.split(' ')[0]}</span>
                          <button 
                            className="btn-claim" 
                            style={{ background: '#3b82f6', padding: '0.35rem 0.75rem' }}
                            onClick={() => {
                              setSelectedDoubt(item);
                              setActiveTab('solver');
                            }}
                          >
                            Open
                          </button>
                        </div>
                      ) : isItemEscalated ? (
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Escalated to Master Teacher</span>
                      ) : (
                        <button className="btn-claim" onClick={() => handleClaim(item)}>
                          <span>⚡</span>
                          <span>Claim & Solve</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleQueue.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '4rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>All Doubts Solved for {activeSubjectFilter}!</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No pending student queries in this category right now. Great job squad!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE SOLVER WORKSPACE */}
        {activeTab === 'solver' && (
          <div>
            {!selectedDoubt ? (
              <div style={{ padding: '4rem 1rem', textAlign: 'center', background: 'var(--mentor-card)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✍️</div>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>No Active Doubt Selected</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Please choose or claim a student question from the Live Doubt Queue.</p>
                <button className="btn-claim" onClick={() => setActiveTab('queue')} style={{ margin: '0 auto' }}>
                  Go to Doubt Queue
                </button>
              </div>
            ) : (
              <div className="solver-container">
                
                {/* Left Pane: Student Doubt Details */}
                <div className="solver-pane">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className={`doubt-subject-badge badge-${selectedDoubt.subject.toLowerCase()}`}>
                      {selectedDoubt.subject}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Ticket #{selectedDoubt.id}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="student-avatar" style={{ width: 44, height: 44, fontSize: '1.4rem' }}>
                      {selectedDoubt.studentAvatar || '👨‍🎓'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>{selectedDoubt.studentName}</h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Asking on {selectedDoubt.topic}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #10b981', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Student's Question:
                    </div>
                    <div style={{ fontSize: '1rem', color: '#f1f5f9', lineHeight: 1.6 }}>
                      "{selectedDoubt.question}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleEscalate}
                      style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#f59e0b',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      ⚠️ Escalate to Master Teacher
                    </button>
                    
                    <button
                      onClick={() => setSelectedDoubt(null)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      Release
                    </button>
                  </div>
                </div>

                {/* Right Pane: Solution Composer */}
                <div className="solver-pane">
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🎯</span> Verified Mentor Response Editor
                  </h3>

                  {/* Formula shortcut toolbar */}
                  <div className="formula-shortcut-bar">
                    <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Formulas:</span>
                    {['∫', '∑', '√', 'π', 'θ', 'α', 'Δ', '±', 'v₀²', 'τ=Iα'].map(sym => (
                      <button key={sym} className="formula-chip" onClick={() => insertSymbol(sym)}>
                        {sym}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendSolution}>
                    <textarea
                      className="solution-textarea"
                      placeholder="ধাপে ধাপে সঠিক সমাধান ও ব্যাখ্যা লিখুন (Step 1, Step 2, গুরুত্বপূর্ণ সূত্র ও শর্টকাট)..."
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                    />

                    {/* Multimedia options (Voice note & Attachment) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Voice Note Simulator */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isRecording) {
                              setIsRecording(true);
                            } else {
                              setIsRecording(false);
                              setHasVoiceNote(true);
                            }
                          }}
                          style={{
                            background: isRecording ? '#ef4444' : (hasVoiceNote ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                            border: `1px solid ${isRecording ? '#ef4444' : (hasVoiceNote ? '#10b981' : 'rgba(255, 255, 255, 0.1)')}`,
                            color: isRecording ? '#ffffff' : (hasVoiceNote ? '#34d399' : '#cbd5e1'),
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <span>🎙️</span>
                          <span>
                            {isRecording ? `Recording (${recordingSeconds}s)... Stop` : (hasVoiceNote ? 'Voice Note Attached ✓' : 'Add Voice Note')}
                          </span>
                        </button>

                        <label style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span>📷</span> Attach Diagram / Notes
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => alert('Image attached to verified solution!')} />
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn-claim"
                        style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
                      >
                        <span>🚀</span>
                        <span>Send Solution to Student</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: ESCALATIONS TO MASTER TEACHER */}
        {activeTab === 'escalated' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>Senior Instructor Review Box</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                Questions that contain syllabus ambiguities, BUET multi-step written disputes, or advanced Olympiad level queries referred to Lead Faculty.
              </p>
            </div>

            <div className="doubt-grid">
              {escalatedDoubts.map(item => (
                <div key={item.id} className="doubt-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                  <div>
                    <div className="doubt-header">
                      <div className="student-info">
                        <div className="student-avatar">{item.studentAvatar || '👨‍🎓'}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted {item.time}</div>
                        </div>
                      </div>
                      <span className={`doubt-subject-badge badge-${item.subject.toLowerCase()}`}>{item.subject}</span>
                    </div>

                    <div className="doubt-question-text">
                      "{item.question}"
                    </div>

                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '1rem' }}>
                      <strong>Escalation Reason:</strong> {item.escalationReason || 'Assigned to Engr. Tanvir Ahmed (BUET Lead)'}
                    </div>
                  </div>

                  <div className="doubt-footer">
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Status: Under Faculty Review</span>
                    <button 
                      className="btn-claim" 
                      style={{ background: '#475569', padding: '0.35rem 0.75rem' }}
                      onClick={() => alert(`Review status tracked. Master Instructor is preparing solution for Ticket #${item.id}`)}
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}

              {escalatedDoubts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                  <p style={{ color: '#94a3b8', margin: 0 }}>No pending escalations. All queries are handled within the TA squad.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SQUAD ANALYTICS & LEADERBOARD */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Squad Leaderboard */}
            <div className="solver-pane">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#f8fafc' }}>
                🏆 24/7 TA Squad Leaderboard
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mentorProfile?.name ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 800, color: '#34d399' }}>#1</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>{mentorProfile.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{mentorProfile.institution || 'Duty Mentor'} • {mentorProfile.subject || 'Academic'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>{myResolvedDoubts.length || mentorProfile.solvedCount || 0} Solved</div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>{myAvgRating > 0 ? `${myAvgRating} ⭐` : 'New'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No active squad statistics recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Student Feedback */}
            <div className="solver-pane">
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#f8fafc' }}>
                💬 Live Student Feedback & Reviews
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
                  No student reviews received yet. Solutions rated by students will appear here in real-time.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: QUESTION BANK CREATOR & MANAGER */}
        {activeTab === 'questions' && (
          <QuestionBankManager
            roleTitle="Mentor Desk"
            userName={mentorProfile?.name || 'Mentor'}
          />
        )}

        {/* TAB 6: MOCK TEST CREATOR & EXAM BUILDER */}
        {activeTab === 'mocktest' && (
          <MentorMockTestManager
            mentorProfile={mentorProfile}
          />
        )}

      </main>

    </div>
  );
}
