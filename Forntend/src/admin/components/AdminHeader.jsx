import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function AdminHeader({
  activeTab,
  isMobileNavOpen,
  setIsMobileNavOpen,
  backendLive,
  onExitToPublic,
  isDarkMode,
  toggleDarkMode
}) {
  const tabTitles = {
    'overview': 'Executive Overview',
    'students': 'Student Registry & CRM',
    'courses': 'Course Hub Management (Add / Edit / Remove Courses)',
    'universities': 'University & Admission Management (Add / Edit Varsities)',
    'live-classes': 'Live Masterclasses & Schedule Management',
    'question-bank': 'Past 15 Years Question Bank Archive Management',
    'analytics': 'Academic Performance Analytics',
    'notices': 'Broadcast & Notice Management',
    'settings': 'System Settings & Security'
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="admin-icon-btn"
          style={{ display: 'none' }}
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
        >
          ☰
        </button>
        <h2 className="admin-topbar-title">
          {tabTitles[activeTab] || 'Admin Dashboard'}
        </h2>
      </div>

      <div className="admin-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.12)',
            border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: '20px',
            padding: '0.35rem 0.8rem',
            color: isDarkMode ? '#fbbf24' : '#f1f5f9',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isDarkMode ? (
            <>
              <Sun style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon style={{ width: '14px', height: '14px', color: '#cbd5e1' }} />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <div className="admin-status-indicator">
          <span className="admin-status-dot" style={{ backgroundColor: backendLive ? '#10b981' : '#f59e0b' }} />
          <span>{backendLive ? 'SQLite Database Connected' : 'Local Dynamic Mode'}</span>
        </div>

        <button className="admin-view-site-btn" onClick={onExitToPublic} title="Exit to Public Website">
          <span>🌐</span>
          <span>View Main Website</span>
        </button>
      </div>
    </header>
  );
}
