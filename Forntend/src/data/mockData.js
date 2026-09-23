// Data store for EduFast Platform
import { generatedMockTests } from './mockTestGenerator';
// Production Clean State: Zero Hardcoded Dummy Data
// All content is dynamically created & managed via respective Admin, Teacher, Mentor, and Student portals.

// One-time cache scrubber for legacy demo data stored in previous browser sessions
if (typeof window !== 'undefined') {
  try {
    const CLEAN_VERSION_KEY = 'edufast_clean_v6_with_admissions';
    if (!localStorage.getItem(CLEAN_VERSION_KEY)) {
      // 1. Remove legacy demo student session
      const studentSession = localStorage.getItem('edufast_student_session');
      if (studentSession && studentSession.includes('Sadman Sakib')) {
        localStorage.removeItem('edufast_student_session');
      } else if (studentSession) {
        try {
          const parsed = JSON.parse(studentSession);
          if (parsed && parsed.coins === 380) {
            delete parsed.coins;
            localStorage.setItem('edufast_student_session', JSON.stringify(parsed));
          }
        } catch (e) {}
      }

      // Purge any legacy hardcoded 380 dummy coins
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('edufast_student_coins_')) {
            if (localStorage.getItem(k) === '380') {
              localStorage.removeItem(k);
            }
          }
        }
      } catch (e) {}

      // 2. Remove legacy demo teacher session
      const teacherSession = localStorage.getItem('edufast_teacher_session');
      if (teacherSession && teacherSession.includes('Tanvir Ahmed')) {
        localStorage.removeItem('edufast_teacher_session');
      }
      const teacherProfile = localStorage.getItem('edufast_teacher_profile');
      if (teacherProfile && teacherProfile.includes('Tanvir Ahmed')) {
        localStorage.removeItem('edufast_teacher_profile');
      }
      // 3. Remove legacy demo mentor session
      const mentorSession = localStorage.getItem('edufast_mentor_session');
      if (mentorSession && mentorSession.includes('Rakibul Hasan')) {
        localStorage.removeItem('edufast_mentor_session');
      }
      const mentorProfile = localStorage.getItem('edufast_mentor_profile');
      if (mentorProfile && mentorProfile.includes('Rakibul Hasan')) {
        localStorage.removeItem('edufast_mentor_profile');
      }
      // 4. Remove legacy demo questions and doubts
      const storedQb = localStorage.getItem('edufast_question_bank');
      if (storedQb && storedQb.includes('qb-buet-2024')) {
        localStorage.removeItem('edufast_question_bank');
      }
      const storedDoubts = localStorage.getItem('edufast_doubts_queue');
      if (storedDoubts && storedDoubts.includes('dbt-101')) {
        localStorage.removeItem('edufast_doubts_queue');
      }
      localStorage.setItem(CLEAN_VERSION_KEY, 'true');
    }
  } catch (e) {
    console.warn('Cache purge error:', e);
  }
}

// Registered students live store & synchronization
export const getRegisteredStudents = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('edufast_registered_students');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const registerStudentInLocalStore = (student) => {
  if (typeof window === 'undefined' || !student) return;
  try {
    const list = getRegisteredStudents();
    const identifier = student.email || student.mobile || student.id || student.name;
    const existingIndex = list.findIndex(s => 
      (s.email && student.email && s.email.toLowerCase() === student.email.toLowerCase()) ||
      (s.id && student.id && String(s.id) === String(student.id)) ||
      (s.mobile && student.mobile && s.mobile === student.mobile)
    );

    const group = student.academicGroup || student.group || 'Science';
    let avatar = student.avatar;
    if (!avatar) {
      if (group === 'Science') avatar = '👨‍🔬';
      else if (group === 'Commerce') avatar = '👨‍💼';
      else avatar = '👩‍🎓';
    }

    let target = student.target;
    if (!target) {
      if (group === 'Science') target = 'BUET / Medical / DU A-Unit';
      else if (group === 'Commerce') target = 'DU C-Unit & IBA';
      else target = 'DU B-Unit (Law)';
    }

    const formatted = {
      id: student.id || identifier,
      name: student.name || 'শিক্ষার্থী',
      email: student.email || '',
      mobile: student.mobile || '',
      group,
      target,
      avatar,
      coins: Number(student.coins !== undefined ? student.coins : getStudentCoins(student)),
      score: Number(student.score !== undefined ? student.score : getStudentMockStats(student).avgAccuracy),
      streak: Number(student.streak !== undefined ? student.streak : getStudentStreak(student)),
      college: student.hscCollege || student.college || student.school || 'Bangladesh',
      createdAt: student.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...formatted };
    } else {
      list.push(formatted);
    }

    localStorage.setItem('edufast_registered_students', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('edufast-students-registry-update', { detail: { list } }));
  } catch (e) {
    console.error('Error in registerStudentInLocalStore:', e);
  }
};

export const syncRegisteredStudents = (serverStudents) => {
  if (typeof window === 'undefined' || !Array.isArray(serverStudents)) return;
  try {
    const localList = getRegisteredStudents();
    const map = new Map();

    serverStudents.forEach(s => {
      const key = (s.email || s.id || s.name).toLowerCase();
      map.set(key, {
        id: s.id,
        dbId: s.dbId,
        name: s.name,
        email: s.email,
        group: s.group || 'Science',
        avatar: s.avatar || (s.group === 'Commerce' ? '👨‍💼' : s.group === 'Humanities' || s.group === 'Arts' ? '👩‍🎓' : '👨‍🔬'),
        target: s.target || (s.group === 'Commerce' ? 'DU C-Unit & IBA' : s.group === 'Humanities' || s.group === 'Arts' ? 'DU B-Unit (Law)' : 'BUET / Medical / DU A-Unit'),
        coins: Number(s.coins) || 0,
        score: Number(s.score) || 0.0,
        streak: Number(s.streak) || 0,
        college: s.college || 'Bangladesh',
        createdAt: s.createdAt || new Date().toISOString()
      });
    });

    localList.forEach(s => {
      const key = (s.email || s.id || s.name).toLowerCase();
      if (!map.has(key)) {
        map.set(key, s);
      }
    });

    const merged = Array.from(map.values());
    localStorage.setItem('edufast_registered_students', JSON.stringify(merged));
  } catch (e) {
    console.error('Error in syncRegisteredStudents:', e);
  }
};

