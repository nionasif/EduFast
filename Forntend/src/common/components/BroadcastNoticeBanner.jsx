import React, { useState, useEffect } from 'react';
import { 
  Megaphone, X, AlertTriangle, AlertCircle, Info, 
  ChevronRight, ChevronLeft, ExternalLink, Calendar, Bell
} from 'lucide-react';
import { socket } from '../../socket';
import api from '../../services/api';
import './BroadcastNoticeBanner.css';

export default function BroadcastNoticeBanner({ style = {}, onNoticeClick = null }) {
  // Only real notices created from Admin panel are shown
  const [notices, setNotices] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('edufast_dismissed_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedModalNotice, setSelectedModalNotice] = useState(null);

  // 1. Fetch active notices from server (only admin notices)
  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      const list = Array.isArray(res?.data) 
        ? res.data 
        : Array.isArray(res?.data?.data) 
          ? res.data.data 
          : Array.isArray(res) 
            ? res 
            : [];

      setNotices(list);
    } catch (err) {
      console.warn('Notice banner fetch notice:', err.message);
      try {
        const local = localStorage.getItem('edufast_admin_notices');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) setNotices(parsed);
        } else {
          setNotices([]);
        }
      } catch {
        setNotices([]);
      }
    }
  };

  useEffect(() => {
    fetchNotices();

    // 2. Real-time Socket.io listeners
    const handleBroadcast = (newNotice) => {
      setNotices(prev => [newNotice, ...prev.filter(n => n.id !== newNotice.id)]);
    };

    const handleDeleted = ({ id }) => {
      setNotices(prev => prev.filter(n => n.id !== id));
    };

    const handleUpdated = () => {
      fetchNotices();
    };

    if (socket) {
      socket.on('notice:broadcast', handleBroadcast);
      socket.on('notice:deleted', handleDeleted);
      socket.on('notice:updated', handleUpdated);
    }

    return () => {
      if (socket) {
        socket.off('notice:broadcast', handleBroadcast);
        socket.off('notice:deleted', handleDeleted);
        socket.off('notice:updated', handleUpdated);
      }
    };
  }, []);

  const visibleNotices = notices.filter(n => !dismissedIds.includes(n.id));

  // 3. Auto-Sliding Carousel Effect (slides every 4.5 seconds, pauses on mouse hover)
  useEffect(() => {
    if (visibleNotices.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleNotices.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [visibleNotices.length, isPaused]);

  if (visibleNotices.length === 0) return null;

  const activeIndex = currentIndex % visibleNotices.length;
  const currentNotice = visibleNotices[activeIndex] || visibleNotices[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + visibleNotices.length) % visibleNotices.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % visibleNotices.length);
  };

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('edufast_dismissed_notices', JSON.stringify(updated));
    } catch {}
  };

  const handleOpenNotice = (notice, e) => {
    if (e) e.stopPropagation();
    if (onNoticeClick) {
      onNoticeClick(notice);
    } else {
      setSelectedModalNotice(notice);
    }
  };

  const pLower = (currentNotice.priority || 'General').toLowerCase();
  const bannerClass = pLower === 'urgent' 
    ? 'broadcast-banner-urgent' 
    : pLower === 'important' 
      ? 'broadcast-banner-important' 
      : 'broadcast-banner-general';

  return (
    <>
      <div 
        className={`broadcast-banner-wrapper ${bannerClass}`}
        style={style}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-label="Official Broadcast Notices"
      >
        <div className="broadcast-banner-container">
          
          {/* Left: Priority Badge & Icon */}
          <div className="broadcast-banner-left">
            <div className="broadcast-badge-icon">
              {pLower === 'urgent' ? (
                <AlertTriangle style={{ width: 17, height: 17, color: '#ffffff' }} />
              ) : pLower === 'important' ? (
                <AlertCircle style={{ width: 17, height: 17, color: '#ffffff' }} />
              ) : (
                <Megaphone style={{ width: 17, height: 17, color: '#ffffff' }} />
              )}
            </div>
            <span className={`broadcast-priority-pill ${pLower}`}>
              {pLower === 'urgent' ? '🚨 জরুরি নোটিশ' : pLower === 'important' ? '⭐ গুরুত্বপূর্ণ' : '📢 নোটিশ'}
            </span>
          </div>

          {/* Center: Notice Slide Area (Click to view details) */}
          <div 
            className="broadcast-banner-content-area"
            onClick={() => handleOpenNotice(currentNotice)}
            title="সম্পূর্ণ নোটিশটি বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div key={currentNotice.id || activeIndex} className="broadcast-slide-item">
              <span className="broadcast-notice-title">
                {currentNotice.title}:
              </span>
              <span className="broadcast-notice-text">
                {currentNotice.content}
              </span>
              {currentNotice.date && (
                <span className="broadcast-notice-date">
                  • {currentNotice.date}
                </span>
              )}
              <span className="broadcast-details-link">
                বিস্তারিত <ExternalLink style={{ width: 11, height: 11 }} />
              </span>
            </div>
          </div>

          {/* Right: Carousel Controls (Prev, Next, Counter, Close) */}
          <div className="broadcast-banner-controls">
            {visibleNotices.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="broadcast-ctrl-btn"
                  title="পূর্ববর্তী নোটিশ"
                  aria-label="Previous Notice"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </button>

                <span className="broadcast-counter-pill">
                  {activeIndex + 1} / {visibleNotices.length}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  className="broadcast-ctrl-btn"
                  title="পরবর্তী নোটিশ"
                  aria-label="Next Notice"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => handleDismiss(currentNotice.id, e)}
              className="broadcast-close-btn"
              title="নোটিশটি বন্ধ করুন"
              aria-label="Dismiss Notice"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

        </div>
      </div>

      {/* Full Notice Details Modal */}
      {selectedModalNotice && (
        <div 
          className="broadcast-modal-backdrop"
          onClick={() => setSelectedModalNotice(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="broadcast-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`broadcast-modal-header ${(selectedModalNotice.priority || 'General').toLowerCase()}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell style={{ width: 18, height: 18 }} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  অফিশিয়াল নোটিশ ও বিজ্ঞপ্তি
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalNotice(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                &times;
              </button>
            </div>

            <div className="broadcast-modal-body">
              <h3 className="broadcast-modal-title">
                {selectedModalNotice.title}
              </h3>

              <div className="broadcast-modal-meta">
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                  color: '#0d9488',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  {selectedModalNotice.priority || 'General'}
                </span>
                {selectedModalNotice.date && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar style={{ width: 13, height: 13 }} /> {selectedModalNotice.date}
                  </span>
                )}
              </div>

              <div className="broadcast-modal-content">
                {selectedModalNotice.content}
              </div>
            </div>

            <div className="broadcast-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedModalNotice(null)}
                className="broadcast-modal-close-btn"
              >
                ঠিক আছে, বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
