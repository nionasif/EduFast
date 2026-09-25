import { useState, useEffect, lazy, Suspense } from 'react';

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
const CourseHubPage = lazy(() => import('./student/pages/CourseHubPage'));
const CoursePlayerPage = lazy(() => import('./student/pages/CoursePlayerPage'));
const LiveClassesPage = lazy(() => import('./student/pages/LiveClassesPage'));
const MockTestPage = lazy(() => import('./student/pages/MockTestPage'));
const QuestionBankPage = lazy(() => import('./student/pages/QuestionBankPage'));
const AdmissionDetailsPage = lazy(() => import('./student/pages/AdmissionDetailsPage'));
const VirtualStudyLoungePage = lazy(() => import('./student/pages/VirtualStudyLoungePage'));
const SignupPage = lazy(() => import('./common/pages/SignupPage'));
const LoginPage = lazy(() => import('./common/pages/LoginPage'));

import AIAssistant from './student/components/AIAssistant';
import StudentProfileModal from './student/components/StudentProfileModal';
import { socket } from './socket';
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
  MessageSquare
} from 'lucide-react';

import './App.css';

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
  '/courses': 'courses',
  '/classroom': 'classroom',
  '/question-bank': 'question-bank',
  '/live-classes': 'live-classes',
  '/mocktest': 'mocktest',
  '/mock-tests': 'mocktest',
  '/admissions': 'admissions',
  '/study-lounge': 'study-lounge',
  '/lounge': 'study-lounge',
  '/login': 'login',
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
  courses: '/courses',
  classroom: '/classroom',
  'question-bank': '/question-bank',
  'live-classes': '/live-classes',
  mocktest: '/mocktest',
  admissions: '/admissions',
  'study-lounge': '/study-lounge',
  login: '/login',
  signup: '/signup',
  admin: '/admin',
  teacher: '/teacher',
  mentor: '/mentor'
};

