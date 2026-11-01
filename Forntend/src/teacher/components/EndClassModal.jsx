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
          backgroundColor: '#fed7d7',
          color: '#e53e3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <Video style={{ width: '28px', height: '28px' }} />
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text, fontSize: '1.3rem', fontWeight: 800 }}>
          লাইভ ক্লাস সমাপ্ত করতে চান?
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: theme.textMuted, fontSize: '0.9rem', lineHeight: 1.5 }}>
          লাইভ ক্লাস সমাপ্ত করার সাথে সাথে এটি <strong>"Class Recordings"</strong> সেকশনে চলে যাবে। আপনি আপনার পিসি থেকে রেকর্ডেড ভিডিও ফাইলটি আপলোড না করা পর্যন্ত শিক্ষার্থীরা অপশনটি দেখতে পাবে কিন্তু ভিডিও চালু হবে না। আপলোড সম্পন্ন করলেই এটি তাদের জন্য উন্মুক্ত হবে।
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={onConfirmEnd}
            className="btn"
            style={{
              backgroundColor: '#e53e3e',
              color: '#fff',
              border: 'none',
              padding: '0.75rem',
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(229, 62, 62, 0.3)'
            }}
          >
            🛑 হ্যাঁ, লাইভ ক্লাস সমাপ্ত করুন (End Class)
          </button>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.65rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            বাতিল করুন ও স্টুডিওতে থাকুন (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
}