export const benchmarkLeaderboardPeers = [];
export const mockLeaderboard = [];
export const TAKEN_MOBILE_NUMBERS = [];

// ==========================================
// 1. STUDENT PROFILE TEMPLATE (Clean Baseline)
// ==========================================
export const DEFAULT_USER = {
  name: "",
  fathersName: "",
  mothersName: "",
  dob: "",
  mobile: "",
  email: "",
  group: "",
  ssc: {
    roll: "",
    reg: "",
    board: "",
    gpa: "",
    school: ""
  },
  hsc: {
    roll: "",
    reg: "",
    board: "",
    gpa: "",
    school: ""
  },
  avatar: null,
  purchasedCourses: []
};

// ==========================================
// 2. TEACHER PROFILE TEMPLATE (Clean Baseline)
// ==========================================
export const DEFAULT_TEACHER = {
  id: "teacher-default",
  name: "",
  email: "",
  qualification: "",
  department: "",
  mobile: "",
  bio: "",
  avatar: null,
  rating: 0,
  studentsCount: 0,
  coursesCount: 0,
  liveHours: 0
};

export const getTeacherProfile = () => {
  if (typeof window === 'undefined') return DEFAULT_TEACHER;
  try {
    const stored = localStorage.getItem('edufast_teacher_profile');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading teacher profile:', e);
  }
  return DEFAULT_TEACHER;
};

export const saveTeacherProfile = (profile) => {
  if (typeof window === 'undefined') return DEFAULT_TEACHER;
  localStorage.setItem('edufast_teacher_profile', JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'teacher_profile', action: 'save' } }));
  return profile;
};

// ==========================================
// TEACHER RECORDINGS STORE HELPERS
// ==========================================
export const defaultRecordings = [];

export const getTeacherRecordings = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_teacher_recordings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading teacher recordings:', e);
  }
  return [];
};

export const fetchRecordingsFromBackend = async () => {
  try {
    const res = await fetch('http://localhost:5001/api/data/recordings');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        localStorage.setItem('edufast_teacher_recordings', JSON.stringify(result.data));
        window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'recordings', action: 'fetch' } }));
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Backend recordings fetch notice:', err.message);
  }
  return getTeacherRecordings();
};

export const saveTeacherRecording = (recording) => {
  if (typeof window === 'undefined') return [];
  const current = getTeacherRecordings();
  const recId = recording.id || 'rec-' + Date.now();
  const formattedRec = { ...recording, id: recId };
  const index = current.findIndex(r => r.id === recId);
  let updated;
  if (index >= 0) {
    updated = current.map(r => r.id === recId ? { ...r, ...formattedRec } : r);
  } else {
    updated = [formattedRec, ...current];
  }
  localStorage.setItem('edufast_teacher_recordings', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'recordings', action: 'save' } }));

  // Live Sync with backend DATA/recordings.json file
  fetch('http://localhost:5001/api/data/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedRec)
  }).catch(err => console.warn('Backend recording sync notice:', err.message));

  return updated;
};