const PROTECTED_PAGES = [
  'dashboard',
  'admissions',
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
    if (hash === '#admin') return 'admin';
    if (hash === '#teacher') return 'teacher';
    if (hash === '#mentor') return 'mentor';
    if (hash === '#login') return 'login';
    if (hash === '#signup') return 'signup';

    const matchedPage = ROUTE_MAP[path];
    if (matchedPage) {
      if (PROTECTED_PAGES.includes(matchedPage)) {
        try {
          const saved = localStorage.getItem('edufast_student_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.email || (parsed.name && parsed.name.trim()))) {
              return matchedPage;
            }
          }
        } catch { }
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  useEffect(() => {
    const handleCoins = (e) => {
      if (e.detail?.coins !== undefined) {
        setStudentCoins(e.detail.coins);
      }
    };
    window.addEventListener('edufast-coins-update', handleCoins);
    return () => window.removeEventListener('edufast-coins-update', handleCoins);
  }, []);

  useEffect(() => {
    setStudentCoins(getStudentCoins(currentUser));
  }, [currentUser]);

  // Reactive listeners for dynamic real-time notifications
  useEffect(() => {
    const handleNotifUpdate = () => {
      setNotifications(getNotifications());
    };
    const handleNewNotification = (e) => {
      setNotifications(getNotifications());
      if (currentUser && e.detail?.title) {
        addToast(e.detail.title, 'info');
      }
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

    window.addEventListener('edufast-data-update', handleNotifUpdate);
    window.addEventListener('edufast-notification-added', handleNewNotification);
    window.addEventListener('open-student-profile', handleOpenProfileModal);
    socket.on('class:status_change', handleClassStatus);
    return () => {
      window.removeEventListener('edufast-data-update', handleNotifUpdate);
      window.removeEventListener('edufast-notification-added', handleNewNotification);
      window.removeEventListener('open-student-profile', handleOpenProfileModal);
      socket.off('class:status_change', handleClassStatus);
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
      const path = normalizeRoutePath(window.location.pathname);
      const hash = window.location.hash.toLowerCase();

      let targetPage = 'landing';
      if (hash === '#admin') targetPage = 'admin';
      else if (hash === '#teacher') targetPage = 'teacher';
      else if (hash === '#mentor') targetPage = 'mentor';
      else if (hash === '#login') targetPage = 'login';
      else if (hash === '#signup') targetPage = 'signup';
      else if (ROUTE_MAP[path]) targetPage = ROUTE_MAP[path];

      const prefix = getSubfolderPrefix();
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
    if (pageName === 'signup') {
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
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: 'login' }, '', '/login');
      }
      setIsMobileMenuOpen(false);
      return;
    }

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
            navigateTo('landing');
          }}
        />
      </Suspense>
    );
  }



  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

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
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(13, 148, 136, 0.12)',
                border: '1px solid rgba(13, 148, 136, 0.35)',
                color: 'var(--primary-teal)',
                padding: '0.35rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Globe style={{ width: '13px', height: '13px' }} />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            <button className="theme-toggle-btn" onClick={toggleDarkMode} aria-label="Toggle Dark Mode" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
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

            {/* Right: Controls (Language, Theme, Coins, Notifications, Avatar) */}
            <div className="nav-links desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(13, 148, 136, 0.12)',
                  border: '1px solid rgba(13, 148, 136, 0.35)',
                  color: 'var(--primary-teal)',
                  padding: '0.32rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Globe style={{ width: '13px', height: '13px' }} />
                <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>

              <button className="theme-toggle-btn" onClick={toggleDarkMode} aria-label="Toggle Dark Mode" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem' }}>
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              {/* Live Student EduCoins Pill */}
              <div
                title="আপনার মোট EduCoins ব্যালেন্স (ড্যাশবোর্ডে যান)"
                onClick={() => navigateTo('dashboard')}
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
                  userSelect: 'none'
                }}
              >
                <span>🪙</span>
                <span>{studentCoins} Coins</span>
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
                  {currentUser.avatar ? (<img src={currentUser.avatar} alt="Profile" className="avatar-img" />) : (<div className="avatar-img">{currentUser.name.charAt(0)}</div>)}
                  <span className="avatar-name">{currentUser.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>▼</span>
                </div>
                {isAvatarDropdownOpen && (
                  <div className="avatar-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button className="dropdown-item" onClick={openProfileEditor}>👤 Profile & Details</button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" style={{ color: '#e53e3e' }} onClick={handleSignOut}>🚪 Sign Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Mobile slide-down menu */}
            {isMobileMenuOpen && (
              <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
                <a className={`mobile-nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>🏠 Dashboard</a>
                <a className={`mobile-nav-link ${currentPage === 'courses' ? 'active' : ''}`} onClick={() => navigateTo('courses')}>📚 Course Hub</a>
                <a className={`mobile-nav-link ${currentPage === 'question-bank' ? 'active' : ''}`} onClick={() => navigateTo('question-bank')}>📑 Question Bank</a>
                <a className={`mobile-nav-link ${currentPage === 'live-classes' ? 'active' : ''}`} onClick={() => navigateTo('live-classes')}>🔴 Live Classes</a>
                <a className={`mobile-nav-link ${currentPage === 'admissions' ? 'active' : ''}`} onClick={() => navigateTo('admissions')}>🎓 Admissions</a>
                <a className={`mobile-nav-link ${currentPage === 'mocktest' ? 'active' : ''}`} onClick={() => navigateTo('mocktest')}>📝 Mock Tests</a>
                <a className={`mobile-nav-link ${currentPage === 'study-lounge' ? 'active' : ''}`} onClick={() => navigateTo('study-lounge')}>🎧 24/7 Study Lounge</a>
                <a
                  className="mobile-nav-link"
                  style={{ color: 'var(--primary-teal, #319795)', fontWeight: 600 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-mentor-chat'));
                  }}
                >
                  💬 24/7 Live Mentor Chat (মেন্টর সাপোর্ট)
                </a>
                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div className="avatar-img" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>{currentUser.name.charAt(0)}</div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser.name}</span>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', marginLeft: 'auto' }} onClick={() => { openProfileEditor(); setIsMobileMenuOpen(false); }}>Edit Profile</button>
                  <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: '#e53e3e', border: '1px solid #e53e3e', background: 'none' }} onClick={handleSignOut}>Sign Out</button>
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {/* 2. Routing Views Wrapper with Professional Collapsible Sidebar */}
      <div style={{ display: 'flex', flexGrow: 1, minHeight: 'calc(100vh - 65px)', position: 'relative' }}>
        {/* Student Sidebar for Authenticated Users */}
        {currentUser && !['landing', 'login', 'signup'].includes(currentPage) && (
          <aside
            style={{
              width: isSidebarCollapsed ? '72px' : '240px',
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              borderRight: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1rem 0.6rem',
              flexShrink: 0,
              zIndex: 40,
              position: 'sticky',
              top: '65px',
              height: 'calc(100vh - 65px)',
              overflowY: 'auto',
              boxShadow: isDarkMode ? '4px 0 16px rgba(0,0,0,0.3)' : '2px 0 10px rgba(0,0,0,0.03)'
            }}
          >
            {/* Nav Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
                { id: 'courses', label: t('courses') || 'Course Hub', icon: BookOpen },
                { id: 'question-bank', label: t('questionBank') || 'Question Bank', icon: FileQuestion },
                { id: 'live-classes', label: t('liveClasses') || 'Live Classes', icon: Video, badge: 'LIVE' },
                { id: 'admissions', label: t('admissions') || 'Admissions', icon: GraduationCap },
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
                onClick={() => window.dispatchEvent(new CustomEvent('open-mentor-chat'))}
                title={isSidebarCollapsed ? '24/7 Live Mentor' : undefined}
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
                <MessageSquare style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                {!isSidebarCollapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {language === 'bn' ? '২৪/৭ লাইভ মেন্টর' : '24/7 Live Mentor'}
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
              onNavigate={navigateTo}
              onOpenLogin={(role) => navigateTo('login', role || 'student')}
            />
          )}

          {currentPage === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onTeacherLoginSuccess={handleTeacherLoginSuccess}
              addToast={addToast}
              onNavigate={navigateTo}
              initialRole={loginModalRole}
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
        onClose={() => setIsLoginModalOpen(false)}
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

      {/* 6. Unified Global AI Admission Advisor & 24/7 Live Mentor Solver */}
      <AIAssistant user={currentUser} onOpenLogin={() => setIsLoginModalOpen(true)} />

    </div>
  );
}

export default App;
