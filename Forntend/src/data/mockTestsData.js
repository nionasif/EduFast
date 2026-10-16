// ==========================================
// MOCK TESTS DATA STORE (DATA/mockTests.json)
// ==========================================

import { generatedMockTests } from './mockTestGenerator';

const BACKEND_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:5001'
  : '';

/**
 * Normalizes a question object to ensure standard shape:
 * { id, question, options: [string, string, string, string], correct: 0..3, explanation, subject }
 */
export const normalizeQuestion = (q, index = 0) => {
  if (!q) return null;

  // Options can be array or optionA/optionB/optionC/optionD properties
  let options = [];
  if (Array.isArray(q.options) && q.options.length > 0) {
    options = q.options.map(opt => String(opt || '').trim());
  } else if (q.optionA || q.optionB || q.optionC || q.optionD) {
    options = [
      String(q.optionA || '').trim(),
      String(q.optionB || '').trim(),
      String(q.optionC || '').trim(),
      String(q.optionD || '').trim()
    ];
  } else if (typeof q.options === 'string') {
    try {
      const parsed = JSON.parse(q.options);
      if (Array.isArray(parsed)) options = parsed.map(s => String(s || '').trim());
    } catch {
      options = q.options.split(',').map(s => s.trim());
    }
  }

  // Ensure exactly 4 options exist
  while (options.length < 4) {
    options.push(`অপশন ${options.length + 1}`);
  }

  // Handle correct answer (can be numeric index 0..3, or letter 'A', 'B', 'C', 'D')
  let correctIndex = 0;
  if (typeof q.correct === 'number' && q.correct >= 0 && q.correct < 4) {
    correctIndex = q.correct;
  } else if (typeof q.correctAnswer === 'string') {
    const map = { a: 0, b: 1, c: 2, d: 3 };
    correctIndex = map[q.correctAnswer.toLowerCase().trim()] ?? 0;
  } else if (typeof q.correct === 'string') {
    const map = { a: 0, b: 1, c: 2, d: 3 };
    const trimmed = q.correct.toLowerCase().trim();
    if (map[trimmed] !== undefined) {
      correctIndex = map[trimmed];
    } else {
      const parsedNum = parseInt(trimmed, 10);
      correctIndex = !isNaN(parsedNum) && parsedNum >= 0 && parsedNum < 4 ? parsedNum : 0;
    }
  }

  return {
    id: q.id || `q-${Date.now()}-${index + 1}`,
    question: String(q.question || q.title || q.text || `প্রশ্ন #${index + 1}`).trim(),
    options,
    correct: correctIndex,
    explanation: String(q.explanation || 'কোনো ব্যাখ্যা দেওয়া হয়নি।').trim(),
    subject: String(q.subject || 'General').trim()
  };
};

/**
 * Normalizes a full mock test object
 */
export const normalizeTest = (t) => {
  if (!t) return null;
  const questions = (Array.isArray(t.questions) ? t.questions : [])
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter(Boolean);

  return {
    ...t,
    id: t.id || 'test-' + Date.now(),
    title: String(t.title || 'এডমিশন মডেল টেস্ট').trim(),
    subject: String(t.subject || 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত').trim(),
    group: String(t.group || 'Science').trim(),
    duration: parseInt(t.duration, 10) || 30,
    totalMarks: parseInt(t.totalMarks, 10) || (questions.length > 0 ? questions.length : 100),
    negativeMarking: typeof t.negativeMarking === 'number' ? t.negativeMarking : parseFloat(t.negativeMarking) || -0.25,
    badge: String(t.badge || '🔥 Mentor Special').trim(),
    examTarget: String(t.examTarget || 'University Admission').trim(),
    mentorId: t.mentorId || '',
    mentorName: String(t.mentorName || '').trim(),
    mentorEmail: String(t.mentorEmail || '').trim(),
    createdAt: t.createdAt || new Date().toISOString(),
    questions
  };
};

/**
 * Fetch latest dynamic mock tests uploaded to backend DATA/mockTests.json
 */
export const fetchBackendMockTests = async () => {
  if (typeof window === 'undefined') return [];
  try {
    const endpoint = `${BACKEND_URL}/api/data/mock-tests`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const backendTests = json.data.map(normalizeTest).filter(Boolean);

      // Read current local dynamic tests and merge
      let localCustom = [];
      try {
        const stored = localStorage.getItem('edufast_dynamic_mock_tests');
        if (stored) localCustom = JSON.parse(stored);
      } catch (e) {}

      const testMap = new Map();
      backendTests.forEach(t => testMap.set(t.id, t));
      localCustom.forEach(t => {
        if (!testMap.has(t.id)) {
          testMap.set(t.id, normalizeTest(t));
        }
      });

      const merged = Array.from(testMap.values());
      localStorage.setItem('edufast_dynamic_mock_tests', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('edufast-mock-tests-update', { detail: { tests: merged } }));
      return merged;
    }
  } catch (err) {
    console.warn('Backend mock tests fetch notice:', err.message);
  }
  return [];
};

/**
 * Synchronous getter: combines local cached mentor tests with static generated tests
 */
export const getMockTests = () => {
  if (typeof window === 'undefined') return generatedMockTests || [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    if (Array.isArray(custom) && custom.length > 0) {
      const normalizedCustom = custom.map(normalizeTest).filter(Boolean);
      return [...normalizedCustom, ...(generatedMockTests || [])];
    }
  } catch (e) {
    console.error('Error reading dynamic mock tests:', e);
  }
  return generatedMockTests || [];
};

/**
 * Save new or edited mock test (writes to localStorage and syncs with backend DATA/mockTests.json)
 */
export const saveMockTest = (newTest, creator = null) => {
  if (typeof window === 'undefined') return newTest;
  try {
    const formattedTest = normalizeTest(newTest);

    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    const index = custom.findIndex(t => t.id === formattedTest.id);
    let updated;
    if (index >= 0) {
      updated = [...custom];
      updated[index] = formattedTest;
    } else {
      updated = [formattedTest, ...custom];
    }
    localStorage.setItem('edufast_dynamic_mock_tests', JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('edufast-mock-tests-update', { detail: { test: formattedTest } }));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'mock_tests', action: 'save' } }));

    // Live Sync with backend DATA/mockTests.json file
    fetch(`${BACKEND_URL}/api/data/mock-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedTest)
    }).catch(err => console.warn('Backend mock test sync notice:', err.message));

    return formattedTest;
  } catch (e) {
    console.error('Error saving mock test:', e);
    return newTest;
  }
};

/**
 * Delete a mock test by ID
 */
export const deleteMockTest = (testId) => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    const updated = custom.filter(t => t.id !== testId);
    localStorage.setItem('edufast_dynamic_mock_tests', JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('edufast-mock-tests-update', { detail: { deletedId: testId } }));
    window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'mock_tests', action: 'delete' } }));

    // Live Delete from backend DATA/mockTests.json file
    fetch(`${BACKEND_URL}/api/data/mock-tests/${encodeURIComponent(testId)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Backend mock test delete notice:', err.message));

    return updated;
  } catch (e) {
    console.error('Error deleting mock test:', e);
    return [];
  }
};

/**
 * Get tests created by a specific mentor
 */
export const getMentorCreatedTests = (mentorId = null) => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(custom)) return [];
    if (mentorId) {
      return custom.filter(t => t.mentorId === mentorId || t.mentorEmail === mentorId);
    }
    return custom;
  } catch (e) {
    return [];
  }
};

export const mockTests = getMockTests();

// Initial background sync on startup if in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchBackendMockTests();
  }, 100);
}
