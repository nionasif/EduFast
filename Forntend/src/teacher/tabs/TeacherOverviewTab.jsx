import React from 'react';
import {
  Radio, Video, Plus, BookOpen, Users, Play
} from 'lucide-react';

export default function TeacherOverviewTab({
  teacherUser,
  courses,
  recordings,
  liveSessions,
  setActiveTab,
  setIsScheduleModalOpen,
  handleOpenAddCourse,
  handleStartLiveClass,
  handleOpenAddRecording,
  setPreviewRecording,
  theme
}) {
  return (
    <div>
      {/* Instructor Welcome Banner */}
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: '12px',
        padding: '1.75rem',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        transition: 'all 0.3s ease'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instructor Command Studio
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: '0.25rem 0 0.5rem 0' }}>
            Welcome back, {teacherUser?.name || 'Instructor'}!
          </h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.95rem' }}>
            Broadcast live interactive classes, publish complete courses, and share high-yield recordings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setActiveTab('live-studio');
              setIsScheduleModalOpen(true);
            }}
            className="btn btn-secondary"
            style={{
              padding: '0.65rem 1.15rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: theme.cardBgElevated,
              color: theme.text,
              borderColor: theme.cardBorder
            }}
          >
            <Radio style={{ width: '16px', height: '16px', color: '#e53e3e' }} />
            Schedule Live Class
          </button>

          <button
            onClick={() => {
              setActiveTab('courses');
              handleOpenAddCourse();
            }}
            className="btn btn-teal"
            style={{
              padding: '0.65rem 1.15rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Create New Course
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Courses</span>
            <BookOpen style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: theme.text }}>{courses.length}</div>
          <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Published & Open to Students</span>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3182ce', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enrolled Students</span>
            <Users style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: theme.text }}>
            {courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38a169', fontWeight: 600 }}>Active Enrolled Learners</span>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d69e2e', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class Recordings</span>
            <Video style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: theme.text }}>{recordings.length}</div>
          <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Archived Video Lectures</span>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53e3e', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Upcoming Live Sessions</span>
            <Radio style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: theme.text }}>{liveSessions.length}</div>
          <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Scheduled Interactive Classes</span>
        </div>
      </div>

      {/* Quick Actions & Recent Live Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Upcoming Live Classes Card */}
        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: theme.text, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Radio style={{ width: '16px', height: '16px', color: '#e53e3e' }} />
              Upcoming Live Sessions
            </h3>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="btn btn-teal"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              + Schedule
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {liveSessions.map(session => (
              <div
                key={session.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: theme.cardBgElevated,
                  border: `1px solid ${theme.cardBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: session.status === 'Live' ? '#fed7d7' : '#e6fffa',
                      color: session.status === 'Live' ? '#c53030' : '#234e52'
                    }}>
                      {session.status === 'Live' ? '● LIVE NOW' : 'UPCOMING'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: theme.textMuted }}>{session.group}</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: theme.text, fontWeight: 700 }}>
                    {session.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                    {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {session.duration}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('live-studio');
                    handleStartLiveClass(session);
                  }}
                  className="btn btn-teal"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Play style={{ width: '13px', height: '13px' }} /> Go Live
                </button>
              </div>
            ))}

            {liveSessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: theme.textMuted }}>
                <Radio style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No live classes currently scheduled.</p>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="btn btn-teal"
                  style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  Schedule First Live Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Recorded Lectures Card */}
        <div style={{ backgroundColor: theme.cardBg, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: theme.text, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Video style={{ width: '16px', height: '16px', color: '#d69e2e' }} />
              Recent Recorded Lectures
            </h3>
            <button
              onClick={handleOpenAddRecording}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                backgroundColor: theme.cardBgElevated,
                color: theme.text,
                borderColor: theme.cardBorder
              }}
            >
              + Upload Recording
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recordings.slice(0, 3).map(rec => (
              <div
                key={rec.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: theme.cardBgElevated,
                  border: `1px solid ${theme.cardBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem', color: theme.text, fontWeight: 600 }}>
                    {rec.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                    Group: {rec.group} • Duration: {rec.duration} • Views: {rec.views || 0}
                  </span>
                </div>

                <button
                  onClick={() => setPreviewRecording(rec)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.75rem',
                    backgroundColor: theme.cardBg,
                    color: theme.text,
                    borderColor: theme.cardBorder
                  }}
                >
                  Watch Preview
                </button>
              </div>
            ))}

            {recordings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: theme.textMuted }}>
                <Video style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No class recordings uploaded yet.</p>
                <button
                  onClick={handleOpenAddRecording}
                  className="btn btn-teal"
                  style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  Upload First Recording
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
