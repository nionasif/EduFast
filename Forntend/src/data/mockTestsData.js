// ==========================================
// MOCK TESTS DATA STORE (DATA/mockTests.json)
// ==========================================

import { generatedMockTests } from './mockTestGenerator';

const BACKEND_URL = 'http://localhost:5001';

export const getMockTests = () => {
  if (typeof window === 'undefined') return generatedMockTests || [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    if (Array.isArray(custom) && custom.length > 0) {
      return [...custom, ...(generatedMockTests || [])];
    }
  } catch (e) {
    console.error('Error reading dynamic mock tests:', e);
  }
  return generatedMockTests || [];
};

export const saveMockTest = (newTest, creator = null) => {
  if (typeof window === 'undefined') return newTest;
  try {
    const testId = newTest.id || 'test-' + Date.now();
    const formattedTest = { ...newTest, id: testId };

    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    const index = custom.findIndex(t => t.id === testId);
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

export const getMentorCreatedTests = (mentorId = null) => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_mock_tests');
    const custom = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(custom)) return [];
    if (mentorId) {
      return custom.filter(t => t.mentorId === mentorId);
    }
    return custom;
  } catch (e) {
    return [];
  }
};

export const mockTests = getMockTests();
