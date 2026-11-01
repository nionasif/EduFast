import React, { useState } from 'react';
import './AdmitCardModal.css';

export default function ResultModal({ isOpen, onClose, univ, user }) {
  if (!isOpen || !univ) return null;

  const isPublished = univ.resultStatus === 'published';
  const defaultRoll = user?.hsc?.roll || '641920';
  const [searchRoll, setSearchRoll] = useState(defaultRoll);
  const [hasSearched, setHasSearched] = useState(false);

  const portalUrl = univ.resultUrl || 'https://admission.eis.du.ac.bd';

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleOpenPortal = () => {
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="admit-modal-backdrop" onClick={onClose}>
      <div className="admit-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admit-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>{univ.logo || '🏆'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {univ.name} - ভর্তি পরীক্ষার ফলাফল
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                স্নাতক ১ম বর্ষ ভর্তি মেধা তালিকা ২০২৬
              </span>
            </div>
          </div>
          <button className="admit-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="admit-modal-body">
          {isPublished ? (
            <div>
              {/* Search form */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  value={searchRoll}
                  onChange={e => setSearchRoll(e.target.value)}
                  placeholder="এইচএসসি রোল / এডমিশন টেস্ট রোল লিখুন"
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ফলাফল দেখুন
                </button>
              </form>

              {/* Result Slip */}
              <div className="admit-pass-slip" style={{ borderColor: '#10b981', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                <div className="admit-slip-header" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <h4 className="admit-slip-univ-name" style={{ color: '#047857' }}>
                    {univ.name} — মেধা তালিকা (Merit Result)
                  </h4>
                  <span className="admit-status-badge badge-available">
                    ✓ ফলাফল প্রকাশিত
                  </span>
                </div>

                <div className="admit-grid">
                  <div className="admit-field">
                    <span className="admit-field-label">পরীক্ষার্থীর নাম</span>
                    <span className="admit-field-value">{user?.name || 'EduFast Student'}</span>
                  </div>

                  <div className="admit-field">
                    <span className="admit-field-label">এইচএসসি রোল</span>
                    <span className="admit-field-value">{searchRoll || defaultRoll}</span>
                  </div>

                  <div className="admit-field">
                    <span className="admit-field-label">জাতীয় মেধা ক্রম (Merit Rank)</span>
                    <span className="admit-field-value" style={{ color: '#059669', fontSize: '1.1rem' }}>
                      🌟 ৩৪৩ তম (1st Merit List)
                    </span>
                  </div>

                  <div className="admit-field">
                    <span className="admit-field-label">বরাদ্দকৃত অনুষদ / বিষয়</span>
                    <span className="admit-field-value">Computer Science & Engineering (CSE)</span>
                  </div>

                  <div className="admit-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="admit-field-label">ভর্তি নিশ্চায়ন স্ট্যাটাস</span>
                    <span className="admit-field-value" style={{ color: '#047857' }}>
                      🟢 Eligible for Subject Choice & Viva
                    </span>
                  </div>
                </div>
              </div>

              <div className="admit-instructions" style={{ marginTop: '1rem' }}>
                <h5>📌 পরবর্তী করণীয়:</h5>
                <ul>
                  <li>প্রাথমিক বিষয় নির্বাচন ও ভাইভা পরীক্ষার তারিখ শীঘ্রই অফিসিয়াল পোর্টালে জানানো হবে।</li>
                  <li>চূড়ান্ত ভর্তির জন্য মূল মার্কশিট ও প্রশংসাপত্র সংরক্ষণ করে রাখুন।</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⏳</div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
                ফলাফল প্রকাশের অপেক্ষায়
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                {univ.name}-এর ভর্তি পরীক্ষা সম্পন্ন হওয়ার পর সেন্ট্রাল কন্ট্রোলার কর্তৃক ফলাফল অফিসিয়ালভাবে এখানে প্রকাশিত হবে।
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="admit-modal-footer">
          <button className="admit-btn-portal" onClick={handleOpenPortal}>
            <span>🌐</span>
            <span>অফিসিয়াল রেজাল্ট পোর্টালে যান</span>
          </button>
        </div>
      </div>
    </div>
  );
}