export const deleteTeacherRecording = (recordingId) => {
  if (typeof window === 'undefined') return [];
  const current = getTeacherRecordings();
  const updated = current.filter(r => String(r.id) !== String(recordingId));
  localStorage.setItem('edufast_teacher_recordings', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'recordings', action: 'delete' } }));

  // Live Delete from backend DATA/recordings.json file
  fetch(`http://localhost:5001/api/data/recordings/${encodeURIComponent(recordingId)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Backend recording delete notice:', err.message));

  return updated;
};

// ==========================================
// MODULAR DATA STORES (DATA/courses.json, admissions.json, questionBank.json, liveClasses.json)
// ==========================================
export {
  defaultCourses,
  mockCourses,
  getCourses,
  getPublicCourses,
  saveCourse,
  deleteCourse
} from './coursesData';

export {
  defaultAdmissions,
  mockAdmissions,
  getAdmissions,
  saveAdmission,
  deleteAdmission
} from './admissionsData';

export {
  defaultQuestionBank,
  getQuestionBank,
  saveQuestionPaper,
  deleteQuestionPaper
} from './questionBankData';

export {
  defaultLiveClasses,
  getLiveClasses,
  fetchLiveClassesFromBackend,
  saveLiveClass,
  deleteLiveClass
} from './liveClassesData';

export const purgeAllDummyData = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('edufast_dynamic_courses', JSON.stringify([]));
  localStorage.setItem('edufast_live_classes', JSON.stringify([]));
  localStorage.setItem('edufast_teacher_recordings', JSON.stringify([]));
  localStorage.setItem('edufast_dynamic_admissions', JSON.stringify([]));
  localStorage.setItem('edufast_question_bank', JSON.stringify([]));
  localStorage.setItem('edufast_doubts_queue', JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'purge', action: 'all' } }));
};

// ==========================================
// COURSE CURRICULUM & LESSONS GETTER
// ==========================================
export const getCourseCurriculum = (courseId, courseTitle = "Masterclass") => {
  try {
    const customKey = `edufast_curriculum_${courseId}`;
    const stored = localStorage.getItem(customKey);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

// ==========================================
// 24/7 MENTOR & TA DOUBTS QUEUE SYSTEM
// ==========================================
export const DEFAULT_DOUBTS = [];

export const getDoubtsQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_doubts_queue');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading doubts queue:', e);
  }
  return [];
};

export const submitDoubt = (doubtObj) => {
  const current = getDoubtsQueue();
  const newDoubt = {
    id: "dbt-" + Date.now(),
    status: "pending",
    time: "Just now",
    timestamp: Date.now(),
    claimedBy: null,
    solution: null,
    rating: null,
    ...doubtObj
  };
  const updated = [newDoubt, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_doubts_queue', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'doubts_queue', action: 'submit' } }));
  }
  return updated;
};

export const claimDoubt = (doubtId, mentorName) => {
  const current = getDoubtsQueue();
  const updated = current.map(d => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: "claimed",
        claimedBy: mentorName || "Duty Mentor"
      };
    }
    return d;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_doubts_queue', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'doubts_queue', action: 'claim' } }));
  }
  return updated;
};

export const resolveDoubt = (doubtId, solutionData) => {
  const current = getDoubtsQueue();
  const updated = current.map(d => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: "resolved",
        solution: {
          ...solutionData,
          resolvedAt: "Just now"
        }
      };
    }
    return d;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_doubts_queue', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'doubts_queue', action: 'resolve' } }));
  }
  return updated;
};

export const escalateDoubt = (doubtId, reason) => {
  const current = getDoubtsQueue();
  const updated = current.map(d => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: "escalated",
        escalationReason: reason || "Requires Master Instructor Consultation"
      };
    }
    return d;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_doubts_queue', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'doubts_queue', action: 'escalate' } }));
  }
  return updated;
};

export const rateDoubtSolution = (doubtId, stars) => {
  const current = getDoubtsQueue();
  const updated = current.map(d => {
    if (d.id === doubtId) {
      return { ...d, rating: stars };
    }
    return d;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_doubts_queue', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'doubts_queue', action: 'rate' } }));
  }
  return updated;
};

// ==========================================
// 3. MENTOR PROFILE TEMPLATE (Clean Baseline)
// ==========================================
export const DEFAULT_MENTOR = {
  name: "",
  email: "",
  designation: "",
  institution: "",
  subject: "",
  rating: 0,
  solvedCount: 0,
  coinsEarned: 0
};

export const getMentorProfile = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('edufast_mentor_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return DEFAULT_MENTOR;
};

export const saveMentorProfile = (profile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('edufast_mentor_profile', JSON.stringify(profile));
  }
  return profile;
};

// ==========================================
// 4. STUDENT COINS & 24-HOUR DAILY AI FOCUS PLAN SYSTEM
// ==========================================

export const getStudentCoins = (user) => {
  if (typeof window === 'undefined') return 0;
  const userKey = user?.email || user?.id || 'default';
  const stored = localStorage.getItem(`edufast_student_coins_${userKey}`);
  if (stored !== null) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 0; // Fresh new student starts with 0 EduCoins
};

export const updateStudentCoins = (user, delta) => {
  if (typeof window === 'undefined') return 0;
  const current = getStudentCoins(user);
  const updated = Math.max(0, current + delta);
  const userKey = user?.email || user?.id || 'default';
  localStorage.setItem(`edufast_student_coins_${userKey}`, updated.toString());

  try {
    const session = localStorage.getItem('edufast_student_session');
    if (session) {
      const parsed = JSON.parse(session);
      parsed.coins = updated;
      localStorage.setItem('edufast_student_session', JSON.stringify(parsed));
    }
  } catch (e) {}

  // Update in local registered students registry
  registerStudentInLocalStore({ ...(user || {}), coins: updated });

  window.dispatchEvent(new CustomEvent('edufast-coins-update', { detail: { coins: updated, delta } }));

  // Live Sync with Backend SQLite Database
  if (user?.email || user?.id) {
    fetch('http://localhost:5001/api/students/update-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        id: user.id,
        coins: updated
      })
    }).catch(() => {});
  }

  return updated;
};

// ==========================================
// REAL-TIME STUDENT MOCK TEST STATS & STREAK
// ==========================================

export const getStudentMockStats = (user) => {
  if (typeof window === 'undefined') return { totalTests: 0, avgAccuracy: 0, lastAccuracy: 0 };
  const userKey = user?.email || user?.id || 'default';
  try {
    const saved = localStorage.getItem(`edufast_student_mock_history_${userKey}`);
    if (saved) {
      const history = JSON.parse(saved);
      if (Array.isArray(history) && history.length > 0) {
        const totalTests = history.length;
        const totalPct = history.reduce((acc, h) => acc + (Number(h.percentage) || 0), 0);
        const avgAccuracy = Number((totalPct / totalTests).toFixed(1));
        const lastAccuracy = Number(history[history.length - 1].percentage) || 0;
        return { totalTests, avgAccuracy, lastAccuracy };
      }
    }
  } catch (e) {
    console.error('Error reading mock history:', e);
  }
  return { totalTests: 0, avgAccuracy: 0, lastAccuracy: 0 };
};

export const getStudentMockSubmissions = (user) => {
  if (typeof window === 'undefined') return {};
  const userKey = user?.email || user?.id || 'default';
  const storageKey = `edufast_student_mock_submissions_${userKey}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading mock submissions:', e);
    return {};
  }
};

export const getMockSubmission = (user, testId) => {
  if (!testId) return null;
  const submissions = getStudentMockSubmissions(user);
  if (submissions && submissions[testId]) {
    return submissions[testId];
  }
  // Fallback check in student mock history
  const userKey = user?.email || user?.id || 'default';
  try {
    const historyRaw = localStorage.getItem(`edufast_student_mock_history_${userKey}`);
    if (historyRaw) {
      const history = JSON.parse(historyRaw);
      const entry = history.find(h => String(h.testId) === String(testId));
      if (entry) {
        return {
          testId,
          score: entry.score,
          totalMarks: entry.totalMarks,
          percentage: entry.percentage,
          answers: entry.answers || {},
          timeUsed: entry.timeUsed || 0,
          submittedAt: entry.date
        };
      }
    }
  } catch {}
  return null;
};

export const saveMockSubmission = (user, submissionData) => {
  if (typeof window === 'undefined' || !submissionData?.testId) return;
  const userKey = user?.email || user?.id || 'default';
  const storageKey = `edufast_student_mock_submissions_${userKey}`;
  try {
    const submissions = getStudentMockSubmissions(user);
    const existing = submissions[submissionData.testId];
    if (existing) {
      return existing; // Enforce single attempt rule: don't overwrite if already submitted
    }
    submissions[submissionData.testId] = {
      ...submissionData,
      submittedAt: submissionData.submittedAt || new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(submissions));
    window.dispatchEvent(new CustomEvent('edufast-mock-submissions-update', { detail: { testId: submissionData.testId, submission: submissions[submissionData.testId] } }));
    return submissions[submissionData.testId];
  } catch (e) {
    console.error('Error saving mock submission:', e);
  }
};

