import React, { useState, useRef, useEffect } from 'react';
import {
  Radio, Video, BookOpen, AlertCircle, Settings,
  BarChart2, ArrowLeft, LogOut, Sun, Moon, Globe
} from 'lucide-react';

export default function TeacherHeader({
  activeTab,
  setActiveTab,
  isLiveStudioActive,
  recordingsCount,
  coursesCount,
  noticesCount,
  teacherUser,
  onExitToPublic,
  onLogout,
  isDarkMode,
  toggleDarkMode,
  theme
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'live-studio', label: 'Live Studio', icon: Radio, badge: isLiveStudioActive ? 'LIVE' : null },
    { id: 'recordings', label: 'Recordings', icon: Video, count: recordingsCount },
    { id: 'courses', label: 'Courses', icon: BookOpen, count: coursesCount },
    { id: 'notices', label: 'Notices', icon: AlertCircle, count: noticesCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header style={{
      backgroundColor: theme.headerBg,
      borderBottom: `1px solid ${theme.headerBorder}`,
      color: '#fff',
      padding: '0.45rem 1.25rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: '0.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Brand Logo & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: '1 1 auto' }}>
        {/* Brand Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => setActiveTab('overview')}
          title="Teacher Studio Dashboard"
        >
          <div style={{
            backgroundColor: 'var(--primary-teal)',
            color: '#fff',
            padding: '0.35rem',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio style={{ width: '16px', height: '16px' }} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.02rem', letterSpacing: '-0.02em', color: '#fff', whiteSpace: 'nowrap' }}>
              EduFast <span style={{ color: 'var(--accent-yellow)' }}>Teacher Studio</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
              Command Center
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0.1rem 0'
        }}>
          {tabs.map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                  color: isActive ? '#fff' : '#cbd5e0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <IconComp style={{ width: '14px', height: '14px', color: isActive ? 'var(--accent-yellow)' : 'inherit' }} />
                {tab.label}
                {tab.badge && (
                  <span style={{ fontSize: '0.62rem', backgroundColor: '#e53e3e', color: '#fff', padding: '0.08rem 0.32rem', borderRadius: '3px', fontWeight: 800 }}>
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.18)', padding: '0.05rem 0.35rem', borderRadius: '10px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '20px',
            padding: '0.3rem 0.65rem',
            color: isDarkMode ? '#fbbf24' : '#f1f5f9',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          {isDarkMode ? (
            <>
              <Sun style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon style={{ width: '13px', height: '13px', color: '#cbd5e1' }} />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Teacher Avatar Dropdown (Student-like) */}
        <div
          ref={dropdownRef}
          className="avatar-container"
          style={{ position: 'relative' }}
          onClick={() => setIsDropdownOpen(prev => !prev)}
        >
          <div
            className="avatar-wrapper"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              padding: '0.22rem 0.65rem 0.22rem 0.25rem',
              borderRadius: '50px',
              border: isDropdownOpen ? '1px solid var(--primary-teal)' : '1px solid rgba(255, 255, 255, 0.18)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#fff',
              userSelect: 'none'
            }}
          >
            {teacherUser?.avatar ? (
              <img
                src={teacherUser.avatar}
                alt="Teacher Profile"
                className="avatar-img"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary-teal)',
                  display: 'block'
                }}
              />
            ) : (
              <div
                className="avatar-img"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-teal)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '2px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                {(teacherUser?.name || 'T').charAt(0)}
              </div>
            )}
            <span
              className="avatar-name"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                maxWidth: '110px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#f8fafc'
              }}
            >
              {teacherUser?.name ? teacherUser.name.split(' ')[0] : 'Instructor'}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                color: '#94a3b8',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'none'
              }}
            >
              ▼
            </span>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="avatar-dropdown"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f8fafc' : '#1a202c',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                width: '230px',
                overflow: 'hidden',
                zIndex: 200,
                animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Teacher Profile Summary Header */}
              <div
                style={{
                  padding: '0.8rem 1rem',
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                  borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                  {teacherUser?.name || 'Lead Instructor'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.3rem' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(49, 151, 149, 0.15)',
                      color: 'var(--primary-teal)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}
                  >
                    Lead Instructor
                  </span>
                  <span style={{ fontSize: '0.68rem', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    Studio
                  </span>
                </div>
                {teacherUser?.email && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      marginTop: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {teacherUser.email}
                  </div>
                )}
              </div>

              {/* Menu Actions */}
              <div style={{ padding: '0.35rem 0' }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <Settings style={{ width: '15px', height: '15px', color: 'var(--primary-teal)' }} />
                  <span>Profile Settings</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onExitToPublic();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <ArrowLeft style={{ width: '15px', height: '15px', color: '#38bdf8' }} />
                  <span>Public Platform</span>
                </button>

                <div
                  className="dropdown-divider"
                  style={{
                    height: '1px',
                    backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                    margin: '0.35rem 0'
                  }}
                />

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <LogOut style={{ width: '15px', height: '15px', color: '#ef4444' }} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
