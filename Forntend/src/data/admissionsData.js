// ==========================================
// ADMISSIONS DATA STORE (DATA/admissions.json)
// ==========================================

const BACKEND_URL = 'http://localhost:5001';

export const defaultAdmissions = [
  {
    id: 'univ-du',
    name: 'Dhaka University (DU)',
    logo: '🏛️',
    description: 'ঢাকা বিশ্ববিদ্যালয় স্নাতক ১ম বর্ষ সম্মান ভর্তি পরীক্ষা ২০২৬-২০২৭',
    deadline: '2027-01-10',
    examDate: 'February 15, 2027',
    applicationFee: 1050,
    units: [
      { name: 'Science Unit (A Unit)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math/Biology', details: 'বিজ্ঞান অনুষদ, জীববিজ্ঞান ও ফার্মেসি অনুষদ' },
      { name: 'Arts, Law & Social Science Unit (B Unit)', group: 'Arts', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'Bangla, English, General Knowledge', details: 'কলা, আইন ও সামাজিক বিজ্ঞান অনুষদভুক্ত সকল বিভাগ' },
      { name: 'Business Studies Unit (C Unit)', group: 'Commerce', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'Accounting, Business Organization, English', details: 'ব্যবসায় শিক্ষা অনুষদ (বিবিএ প্রোগ্রাম)' },
      { name: 'Fine Arts Unit (E Unit)', group: 'Arts', minGpa: 6.5, minIndividualGpa: 3.0, subjects: 'Drawing, General Knowledge', details: 'চারুকলা অনুষদভুক্ত বিষয়সমূহ' },
      { name: 'IBA Unit', group: 'Science', minGpa: 7.5, minIndividualGpa: 3.5, subjects: 'English, Math, Analytical Ability', details: 'ইনস্টিটিউট অব বিজনেস অ্যাডমিনিস্ট্রেশন (আইবিএ - ডিইউ)' }
    ]
  },
  {
    id: 'univ-buet',
    name: 'BUET Engineering',
    logo: '⚙️',
    description: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট) স্নাতক ভর্তি পরীক্ষা',
    deadline: '2027-01-15',
    examDate: 'February 28, 2027',
    applicationFee: 1300,
    units: [
      { name: 'Engineering & URP (Ka Unit)', group: 'Science', minGpa: 10.0, minIndividualGpa: 5.0, subjects: 'Physics, Chemistry, Higher Math (PCM GPA 5.00)', details: 'সিভিল, ইইই, সিএসই, মেকানিক্যাল অনুষদ' },
      { name: 'Architecture (Kha Unit)', group: 'Science', minGpa: 10.0, minIndividualGpa: 5.0, subjects: 'Physics, Chemistry, Math, Freehand Drawing', details: 'স্থাপত্য অনুষদ' }
    ]
  },
  {
    id: 'univ-medical',
    name: 'Medical Colleges of Bangladesh',
    logo: '🩺',
    description: 'জাতীয় এমবিবিএস ও বিডিএস সমন্বিত কেন্দ্রীয় ভর্তি পরীক্ষা',
    deadline: '2026-12-25',
    examDate: 'January 20, 2027',
    applicationFee: 1000,
    units: [
      { name: 'MBBS & BDS Medical Unit', group: 'Science', minGpa: 9.0, minIndividualGpa: 4.0, subjects: 'Biology (Min GPA 4.0), Chemistry, Physics, English, GK', details: 'সরকারি ও বেসরকারি মেডিকেল এবং ডেন্টাল কলেজসমূহ' }
    ]
  },
  {
    id: 'univ-cu',
    name: 'Chittagong University (CU)',
    logo: '🚢',
    description: 'চট্টগ্রাম বিশ্ববিদ্যালয় ১ম বর্ষ স্নাতক (সম্মান) ভর্তি পরীক্ষা',
    deadline: '2027-01-20',
    examDate: 'March 05, 2027',
    applicationFee: 950,
    units: [
      { name: 'A Unit (Science & Engineering)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math, Biology', details: 'বিজ্ঞান ও ইঞ্জিনিয়ারিং অনুষদ' },
      { name: 'B Unit (Arts & Humanities)', group: 'Arts', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'Bangla, English, General Knowledge', details: 'কলা ও মানববিদ্যা অনুষদ' },
      { name: 'C Unit (Business Administration)', group: 'Commerce', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'English, Accounting, Business Studies', details: 'ব্যবসায় প্রশাসন অনুষদ' },
      { name: 'D Unit (Combined / Group Change)', group: 'Arts', minGpa: 7.5, minIndividualGpa: 3.5, subjects: 'Bangla, English, Analytical Skills, Economics', details: 'সামাজিক বিজ্ঞান ও বিভাগ পরিবর্তন ইউনিট' }
    ]
  },
  {
    id: 'univ-gst',
    name: 'GST Cluster Universities',
    logo: '🌐',
    description: 'জিএসটি গুচ্ছভুক্ত ২২টি সাধারণ এবং বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
    deadline: '2027-02-05',
    examDate: 'March 20, 2027',
    applicationFee: 1500,
    units: [
      { name: 'A Unit (Science)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math/Biology', details: 'গুচ্ছ বিজ্ঞান অনুষদ' },
      { name: 'B Unit (Humanities)', group: 'Arts', minGpa: 6.5, minIndividualGpa: 3.0, subjects: 'Bangla, English, General Knowledge', details: 'গুচ্ছ মানবিক অনুষদ' },
      { name: 'C Unit (Commerce)', group: 'Commerce', minGpa: 6.5, minIndividualGpa: 3.0, subjects: 'Accounting, Business Organization, English', details: 'গুচ্ছ ব্যবসায় শিক্ষা অনুষদ' }
    ]
  },
  {
    id: 'univ-ru',
    name: 'Rajshahi University (RU)',
    logo: '🦅',
    description: 'রাজশাহী বিশ্ববিদ্যালয় স্নাতক ১ম বর্ষ সম্মান ভর্তি পরীক্ষা',
    deadline: '2027-01-25',
    examDate: 'March 10, 2027',
    applicationFee: 1100,
    units: [
      { name: 'A Unit (Humanities)', group: 'Arts', minGpa: 7.0, minIndividualGpa: 3.0, subjects: 'Bangla, English, GK', details: 'কলা, আইন, সামাজিক বিজ্ঞান ও চারুকলা অনুষদ' },
      { name: 'B Unit (Business Studies)', group: 'Commerce', minGpa: 7.5, minIndividualGpa: 3.0, subjects: 'Accounting, Business Principles, English', details: 'ব্যবসায় শিক্ষা অনুষদ ও আইবিএ' },
      { name: 'C Unit (Science)', group: 'Science', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Physics, Chemistry, Math, Biology', details: 'বিজ্ঞান, জীববিজ্ঞান, কৃষি ও প্রকৌশল অনুষদ' }
    ]
  },
  {
    id: 'univ-ju',
    name: 'Jahangirnagar University (JU)',
    logo: '🌿',
    description: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় স্নাতক (সম্মান) ১ম বর্ষ ভর্তি পরীক্ষা',
    deadline: '2027-01-30',
    examDate: 'February 22, 2027',
    applicationFee: 1100,
    units: [
      { name: 'A Unit (Mathematical & Physical Sciences)', group: 'Science', minGpa: 8.5, minIndividualGpa: 4.0, subjects: 'Math, Physics, Chemistry, Bangla, English', details: 'গাণিতিক ও পদার্থবিজ্ঞান অনুষদ এবং আইআইটি' },
      { name: 'B Unit (Social Sciences)', group: 'Arts', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Bangla, English, Math, General Knowledge', details: 'সমাজবিজ্ঞান অনুষদ ও আইন অনুষদ' },
      { name: 'C Unit (Arts & Humanities)', group: 'Arts', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Bangla, English, General Knowledge', details: 'কলা ও মানবিক অনুষদ' },
      { name: 'D Unit (Biological Sciences)', group: 'Science', minGpa: 8.5, minIndividualGpa: 4.0, subjects: 'Bangla, English, Chemistry, Botany, Zoology', details: 'জীববিজ্ঞান অনুষদ' },
      { name: 'E Unit (Business Studies)', group: 'Commerce', minGpa: 8.0, minIndividualGpa: 3.5, subjects: 'Bangla, English, Math, Accounting, Business', details: 'ব্যবসায় শিক্ষা অনুষদ' }
    ]
  }
];

export const mockAdmissions = defaultAdmissions;

export const getAdmissions = () => {
  if (typeof window === 'undefined') return defaultAdmissions;
  try {
    const stored = localStorage.getItem('edufast_dynamic_admissions');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading dynamic admissions from localStorage:', e);
  }
  try {
    localStorage.setItem('edufast_dynamic_admissions', JSON.stringify(defaultAdmissions));
  } catch (e) {}
  return defaultAdmissions;
};

export const saveAdmission = (univ) => {
  if (typeof window === 'undefined') return defaultAdmissions;
  const current = getAdmissions();
  const univId = univ.id || 'univ-' + Date.now();
  const formattedUniv = { ...univ, id: univId };

  const index = current.findIndex(u => u.id === univId);
  let updated;
  if (index >= 0) {
    updated = current.map(u => u.id === univId ? { ...u, ...formattedUniv } : u);
  } else {
    updated = [formattedUniv, ...current];
  }

  localStorage.setItem('edufast_dynamic_admissions', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'admission', action: 'save' } }));

  // Live Sync with backend DATA/admissions.json file
  fetch(`${BACKEND_URL}/api/data/admissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedUniv)
  }).catch(err => console.warn('Backend admission sync notice:', err.message));

  return updated;
};

export const deleteAdmission = (univId) => {
  if (typeof window === 'undefined') return [];
  const current = getAdmissions();
  const updated = current.filter(u => u.id !== univId);
  localStorage.setItem('edufast_dynamic_admissions', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'admission', action: 'delete' } }));

  // Live Delete from backend DATA/admissions.json file
  fetch(`${BACKEND_URL}/api/data/admissions/${encodeURIComponent(univId)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Backend admission delete notice:', err.message));

  return updated;
};
