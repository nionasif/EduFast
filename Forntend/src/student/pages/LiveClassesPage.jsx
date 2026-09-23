import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Calendar, Clock, Users, Bell, BellCheck, Play, Send, 
  Hand, MessageSquare, Award, X, Video, FileText, Download, Trash2
} from 'lucide-react';
import { getLiveClasses, fetchLiveClassesFromBackend, getTeacherRecordings, fetchRecordingsFromBackend, deleteTeacherRecording } from '../../data/mockData';
import { socket } from '../../socket';

export default function LiveClassesPage() {
  const [pageMode, setPageMode] = useState('live'); // 'live' | 'recordings'
  const [liveSessions, setLiveSessions] = useState(() => getLiveClasses());
  const [recordings, setRecordings] = useState(() => getTeacherRecordings());
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [activeRecordingForPlayer, setActiveRecordingForPlayer] = useState(null);
  const [reminders, setReminders] = useState(() => {
    try {
      const stored = localStorage.getItem('edufast_live_reminders');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [studentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('edufast_student_session');
      return stored ? JSON.parse(stored) : { name: 'শিক্ষার্থী', role: 'Student' };
    } catch {
      return { name: 'শিক্ষার্থী', role: 'Student' };
    }
  });

  // Active live room state
  const [activeSession, setActiveSession] = useState(() => {
    const list = getLiveClasses();
    const liveOne = list.find(s => (s.status || '').toUpperCase() === 'LIVE');
    return liveOne || list[0] || null;
  });
  const [isInLiveRoom, setIsInLiveRoom] = useState(false);

  // Real-Time Classroom Stage State
  const [teacherMode, setTeacherMode] = useState('whiteboard'); // 'whiteboard' | 'slides'
  const [teacherMedia, setTeacherMedia] = useState({
    isCamOn: true,
    isMicOn: true,
    isScreenSharing: false,
    teacherName: 'ইন্সট্রাক্টর'
  });
  const [activePoll, setActivePoll] = useState(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);

  // Whiteboard Canvas Reference for Student
  const studentWhiteboardRef = useRef(null);

  // Live room chat & interaction
  const [messages, setMessages] = useState([
    { id: 1, sender: 'সিস্টেম নোটিশ', role: 'System', text: 'লাইভ ক্লাসরুমে স্বাগতম! শিক্ষকের বক্তব্য শুনুন এবং প্রশ্ন থাকলে চ্যাট বা হ্যান্ড-রেইজ ব্যবহার করুন।', time: 'এখন' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [viewerCount, setViewerCount] = useState(() => (activeSession?.registeredCount || 1));
  const chatEndRef = useRef(null);

  // Initial Sync on Mount from backend REST API & Active Status
  useEffect(() => {
    fetchLiveClassesFromBackend().then(classes => {
      if (classes && classes.length > 0) {
        setLiveSessions(classes);
        const liveNow = classes.find(c => (c.status || '').toUpperCase() === 'LIVE');
        if (liveNow) setActiveSession(liveNow);
      }
    });

    // Also fetch recordings from backend
    fetchRecordingsFromBackend().then(recs => {
      if (recs && Array.isArray(recs)) {
        setRecordings(recs);
      }
    });

    // Check active class from REST API
    fetch('http://localhost:5001/api/live/active')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.activeLiveClass && (data.activeLiveClass.status || '').toUpperCase() === 'LIVE') {
          const active = data.activeLiveClass;
          setActiveSession(active);
          setLiveSessions(prev => {
            const exists = prev.find(s => s.id === active.id);
            return exists ? prev.map(s => s.id === active.id ? { ...s, ...active } : s) : [active, ...prev];
          });
        }
      })
      .catch(() => {});

    // Also ask Socket if connected
    try {
      socket.emit('class:get_active', (active) => {
        if (active && (active.status || '').toUpperCase() === 'LIVE') {
          setActiveSession(active);
          setLiveSessions(prev => {
            const exists = prev.find(s => s.id === active.id);
            return exists ? prev.map(s => s.id === active.id ? { ...s, ...active } : s) : [active, ...prev];
          });
        }
      });
    } catch {}
  }, []);

  // Real-time synchronization via Socket.io and Cross-Tab Storage
  useEffect(() => {
    const handleDataUpdate = () => {
      const refreshed = getLiveClasses();
      setLiveSessions(refreshed);
      setRecordings(getTeacherRecordings());
      const liveOne = refreshed.find(c => (c.status || '').toUpperCase() === 'LIVE');
      if (liveOne) {
        setActiveSession(liveOne);
      } else {
        setActiveSession(null);
      }
    };

    // Socket.io: Teacher starts or ends a live class
    const handleSocketStatusChange = (session) => {
      if (!session) return;
      if (session.status === 'LIVE') {
        setLiveSessions(prev => {
          const exists = prev.find(c => c.id === session.id);
          const updated = exists ? prev.map(c => c.id === session.id ? { ...c, ...session } : c) : [session, ...prev];
          try { localStorage.setItem('edufast_live_classes', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        setActiveSession(session);
      } else if (session.status === 'ENDED') {
        setLiveSessions(prev => {
          const updated = prev.filter(c => String(c.id) !== String(session.id));
          try { localStorage.setItem('edufast_live_classes', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        if (session.recording) {
          setRecordings(prev => {
            const exists = prev.find(r => r.id === session.recording.id);
            const updated = exists ? prev.map(r => r.id === session.recording.id ? { ...r, ...session.recording } : r) : [session.recording, ...prev];
            try { localStorage.setItem('edufast_teacher_recordings', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
        fetchRecordingsFromBackend().then(recs => {
          if (recs && Array.isArray(recs)) setRecordings(recs);
        });
        if (activeSession && String(activeSession.id) === String(session.id)) {
          setIsInLiveRoom(false);
          setActiveSession(null);
          setPageMode('recordings');
          alert('আজকের লাইভ ক্লাস সমাপ্ত হয়েছে। এটি স্বয়ংক্রিয়ভাবে রেকর্ডেড ক্লাস ট্যাবে যুক্ত হয়েছে!');
        }
      }
    };

    const handleNewRecording = (rec) => {
      if (!rec) return;
      setRecordings(prev => {
        const exists = prev.find(r => r.id === rec.id);
        const updated = exists ? prev.map(r => r.id === rec.id ? { ...r, ...rec } : r) : [rec, ...prev];
        try { localStorage.setItem('edufast_teacher_recordings', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    };

    const handleDeletedRecording = ({ id }) => {
      if (!id) return;
      setRecordings(prev => {
        const updated = prev.filter(r => String(r.id) !== String(id));
        try { localStorage.setItem('edufast_teacher_recordings', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    };

    // Listen to local custom event & storage
    window.addEventListener('edufast-data-update', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    socket.on('class:status_change', handleSocketStatusChange);
    socket.on('recording:new', handleNewRecording);
    socket.on('recording:deleted', handleDeletedRecording);

    // Listen to real-time whiteboard drawing from teacher
    const handleDrawStroke = (strokeData) => {
      const canvas = studentWhiteboardRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const x = strokeData.normX * w;
      const y = strokeData.normY * h;

      if (strokeData.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else if (strokeData.type === 'draw') {
        if (strokeData.tool === 'pen') {
          ctx.strokeStyle = strokeData.color || '#319795';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else if (strokeData.tool === 'eraser') {
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(x - 15, y - 15, 30, 30);
        }
      } else if (strokeData.type === 'stop') {
        ctx.beginPath();
      }
    };

    const handleClearCanvas = () => {
      const canvas = studentWhiteboardRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleIncomingMessage = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleModeChange = (data) => {
      if (data?.mode) setTeacherMode(data.mode);
    };

    const handleMediaStatus = (data) => {
      if (data) setTeacherMedia(prev => ({ ...prev, ...data }));
    };

    const handlePoll = (poll) => {
      setActivePoll(poll);
      setHasVotedPoll(false);
      setSelectedPollOption(null);
    };

    const handlePollUpdate = ({ votes }) => {
      setActivePoll(prev => prev ? { ...prev, votes } : null);
    };

    const handlePollResolved = () => {
      setActivePoll(null);
    };

    socket.on('class:draw_stroke', handleDrawStroke);
    socket.on('class:clear_board', handleClearCanvas);
    socket.on('chat:new_message', handleIncomingMessage);
    socket.on('class:mode_change', handleModeChange);
    socket.on('class:media_status', handleMediaStatus);
    socket.on('poll:new', handlePoll);
    socket.on('poll:vote_update', handlePollUpdate);
    socket.on('poll:resolved', handlePollResolved);

    return () => {
      window.removeEventListener('edufast-data-update', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      socket.off('class:status_change', handleSocketStatusChange);
      socket.off('class:draw_stroke', handleDrawStroke);
      socket.off('class:clear_board', handleClearCanvas);
      socket.off('chat:new_message', handleIncomingMessage);
      socket.off('class:mode_change', handleModeChange);
      socket.off('class:media_status', handleMediaStatus);
      socket.off('poll:new', handlePoll);
      socket.off('poll:vote_update', handlePollUpdate);
      socket.off('poll:resolved', handlePollResolved);
      socket.off('recording:new', handleNewRecording);
      socket.off('recording:deleted', handleDeletedRecording);
    };
  }, [activeSession]);

  // Resize canvas when classroom opens
  useEffect(() => {
    if (isInLiveRoom && teacherMode === 'whiteboard' && studentWhiteboardRef.current) {
      const canvas = studentWhiteboardRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement?.clientWidth || 720;
      canvas.height = canvas.parentElement?.clientHeight || 460;
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isInLiveRoom, teacherMode]);

  useEffect(() => {
    if (isInLiveRoom) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInLiveRoom]);

  const toggleReminder = (sessionId) => {
    setReminders(prev => {
      const updated = { ...prev, [sessionId]: !prev[sessionId] };
      localStorage.setItem('edufast_live_reminders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: studentUser?.name || 'শিক্ষার্থী',
      role: 'Student',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    try {
      socket.emit('chat:send_message', newMsg);
    } catch {}
  };

  const handleToggleHandRaise = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (nextState) {
      try {
        socket.emit('class:raise_hand', {
          id: studentUser?.id || studentUser?.email || 'student',
          name: studentUser?.name || 'শিক্ষার্থী'
        });
      } catch {}
    }
  };

  const handleVotePoll = (optionIndex) => {
    if (hasVotedPoll) return;
    setHasVotedPoll(true);
    setSelectedPollOption(optionIndex);
    try {
      socket.emit('poll:vote', { optionIndex });
    } catch {}
  };

  const handleTriggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions(prev => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const filteredSessions = liveSessions
    .filter(s => (s.status || '').toUpperCase() !== 'ENDED')
    .filter(s => {
      if (selectedGroup === 'All') return true;
      return s.group === selectedGroup;
    });

  const filteredRecordings = recordings.filter(r => {
    if (selectedGroup === 'All') return true;
    return r.group === selectedGroup;
  });

  // Check if any session is actively live right now
  const currentlyLiveSession = liveSessions.find(s => (s.status || '').toUpperCase() === 'LIVE');

  return (
    <div style={{ backgroundColor: 'var(--bg-light)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 1. Header Banner - Exact EduFast Theme */}
      <div className="course-hub-banner">
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ backgroundColor: '#e53e3e', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Radio style={{ width: '12px', height: '12px' }} /> LIVE MASTERCLASSES
            </span>
            <span className="badge badge-new" style={{ backgroundColor: 'var(--accent-yellow)', color: 'var(--text-charcoal)' }}>
              Interactive Stream & Archive
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            Live Masterclasses & Recorded Archive
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: '1.05rem', maxWidth: '800px' }}>
            দেশের শীর্ষ মেন্টরদের সাথে সরাসরি ক্লাসে অংশ নিন অথবা শিক্ষকের আপলোডকৃত হাই-ডেফিনিশন রেকর্ডেড ক্লাস দেখুন যেকোনো সময়।
          </p>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Mode Switcher: Live Sessions vs Recorded Classes */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--white)',
            padding: '0.35rem',
            borderRadius: '30px',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setPageMode('live')}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: pageMode === 'live' ? 'var(--primary-teal)' : 'transparent',
                color: pageMode === 'live' ? '#fff' : 'var(--text-charcoal)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Radio style={{ width: '15px', height: '15px' }} />
              🔴 লাইভ সেশনসমূহ ({filteredSessions.length})
            </button>
            <button
              onClick={() => setPageMode('recordings')}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: pageMode === 'recordings' ? 'var(--primary-teal)' : 'transparent',
                color: pageMode === 'recordings' ? '#fff' : 'var(--text-charcoal)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Video style={{ width: '15px', height: '15px' }} />
              📼 রেকর্ডেড ক্লাসসমূহ ({recordings.length})
            </button>
          </div>
        </div>

        {/* 🌟 PROMINENT TOP ANNOUNCEMENT BANNER: When a class is LIVE right now */}
        {currentlyLiveSession && !isInLiveRoom && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '2px solid #feb2b2',
            borderRadius: 'var(--border-radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 10px 15px -3px rgba(229, 62, 62, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#e53e3e',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite'
              }}>
                <Radio style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e53e3e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ● শিক্ষক এখন লাইভ ক্লাসে আছেন
                </span>
                <h3 style={{ margin: '0.2rem 0 0.1rem 0', fontSize: '1.25rem', color: 'var(--text-charcoal)', fontWeight: 800 }}>
                  {currentlyLiveSession.title}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  ইন্সট্রাক্টর: <strong>{currentlyLiveSession.instructor || currentlyLiveSession.teacherName}</strong> • বিষয়: {currentlyLiveSession.group}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSession(currentlyLiveSession);
                setIsInLiveRoom(true);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className="btn btn-primary"
              style={{
                backgroundColor: '#e53e3e',
                borderColor: '#e53e3e',
                color: '#fff',
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '30px',
                boxShadow: '0 4px 10px rgba(229, 62, 62, 0.3)',
                cursor: 'pointer'
              }}
            >
              <Play style={{ width: '16px', height: '16px', fill: '#fff' }} />
              লাইভ ক্লাসে যোগ দিন (Join Class Now)
            </button>
          </div>
        )}

        {/* Live Classroom Container (When Open) */}
        {isInLiveRoom && activeSession && (
          <div style={{
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--primary-teal)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            marginBottom: '2.5rem'
          }}>
            {/* Live Room Top Bar */}
            <div style={{
              backgroundColor: '#0f172a',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  backgroundColor: '#e53e3e',
                  color: '#fff',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  letterSpacing: '0.05em'
                }}>
                  <Radio style={{ width: '12px', height: '12px' }} /> LIVE BROADCAST
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                    {activeSession.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ইন্সট্রাক্টর: <strong style={{ color: 'var(--primary-teal)' }}>{activeSession.instructor || teacherMedia.teacherName}</strong> • {activeSession.group} শাখা
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  <Users style={{ width: '14px', height: '14px', color: '#48bb78' }} />
                  <strong style={{ color: '#48bb78' }}>{viewerCount}</strong> জন সহপাঠী লাইভ
                </div>

                <button
                  onClick={() => setIsInLiveRoom(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', backgroundColor: '#334155', color: '#fff', border: 'none' }}
                >
                  <X style={{ width: '14px', height: '14px', marginRight: '4px' }} /> ক্লাসরুম ছাড়ুন
                </button>
              </div>
            </div>

            {/* Video, Whiteboard & Chat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) minmax(300px, 1fr)', minHeight: '520px' }}>
              {/* Stage Container */}
              <div style={{
                background: '#090d16',
                color: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRight: '1px solid #1e293b'
              }}>
                {/* Stage Header Info */}
                <div style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  borderBottom: '1px solid #1e293b',
                  zIndex: 2
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ backgroundColor: 'var(--primary-teal)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {teacherMode === 'whiteboard' ? '🖊️ শিক্ষক ডিজিটাল হোয়াইটবোর্ডে লিখছেন' : '📄 স্লাইড প্রেজেন্টেশন'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>HD 1080p • 60 FPS</span>
                  </div>

                  {handRaised && (
                    <span style={{
                      backgroundColor: 'var(--accent-yellow)',
                      color: 'var(--text-charcoal)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <Hand style={{ width: '13px', height: '13px' }} /> আপনার হাত তোলা রয়েছে
                    </span>
                  )}
                </div>

                {/* Main Visual Display (Whiteboard or Slides) */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '420px', backgroundColor: '#1a202c' }}>
                  {teacherMode === 'whiteboard' ? (
                    <canvas
                      ref={studentWhiteboardRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        backgroundColor: '#1a202c'
                      }}
                    />
                  ) : (
                    <div style={{
                      height: '100%',
                      padding: '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#1e293b',
                      color: '#fff'
                    }}>
                      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <span style={{ backgroundColor: 'var(--primary-teal)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {activeSession.group} MASTERCLASS SLIDE
                        </span>
                        <h2 style={{ fontSize: '1.6rem', margin: '1rem 0 0.5rem 0', color: '#fff' }}>
                          {activeSession.title}
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
                          শিক্ষক স্লাইড প্রেজেন্টেশন প্রদর্শন করছেন। গুরুত্বপূর্ণ পয়েন্টগুলো খাতায় নোট করে রাখুন।
                        </p>
                        <div style={{
                          backgroundColor: '#0f172a',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          marginTop: '1.5rem',
                          textAlign: 'left',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ color: 'var(--accent-yellow)', fontWeight: 700, marginBottom: '0.3rem' }}>
                            📌 মূল টপিক ও ফর্মুলা:
                          </div>
                          <div style={{ color: '#e2e8f0' }}>
                            • ভেক্টর ও গতিবিদ্যার শর্টকাট টেকনিক<br/>
                            • ঢাবি ও বুয়েট ভর্তি পরীক্ষার বিগত ২০ বছরের প্রশ্ন বিশ্লেষণ<br/>
                            • ক্যালকুলেটরের বিশেষ হ্যাকস ও ট্রিকস
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Teacher Webcam & Audio Wave Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    width: '180px',
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: '2px solid var(--primary-teal)',
                    padding: '0.65rem',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-teal)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}>
                        👨‍🏫
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                          {teacherMedia.teacherName || activeSession.instructor}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ইন্সট্রাক্টর</span>
                      </div>
                    </div>

                    {/* Animated Audio Waveform when Mic is on */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontSize: '0.68rem', color: teacherMedia.isMicOn ? '#48bb78' : '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: teacherMedia.isMicOn ? '#48bb78' : '#e53e3e'
                        }} />
                        {teacherMedia.isMicOn ? 'কথা বলছেন (Live Audio)' : 'মাইক বন্ধ'}
                      </span>

                      {teacherMedia.isMicOn && (
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
                          <span style={{ width: '2px', height: '10px', backgroundColor: '#48bb78', animation: 'pulse 0.5s infinite' }} />
                          <span style={{ width: '2px', height: '14px', backgroundColor: '#48bb78', animation: 'pulse 0.8s infinite' }} />
                          <span style={{ width: '2px', height: '8px', backgroundColor: '#48bb78', animation: 'pulse 0.6s infinite' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Reactions */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    {reactions.map(r => (
                      <div 
                        key={r.id}
                        style={{ position: 'absolute', bottom: '60px', left: `${r.left}%`, fontSize: '2rem', animation: 'fadeUp 1.5s ease-out forwards' }}
                      >
                        {r.emoji}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage Controls Bar */}
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  borderTop: '1px solid #1e293b'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={handleToggleHandRaise}
                      className="btn"
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        backgroundColor: handRaised ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.15)',
                        color: handRaised ? 'var(--text-charcoal)' : '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                        borderRadius: '20px'
                      }}
                    >
                      <Hand style={{ width: '14px', height: '14px' }} />
                      {handRaised ? 'হাত নামান' : '✋ হাত তুলুন (Raise Hand)'}
                    </button>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {['❤️', '👏', '🔥', '💡'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleTriggerReaction(emoji)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.95rem'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Radio style={{ width: '12px', height: '12px', color: '#e53e3e' }} /> স্টুডিও ব্রডকাস্ট কানেক্টেড • লেটেন্সি: 15ms
                  </span>
                </div>
              </div>

              {/* Chat & Poll Side Column */}
              <div style={{
                backgroundColor: 'var(--white)',
                borderLeft: '1px solid var(--gray-200)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '520px'
              }}>
                <div style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-charcoal)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare style={{ width: '15px', height: '15px', color: 'var(--primary-teal)' }} /> লাইভ চ্যাট ফিড
                  </span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#e6fffa', color: '#276749', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    সক্রিয়
                  </span>
                </div>

                {/* Active Quiz Poll Card (When Teacher Broadcasts Poll) */}
                {activePoll && (
                  <div style={{
                    backgroundColor: '#fffbeb',
                    borderBottom: '2px solid #fef3c7',
                    padding: '0.85rem 1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        📊 লাইভ কুইজ পোল (MCQ)
                      </span>
                      {hasVotedPoll && (
                        <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>✓ ভোট সম্পন্ন</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.6rem' }}>
                      {activePoll.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {activePoll.options.map((opt, idx) => {
                        const totalVotes = (activePoll.votes || []).reduce((a, b) => a + b, 0);
                        const optVotes = activePoll.votes?.[idx] || 0;
                        const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const isSelected = selectedPollOption === idx;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleVotePoll(idx)}
                            disabled={hasVotedPoll}
                            style={{
                              textAlign: 'left',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '6px',
                              border: `1px solid ${isSelected ? 'var(--primary-teal)' : '#e2e8f0'}`,
                              backgroundColor: isSelected ? '#e6fffa' : '#fff',
                              fontSize: '0.8rem',
                              cursor: hasVotedPoll ? 'default' : 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            {hasVotedPoll && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: `${pct}%`,
                                backgroundColor: isSelected ? 'rgba(49, 151, 149, 0.25)' : 'rgba(226, 232, 240, 0.7)',
                                zIndex: 0
                              }} />
                            )}
                            <span style={{ position: 'relative', zIndex: 1, fontWeight: isSelected ? 700 : 500 }}>
                              {opt}
                            </span>
                            {hasVotedPoll && (
                              <span style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 700, color: '#4a5568' }}>
                                {pct}% ({optVotes})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Messages List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>
                      <p style={{ margin: 0 }}>এখনো কোনো চ্যাট বার্তা নেই।</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>সরাসরি প্রশ্ন বা মন্তব্য লিখতে নিচের ইনপুট ব্যবহার করুন।</span>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: msg.role === 'Instructor' ? 'rgba(49, 151, 149, 0.08)' : msg.sender.includes('You') ? '#ebf8ff' : 'var(--bg-light)',
                        border: `1px solid ${msg.role === 'Instructor' ? 'var(--primary-teal)' : 'var(--gray-200)'}`,
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ color: msg.role === 'Instructor' ? 'var(--primary-teal)' : 'var(--text-charcoal)' }}>
                          {msg.sender} {msg.role === 'Instructor' && '👨‍🏫 (মেন্টর)'}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{msg.time}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--gray-600)', lineHeight: 1.4 }}>{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Send form */}
                <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="প্রশ্ন করুন বা মন্তব্য লিখুন..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.85rem', height: '38px' }}
                  />
                  <button type="submit" className="btn btn-teal" style={{ padding: '0 0.85rem', height: '38px' }}>
                    <Send style={{ width: '14px', height: '14px' }} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filter Navigation */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', 'Science', 'Commerce', 'Arts'].map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`btn ${selectedGroup === grp ? 'btn-teal' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', height: '36px' }}
              >
                {grp === 'All' ? 'সকল গ্রুপ ও বিষয়' : grp}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            {pageMode === 'live' ? 'আসন্ন মাস্টারক্লাস: ' : 'উপলব্ধ ক্লাস রেকর্ড: '}
            <strong style={{ color: 'var(--primary-teal)' }}>
              {pageMode === 'live' ? filteredSessions.length : filteredRecordings.length}
            </strong> টি
          </span>
        </div>

        {/* MODE 1: LIVE CLASSES GRID */}
        {pageMode === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredSessions.map((session) => {
              const isReminderSet = !!reminders[session.id];
              const scheduledDate = new Date(session.scheduledAt);
              const isLiveNow = (session.status || '').toUpperCase() === 'LIVE';

              return (
                <div
                  key={session.id}
                  style={{
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--gray-200)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Status & Group */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{
                        backgroundColor: isLiveNow ? '#fff5f5' : '#e6fffa',
                        color: isLiveNow ? '#e53e3e' : '#234e52',
                        border: `1px solid ${isLiveNow ? '#feb2b2' : '#b2f5ea'}`,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <Radio style={{ width: '12px', height: '12px' }} />
                        {isLiveNow ? 'এখন লাইভ চলছে' : 'আসন্ন শিডিউল'}
                      </span>

                      <span style={{
                        backgroundColor: 'var(--bg-light)',
                        color: 'var(--gray-600)',
                        border: '1px solid var(--gray-200)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {session.group}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-charcoal)', lineHeight: 1.4 }}>
                      {session.title}
                    </h3>

                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
                      {session.overview}
                    </p>

                    {/* Instructor Details */}
                    <div style={{
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-teal)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}>
                        {session.instructor.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-charcoal)' }}>{session.instructor}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{session.instructorTitle}</span>
                      </div>
                    </div>

                    {/* Meta Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar style={{ width: '13px', height: '13px', color: 'var(--primary-teal)' }} />
                        {scheduledDate.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock style={{ width: '13px', height: '13px', color: 'var(--cta-orange)' }} />
                        {session.duration}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users style={{ width: '13px', height: '13px', color: 'var(--primary-teal)' }} />
                        {session.registeredCount} জন আগ্রহী
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2b6cb0' }}>
                        <Award style={{ width: '13px', height: '13px' }} /> ফ্রি স্পেশাল সেশন
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                    <button
                      onClick={() => {
                        setActiveSession(session);
                        setIsInLiveRoom(true);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      <Play style={{ width: '14px', height: '14px' }} />
                      লাইভ ক্লাসে যোগ দিন
                    </button>

                    <button
                      onClick={() => toggleReminder(session.id)}
                      className="btn btn-secondary"
                      title={isReminderSet ? 'রিমাইন্ডার বন্ধ করুন' : 'রিমাইন্ডার সেট করুন'}
                      style={{
                        padding: '0.6rem 0.85rem',
                        backgroundColor: isReminderSet ? '#feebc8' : undefined,
                        borderColor: isReminderSet ? '#f6ad55' : undefined,
                        color: isReminderSet ? '#7b341e' : undefined
                      }}
                    >
                      {isReminderSet ? <BellCheck style={{ width: '16px', height: '16px', color: 'var(--cta-orange)' }} /> : <Bell style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--white)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-500)'
              }}>
                <Radio style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-charcoal)', fontSize: '1.1rem' }}>বর্তমানে কোনো লাইভ ক্লাস নেই</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>শিক্ষক নতুন ক্লাস শিডিউল করলে এখানে স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: RECORDED CLASSES GRID */}
        {pageMode === 'recordings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredRecordings.map((rec) => (
              <div
                key={rec.id}
                style={{
                  backgroundColor: 'var(--white)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--gray-200)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Thumbnail / Video Preview Bar */}
                  <div
                    onClick={() => setActiveRecordingForPlayer(rec)}
                    style={{
                      height: '170px',
                      backgroundColor: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      color: '#fff'
                    }}
                  >
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(49, 151, 149, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                      <Play style={{ width: '22px', height: '22px', marginLeft: '3px', color: '#fff' }} />
                    </div>

                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'var(--primary-teal)',
                      color: '#fff',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {rec.group}
                    </span>

                    <span style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      {rec.duration}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-charcoal)', lineHeight: 1.4 }}>
                      {rec.title}
                    </h3>
                    <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
                      {rec.description || 'সম্পূর্ণ ভিডিও লেকচার ও রিভিশন ম্যাটেরিয়াল।'}
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                      <span>📅 {rec.date}</span>
                      <span>👁️ {rec.views || 0} ভিউস</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-light)'
                }}>
                  <button
                    onClick={() => setActiveRecordingForPlayer(rec)}
                    className="btn btn-teal"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Play style={{ width: '13px', height: '13px' }} />
                    ক্লাসটি দেখুন
                  </button>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`"${rec.sheetUrl || 'লেকচার শিট'}" ডাউনলোড সম্পন্ন হয়েছে।`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      color: 'var(--primary-teal)',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    <Download style={{ width: '13px', height: '13px' }} />
                    লেকচার শিট
                  </a>
                </div>
              </div>
            ))}

            {filteredRecordings.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--white)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-500)'
              }}>
                <Video style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-charcoal)', fontSize: '1.1rem' }}>কোনো ক্লাস রেকর্ড আপলোড করা নেই</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>টিচার পোর্টাল থেকে শিক্ষক রেকর্ড প্রকাশ করলে এখানে দেখতে পারবেন।</p>
              </div>
            )}
          </div>
        )}

        {/* Student Recording Video Modal */}
        {activeRecordingForPlayer && (
          <div className="modal-backdrop" onClick={() => setActiveRecordingForPlayer(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', padding: '1.5rem' }}>
              <button className="modal-close" onClick={() => setActiveRecordingForPlayer(null)}>&times;</button>
              
              <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-charcoal)', fontSize: '1.3rem' }}>
                {activeRecordingForPlayer.title}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'block', marginBottom: '1rem' }}>
                গ্রুপ: {activeRecordingForPlayer.group} • সময়কাল: {activeRecordingForPlayer.duration}
              </span>

              <div style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '400px', marginBottom: '1rem' }}>
                {activeRecordingForPlayer.videoUrl.includes('youtube') ? (
                  <iframe
                    src={activeRecordingForPlayer.videoUrl}
                    title={activeRecordingForPlayer.title}
                    style={{ width: '100%', height: '400px', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeRecordingForPlayer.videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '400px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', maxWidth: '540px' }}>
                  {activeRecordingForPlayer.description || 'সম্পূর্ণ ভিডিও লেকচার ও রিভিশন ক্লাস।'}
                </p>
                <button
                  onClick={() => alert(`"${activeRecordingForPlayer.sheetUrl || 'লেকচার শিট'}" সফলভাবে ডাউনলোড হয়েছে।`)}
                  className="btn btn-teal"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
                >
                  <Download style={{ width: '14px', height: '14px' }} /> লেকচার শিট ডাউনলোড
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
