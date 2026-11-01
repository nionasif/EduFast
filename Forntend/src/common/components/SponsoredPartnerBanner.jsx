import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SponsoredPartnerBanner.css';

export default function SponsoredPartnerBanner() {
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/promotions')
      .then(res => {
        if (!isMounted) return;
        const list = res.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setPromotions(list);
        }
      })
      .catch(err => {
        console.warn('Could not fetch promotions:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Auto rotate banner every 8 seconds if multiple ads exist
  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promotions.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (loading || promotions.length === 0) {
    return null;
  }

  const currentAd = promotions[currentIndex] || promotions[0];

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (currentAd?.id) {
      // Track click silently in backend
      api.post(`/promotions/${currentAd.id}/click`).catch(() => {});
    }
    // Open target website in new tab
    if (currentAd?.targetUrl) {
      window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? promotions.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % promotions.length);
  };

  return (
    <div className="sponsored-banner-container" id="sponsored-partner-banner">
      <div className="sponsored-top-bar">
        <div className="sponsored-label">
          <span>✨</span>
          <span>{currentAd.badge || 'Featured Partner • বিজ্ঞাপন'}</span>
        </div>
        {promotions.length > 1 && (
          <div className="sponsored-counter">
            <button className="sponsored-nav-btn" onClick={handlePrev} title="পূর্ববর্তী">‹</button>
            <span>{currentIndex + 1} / {promotions.length}</span>
            <button className="sponsored-nav-btn" onClick={handleNext} title="পরবর্তী">›</button>
          </div>
        )}
      </div>

      <div className="sponsored-body">
        <div className="sponsored-logo-wrap">
          {currentAd.logo || '🏛️'}
        </div>

        <div className="sponsored-info">
          <div className="sponsored-header-row">
            <h4 className="sponsored-institution">{currentAd.institutionName}</h4>
            <span className="sponsored-badge">ভর্তি চলছে ২০২৫</span>
          </div>

          <div className="sponsored-campaign-title">{currentAd.campaignTitle}</div>
          {currentAd.tagline && <div className="sponsored-tagline">{currentAd.tagline}</div>}

          {currentAd.waiverText && (
            <div className="waiver-pill">
              <span>🎁</span>
              <span>{currentAd.waiverText}</span>
            </div>
          )}

          {currentAd.programs && currentAd.programs.length > 0 && (
            <div className="sponsored-programs">
              {currentAd.programs.map((prog, idx) => (
                <span key={idx} className="program-tag">{prog}</span>
              ))}
            </div>
          )}
        </div>

        <div className="sponsored-cta-wrap">
          <a
            href={currentAd.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyClick}
            className="sponsored-cta-btn"
          >
            <span>আবেদন লিংক</span>
            <span>↗</span>
          </a>
          <span className="sponsored-direct-text">অফিসিয়াল ভর্তি পোর্টাল</span>
        </div>
      </div>
    </div>
  );
}
