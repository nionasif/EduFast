// ==========================================
// LIVE CLASSES DATA STORE (DATA/liveClasses.json)
// ==========================================

const BACKEND_URL = 'http://localhost:5001';

export const defaultLiveClasses = [];

export const getLiveClasses = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_live_classes');
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading live classes:', e);
  }
  return [];
};

// Async backend fetcher: syncs latest classes from backend liveClasses.json
export const fetchLiveClassesFromBackend = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/data/live-classes`);
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        localStorage.setItem('edufast_live_classes', JSON.stringify(result.data));
        window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'live_classes', action: 'fetch' } }));
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Backend live classes fetch notice:', err.message);
  }
  return getLiveClasses();
};

export const saveLiveClass = (liveSession) => {
  if (typeof window === 'undefined') return [];
  const current = getLiveClasses();
  const sessionId = liveSession.id || 'live-' + Date.now();
  const formattedSession = { ...liveSession, id: sessionId };

  const index = current.findIndex(c => c.id === sessionId);
  let updated;
  if (index >= 0) {
    updated = current.map(c => c.id === sessionId ? { ...c, ...formattedSession } : c);
  } else {
    updated = [formattedSession, ...current];
  }

  localStorage.setItem('edufast_live_classes', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'live_classes', action: 'save' } }));

  // Live Sync with backend DATA/liveClasses.json file
  fetch(`${BACKEND_URL}/api/data/live-classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedSession)
  }).catch(err => console.warn('Backend live class sync notice:', err.message));

  return updated;
};

export const deleteLiveClass = (classId) => {
  if (typeof window === 'undefined') return [];
  const current = getLiveClasses();
  const updated = current.filter(c => String(c.id) !== String(classId));
  localStorage.setItem('edufast_live_classes', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'live_classes', action: 'delete' } }));

  // Live Delete from backend DATA/liveClasses.json file
  fetch(`${BACKEND_URL}/api/data/live-classes/${encodeURIComponent(classId)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Backend live class delete notice:', err.message));

  return updated;
};