export const recordStudentMockTestResult = (user, resultData) => {
  if (typeof window === 'undefined') return;
  const userKey = user?.email || user?.id || 'default';
  const storageKey = `edufast_student_mock_history_${userKey}`;
  try {
    const existingRaw = localStorage.getItem(storageKey);
    const history = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Save detailed submission
    saveMockSubmission(user, resultData);

    const existingIdx = history.findIndex(h => String(h.testId) === String(resultData.testId));
    const newEntry = {
      testId: resultData.testId,
      score: resultData.score,
      totalMarks: resultData.totalMarks,
      percentage: resultData.percentage,
      answers: resultData.answers || {},
      timeUsed: resultData.timeUsed || 0,
      date: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      history[existingIdx] = newEntry;
    } else {
      history.push(newEntry);
    }
    localStorage.setItem(storageKey, JSON.stringify(history));

    const updatedStats = getStudentMockStats(user);
    registerStudentInLocalStore({ ...(user || {}), score: updatedStats.avgAccuracy });

    window.dispatchEvent(new CustomEvent('edufast-mock-history-update', { detail: { history, lastResult: newEntry } }));

    // Live Sync score with Backend SQLite Database
    if (user?.email || user?.id) {
      fetch('http://localhost:5001/api/students/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          id: user.id,
          score: updatedStats.avgAccuracy
        })
      }).catch(() => {});

      // Live Sync one-time attempt with Backend SQLite Database
      fetch('http://localhost:5001/api/mock-tests/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id ? String(user.id) : String(user.email),
          userEmail: user.email || '',
          mockTestId: resultData.testId,
          score: resultData.score,
          totalMarks: resultData.totalMarks,
          percentage: resultData.percentage,
          answers: resultData.answers || {},
          timeUsed: resultData.timeUsed || 0
        })
      }).catch(err => console.warn('Mock test backend attempt sync notice:', err.message));
    }
  } catch (e) {
    console.error('Error saving mock test result:', e);
  }
};

export const fetchBackendMockAttempts = async (user) => {
  if (!user || (!user.id && !user.email)) return {};
  try {
    const params = new URLSearchParams();
    if (user.id) params.append('userId', String(user.id));
    if (user.email) params.append('email', String(user.email));

    const res = await fetch(`http://localhost:5001/api/mock-tests/attempts?${params.toString()}`);
    if (!res.ok) return getStudentMockSubmissions(user);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.attempts)) {
      const userKey = user?.email || user?.id || 'default';
      const storageKey = `edufast_student_mock_submissions_${userKey}`;
      const localSubmissions = getStudentMockSubmissions(user);

      data.attempts.forEach(att => {
        localSubmissions[att.mockTestId] = {
          testId: att.mockTestId,
          score: att.score,
          totalMarks: att.totalMarks,
          percentage: att.percentage,
          answers: att.answers || {},
          timeUsed: att.timeUsed || 0,
          submittedAt: att.submittedAt
        };
      });
      localStorage.setItem(storageKey, JSON.stringify(localSubmissions));
      window.dispatchEvent(new CustomEvent('edufast-mock-submissions-update', { detail: { submissions: localSubmissions } }));
      return localSubmissions;
    }
  } catch (e) {
    console.warn('Could not fetch backend mock attempts:', e.message);
  }
  return getStudentMockSubmissions(user);
};

export const getStudentStreak = (user) => {
  if (typeof window === 'undefined') return 0;
  const userKey = user?.email || user?.id || 'default';
  try {
    const stored = localStorage.getItem(`edufast_student_streak_${userKey}`);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) return parsed;
    }
    // Dynamic check: if any daily task or mock test completed, streak is 1
    const planRaw = localStorage.getItem(`edufast_daily_focus_plan_${userKey}`);
    if (planRaw) {
      const plan = JSON.parse(planRaw);
      const doneCount = plan?.tasks?.filter(t => t.done)?.length || 0;
      if (doneCount > 0) return 1;
    }
    const mockStats = getStudentMockStats(user);
    if (mockStats.totalTests > 0) return 1;
  } catch (e) {}
  return 0;
};

