import React from 'react';
import {
  Radio, Plus, Users, Calendar, Clock, Play, Trash2,
  Mic, MicOff, Camera, CameraOff, Monitor, Share2
} from 'lucide-react';
import StudioChat from '../components/StudioChat';

export default function TeacherLiveStudioTab({
  isLiveStudioActive,
  currentBroadcastingSession,
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
  isMicOn,
  setIsMicOn,
  isCamOn,
  setIsCamOn,
  isScreenSharing,
  setIsScreenSharing,
  teacherUser,
  studioMessages,
  studioInputMsg,
  setStudioInputMsg,
  handleSendStudioMessage,
  activeQuizPoll,
  handleCreateQuizPoll,
  handleResolveQuizPoll,
  theme
}) {
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
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#fff'
              }}>
                <Users style={{ width: '14px', height: '14px', color: '#48bb78' }} />
                <span>{currentBroadcastingSession?.registeredCount || 0} Students Registered</span>
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

          {/* Studio Main Workspace (Camera, Whiteboard & Chat) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) minmax(280px, 1fr)', minHeight: '560px' }}>
            {/* Left: Presentation Area */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d3748', position: 'relative' }}>
              {/* Presentation Mode Selector Bar */}
              <div style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#171923',
                borderBottom: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setLiveStudioTab('whiteboard')}
                    style={{
                      backgroundColor: liveStudioTab === 'whiteboard' ? 'var(--primary-teal)' : 'transparent',
                      color: liveStudioTab === 'whiteboard' ? '#fff' : '#a0aec0',
                      border: 'none',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
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
                      padding: '0.3rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📄 Concept Slides
                  </button>
                </div>

                {/* Whiteboard Controls if active */}
                {liveStudioTab === 'whiteboard' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginLeft: '0.5rem' }}>
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
                        marginLeft: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Board
                    </button>
                  </div>
                )}
              </div>

              {/* Stage Canvas Area */}
              <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: '440px' }}>
                {liveStudioTab === 'whiteboard' ? (
                  <canvas
                    ref={whiteboardCanvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                      width: '100%',
                      height: '100%',
                      cursor: activeBoardTool === 'eraser' ? 'cell' : 'crosshair',
                      display: 'block',
                      backgroundColor: '#1a202c'
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0aec0', padding: '2rem', textAlign: 'center' }}>
                    <div>
                      <Monitor style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', color: 'var(--primary-teal)' }} />
                      <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Slide Presentation Deck</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>Lecture presentation slides synced for live viewing.</p>
                    </div>
                  </div>
                )}

                {/* Floating Instructor Camera Feed Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  width: '160px',
                  height: '100px',
                  backgroundColor: isCamOn ? '#2d3748' : '#171923',
                  borderRadius: '8px',
                  border: '2px solid var(--primary-teal)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
                  zIndex: 10
                }}>
                  {isCamOn ? (
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <span style={{ fontSize: '1.5rem', display: 'block' }}>👨‍🏫</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{teacherUser.name}</span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#718096' }}>
                      <CameraOff style={{ width: '20px', height: '20px', margin: '0 auto 0.2rem auto' }} />
                      <span style={{ fontSize: '0.65rem' }}>Cam Paused</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Hardware Controls (Mic, Cam, Screen Share) */}
              <div style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#111827',
                borderTop: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  style={{
                    backgroundColor: isMicOn ? '#2d3748' : '#e53e3e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isMicOn ? <Mic style={{ width: '18px', height: '18px' }} /> : <MicOff style={{ width: '18px', height: '18px' }} />}
                </button>

                <button
                  onClick={() => setIsCamOn(!isCamOn)}
                  style={{
                    backgroundColor: isCamOn ? '#2d3748' : '#e53e3e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isCamOn ? 'Turn Camera Off' : 'Turn Camera On'}
                >
                  {isCamOn ? <Camera style={{ width: '18px', height: '18px' }} /> : <CameraOff style={{ width: '18px', height: '18px' }} />}
                </button>

                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  style={{
                    backgroundColor: isScreenSharing ? 'var(--primary-teal)' : '#2d3748',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Share Screen"
                >
                  <Share2 style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

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
