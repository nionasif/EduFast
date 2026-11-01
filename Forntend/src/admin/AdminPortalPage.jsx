import React, { useState, useEffect, useMemo } from 'react';
import {
  getCourses, saveCourse, deleteCourse,
  getAdmissions, saveAdmission, deleteAdmission
} from '../data/mockData';
import api from '../services/api';
import { socket } from '../socket';
import '../admin.css';

// Modular Components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminLogin from './components/AdminLogin';
import AdminCourseModal from './components/AdminCourseModal';
import AdminCurriculumModal from './components/AdminCurriculumModal';
import AdminUniversityModal from './components/AdminUniversityModal';
import AdminStudentDetailModal from './components/AdminStudentDetailModal';

// Modular Tabs
import AdminOverviewTab from './tabs/AdminOverviewTab';
import AdminStudentsTab from './tabs/AdminStudentsTab';
import AdminCoursesTab from './tabs/AdminCoursesTab';
import AdminUniversitiesTab from './tabs/AdminUniversitiesTab';
import AdminAnalyticsTab from './tabs/AdminAnalyticsTab';
import AdminNoticesTab from './tabs/AdminNoticesTab';
import AdminSettingsTab from './tabs/AdminSettingsTab';
import AdminDatabaseStudioTab from './tabs/AdminDatabaseStudioTab';
import AdminPromotionsTab from './tabs/AdminPromotionsTab';
import AdminHigherStudyTab from './tabs/AdminHigherStudyTab';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';