// ==========================================
// DYNAMIC LIVE LEADERBOARD GENERATOR (REAL REGISTERED STUDENTS ONLY)
// ==========================================
export const getDynamicLeaderboard = (currentUser, { 
  metric = 'coins', 
  group = 'all', 
  currentCoins = null, 
  registeredStudents = [] 
} = {}) => {
  const userCoins = (currentCoins !== null && currentCoins !== undefined)
    ? Number(currentCoins)
    : getStudentCoins(currentUser);
  const mockStats = getStudentMockStats(currentUser);
  const userStreak = getStudentStreak(currentUser);

  const activeUser = {
    id: currentUser?.email || currentUser?.id || 'current-student',
    email: currentUser?.email || '',
    name: currentUser?.name || 'আপনার প্রোফাইল',
    avatar: currentUser?.avatar || (currentUser?.group === 'Commerce' ? '👨‍💼' : currentUser?.group === 'Humanities' || currentUser?.group === 'Arts' ? '👩‍🎓' : '👨‍🔬'),
    group: currentUser?.academicGroup || currentUser?.group || 'Science',
    target: currentUser?.target || (currentUser?.group === 'Commerce' ? 'DU C-Unit & IBA' : currentUser?.group === 'Humanities' || currentUser?.group === 'Arts' ? 'DU B-Unit (Law)' : 'BUET / Medical / DU A-Unit'),
    score: mockStats.avgAccuracy || 0,
    coins: userCoins,
    streak: userStreak,
    isCurrentUser: true,
    location: 'Bangladesh'
  };

  // Real registered students source (from props / server / local store)
  const peersSource = (registeredStudents && registeredStudents.length > 0)
    ? registeredStudents
    : getRegisteredStudents();

  // Merge, deduplicate and ensure current user is accurately represented
  const studentMap = new Map();

  // 1. Add all registered students
  peersSource.forEach(p => {
    if (!p) return;
    const pEmail = (p.email || '').trim().toLowerCase();
    const pId = p.id ? String(p.id) : '';
    const key = pEmail || pId || (p.name || 'student').toLowerCase();

    // Check if this student is actually the current logged-in user
    const isCurrent = (currentUser?.email && pEmail && currentUser.email.toLowerCase() === pEmail) ||
                      (currentUser?.id && p.dbId && String(currentUser.id) === String(p.dbId)) ||
                      (currentUser?.id && pId && String(currentUser.id) === pId);

    const peerCoins = isCurrent ? userCoins : (getStudentCoins(p) || Number(p.coins) || 0);
    const peerScore = isCurrent ? (mockStats.avgAccuracy || 0) : (Number(p.score) || 0);
    const peerStreak = isCurrent ? userStreak : (getStudentStreak(p) || Number(p.streak) || 0);

    const peerGroup = p.group || p.academicGroup || 'Science';
    let peerAvatar = p.avatar;
    if (!peerAvatar) {
      if (peerGroup === 'Science') peerAvatar = '👨‍🔬';
      else if (peerGroup === 'Commerce') peerAvatar = '👨‍💼';
      else peerAvatar = '👩‍🎓';
    }

    let peerTarget = p.target;
    if (!peerTarget) {
      if (peerGroup === 'Science') peerTarget = 'BUET / Medical / DU A-Unit';
      else if (peerGroup === 'Commerce') peerTarget = 'DU C-Unit & IBA';
      else peerTarget = 'DU B-Unit (Law)';
    }

    studentMap.set(key, {
      id: p.id || key,
      dbId: p.dbId || p.id,
      name: p.name || 'শিক্ষার্থী',
      email: p.email || '',
      avatar: peerAvatar,
      group: peerGroup,
      target: peerTarget,
      score: peerScore,
      coins: peerCoins,
      streak: peerStreak,
      isCurrentUser: isCurrent,
      location: p.location || 'Bangladesh'
    });
  });

  // 2. Ensure current logged-in student is included
  const activeKey = (activeUser.email || activeUser.id || activeUser.name).toLowerCase();
  studentMap.set(activeKey, activeUser);

  let list = Array.from(studentMap.values());

  // Group filter
  if (group && group !== 'all') {
    list = list.filter(item => 
      (item.group && item.group.toLowerCase() === group.toLowerCase()) || 
      item.isCurrentUser
    );
  }

  // Sort by selected metric descending (with ties broken by secondary metrics)
  list.sort((a, b) => {
    if (metric === 'score') {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      return (b.coins || 0) - (a.coins || 0);
    }
    if (metric === 'streak') {
      if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
      return (b.coins || 0) - (a.coins || 0);
    }
    if ((b.coins || 0) !== (a.coins || 0)) return (b.coins || 0) - (a.coins || 0);
    return (b.score || 0) - (a.score || 0);
  });

  // Assign continuous ranks (1, 2, 3...)
  const rankedList = list.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  const userIndex = rankedList.findIndex(item => item.isCurrentUser);
  const userItem = userIndex !== -1 ? rankedList[userIndex] : null;
  const aheadItem = userIndex > 0 ? rankedList[userIndex - 1] : null;

  let gapCoins = 0;
  let gapScore = 0;
  let gapStreak = 0;

  if (aheadItem && userItem) {
    gapCoins = Math.max(1, (aheadItem.coins || 0) - (userItem.coins || 0));
    gapScore = Math.max(0.1, Number(((aheadItem.score || 0) - (userItem.score || 0)).toFixed(1)));
    gapStreak = Math.max(1, (aheadItem.streak || 0) - (userItem.streak || 0));
  }

  // STRICT TOP 10: "নতুন স্টুডেন্ট যত জন এড হবে তাদের ভিতরে শুধু টপ 10 জন এর টাই দেখাবে"
  const top10List = rankedList.slice(0, 10);

  return {
    list: top10List,          // Strictly top 10 students for leaderboard display!
    fullList: rankedList,     // Full list for modal search
    totalRegistered: rankedList.length,
    userRank: userItem ? userItem.rank : null,
    userItem,
    aheadItem,
    gapCoins,
    gapScore,
    gapStreak
  };
};

// 7 Rotating High-Yield Study Plans for Science
const SCIENCE_DAILY_PLANS = [
  [
    { id: 'sci-d1-1', subject: 'Physics', task: 'কৌণিক গতি, টর্ক ও জড়তার ভ্রামকের ৫টি বুয়েট লিখিত প্রশ্ন সমাধান', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d1-2', subject: 'Chemistry', task: 'জৈব রসায়ন: বেনজিন, টলুইন ও ইলেক্ট্রোফিলিক প্রতিস্থাপন মেকানিজম', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d1-3', subject: 'Math', task: 'নির্দিষ্ট যোগজ (Definite Integral) শর্টকাট ও ক্ষেত্রফল নির্ণয় প্র্যাকটিস', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d1-4', subject: 'Mock Test', task: 'ডেইলি স্পিড ড্রিল (পদার্থ ও রসায়ন ২০টি এমসিকিউ - নেগেটিভ মার্কিং)', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d2-1', subject: 'Physics', task: 'স্থির তড়িৎ ও কুলম্বের সূত্র সংক্রান্ত জটিল ক্যাপাসিটর সার্কিট সলভ', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d2-2', subject: 'Chemistry', task: 'জারণ-বিজারণ সমতাকরণ ও ফ্যারাডের তড়িৎ বিশ্লেষণ সূত্র রিভিশন', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d2-3', subject: 'Math', task: 'ক্যালকুলাস: লিমিট ও অন্তরীকরণের ঢাল ও স্পর্শক শর্টকাট ফর্মুলা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d2-4', subject: 'Biology', task: 'জেনেটিক্স ও ডিএনএ অনুলিপন: চার্ট ও গুরুত্বপূর্ণ টার্মস মুখস্থকরণ', time: '৪৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d3-1', subject: 'Physics', task: 'নিউটোনিয়ান বলবিদ্যা: লিফট, পুলি ও ঘর্ষণ বলের কনসেপ্ট ক্লিয়ারিং', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d3-2', subject: 'Chemistry', task: 'রাসায়নিক পরিবর্তন: Kc, Kp ও লা-শাতেলিয়ার নীতি ভিত্তিক সমস্যা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d3-3', subject: 'Math', task: 'কনিক: পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্তের সমীকরণ ও স্পর্শক টেকনিক', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d3-4', subject: 'Mock Test', task: 'মেডিকেল স্পিড টেস্ট (জীববিজ্ঞান ও ইংরেজি ২৫টি দ্রুত প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d4-1', subject: 'Physics', task: 'আলোর ব্যতিচার, অপবর্তন ও ইয়ং-এর দ্বি-চির পরীক্ষার অঙ্ক সমাধান', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d4-2', subject: 'Chemistry', task: 'পর্যায়বৃত্ত ধর্ম ও সংকরায়ন (Hybridization) চিত্রসহ প্র্যাকটিস', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d4-3', subject: 'Math', task: 'জটিল সংখ্যা ও বহুপদী সমীকরণের মূলের প্রকৃতি যাচাই ও সমাধান', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d4-4', subject: 'Mock Test', task: 'ঢাবি ক-ইউনিট স্ট্যান্ডার্ড লিখিত প্রশ্ন সমাধান প্র্যাকটিস', time: '৩০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d5-1', subject: 'Physics', task: 'কাজ, শক্তি ও ক্ষমতা: কুয়ার পানি তোলার অংক ও ইঞ্জিনের দক্ষতা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d5-2', subject: 'Chemistry', task: 'পরিমাণগত রসায়ন: মোলারিটি, টাইট্রেশন ও জারণ সংখ্যা নির্ণয়', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d5-3', subject: 'Math', task: 'স্থানাঙ্ক জ্যামিতি ও সরলরেখার লম্ব দূরত্বের শর্টকাট ফর্মুলা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d5-4', subject: 'Biology', task: 'মানব শারীরতত্ত্ব: রক্ত সংবহন ও হৃদপিণ্ডের কার্যপদ্ধতি পর্যালোচনা', time: '৪৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d6-1', subject: 'Physics', task: 'তাপগতিবিদ্যা: কার্নো ইঞ্জিন, এন্ট্রপি ও রুদ্ধতাপীয় প্রক্রিয়ার অঙ্ক', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d6-2', subject: 'Chemistry', task: 'পরিবেশ রসায়ন: গ্রাহামের ব্যাপন সূত্র ও বয়েল-চার্লস সমীকরণ', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d6-3', subject: 'Math', task: 'বিন্যাস ও সমাবেশ (Permutation & Combination) অ্যাডমিশন ট্রিকস', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d6-4', subject: 'Mock Test', task: 'ইঞ্জিনিয়ারিং ফুল স্পিড টেস্ট (২০টি জটিল গাণিতিক প্রশ্ন)', time: '৩০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'sci-d7-1', subject: 'Physics', task: 'আধুনিক পদার্থবিজ্ঞান: ফটো-তড়িৎ ক্রিয়া ও ডি-ব্রগলি তরঙ্গদৈর্ঘ্য', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d7-2', subject: 'Chemistry', task: 'তড়িৎ রসায়ন: কোষ বিভব (E_cell) ও নার্নস্ট সমীকরণ ক্যালকুলেশন', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d7-3', subject: 'Math', task: 'ম্যাট্রিক্স ও নির্ণায়ক: বিপরীত ম্যাট্রিক্স ও ক্র্যামার্স রুল সলভ', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'sci-d7-4', subject: 'Mock Test', task: 'উইকলি গ্র্যান্ড মক টেস্ট ও উইক পয়েন্ট অডিট', time: '৪০ মিনিট', coins: 20, done: false }
  ]
];

