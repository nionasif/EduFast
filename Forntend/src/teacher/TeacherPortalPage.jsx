import React, { useState, useEffect, useRef } from 'react';
import {
  getCourses, saveCourse, deleteCourse,
  getLiveClasses, saveLiveClass, deleteLiveClass,
  getTeacherRecordings, saveTeacherRecording, deleteTeacherRecording,
  getTeacherProfile, saveTeacherProfile, DEFAULT_TEACHER,
  addNotification
} from '../data/mockData';
import { socket } from '../socket';
import { Trash2 } from 'lucide-react';
import '../admin.css';

// Modular Components
import TeacherHeader from './components/TeacherHeader';
import TeacherLogin from './components/TeacherLogin';
import ScheduleLiveModal from './components/ScheduleLiveModal';
import TeacherCourseModal from './components/TeacherCourseModal';
import TeacherRecordingModal from './components/TeacherRecordingModal';
import RecordingPreviewModal from './components/RecordingPreviewModal';
import EndClassModal from './components/EndClassModal';

// Modular Tab Views
import TeacherOverviewTab from './tabs/TeacherOverviewTab';
import TeacherLiveStudioTab from './tabs/TeacherLiveStudioTab';
import TeacherRecordingsTab from './tabs/TeacherRecordingsTab';
import TeacherCoursesTab from './tabs/TeacherCoursesTab';
import TeacherNoticesTab from './tabs/TeacherNoticesTab';
import TeacherProfileTab from './tabs/TeacherProfileTab';
import TeacherCurriculumModal from './components/TeacherCurriculumModal';

