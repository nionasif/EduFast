import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, Plus, Users, Calendar, Clock, Play, Trash2,
  Mic, MicOff, Camera, CameraOff, Monitor, Share2,
  Settings, Sliders, Volume2, RefreshCw, CheckCircle, AlertCircle, X, Maximize2, Minimize2,
  Circle, Pause, Square, Download, Video
} from 'lucide-react';
import StudioChat from '../components/StudioChat';

export default function TeacherLiveStudioTab({
  isLiveStudioActive,
  currentBroadcastingSession,
  liveViewerCount = 0,
  liveSessions,
  handleStartLiveClass,
  handleQuickStartInstantClass,
  handleDeleteLiveClass,
  setIsScheduleModalOpen,
  setEndClassModalOpen,
  liveStudioTab,
  setLiveStudioTab,
  activeBoardTool,
  setActiveBoardTool,
  boardColor,
  setBoardColor,
  whiteboardCanvasRef,
  isDrawing,
  startDrawing,
  draw,
  stopDrawing,
  handleClearBoard,
  liveMedia,
  isMicOn: propIsMicOn,
  setIsMicOn,
  isCamOn: propIsCamOn,
  setIsCamOn,
  isScreenSharing: propIsScreenSharing,
  setIsScreenSharing,
  teacherUser,
  studioMessages,
  studioInputMsg,
  setStudioInputMsg,
  handleSendStudioMessage,
  activeQuizPoll,
  handleCreateQuizPoll,
  handleResolveQuizPoll,
  addToast,
  theme
}) {
  const [isCamEnlarged, setIsCamEnlarged] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Fullscreen / Theater Mode State & Ref
  const stageContainerRef = useRef(null);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);

  // Class Video Recording State & Refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Sync state with liveMedia if present, otherwise fallback to props
  const isMicOn = liveMedia ? liveMedia.isMicOn : propIsMicOn;
  const isCamOn = liveMedia ? liveMedia.isCamOn : propIsCamOn;
  const isScreenSharing = liveMedia ? liveMedia.isScreenSharing : propIsScreenSharing;
  const audioLevel = liveMedia ? liveMedia.audioLevel : 0;

  // One-time auto-switch to 'slides' tab ONLY when teacher starts screen sharing
  const wasScreenSharingRef = useRef(false);
  useEffect(() => {
    if (isScreenSharing && !wasScreenSharingRef.current) {
      setLiveStudioTab('slides');
    }
    wasScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing, setLiveStudioTab]);

  // Ensure video element plays the screenStream properly without black screen
  useEffect(() => {
    if (liveStudioTab === 'slides' && isScreenSharing && liveMedia?.screenStream && liveMedia?.screenVideoRef?.current) {
      const videoEl = liveMedia.screenVideoRef.current;
      videoEl.muted = true;
      if (videoEl.srcObject !== liveMedia.screenStream) {
        videoEl.srcObject = liveMedia.screenStream;
      }
      videoEl.play().catch(err => console.warn('Screen video play notice:', err));
    }
  }, [liveStudioTab, isScreenSharing, liveMedia?.screenStream]);

  // Fullscreen toggle handler
  const toggleStageFullscreen = () => {
    const el = stageContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsStageFullscreen(prev => !prev);
        });
      } else {
        setIsStageFullscreen(prev => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsStageFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsStageFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Format seconds to mm:ss
  const formatRecordTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Start Class Video Recording
  const handleStartRecording = async () => {
    try {
      recordedChunksRef.current = [];
      let captureStream = null;

      // 1. If screen sharing is active in slides, record the screenStream directly
      if (liveMedia?.screenStream && liveMedia.screenStream.getVideoTracks().length > 0) {
        captureStream = new MediaStream(liveMedia.screenStream.getVideoTracks());
      } else if (whiteboardCanvasRef?.current && liveStudioTab === 'whiteboard') {
        captureStream = whiteboardCanvasRef.current.captureStream(30);
      } else if (navigator.mediaDevices?.getDisplayMedia) {
        try {
          captureStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always', frameRate: { ideal: 30 } },
            audio: true
          });
        } catch (e) {
          if (liveMedia?.stream && liveMedia.stream.getVideoTracks().length > 0) {
            captureStream = new MediaStream(liveMedia.stream.getVideoTracks());
          }
        }
      }

      if (!captureStream) {
        if (addToast) {
          addToast('রেকর্ড করার জন্য কোনো সক্রিয় ভিডিও স্ট্রিম পাওয়া যায়নি।', 'error');
        } else {
          alert('রেকর্ড করার জন্য কোনো সক্রিয় ভিডিও স্ট্রিম পাওয়া যায়নি।');
        }
        return;
      }

      // Mix in microphone audio track so Sir's voice is in the recording
      const micAudioTrack = liveMedia?.stream?.getAudioTracks()[0];
      if (micAudioTrack && captureStream.getAudioTracks().length === 0) {
        captureStream.addTrack(micAudioTrack);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

      const recorder = new MediaRecorder(captureStream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const rawTitle = currentBroadcastingSession?.title || 'LiveLecture';
          const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          a.download = `EduFast_${cleanTitle}_${timestamp}.${ext}`;
          document.body.appendChild(a);
          a.click();

          // Keep blob URL active for 60s so Chrome/Edge finishes saving to Downloads
          setTimeout(() => {
            try {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (e) {}
          }, 60000);

          if (addToast) {
            addToast('🎉 ক্লাস রেকর্ডিং সফলভাবে আপনার পিসির Downloads ফোল্ডারে সেভ হয়েছে!', 'success');
          } else {
            alert('🎉 ক্লাস রেকর্ডিং সফলভাবে আপনার পিসির Downloads ফোল্ডারে সেভ হয়েছে!');
          }
        } else {
          if (addToast) {
            addToast('⚠️ কোনো ভিডিও ডেটা রেকর্ড করা যায়নি।', 'error');
          } else {
            alert('⚠️ কোনো ভিডিও ডেটা রেকর্ড করা যায়নি।');
          }
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      if (addToast) {
        addToast('🔴 ক্লাস রেকর্ডিং শুরু হয়েছে। ক্লাস শেষে সেভ বাটনে ক্লিক করুন।', 'info');
      }

    } catch (err) {
      console.warn('Recording start notice:', err);
      if (addToast) {
        addToast('রেকর্ডিং শুরু করা যায়নি: ' + (err.message || 'অনুমতি পাওয়া যায়নি'), 'error');
      } else {
        alert('রেকর্ডিং শুরু করা যায়নি: ' + (err.message || 'অনুমতি পাওয়া যায়নি'));
      }
    }
  };

  const handlePauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isRecordingPaused) {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handleStopAndSaveRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {}
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
  };
  return (
    <div>
      {/* Studio Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio style={{ width: '22px', height: '22px', color: '#e53e3e' }} />
            Live Broadcasting Studio
          </h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.9rem' }}>
            Interactive digital whiteboard, slides, student chat, live quiz polls, and broadcasting controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const topic = prompt('লাইভ ক্লাসের শিরোনাম/টপিক লিখুন (বা ফাঁকা রেখে ডিফল্ট শুরু করুন):', `${teacherUser?.name || 'শিক্ষক'} - স্পেশাল লাইভ ক্লাস`);
              if (topic !== null) {
                if (typeof handleQuickStartInstantClass === 'function') {
                  handleQuickStartInstantClass(topic);
                }
              }
            }}
            className="btn btn-primary"
            style={{
              backgroundColor: '#e53e3e',
              borderColor: '#e53e3e',
              color: '#fff',
              padding: '0.5rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(229, 62, 62, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Play style={{ width: '14px', height: '14px', fill: '#fff' }} /> ⚡ এখনই লাইভ ক্লাস শুরু করুন (Instant Go Live)
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="btn btn-teal"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus style={{ width: '15px', height: '15px' }} /> Schedule Live Session
          </button>
        </div>
      </div>

      {/* Active Live Broadcast Workspace (If Active) */}
      {isLiveStudioActive && currentBroadcastingSession ? (
        <div style={{
          backgroundColor: '#1a202c',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
          border: '1px solid #2d3748',
          marginBottom: '2rem'
        }}>
          {/* Studio Live Control Top Bar */}
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#111827',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                backgroundColor: '#e53e3e',
                color: '#fff',
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                ● BROADCASTING LIVE
              </span>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                  {currentBroadcastingSession.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Group: {currentBroadcastingSession.group} • Target: {currentBroadcastingSession.duration}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: liveViewerCount > 0 ? 'rgba(72, 187, 120, 0.2)' : 'rgba(255,255,255,0.1)',
                  border: liveViewerCount > 0 ? '1px solid #48bb78' : '1px solid rgba(255,255,255,0.15)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#fff',
                  transition: 'all 0.2s ease'
                }}
                title="বর্তমানে সরাসরি লাইভ ক্লাসে অংশ নেওয়া শিক্ষার্থীর সংখ্যা (Real-time Attendees)"
              >
                <Users style={{ width: '15px', height: '15px', color: liveViewerCount > 0 ? '#48bb78' : '#9ca3af' }} />
                <span>
                  <strong style={{ color: liveViewerCount > 0 ? '#48bb78' : '#fff' }}>{liveViewerCount}</strong> {liveViewerCount === 1 ? 'Student Live' : 'Students Live'}
                </span>
              </div>

              <button
                onClick={() => setEndClassModalOpen(true)}
                className="btn"
                style={{
                  backgroundColor: '#e53e3e',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '6px'
                }}
              >
                End Live Class
              </button>
            </div>
          </div>

          {/* Device Error or Detection Notice Banner */}
          {liveMedia?.mediaError && (
            <div style={{
              backgroundColor: 'rgba(229, 62, 62, 0.15)',
              borderBottom: '1px solid #e53e3e',
              padding: '0.65rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              color: '#fca5a5',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle style={{ width: '18px', height: '18px', color: '#ef4444', flexShrink: 0 }} />
                <span><strong>ক্যামেরা ও মাইক্রোফোন নোটিশ:</strong> {liveMedia.mediaError}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={liveMedia.retryDetection}
                  style={{
                    backgroundColor: '#e53e3e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RefreshCw style={{ width: '12px', height: '12px' }} /> পুনরায় ডিটেক্ট করুন
                </button>
                <button
                  onClick={() => setIsDeviceModalOpen(true)}
                  style={{
                    backgroundColor: '#2d3748',
                    color: '#e2e8f0',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ডিভাইস নির্বাচন
                </button>
              </div>
            </div>
          )}

          {/* Detecting Spinner Banner */}
          {liveMedia?.isDetecting && (
            <div style={{
              backgroundColor: 'rgba(49, 151, 149, 0.15)',
              borderBottom: '1px solid var(--primary-teal)',
              padding: '0.5rem 1.5rem',
              color: '#81e6d9',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
              <span>ক্যামেরা ও মাইক্রোফোন ডিটেক্ট করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
            </div>
          )}

          {/* Active Hardware Device Strip */}
          {liveMedia?.mediaSuccess && !liveMedia?.mediaError && (
            <div style={{
              backgroundColor: '#171923',
              borderBottom: '1px solid #2d3748',
              padding: '0.35rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isMicOn ? '#48bb78' : '#e53e3e' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isMicOn ? '#48bb78' : '#e53e3e' }} />
                  {isMicOn ? '🎤 মাইক: সক্রিয়' : '🔇 মাইক: বন্ধ'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isCamOn ? '#48bb78' : '#e53e3e' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isCamOn ? '#48bb78' : '#e53e3e' }} />
                  {isCamOn ? '📷 ক্যামেরা: সক্রিয়' : '📷 ক্যামেরা: বন্ধ'}
                </span>
                {liveMedia?.devices?.audioInputs?.length > 0 && (
                  <span style={{ color: '#718096', fontSize: '0.72rem' }}>
                    ডিভাইস: {liveMedia.devices.audioInputs[0]?.label || 'ডিফল্ট মাইক্রোফোন'}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsDeviceModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-teal)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: 0
                }}
              >
                <Settings style={{ width: '12px', height: '12px' }} /> ক্যামেরা/মাইক সেটিংস
              </button>
            </div>
          )}

          {/* Studio Main Workspace (Camera, Whiteboard & Chat) */}
          <div className="teacher-studio-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) minmax(280px, 1fr)', minHeight: '560px' }}>
            {/* Left: Presentation Area */}
            <div
              ref={stageContainerRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRight: isStageFullscreen ? 'none' : '1px solid #2d3748',
                position: isStageFullscreen ? 'fixed' : 'relative',
                inset: isStageFullscreen ? 0 : 'auto',
                width: isStageFullscreen ? '100vw' : 'auto',
                height: isStageFullscreen ? '100vh' : 'auto',
                zIndex: isStageFullscreen ? 99999 : 'auto',
                backgroundColor: '#0f172a'
              }}
            >
              {/* Presentation Mode Selector Bar */}
              <div style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#171923',
                borderBottom: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setLiveStudioTab('whiteboard')}
                    style={{
                      backgroundColor: liveStudioTab === 'whiteboard' ? 'var(--primary-teal)' : 'transparent',
                      color: liveStudioTab === 'whiteboard' ? '#fff' : '#a0aec0',
                      border: 'none',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🖊️ Digital Whiteboard
                  </button>

                  <button
                    onClick={() => setLiveStudioTab('slides')}
                    style={{
                      backgroundColor: liveStudioTab === 'slides' ? 'var(--primary-teal)' : 'transparent',
                      color: liveStudioTab === 'slides' ? '#fff' : '#a0aec0',
                      border: 'none',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📄 Concept Slides</span>
                    {isScreenSharing && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#2dd4bf',
                          display: 'inline-block',
                          boxShadow: '0 0 6px #2dd4bf'
                        }}
                        title="পিসি স্ক্রিন শেয়ার ব্যাকগ্রাউন্ডে চলছে"
                      />
                    )}
                  </button>
                </div>

                {/* Right Bar: Whiteboard Tools + Recording Engine + Fullscreen Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {/* Whiteboard Controls if active */}
                  {liveStudioTab === 'whiteboard' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => setActiveBoardTool('pen')}
                        style={{
                          backgroundColor: activeBoardTool === 'pen' ? '#2d3748' : 'transparent',
                          border: '1px solid #4a5568',
                          color: '#fff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Pen
                      </button>
                      <button
                        onClick={() => setActiveBoardTool('eraser')}
                        style={{
                          backgroundColor: activeBoardTool === 'eraser' ? '#2d3748' : 'transparent',
                          border: '1px solid #4a5568',
                          color: '#fff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Eraser
                      </button>

                      {/* Color Palette */}
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginLeft: '0.25rem' }}>
                        {['#319795', '#e53e3e', '#ecc94b', '#ffffff'].map(c => (
                          <div
                            key={c}
                            onClick={() => {
                              setBoardColor(c);
                              setActiveBoardTool('pen');
                            }}
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: c,
                              border: boardColor === c ? '2px solid #fff' : 'none',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleClearBoard}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #e53e3e',
                          color: '#fc8181',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          marginLeft: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Board
                      </button>
                    </div>
                  )}

                  {/* 🔴 In-Studio Class Video Recorder Engine */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                      }}
                      title="লাইভ ক্লাসের ডিসপ্লে ভিডিও রেকর্ড করুন (Auto Save to PC)"
                    >
                      <Circle size={10} fill="#fff" />
                      <span>ক্লাস রেকর্ড করুন</span>
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(220, 38, 38, 0.2)',
                      border: '1px solid #ef4444',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                      <span style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 800 }}>
                        REC {formatRecordTime(recordingSeconds)}
                      </span>
                      <button
                        type="button"
                        onClick={handlePauseResumeRecording}
                        style={{
                          background: '#374151',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        {isRecordingPaused ? 'চালু' : 'পজ'}
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAndSaveRecording}
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="রেকর্ডিং বন্ধ করে সরাসরি আপনার পিসিতে ডাউনলোড করুন"
                      >
                        <Download size={10} />
                        <span>সেভ ও ডাউনলোড</span>
                      </button>
                    </div>
                  )}

                  {/* ⛶ Fullscreen / Full PC Display Button */}
                  <button
                    type="button"
                    onClick={toggleStageFullscreen}
                    style={{
                      backgroundColor: isStageFullscreen ? 'var(--primary-teal)' : '#2d3748',
                      color: '#fff',
                      border: '1px solid #4a5568',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title="ফুল পিসি ডিসপ্লেতে দেখুন (Full PC Display)"
                  >
                    {isStageFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    <span>{isStageFullscreen ? 'ফুলস্ক্রিন বন্ধ' : 'ফুল পিসি ডিসপ্লে'}</span>
                  </button>
                </div>
              </div>

              {/* Stage Canvas Area */}
              <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: isStageFullscreen ? 'calc(100vh - 120px)' : '440px' }}>
                {/* 1. Digital Whiteboard (Always persistent in DOM, never wipes strokes on tab toggle) */}
                <canvas
                  ref={whiteboardCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      const t = e.touches[0];
                      startDrawing({ clientX: t.clientX, clientY: t.clientY });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches && e.touches[0]) {
                      const t = e.touches[0];
                      draw({ clientX: t.clientX, clientY: t.clientY });
                    }
                  }}
                  onTouchEnd={stopDrawing}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: isStageFullscreen ? 'calc(100vh - 120px)' : '440px',
                    cursor: activeBoardTool === 'eraser' ? 'cell' : 'crosshair',
                    display: liveStudioTab === 'whiteboard' ? 'block' : 'none',
                    backgroundColor: '#1a202c',
                    touchAction: 'none'
                  }}
                />

                {/* 2. Slide Presentation Deck (Screen Share Live Video or Share Prompter) */}
                <div style={{
                  display: liveStudioTab === 'slides' ? 'flex' : 'none',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  minHeight: isStageFullscreen ? 'calc(100vh - 120px)' : '440px',
                  backgroundColor: '#000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {isScreenSharing ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      minHeight: isStageFullscreen ? 'calc(100vh - 120px)' : '440px',
                      backgroundColor: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <video
                        ref={(el) => {
                          if (liveMedia) liveMedia.screenVideoRef.current = el;
                          if (el && liveMedia?.screenStream && el.srcObject !== liveMedia.screenStream) {
                            el.srcObject = liveMedia.screenStream;
                            el.muted = true;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={(e) => {
                          e.target.muted = true;
                          e.target.play().catch(() => {});
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: isStageFullscreen ? 'calc(100vh - 120px)' : '520px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />

                      {/* Screen Sharing Active Banner */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(45, 212, 191, 0.5)',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: '#2dd4bf',
                        fontWeight: 800,
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2dd4bf' }} />
                        <span>🖥️ আপনার পিসি স্ক্রিন Slide Presentation Deck-এ লাইভ শেয়ার হচ্ছে</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (liveMedia) liveMedia.toggleScreenShare();
                        }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: '#e53e3e',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 4px 12px rgba(229, 62, 62, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Square size={12} fill="#fff" />
                        <span>স্ক্রিন শেয়ার বন্ধ করুন</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '440px', color: '#a0aec0', padding: '2rem', textAlign: 'center' }}>
                      <div>
                        <Monitor style={{ width: '52px', height: '52px', margin: '0 auto 1rem auto', color: 'var(--primary-teal)' }} />
                        <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Slide Presentation Deck</h4>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: '#94a3b8', maxWidth: '440px' }}>
                          আপনার পিসির সম্পূর্ণ স্ক্রিন, পাওয়ারপয়েন্ট স্লাইড বা PDF লেকচার শিট সরাসরি এই বড় ডিসপ্লেতে শেয়ার করুন।
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (liveMedia) liveMedia.toggleScreenShare();
                          }}
                          style={{
                            backgroundColor: 'var(--primary-teal)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.65rem 1.45rem',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
                          }}
                        >
                          <Share2 style={{ width: '17px', height: '17px' }} />
                          <span>🖥️ এখনই পিসি স্ক্রিন শেয়ার করুন</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Instructor Camera Feed Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  width: isCamEnlarged ? '320px' : '190px',
                  height: isCamEnlarged ? '200px' : '125px',
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: '2px solid var(--primary-teal)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 15,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {isCamOn ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}>
                      {/* Real Live Local Video Element */}
                      <video
                        ref={liveMedia?.videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                          display: 'block'
                        }}
                      />

                      {/* Top Badges */}
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 3
                      }}>
                        <span style={{
                          backgroundColor: '#e53e3e',
                          color: '#fff',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          letterSpacing: '0.04em'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#fff' }} />
                          LIVE
                        </span>
                        <span style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#94a3b8', fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.4rem', borderRadius: '3px' }}>
                          CAM
                        </span>
                      </div>

                      {/* Enlarge / Shrink PIP Button */}
                      <button
                        onClick={() => setIsCamEnlarged(!isCamEnlarged)}
                        title={isCamEnlarged ? 'ছোট ভিউ (Minimize)' : 'বড় ভিউ (Enlarge)'}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 3
                        }}
                      >
                        {isCamEnlarged ? <Minimize2 style={{ width: '12px', height: '12px' }} /> : <Maximize2 style={{ width: '12px', height: '12px' }} />}
                      </button>

                      {/* Bottom Overlay: Teacher Name & Real-Time Audio Level VU Meter */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px 8px',
                        background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 3
                      }}>
                        <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                          {teacherUser?.name || 'শিক্ষক'}
                        </span>

                        {/* Animated Voice Equalizer responding to Sir's voice */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                          {[1, 2, 3, 4, 5].map(bar => {
                            const isBarActive = isMicOn && audioLevel >= bar * 16;
                            return (
                              <span
                                key={bar}
                                style={{
                                  width: '2.5px',
                                  height: `${5 + bar * 2.2}px`,
                                  backgroundColor: isBarActive ? '#10b981' : 'rgba(255,255,255,0.3)',
                                  borderRadius: '2px',
                                  transition: 'height 0.08s ease, background-color 0.08s ease'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#718096', padding: '1rem' }}>
                      <CameraOff style={{ width: '22px', height: '22px', margin: '0 auto 0.25rem auto', color: '#ef4444' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', display: 'block' }}>ক্যামেরা বন্ধ</span>
                      <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{teacherUser?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Hardware Controls (Mic, Cam, Screen Share, Settings) */}
              <div style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#111827',
                borderTop: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                {/* Left: Quick Device Status Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: isMicOn ? 'rgba(72, 187, 120, 0.15)' : 'rgba(229, 62, 62, 0.15)',
                    color: isMicOn ? '#48bb78' : '#fc8181',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontWeight: 600
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isMicOn ? '#48bb78' : '#e53e3e' }} />
                    {isMicOn ? 'মাইক অন' : 'মাইক মিউট'}
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: isCamOn ? 'rgba(72, 187, 120, 0.15)' : 'rgba(229, 62, 62, 0.15)',
                    color: isCamOn ? '#48bb78' : '#fc8181',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontWeight: 600
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isCamOn ? '#48bb78' : '#e53e3e' }} />
                    {isCamOn ? 'ক্যামেরা অন' : 'ক্যামেরা বন্ধ'}
                  </span>
                </div>

                {/* Center: Main Hardware Toggle Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Microphone Button with Sound VU Equalizer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => {
                        if (liveMedia) liveMedia.toggleMic();
                        else setIsMicOn(!isMicOn);
                      }}
                      style={{
                        backgroundColor: isMicOn ? '#2d3748' : '#e53e3e',
                        color: '#fff',
                        border: isMicOn && audioLevel > 20 ? '2px solid #48bb78' : '2px solid transparent',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isMicOn && audioLevel > 20 ? '0 0 10px rgba(72, 187, 120, 0.5)' : 'none'
                      }}
                      title={isMicOn ? 'মাইক্রোফোন মিউট করুন' : 'মাইক্রোফোন চালু করুন'}
                    >
                      {isMicOn ? <Mic style={{ width: '19px', height: '19px' }} /> : <MicOff style={{ width: '19px', height: '19px' }} />}
                    </button>

                    {/* Mini Voice Waveform Meter */}
                    {isMicOn && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '20px' }}>
                        {[1, 2, 3, 4].map(b => {
                          const active = audioLevel >= b * 18;
                          return (
                            <span
                              key={b}
                              style={{
                                width: '2.5px',
                                height: active ? `${8 + b * 2.5}px` : '4px',
                                backgroundColor: active ? '#48bb78' : '#4a5568',
                                borderRadius: '2px',
                                transition: 'all 0.08s ease'
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Camera Toggle Button */}
                  <button
                    onClick={() => {
                      if (liveMedia) liveMedia.toggleCam();
                      else setIsCamOn(!isCamOn);
                    }}
                    style={{
                      backgroundColor: isCamOn ? '#2d3748' : '#e53e3e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isCamOn ? 'ক্যামেরা বন্ধ করুন' : 'ক্যামেরা চালু করুন'}
                  >
                    {isCamOn ? <Camera style={{ width: '19px', height: '19px' }} /> : <CameraOff style={{ width: '19px', height: '19px' }} />}
                  </button>

                  {/* Screen Share Button */}
                  <button
                    onClick={() => {
                      if (liveMedia) liveMedia.toggleScreenShare();
                      else setIsScreenSharing(!isScreenSharing);
                    }}
                    style={{
                      backgroundColor: isScreenSharing ? 'var(--primary-teal)' : '#2d3748',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isScreenSharing ? 'স্ক্রিন শেয়ার বন্ধ করুন' : 'সম্পূর্ণ স্ক্রিন শেয়ার করুন'}
                  >
                    <Share2 style={{ width: '19px', height: '19px' }} />
                  </button>

                  {/* Device Settings Button */}
                  <button
                    onClick={() => setIsDeviceModalOpen(true)}
                    style={{
                      backgroundColor: isDeviceModalOpen ? 'var(--primary-teal)' : '#2d3748',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="ক্যামেরা ও মাইক্রোফোন ডিভাইস সেটিংস"
                  >
                    <Settings style={{ width: '19px', height: '19px' }} />
                  </button>
                </div>

                {/* Right: Quick Retry or Switch Help */}
                <div>
                  <button
                    onClick={() => {
                      if (liveMedia) liveMedia.retryDetection();
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #4a5568',
                      color: '#cbd5e0',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                    title="ডিভাইস পুনরায় স্ক্যান করুন"
                  >
                    <RefreshCw style={{ width: '12px', height: '12px' }} /> রি-ডিটেক্ট
                  </button>
                </div>
              </div>
            </div>

            {/* Device Settings Modal / Popover */}
            {isDeviceModalOpen && (
              <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#1a202c',
                  border: '1px solid #4a5568',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '460px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                  overflow: 'hidden'
                }}>
                  {/* Modal Header */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #2d3748',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#111827'
                  }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings style={{ width: '18px', height: '18px', color: 'var(--primary-teal)' }} />
                      ক্যামেরা ও মাইক্রোফোন ডিভাইস সেটিংস
                    </h3>
                    <button
                      onClick={() => setIsDeviceModalOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <X style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '1.25rem' }}>
                    {/* Microphone Select */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        🎙️ মাইক্রোফোন নির্বাচন (Audio Input)
                      </label>
                      <select
                        value={liveMedia?.selectedAudioDeviceId || ''}
                        onChange={(e) => {
                          if (liveMedia) liveMedia.switchMicrophone(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: '#2d3748',
                          color: '#fff',
                          border: '1px solid #4a5568',
                          borderRadius: '6px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        {liveMedia?.devices?.audioInputs?.map((device, idx) => (
                          <option key={device.deviceId || idx} value={device.deviceId}>
                            {device.label || `Microphone ${idx + 1}`}
                          </option>
                        ))}
                        {(!liveMedia?.devices?.audioInputs || liveMedia.devices.audioInputs.length === 0) && (
                          <option value="">ডিফল্ট মাইক্রোফোন (Default System Mic)</option>
                        )}
                      </select>

                      {/* Real-Time Mic Sound Level Meter Test */}
                      <div style={{ marginTop: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a0aec0', marginBottom: '0.25rem' }}>
                          <span>মাইক টেস্ট লেভেল:</span>
                          <span style={{ color: audioLevel > 15 ? '#48bb78' : '#a0aec0', fontWeight: 700 }}>{audioLevel}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#2d3748', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${audioLevel}%`,
                            height: '100%',
                            backgroundColor: audioLevel > 50 ? '#38a169' : '#319795',
                            transition: 'width 0.08s ease'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Camera Select */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        📷 ক্যামেরা নির্বাচন (Video Input)
                      </label>
                      <select
                        value={liveMedia?.selectedVideoDeviceId || ''}
                        onChange={(e) => {
                          if (liveMedia) liveMedia.switchCamera(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: '#2d3748',
                          color: '#fff',
                          border: '1px solid #4a5568',
                          borderRadius: '6px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        {liveMedia?.devices?.videoInputs?.map((device, idx) => (
                          <option key={device.deviceId || idx} value={device.deviceId}>
                            {device.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                        {(!liveMedia?.devices?.videoInputs || liveMedia.devices.videoInputs.length === 0) && (
                          <option value="">ডিফল্ট ওয়েবক্যাম (Default Webcam)</option>
                        )}
                      </select>
                    </div>

                    {/* Tips & Auto-detection Notice */}
                    <div style={{
                      backgroundColor: 'rgba(49, 151, 149, 0.12)',
                      border: '1px solid rgba(49, 151, 149, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.78rem',
                      color: '#b2f5ea',
                      lineHeight: 1.5
                    }}>
                      💡 <strong>টিপস:</strong> লাইভ শুরু হওয়ার সাথে সাথে ব্রাউজার আপনার ক্যামেরা ও মাইক্রোফোন ডিটেক্ট করে সংযুক্ত করে। কথা বলার সময় সবুজ ভলিউম বার নড়াচড়া করলে বুঝতে পারবেন মাইক্রোফোন সঠিকভাবে কাজ করছে।
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    borderTop: '1px solid #2d3748',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#111827'
                  }}>
                    <button
                      onClick={() => {
                        if (liveMedia) liveMedia.retryDetection();
                      }}
                      className="btn"
                      style={{
                        backgroundColor: '#2d3748',
                        color: '#e2e8f0',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: '1px solid #4a5568'
                      }}
                    >
                      <RefreshCw style={{ width: '13px', height: '13px' }} /> ডিভাইস রিফ্রেশ
                    </button>

                    <button
                      onClick={() => setIsDeviceModalOpen(false)}
                      className="btn btn-teal"
                      style={{
                        padding: '0.4rem 1.15rem',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      ঠিক আছে (Done)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Interactive Studio Chat & Live Poll */}
            <StudioChat
              studioMessages={studioMessages}
              studioInputMsg={studioInputMsg}
              setStudioInputMsg={setStudioInputMsg}
              handleSendStudioMessage={handleSendStudioMessage}
              teacherUser={teacherUser}
              activeQuizPoll={activeQuizPoll}
              handleCreateQuizPoll={handleCreateQuizPoll}
              handleResolveQuizPoll={handleResolveQuizPoll}
            />
          </div>
        </div>
      ) : null}

      {/* Scheduled Live Sessions Table */}
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${theme.cardBorder}`, transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: theme.text }}>
            All Scheduled Live Sessions
          </h3>
          <span style={{ fontSize: '0.85rem', color: theme.textMuted }}>
            Total Sessions: <strong>{liveSessions.length}</strong>
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `2px solid ${theme.tableBorder}`, color: theme.textSecondary }}>
                <th style={{ padding: '0.75rem 1rem' }}>Class Title & Group</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveSessions.filter(s => (s.status || '').toUpperCase() !== 'ENDED').map(session => (
                <tr key={session.id} style={{ borderBottom: `1px solid ${theme.tableBorder}` }}>
                  <td style={{ padding: '1rem' }}>
                    <strong style={{ color: theme.text, display: 'block', fontSize: '0.95rem' }}>{session.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Group: {session.group}</span>
                  </td>
                  <td style={{ padding: '1rem', color: theme.textSecondary }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                      {new Date(session.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: theme.textSecondary }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock style={{ width: '14px', height: '14px', color: '#d69e2e' }} />
                      {session.duration}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: session.status === 'Live' ? '#fed7d7' : '#e6fffa',
                      color: session.status === 'Live' ? '#c53030' : '#234e52'
                    }}>
                      {session.status === 'Live' ? '● LIVE NOW' : 'UPCOMING'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleStartLiveClass(session)}
                        className="btn btn-teal"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Play style={{ width: '12px', height: '12px' }} /> Go Live
                      </button>

                      <button
                        onClick={() => handleDeleteLiveClass(session.id)}
                        className="btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#e53e3e', border: '1px solid #fed7d7', background: theme.cardBg }}
                        title="Delete Session"
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {liveSessions.filter(s => (s.status || '').toUpperCase() !== 'ENDED').length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: theme.textMuted }}>
                    <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <Radio style={{ width: '36px', height: '36px', color: '#e53e3e', opacity: 0.7 }} />
                      <h4 style={{ margin: 0, color: theme.text, fontSize: '1.05rem' }}>কোনো শিডিউল করা লাইভ ক্লাস নেই</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>এখনই শিক্ষার্থীদের জন্য সরাসরি লাইভ ক্লাস শুরু করুন অথবা পরবর্তীতে নেওয়ার জন্য শিডিউল করুন।</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            const topic = prompt('লাইভ ক্লাসের শিরোনাম/টপিক লিখুন:', `${teacherUser?.name || 'শিক্ষক'} - স্পেশাল লাইভ ক্লাস`);
                            if (topic !== null && typeof handleQuickStartInstantClass === 'function') {
                              handleQuickStartInstantClass(topic);
                            }
                          }}
                          className="btn btn-primary"
                          style={{
                            backgroundColor: '#e53e3e',
                            borderColor: '#e53e3e',
                            color: '#fff',
                            padding: '0.45rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          ⚡ এখনই লাইভ ক্লাস শুরু করুন
                        </button>
                        <button
                          onClick={() => setIsScheduleModalOpen(true)}
                          className="btn btn-teal"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                        >
                          + শিডিউল করুন
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
