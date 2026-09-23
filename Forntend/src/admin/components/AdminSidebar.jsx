import React from 'react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isMobileNavOpen,
  setIsMobileNavOpen,
  totalStudentsCount,
  coursesCount,
  universitiesCount,
  liveClassesCount,
  questionBankCount,
  noticesCount,
  adminUser,
  handleLogout
}) {
  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'students', icon: '👥', label: 'Student Registry', badge: totalStudentsCount },
    { id: 'courses', icon: '📚', label: 'Manage Courses', badge: coursesCount, badgeBg: '#0d9488' },
    { id: 'universities', icon: '🏛️', label: 'Manage Varsities', badge: universitiesCount, badgeBg: '#2563eb' },
    { id: 'live-classes', icon: '🔴', label: 'Live Masterclasses', badge: liveClassesCount, badgeBg: '#e11d48' },
    { id: 'question-bank', icon: '📑', label: 'Question Bank', badge: questionBankCount, badgeBg: '#059669' },
    { id: 'db-studio', icon: '🗄️', label: 'Database Studio', badge: 'SQL', badgeBg: '#10b981' },
    { id: 'analytics', icon: '📈', label: 'Academic Analytics' },
    { id: 'notices', icon: '📢', label: 'Notices & Circulars', badge: noticesCount },
    { id: 'settings', icon: '⚙️', label: 'Admin Settings' }
  ];

  return (
    <aside className={`admin-sidebar ${isMobileNavOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-brand">
        <div className="admin-brand-icon">⚡</div>
        <div className="admin-brand-title">
          EduFast <span className="admin-brand-tag">Admin</span>
        </div>
      </div>

      <nav className="admin-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.id); setIsMobileNavOpen(false); }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="admin-nav-badge" style={item.badgeBg ? { backgroundColor: item.badgeBg } : {}}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-card">
          <div className="admin-avatar">{adminUser?.name ? adminUser.name.charAt(0) : 'A'}</div>
          <div className="admin-user-info">
            <div className="admin-user-name">{adminUser?.name || 'Administrator'}</div>
            <div className="admin-user-role">{adminUser?.role || 'Super Admin'}</div>
          </div>
        </div>
        <button className="admin-signout-btn" onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
