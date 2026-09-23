import React from 'react';
import { X, FileText } from 'lucide-react';

export default function RecordingPreviewModal({
  previewRecording,
  onClose,
  onDownloadSheet,
  theme
}) {
  if (!previewRecording) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          padding: '1.5rem',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-teal)', fontWeight: 700, textTransform: 'uppercase' }}>
              {previewRecording.group} Module Archive
            </span>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: theme.text }}>
              {previewRecording.title}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Video Player Container */}
        <div style={{
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          paddingTop: '56.25%',
          marginBottom: '1rem'
        }}>
          {previewRecording.videoUrl.includes('youtube.com') || previewRecording.videoUrl.includes('youtu.be') ? (
            <iframe
              src={previewRecording.videoUrl}
              title={previewRecording.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={previewRecording.videoUrl}
              controls
              autoPlay
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: theme.textMuted }}>
            <span>Duration: {previewRecording.duration}</span> • <span>Views: {previewRecording.views || 0}</span>
          </div>

          {previewRecording.sheetUrl && (
            <a
              href={`#download-${previewRecording.id}`}
              onClick={onDownloadSheet}
              className="btn btn-teal"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FileText style={{ width: '14px', height: '14px' }} /> Download Lecture Sheet
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
