import { useState, useEffect, useMemo, lazy, Suspense } from 'react';

// 🌐 SHARED / COMMON MODULE (Synchronous for instantaneous initial load)
import LandingPage from './common/pages/LandingPage';
import LoginModal from './common/components/LoginModal';

// 🛡️ ADMIN MODULE (Dynamic Lazy Load)
const AdminPortalPage = lazy(() => import('./admin/AdminPortalPage'));

// 👨‍🏫 TEACHER MODULE (Dynamic Lazy Load)
const TeacherPortalPage = lazy(() => import('./teacher/TeacherPortalPage'));

// 🧑‍🏫 24/7 MENTOR & TA SQUAD MODULE (Dynamic Lazy Load)
const MentorPortalPage = lazy(() => import('./mentor/MentorPortalPage'));

// 🎓 STUDENT MODULE (Dynamic Lazy Load)
const StudentDashboardPage = lazy(() => import('./student/pages/StudentDashboardPage'));
const StudyPlannerPage = lazy(() => import('./student/pages/StudyPlannerPage'));
const CourseHubPage = lazy(() => import('./student/pages/CourseHubPage'));
const CoursePlayerPage = lazy(() => import('./student/pages/CoursePlayerPage'));
const LiveClassesPage = lazy(() => import('./student/pages/LiveClassesPage'));
const MockTestPage = lazy(() => import('./student/pages/MockTestPage'));
const QuestionBankPage = lazy(() => import('./student/pages/QuestionBankPage'));
const AdmissionDetailsPage = lazy(() => import('./student/pages/AdmissionDetailsPage'));
const VirtualStudyLoungePage = lazy(() => import('./student/pages/VirtualStudyLoungePage'));
const HigherStudyPage = lazy(() => import('./student/pages/HigherStudyPage'));
const SignupPage = lazy(() => import('./common/pages/SignupPage'));

import PaymentModal from './common/components/PaymentModal';
import AIAssistant from './student/components/AIAssistant';
import StudentProfileModal from './student/components/StudentProfileModal';
import BroadcastNoticeBanner from './common/components/BroadcastNoticeBanner';
import { socket } from './socket';
import api from './services/api';
import {
  getStudentCoins,
  getNotifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  registerStudentInLocalStore
} from './data/mockData';

import { useLanguage } from './context/LanguageContext';
import {
  Globe,
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Video,
  GraduationCap,
  Award,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  Sparkles,
  Calendar
} from 'lucide-react';

// 🪙 Crisp Vector Golden Coin Icon (100% cross-platform compatible, replaces broken Unicode emoji)
export const GoldCoinIcon = ({ size = 16, style = {} }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="7.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
    <text x="12" y="16" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="bold" fontFamily="sans-serif">৳</text>
  </svg>
);

