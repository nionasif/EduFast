import React, { useState, useEffect, useRef } from 'react';
import { getStudentCoins } from '../../data/mockData';
import socket from '../../socket';

export default function VirtualStudyLoungePage({ user, onNavigate }) {
  // Pomodoro Timer States
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(1);
  const [eduCoinsEarned, setEduCoinsEarned] = useState(() => getStudentCoins(user));

  useEffect(() => {
    const handleCoins = (e) => {
      if (e.detail?.coins !== undefined) {
        setEduCoinsEarned(e.detail.coins);
      }
    };
    window.addEventListener('edufast-coins-update', handleCoins);
    return () => window.removeEventListener('edufast-coins-update', handleCoins);
  }, []);

  // Active Lounge Subject Room
  const [selectedRoom, setSelectedRoom] = useState('Physics');

  // Real-Time Socket Presence State
  const [roomCounts, setRoomCounts] = useState({
    Physics: 0,
    Chemistry: 0,
    Math: 0,
    Biology: 0
  });
  const [totalActive, setTotalActive] = useState(0);
  const [roomPeers, setRoomPeers] = useState({
    Physics: [],
    Chemistry: [],
    Math: [],
    Biology: []
  });

  // Socket Connection & Room Subscription
  useEffect(() => {
    const studentInfo = {
      id: user?.id || user?.email || ('student-' + (user?.name || 'guest')),
      name: user?.name || 'শিক্ষার্থী',
      college: user?.college || user?.institution || 'এইচএসসি / অ্যাডমিশন পরীক্ষার্থী',
      avatar: user?.avatar || '👨‍🎓',
      streak: user?.streak || 7,
      status: `${selectedRoom} সলভিং সেশন`
    };

    // Join room on backend
    socket.emit('study_lounge:join_room', {
      roomId: selectedRoom,
      user: studentInfo
    });

    const handleLoungeUpdate = (data) => {
      if (data?.counts) {
        setRoomCounts(data.counts);
      }
      if (data?.totalActive !== undefined) {
        setTotalActive(data.totalActive);
      }
      if (data?.roomPeers) {
        setRoomPeers(data.roomPeers);
      }
    };

    socket.on('study_lounge:update', handleLoungeUpdate);
    socket.emit('study_lounge:get_state');

    return () => {
      socket.off('study_lounge:update', handleLoungeUpdate);
    };
  }, [selectedRoom, user]);

  // Leave room when navigating away
  useEffect(() => {
    return () => {
      socket.emit('study_lounge:leave_room');
    };
  }, []);

  // Ambient Sound Engine (Web Audio Synth)
  const [activeSound, setActiveSound] = useState(null); // 'rain', 'lofi', 'forest'
  const [audioVolume, setAudioVolume] = useState(0.4);
  const audioContextRef = useRef(null);
  const audioGainRef = useRef(null);
  const noiseSourceRef = useRef(null);

  // Timer Ticker
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (timerMode === 'focus') {
        setCompletedSessions(prev => prev + 1);
        alert('🎉 দারুণ ফোকাস সেশন সমাপ্ত! আপনার স্টাডি সেশন সফলভাবে সম্পন্ন হয়েছে। এখন ৫ মিনিটের ব্রেক নিন।');
        setTimerMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        alert('☕ ব্রেক শেষ! নতুন ফোকাস সেশনের জন্য প্রস্তুত হন।');
        setTimerMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const switchMode = (mode) => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === 'focus') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Synthesized Ambient Sound
  const toggleAmbientSound = (soundType) => {
    if (activeSound === soundType) {
      stopSynthSound();
      setActiveSound(null);
    } else {
      stopSynthSound();
      startSynthSound(soundType);
      setActiveSound(soundType);
    }
  };

  const startSynthSound = (soundType) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (soundType === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
      } else if (soundType === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
      }

      const gain = ctx.createGain();
      gain.gain.value = audioVolume * 0.15;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseSourceRef.current = noise;
      audioGainRef.current = gain;
    } catch (e) {
      console.log('Audio synth playback notice:', e);
    }
  };

  const stopSynthSound = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch {}
      noiseSourceRef.current = null;
    }
  };

  // Clean, perfectly calibrated circular progress ring
  const totalSecondsForMode = timerMode === 'focus' ? 25 * 60 : (timerMode === 'shortBreak' ? 5 * 60 : 15 * 60);
  const radius = 96;
  const circumference = 2 * Math.PI * radius; // ~603.185
  const progressRatio = Math.max(0, Math.min(1, timeLeft / totalSecondsForMode));
  // strokeDashoffset goes from 0 (full) to circumference (empty)
  const strokeDashoffset = circumference * (1 - progressRatio);

  const roomsList = [
    { id: 'Physics', icon: '⚛️', name: 'Physics Room' },
    { id: 'Chemistry', icon: '🧪', name: 'Chemistry Room' },
    { id: 'Math', icon: '📐', name: 'Math Room' },
    { id: 'Biology', icon: '🧬', name: 'Medical Biology' }
  ];

  const currentPeers = roomPeers[selectedRoom] || [];

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'radial-gradient(circle at top center, #1e1b4b 0%, #0b0f19 60%, #020617 100%)',
      color: '#f8fafc',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* TOP BAR: Presence & Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          backdropFilter: 'blur(16px)'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: totalActive > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              border: `1px solid ${totalActive > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              color: totalActive > 0 ? '#34d399' : '#cbd5e1',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '0.4rem'
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: totalActive > 0 ? '#10b981' : '#94a3b8',
                boxShadow: totalActive > 0 ? '0 0 10px #10b981' : 'none'
              }} />
              <span>
                {totalActive > 0 
                  ? `${totalActive} জন শিক্ষার্থী এখন লাইভ পড়াশোনা করছে` 
                  : 'আপনি এখন লাইভ পড়াশোনা শুরু করতে পারেন'}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              🎧 24/7 Virtual Co-Study Lounge
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>EduCoins Balance</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>🪙 {eduCoinsEarned} Coins</div>
            </div>
          </div>
        </div>

        {/* ROOMS SELECTOR CHIPS - Live Real-Time Counts */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {roomsList.map(r => {
            const count = roomCounts[r.id] || 0;
            const isSelected = selectedRoom === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #6366f1, #0ea5e9)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
                <span style={{
                  fontSize: '0.75rem',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                  fontWeight: 800
                }}>
                  {count} জন
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN GRID: Pomodoro Timer Left + Soundscape & Peers Right */}
        <div className="study-lounge-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          
          {/* POMODORO TIMER PANEL */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle background glow */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '260px',
              height: '260px',
              background: timerMode === 'focus' ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Mode Switchers */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '0.35rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '2rem',
              zIndex: 1
            }}>
              <button
                onClick={() => switchMode('focus')}
                style={{
                  background: timerMode === 'focus' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: timerMode === 'focus' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: timerMode === 'focus' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                🎯 Focus (25m)
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                style={{
                  background: timerMode === 'shortBreak' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: timerMode === 'shortBreak' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: timerMode === 'shortBreak' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                ☕ Short Break (5m)
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                style={{
                  background: timerMode === 'longBreak' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                  color: timerMode === 'longBreak' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: timerMode === 'longBreak' ? '0 2px 10px rgba(14, 165, 233, 0.4)' : 'none'
                }}
              >
                🌿 Long Rest (15m)
              </button>
            </div>

            {/* Premium Animated Circular Timer Ring */}
            <div style={{ position: 'relative', width: '250px', height: '250px', marginBottom: '2rem', zIndex: 1 }}>
              <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <filter id="timerGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={timerMode === 'focus' ? '#6366f1' : '#10b981'} floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Background Ring Track */}
                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />

                {/* Active Progress Ring */}
                <circle
                  cx="125"
                  cy="125"
                  r={radius}
                  stroke={timerMode === 'focus' ? 'url(#focusGradient)' : 'url(#breakGradient)'}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#timerGlow)"
                  style={{
                    transition: isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.4s ease'
                  }}
                />
              </svg>

              {/* Digital Clock Display Inside Ring */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{
                  fontSize: '3.4rem',
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                  letterSpacing: '-1.5px',
                  color: '#ffffff',
                  textShadow: timerMode === 'focus' ? '0 0 25px rgba(99, 102, 241, 0.4)' : '0 0 25px rgba(16, 185, 129, 0.4)',
                  lineHeight: '1'
                }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: timerMode === 'focus' ? '#a5b4fc' : '#6ee7b7',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginTop: '0.5rem'
                }}>
                  {timerMode === 'focus' ? 'Deep Work Session' : 'Relax & Hydrate'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', zIndex: 1 }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  background: isRunning ? '#ef4444' : 'linear-gradient(135deg, #10b981, #0ea5e9)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minWidth: '140px',
                  boxShadow: isRunning ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRunning ? '⏸ Pause' : '▶ Start Focus'}
              </button>

              <button
                onClick={() => switchMode(timerMode)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ↺ Reset
              </button>
            </div>

            {/* Sessions Completed Today */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#94a3b8', zIndex: 1 }}>
              <span>Completed Blocks:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[1, 2, 3, 4].map((b) => (
                  <span
                    key={b}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: b <= completedSessions ? '#10b981' : 'rgba(255,255,255,0.1)',
                      boxShadow: b <= completedSessions ? '0 0 8px #10b981' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* SOUNDSCAPES & LIVE STUDY SQUAD PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* AMBIENT SOUNDSCAPE BOX */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.5rem',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  🌧️ Background Ambient Sounds (Focus Waves)
                </h3>
                {activeSound && (
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                    Playing Audio Synth
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { id: 'rain', label: '🌧️ Gentle Rain' },
                  { id: 'lofi', label: '☕ Cafe White Noise' },
                  { id: 'forest', label: '🌲 Forest Breeze' }
                ].map(snd => (
                  <button
                    key={snd.id}
                    onClick={() => toggleAmbientSound(snd.id)}
                    style={{
                      background: activeSound === snd.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${activeSound === snd.id ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: activeSound === snd.id ? '#34d399' : '#e2e8f0',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>

              {activeSound && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setAudioVolume(v);
                      if (audioGainRef.current) {
                        audioGainRef.current.gain.value = v * 0.15;
                      }
                    }}
                    style={{ flex: 1, accentColor: '#10b981' }}
                  />
                </div>
              )}
            </div>

            {/* LIVE PEERS IN THIS ROOM - Real-Time Connected Users */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.5rem',
              backdropFilter: 'blur(16px)',
              flex: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👥</span> Live Peers in {selectedRoom} Room
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  color: currentPeers.length > 0 ? '#34d399' : '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {currentPeers.length} জন উপস্থিত
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentPeers.length === 0 ? (
                  <div style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: '#94a3b8',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.5rem' }}>🧘‍♂️</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                      এই রুমে এখনো কোনো শিক্ষার্থী লাইভ নেই
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      আপনি প্রথম শিক্ষার্থী হিসেবে ফোকাস সেশন শুরু করেছেন!
                    </div>
                  </div>
                ) : (
                  currentPeers.map((peer, idx) => (
                    <div
                      key={peer.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.7rem 0.95rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(14,165,233,0.3))',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem'
                        }}>
                          {peer.avatar || '👨‍🎓'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                            {peer.name}
                            {(peer.name === user?.name || peer.id === user?.id) && (
                              <span style={{
                                fontSize: '0.68rem',
                                background: '#10b981',
                                color: '#ffffff',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                marginLeft: '6px',
                                fontWeight: 800
                              }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {peer.college || 'এইচএসসি / অ্যাডমিশন পরীক্ষার্থী'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                          {peer.status || 'Active Study'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
