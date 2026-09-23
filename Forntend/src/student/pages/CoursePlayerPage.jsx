import React, { useState, useRef, useEffect } from 'react';
import { getCourseCurriculum } from '../../data/mockData';

export default function CoursePlayerPage({ course, user, onBack, addToast }) {
  // Course curriculum state
  const [curriculum, setCurriculum] = useState(() => {
    return getCourseCurriculum(course?.id || 'demo', course?.title);
  });

  // Fetch live uploaded curriculum from SQLite database
  useEffect(() => {
    if (!course?.id) return;
    fetch(`http://localhost:5001/api/courses/${course.id}/curriculum`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCurriculum(data.data);
        }
      })
      .catch(() => {});
  }, [course?.id]);

  const resolveVideoUrl = (url) => {
    if (!url) return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    return `http://localhost:5001${url}`;
  };

  // Current selected lesson
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  // Active sub-tab under video: 'overview', 'notes', 'quiz', 'qa'
  const [activeTab, setActiveTab] = useState('overview');

  // Video playback states
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1125);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Timestamp notes state
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`edufast_notes_${course?.id}`);
      return saved ? JSON.parse(saved) : [
        { id: 1, timeSec: 45, timeStr: "00:45", text: "Fundamental vector dot product rule explained." },
        { id: 2, timeSec: 180, timeStr: "03:00", text: "Exam shortcut: Cross product right hand thumb rule." }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState([]);

  // Q&A forum state
  const [questions, setQuestions] = useState([
    {
      id: 1,
      author: "Rafid Hasan",
      avatar: "👨‍🎓",
      time: "2 hours ago",
      question: "In equation (3), why did we assume friction is static rather than kinetic?",
      answers: [
        { author: "Dr. A. K. Azad (Instructor)", role: "Instructor", text: "Because the cylinder rolls without slipping, so the instantaneous point of contact is at rest relative to the incline.", time: "1 hour ago" }
      ],
      upvotes: 8
    }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Quiz submission state for current lesson
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Certificate Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // 🌟 NEXT-GEN INNOVATION STATES
  // 1. Audio-Only / Low-Data Mode
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  // 2. Active In-Video Checkpoint Quizzes
  const [showInVideoCheckpoint, setShowInVideoCheckpoint] = useState(false);
  const [checkpointCompleted, setCheckpointCompleted] = useState(false);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState(null);

  // 3. Split-Screen Scratchpad & Formula Sheet
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => {
    try {
      return localStorage.getItem('edufast_scratchpad') || '# My Lecture Scratchpad\n- Formula: Tau = I * alpha\n- Quick note: Angular momentum conserved';
    } catch {
      return '';
    }
  });

  const currentLesson = curriculum[activeModuleIndex]?.lessons[activeLessonIndex] || curriculum[0]?.lessons[0];

  // Calculate overall completed lessons
  const totalLessons = curriculum.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = curriculum.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Video event handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Auto-trigger In-Video Checkpoint at 15s if not yet solved
    if (!checkpointCompleted && time >= 15 && time <= 16 && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowInVideoCheckpoint(true);
    }
  };

  const handleSolveCheckpoint = (optIdx) => {
    setSelectedCheckpointOption(optIdx);
    // Correct option is index 0
    if (optIdx === 0) {
      setCheckpointFeedback({
        success: true,
        message: '🎉 সঠিক উত্তর! কোণিক বেগ ধ্রুব থাকলে কোণিক ত্বরণ শূন্য হয়। +২৫ EduCoins যোগ হয়েছে!'
      });
      setCheckpointCompleted(true);
      if (addToast) addToast('⚡ Checkpoint Passed! +25 EduCoins awarded.', 'success');
    } else {
      setCheckpointFeedback({
        success: false,
        message: '❌ সঠিক হয়নি। ধারণাটি পুনর্বিবেচনা করুন: dω/dt = α। যেহেতু ω ধ্রুবক, তাই এর ডেরিভেটিভ ০।'
      });
    }
  };

  const handleResumeAfterCheckpoint = () => {
    setShowInVideoCheckpoint(false);
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSaveScratchpad = (text) => {
    setScratchpadText(text);
    try {
      localStorage.setItem('edufast_scratchpad', text);
    } catch {}
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 1125);
  };

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const jumpToTime = (timeSec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const addBookmark = () => {
    const timeStr = formatTime(currentTime);
    if (bookmarks.includes(timeStr)) return;
    setBookmarks(prev => [...prev, { timeSec: currentTime, timeStr }]);
    if (addToast) addToast(`Bookmark added at ${timeStr}`, 'success');
  };

  // Save a timestamped note
  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note = {
      id: Date.now(),
      timeSec: Math.floor(currentTime),
      timeStr: formatTime(currentTime),
      text: newNoteText.trim()
    };
    const updated = [note, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem(`edufast_notes_${course?.id}`, JSON.stringify(updated));
    } catch {}
    setNewNoteText('');
    if (addToast) addToast(`Note recorded at ${note.timeStr}`, 'success');
  };

  const handleDeleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try {
      localStorage.setItem(`edufast_notes_${course?.id}`, JSON.stringify(updated));
    } catch {}
  };

  // Submit Lesson Quiz
  const handleSelectQuizOption = (qIdx, optIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleGradeQuiz = (e) => {
    e.preventDefault();
    const quiz = currentLesson?.quiz || [];
    let correct = 0;
    quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.ans) correct++;
    });
    setQuizScore(correct);
    setQuizSubmitted(true);

    if (correct === quiz.length) {
      markCurrentLessonComplete();
      if (addToast) addToast(`Perfect score! Lecture marked as completed.`, 'success');
    } else {
      if (addToast) addToast(`You scored ${correct}/${quiz.length}. Review explanations!`, 'info');
    }
  };

  const markCurrentLessonComplete = () => {
    setCurriculum(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[activeModuleIndex].lessons[activeLessonIndex].completed = true;
      try {
        localStorage.setItem(`edufast_curriculum_${course?.id}`, JSON.stringify(copy));
      } catch {}
      return copy;
    });
  };

  // Handle Ask Question
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const item = {
      id: Date.now(),
      author: user?.name || "Candidate",
      avatar: "👨‍🎓",
      time: "Just now",
      question: newQuestionText.trim(),
      answers: [],
      upvotes: 1
    };
    setQuestions(prev => [item, ...prev]);
    setNewQuestionText('');
    if (addToast) addToast('Question posted to community forum!', 'success');
  };

  // Download Simulated PDF Sheet
  const handleDownloadSheet = (fileName) => {
    if (addToast) addToast(`Downloading: ${fileName}`, 'info');
    const content = `EduFast Platform Lecture Material\nCourse: ${course?.title}\nLecture: ${currentLesson?.title}\nInstructor: ${course?.instructor}\n\nCore Formulas & Summary:\n1. Newton's 2nd Law in rotational form: Tau = I * alpha\n2. Conservation of Mechanical Energy: E_total = K_trans + K_rot + U\n3. Rolling condition: v_cm = omega * R\n\n© 2026 EduFast Education Technologies. All rights reserved.`;
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. TOP HEADER BAR */}
      <header style={{
        height: '64px',
        background: '#111827',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            ← Exit Classroom
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{course?.title || 'EduFast Masterclass'}</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentLesson?.title}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Progress widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>{progressPercent}% Complete</span>
          </div>

          {/* Certificate Button */}
          <button
            onClick={() => setIsCertModalOpen(true)}
            style={{
              background: progressPercent >= 100 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: progressPercent >= 100 ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none'
            }}
          >
            <span>🏆</span>
            <span>{progressPercent >= 100 ? 'Claim Certificate!' : 'View Certificate'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN LEARNING ENVIRONMENT (GRID) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', flex: 1 }}>
        
        {/* LEFT COLUMN: VIDEO PLAYER & INTERACTIVE TABS */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          
          {/* VIDEO / AUDIO PLAYER CONTAINER */}
          <div style={{ position: 'relative', background: '#000000', width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            
            {!isAudioOnly ? (
              <video
                ref={videoRef}
                src={resolveVideoUrl(currentLesson?.videoUrl)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
              />
            ) : (
              /* AUDIO-ONLY LOW-DATA MODE SCREEN */
              <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at center, #0f2b26 0%, #061118 70%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1rem', boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}>
                  🎧
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.2rem' }}>
                  {currentLesson?.title}
                </h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                  <span>📶 Low-Data Audio Mode Active (Saves 95% Bandwidth)</span>
                </div>

                {/* Animated Audio Wave Simulator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
                  {[18, 32, 14, 38, 24, 40, 16, 30, 20, 36, 12, 28].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: isPlaying ? `${h}px` : '8px',
                        background: '#10b981',
                        borderRadius: '4px',
                        transition: 'height 0.2s ease',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Play/Pause Overlay Indicator on click (video mode only) */}
            {!isPlaying && !isAudioOnly && !showInVideoCheckpoint && (
              <div
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(20, 184, 166, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(20, 184, 166, 0.6)',
                  zIndex: 10
                }}
              >
                ▶
              </div>
            )}

            {/* 🌟 IN-VIDEO ACTIVE LEARNING CHECKPOINT OVERLAY MODAL */}
            {showInVideoCheckpoint && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(11, 15, 25, 0.94)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                zIndex: 30,
                textAlign: 'center'
              }}>
                <div style={{ maxWidth: '540px', width: '100%', background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    ⚡ Active Learning Concept Check!
                  </div>
                  
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.05rem', lineHeight: 1.5 }}>
                    ঘূর্ণনরত কোনো বস্তুর কৌণিক বেগ (ω) ধ্রুব থাকলে তার কৌণিক ত্বরণ (α) কত হবে?
                  </h3>
                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    ক্লাসটি চালিয়ে যাওয়ার আগে নিচের সঠিক বিকল্পটি নির্বাচন করুন:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    {[
                      { idx: 0, text: "A) শূন্য (Zero)" },
                      { idx: 1, text: "B) ধনাত্মক (Positive)" },
                      { idx: 2, text: "C) কৌণিক বেগের সমান" },
                      { idx: 3, text: "D) অসীম (Infinite)" }
                    ].map(opt => (
                      <button
                        key={opt.idx}
                        onClick={() => handleSolveCheckpoint(opt.idx)}
                        style={{
                          background: selectedCheckpointOption === opt.idx ? (opt.idx === 0 ? '#10b981' : '#ef4444') : 'rgba(255, 255, 255, 0.05)',
                          color: selectedCheckpointOption === opt.idx ? '#ffffff' : '#e2e8f0',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left'
                        }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>

                  {checkpointFeedback && (
                    <div style={{
                      background: checkpointFeedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${checkpointFeedback.success ? '#10b981' : '#ef4444'}`,
                      color: checkpointFeedback.success ? '#34d399' : '#f87171',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      marginBottom: '1rem',
                      textAlign: 'left'
                    }}>
                      {checkpointFeedback.message}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      onClick={handleResumeAfterCheckpoint}
                      style={{
                        background: checkpointCompleted ? 'linear-gradient(135deg, #10b981, #0ea5e9)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {checkpointCompleted ? 'Continue Video Lecture ▶' : 'Skip & Resume'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* CUSTOM VIDEO CONTROLS BAR */}
          <div style={{
            background: '#111827',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {/* Scrubber progress bar */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                width: '100%',
                accentColor: '#14b8a6',
                cursor: 'pointer',
                height: '5px'
              }}
            />

            {/* Control buttons & Speed Chips */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  onClick={togglePlay}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => jumpToTime(Math.max(0, currentTime - 10))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
                  title="Rewind 10s"
                >
                  ↺ 10s
                </button>
                <button
                  onClick={() => jumpToTime(Math.min(duration, currentTime + 10))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
                  title="Forward 10s"
                >
                  10s ↻
                </button>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {/* 🌟 Audio-Only Toggle Button */}
                <button
                  onClick={() => setIsAudioOnly(!isAudioOnly)}
                  style={{
                    background: isAudioOnly ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isAudioOnly ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isAudioOnly ? '#34d399' : '#f8fafc',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Save 95% mobile data"
                >
                  {isAudioOnly ? '📹 Video Mode' : '🎧 Audio Mode (Low Data)'}
                </button>

                {/* 🌟 Checkpoint Trigger Demo */}
                <button
                  onClick={() => setShowInVideoCheckpoint(true)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ⚡ Checkpoint Quiz
                </button>

                {/* 🌟 Split-Screen Scratchpad Toggle */}
                <button
                  onClick={() => setIsSplitScreen(!isSplitScreen)}
                  style={{
                    background: isSplitScreen ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isSplitScreen ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isSplitScreen ? '#38bdf8' : '#f8fafc',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📐 {isSplitScreen ? 'Close Scratchpad' : 'Split Scratchpad'}
                </button>

                {/* Bookmarking */}
                <button
                  onClick={addBookmark}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  🔖 Bookmark
                </button>

                {/* Playback Speed Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '0 0.3rem' }}>Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      style={{
                        background: playbackSpeed === speed ? '#14b8a6' : 'transparent',
                        color: playbackSpeed === speed ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.72rem',
                        fontWeight: playbackSpeed === speed ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 SPLIT SCREEN SCRATCHPAD & FORMULAS PANE */}
          {isSplitScreen && (
            <div style={{
              background: '#0d131f',
              borderBottom: '1px solid rgba(14, 165, 233, 0.3)',
              padding: '1rem 1.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📝</span> Live Synchronized Scratchpad (Markdown)
                </div>
                <textarea
                  value={scratchpadText}
                  onChange={(e) => handleSaveScratchpad(e.target.value)}
                  style={{
                    width: '100%',
                    height: '110px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                  placeholder="Type formulas or quick notes during lecture..."
                />
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📐</span> High-Yield Formula Cheat Sheet
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.65rem', height: '110px', overflowY: 'auto', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <div>• <strong>Torque:</strong> τ = I × α = r × F sin θ</div>
                  <div>• <strong>Angular Momentum:</strong> L = I × ω = r × p</div>
                  <div>• <strong>Rotational Kinetic Energy:</strong> K_rot = (1/2) I ω²</div>
                  <div>• <strong>Rolling without slipping:</strong> v_cm = ω × R, a_cm = α × R</div>
                  <div>• <strong>Moment of Inertia (Disc):</strong> I = (1/2) M R²</div>
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE LESSON TABS */}
          <div style={{ flex: 1, padding: '1.5rem', background: '#0b0f19' }}>
            {/* Tab navigation headers */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'overview' ? '#2dd4bf' : '#94a3b8',
                  fontWeight: activeTab === 'overview' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'overview' ? '2px solid #14b8a6' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                📄 Overview & Notes (PDF)
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'notes' ? '#2dd4bf' : '#94a3b8',
                  fontWeight: activeTab === 'notes' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'notes' ? '2px solid #14b8a6' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                ⏱️ Timestamp Notes ({notes.length})
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'quiz' ? '#2dd4bf' : '#94a3b8',
                  fontWeight: activeTab === 'quiz' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'quiz' ? '2px solid #14b8a6' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                📝 Lesson Mini Quiz
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'qa' ? '#2dd4bf' : '#94a3b8',
                  fontWeight: activeTab === 'qa' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'qa' ? '2px solid #14b8a6' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                💬 Q&A Forum ({questions.length})
              </button>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & DOWNLOADABLE PDFS */}
            {activeTab === 'overview' && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#f8fafc' }}>
                  {currentLesson?.title}
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Welcome to this lecture. In this module, you will master the essential theoretical definitions, vector algebra shortcuts, and examination trick formulations required for competitive tests.
                </p>

                {/* Downloadable PDF Resources Box */}
                <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📥</span> Downloadable Lecture Sheets & Worksheets
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>📄 Lecture Hand Notes</div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PDF Document • 4.2 MB</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSheet(`${currentLesson?.id || 'lesson'}_handnotes.pdf`)}
                        style={{ background: '#14b8a6', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Download
                      </button>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>📐 Formula & Trick Sheet</div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PDF Document • 1.8 MB</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSheet(`${currentLesson?.id || 'lesson'}_formulas.pdf`)}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mark as complete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2dd4bf' }}>Finished watching this lecture?</div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Mark complete to increment your certificate progress.</span>
                  </div>
                  <button
                    onClick={() => {
                      markCurrentLessonComplete();
                      if (addToast) addToast('Lecture marked completed!', 'success');
                    }}
                    style={{
                      background: currentLesson?.completed ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {currentLesson?.completed ? '✓ Completed' : 'Mark as Complete'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: TIMESTAMPS & NOTES */}
            {activeTab === 'notes' && (
              <div>
                {/* Note creation input */}
                <form onSubmit={handleSaveNote} style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#2dd4bf' }}>
                    <span>⏱️ Note at current playback:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', background: 'rgba(20, 184, 166, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {formatTime(currentTime)}
                    </span>
                  </div>
                  <textarea
                    className="admin-input"
                    rows="2"
                    placeholder="Type key takeaway or formula here..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.75rem', padding: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="admin-btn admin-btn-teal" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
                      Save Timestamped Note
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notes.map(n => (
                    <div
                      key={n.id}
                      style={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}
                    >
                      <button
                        onClick={() => jumpToTime(n.timeSec)}
                        style={{
                          background: 'rgba(20, 184, 166, 0.2)',
                          color: '#2dd4bf',
                          border: 'none',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Jump to this moment in video"
                      >
                        ▶ {n.timeStr}
                      </button>
                      <div style={{ flex: 1, fontSize: '0.88rem', color: '#f8fafc', lineHeight: 1.5 }}>
                        {n.text}
                      </div>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Delete Note"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No notes yet. Pause the video at any time to take a note!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: LESSON MINI QUIZ */}
            {activeTab === 'quiz' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Post-Lesson Concept Evaluation</h4>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Answer the questions to test your understanding before moving forward.</span>
                  </div>
                  {quizSubmitted && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.3rem 0.85rem', borderRadius: '6px' }}>
                      Score: {quizScore} / {currentLesson?.quiz?.length || 0}
                    </span>
                  )}
                </div>

                <form onSubmit={handleGradeQuiz}>
                  {(currentLesson?.quiz || []).map((q, qIdx) => (
                    <div key={qIdx} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.85rem' }}>
                        {qIdx + 1}. {q.q}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[qIdx] === optIdx;
                          let bg = 'rgba(15, 23, 42, 0.6)';
                          let border = '1px solid rgba(255,255,255,0.08)';
                          if (isSelected) {
                            bg = 'rgba(20, 184, 166, 0.2)';
                            border = '1px solid #14b8a6';
                          }
                          if (quizSubmitted) {
                            if (optIdx === q.ans) {
                              bg = 'rgba(16, 185, 129, 0.25)';
                              border = '1px solid #10b981';
                            } else if (isSelected && optIdx !== q.ans) {
                              bg = 'rgba(239, 68, 68, 0.25)';
                              border = '1px solid #ef4444';
                            }
                          }
                          return (
                            <label
                              key={optIdx}
                              onClick={() => !quizSubmitted && handleSelectQuizOption(qIdx, optIdx)}
                              style={{
                                background: bg,
                                border: border,
                                padding: '0.65rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                color: '#f8fafc',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                              }}
                            >
                              <input
                                type="radio"
                                name={`quiz-${qIdx}`}
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={quizSubmitted}
                                style={{ accentColor: '#14b8a6' }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {quizSubmitted && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '6px', fontSize: '0.82rem', color: '#93c5fd' }}>
                          💡 <strong>Explanation:</strong> {q.exp}
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    {quizSubmitted ? (
                      <button
                        type="button"
                        onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                        className="admin-btn admin-btn-secondary"
                      >
                        Retake Quiz
                      </button>
                    ) : (
                      <button type="submit" className="admin-btn admin-btn-teal" style={{ padding: '0.6rem 1.5rem' }}>
                        Submit Answers
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT 4: COMMUNITY Q&A FORUM */}
            {activeTab === 'qa' && (
              <div>
                <form onSubmit={handleAddQuestion} style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <textarea
                    className="admin-input"
                    rows="2"
                    placeholder="Ask a doubt or question about this lecture..."
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.75rem', padding: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="admin-btn admin-btn-teal" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
                      Post Question
                    </button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions.map(q => (
                    <div key={q.id} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', padding: '1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{q.avatar}</span>
                          <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{q.author}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {q.time}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#2dd4bf', background: 'rgba(20, 184, 166, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                          ▲ {q.upvotes}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0 0 0.85rem 0' }}>{q.question}</p>

                      {/* Answers thread */}
                      {q.answers.map((ans, aIdx) => (
                        <div key={aIdx} style={{ background: 'rgba(15, 23, 42, 0.7)', borderLeft: '3px solid #14b8a6', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#2dd4bf' }}>{ans.author}</strong>
                            <span style={{ fontSize: '0.68rem', background: '#14b8a6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>TEACHER</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{ans.text}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: COURSE CURRICULUM SYLLABUS */}
        <div style={{ background: '#111827', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>Course Content</h4>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {completedLessons} of {totalLessons} completed ({progressPercent}%)
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {curriculum.map((module, mIdx) => (
              <div key={module.id} style={{ marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  {module.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {module.lessons.map((lesson, lIdx) => {
                    const isActive = activeModuleIndex === mIdx && activeLessonIndex === lIdx;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setActiveModuleIndex(mIdx);
                          setActiveLessonIndex(lIdx);
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: '8px',
                          background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                          borderLeft: isActive ? '3px solid #14b8a6' : '3px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>
                          {lesson.completed ? '✅' : isActive ? '▶️' : '⚪'}
                        </span>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#2dd4bf' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lesson.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>⏱ {lesson.duration}</span>
                            <span>• Sheet available</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. COURSE COMPLETION CERTIFICATE MODAL */}
      {isCertModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCertModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '780px', background: '#0f172a', padding: '2.5rem', border: '2px solid #f59e0b' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', border: '4px double #d97706', padding: '2.5rem', borderRadius: '12px', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)', position: 'relative' }}>
              
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎖️</div>
              <span style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 800 }}>
                CERTIFICATE OF COMPLETION
              </span>
              
              <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', color: '#f8fafc', margin: '1rem 0 0.5rem 0' }}>
                This is proudly presented to
              </h2>
              
              <div style={{ fontSize: '2.2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#2dd4bf', textDecoration: 'underline', margin: '0.5rem 0 1.5rem 0' }}>
                {user?.name || 'Student'}
              </div>
              
              <p style={{ fontSize: '1rem', color: '#cbd5e1', maxWidth: '540px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
                for successfully mastering all modules, lectures, high-yield tests, and problem-solving units in the verified online masterclass:
              </p>
              
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginBottom: '2rem' }}>
                {course?.title || 'Advanced Masterclass'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                <div style={{ textAlign: 'left' }}>
                  <div>Instructor: <strong>{course?.instructor || 'EduFast Senior Faculty'}</strong></div>
                  <div>Issued Date: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px dashed #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.25rem', color: '#f59e0b', fontSize: '1.5rem' }}>
                    ★
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>VERIFIED ACADEMIC SEAL</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Verification ID: <strong>EDUFAST-CERT-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
                  <div>Accredited by: <strong>EduFast Engineering & Medical Wing</strong></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setIsCertModalOpen(false)}
              >
                Close
              </button>
              <button
                className="admin-btn"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', fontWeight: 700 }}
                onClick={() => {
                  window.print();
                  if (addToast) addToast('Printing certificate document...', 'info');
                }}
              >
                🖨️ Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
