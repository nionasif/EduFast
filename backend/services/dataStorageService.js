const fs = require('fs');
const path = require('path');

// Master DATA directory
const BACKEND_DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(BACKEND_DATA_DIR)) {
    fs.mkdirSync(BACKEND_DATA_DIR, { recursive: true });
  }
}

ensureDirs();

// Safe read JSON
function readDataFile(filename) {
  ensureDirs();
  const filePath = path.join(BACKEND_DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return null;
  }
}

// Safe write JSON to backend/data
function writeDataFile(filename, data) {
  ensureDirs();
  const formatted = JSON.stringify(data, null, 2);
  const filePath = path.join(BACKEND_DATA_DIR, filename);

  try {
    fs.writeFileSync(filePath, formatted, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

// Seed default datasets if files don't exist
function initDefaultData() {
  ensureDirs();

  // 1. courses.json
  if (!readDataFile('courses.json')) {
    const defaultCourses = [
      {
        id: 'course-1',
        title: 'University Admission Physics Masterclass',
        instructor: 'Dr. Rafiqul Islam, BUET (Lead Physics Instructor)',
        rating: 4.95,
        reviewsCount: 140,
        duration: '45 Hours',
        price: 3500,
        discountedPrice: 1800,
        academicGroup: 'Science',
        badge: 'Best Seller',
        image: '⚛️',
        description: 'ঢাবি ক-ইউনিট, বুয়েট ও ইঞ্জিনিয়ারিং গুচ্ছের জন্য পদার্থবিজ্ঞান ১ম ও ২য় পত্রের সকল অধ্যায়ের পূর্ণাঙ্গ প্রস্তুতি।'
      },
      {
        id: 'course-2',
        title: 'Complete Organic Chemistry Mastery',
        instructor: 'Tanvir Ahmed, University of Dhaka',
        rating: 4.9,
        reviewsCount: 115,
        duration: '38 Hours',
        price: 3200,
        discountedPrice: 1600,
        academicGroup: 'Science',
        badge: 'High Rated',
        image: '🧪',
        description: 'জৈব রসায়নের মেকানিজম, বিক্রিয়া এবং রূপান্তর সহজে মনে রাখার আধুনিক শর্টকাট টেকনিক ও প্রশ্ন সমাধান।'
      },
      {
        id: 'course-3',
        title: 'Higher Mathematics Admission Formula & Shortcuts',
        instructor: 'Engr. Shafiul Alam, BUET',
        rating: 4.92,
        reviewsCount: 98,
        duration: '40 Hours',
        price: 3000,
        discountedPrice: 1500,
        academicGroup: 'Science',
        badge: 'Popular',
        image: '📐',
        description: 'ক্যালকুলাস, কনিক, ত্রিকোণমিতি ও জটিল সংখ্যার ক্যালকুলেটর ট্রিকস ও দ্রুততম সমাধান পদ্ধতি।'
      },
      {
        id: 'course-4',
        title: 'Medical Biology Comprehensive Admission Batch',
        instructor: 'Dr. Fariha Tasnim, Dhaka Medical College',
        rating: 4.98,
        reviewsCount: 210,
        duration: '50 Hours',
        price: 3800,
        discountedPrice: 1950,
        academicGroup: 'Science',
        badge: 'Medical Special',
        image: '🧬',
        description: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষার জন্য উদ্ভিদবিজ্ঞান ও প্রাণিবিজ্ঞানের প্রতিটি লাইনের গভীর বিশ্লেষণ।'
      },
      {
        id: 'course-5',
        title: 'University Admission English & Bangla Crash Course',
        instructor: 'Kamrul Hasan, University of Dhaka',
        rating: 4.88,
        reviewsCount: 85,
        duration: '32 Hours',
        price: 2500,
        discountedPrice: 1200,
        academicGroup: 'Arts',
        badge: 'B-Unit Special',
        image: '📖',
        description: 'ঢাবি বি-ইউনিট ও গুচ্ছ মানবিক শাখার জন্য ব্যাকরণ, সাহিত্য ও ভোকাবুলারি স্পেশাল ড্রিল।'
      },
      {
        id: 'course-6',
        title: 'Business Studies Accounting & Management Special Batch',
        instructor: 'Naimul Islam, DU IBA',
        rating: 4.91,
        reviewsCount: 76,
        duration: '35 Hours',
        price: 2800,
        discountedPrice: 1400,
        academicGroup: 'Commerce',
        badge: 'C-Unit Special',
        image: '📊',
        description: 'হিসাববিজ্ঞান ও ব্যবসায় সংগঠনের খুঁটিনাটি ও বিগত ২০ বছরের বিশ্ববিদ্যালয়ের প্রশ্ন সমাধান।'
      }
    ];
    writeDataFile('courses.json', defaultCourses);
  }

  // 2. admissions.json
  if (!readDataFile('admissions.json')) {
    const defaultAdmissions = [
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
    writeDataFile('admissions.json', defaultAdmissions);
  }

  // 3. questions.json & questionBank.json
  if (!readDataFile('questions.json')) {
    writeDataFile('questions.json', []);
  }
  if (!readDataFile('questionBank.json')) {
    writeDataFile('questionBank.json', []);
  }

  // 4. mockTests.json
  if (!readDataFile('mockTests.json')) {
    writeDataFile('mockTests.json', []);
  }

  // 5. liveClasses.json
  if (!readDataFile('liveClasses.json')) {
    writeDataFile('liveClasses.json', []);
  }

  // 6. doubts.json
  if (!readDataFile('doubts.json')) {
    writeDataFile('doubts.json', []);
  }
}

// Get all files metadata
function listFilesSummary() {
  ensureDirs();
  const knownFiles = [
    { name: 'courses.json', title: 'Course Hub (কোর্সসমূহ)', category: 'Courses' },
    { name: 'admissions.json', title: 'Admissions (বিশ্ববিদ্যালয় ভর্তি তথ্য)', category: 'Admissions' },
    { name: 'questions.json', title: 'Question Bank (প্রশ্ন ব্যাংক - একক প্রশ্ন)', category: 'Questions' },
    { name: 'questionBank.json', title: 'Question Papers (প্রশ্নপত্র আর্কাইভ)', category: 'Questions' },
    { name: 'mockTests.json', title: 'Mock Tests (লাইভ মক টেস্ট)', category: 'Exams' },
    { name: 'liveClasses.json', title: 'Live Classes (লাইভ ক্লাস ও ওয়েবিনার)', category: 'Classes' },
    { name: 'doubts.json', title: 'Doubts Queue (প্রশ্নোত্তর ও ডাউট সলভ)', category: 'Mentoring' }
  ];

  return knownFiles.map(fileInfo => {
    const filePath = path.join(BACKEND_DATA_DIR, fileInfo.name);
    let size = 0;
    let count = 0;
    let updatedAt = new Date().toISOString();

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        size = stats.size;
        updatedAt = stats.mtime.toISOString();
        const data = readDataFile(fileInfo.name);
        if (Array.isArray(data)) {
          count = data.length;
        } else if (data && typeof data === 'object') {
          count = Object.keys(data).length;
        }
      } catch (e) {}
    }

    return {
      ...fileInfo,
      path: `backend/data/${fileInfo.name}`,
      itemCount: count,
      sizeBytes: size,
      sizeKb: (size / 1024).toFixed(2),
      updatedAt
    };
  });
}

module.exports = {
  BACKEND_DATA_DIR,
  readDataFile,
  writeDataFile,
  initDefaultData,
  listFilesSummary
};