export default function TeacherPortalPage({ onExitToPublic }) {
  // -------------------------------------------------------------
  // Authentication State
  // -------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('edufast_teacher_session');
  });

  const [teacherUser, setTeacherUser] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_teacher_session');
      return saved ? JSON.parse(saved) : getTeacherProfile();
    } catch {
      return DEFAULT_TEACHER;
    }
  });

  const [loginForm, setLoginForm] = useState({
    email: 'teacher@edufast.com',
    password: 'password123'
  });
  const [loginError, setLoginError] = useState('');

  // -------------------------------------------------------------
  // Theme State (Dark & Light Mode)
  // -------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('edufast_theme') || localStorage.getItem('edufast_teacher_theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark-theme');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('edufast_theme', 'dark');
      localStorage.setItem('edufast_teacher_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('edufast_theme', 'light');
      localStorage.setItem('edufast_teacher_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Dynamic Theme Tokens for Rich Light & Dark Aesthetics
  const theme = {
    isDark: isDarkMode,
    bg: isDarkMode ? '#0b0f19' : '#f7fafc',
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    cardBgElevated: isDarkMode ? '#1e293b' : '#f8fafc',
    cardBorder: isDarkMode ? '#1f2937' : '#e2e8f0',
    headerBg: isDarkMode ? '#0f172a' : '#1a202c',
    headerBorder: isDarkMode ? '#1e293b' : '#2d3748',
    text: isDarkMode ? '#f8fafc' : '#1a202c',
    textSecondary: isDarkMode ? '#cbd5e1' : '#4a5568',
    textMuted: isDarkMode ? '#94a3b8' : '#718096',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff',
    inputBorder: isDarkMode ? '#374151' : '#cbd5e0',
    inputText: isDarkMode ? '#f8fafc' : '#1a202c',
    tableHeaderBg: isDarkMode ? '#1e293b' : '#f7fafc',
    tableBorder: isDarkMode ? '#1f2937' : '#edf2f7',
    modalBg: isDarkMode ? '#111827' : '#ffffff',
    modalBorder: isDarkMode ? '#1f2937' : '#e2e8f0',
  };

  // -------------------------------------------------------------
  // Navigation & Toasts
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'live-studio' | 'recordings' | 'courses' | 'notices' | 'settings'
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // -------------------------------------------------------------
  // Core Dynamic Data Stores
  // -------------------------------------------------------------
  const [courses, setCourses] = useState(() => getCourses());
  const [liveSessions, setLiveSessions] = useState(() => getLiveClasses());
  const [recordings, setRecordings] = useState(() => getTeacherRecordings());
  const [notices, setNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_teacher_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cross-system reactive data update listener
  useEffect(() => {
    const refreshData = () => {
      setCourses(getCourses());
      setLiveSessions(getLiveClasses());
      setRecordings(getTeacherRecordings());
    };
    window.addEventListener('edufast-data-update', refreshData);
    return () => window.removeEventListener('edufast-data-update', refreshData);
  }, []);

  // -------------------------------------------------------------
  // Login & Logout Handlers
  // -------------------------------------------------------------
  const handleTeacherLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    if (loginForm.email.includes('@') && loginForm.password.length >= 6) {
      const profile = getTeacherProfile();
      const sessionData = { ...profile, email: loginForm.email };
      localStorage.setItem('edufast_teacher_session', JSON.stringify(sessionData));
      setTeacherUser(sessionData);
      setIsAuthenticated(true);
      addToast('Welcome back! Successfully logged into Teacher Studio.', 'success');
    } else {
      setLoginError('Invalid credentials. Password must be at least 6 characters.');
    }
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem('edufast_teacher_session');
    setIsAuthenticated(false);
    addToast('You have been logged out of Teacher Studio.', 'info');
  };

  const handleTeacherRegister = (newTeacherData) => {
    const profile = {
      ...DEFAULT_TEACHER,
      ...newTeacherData,
      id: `teacher-${Date.now()}`,
      rating: 0,
      totalClasses: 0,
      totalStudents: 0
    };
    saveTeacherProfile(profile);
    localStorage.setItem('edufast_teacher_session', JSON.stringify(profile));
    setTeacherUser(profile);
    setIsAuthenticated(true);
    addToast(`Welcome ${profile.name}! Instructor account created successfully.`, 'success');
  };


  // -------------------------------------------------------------
  // LIVE STUDIO STATE & LOGIC
  // -------------------------------------------------------------
  const [isLiveStudioActive, setIsLiveStudioActive] = useState(false);
  const [currentBroadcastingSession, setCurrentBroadcastingSession] = useState(null);
  const [liveStudioTab, setLiveStudioTab] = useState('whiteboard'); // 'whiteboard' | 'slides'
  const [activeBoardTool, setActiveBoardTool] = useState('pen');
  const [boardColor, setBoardColor] = useState('#319795');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [endClassModalOpen, setEndClassModalOpen] = useState(false);

  // Whiteboard Canvas
  const whiteboardCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isLiveStudioActive && liveStudioTab === 'whiteboard' && whiteboardCanvasRef.current) {
      const canvas = whiteboardCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight || 460;
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isLiveStudioActive, liveStudioTab]);

  const handleSetLiveStudioTab = (tab) => {
    setLiveStudioTab(tab);
    try {
      socket.emit('class:mode_change', { mode: tab });
    } catch {}
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    try {
      socket.emit('class:draw_stroke', {
        tool: activeBoardTool,
        color: boardColor,
        type: 'start',
        normX: x / canvas.width,
        normY: y / canvas.height
      });
    } catch {}
    draw(e);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / canvas.width;
    const normY = y / canvas.height;

    if (activeBoardTool === 'pen') {
      ctx.strokeStyle = boardColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (activeBoardTool === 'eraser') {
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(x - 15, y - 15, 30, 30);
    }

    try {
      socket.emit('class:draw_stroke', {
        tool: activeBoardTool,
        color: boardColor,
        type: 'draw',
        normX,
        normY
      });
    } catch {}
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = whiteboardCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
    }
    try {
      socket.emit('class:draw_stroke', { type: 'stop' });
    } catch {}
  };

  const handleClearBoard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      addToast('Whiteboard cleared.', 'info');
      try {
        socket.emit('class:clear_board');
      } catch {}
    }
  };

  // Broadcast camera, microphone and screen-sharing status
  useEffect(() => {
    if (isLiveStudioActive) {
      try {
        socket.emit('class:media_status', {
          isMicOn,
          isCamOn,
          isScreenSharing,
          teacherName: teacherUser?.name || 'শিক্ষক'
        });
      } catch {}
    }
  }, [isMicOn, isCamOn, isScreenSharing, isLiveStudioActive, teacherUser]);

  // Studio Chat & Polls
  const [studioMessages, setStudioMessages] = useState([
    { id: 1, sender: 'Rafiqul Islam (Student)', text: 'Sir, what is the best technique for projectile motion vectors?', role: 'student', time: '10:02 AM' },
    { id: 2, sender: 'Tanvir Ahmed (Student)', text: 'Slide font is crystal clear today, sir!', role: 'student', time: '10:04 AM' }
  ]);
  const [studioInputMsg, setStudioInputMsg] = useState('');
  const [activeQuizPoll, setActiveQuizPoll] = useState(null);

  // Listen to incoming messages, hand raises, and poll votes from students
  useEffect(() => {
    const handleIncomingMessage = (msg) => {
      if (msg.role !== 'instructor') {
        setStudioMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleHandRaised = (data) => {
      addToast(`✋ ${data.studentName || 'একজন শিক্ষার্থী'} হাত তুলেছেন!`, 'info');
    };

    const handleVoteUpdate = ({ votes }) => {
      setActiveQuizPoll(prev => prev ? { ...prev, votes } : null);
    };

    socket.on('chat:new_message', handleIncomingMessage);
    socket.on('class:hand_raised', handleHandRaised);
    socket.on('poll:vote_update', handleVoteUpdate);

    return () => {
      socket.off('chat:new_message', handleIncomingMessage);
      socket.off('class:hand_raised', handleHandRaised);
      socket.off('poll:vote_update', handleVoteUpdate);
    };
  }, []);

  const handleStartLiveClass = (session) => {
    const liveSessionData = {
      ...session,
      status: 'LIVE',
      instructor: teacherUser?.name || session.instructor || 'শিক্ষক',
      instructorTitle: teacherUser?.subject ? `${teacherUser.subject} স্পেশালিস্ট` : (session.instructorTitle || 'সিনিয়র ইন্সট্রাক্টর'),
      teacherId: teacherUser.id || teacherUser.email,
      teacherName: teacherUser.name || 'শিক্ষক',
      startedAt: new Date().toISOString()
    };

    setCurrentBroadcastingSession(liveSessionData);
    setIsLiveStudioActive(true);

    // Save in local storage & sync to backend DATA/liveClasses.json
    try {
      saveLiveClass(liveSessionData);
    } catch (e) {
      console.warn('Live class save notice:', e);
    }

    // Real-Time Socket Broadcast to all connected student tabs
    try {
      socket.emit('class:start', liveSessionData);
    } catch (err) {
      console.warn('Socket broadcast error:', err);
    }
    try {
      addNotification({
        title: `🔥 ক্লাস এখন লাইভ চলছে!`,
        text: `${teacherUser?.name || 'শিক্ষক'} "${session.title}" লাইভ স্টুডিও ক্লাস শুরু করেছেন। এখনই যোগ দিন!`,
        category: 'live_class',
        link: 'live-classes'
      });
    } catch {}
    addToast(`Broadcasting live: "${session.title}"`, 'success');
  };

  const handleQuickStartInstantClass = (customTitle) => {
    const title = customTitle?.trim() || `${teacherUser?.name || 'শিক্ষক'} - স্পেশাল লাইভ মাস্টারক্লাস`;
    const instantClass = {
      id: `live-${Date.now()}`,
      title: title,
      instructor: teacherUser?.name || 'শিক্ষক',
      instructorTitle: teacherUser?.subject ? `${teacherUser.subject} স্পেশালিস্ট` : 'সিনিয়র ইন্সট্রাক্টর',
      teacherId: teacherUser?.id || teacherUser?.email || 'teacher-default',
      teacherEmail: teacherUser?.email || 'teacher@edufast.com',
      group: teacherUser?.subject?.includes('Commerce') ? 'Commerce' : (teacherUser?.subject?.includes('Arts') ? 'Arts' : 'Science'),
      scheduledAt: new Date().toISOString(),
      duration: '90 Minutes',
      registeredCount: 88,
      status: 'LIVE',
      streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      overview: 'শিক্ষক সরাসরি লাইভ স্টুডিও থেকে ক্লাস শুরু করেছেন। হোয়াইটবোর্ড ও রিয়েলটাইম চ্যাট চালু রয়েছে।',
      createdAt: new Date().toISOString()
    };
    saveLiveClass(instantClass);
    handleStartLiveClass(instantClass);
  };

  const confirmEndLiveClass = (autoSaveRecording = true) => {
    if (!currentBroadcastingSession) return;

    let newRec = null;
    if (autoSaveRecording) {
      newRec = {
        id: `rec-${Date.now()}`,
        title: `${currentBroadcastingSession.title} (Live Archive)`,
        teacherId: teacherUser.id || teacherUser.email,
        teacherEmail: teacherUser.email,
        instructor: teacherUser.name,
        group: currentBroadcastingSession.group || 'Science',
        duration: currentBroadcastingSession.duration || '60 Minutes',
        videoUrl: currentBroadcastingSession.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        sheetUrl: 'live_lecture_notes.pdf',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        views: 1,
        description: `Archived from live session conducted on ${new Date().toLocaleDateString()}.`
      };
      saveTeacherRecording(newRec);
      addToast('Live broadcast ended and saved to Class Recordings!', 'success');
    } else {
      addToast('Live broadcast ended.', 'info');
    }

    // Real-Time Socket Broadcast: notify all students class has ended with recording attached
    try {
      socket.emit('class:end', {
        sessionId: currentBroadcastingSession.id,
        teacherId: teacherUser.id || teacherUser.email,
        teacherName: teacherUser.name,
        recording: newRec
      });
      if (newRec) {
        socket.emit('recording:create', newRec);
      }
    } catch (err) {
      console.warn('Socket end class error:', err);
    }

    try {
      deleteLiveClass(currentBroadcastingSession.id);
      setLiveSessions(prev => prev.filter(c => String(c.id) !== String(currentBroadcastingSession.id)));
    } catch (e) {
      console.warn('Error deleting ended live class:', e);
    }

    setIsLiveStudioActive(false);
    setCurrentBroadcastingSession(null);
    setEndClassModalOpen(false);
  };

  const handleSendStudioMessage = (e) => {
    e.preventDefault();
    if (!studioInputMsg.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: `${teacherUser?.name || 'শিক্ষক'} (ইন্সট্রাক্টর)`,
      text: studioInputMsg.trim(),
      role: 'instructor',
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };
    setStudioMessages(prev => [...prev, newMsg]);
    setStudioInputMsg('');
    try {
      socket.emit('chat:send_message', newMsg);
    } catch {}
  };

  const handleCreateQuizPoll = (question, options) => {
    const poll = {
      id: Date.now(),
      question,
      options,
      votes: new Array(options.length).fill(0)
    };
    setActiveQuizPoll(poll);
    try {
      socket.emit('poll:create', poll);
    } catch {}
    try {
      addNotification({
        title: `📊 লাইভ কুইজ পোল শুরু হয়েছে!`,
        text: `লাইভ ক্লাসে নতুন কুইজ দেওয়া হয়েছে: "${question}"`,
        category: 'exam',
        link: 'live-classes'
      });
    } catch {}
    addToast('MCQ Poll broadcasted live to learners!', 'success');
  };

  const handleResolveQuizPoll = () => {
    setActiveQuizPoll(null);
    try {
      socket.emit('poll:resolve');
    } catch {}
    addToast('Quiz poll concluded.', 'info');
  };

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    title: '', group: 'Science', duration: '90 Minutes', scheduledAt: '',
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', overview: ''
  });

  const handleSaveScheduleClass = (e) => {
    e.preventDefault();
    if (!scheduleFormData.title || !scheduleFormData.scheduledAt) {
      addToast('Please enter class title and scheduled date/time.', 'error');
      return;
    }
    const scheduledTime = new Date(scheduleFormData.scheduledAt).getTime();
    const now = Date.now();
    if (isNaN(scheduledTime)) {
      addToast('অনুগ্রহ করে সঠিক তারিখ ও সময় প্রদান করুন।', 'error');
      return;
    }
    if (scheduledTime < now - 60000) {
      addToast('অতীতের কোনো তারিখ বা সময় নির্বাচন করা যাবে না। বর্তমান বা ভবিষ্যতের সময় নির্ধারণ করুন।', 'error');
      return;
    }
    const newSession = {
      id: `live-${Date.now()}`,
      title: scheduleFormData.title,
      teacherId: teacherUser.id || teacherUser.email,
      teacherEmail: teacherUser.email,
      instructor: teacherUser.name,
      instructorTitle: teacherUser.qualification,
      group: scheduleFormData.group,
      scheduledAt: new Date(scheduleFormData.scheduledAt).toISOString(),
      duration: scheduleFormData.duration,
      registeredCount: 0,
      status: 'Upcoming',
      streamUrl: scheduleFormData.streamUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      overview: scheduleFormData.overview || 'EduFast Interactive Masterclass Session.'
    };
    saveLiveClass(newSession);
    addToast('New live session scheduled successfully!', 'success');
    setIsScheduleModalOpen(false);
    setScheduleFormData({
      title: '', group: 'Science', duration: '90 Minutes', scheduledAt: '',
      streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', overview: ''
    });
  };

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, type: '', id: null, title: '' });

  const handleDeleteLiveClass = (classId) => {
    const s = liveSessions.find(c => String(c.id) === String(classId));
    setDeleteConfirmModal({
      isOpen: true,
      type: 'liveClass',
      id: classId,
      title: s?.title || 'এই লাইভ ক্লাস'
    });
  };

  // -------------------------------------------------------------
  // RECORDINGS MANAGEMENT STATE & CONTROLS
  // -------------------------------------------------------------
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [editingRecordingId, setEditingRecordingId] = useState(null);
  const [recordingFilterGroup, setRecordingFilterGroup] = useState('All');
  const [previewRecording, setPreviewRecording] = useState(null);

  const [recordingFormData, setRecordingFormData] = useState({
    title: '', group: 'Science', duration: '45 Minutes',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    sheetUrl: 'lecture_sheet.pdf', description: '', topics: 'Key concepts, past questions'
  });

  const handleOpenAddRecording = () => {
    setEditingRecordingId(null);
    setRecordingFormData({
      title: '', group: 'Science', duration: '45 Minutes',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      sheetUrl: 'lecture_sheet.pdf', description: '', topics: 'Key concepts, past questions'
    });
    setIsRecordingModalOpen(true);
  };

  const handleOpenEditRecording = (rec) => {
    setEditingRecordingId(rec.id);
    setRecordingFormData({
      title: rec.title || '', group: rec.group || 'Science', duration: rec.duration || '45 Minutes',
      videoUrl: rec.videoUrl || '', sheetUrl: rec.sheetUrl || '', description: rec.description || '',
      topics: rec.topics || ''
    });
    setIsRecordingModalOpen(true);
  };

  const handleSaveRecording = (e) => {
    e.preventDefault();
    if (!recordingFormData.title || !recordingFormData.videoUrl) {
      addToast('Please enter both title and video URL.', 'error');
      return;
    }
    const recData = {
      id: editingRecordingId || `rec-${Date.now()}`,
      title: recordingFormData.title,
      teacherId: teacherUser.id || teacherUser.email,
      teacherEmail: teacherUser.email,
      instructor: teacherUser.name,
      group: recordingFormData.group,
      duration: recordingFormData.duration,
      videoUrl: recordingFormData.videoUrl,
      sheetUrl: recordingFormData.sheetUrl,
      description: recordingFormData.description,
      topics: recordingFormData.topics,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      views: editingRecordingId ? (recordings.find(r => r.id === editingRecordingId)?.views || 0) : 0
    };
    saveTeacherRecording(recData);
    addToast(editingRecordingId ? 'Class recording updated!' : 'Class recording uploaded successfully!', 'success');
    setIsRecordingModalOpen(false);
  };

  const handleDeleteRecording = (id) => {
    const rec = recordings.find(r => String(r.id) === String(id));
    setDeleteConfirmModal({
      isOpen: true,
      type: 'recording',
      id,
      title: rec?.title || 'এই রেকর্ড ক্লাস'
    });
  };

  const confirmDeleteAction = () => {
    if (deleteConfirmModal.type === 'recording' && deleteConfirmModal.id) {
      const id = deleteConfirmModal.id;
      deleteTeacherRecording(id);
      setRecordings(prev => prev.filter(r => String(r.id) !== String(id)));
      try {
        socket.emit('recording:delete', { id });
      } catch {}
      addToast('Class recording deleted successfully!', 'info');
    } else if (deleteConfirmModal.type === 'liveClass' && deleteConfirmModal.id) {
      const id = deleteConfirmModal.id;
      deleteLiveClass(id);
      setLiveSessions(prev => prev.filter(c => String(c.id) !== String(id)));
      addToast('Scheduled class deleted.', 'info');
    }
    setDeleteConfirmModal({ isOpen: false, type: '', id: null, title: '' });
  };

  // -------------------------------------------------------------
  // COURSE STUDIO STATE & LOGIC
  // -------------------------------------------------------------
  const [courseFilterGroup, setCourseFilterGroup] = useState('All');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [curriculumCourse, setCurriculumCourse] = useState(null);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);

  const handleOpenCurriculum = (course) => {
    setCurriculumCourse(course);
    setIsCurriculumModalOpen(true);
  };

  const [courseFormData, setCourseFormData] = useState({
    title: '', group: 'Science', duration: '40 Hours', price: 3000,
    discountedPrice: 1500, badge: 'Masterclass', image: '⚛️', description: '',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Fundamental Concepts & Theories',
        lessons: [
          { id: 'les-1', title: 'Chapter Overview & Key Formulas', duration: '45m', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { id: 'les-2', title: 'Solved Problems & Admission Shortcuts', duration: '50m', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
        ]
      }
    ]
  });

  const handleOpenAddCourse = () => {
    setEditingCourseId(null);
    setCourseFormData({
      title: '', group: 'Science', duration: '40 Hours', price: 3000,
      discountedPrice: 1500, badge: 'Masterclass', image: '⚛️', description: '',
      modules: [
        {
          id: 'mod-1',
          title: 'Module 1: Fundamental Concepts & Theories',
          lessons: [
            { id: 'les-1', title: 'Chapter Overview & Key Formulas', duration: '45m', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
          ]
        }
      ]
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (c) => {
    setEditingCourseId(c.id);
    setCourseFormData({
      title: c.title || '', group: c.group || 'Science', duration: c.duration || '40 Hours',
      price: c.price || 3000, discountedPrice: c.discountedPrice || 1500,
      badge: c.badge || 'Featured', image: c.image || '📚', description: c.description || '',
      modules: c.modules && c.modules.length > 0 ? c.modules : [
        {
          id: 'mod-1',
          title: 'Module 1: Core Syllabus',
          lessons: [{ id: 'les-1', title: 'Lecture 1: Introduction', duration: '45m', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }]
        }
      ]
    });
    setIsCourseModalOpen(true);
  };

  const handleAddModule = () => {
    const newMod = {
      id: `mod-${Date.now()}`,
      title: `Module ${courseFormData.modules.length + 1}: Advanced Concepts`,
      lessons: [{ id: `les-${Date.now()}`, title: 'Lecture 1: Topic Overview', duration: '45m', videoUrl: '' }]
    };
    setCourseFormData(prev => ({ ...prev, modules: [...prev.modules, newMod] }));
  };

  const handleRemoveModule = (modIdx) => {
    setCourseFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== modIdx)
    }));
  };

  const handleAddLesson = (modIdx) => {
    const newLes = { id: `les-${Date.now()}`, title: 'New Lesson Lecture', duration: '40m', videoUrl: '' };
    const updated = [...courseFormData.modules];
    updated[modIdx].lessons.push(newLes);
    setCourseFormData(prev => ({ ...prev, modules: updated }));
  };

  const handleRemoveLesson = (modIdx, lesIdx) => {
    const updated = [...courseFormData.modules];
    updated[modIdx].lessons = updated[modIdx].lessons.filter((_, idx) => idx !== lesIdx);
    setCourseFormData(prev => ({ ...prev, modules: updated }));
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    if (!courseFormData.title) {
      addToast('Please enter course title.', 'error');
      return;
    }
    const finalCourse = {
      id: editingCourseId || `course-${Date.now()}`,
      title: courseFormData.title,
      teacherId: teacherUser.id || teacherUser.email,
      teacherEmail: teacherUser.email,
      instructor: teacherUser.name,
      instructorTitle: teacherUser.qualification || 'Lead Instructor',
      group: courseFormData.group,
      duration: courseFormData.duration,
      price: Number(courseFormData.price) || 0,
      discountedPrice: Number(courseFormData.discountedPrice) || Number(courseFormData.price) || 0,
      badge: courseFormData.badge || 'Popular',
      image: courseFormData.image || '📚',
      description: courseFormData.description,
      modules: courseFormData.modules,
      enrolledCount: editingCourseId ? (courses.find(c => c.id === editingCourseId)?.enrolledCount || 0) : 0,
      rating: editingCourseId ? (courses.find(c => c.id === editingCourseId)?.rating || 0) : 0,
      reviewsCount: editingCourseId ? (courses.find(c => c.id === editingCourseId)?.reviewsCount || 0) : 0,
      isApproved: editingCourseId ? (courses.find(c => c.id === editingCourseId)?.isApproved ?? false) : false,
      status: editingCourseId ? (courses.find(c => c.id === editingCourseId)?.status ?? 'Pending') : 'Pending'
    };
    saveCourse(finalCourse);
    addToast(
      editingCourseId 
        ? 'কোর্স সফলভাবে আপডেট করা হয়েছে!' 
        : 'নতুন কোর্স সফলভাবে সাবমিট হয়েছে! এডমিন পারমিশন দিলে এটি ওয়েবসাইটে লাইভ হবে।', 
      'success'
    );
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course and all associated lessons?')) {
      deleteCourse(courseId);
      addToast('Course deleted.', 'info');
    }
  };

  // -------------------------------------------------------------
  // PROFILE SETTINGS
  // -------------------------------------------------------------
  const [profileForm, setProfileForm] = useState({
    name: teacherUser?.name || '',
    email: teacherUser?.email || '',
    mobile: teacherUser?.mobile || '',
    qualification: teacherUser?.qualification || '',
    department: teacherUser?.department || '',
    bio: teacherUser?.bio || '',
    avatar: teacherUser?.avatar || null
  });

  useEffect(() => {
    if (teacherUser) {
      setProfileForm({
        name: teacherUser.name || '',
        email: teacherUser.email || '',
        mobile: teacherUser.mobile || '',
        qualification: teacherUser.qualification || '',
        department: teacherUser.department || '',
        bio: teacherUser.bio || '',
        avatar: teacherUser.avatar || null
      });
    }
  }, [teacherUser]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...teacherUser,
      ...profileForm
    };
    saveTeacherProfile(updated);
    setTeacherUser(updated);
    localStorage.setItem('edufast_teacher_session', JSON.stringify(updated));
    addToast('Profile information updated successfully!', 'success');
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN GATEWAY (If not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <TeacherLogin
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        handleTeacherLogin={handleTeacherLogin}
        handleTeacherRegister={handleTeacherRegister}
        onExitToPublic={onExitToPublic}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Check if items belong to this authenticated teacher
  const isMyCourse = (c) => {
    if (!c || !teacherUser) return false;
    if (c.teacherId && (c.teacherId === teacherUser.id || c.teacherId === teacherUser.email)) return true;
    if (c.teacherEmail && c.teacherEmail.toLowerCase() === (teacherUser.email || '').toLowerCase()) return true;
    if (c.instructor && teacherUser.name && c.instructor.trim().toLowerCase() === teacherUser.name.trim().toLowerCase()) return true;
    return false;
  };

  const isMyLiveSession = (s) => {
    if (!s) return false;
    if (!teacherUser) return true;
    if (s.teacherId && (s.teacherId === teacherUser.id || s.teacherId === teacherUser.email)) return true;
    if (s.teacherEmail && s.teacherEmail.toLowerCase() === (teacherUser.email || '').toLowerCase()) return true;
    if (s.instructor && teacherUser.name && s.instructor.trim().toLowerCase() === teacherUser.name.trim().toLowerCase()) return true;
    if (s.teacherId === 'teacher-default' || !s.teacherId) return true;
    return true;
  };

  const isMyRecording = (r) => {
    if (!r) return false;
    return true;
  };

  const myCourses = courses.filter(isMyCourse);
  const myLiveSessions = liveSessions.filter(isMyLiveSession);
  const myRecordings = recordings.filter(isMyRecording);

  // Filtered lists
  const filteredRecordingsList = myRecordings.filter(r => {
    if (recordingFilterGroup === 'All') return true;
    return r.group === recordingFilterGroup;
  });

  const filteredCoursesList = myCourses.filter(c => {
    if (courseFilterGroup === 'All') return true;
    return c.group === courseFilterGroup;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* Top Header Navigation */}
      <TeacherHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveStudioActive={isLiveStudioActive}
        recordingsCount={myRecordings.length}
        coursesCount={myCourses.length}
        noticesCount={notices.length}
        teacherUser={teacherUser}
        onExitToPublic={onExitToPublic}
        onLogout={handleTeacherLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        theme={theme}
      />

      {/* Main Content Area by Tab */}
      <main style={{ flex: 1, padding: '1.75rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <TeacherOverviewTab
            teacherUser={teacherUser}
            courses={myCourses}
            recordings={myRecordings}
            liveSessions={myLiveSessions}
            setActiveTab={setActiveTab}
            setIsScheduleModalOpen={setIsScheduleModalOpen}
            handleOpenAddCourse={handleOpenAddCourse}
            handleStartLiveClass={handleStartLiveClass}
            handleQuickStartInstantClass={handleQuickStartInstantClass}
            handleOpenAddRecording={handleOpenAddRecording}
            setPreviewRecording={setPreviewRecording}
            theme={theme}
          />
        )}

        {activeTab === 'live-studio' && (
          <TeacherLiveStudioTab
            isLiveStudioActive={isLiveStudioActive}
            currentBroadcastingSession={currentBroadcastingSession}
            liveSessions={myLiveSessions}
            handleStartLiveClass={handleStartLiveClass}
            handleQuickStartInstantClass={handleQuickStartInstantClass}
            handleDeleteLiveClass={handleDeleteLiveClass}
            setIsScheduleModalOpen={setIsScheduleModalOpen}
            setEndClassModalOpen={setEndClassModalOpen}
            liveStudioTab={liveStudioTab}
            setLiveStudioTab={handleSetLiveStudioTab}
            activeBoardTool={activeBoardTool}
            setActiveBoardTool={setActiveBoardTool}
            boardColor={boardColor}
            setBoardColor={setBoardColor}
            whiteboardCanvasRef={whiteboardCanvasRef}
            isDrawing={isDrawing}
            startDrawing={startDrawing}
            draw={draw}
            stopDrawing={stopDrawing}
            handleClearBoard={handleClearBoard}
            isMicOn={isMicOn}
            setIsMicOn={setIsMicOn}
            isCamOn={isCamOn}
            setIsCamOn={setIsCamOn}
            isScreenSharing={isScreenSharing}
            setIsScreenSharing={setIsScreenSharing}
            teacherUser={teacherUser}
            studioMessages={studioMessages}
            studioInputMsg={studioInputMsg}
            setStudioInputMsg={setStudioInputMsg}
            handleSendStudioMessage={handleSendStudioMessage}
            activeQuizPoll={activeQuizPoll}
            handleCreateQuizPoll={handleCreateQuizPoll}
            handleResolveQuizPoll={handleResolveQuizPoll}
            theme={theme}
          />
        )}

        {activeTab === 'recordings' && (
          <TeacherRecordingsTab
            filteredRecordingsList={filteredRecordingsList}
            recordingFilterGroup={recordingFilterGroup}
            setRecordingFilterGroup={setRecordingFilterGroup}
            handleOpenAddRecording={handleOpenAddRecording}
            handleOpenEditRecording={handleOpenEditRecording}
            handleDeleteRecording={handleDeleteRecording}
            setPreviewRecording={setPreviewRecording}
            theme={theme}
          />
        )}

        {activeTab === 'courses' && (
          <TeacherCoursesTab
            filteredCoursesList={filteredCoursesList}
            courseFilterGroup={courseFilterGroup}
            setCourseFilterGroup={setCourseFilterGroup}
            handleOpenAddCourse={handleOpenAddCourse}
            handleOpenEditCourse={handleOpenEditCourse}
            handleDeleteCourse={handleDeleteCourse}
            handleOpenCurriculum={handleOpenCurriculum}
            theme={theme}
          />
        )}

        {activeTab === 'notices' && (
          <TeacherNoticesTab
            notices={notices}
            setNotices={setNotices}
            addToast={addToast}
            theme={theme}
          />
        )}

        {activeTab === 'settings' && (
          <TeacherProfileTab
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleSaveProfile={handleSaveProfile}
            theme={theme}
          />
        )}
      </main>

      {/* Modals */}
      <ScheduleLiveModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scheduleFormData={scheduleFormData}
        setScheduleFormData={setScheduleFormData}
        handleSaveScheduleClass={handleSaveScheduleClass}
        theme={theme}
      />

      <TeacherCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        editingCourseId={editingCourseId}
        courseFormData={courseFormData}
        setCourseFormData={setCourseFormData}
        handleSaveCourse={handleSaveCourse}
        handleAddModule={handleAddModule}
        handleRemoveModule={handleRemoveModule}
        handleAddLesson={handleAddLesson}
        handleRemoveLesson={handleRemoveLesson}
        theme={theme}
      />

      <TeacherRecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        editingRecordingId={editingRecordingId}
        recordingFormData={recordingFormData}
        setRecordingFormData={setRecordingFormData}
        handleSaveRecording={handleSaveRecording}
        theme={theme}
      />

      <RecordingPreviewModal
        previewRecording={previewRecording}
        onClose={() => setPreviewRecording(null)}
        onDownloadSheet={(e) => {
          e.preventDefault();
          addToast('Lecture sheet downloaded successfully!', 'success');
        }}
        theme={theme}
      />

      <EndClassModal
        isOpen={endClassModalOpen}
        onClose={() => setEndClassModalOpen(false)}
        onConfirmEnd={confirmEndLiveClass}
        theme={theme}
      />

      <TeacherCurriculumModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        course={curriculumCourse}
        onCurriculumUpdated={(updatedCurriculum) => {
          if (curriculumCourse) {
            const updated = courses.map(c => {
              if (c.id === curriculumCourse.id) {
                return { ...c, modules: updatedCurriculum };
              }
              return c;
            });
            setCourses(updated);
            localStorage.setItem('edufast_dynamic_courses', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'save' } }));
          }
        }}
        theme={theme}
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmModal({ isOpen: false, type: '', id: null, title: '' })}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              padding: '1.75rem',
              textAlign: 'center',
              backgroundColor: theme.modalBg,
              border: `1px solid ${theme.modalBorder}`
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fff5f5',
              color: '#e53e3e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Trash2 style={{ width: '28px', height: '28px' }} />
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text, fontSize: '1.25rem', fontWeight: 700 }}>
              মুছে ফেলার নিশ্চিতকরণ
            </h3>
            
            <p style={{ margin: '0 0 1.5rem 0', color: theme.textMuted, fontSize: '0.9rem', lineHeight: 1.5 }}>
              আপনি কি নিশ্চিত যে <strong>"{deleteConfirmModal.title}"</strong> মুছে ফেলতে চান? এটি ডাটাবেজ ও পোর্টাল থেকে স্থায়ীভাবে মুছে যাবে।
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: '', id: null, title: '' })}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
              >
                বাতিল (Cancel)
              </button>
              <button
                onClick={confirmDeleteAction}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#e53e3e',
                  borderColor: '#e53e3e',
                  color: '#fff',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}
              >
                হ্যাঁ, ডিলিট করুন (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback System */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              backgroundColor: toast.type === 'error' ? '#e53e3e' : toast.type === 'info' ? '#3182ce' : '#38a169',
              color: '#fff',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'slideInRight 0.25s ease-out'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
