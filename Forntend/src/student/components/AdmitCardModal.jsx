import React from 'react';
import './AdmitCardModal.css';

export default function AdmitCardModal({ isOpen, onClose, univ, user }) {
  if (!isOpen || !univ) return null;

  const isAvailable = univ.admitCardStatus === 'available' || true;
  const candidateName = user?.name || 'EduFast Candidate';
  const hscRoll = user?.hsc?.roll || '641920';
  const hscReg = user?.hsc?.reg || '1910543210';
  const examDate = univ.examDate || 'TBD (To Be Announced)';
  const reportingTime = univ.reportingTime || '09:30 AM';
  const examCenter = univ.examCenter || `${univ.name} Main Campus & Affiliated Centers`;
  const portalUrl = univ.admitCardUrl || 'https://admission.eis.du.ac.bd';

  const handlePrint = () => {
    window.print();
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
            <span style={{ fontSize: '1.6rem' }}>{univ.logo || '🎫'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {univ.name} - প্রবেশপত্র (Admit Card)
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                স্নাতক ভর্তি পরীক্ষা ২০২৬-২০২৭
              </span>
            </div>
          </div>
          <button className="admit-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="admit-modal-body">
          {/* Slip */}
          <div className="admit-pass-slip">
            <div className="admit-slip-header">
              <h4 className="admit-slip-univ-name">
                {univ.name}
              </h4>
              <span className={`admit-status-badge ${isAvailable ? 'badge-available' : 'badge-upcoming'}`}>
                {isAvailable ? '✓ প্রবেশপত্র লাইভ' : '⏳ প্রকাশের অপেক্ষা'}
              </span>
            </div>

            <div className="admit-grid">
              <div className="admit-field">
                <span className="admit-field-label">পরীক্ষার্থীর নাম</span>
                <span className="admit-field-value">{candidateName}</span>
              </div>

              <div className="admit-field">
                <span className="admit-field-label">এইচএসসি রোল ও রেজিস্ট্রেশন</span>
                <span className="admit-field-value">{hscRoll} / {hscReg}</span>
              </div>

              <div className="admit-field">
                <span className="admit-field-label">পরীক্ষার তারিখ</span>
                <span className="admit-field-value">{examDate}</span>
              </div>

              <div className="admit-field">
                <span className="admit-field-label">রিপোর্টিং টাইম</span>
                <span className="admit-field-value">{reportingTime}</span>
              </div>

              <div className="admit-field" style={{ gridColumn: '1 / -1' }}>
                <span className="admit-field-label">বরাদ্দকৃত পরীক্ষা কেন্দ্র (Exam Center)</span>
                <span className="admit-field-value">{examCenter}</span>
              </div>
            </div>
          </div>

          {/* Exam Day Guidelines */}
          <div className="admit-instructions">
            <h5>📌 ভর্তি পরীক্ষার জন্য আবশ্যকীয় সাধারণ নির্দেশনাবলী:</h5>
            <ul>
              <li>পরীক্ষার দিন অবশ্যই এই প্রবেশপত্রের স্পষ্ট প্রিন্ট কপি এবং এইচএসসি মূল রেজিস্ট্রেশন কার্ড সাথে আনতে হবে।</li>
              <li>পরীক্ষা শুরুর অন্তত ৩০ মিনিট পূর্বে নিজ আসনে উপস্থিত হতে হবে।</li>
              <li>ওএমআর শিট পূরণের জন্য শুধুমাত্র কালো কালির বলপয়েন্ট কলম ব্যবহার করতে হবে।</li>
              <li>অনুমোদিত নন-প্রোগ্রামেবল সায়েন্টিফিক ক্যালকুলেটর ব্যতীত অন্য কোনো ইলেকট্রনিক ডিভাইস বা স্মার্টওয়াচ নিষিদ্ধ।</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="admit-modal-footer">
          <button className="admit-btn-print" onClick={handlePrint}>
            <span>🖨️</span>
            <span>প্রিন্ট / স্লিপ ডাউনলোড</span>
          </button>
          <button className="admit-btn-portal" onClick={handleOpenPortal}>
            <span>🌐</span>
            <span>অফিসিয়াল পোর্টাল থেকে ডাউনলোড</span>
          </button>
        </div>
      </div>
    </div>
  );
}
