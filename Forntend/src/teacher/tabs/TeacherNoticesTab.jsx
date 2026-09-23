import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

export default function TeacherNoticesTab({
  notices,
  setNotices,
  addToast,
  theme
}) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '1.75rem', border: `1px solid ${theme.cardBorder}`, transition: 'all 0.3s ease' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.4rem', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--primary-teal)' }} />
          Student Notices & Announcements
        </h2>

        {/* Add notice form */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Type an urgent announcement (e.g. Friday live problem-solving exam starts at 8:30 PM)..."
            id="teacher-notice-input"
            className="form-input"
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.inputText
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('teacher-notice-input');
              if (!input || !input.value.trim()) return;
              const newN = { id: Date.now(), title: input.value.trim(), date: 'Just now', tag: 'Notice' };
              const updated = [newN, ...notices];
              setNotices(updated);
              localStorage.setItem('edufast_teacher_notices', JSON.stringify(updated));
              input.value = '';
              addToast('Announcement broadcasted to students successfully!', 'success');
            }}
            className="btn btn-teal"
            style={{ padding: '0 1.25rem', height: '44px', fontWeight: 600 }}
          >
            Publish Notice
          </button>
        </div>

        {/* Notices list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {notices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: theme.textMuted, fontSize: '0.88rem' }}>
              <AlertCircle style={{ width: '28px', height: '28px', margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No active notices currently.</p>
              <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Enter an announcement above and click "Publish Notice".</span>
            </div>
          )}
          {notices.map(notice => (
            <div
              key={notice.id}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: theme.cardBgElevated,
                border: `1px solid ${theme.cardBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: theme.text }}>{notice.title}</h4>
                <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Time: {notice.date}</span>
              </div>

              <button
                onClick={() => {
                  const filtered = notices.filter(n => n.id !== notice.id);
                  setNotices(filtered);
                  localStorage.setItem('edufast_teacher_notices', JSON.stringify(filtered));
                  addToast('Notice removed.', 'info');
                }}
                style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '0.4rem' }}
                title="Delete Notice"
              >
                <Trash2 style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
