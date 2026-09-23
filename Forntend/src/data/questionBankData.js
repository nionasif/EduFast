// ==========================================
// QUESTION BANK ARCHIVE STORE (DATA/questionBank.json & DATA/questions.json)
// ==========================================

const BACKEND_URL = 'http://localhost:5001';

export const defaultQuestionBank = [];

export const getQuestionBank = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_question_bank');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading question bank:', e);
  }
  return [];
};

export const saveQuestionPaper = (paper) => {
  if (typeof window === 'undefined') return [];
  const current = getQuestionBank();
  const paperId = paper.id || 'qb-' + Date.now();
  const formattedPaper = { ...paper, id: paperId };

  const index = current.findIndex(p => p.id === paperId);
  let updated;
  if (index >= 0) {
    updated = current.map(p => p.id === paperId ? { ...p, ...formattedPaper } : p);
  } else {
    updated = [formattedPaper, ...current];
  }

  localStorage.setItem('edufast_question_bank', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'question_bank', action: 'save' } }));

  // Live Sync with backend DATA/questionBank.json file
  fetch(`${BACKEND_URL}/api/data/question-bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedPaper)
  }).catch(err => console.warn('Backend question paper sync notice:', err.message));

  return updated;
};

export const deleteQuestionPaper = (paperId) => {
  if (typeof window === 'undefined') return [];
  const current = getQuestionBank();
  const updated = current.filter(p => p.id !== paperId);
  localStorage.setItem('edufast_question_bank', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'question_bank', action: 'delete' } }));

  // Live Delete from backend DATA/questionBank.json file
  fetch(`${BACKEND_URL}/api/data/question-bank/${encodeURIComponent(paperId)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Backend question paper delete notice:', err.message));

  return updated;
};