// 🪙 Interactive EduCoins Wallet & Rewards Breakdown Modal
const EduCoinsWalletModal = ({ isOpen, onClose, coins = 0, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        padding: '1.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #fde68a',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            color: '#64748b'
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.35rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.65rem',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
          }}>
            <GoldCoinIcon size={38} />
          </div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
            EduCoins রিওয়ার্ড ও ওয়ালেট
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            আপনার অর্জিত শিক্ষা পয়েন্ট ও রিওয়ার্ডের বিস্তারিত
          </p>

          {/* Large Balance Display */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fffbeb',
            border: '2px solid #fde68a',
            padding: '0.55rem 1.4rem',
            borderRadius: '16px',
            marginTop: '0.9rem'
          }}>
            <GoldCoinIcon size={24} />
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309' }}>
              {coins}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e' }}>
              EduCoins
            </span>
          </div>
        </div>

        {/* What can you do with coins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.35rem' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f766e', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎯</span>
              <span>কীভাবে কয়েন আয় করবেন?</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
              <li>প্রতিটি দৈনিক এআই রিভিশন টাস্ক সম্পন্ন করলে: <strong>+২০ Coins</strong></li>
              <li>মডেল টেস্টে অংশগ্রহণ ও সঠিক উত্তর দিলে: <strong>+৫০ Coins</strong></li>
              <li>একটানা পড়ালেখার ডেইলি স্ট্রিক বজায় রাখলে: <strong>+১০ Coins</strong></li>
            </ul>
          </div>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎁</span>
              <span>কয়েন কী কী কাজে ব্যবহার করবেন?</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#15803d', lineHeight: 1.6 }}>
              <li>কোর্স এনরোলে <strong>বিশেষ ডিসকাউন্ট বা ফ্রি আনলক</strong> রিডিম</li>
              <li>এক্সক্লুসিভ স্পেশাল মক টেস্ট ও প্র্যাকটিস সেট আনলক</li>
              <li>জাতীয় স্টুডেন্ট লিডারবোর্ডে টপ র‍্যাংক ও সম্মাননা অর্জন</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) onNavigate('study-planner');
            }}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            ⚡ স্টাডি প্ল্যানারে কয়েন আয় করুন
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) onNavigate('dashboard');
            }}
            style={{
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            🏆 লিডারবোর্ড
          </button>
        </div>
      </div>
    </div>
  );
};


// Sleek loading fallback for on-demand lazy pages
const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
    fontFamily: 'var(--font-sans)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--gray-200, #e2e8f0)',
      borderTopColor: 'var(--primary-teal, #319795)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.88rem', color: 'var(--gray-600, #4a5568)', fontWeight: 600 }}>
      লোড হচ্ছে (Loading EduFast)...
    </span>
  </div>
);

// 🎨 Category Badge Icon and Color helper for Notifications
const getNotifBadge = (category) => {
  switch (category) {
    case 'doubt':
    case 'doubt_solution':
      return { icon: '💡', label: 'ডাউট সমাধান', bg: '#ecfdf5', color: '#059669' };
    case 'live_class':
      return { icon: '🔴', label: 'লাইভ ক্লাস', bg: '#fee2e2', color: '#b91c1c' };
    case 'admission':
      return { icon: '🎓', label: 'ভর্তি তথ্য', bg: '#e0e7ff', color: '#4338ca' };
    case 'exam':
      return { icon: '📝', label: 'মক টেস্ট', bg: '#f3e8ff', color: '#7e22ce' };
    case 'reward':
      return { icon: '🪙', label: 'EduCoins', bg: '#fef3c7', color: '#b45309' };
    case 'notice':
      return { icon: '📢', label: 'নোটিশ', bg: '#e0f2fe', color: '#0369a1' };
    case 'course':
      return { icon: '📚', label: 'কোর্স', bg: '#dcfce7', color: '#15803d' };
    default:
      return { icon: '✨', label: 'আপডেট', bg: '#f1f5f9', color: '#475569' };
  }
};

// 🔔 Reusable Interactive Notification Bell Widget
const NotificationBellWidget = ({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  filter,
  onFilterChange,
  onMarkAllRead,
  onClearAll,
  onNotificationClick
}) => {
  const filtered = notifications.filter(n => {
    if (filter === 'live_class') return n.category === 'live_class';
    if (filter === 'notice') return n.category === 'notice' || n.category === 'admission';
    if (filter === 'doubt') return n.category === 'doubt' || n.category === 'doubt_solution';
    return true;
  });

  return (
    <div
      className="notification-bell"
      title="নোটিফিকেশন ও ক্লাস আপডেট"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <span style={{ fontSize: '1.35rem', userSelect: 'none' }}>🔔</span>
      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}

      {isOpen && (
        <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
          {/* Dropdown Header */}
          <div className="notification-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>🔔 নোটিফিকেশন</span>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                  {unreadCount} নতুন
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  style={{ border: 'none', background: 'none', color: 'var(--primary-teal, #319795)', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
                  onClick={onMarkAllRead}
                >
                  সব পড়া হয়েছে
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}
                  onClick={onClearAll}
                  title="সব নোটিফিকেশন মুছে ফেলুন"
                >
                  মুছুন
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="notif-filter-tabs">
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => onFilterChange('all')}
            >
              সব ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'live_class' ? 'active' : ''}`}
              onClick={() => onFilterChange('live_class')}
            >
              🔴 লাইভ ক্লাস
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'notice' ? 'active' : ''}`}
              onClick={() => onFilterChange('notice')}
            >
              📢 নোটিশ
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'doubt' ? 'active' : ''}`}
              onClick={() => onFilterChange('doubt')}
            >
              💡 সমাধান
            </button>
          </div>

          {/* Notification List Items */}
          <div className="notification-list">
            {filtered.map((n) => {
              const badge = getNotifBadge(n.category);
              return (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => onNotificationClick(n)}
                >
                  <div className="notif-top-row">
                    <span
                      className="notif-category-pill"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.time}</span>
                      {!n.read && <span className="notif-unread-dot" title="Unread" />}
                    </div>
                  </div>
                  <div className="notif-title">{n.title}</div>
                  <p className="notif-text">{n.text}</p>
                  {n.link && (
                    <div className="notif-footer">
                      <span className="notif-action-link">
                        সরাসরি দেখুন →
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.4rem' }}>📭</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748b' }}>কোনো নোটিফিকেশন নেই</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>টিচার ক্লাস দিলে বা নোটিশ প্রকাশ হলে এখানে আসবে।</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 🗺️ EduFast URL Routing System
const ROUTE_MAP = {
  '/': 'landing',
  '/home': 'landing',
  '/landing': 'landing',
  '/dashboard': 'dashboard',
  '/student': 'dashboard',
  '/study-planner': 'study-planner',
  '/planner': 'study-planner',
  '/courses': 'courses',
  '/classroom': 'classroom',
  '/question-bank': 'question-bank',
  '/live-classes': 'live-classes',
  '/mocktest': 'mocktest',
  '/mock-tests': 'mocktest',
  '/admissions': 'admissions',
  '/higher-study': 'higher-study',
  '/study-abroad': 'higher-study',
  '/study-lounge': 'study-lounge',
  '/lounge': 'study-lounge',
  '/login': 'landing',
  '/signup': 'signup',
  '/admin': 'admin',
  '/teacher': 'teacher',
  '/teacher/dashboard': 'teacher',
  '/mentor': 'mentor',
  '/mentor/dashboard': 'mentor'
};

const PAGE_TO_PATH = {
  landing: '/home',
  dashboard: '/dashboard',
  'study-planner': '/study-planner',
  courses: '/courses',
  classroom: '/classroom',
  'question-bank': '/question-bank',
  'live-classes': '/live-classes',
  mocktest: '/mocktest',
  admissions: '/admissions',
  'higher-study': '/higher-study',
  'study-lounge': '/study-lounge',
  login: '/login',
  signup: '/signup',
  admin: '/admin',
  teacher: '/teacher',
  mentor: '/mentor'
};

const PROTECTED_PAGES = [
  'dashboard',
  'study-planner',
  'admissions',
  'higher-study',
  'courses',
  'mocktest',
  'classroom',
  'question-bank',
  'live-classes',
  'study-lounge'
];

const getSubfolderPrefix = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname.toLowerCase().startsWith('/edufast') ? '/EduFast' : '';
  }
  return '';
};

const normalizeRoutePath = (rawPath) => {
  let path = (rawPath || '/').toLowerCase();
  if (path.startsWith('/edufast')) {
    path = path.slice(8) || '/';
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path || '/';
};

const getInitialRoute = () => {
  if (typeof window !== 'undefined') {
    const path = normalizeRoutePath(window.location.pathname);
    const hash = window.location.hash.toLowerCase();

    // Check if student session exists
    let hasSession = false;
    try {
      const saved = localStorage.getItem('edufast_student_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || (parsed.name && parsed.name.trim()))) {
          hasSession = true;
        }
      }
    } catch { }

    if (hasSession && (path === '/login' || path === '/signup' || hash === '#login' || hash === '#signup')) {
      return 'dashboard';
    }

    if (hash === '#admin') return 'admin';
    if (hash === '#teacher') return 'teacher';
    if (hash === '#mentor') return 'mentor';
    if (hash === '#login') return 'landing';
    if (hash === '#signup') return 'signup';

    const matchedPage = ROUTE_MAP[path];
    if (matchedPage) {
      if (PROTECTED_PAGES.includes(matchedPage)) {
        if (hasSession) {
          return matchedPage;
        }
        return 'landing';
      }
      return matchedPage;
    }
  }
  return 'landing';
};

function App() {
  const { language, toggleLanguage, t } = useLanguage();
  const initialRoute = getInitialRoute();
  // Navigation & User State
  const [currentPage, setCurrentPage] = useState(initialRoute); // 'landing', 'login', 'signup', 'dashboard', 'admissions', 'courses', 'mocktest', 'admin'
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_student_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Ensure it is a valid active student object with a name or email
      if (parsed && (parsed.email || (parsed.name && parsed.name.trim()))) {
        registerStudentInLocalStore(parsed);
        return parsed;
      }
      // Remove stale empty object
      localStorage.removeItem('edufast_student_session');
      return null;
    } catch (e) {
      return null;
    }
  });

  // Track active authenticated session for any role (Mentor, Teacher, Admin, or Student)
  const [activeSessionSync, setActiveSessionSync] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => {
      setActiveSessionSync(prev => prev + 1);
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('edufast-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('edufast-auth-change', handleAuthChange);
    };
  }, []);

  const activeSession = useMemo(() => {
    try {
      // 1. Check Mentor Session
      const mentorSaved = localStorage.getItem('edufast_mentor_session');
      if (mentorSaved) {
        const parsed = JSON.parse(mentorSaved);
        if (parsed && (parsed.name || parsed.email || parsed.id || parsed.mentorId)) {
          return {
            role: 'mentor',
            name: parsed.name || 'Mentor',
            targetPage: 'mentor',
            label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'
          };
        }
      }
      // 2. Check Teacher Session
      const teacherSaved = localStorage.getItem('edufast_teacher_session');
      if (teacherSaved) {
        const parsed = JSON.parse(teacherSaved);
        if (parsed && (parsed.name || parsed.email || parsed.id)) {
          return {
            role: 'teacher',
            name: parsed.name || 'Teacher',
            targetPage: 'teacher',
            label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'
          };
        }
      }
      // 3. Check Admin Session
      const adminSaved = localStorage.getItem('edufast_admin_session');
      if (adminSaved) {
        return {
          role: 'admin',
          name: 'Admin',
          targetPage: 'admin',
          label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'
        };
      }
      // 4. Check Student Session
      if (currentUser) {
        return {
          role: 'student',
          name: currentUser.name || 'Student',
          targetPage: 'dashboard',
          label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'
        };
      }
      const studentSaved = localStorage.getItem('edufast_student_session');
      if (studentSaved) {
        const parsed = JSON.parse(studentSaved);
        if (parsed && (parsed.name || parsed.email)) {
          return {
            role: 'student',
            name: parsed.name || 'Student',
            targetPage: 'dashboard',
            label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'
          };
        }
      }
    } catch (e) {}
    return null;
  }, [currentUser, currentPage, language, activeSessionSync]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = normalizeRoutePath(window.location.pathname);
      const hash = window.location.hash.toLowerCase();
      let hasSession = false;
      try {
        const saved = localStorage.getItem('edufast_student_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || (parsed.name && parsed.name.trim()))) {
            hasSession = true;
          }
        }
      } catch {}
      if (!hasSession && (path === '/login' || hash === '#login')) {
        return true;
      }
    }
    return false;
  });
  const [loginModalRole, setLoginModalRole] = useState('student'); // 'student' | 'teacher'
  const [signupRole, setSignupRole] = useState('student'); // 'student' | 'teacher'
  const [selectedAdmissionUnivId, setSelectedAdmissionUnivId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
      return next;
    });
  };

  // Modals & Popups Toggle States
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Editor Temp Form State
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    fathersName: '',
    mothersName: '',
    avatar: null
  });
  const [fileSizeError, setFileSizeError] = useState('');

  // Toast System State
  const [toasts, setToasts] = useState([]);

  // Notifications list & filter state (loaded dynamically from real data store)
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'live_class' | 'notice'
  const [studentCoins, setStudentCoins] = useState(() => getStudentCoins(currentUser));
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetItem, setPaymentTargetItem] = useState(null);
  const [isStudentPremium, setIsStudentPremium] = useState(() => Boolean(currentUser?.isPremium));

  useEffect(() => {
    const handleCoins = (e) => {
      if (e.detail?.coins !== undefined) {
        setStudentCoins(e.detail.coins);
      }
    };
    const handleOpenPayment = (e) => {
      if (e.detail?.item) {
        setPaymentTargetItem(e.detail.item);
      } else {
        setPaymentTargetItem(null);
      }
      setIsPaymentModalOpen(true);
    };
    const handleSubUpdate = (e) => {
      setIsStudentPremium(Boolean(e.detail?.isPremium));
    };

    window.addEventListener('edufast-coins-update', handleCoins);
    window.addEventListener('open-payment-modal', handleOpenPayment);
    window.addEventListener('edufast-subscription-update', handleSubUpdate);
    return () => {
      window.removeEventListener('edufast-coins-update', handleCoins);
      window.removeEventListener('open-payment-modal', handleOpenPayment);
      window.removeEventListener('edufast-subscription-update', handleSubUpdate);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    api.get('/payment/subscription-status?email=' + encodeURIComponent(currentUser.email))
      .then(res => {
        if (res.data?.success && res.data.data) {
          setIsStudentPremium(Boolean(res.data.data.isPremium));
        }
      })
      .catch(() => {});
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) return;
    api.get('/student/dashboard-stats')
      .then(res => {
        const stats = res.data?.data || res.data || res.stats;
        if (stats && stats.coins !== undefined) {
          setStudentCoins(stats.coins);
        }
      })
      .catch(() => {
        setStudentCoins(getStudentCoins(currentUser));
      });
  }, [currentUser?.email]);

  // Reactive listeners for dynamic real-time notifications
  useEffect(() => {
    const handleNotifUpdate = () => {
      setNotifications(getNotifications());
    };
    const handleNewNotification = () => {
      setNotifications(getNotifications());
    };

    const handleClassStatus = (session) => {
      if (session && session.status === 'LIVE') {
        addToast(`🔴 শিক্ষক ${session.instructor || session.teacherName || ''} "${session.title}" লাইভ ক্লাস শুরু করেছেন! 'Live Classes' এ যোগ দিন।`, 'info');
        setNotifications(getNotifications());
      }
    };

    const handleOpenProfileModal = () => {
      setIsProfileEditOpen(true);
    };

    const handleDoubtResolved = (doubt) => {
      if (doubt) {
        const title = `💡 ডাউট সমাধান: ${doubt.subject || 'প্রশ্ন'}`;
        const text = `মেন্টর ${doubt.claimedBy || 'মেন্টর'} আপনার প্রশ্নের সমাধান দিয়েছেন: "${(doubt.solutionText || doubt.solution?.text || doubt.question || '').slice(0, 80)}..."`;
        addNotification({
          title,
          text,
          category: 'doubt_solution',
          link: 'dashboard'
        });
        addToast(title, 'success');
        setNotifications(getNotifications());
      }
    };

    const handleServerNotification = (notif) => {
      if (!notif) return;
      // Do not show mentor-desk rating alert to students
      if (notif.type === 'mentor_rating' || notif.targetRole === 'mentor') {
        return;
      }
      addNotification({
        title: notif.title || '🔔 নোটিফিকেশন',
        text: notif.message || notif.text || '',
        category: notif.category || notif.type || 'general',
        link: notif.link || (notif.type === 'doubt_solution' ? 'dashboard' : notif.type === 'mock_test' ? 'mocktest' : notif.type === 'course' ? 'courses' : null)
      });
      addToast(notif.title || notif.message, 'info');
      setNotifications(getNotifications());
    };

    const handleCourseNew = (course) => {
      if (course) {
        const title = `🎓 নতুন কোর্স: "${course.title}"`;
        const text = `শিক্ষক ${course.instructor || 'EduFast'} নতুন কোর্স শুরু করেছেন। এখনই বিস্তারিত দেখে এনরোল করুন!`;
        addNotification({
          title,
          text,
          category: 'course',
          link: 'courses'
        });
        addToast(title, 'info');
        setNotifications(getNotifications());
      }
    };

    const handleMockTestNew = (test) => {
      if (test) {
        const title = `🎯 নতুন মক টেস্ট: "${test.title}"`;
        const text = `নতুন ${test.subject || 'এডমিশন'} মডেল টেস্ট শুরু হয়েছে (${test.totalQuestions || test.questions?.length || 25}টি প্রশ্ন)। এখনই অংশগ্রহণ করুন!`;
        addNotification({
          title,
          text,
          category: 'mock_test',
          link: 'mocktest'
        });
        addToast(title, 'info');
        setNotifications(getNotifications());
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'edufast_notifications') {
        setNotifications(getNotifications());
      }
    };

    window.addEventListener('edufast-data-update', handleNotifUpdate);
    window.addEventListener('edufast-notification-added', handleNewNotification);
    window.addEventListener('open-student-profile', handleOpenProfileModal);
    window.addEventListener('storage', handleStorageChange);

    socket.on('class:status_change', handleClassStatus);
    socket.on('doubt:resolved', handleDoubtResolved);
    socket.on('notification', handleServerNotification);
    socket.on('course:new', handleCourseNew);
    socket.on('mock_test:new', handleMockTestNew);

    return () => {
      window.removeEventListener('edufast-data-update', handleNotifUpdate);
      window.removeEventListener('edufast-notification-added', handleNewNotification);
      window.removeEventListener('open-student-profile', handleOpenProfileModal);
      window.removeEventListener('storage', handleStorageChange);

      socket.off('class:status_change', handleClassStatus);
      socket.off('doubt:resolved', handleDoubtResolved);
      socket.off('notification', handleServerNotification);
      socket.off('course:new', handleCourseNew);
      socket.off('mock_test:new', handleMockTestNew);
    };
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keep dropdowns safe from clicking outside (simplified)
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsAvatarDropdownOpen(false);
      setIsNotificationsOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Synchronize URL on initial mount (e.g. '/' -> '/home')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefix = getSubfolderPrefix();
      const currentPath = normalizeRoutePath(window.location.pathname);
      if (currentPath === '/' || currentPath === '' || currentPath === '/landing') {
        window.history.replaceState({ page: 'landing' }, '', `${prefix}/home`);
      } else {
        const expectedPath = PAGE_TO_PATH[currentPage];
        if (expectedPath && currentPath !== expectedPath) {
          window.history.replaceState({ page: currentPage }, '', `${prefix}${expectedPath}`);
        }
      }
    }
  }, [currentPage]);

  // Listen for browser popstate / direct address bar route transitions (Back / Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      if (window.__EDUFAST_ACTIVE_EXAM__) {
        // Active mock test is running, don't allow browser back to navigate away!
        return;
      }
      const path = normalizeRoutePath(window.location.pathname);
      const hash = window.location.hash.toLowerCase();

      if (path === '/login' || hash === '#login') {
        if (currentUser) {
          setCurrentPage('dashboard');
          const prefix = getSubfolderPrefix();
          window.history.replaceState({ page: 'dashboard' }, '', `${prefix}/dashboard`);
        } else {
          setCurrentPage('landing');
          setIsLoginModalOpen(true);
        }
        return;
      }

      setIsLoginModalOpen(false);

      let targetPage = 'landing';
      if (hash === '#admin') targetPage = 'admin';
      else if (hash === '#teacher') targetPage = 'teacher';
      else if (hash === '#mentor') targetPage = 'mentor';
      else if (hash === '#signup') targetPage = 'signup';
      else if (ROUTE_MAP[path]) targetPage = ROUTE_MAP[path];

      const prefix = getSubfolderPrefix();

      if (currentUser && (targetPage === 'signup' || targetPage === 'login')) {
        setCurrentPage('dashboard');
        window.history.replaceState({ page: 'dashboard' }, '', `${prefix}/dashboard`);
        return;
      }

      if (PROTECTED_PAGES.includes(targetPage) && !currentUser) {
        setCurrentPage('landing');
        window.history.replaceState({ page: 'landing' }, '', `${prefix}/home`);
      } else {
        setCurrentPage(targetPage);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // If user is already logged in, automatically redirect away from signup or login pages
  useEffect(() => {
    if (currentUser && (currentPage === 'signup' || currentPage === 'login' || isLoginModalOpen)) {
      setIsLoginModalOpen(false);
      if (currentPage === 'signup' || currentPage === 'login') {
        setCurrentPage('dashboard');
        const prefix = getSubfolderPrefix();
        if (typeof window !== 'undefined') {
          window.history.replaceState({ page: 'dashboard' }, '', `${prefix}/dashboard`);
        }
      }
    }
  }, [currentUser, currentPage, isLoginModalOpen]);

  // Active Course for Udemy/10MS interactive player
  const [activeCourseForPlayer, setActiveCourseForPlayer] = useState(null);

  const handleOpenCoursePlayer = (course) => {
    setActiveCourseForPlayer(course);
    if (!currentUser) {
      addToast('Please log in to access full lessons, quizzes, and certificates.', 'info');
      navigateTo('login', 'student');
      return;
    }
    setCurrentPage('classroom');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'classroom' }, '', '/classroom');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Protected Route logic simulation
  const navigateTo = (pageName, role = 'student') => {
    // If student is actively taking a mock test, confirm before leaving
    if (typeof window !== 'undefined' && window.__EDUFAST_ACTIVE_EXAM__ && pageName !== 'mocktest') {
      const confirmLeave = window.confirm('⚠️ পরীক্ষা চলমান রয়েছে! পরীক্ষা শেষ না করে বের হলে আপনার উত্তরগুলো বাতিল হতে পারে। আপনি কি নিশ্চিতভাবে বের হতে চান?');
      if (!confirmLeave) return;
      window.__EDUFAST_ACTIVE_EXAM__ = false;
    }

    // If user is already logged in, redirect any signup or login attempts directly to dashboard
    if ((currentUser || activeSession) && (pageName === 'signup' || pageName === 'login')) {
      const target = activeSession?.targetPage || 'dashboard';
      setCurrentPage(target);
      const prefix = getSubfolderPrefix();
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: target }, '', `${prefix}/${target}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
      return;
    }

    if (pageName === 'signup') {
      setIsLoginModalOpen(false);
      setSignupRole(role);
      setCurrentPage('signup');
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: 'signup' }, '', '/signup');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
      return;
    }

    if (pageName === 'login') {
      setLoginModalRole(role);
      setIsLoginModalOpen(true);
      setCurrentPage('landing');
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: 'login' }, '', '/login');
      }
      setIsMobileMenuOpen(false);
      return;
    }

    setIsLoginModalOpen(false);

    // If attempting to go to protected pages without login, block it
    if (PROTECTED_PAGES.includes(pageName) && !currentUser) {
      addToast('অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন।', 'error');
      setLoginModalRole('student');
      setIsLoginModalOpen(true);
      return;
    }

    if (pageName === 'admissions') {
      setSelectedAdmissionUnivId(typeof role === 'string' && role !== 'student' ? role : null);
    }

    setCurrentPage(pageName);
    const targetPath = PAGE_TO_PATH[pageName] || `/${pageName}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: pageName }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false); // close mobile menu on navigate
  };

  const handleLoginSuccess = (userObj) => {
    setIsLoginModalOpen(false);
    try {
      localStorage.setItem('edufast_student_session', JSON.stringify(userObj));
    } catch (e) { }
    registerStudentInLocalStore(userObj);
    setCurrentUser(userObj);
    setCurrentPage('dashboard');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
    }
  };

  const handleRegisterSuccess = (userObj) => {
    try {
      localStorage.setItem('edufast_student_session', JSON.stringify(userObj));
    } catch (e) { }
    registerStudentInLocalStore(userObj);
    setCurrentUser(userObj);
    setCurrentPage('dashboard');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
    }
  };

  const handleTeacherLoginSuccess = (teacherObj) => {
    setIsLoginModalOpen(false);
    localStorage.setItem('edufast_teacher_session', JSON.stringify(teacherObj));
    localStorage.setItem('edufast_teacher_profile', JSON.stringify(teacherObj));
    window.dispatchEvent(new CustomEvent('edufast-teacher-update', { detail: teacherObj }));
    setCurrentPage('teacher');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'teacher' }, '', '/teacher');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(`Welcome back, ${teacherObj.name}! Logged into Teacher Studio.`, 'success');
  };

  const handleTeacherRegisterSuccess = (newTeacherData) => {
    localStorage.setItem('edufast_teacher_session', JSON.stringify(newTeacherData));
    localStorage.setItem('edufast_teacher_profile', JSON.stringify(newTeacherData));
    window.dispatchEvent(new CustomEvent('edufast-teacher-update', { detail: newTeacherData }));
    setCurrentPage('teacher');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'teacher' }, '', '/teacher');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(`Welcome ${newTeacherData.name}! Instructor account created successfully.`, 'success');
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('edufast_student_session');
    } catch (e) { }
    setCurrentUser(null);
    setIsNotificationsOpen(false);
    setCurrentPage('landing');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'landing' }, '', '/home');
    }
    addToast('Logged out successfully.', 'info');
  };

  // Avatar Upload with Size Check
  const handleAvatarChange = (e) => {
    setFileSizeError('');
    const file = e.target.files[0];
    if (!file) return;

    // Strict 1MB size restriction check (1,048,576 bytes)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileSizeError('Upload failed: File size exceeds the 1MB restriction limit.');
      addToast('File size check failed (> 1MB)', 'error');
      e.target.value = ''; // Reset file input
      return;
    }

    // Convert to base64 for local storage mock
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfileForm((prev) => ({ ...prev, avatar: reader.result }));
      addToast('Avatar uploaded successfully! Click save to update profile.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editProfileForm.name || !editProfileForm.fathersName || !editProfileForm.mothersName) {
      addToast('Name, Father Name, and Mother Name are required.', 'error');
      return;
    }

    setCurrentUser((prev) => ({
      ...prev,
      name: editProfileForm.name,
      fathersName: editProfileForm.fathersName,
      mothersName: editProfileForm.mothersName,
      avatar: editProfileForm.avatar || prev?.avatar || null
    }));

    addToast('Profile updated successfully!', 'success');
    setIsProfileEditOpen(false);
  };

  const openProfileEditor = () => {
    setEditProfileForm({
      name: currentUser?.name || '',
      fathersName: currentUser?.fathersName || '',
      mothersName: currentUser?.mothersName || '',
      avatar: currentUser?.avatar || null
    });
    setFileSizeError('');
    setIsProfileEditOpen(true);
  };

  const handleEnrollCourse = (courseId) => {
    if (!currentUser) return;

    // Add course ID to purchased list
    setCurrentUser((prev) => {
      if (prev.purchasedCourses.includes(courseId)) return prev;
      return {
        ...prev,
        purchasedCourses: [...prev.purchasedCourses, courseId]
      };
    });

    // Increment enrolledCount in dynamic course storage on real user action
    try {
      const stored = localStorage.getItem('edufast_dynamic_courses');
      const courses = stored ? JSON.parse(stored) : [];
      if (Array.isArray(courses)) {
        const updated = courses.map(c => {
          if (c.id === courseId) {
            return {
              ...c,
              enrolledCount: (c.enrolledCount || 0) + 1
            };
          }
          return c;
        });
        localStorage.setItem('edufast_dynamic_courses', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'enroll', courseId } }));
        // Dynamic notification for enrollment
        try {
          addNotification({
            title: `🎉 কোর্স এনরোলমেন্ট নিশ্চিত হয়েছে!`,
            text: `অভিনন্দন! কোর্সে সফলভাবে এনরোলমেন্ট সম্পন্ন হয়েছে। লাইভ ক্লাস ও কোর্স মেটেরিয়াল ড্যাশবোর্ডে যোগ করা হয়েছে।`,
            category: 'course',
            link: 'courses'
          });
        } catch {}
      }
    } catch (e) {
      console.error('Error updating enrolledCount:', e);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = markAllNotificationsRead();
    setNotifications(updated);
    addToast('সব নোটিফিকেশন পড়া হিসেবে চিহ্নিত হয়েছে।', 'success');
  };

  const handleClearAllNotifications = () => {
    const updated = clearAllNotifications();
    setNotifications(updated);
    addToast('সব নোটিফিকেশন ক্লিয়ার করা হয়েছে।', 'info');
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    setNotifications(getNotifications());
    setIsNotificationsOpen(false);
    if (notif.category === 'doubt_solution' || notif.category === 'doubt') {
      window.dispatchEvent(new CustomEvent('open-doubt-corner', { detail: { tab: 'solutions' } }));
    }
    if (notif.link) {
      navigateTo(notif.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Direct secluded render for Admin Portal (no public links or public navbar)
  if (currentPage === 'admin') {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <AdminPortalPage
          onExitToPublic={() => {
            navigateTo('landing');
          }}
        />
      </Suspense>
    );
  }

  // Direct secluded render for Teacher Portal
  if (currentPage === 'teacher') {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <TeacherPortalPage
          onExitToPublic={(target = 'landing', role = 'teacher') => {
            if (target === 'signup') {
              setSignupRole(role);
              navigateTo('signup', role);
            } else if (target === 'login') {
              setLoginModalRole(role);
              navigateTo('landing');
              setIsLoginModalOpen(true);
            } else {
              navigateTo('landing');
            }
          }}
        />
      </Suspense>
    );
  }

  // Direct secluded render for 24/7 Mentor & TA Desk Portal
  if (currentPage === 'mentor') {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <MentorPortalPage
          onExitToPublic={() => {
            window.dispatchEvent(new CustomEvent('edufast-auth-change'));
            navigateTo('landing');
          }}
        />
      </Suspense>
    );
  }



  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* 0. Top Official Broadcast Notice Banner (Visible to all students and public visitors) */}
      <BroadcastNoticeBanner />

      {/* 1. Navbars System */}
      <nav className="navbar">
        {/* Logo left (shown on public pages) */}
        {!currentUser && (
          <div
            className="logo-container"
            style={{ cursor: 'pointer' }}
            title="Go to Landing Page"
            onClick={() => {
              navigateTo('landing');
            }}
          >
            Edufast<span className="logo-dot">.</span>
          </div>
        )}

        {/* Right side public vs auth links */}
        {!currentUser ? (
          // PUBLIC NAVBAR (Landing - নোটিফিকেশন লগইন ছাড়া দেখাবে না)
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="theme-toggle-btn" onClick={toggleDarkMode} aria-label="Toggle Dark Mode" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {activeSession ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  className="btn btn-teal"
                  id="dashboard-btn"
                  onClick={() => {
                    navigateTo(activeSession.targetPage);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    padding: '0.52rem 1.25rem',
                    borderRadius: '25px',
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                    cursor: 'pointer'
                  }}
                  title={language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Go to Dashboard'}
                >
                  <span>⚡</span>
                  <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (activeSession.role === 'mentor') {
                      localStorage.removeItem('edufast_mentor_session');
                    } else if (activeSession.role === 'teacher') {
                      localStorage.removeItem('edufast_teacher_session');
                    } else if (activeSession.role === 'admin') {
                      localStorage.removeItem('edufast_admin_session');
                    } else if (activeSession.role === 'student') {
                      localStorage.removeItem('edufast_student_session');
                      setCurrentUser(null);
                    }
                    window.dispatchEvent(new CustomEvent('edufast-auth-change'));
                    navigateTo('landing');
                  }}
                  style={{
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.8rem',
                    borderRadius: '20px',
                    color: '#e53e3e',
                    borderColor: '#feb2b2'
                  }}
                  title={language === 'bn' ? 'লগআউট' : 'Sign Out'}
                >
                  {language === 'bn' ? 'লগআউট' : 'Logout'}
                </button>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-secondary"
                  id="login-modal-btn"
                  onClick={() => {
                    navigateTo('login', 'student');
                  }}
                >
                  {language === 'bn' ? 'লগইন' : 'Login'}
                </button>
                <button
                  className="btn btn-teal"
                  onClick={() => {
                    setSignupRole('student');
                    navigateTo('signup', 'student');
                  }}
                >
                  {language === 'bn' ? 'সাইন আপ' : 'Sign Up'}
                </button>
              </>
            )}
          </div>
        ) : (
          // AUTHENTICATED NAVBAR (Streamlined Topbar with Sidebar Toggle)
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Left: Clean Single Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className="logo-container"
                style={{ cursor: 'pointer', margin: 0, padding: 0 }}
                title="Go to Dashboard"
                onClick={() => navigateTo('dashboard')}
              >
                Edufast<span className="logo-dot">.</span>
              </div>
            </div>

            {/* Right for Desktop and Tablet (>= 769px) */}
            <div className="nav-links auth-topbar-controls tablet-desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button className="theme-toggle-btn" onClick={toggleDarkMode} aria-label="Toggle Dark Mode" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem' }}>
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              {/* Live Student EduCoins Pill */}
              <div
                title="আপনার মোট EduCoins ব্যালেন্স ও রিওয়ার্ড বিবরণী দেখতে ক্লিক করুন"
                onClick={() => setIsCoinsModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  userSelect: 'none',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <GoldCoinIcon size={16} />
                <span>{studentCoins} Coins</span>
              </div>

              {/* 👑 Pro Subscription / Upgrade Pill */}
              <div
                title={isStudentPremium ? 'EduFast Pro Member (Active)' : 'Upgrade to Pro Admission Pass'}
                onClick={() => {
                  setPaymentTargetItem(null);
                  setIsPaymentModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isStudentPremium 
                    ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' 
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                  userSelect: 'none',
                  transition: 'transform 0.15s'
                }}
              >
                <span>{isStudentPremium ? '👑' : '⭐'}</span>
                <span>{isStudentPremium ? 'PRO MEMBER' : 'PRO PASS'}</span>
              </div>

              {/* Notifications Bell Widget */}
              <NotificationBellWidget
                notifications={notifications}
                unreadCount={unreadCount}
                isOpen={isNotificationsOpen}
                onToggle={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsAvatarDropdownOpen(false);
                }}
                filter={notifFilter}
                onFilterChange={setNotifFilter}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearAllNotifications}
                onNotificationClick={handleNotificationClick}
              />

              {/* Avatar Dropdown */}
              <div className="avatar-container" onClick={(e) => { e.stopPropagation(); setIsAvatarDropdownOpen(!isAvatarDropdownOpen); setIsNotificationsOpen(false); }}>
                <div className="avatar-wrapper">
                  {currentUser.avatar ? (<img src={currentUser.avatar} alt="Profile" className="avatar-img" />) : (<div className="avatar-img">{currentUser.name?.charAt(0) || 'U'}</div>)}
                  <span className="avatar-name">{currentUser.name?.split(' ')[0] || 'User'}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>▼</span>
                </div>
                {isAvatarDropdownOpen && (
                  <div className="avatar-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button className="dropdown-item" onClick={openProfileEditor}>👤 Profile & Details</button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        setPaymentTargetItem(null);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      💳 Subscription & Billing
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" style={{ color: '#e53e3e' }} onClick={handleSignOut}>🚪 Sign Out</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right for Mobile Phones (<= 768px): Compact Coins, Bell, Hamburger */}
            <div className="mobile-auth-controls" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
              {/* Compact Coins Pill */}
              <div
                onClick={() => setIsCoinsModalOpen(true)}
                title="EduCoins ব্যালেন্স ও রিওয়ার্ড দেখতে ক্লিক করুন"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '16px',
                  padding: '3px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <GoldCoinIcon size={14} />
                <span>{studentCoins}</span>
              </div>

              {/* Mobile Pro Pill */}
              <div
                onClick={() => {
                  setPaymentTargetItem(null);
                  setIsPaymentModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: isStudentPremium ? '#0d9488' : '#f59e0b',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '3px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>👑</span>
                <span>{isStudentPremium ? 'PRO' : 'PASS'}</span>
              </div>

              {/* Mobile Notification Bell */}
              <NotificationBellWidget
                notifications={notifications}
                unreadCount={unreadCount}
                isOpen={isNotificationsOpen}
                onToggle={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsAvatarDropdownOpen(false);
                }}
                filter={notifFilter}
                onFilterChange={setNotifFilter}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearAllNotifications}
                onNotificationClick={handleNotificationClick}
              />

              {/* Mobile Menu Drawer Button */}
              <button
                type="button"
                className="mobile-menu-trigger-btn"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Open mobile menu"
                style={{
                  background: isDarkMode ? '#1e293b' : '#f1f5f9',
                  border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--text-charcoal)'
                }}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary-teal)', color: '#fff', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>☰</span>
              </button>
            </div>
          </div>

            {/* Mobile Drawer (Side sheet navigation with backdrop) */}
            {isMobileMenuOpen && (
              <>
                <div 
                  className="mobile-drawer-backdrop" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
                <aside 
                  className="mobile-drawer-sheet" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drawer Header */}
                  <div style={{
                    padding: '1.25rem 1.1rem',
                    borderBottom: '1px solid var(--gray-200, #e2e8f0)',
                    background: isDarkMode ? '#1e293b' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="Profile" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-teal)' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary-teal)', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {currentUser.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-charcoal)' }}>{currentUser.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gray-500)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.4rem',
                        cursor: 'pointer',
                        color: 'var(--gray-500)',
                        padding: '4px 8px'
                      }}
                      aria-label="Close menu"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Quick Actions */}
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--gray-200, #e2e8f0)' }}>
                    <div style={{
                      flex: 1,
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '10px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCoinsModalOpen(true);
                    }}>
                      <GoldCoinIcon size={16} />
                      <span>{studentCoins} EduCoins</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid var(--gray-300, #cbd5e1)',
                        background: 'var(--white, #fff)',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                      title="Theme Toggle"
                    >
                      {isDarkMode ? '☀️' : '🌙'}
                    </button>
                  </div>

                  {/* Drawer Navigation Links */}
                  <div style={{ padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
                    {[
                      { id: 'dashboard', label: '🏠 Dashboard (ড্যাশবোর্ড)' },
                      { id: 'study-planner', label: '⚡ Study Planner (স্টাডি প্ল্যানার)' },
                      { id: 'courses', label: '📚 Course Hub (কোর্স সমূহ)' },
                      { id: 'question-bank', label: '📑 Question Bank (প্রশ্ন ব্যাংক)' },
                      { id: 'live-classes', label: '🔴 Live Classes (লাইভ ক্লাস)' },
                      { id: 'admissions', label: '🎓 Admissions (ভর্তি তথ্য)' },
                      { id: 'higher-study', label: '🌍 Study Abroad (উচ্চশিক্ষা ও বিদেশ)' },
                      { id: 'mocktest', label: '📝 Mock Tests (মক টেস্ট)' },
                      { id: 'study-lounge', label: '🎧 Study Lounge (স্টাডি লাউঞ্জ)' }
                    ].map(navItem => (
                      <button
                        key={navItem.id}
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigateTo(navItem.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: currentPage === navItem.id ? (isDarkMode ? 'rgba(13, 148, 136, 0.25)' : '#ccfbf1') : 'transparent',
                          color: currentPage === navItem.id ? 'var(--primary-teal, #0d9488)' : 'var(--text-charcoal)',
                          fontWeight: currentPage === navItem.id ? 800 : 600,
                          fontSize: '0.9rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        {navItem.label}
                      </button>
                    ))}

                    <div style={{ height: '1px', backgroundColor: 'var(--gray-200, #e2e8f0)', margin: '0.5rem 0.4rem' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('open-ai-chat'));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(13, 148, 136, 0.3)',
                        backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.15)' : '#f0fdfa',
                        color: 'var(--primary-teal, #0d9488)',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles style={{ width: '18px', height: '18px' }} />
                      <span>🤖 EduFast AI অ্যাসিস্ট্যান্ট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openProfileEditor();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-charcoal)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span>👤</span>
                      <span>প্রোফাইল ও ফলাফল দেখুন</span>
                    </button>
                  </div>

                  {/* Drawer Footer Sign Out */}
                  <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid var(--gray-200, #e2e8f0)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #ef4444',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      🚪 Sign Out (লগআউট)
                    </button>
                  </div>
                </aside>
              </>
            )}
          </>
        )}
      </nav>

      {/* 2. Routing Views Wrapper with Professional Collapsible Sidebar */}
      <div style={{ display: 'flex', flexGrow: 1, minHeight: 'calc(100vh - 64px)', position: 'relative' }}>
        {/* Student Sidebar for Authenticated Users (Hidden on Mobile screens <= 768px) */}
        {currentUser && !['landing', 'login', 'signup'].includes(currentPage) && (
          <aside
            className="student-desktop-sidebar"
            style={{
              width: isSidebarCollapsed ? '72px' : '240px',
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              borderRight: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1rem 0.6rem',
              flexShrink: 0,
              zIndex: 40,
              position: 'sticky',
              top: '64px',
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
              boxShadow: isDarkMode ? '4px 0 16px rgba(0,0,0,0.3)' : '2px 0 10px rgba(0,0,0,0.03)'
            }}
          >
            {/* Nav Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
                { id: 'study-planner', label: t('studyPlanner') || 'Study Planner', icon: Calendar, badge: 'AI', accent: '#0d9488' },
                { id: 'courses', label: t('courses') || 'Course Hub', icon: BookOpen },
                { id: 'question-bank', label: t('questionBank') || 'Question Bank', icon: FileQuestion },
                { id: 'live-classes', label: t('liveClasses') || 'Live Classes', icon: Video, badge: 'LIVE' },
                { id: 'admissions', label: t('admissions') || 'Admissions', icon: GraduationCap },
                { id: 'higher-study', label: language === 'bn' ? 'উচ্চশিক্ষা ও বিদেশ' : 'Study Abroad', icon: Globe, accent: '#10b981', badge: 'NEW' },
                { id: 'mocktest', label: t('mockTests') || 'Mock Tests', icon: Award },
                { id: 'study-lounge', label: t('studyLounge') || 'Study Lounge', icon: Headphones, accent: '#38bdf8' }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: isSidebarCollapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isActive
                        ? (isDarkMode ? 'rgba(13, 148, 136, 0.25)' : '#ccfbf1')
                        : 'transparent',
                      color: isActive
                        ? 'var(--primary-teal)'
                        : (item.accent || (isDarkMode ? '#cbd5e1' : '#475569')),
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon style={{ width: '19px', height: '19px', flexShrink: 0 }} />
                    {!isSidebarCollapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {item.label}
                      </span>
                    )}
                    {!isSidebarCollapsed && item.badge && (
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Section: Mentor Support & Collapse Button */}
            <div style={{
              borderTop: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
              paddingTop: '0.75rem',
              paddingBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              {/* Collapse / Expand Toggle Button (in sidebar, positioned 20px up) */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                title={isSidebarCollapsed ? (language === 'bn' ? 'সাইডবার প্রসারিত করুন' : 'Expand Sidebar') : (language === 'bn' ? 'সাইডবার গুটিয়ে নিন' : 'Collapse Sidebar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: isSidebarCollapsed ? '0.7rem 0' : '0.6rem 0.85rem',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                ) : (
                  <>
                    <ChevronLeft style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {language === 'bn' ? 'সাইডবার বন্ধ করুন' : 'Collapse Sidebar'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                title={isSidebarCollapsed ? 'EduFast AI Assistant' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: isSidebarCollapsed ? '0.7rem 0' : '0.6rem 0.85rem',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '10px',
                  border: '1px solid rgba(13, 148, 136, 0.3)',
                  backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.15)' : '#f0fdfa',
                  color: 'var(--primary-teal)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Sparkles style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                {!isSidebarCollapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {language === 'bn' ? 'EduFast AI চ্যাট' : 'EduFast AI Chat'}
                  </span>
                )}
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main style={{ flexGrow: 1, minWidth: 0 }}>
          <Suspense fallback={<PageLoadingFallback />}>
          {currentPage === 'landing' && (
            <LandingPage
              currentUser={currentUser}
              onNavigate={navigateTo}
              onOpenLogin={(role) => {
                if (currentUser) {
                  navigateTo('dashboard');
                } else {
                  navigateTo('login', role || 'student');
                }
              }}
            />
          )}

          {currentPage === 'signup' && (
            <SignupPage
              onRegisterSuccess={handleRegisterSuccess}
              onTeacherRegisterSuccess={handleTeacherRegisterSuccess}
              addToast={addToast}
              onNavigate={navigateTo}
              initialRole={signupRole}
              onOpenLogin={(role) => navigateTo('login', role || 'student')}
            />
          )}

          {currentPage === 'question-bank' && currentUser && (
            <QuestionBankPage
              onStartMockTest={() => navigateTo('mocktest')}
            />
          )}

          {currentPage === 'live-classes' && currentUser && (
            <LiveClassesPage />
          )}

          {currentPage === 'classroom' && currentUser && (
            <CoursePlayerPage
              course={activeCourseForPlayer}
              user={currentUser}
              onBackToCourses={() => navigateTo('courses')}
            />
          )}

          {currentPage === 'dashboard' && currentUser && (
            <StudentDashboardPage
              user={currentUser}
              onNavigate={navigateTo}
              onOpenProfile={() => setIsProfileEditOpen(true)}
              addToast={addToast}
            />
          )}

          {currentPage === 'study-planner' && currentUser && (
            <StudyPlannerPage
              user={currentUser}
              onNavigate={navigateTo}
              addToast={addToast}
            />
          )}

          {currentPage === 'study-lounge' && currentUser && (
            <VirtualStudyLoungePage
              user={currentUser}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'mocktest' && currentUser && (
            <MockTestPage
              user={currentUser}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'admissions' && currentUser && (
            <AdmissionDetailsPage
              user={currentUser}
              addToast={addToast}
              initialSelectedUnivId={selectedAdmissionUnivId}
            />
          )}

          {currentPage === 'higher-study' && currentUser && (
            <HigherStudyPage
              user={currentUser}
              onNavigate={navigateTo}
              addToast={addToast}
            />
          )}

          {currentPage === 'courses' && currentUser && (
            <CourseHubPage
              user={currentUser}
              onEnrollCourse={handleEnrollCourse}
              addToast={addToast}
              onOpenCoursePlayer={handleOpenCoursePlayer}
            />
          )}
        </Suspense>
      </main>
    </div>

      {/* 📱 Modern Mobile Bottom Navigation Bar (Fixed for Mobile Screens <= 768px) */}
      {currentUser && !['landing', 'login', 'signup'].includes(currentPage) && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-bottom-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateTo('dashboard');
            }}
          >
            <LayoutDashboard style={{ width: '20px', height: '20px' }} />
            <span>{language === 'bn' ? 'হোম' : 'Home'}</span>
          </button>

          <button
            type="button"
            className={`mobile-bottom-nav-item ${currentPage === 'courses' || currentPage === 'classroom' ? 'active' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateTo('courses');
            }}
          >
            <BookOpen style={{ width: '20px', height: '20px' }} />
            <span>{language === 'bn' ? 'কোর্স' : 'Courses'}</span>
          </button>

          <button
            type="button"
            className={`mobile-bottom-nav-item ${currentPage === 'mocktest' ? 'active' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateTo('mocktest');
            }}
          >
            <Award style={{ width: '20px', height: '20px' }} />
            <span>{language === 'bn' ? 'মক টেস্ট' : 'Mock Tests'}</span>
          </button>

          <button
            type="button"
            className={`mobile-bottom-nav-item ${currentPage === 'live-classes' ? 'active' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateTo('live-classes');
            }}
          >
            <Video style={{ width: '20px', height: '20px' }} />
            <span>{language === 'bn' ? 'লাইভ' : 'Live Classes'}</span>
          </button>

          <button
            type="button"
            className={`mobile-bottom-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
          >
            <Menu style={{ width: '20px', height: '20px' }} />
            <span>{language === 'bn' ? 'মেনু' : 'Menu'}</span>
          </button>
        </nav>
      )}

      {/* 3. Toast Notifications Overlay */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>
              {t.type === 'success' && '✅'}
              {t.type === 'error' && '❌'}
              {t.type === 'info' && 'ℹ️'}
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{t.message}</div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>&times;</button>
          </div>
        ))}
      </div>

      {/* 4. Login Modal Popup Overlay */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          if (typeof window !== 'undefined') {
            const path = normalizeRoutePath(window.location.pathname);
            const hash = window.location.hash.toLowerCase();
            if (path === '/login' || hash === '#login') {
              const prefix = getSubfolderPrefix();
              window.history.replaceState({ page: 'landing' }, '', `${prefix}/home`);
            }
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
        addToast={addToast}
        onNavigate={navigateTo}
        initialRole={loginModalRole}
      />

      {/* 5. Protected Comprehensive Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        user={currentUser}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('edufast_student_session', JSON.stringify(updatedUser));
          } catch (e) {}
        }}
        addToast={addToast}
      />


      {/* 5b. Dedicated bKash & Nagad Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetItem={paymentTargetItem}
        currentUser={currentUser}
        onPaymentSuccess={(data) => {
          setIsStudentPremium(true);
          if (currentUser) {
            const updated = { ...currentUser, isPremium: true };
            setCurrentUser(updated);
            try {
              localStorage.setItem('edufast_student_session', JSON.stringify(updated));
            } catch (e) {}
          }
        }}
        addToast={addToast}
      />

      {/* 5c. EduCoins Rewards & Wallet Breakdown Modal */}
      <EduCoinsWalletModal
        isOpen={isCoinsModalOpen}
        onClose={() => setIsCoinsModalOpen(false)}
        coins={studentCoins}
        onNavigate={navigateTo}
      />


      {/* 6. Unified Global AI Admission Advisor & 24/7 Live Mentor Solver */}
      <AIAssistant
        user={currentUser}
        onOpenLogin={() => {
          if (currentUser) {
            navigateTo('dashboard');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

    </div>
  );
}

export default App;