// 7 Rotating High-Yield Study Plans for Commerce
const COMMERCE_DAILY_PLANS = [
  [
    { id: 'com-d1-1', subject: 'Accounting', task: 'ব্যাংক সমন্বয় বিবরণী ও সমন্বিত জাবেদা প্র্যাকটিস', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d1-2', subject: 'Business', task: 'ব্যবস্থাপনার নীতিসমূহ ও হেনরি ফেয়লের ১৪টি ফর্মুলা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d1-3', subject: 'English', task: 'Prepositions & Idioms (DU Ga Unit Previous 5 Years)', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d1-4', subject: 'Mock Test', task: 'গ-ইউনিট স্ট্যান্ডার্ড ডেইলি স্পিড টেস্ট (২০টি প্রশ্ন)', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d2-1', subject: 'Accounting', task: 'অংশীদারি কারবারের লাভ-লোকসান বণ্টন হিসাব ও সমন্বয়', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d2-2', subject: 'Finance', task: 'অর্থের সময়মূল্য ও চক্রবৃদ্ধিকরণ সূত্রের শর্টকাট অঙ্ক', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d2-3', subject: 'Bangla', task: 'বাংলা প্রথম পত্র: গুরুত্বপূর্ণ উদ্ধৃতি ও ব্যাকরণ কারক-বিভক্তি', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d2-4', subject: 'Mock Test', task: 'ব্যবসায় নীতি ও ইংরেজি মিক্সড কুইজ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d3-1', subject: 'Accounting', task: 'আর্থিক বিবরণী বিশ্লেষণ ও তারল্য অনুপাত নির্ণয়', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d3-2', subject: 'Business', task: 'কোম্পানি সংগঠন: শেয়ার ইস্যু, অধিহার ও অবহার সংক্রান্ত হিসাব', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d3-3', subject: 'Finance', task: 'মূলধনী আয়-ব্যয় প্রাক্কলন ও পে-ব্যাক সময় শর্টকাট', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d3-4', subject: 'Mock Test', task: 'কমার্স অল-সাবজেক্ট ভর্তি স্পিড ড্রিল (২০টি প্রশ্ন)', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d4-1', subject: 'Accounting', task: 'মজুদ পণ্যের হিসাবরক্ষণ (FIFO, LIFO ও ভারযুক্ত গড় পদ্ধতি)', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d4-2', subject: 'Business', task: 'প্রেষণা ও নেতৃত্ব তত্ত্ব (ম্যাসলোর চাহিদা সোপান ও হার্জবার্গ)', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d4-3', subject: 'English', task: 'Subject-Verb Agreement & Sentence Correction for Ga-Unit', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d4-4', subject: 'Mock Test', task: 'হিসাববিজ্ঞান ও ফিন্যান্স অ্যাডমিশন কুইজ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d5-1', subject: 'Accounting', task: 'অবচয় হিসাবরক্ষণ (সরলরৈখিক ও ক্রমহ্রাসমান জের পদ্ধতি)', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d5-2', subject: 'Finance', task: 'বাণিজ্যিক ব্যাংক ও বাংলাদেশ ব্যাংকের ঋণ নিয়ন্ত্রণ পদ্ধতি', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d5-3', subject: 'Bangla', task: 'সমাস ও সন্ধি নির্ণয় (বিগত বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষার প্রশ্ন)', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d5-4', subject: 'Mock Test', task: 'ব্যবসায় শিক্ষা পূর্ণাঙ্গ ২০ এমসিকিউ মডেল টেস্ট', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d6-1', subject: 'Accounting', task: 'কার্যপত্র (Worksheet), সমাপনী দাখিলা ও বিপরীত দাখিলা', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d6-2', subject: 'Business', task: 'বিপণন নীতিমালা: বাজার বিভক্তিকরণ ও ৪P মার্কেটিং কৌশল', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d6-3', subject: 'Finance', task: 'ঝুঁকি ও মুনাফার হার পরিমাপ ও পোর্টফোলিও বৈচিত্রায়ন', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d6-4', subject: 'Mock Test', task: 'ঢাবি গ-ইউনিট স্পেশাল স্পিড চ্যালেঞ্জ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'com-d7-1', subject: 'Accounting', task: 'রেওয়ামিল ও ভুল সংশোধন দাখিলা (Suspense Account)', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d7-2', subject: 'Business', task: 'নিয়ন্ত্রণ প্রক্রিয়া ও বাজেটারি নিয়ন্ত্রণ কৌশলসমূহ', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'com-d7-3', subject: 'English', task: 'Ga Unit Reading Comprehension & Vocabulary Drill', time: '৪৫ মিনিট', coins: 20, done: false },
    { id: 'com-d7-4', subject: 'Mock Test', task: 'কমার্স উইকলি রিভিশন গ্র্যান্ড স্পিড টেস্ট (২০টি প্রশ্ন)', time: '২৫ মিনিট', coins: 20, done: false }
  ]
];

