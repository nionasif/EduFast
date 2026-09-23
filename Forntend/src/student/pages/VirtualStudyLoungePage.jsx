import React, { useState, useEffect, useRef } from 'react';
import { getStudentCoins, updateStudentCoins } from '../../data/mockData';

export default function VirtualStudyLoungePage({ user, onNavigate }) {
  // Pomodoro Timer States
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(3);
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

  // Active Lounge Subject
  const [selectedRoom, setSelectedRoom] = useState('Physics');

  // Ambient Sound Engine (Web Audio Synth)
  const [activeSound, setActiveSound] = useState(null); // 'rain', 'lofi', 'whitenoise', 'forest'
  const [audioVolume, setAudioVolume] = useState(0.4);
  const audioContextRef = useRef(null);
  const audioGainRef = useRef(null);
  const noiseSourceRef = useRef(null);

  // Live peers list
  const [peers, setPeers] = useState([
    { name: "Rafid Hasan", college: "Notre Dame College", streak: 9, status: "Solving Kinematics", avatar: "👨‍🎓" },
    { name: "Tasnim Ara", college: "Viqarunnisa Noon", streak: 14, status: "Organic Reactions", avatar: "👩‍🎓" },
    { name: "Siam Ahmed", college: "Dhaka College", streak: 6, status: "BUET Question Bank", avatar: "👨‍🎓" },
    { name: "Nusrat Jahan", college: "Rajuk Uttara", streak: 11, status: "Medical Biology", avatar: "👩‍🎓" },
    { name: "Arif Hossain", college: "Chittagong College", streak: 5, status: "Integration 10.3", avatar: "👨‍🎓" }
  ]);

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
        updateStudentCoins(user, 50);
        alert('🎉 দারুণ ফোকাস সেশন সমাপ্ত! আপনি +৫০ EduCoins অর্জন করেছেন। এখন ৫ মিনিটের ব্রেক নিন।');
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

  // Simple Synthesized Ambient Sound
  const toggleAmbientSound = (soundType) => {
    if (activeSound === soundType) {
      // Stop sound
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

      // Generate White / Pink Noise for Rain / Ambient Lo-Fi
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter to simulate sound
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

  // Progress for circle
  const totalSecondsForMode = timerMode === 'focus' ? 25 * 60 : (timerMode === 'shortBreak' ? 5 * 60 : 15 * 60);
  const progressPercent = ((totalSecondsForMode - timeLeft) / totalSecondsForMode) * 100;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'radial-gradient(circle at top center, #1e1b4b 0%, #0b0f19 60%, #020617 100%)',
      color: '#f8fafc',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* TOP BAR: Presense & Header */}
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <span>১৮৪ জন শিক্ষার্থী এখন আপনার সাথে লাইভ পড়াশোনা করছে</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              🎧 24/7 Virtual Co-Study Lounge
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>EduCoins Balance</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>🪙 {eduCoinsEarned} Coins</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Focus Streak</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>🔥 7 Days</div>
            </div>
          </div>
        </div>

        {/* ROOMS SELECTOR CHIPS */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'Physics', label: '⚛️ Physics Room (৬৪ জন)' },
            { id: 'Chemistry', label: '🧪 Chemistry Room (৪৮ জন)' },
            { id: 'Math', label: '📐 Math Room (৫২ জন)' },
            { id: 'Biology', label: '🧬 Medical Biology (২০ জন)' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoom(r.id)}
              style={{
                background: selectedRoom === r.id ? 'linear-gradient(135deg, #6366f1, #0ea5e9)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedRoom === r.id ? '#ffffff' : '#94a3b8',
                border: selectedRoom === r.id ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: selectedRoom === r.id ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* MAIN GRID: Pomodoro Timer Left + Soundscape & Peers Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          
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
            alignItems: 'center'
          }}>
            {/* Mode Switchers */}
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem' }}>
              <button
                onClick={() => switchMode('focus')}
                style={{
                  background: timerMode === 'focus' ? '#6366f1' : 'transparent',
                  color: timerMode === 'focus' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🎯 Focus (25m)
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                style={{
                  background: timerMode === 'shortBreak' ? '#10b981' : 'transparent',
                  color: timerMode === 'shortBreak' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ☕ Short Break (5m)
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                style={{
                  background: timerMode === 'longBreak' ? '#0ea5e9' : 'transparent',
                  color: timerMode === 'longBreak' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🌿 Long Rest (15m)
              </button>
            </div>

            {/* Circular Timer Ring */}
            <div style={{ position: 'relative', width: '220px', height: '220px', marginBottom: '2rem' }}>
              <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="110"
                  cy="110"
                  r="70"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="70"
                  stroke={timerMode === 'focus' ? '#6366f1' : '#10b981'}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-1px' }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {timerMode === 'focus' ? 'Deep Work Session' : 'Relax & Hydrate'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
                  boxShadow: isRunning ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(16, 185, 129, 0.4)'
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
                  cursor: 'pointer'
                }}
              >
                ↺ Reset
              </button>
            </div>

            {/* Sessions Completed Today */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Completed Blocks:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4].map((b) => (
                  <span
                    key={b}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: b <= completedSessions ? '#10b981' : 'rgba(255,255,255,0.1)'
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
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Playing Audio Synth</span>
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

            {/* LIVE PEERS IN THIS ROOM */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.5rem',
              backdropFilter: 'blur(16px)',
              flex: 1
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👥</span> Live Peers in {selectedRoom} Room
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {peers.map((peer, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {peer.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{peer.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{peer.college}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>{peer.status}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>🔥 {peer.streak} Days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