export default function AdminPortalPage({ onExitToPublic }) {
  // -------------------------------------------------------------
  // Authentication State
  // -------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('edufast_admin_session');
  });
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '', remember: true });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // -------------------------------------------------------------
  // Theme State (Dark & Light Mode)
  // -------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('edufast_theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark-theme');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('edufast_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('edufast_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // -------------------------------------------------------------
  // Dashboard Tabs & Navigation
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // -------------------------------------------------------------
  // Dynamic Stores & Backend State
  // -------------------------------------------------------------
  const [backendLive, setBackendLive] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState(getCourses);
  const [admissions, setAdmissions] = useState(getAdmissions);

  // Student Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [boardFilter, setBoardFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Course Management State
  const [courseSearch, setCourseSearch] = useState('');
  const [courseGroupFilter, setCourseGroupFilter] = useState('All');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '', instructor: '', group: 'Science', duration: '40 Hours',
    price: 3000, discountedPrice: 1500, badge: 'AI-Powered', image: '⚛️',
    description: ''
  });
  const [deleteCourseConfirmId, setDeleteCourseConfirmId] = useState(null);

  // Curriculum & Video Lecture Management State
  const [curriculumCourse, setCurriculumCourse] = useState(null);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const handleOpenCurriculum = (c) => {
    setCurriculumCourse(c);
    setIsCurriculumModalOpen(true);
  };

  // University Management State
  const [univSearch, setUnivSearch] = useState('');
  const [isUnivModalOpen, setIsUnivModalOpen] = useState(false);
  const [editingUnivId, setEditingUnivId] = useState(null);
  const [univForm, setUnivForm] = useState({
    name: '', logo: '🏛️', description: '', examDate: 'December 20, 2026',
    deadlineDate: '2026-12-05', applicationFee: 1000,
    units: [
      { name: 'Unit A (Science)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math', details: 'Science unit with high competition.' }
    ]
  });
  const [deleteUnivConfirmId, setDeleteUnivConfirmId] = useState(null);

  // Notices State
  const [notices, setNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_admin_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newNotice, setNewNotice] = useState({ title: '', priority: 'General', content: '' });

  // Settings Password State
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirmPwd: '' });
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });



  // External data update synchronization
  useEffect(() => {
    const handleUpdate = () => {
      setCourses(getCourses());
      setAdmissions(getAdmissions());
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => window.removeEventListener('edufast-data-update', handleUpdate);
  }, []);

  // Real-time socket event listeners for course updates, teacher submissions, and approvals
  useEffect(() => {
    const handleNewCourse = (newCourse) => {
      if (!newCourse || !newCourse.id) return;
      const isApproved = (newCourse.isApproved === 1 || newCourse.isApproved === true || newCourse.isApproved === '1');
      const formatted = {
        ...newCourse,
        isApproved,
        status: newCourse.status || (isApproved ? 'Approved' : 'Pending')
      };
      setCourses(prev => {
        const idx = prev.findIndex(c => String(c.id) === String(newCourse.id));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...formatted };
          return updated;
        }
        return [formatted, ...prev];
      });
    };

    const handleStatusUpdate = (data) => {
      if (!data || !data.courseId) return;
      setCourses(prev => prev.map(c => {
        if (String(c.id) === String(data.courseId)) {
          return {
            ...c,
            isApproved: data.isApproved,
            status: data.status,
            approvedAt: data.isApproved ? new Date().toISOString() : null
          };
        }
        return c;
      }));
    };

    const handleDeleteCourse = (data) => {
      if (!data || !data.id) return;
      setCourses(prev => prev.filter(c => String(c.id) !== String(data.id)));
    };

    socket.on('course:new', handleNewCourse);
    socket.on('course:update', handleNewCourse);
    socket.on('admin:course_pending', (payload) => {
      if (payload?.course) handleNewCourse(payload.course);
    });
    socket.on('course:status_updated', handleStatusUpdate);
    socket.on('course:approval_changed', handleStatusUpdate);
    socket.on('course:deleted', handleDeleteCourse);

    return () => {
      socket.off('course:new', handleNewCourse);
      socket.off('course:update', handleNewCourse);
      socket.off('admin:course_pending');
      socket.off('course:status_updated', handleStatusUpdate);
      socket.off('course:approval_changed', handleStatusUpdate);
      socket.off('course:deleted', handleDeleteCourse);
    };
  }, []);

  // Fetch backend data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoadingData(true);
      try {
        const studentRes = await fetch(`${BACKEND_URL}/api/admin/students`);
        if (studentRes.ok) {
          const studentJson = await studentRes.json();
          if (studentJson.success) {
            setStudents(studentJson.data || []);
            setBackendLive(true);
          }
        }

        const univRes = await fetch(`${BACKEND_URL}/api/admin/universities`);
        if (univRes.ok) {
          const univJson = await univRes.json();
          if (univJson.success && Array.isArray(univJson.data) && univJson.data.length > 0) {
            setAdmissions(univJson.data);
            localStorage.setItem('edufast_dynamic_admissions', JSON.stringify(univJson.data));
          }
        }

        const noticeRes = await fetch(`${BACKEND_URL}/api/notices`);
        if (noticeRes.ok) {
          const noticeJson = await noticeRes.json();
          const list = Array.isArray(noticeJson?.data) 
            ? noticeJson.data 
            : Array.isArray(noticeJson) ? noticeJson : [];
          setNotices(list);
          localStorage.setItem('edufast_admin_notices', JSON.stringify(list));
        }

        const coursesRes = await fetch(`${BACKEND_URL}/api/admin/courses`);
        if (coursesRes.ok) {
          const coursesJson = await coursesRes.json();
          if (coursesJson.success && Array.isArray(coursesJson.data)) {
            const normalized = coursesJson.data.map(c => {
              const isApproved = (c.isApproved === 1 || c.isApproved === true || c.isApproved === '1');
              return {
                ...c,
                isApproved,
                status: c.status || (isApproved ? 'Approved' : 'Pending')
              };
            });
            setCourses(normalized);
            localStorage.setItem('edufast_dynamic_courses', JSON.stringify(normalized));
          }
        }
      } catch {
        setBackendLive(false);
      } finally {
        setLoadingData(false);
      }
    };
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await api.post('/auth/login', {
        email: loginForm.username.trim(),
        password: loginForm.password,
        role: 'admin'
      });

      const data = res.data || res;
      if (data && (data.token || data.user || data.success)) {
        const adminObj = {
          name: data.user?.name || 'EduFast Administrator',
          username: data.user?.email || loginForm.username,
          email: data.user?.email || loginForm.username,
          role: 'System Administrator',
          token: data.token,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('edufast_admin_session', JSON.stringify(adminObj));
        if (data.token) {
          localStorage.setItem('edufast_token', data.token);
        }
        setAdminUser(adminObj);
        setIsAuthenticated(true);
      } else {
        setLoginError(data?.error || data?.message || 'Invalid Administrator credentials!');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid Administrator credentials!';
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('edufast_admin_session');
    setIsAuthenticated(false);
    setAdminUser(null);
    if (onExitToPublic) {
      onExitToPublic();
    }
  };

  // Course handlers
  const handleOpenAddCourse = () => {
    setEditingCourseId(null);
    setCourseForm({
      title: '', instructor: '', group: 'Science', duration: '40 Hours',
      price: 3000, discountedPrice: 1500, badge: 'AI-Powered', image: '⚛️',
      description: ''
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      instructor: course.instructor,
      group: course.group,
      duration: course.duration,
      price: course.price,
      discountedPrice: course.discountedPrice || course.price,
      badge: course.badge || 'Popular',
      image: course.image || '📚',
      description: course.description || ''
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    const coursePayload = {
      id: editingCourseId || `course-${Date.now()}`,
      ...courseForm,
      price: Number(courseForm.price),
      discountedPrice: Number(courseForm.discountedPrice) || Number(courseForm.price)
    };
    const updated = saveCourse(coursePayload);
    setCourses(updated);
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = (id) => {
    const updated = deleteCourse(id);
    setCourses(updated);
    setDeleteCourseConfirmId(null);
  };

  const handleToggleCourseApproval = async (course) => {
    const nextApproved = !course.isApproved;
    const updatedCourse = {
      ...course,
      isApproved: nextApproved,
      status: nextApproved ? 'Approved' : 'Pending',
      approvedAt: nextApproved ? new Date().toISOString() : null
    };
    const updated = saveCourse(updatedCourse);
    setCourses(updated);
    if (curriculumCourse && curriculumCourse.id === course.id) {
      setCurriculumCourse(updatedCourse);
    }

    // Sync with backend SQLite
    try {
      await fetch(`${BACKEND_URL}/api/admin/courses/${course.id}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: nextApproved })
      });

    } catch (e) {
      console.warn('Backend approval sync notice:', e.message);
    }
  };

  // University handlers
  const handleOpenAddUniv = () => {
    setEditingUnivId(null);
    setUnivForm({
      name: '', logo: '🏛️', description: '', examDate: 'December 20, 2026',
      deadlineDate: '2026-12-05', applicationFee: 1000,
      units: [
        { name: 'Unit A (Science)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math', details: 'Science unit with high competition.' }
      ]
    });
    setIsUnivModalOpen(true);
  };

  const handleOpenEditUniv = (univ) => {
    setEditingUnivId(univ.id);
    setUnivForm({
      name: univ.name,
      logo: univ.logo || '🏛️',
      description: univ.description || '',
      examDate: univ.examDate || '',
      deadlineDate: univ.deadlineDate || '',
      applicationFee: univ.applicationFee || 1000,
      units: univ.units ? [...univ.units] : []
    });
    setIsUnivModalOpen(true);
  };

  const handleSaveUniv = async (e) => {
    e.preventDefault();
    const univPayload = {
      id: editingUnivId || `univ-${Date.now()}`,
      ...univForm,
      applicationFee: Number(univForm.applicationFee)
    };
    const updated = saveAdmission(univPayload);
    setAdmissions(updated);
    setIsUnivModalOpen(false);

    try {
      if (editingUnivId) {
        await fetch(`${BACKEND_URL}/api/admin/universities/${editingUnivId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(univPayload)
        });
      } else {
        await fetch(`${BACKEND_URL}/api/admin/universities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(univPayload)
        });
      }
    } catch (err) {
      console.error('Error saving university to backend:', err);
    }
  };

  const handleDeleteUniv = async (id) => {
    const updated = deleteAdmission(id);
    setAdmissions(updated);
    setDeleteUnivConfirmId(null);
    try {
      await fetch(`${BACKEND_URL}/api/admin/universities/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting university from backend:', err);
    }
  };

  const handleAddUnitRow = () => {
    setUnivForm(prev => ({
      ...prev,
      units: [
        ...prev.units,
        { name: 'New Unit', group: 'Science', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'General Subjects', details: '' }
      ]
    }));
  };

  const handleRemoveUnitRow = (index) => {
    setUnivForm(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const handleUnitChange = (index, field, value) => {
    setUnivForm(prev => {
      const copy = [...prev.units];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, units: copy };
    });
  };



  const handleDeleteStudent = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/students/${id}`, { method: 'DELETE' });
    } catch {}
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  };

  // Calculations
  const totalCount = students.length;
  const avgSsc = totalCount > 0 ? (students.reduce((acc, s) => acc + (parseFloat(s.sscGpa) || 0), 0) / totalCount).toFixed(2) : '5.00';
  const avgHsc = totalCount > 0 ? (students.reduce((acc, s) => acc + (parseFloat(s.hscGpa) || 0), 0) / totalCount).toFixed(2) : '5.00';

  // Filtered queries
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mobile?.includes(searchQuery) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sscRoll?.includes(searchQuery) ||
        s.hscRoll?.includes(searchQuery);

      const matchesGroup = groupFilter === 'All' || s.academicGroup === groupFilter;
      const matchesBoard = boardFilter === 'All' || s.sscBoard === boardFilter || s.hscBoard === boardFilter;

      return matchesSearch && matchesGroup && matchesBoard;
    });
  }, [students, searchQuery, groupFilter, boardFilter]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = !courseSearch ||
        c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.badge?.toLowerCase().includes(courseSearch.toLowerCase());
      const matchesGroup = courseGroupFilter === 'All' || c.group === courseGroupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [courses, courseSearch, courseGroupFilter]);

  const filteredUniversities = useMemo(() => {
    return admissions.filter((u) => {
      return !univSearch ||
        u.name?.toLowerCase().includes(univSearch.toLowerCase()) ||
        u.description?.toLowerCase().includes(univSearch.toLowerCase());
    });
  }, [admissions, univSearch]);

  // -------------------------------------------------------------
  // RENDER: LOGIN (If not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <AdminLogin
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        handleLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onExitToPublic={onExitToPublic}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="admin-shell">
      {/* 1. Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
        totalStudentsCount={totalCount}
        coursesCount={courses.length}
        universitiesCount={admissions.length}
        noticesCount={notices.length}
        adminUser={adminUser}
        handleLogout={handleLogout}
      />

      {/* 2. Main Shell */}
      <div className="admin-main">
        <AdminHeader
          activeTab={activeTab}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
          backendLive={backendLive}
          onExitToPublic={onExitToPublic}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Dynamic Content Area */}
        <main className="admin-content">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              totalCount={totalCount}
              courses={courses}
              admissions={admissions}
              avgHsc={avgHsc}
              avgSsc={avgSsc}
              backendLive={backendLive}
              setActiveTab={setActiveTab}
              handleOpenAddCourse={handleOpenAddCourse}
              handleOpenAddUniv={handleOpenAddUniv}
            />
          )}

          {activeTab === 'students' && (
            <AdminStudentsTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              boardFilter={boardFilter}
              setBoardFilter={setBoardFilter}
              filteredStudents={filteredStudents}
              setSelectedStudent={setSelectedStudent}
              setDeleteConfirmId={setDeleteConfirmId}
            />
          )}

          {activeTab === 'courses' && (
            <AdminCoursesTab
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              courseGroupFilter={courseGroupFilter}
              setCourseGroupFilter={setCourseGroupFilter}
              filteredCourses={filteredCourses}
              setDeleteCourseConfirmId={setDeleteCourseConfirmId}
              handleOpenCurriculum={handleOpenCurriculum}
              handleToggleCourseApproval={handleToggleCourseApproval}
            />
          )}

          {activeTab === 'universities' && (
            <AdminUniversitiesTab
              univSearch={univSearch}
              setUnivSearch={setUnivSearch}
              handleOpenAddUniv={handleOpenAddUniv}
              filteredUniversities={filteredUniversities}
              handleOpenEditUniv={handleOpenEditUniv}
              setDeleteUnivConfirmId={setDeleteUnivConfirmId}
            />
          )}



          {activeTab === 'analytics' && (
            <AdminAnalyticsTab
              students={students}
              totalCount={totalCount}
              admissions={admissions}
            />
          )}

          {activeTab === 'notices' && (
            <AdminNoticesTab
              newNotice={newNotice}
              setNewNotice={setNewNotice}
              notices={notices}
              setNotices={setNotices}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              pwdMsg={pwdMsg}
              setPwdMsg={setPwdMsg}
              pwdForm={pwdForm}
              setPwdForm={setPwdForm}
              backendLive={backendLive}
              courses={courses}
              admissions={admissions}
              totalCount={totalCount}
              setCourses={setCourses}
              setAdmissions={setAdmissions}
              setNotices={setNotices}
            />
          )}

          {activeTab === 'db-studio' && (
            <AdminDatabaseStudioTab />
          )}

          {activeTab === 'promotions' && (
            <AdminPromotionsTab />
          )}

          {activeTab === 'higher-study' && (
            <AdminHigherStudyTab />
          )}
        </main>
      </div>

      {/* Modals */}
      <AdminCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        editingCourseId={editingCourseId}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        handleSaveCourse={handleSaveCourse}
      />

      <AdminCurriculumModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        course={curriculumCourse}
        onToggleApproval={handleToggleCourseApproval}
      />

      <AdminUniversityModal
        isOpen={isUnivModalOpen}
        onClose={() => setIsUnivModalOpen(false)}
        editingUnivId={editingUnivId}
        univForm={univForm}
        setUnivForm={setUnivForm}
        handleSaveUniv={handleSaveUniv}
        handleAddUnitRow={handleAddUnitRow}
        handleRemoveUnitRow={handleRemoveUnitRow}
        handleUnitChange={handleUnitChange}
      />



      <AdminStudentDetailModal
        selectedStudent={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Delete Confirmations */}
      {deleteCourseConfirmId && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteCourseConfirmId(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>Delete Course?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Are you sure you want to delete this course? It will be removed from Course Hub immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteCourseConfirmId(null)}>Cancel</button>
              <button className="admin-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleDeleteCourse(deleteCourseConfirmId)}>
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUnivConfirmId && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteUnivConfirmId(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>Delete University?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Are you sure you want to delete this university? It will be removed from Admission Details and GPA Calculator.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteUnivConfirmId(null)}>Cancel</button>
              <button className="admin-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleDeleteUniv(deleteUnivConfirmId)}>
                Delete University
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>Delete Student Record?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Permanently remove this student record from SQLite?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="admin-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleDeleteStudent(deleteConfirmId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