// 7 Rotating High-Yield Study Plans for Arts
const ARTS_DAILY_PLANS = [
  [
    { id: 'arts-d1-1', subject: 'Bangla', task: 'বাংলা সাহিত্য: আধুনিক যুগের কবি-সাহিত্যিকদের সেরা রচনাবলি', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d1-2', subject: 'English', task: 'Inversion of Verbs, Subject-Verb Agreement Rules', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d1-3', subject: 'GK', task: 'বাংলাদেশ বিষয়াবলি: মুক্তিযুদ্ধ, সংবিধান ও গুরুত্বপূর্ণ মেগাপ্রকল্প', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d1-4', subject: 'Mock Test', task: 'খ-ইউনিট স্ট্যান্ডার্ড ডেইলি মডেল টেস্ট (২০টি এমসিকিউ)', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d2-1', subject: 'Bangla', task: 'বাংলা ব্যাকরণ: সমাস, সন্ধি ও উপসর্গ নির্ণয়ের সহজ টেকনিক', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d2-2', subject: 'English', task: 'Synonyms & Antonyms (High Frequency Admission Words)', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d2-3', subject: 'GK', task: 'আন্তর্জাতিক বিষয়াবলি: জাতিসংঘ, বিশ্ব জলবায়ু চুক্তি ও অর্থনৈতিক জোট', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d2-4', subject: 'Mock Test', task: 'সাধারণ জ্ঞান ও সাম্প্রতিক বিষয়াবলি স্পিড কুইজ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d3-1', subject: 'Bangla', task: 'উপসর্গ, প্রত্যয় ও বানান শুদ্ধিকরণ মাস্টারড্রিল', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d3-2', subject: 'English', task: 'Narration & Voice Change Rules for Kha Unit', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d3-3', subject: 'GK', task: 'বাংলাদেশের ভৌগোলিক অবস্থান, নদ-নদী, পাহাড় ও সীমান্ত অঞ্চল', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d3-4', subject: 'Mock Test', task: 'খ-ইউনিট সাধারণ জ্ঞান স্পিড কুইজ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d4-1', subject: 'Bangla', task: 'লালসালু ও সিরাজউদ্দৌলা নাটকের চরিত্র ও সংলাপ বিশ্লেষণ', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d4-2', subject: 'English', task: 'Conditionals, Modals & Right Form of Verbs for Admission', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d4-3', subject: 'GK', task: 'আন্তর্জাতিক সংস্থা: জাতিসংঘ, সার্ক, আসিয়ান ও ব্রিকস', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d4-4', subject: 'Mock Test', task: 'বাংলা ও ইংরেজি ভর্তি রিভিশন ড্রিল (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d5-1', subject: 'Bangla', task: 'পদ প্রকরণ ও বাক্য রূপান্তর (সরল, জটিল ও যৌগিক বাক্য)', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d5-2', subject: 'English', task: 'Sentence Correction & Identifying Errors Drill', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d5-3', subject: 'GK', task: 'বাংলাদেশ সংবিধানের অনুচ্ছেদ, মৌলিক অধিকার ও সংসদীয় ব্যবস্থা', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d5-4', subject: 'Mock Test', task: 'মানবিক ইউনিট সাম্প্রতিক বিষয়াবলি কুইজ (২০টি প্রশ্ন)', time: '২০ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d6-1', subject: 'Bangla', task: 'ধ্বনিতত্ত্ব, ন-ত্ব ও ষ-ত্ব বিধান এবং বাক্য শুদ্ধিকরণ', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d6-2', subject: 'English', task: 'Phrasal Verbs & Appropriate Preposition Masterclass', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d6-3', subject: 'GK', task: 'বিশ্ব ইতিহাস: বিশ্বযুদ্ধ, শিল্প বিপ্লব ও আন্তর্জাতিক চুক্তি', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d6-4', subject: 'Mock Test', task: 'খ-ইউনিট পূর্ণাঙ্গ স্পিড মডেল টেস্ট (২০টি প্রশ্ন)', time: '২৫ মিনিট', coins: 20, done: false }
  ],
  [
    { id: 'arts-d7-1', subject: 'Bangla', task: 'সমার্থক শব্দ, বিপরীত শব্দ ও এককথায় প্রকাশ চূড়ান্ত রিভিশন', time: '১.৫ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d7-2', subject: 'English', task: 'Kha Unit Reading Comprehension & Vocabulary Cloze Test', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d7-3', subject: 'GK', task: 'বাংলাদেশের অর্থনীতি, বাজেট ও জাতীয় মেগা প্রকল্পসমূহ', time: '১ ঘণ্টা', coins: 20, done: false },
    { id: 'arts-d7-4', subject: 'Mock Test', task: 'উইকলি আর্টস গ্র্যান্ড রিভিশন টেস্ট (২০টি প্রশ্ন)', time: '২৫ মিনিট', coins: 20, done: false }
  ]
];

export const getDailyAIFocusPlan = (user) => {
  if (typeof window === 'undefined') return { dateKey: '', tasks: [], lastUpdated: Date.now() };

  const userKey = user?.email || user?.id || 'default';
  const group = (user?.group || 'Science').trim();
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const storageKey = `edufast_daily_focus_plan_${userKey}`;

  try {
    const savedRaw = localStorage.getItem(storageKey);
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      // If plan is from today, matches the current group, and has tasks, return it
      if (saved && saved.dateKey === todayKey && saved.group?.toLowerCase() === group.toLowerCase() && Array.isArray(saved.tasks) && saved.tasks.length > 0) {
        return saved;
      }
    }
  } catch (e) {
    console.error('Error reading daily plan:', e);
  }

  // Generate new fresh 24-hour cycle plan for today!
  return regenerateDailyAIFocusPlan(user);
};

export const regenerateDailyAIFocusPlan = (user) => {
  if (typeof window === 'undefined') return { dateKey: '', tasks: [], lastUpdated: Date.now() };

  const userKey = user?.email || user?.id || 'default';
  const group = (user?.group || 'Science').trim();
  const grpLower = group.toLowerCase();
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `edufast_daily_focus_plan_${userKey}`;

  let pool = SCIENCE_DAILY_PLANS;
  if (grpLower === 'commerce') {
    pool = COMMERCE_DAILY_PLANS;
  } else if (grpLower === 'arts' || grpLower === 'humanities') {
    pool = ARTS_DAILY_PLANS;
  }

  // Pick plan index based on day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const planIndex = dayOfYear % pool.length;

  const baseTasks = pool[planIndex] || pool[0];

  // Deep clone tasks with group tag, unique date-stamped IDs and reset done status to false
  const freshTasks = baseTasks.map((t, idx) => ({
    ...t,
    group: group,
    id: `${t.id}-${todayKey}-${Date.now()}-${idx}`,
    done: false
  }));

  const newPlan = {
    dateKey: todayKey,
    lastGenerated: Date.now(),
    cycleHours: 24,
    group: group,
    tasks: freshTasks
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(newPlan));
    window.dispatchEvent(new CustomEvent('edufast-focus-plan-update', { detail: { plan: newPlan } }));
  } catch (e) {
    console.error('Error saving daily plan:', e);
  }

  return newPlan;
};

export const completeDailyTask = (user, taskId, customCoins = null) => {
  if (typeof window === 'undefined') return null;

  const userKey = user?.email || user?.id || 'default';
  const storageKey = `edufast_daily_focus_plan_${userKey}`;
  const plan = getDailyAIFocusPlan(user);

  let delta = 0;
  let targetTask = null;
  let isNewlyCompleted = false;

  const updatedTasks = plan.tasks.map(t => {
    if (t.id === taskId) {
      targetTask = t;
      if (!t.done) {
        if (customCoins !== null && customCoins !== undefined) {
          delta = Math.max(0, Number(customCoins));
        } else {
          delta = t.coins || 20;
        }
        isNewlyCompleted = true;
        return { ...t, done: true, earnedCoins: delta, completedAt: Date.now() };
      }
    }
    return t;
  });

  if (!targetTask || !isNewlyCompleted) {
    return {
      updatedPlan: plan,
      delta: 0,
      newCoins: getStudentCoins(user),
      taskCompleted: true,
      taskName: targetTask?.task
    };
  }

  const updatedPlan = {
    ...plan,
    tasks: updatedTasks,
    lastUpdated: Date.now()
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedPlan));
  } catch (e) {}

  let newCoins = getStudentCoins(user);
  if (delta > 0) {
    newCoins = updateStudentCoins(user, delta);
  }

  window.dispatchEvent(new CustomEvent('edufast-focus-plan-update', { 
    detail: { 
      plan: updatedPlan, 
      taskId, 
      isDone: true, 
      delta, 
      coins: newCoins,
      taskName: targetTask?.task
    } 
  }));

  try {
    if (delta > 0) {
      addNotification({
        title: '🪙 দৈনিক টাস্ক সম্পন্ন!',
        text: `চমৎকার! "${targetTask.task}" টাস্কটি সফলভাবে সমাধান করে আপনি +${delta} EduCoins অর্জন করেছেন।`,
        category: 'reward',
        link: 'dashboard'
      });
    } else {
      addNotification({
        title: '📝 দৈনিক টাস্ক সমাপ্ত',
        text: `"${targetTask.task}" সম্পন্ন হয়েছে। ভুল উত্তরের পেনাল্টির কারণে কোনো অতিরিক্ত কয়েন যোগ হয়নি।`,
        category: 'academic',
        link: 'dashboard'
      });
    }
  } catch {}

  return {
    updatedPlan,
    delta,
    newCoins,
    taskCompleted: true,
    taskName: targetTask?.task
  };
};

