import React from 'react';
import { X } from 'lucide-react';

export default function ScheduleLiveModal({
  isOpen,
  onClose,
  scheduleFormData,
  setScheduleFormData,
  handleSaveScheduleClass,
  theme
}) {
  if (!isOpen) return null;

  const getMinDateTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const isPastTime = Boolean(
    scheduleFormData.scheduledAt && 
    new Date(scheduleFormData.scheduledAt).getTime() < (Date.now() - 60000)
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: theme.text, fontWeight: 800 }}>
            Schedule New Live Session
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSaveScheduleClass}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Class Title *
            </label>
            <input
              type="text"
              value={scheduleFormData.title}
              onChange={e => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
              placeholder="e.g.: Physics Paper 1: Vector Shortcuts & Math Hacks"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Target Group
              </label>
              <select
                value={scheduleFormData.group}
                onChange={e => setScheduleFormData({ ...scheduleFormData, group: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Duration
              </label>
              <input
                type="text"
                value={scheduleFormData.duration}
                onChange={e => setScheduleFormData({ ...scheduleFormData, duration: e.target.value })}
                placeholder="e.g. 90 Minutes"
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Scheduled Date & Time * (বর্তমান বা ভবিষ্যতের সময়)
            </label>
            <input
              type="datetime-local"
              min={getMinDateTime()}
              value={scheduleFormData.scheduledAt}
              onChange={e => setScheduleFormData({ ...scheduleFormData, scheduledAt: e.target.value })}
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: isPastTime ? '#e53e3e' : theme.inputBorder,
                color: theme.inputText
              }}
              required
            />
            {isPastTime && (
              <p style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 600, marginBottom: 0 }}>
                ⚠️ অতীতের কোনো তারিখ বা সময় নির্বাচন করা যাবে না। অনুগ্রহ করে বর্তমান বা ভবিষ্যতের সময় নির্ধারণ করুন।
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Live Stream Broadcast URL (YouTube Embed / RTMP)
            </label>
            <input
              type="text"
              value={scheduleFormData.streamUrl}
              onChange={e => setScheduleFormData({ ...scheduleFormData, streamUrl: e.target.value })}
              placeholder="https://www.youtube.com/embed/..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Class Overview / Agenda
            </label>
            <textarea
              rows={3}
              value={scheduleFormData.overview}
              onChange={e => setScheduleFormData({ ...scheduleFormData, overview: e.target.value })}
              placeholder="What topics, formulas, or past exam problems will be covered?"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPastTime}
              className="btn btn-teal"
              style={{
                fontWeight: 700,
                opacity: isPastTime ? 0.5 : 1,
                cursor: isPastTime ? 'not-allowed' : 'pointer'
              }}
            >
              Save & Broadcast Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
