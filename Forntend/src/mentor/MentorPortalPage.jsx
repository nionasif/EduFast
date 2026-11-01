import React, { useState, useEffect } from 'react';
import './mentor.css';
import api from '../services/api';
import { socket } from '../socket';
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
import BroadcastNoticeBanner from '../common/components/BroadcastNoticeBanner';

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
    if (onExitToPublic) {
      onExitToPublic('landing');
    }
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

  // Real-time live rating change notification state
  const [lastRatedEvent, setLastRatedEvent] = useState(null);

  // Load doubts from server and listen for real-time updates
  const fetchLiveDoubts = async () => {
    try {
      const res = await api.get('/doubts');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setDoubts(data);
      } else {
        const local = getDoubtsQueue();
        if (local && local.length > 0) setDoubts(local);
      }
    } catch (err) {
      console.warn('Backend doubts load notice:', err.message);
      const local = getDoubtsQueue();
      if (local && local.length > 0) setDoubts(local);
    }
  };

  useEffect(() => {
    fetchLiveDoubts();

    const handleDataUpdate = (e) => {
      if (e.detail?.type === 'doubts_queue') {
        fetchLiveDoubts();
        if (e.detail.action === 'rate' && e.detail.doubt) {
          setDoubts(prev => prev.map(d => d.id === e.detail.doubtId ? { ...d, rating: e.detail.rating } : d));
          setLastRatedEvent({
            stars: e.detail.rating,
            doubtId: e.detail.doubtId,
            time: Date.now()
          });
        }
      }
    };
    window.addEventListener('edufast-data-update', handleDataUpdate);

    const handleStorageChange = (e) => {
      if (e.key === 'edufast_doubts_queue') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDoubts(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Socket.IO real-time doubt & rating notifications
    try {
      socket.on('doubt:new', (newDoubt) => {
        setDoubts(prev => [newDoubt, ...prev.filter(d => d.id !== newDoubt.id)]);
      });
      socket.on('doubt:updated', (updated) => {
        setDoubts(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      });
      socket.on('doubt:claimed', (claimedDoubt) => {
        setDoubts(prev => prev.map(d => d.id === claimedDoubt.id ? { ...d, ...claimedDoubt } : d));
      });
      socket.on('doubt:released', (releasedDoubt) => {
        setDoubts(prev => prev.map(d => d.id === releasedDoubt.id ? { ...d, ...releasedDoubt } : d));
      });
      socket.on('doubt:resolved', (resolvedDoubt) => {
        setDoubts(prev => prev.map(d => d.id === resolvedDoubt.id ? { ...d, ...resolvedDoubt } : d));
      });
      socket.on('doubt:escalated', (escalatedDoubt) => {
        setDoubts(prev => prev.map(d => d.id === escalatedDoubt.id ? { ...d, ...escalatedDoubt } : d));
      });
      socket.on('doubt:rated', (data) => {
        if (data?.doubtId && data?.rating) {
          setDoubts(prev => prev.map(d => d.id === data.doubtId ? { ...d, rating: data.rating } : d));
          setLastRatedEvent({
            stars: data.rating,
            doubtId: data.doubtId,
            mentorRating: data.mentorRating,
            time: Date.now()
          });
        }
      });
      socket.on('mentor:rating_updated', (data) => {
        if (data?.newRating) {
          setMentorProfile(prev => {
            const next = { ...prev, rating: data.newRating };
            localStorage.setItem('edufast_mentor_session', JSON.stringify(next));
            return next;
          });
        }
      });
    } catch {}

    return () => {
      window.removeEventListener('edufast-data-update', handleDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      try {
        socket.off('doubt:new');
        socket.off('doubt:updated');
        socket.off('doubt:claimed');
        socket.off('doubt:released');
        socket.off('doubt:resolved');
        socket.off('doubt:escalated');
        socket.off('doubt:rated');
        socket.off('mentor:rating_updated');
      } catch {}
    };
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
    const cleanClaimed = (d.claimedBy || '').trim().toLowerCase();
    const cleanSolved = (d.solution?.solvedBy || '').trim().toLowerCase();
    
    const claimedMatch = cleanClaimed && (
      cleanClaimed === myName ||
      (myName && cleanClaimed.includes(myName)) ||
      (myName && myName.includes(cleanClaimed))
    );
    const solvedMatch = cleanSolved && (
      cleanSolved === myName ||
      (myName && cleanSolved.includes(myName)) ||
      (myName && myName.includes(cleanSolved))
    );
    const emailMatch = (d.claimedEmail && d.claimedEmail.toLowerCase() === myEmail) || 
                       (d.solution?.solvedByEmail && d.solution.solvedByEmail.toLowerCase() === myEmail);
    return Boolean(claimedMatch || solvedMatch || emailMatch);
  };

  const myResolvedDoubts = doubts.filter(isMyResolved);
  const myRatedDoubts = myResolvedDoubts.filter(d => typeof d.rating === 'number' && d.rating > 0);
  const totalReviewStars = myRatedDoubts.reduce((sum, d) => sum + Number(d.rating), 0);
  const myAvgRating = myRatedDoubts.length > 0 
    ? (totalReviewStars / myRatedDoubts.length).toFixed(1)
    : (mentorProfile?.rating > 0 ? Number(mentorProfile.rating).toFixed(1) : '5.0');

  const visibleQueue = doubts.filter(d => {
    // Only pending (unclaimed) doubts are shown in the public Live Queue
    if (d.status !== 'pending') return false;
    if (activeSubjectFilter === 'All') return true;
    return (d.subject || '').toLowerCase() === activeSubjectFilter.toLowerCase();
  });

  // Handle Claim Doubt (Exclusive Lock)
  const handleClaim = async (doubt) => {
    try {
      const res = await api.post(`/doubts/${doubt.id}/claim`, {
        mentorName: mentorProfile.name,
        mentorEmail: mentorProfile.email
      });
      const data = res.data || res;
      if (data && data.success) {
        const claimedObj = data.doubt || {
          ...doubt,
          status: 'claimed',
          claimedBy: mentorProfile.name,
          claimedEmail: mentorProfile.email
        };
        claimDoubt(doubt.id, mentorProfile.name);
        setDoubts(prev => prev.map(d => d.id === doubt.id ? claimedObj : d));
        setSelectedDoubt(claimedObj);
        setActiveTab('solver');
        setSolutionText('');
        setHasVoiceNote(false);
      }
    } catch (err) {
      console.warn('Claim doubt API error:', err);
      const errMsg = err.response?.data?.error || 'এই প্রশ্নটি ইতোমধ্যে অন্য একজন মেন্টর ক্লেইম করেছেন!';
      alert(errMsg);
      fetchLiveDoubts();
    }
  };

  // Handle Release Doubt back to Live Queue
  const handleReleaseDoubt = async () => {
    if (!selectedDoubt) return;
    const confirmRelease = window.confirm("আপনি কি এই প্রশ্নটি সলভ না করে আবার Live Queue-তে ফেরত পাঠাতে চান?");
    if (!confirmRelease) return;

    try {
      await api.post(`/doubts/${selectedDoubt.id}/release`, {
        mentorName: mentorProfile.name,
        mentorEmail: mentorProfile.email
      });
    } catch (err) {
      console.warn('Release doubt API notice:', err.message);
    }

    setDoubts(prev => prev.map(d => d.id === selectedDoubt.id ? { ...d, status: 'pending', claimedBy: null, claimedEmail: null } : d));
    setSelectedDoubt(null);
    setSolutionText('');
    setHasVoiceNote(false);
    setActiveTab('queue');
    fetchLiveDoubts();
  };

  // Insert Math Symbol to solution
  const insertSymbol = (sym) => {
    setSolutionText(prev => prev + ' ' + sym + ' ');
  };

  // Handle Send Solution
  const handleSendSolution = async (e) => {
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

    try {
      await api.post(`/doubts/${selectedDoubt.id}/reply`, {
        solutionText: solutionText.trim(),
        hasVoiceNote: hasVoiceNote,
        mentorName: mentorProfile.name,
        mentorEmail: mentorProfile.email
      });
    } catch (err) {
      console.warn('Resolve doubt API notice:', err.message);
    }

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

    fetchLiveDoubts();
    setSelectedDoubt(null);
    setSolutionText('');
    setHasVoiceNote(false);
    setActiveTab('queue');
  };

  // Handle Escalate to Master Teacher
  const handleEscalate = async () => {
    if (!selectedDoubt) return;
    const reason = prompt("Enter escalation reason for Senior Master Instructor:", "Syllabus anomaly / Multi-concept BUET written question requiring master review");
    if (!reason) return;

    try {
      await api.post(`/doubts/${selectedDoubt.id}/escalate`, {
        reason,
        mentorName: mentorProfile.name,
        mentorEmail: mentorProfile.email
      });
    } catch (err) {
      console.warn('Escalate doubt API notice:', err.message);
    }

    escalateDoubt(selectedDoubt.id, reason);
    setDoubts(prev => prev.map(d => d.id === selectedDoubt.id ? { ...d, status: 'escalated', escalationReason: reason } : d));
    setSelectedDoubt(null);
    setSolutionText('');
    setHasVoiceNote(false);
    setActiveTab('escalated');
    fetchLiveDoubts();
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
      {/* 0. Top Broadcast Notice Banner */}
      <BroadcastNoticeBanner />
      
      {/* 1. TOPBAR */}
      <header className="mentor-topbar">
        <div 
          className="mentor-brand" 
          onClick={onExitToPublic}
          style={{ cursor: 'pointer' }}
          title="হোম পেজে যান (Go to Home Page)"
        >
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

          <div 
            className="mentor-stat-card"
            style={{
              border: lastRatedEvent ? '1px solid rgba(16, 185, 129, 0.6)' : undefined,
              boxShadow: lastRatedEvent ? '0 0 15px rgba(16, 185, 129, 0.2)' : undefined,
              transition: 'all 0.4s ease'
            }}
          >
            <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              ⭐
            </div>
            <div>
              <div className="stat-val" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ 
                  color: Number(myAvgRating) >= 4.5 ? '#34d399' : Number(myAvgRating) >= 3.5 ? '#f59e0b' : '#f87171' 
                }}>
                  {myAvgRating} / 5.0
                </span>
                {myRatedDoubts.length > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    backgroundColor: Number(myAvgRating) >= 4.5 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: Number(myAvgRating) >= 4.5 ? '#34d399' : '#f59e0b'
                  }}>
                    {Number(myAvgRating) >= 4.5 ? '★ Excellent' : '★ Good'}
                  </span>
                )}
              </div>
              <div className="stat-lbl" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Student Satisfaction</span>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  ({myRatedDoubts.length}টি রিভিউ)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE RATING CHANGE ALERT BANNER */}
        {lastRatedEvent && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.35))',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⭐</span>
              <div>
                <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.92rem' }}>
                  লাইভ রেটিং আপডেট! একজন শিক্ষার্থী আপনার সমাধানে {lastRatedEvent.stars}★ রেটিং দিয়েছেন।
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  আপনার বর্তমান লাইভ স্যাটিসফ্যাকশন স্কোর: <strong style={{ color: '#fbbf24', fontSize: '0.85rem' }}>{myAvgRating} / 5.0</strong> ({myRatedDoubts.length}টি শিক্ষার্থী মূল্যায়নের ভিত্তিতে লাইভ আপডেটেড)
                </div>
              </div>
            </div>
            <button 
              onClick={() => setLastRatedEvent(null)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f8fafc',
                cursor: 'pointer',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              বন্ধ করুন ✕
            </button>
          </div>
        )}

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
                      onClick={handleReleaseDoubt}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease'
                      }}
                      title="Release this question back to Live Queue for other mentors"
                    >
                      ↩️ Release to Queue
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
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💬 Live Student Feedback & Reviews</span>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                  গড় রেটিং: {myAvgRating} ⭐ ({myRatedDoubts.length}টি রিভিউ)
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
                {myRatedDoubts.length > 0 ? (
                  myRatedDoubts.map(d => (
                    <div key={d.id} style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                          {d.studentName || 'শিক্ষার্থী'} • <span style={{ color: '#38bdf8' }}>{d.subject}</span>
                        </div>
                        <div style={{ color: '#f59e0b', fontSize: '0.88rem', fontWeight: 700 }}>
                          {'★'.repeat(d.rating)}{'☆'.repeat(5 - d.rating)} <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>({d.rating}.0)</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                        "{d.question?.slice(0, 75)}..."
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#34d399' }}>
                        ✅ আপনার সমাধান: "{(d.solutionText || d.solution?.text || '').slice(0, 60)}..."
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
                    এখনো কোনো শিক্ষার্থী রিভিউ পাওয়া যায়নি। সমাধানগুলো রেট করা হলে এখানে লাইভ প্রদর্শিত হবে।
                  </div>
                )}
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
