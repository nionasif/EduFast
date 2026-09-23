import React from 'react';
import { Video } from 'lucide-react';

export default function EndClassModal({
  isOpen,
  onClose,
  onConfirmEnd,
  theme
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          textAlign: 'center',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#feebc8',
          color: '#d69e2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <Video style={{ width: '28px', height: '28px' }} />
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text, fontSize: '1.3rem' }}>
          End Live Broadcast?
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: theme.textMuted, fontSize: '0.9rem' }}>
          Would you like to automatically archive this session into the student <strong>"Class Recordings"</strong> library?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => onConfirmEnd(true)}
            className="btn btn-teal"
            style={{ padding: '0.75rem', fontWeight: 700 }}
          >
            Yes, End Stream & Save Recording
          </button>

          <button
            onClick={() => onConfirmEnd(false)}
            className="btn btn-secondary"
            style={{ padding: '0.65rem' }}
          >
            End Stream Only (Don't Save)
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            Cancel & Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
}
