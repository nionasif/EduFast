import React from 'react';
import { Video, Plus, Play, Clock, Edit2, Trash2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeacherRecordingsTab({
  filteredRecordingsList,
  recordingFilterGroup,
  setRecordingFilterGroup,
  handleOpenAddRecording,
  handleOpenEditRecording,
  handleDeleteRecording,
  setPreviewRecording,
  theme
}) {
  return (
    <div>
      {/* Header with Upload Trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video style={{ width: '22px', height: '22px', color: '#d69e2e' }} />
            Class Recordings Library
          </h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.9rem' }}>
            লাইভ ক্লাসের সমাপ্ত রেকর্ড এবং সম্পূর্ণ ভিডিও লেকচার পরিচালনা করুন। পিসি থেকে ভিডিও আপলোড করলেই স্টুডেন্টরা দেখতে পাবে।
          </p>
        </div>

        <button
          onClick={handleOpenAddRecording}
          className="btn btn-teal"
          style={{ padding: '0.55rem 1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} /> Upload New Recording
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['All', 'Science', 'Commerce', 'Arts'].map(grp => (
          <button
            key={grp}
            onClick={() => setRecordingFilterGroup(grp)}
            className={`btn ${recordingFilterGroup === grp ? 'btn-teal' : 'btn-secondary'}`}
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.82rem',
              backgroundColor: recordingFilterGroup === grp ? 'var(--primary-teal)' : theme.cardBgElevated,
              color: recordingFilterGroup === grp ? '#fff' : theme.text,
              borderColor: theme.cardBorder
            }}
          >
            {grp === 'All' ? 'All Groups' : grp}
          </button>
        ))}
      </div>

      {/* Recordings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredRecordingsList.map(rec => {
          const isPending = !rec.videoUrl || rec.videoUploaded === false || rec.status === 'pending_upload';

          return (
            <div
              key={rec.id}
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: '12px',
                overflow: 'hidden',
                border: isPending ? '1.5px solid #f59e0b' : `1px solid ${theme.cardBorder}`,
                boxShadow: isPending ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                {/* Media Thumbnail Overlay */}
                {isPending ? (
                  <div
                    style={{
                      height: '165px',
                      backgroundColor: '#1f2937',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid #374151'
                    }}
                    onClick={() => handleOpenEditRecording(rec)}
                    title="পিসি থেকে ভিডিও আপলোড করতে ক্লিক করুন"
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '2px dashed #f59e0b',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.4rem'
                    }}>
                      <Upload style={{ width: '22px', height: '22px' }} />
                    </div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f59e0b' }}>
                      📹 পিসি থেকে ভিডিও আপলোড বাকি
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      ক্লিক করে ভিডিও ফাইল নির্বাচন করুন
                    </span>

                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      {rec.group}
                    </span>

                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#d97706',
                      color: '#fff',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block' }} />
                      আপলোড বাকি
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      height: '165px',
                      backgroundColor: '#1a202c',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setPreviewRecording(rec)}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(49, 151, 149, 0.9)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                    }}>
                      <Play style={{ width: '22px', height: '22px', marginLeft: '3px' }} />
                    </div>

                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      {rec.group}
                    </span>

                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                      ভিডিও প্রস্তুত
                    </span>

                    <span style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Clock style={{ width: '12px', height: '12px' }} /> {rec.duration}
                    </span>
                  </div>
                )}

                {/* Content Body */}
                <div style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: theme.text, lineHeight: 1.4, fontWeight: 700 }}>
                    {rec.title}
                  </h4>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: theme.textMuted, lineHeight: 1.5 }}>
                    {rec.description || 'লাইভ ক্লাস সম্পন্ন হয়েছে।'}
                  </p>

                  {isPending && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.75rem',
                      fontSize: '0.78rem',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      lineHeight: 1.4
                    }}>
                      <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                      <span>স্টুডেন্টদের স্ক্রিনে এই অপশন দেখাচ্ছে, তবে আপনি ভিডিও আপলোড না করা পর্যন্ত তারা দেখতে পারবে না।</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: theme.textMuted, borderTop: `1px solid ${theme.tableBorder}`, paddingTop: '0.75rem' }}>
                    <span>Views: {rec.views || 0}</span>
                    <span>{rec.date}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: theme.cardBgElevated,
                borderTop: `1px solid ${theme.cardBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {isPending ? (
                  <button
                    onClick={() => handleOpenEditRecording(rec)}
                    className="btn"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#d97706',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                    ভিডিও আপলোড করুন (Upload from PC)
                  </button>
                ) : (
                  <button
                    onClick={() => setPreviewRecording(rec)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: theme.cardBg,
                      color: theme.text,
                      borderColor: theme.cardBorder
                    }}
                  >
                    <Play style={{ width: '12px', height: '12px' }} /> Preview
                  </button>
                )}

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {!isPending && (
                    <button
                      onClick={() => handleOpenEditRecording(rec)}
                      className="btn btn-teal"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      title="Edit Recording"
                    >
                      <Edit2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteRecording(rec.id)}
                    className="btn"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#e53e3e', border: '1px solid #fed7d7', background: theme.cardBg }}
                    title="Delete Recording"
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecordingsList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, marginTop: '1rem', transition: 'all 0.3s ease' }}>
          <Video style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto', color: theme.textMuted }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text }}>No Recordings Found</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: theme.textMuted, fontSize: '0.9rem' }}>
            Upload recorded video lectures or broadcast a live session to build your archive.
          </p>
          <button onClick={handleOpenAddRecording} className="btn btn-teal">
            + Upload First Class Recording
          </button>
        </div>
      )}
    </div>
  );
}