export const toggleDailyTask = completeDailyTask;

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================
export const defaultNotifications = [];

export const getNotifications = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('edufast_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Purge dummy mock items
        const clean = parsed.filter(n => !['notif-1', 'notif-2', 'notif-3', 'notif-4'].includes(n.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem('edufast_notifications', JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading notifications:', e);
  }
  return [];
};

export const addNotification = ({ title, text, category = 'general', link = null }) => {
  if (typeof window === 'undefined') return;
  const current = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    text,
    category,
    time: 'এইমাত্র (Just now)',
    timestamp: Date.now(),
    read: false,
    link
  };
  const updated = [newNotif, ...current];
  try {
    localStorage.setItem('edufast_notifications', JSON.stringify(updated));
  } catch {}

  window.dispatchEvent(new CustomEvent('edufast-notification-added', { detail: newNotif }));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'notification', action: 'add' } }));
  return updated;
};

export const markNotificationRead = (id) => {
  if (typeof window === 'undefined') return [];
  const current = getNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  try {
    localStorage.setItem('edufast_notifications', JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'notification', action: 'read', id } }));
  return updated;
};

export const markAllNotificationsRead = () => {
  if (typeof window === 'undefined') return [];
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  try {
    localStorage.setItem('edufast_notifications', JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'notification', action: 'read_all' } }));
  return updated;
};

export const clearAllNotifications = () => {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.setItem('edufast_notifications', JSON.stringify([]));
  } catch {}
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'notification', action: 'clear_all' } }));
  return [];
};

export const deleteNotification = (id) => {
  if (typeof window === 'undefined') return [];
  const current = getNotifications();
  const updated = current.filter(n => n.id !== id);
  try {
    localStorage.setItem('edufast_notifications', JSON.stringify(updated));
  } catch {}
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'notification', action: 'delete', id } }));
  return updated;
};

// ==========================================
// 8. DYNAMIC MOCK TESTS & MENTOR EXAM BUILDER (DATA/mockTests.json)
// ==========================================
export {
  getMockTests,
  saveMockTest,
  deleteMockTest,
  getMentorCreatedTests,
  mockTests
} from './mockTestsData';



