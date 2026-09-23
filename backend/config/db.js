const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

/**
 * Initializes SQLite database connection and runs initial table creation and schema migrations.
 */
async function initDb() {
  const fs = require('fs');
  const dbDir = path.join(__dirname, '..', 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'students.db');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // High-Performance SQLite Pragmas (Sub-millisecond query execution)
  await db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000;
    PRAGMA foreign_keys = ON;
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      fathersName TEXT,
      mothersName TEXT,
      dob TEXT,
      mobile TEXT UNIQUE NOT NULL,
      email TEXT,
      academicGroup TEXT,
      sscRoll TEXT,
      sscReg TEXT,
      sscBoard TEXT,
      sscGpa REAL,
      sscSchool TEXT,
      hscRoll TEXT,
      hscReg TEXT,
      hscBoard TEXT,
      hscGpa REAL,
      hscCollege TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instructor TEXT,
      rating REAL DEFAULT 4.9,
      reviewsCount INTEGER DEFAULT 120,
      duration TEXT,
      price REAL,
      discountedPrice REAL,
      academicGroup TEXT,
      badge TEXT,
      image TEXT,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      description TEXT,
      deadline TEXT,
      examDate TEXT,
      applicationFee REAL,
      unitsJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 1. Dedicated Users Authentication Table (Credentials & Roles)
    CREATE TABLE IF NOT EXISTS users_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL DEFAULT 'student',
      email TEXT UNIQUE,
      mobile TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isVerified INTEGER DEFAULT 0,
      lastLoginAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Dedicated Student Profiles Table (Academic & Personal info)
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT NOT NULL,
      fathersName TEXT,
      mothersName TEXT,
      dob TEXT,
      academicGroup TEXT,
      sscRoll TEXT,
      sscReg TEXT,
      sscBoard TEXT,
      sscGpa REAL,
      sscSchool TEXT,
      hscRoll TEXT,
      hscReg TEXT,
      hscBoard TEXT,
      hscGpa REAL,
      hscCollege TEXT,
      avatar TEXT,
      bio TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users_auth(id) ON DELETE CASCADE
    );

    -- 3. Dedicated Question Bank Table (MCQs & Admission Practice)
    CREATE TABLE IF NOT EXISTS question_bank (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      chapter TEXT,
      question TEXT NOT NULL,
      optionA TEXT NOT NULL,
      optionB TEXT NOT NULL,
      optionC TEXT NOT NULL,
      optionD TEXT NOT NULL,
      correctAnswer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'medium',
      yearTag TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Dedicated Course Enrollments Table
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentEmail TEXT NOT NULL,
      studentName TEXT,
      courseId TEXT NOT NULL,
      courseTitle TEXT,
      progressPercent INTEGER DEFAULT 0,
      enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Dedicated 24/7 Mentor Doubts Table
    CREATE TABLE IF NOT EXISTS mentor_doubts (
      id TEXT PRIMARY KEY,
      studentName TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      question TEXT NOT NULL,
      priority TEXT DEFAULT 'high',
      status TEXT DEFAULT 'pending',
      claimedBy TEXT,
      solutionText TEXT,
      hasVoiceNote INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Dedicated Course Curriculum & Video Lessons Table
    CREATE TABLE IF NOT EXISTS course_curriculum (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      moduleTitle TEXT NOT NULL,
      topicTitle TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      videoSourceType TEXT DEFAULT 'local',
      duration TEXT DEFAULT '20:00',
      lectureNotesUrl TEXT,
      orderIndex INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Dedicated Mock Test Attempts Table (One-Time Attempt Enforcement)
    CREATE TABLE IF NOT EXISTS mock_test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      userEmail TEXT,
      mockTestId TEXT NOT NULL,
      score REAL DEFAULT 0,
      totalMarks REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      answersJson TEXT,
      timeUsed INTEGER DEFAULT 0,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, mockTestId)
    );

    -- High-Speed B-Tree Lookup Indexes
    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
    CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile);
    CREATE INDEX IF NOT EXISTS idx_users_auth_email ON users_auth(email);
    CREATE INDEX IF NOT EXISTS idx_users_auth_mobile ON users_auth(mobile);
    CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject);
    CREATE INDEX IF NOT EXISTS idx_courses_group ON courses(academicGroup);
    CREATE INDEX IF NOT EXISTS idx_universities_deadline ON universities(deadline);
    CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_user_test ON mock_test_attempts(userId, mockTestId);
  `);

  // Migrate students table schema dynamically for OTP & verification
  try {
    const studentColumns = await db.all('PRAGMA table_info(students)');
    const columnNames = studentColumns.map(c => c.name);

    if (!columnNames.includes('password')) {
      await db.exec('ALTER TABLE students ADD COLUMN password TEXT;');
    }
    if (!columnNames.includes('isVerified')) {
      await db.exec('ALTER TABLE students ADD COLUMN isVerified INTEGER DEFAULT 0;');
    }
    if (!columnNames.includes('otpHash')) {
      await db.exec('ALTER TABLE students ADD COLUMN otpHash TEXT;');
    }
    if (!columnNames.includes('otpExpiresAt')) {
      await db.exec('ALTER TABLE students ADD COLUMN otpExpiresAt DATETIME;');
    }
    if (!columnNames.includes('otpAttempts')) {
      await db.exec('ALTER TABLE students ADD COLUMN otpAttempts INTEGER DEFAULT 0;');
    }
    if (!columnNames.includes('lastOtpSentAt')) {
      await db.exec('ALTER TABLE students ADD COLUMN lastOtpSentAt DATETIME;');
    }
    if (!columnNames.includes('coins')) {
      await db.exec('ALTER TABLE students ADD COLUMN coins INTEGER DEFAULT 0;');
    }
    if (!columnNames.includes('score')) {
      await db.exec('ALTER TABLE students ADD COLUMN score REAL DEFAULT 0.0;');
    }
    if (!columnNames.includes('streak')) {
      await db.exec('ALTER TABLE students ADD COLUMN streak INTEGER DEFAULT 0;');
    }
    if (!columnNames.includes('target')) {
      await db.exec('ALTER TABLE students ADD COLUMN target TEXT;');
    }
    if (!columnNames.includes('avatar')) {
      await db.exec('ALTER TABLE students ADD COLUMN avatar TEXT;');
    }
  } catch (migErr) {
    console.warn('[DB Migration] Notice on students schema update:', migErr.message);
  }

  // Migrate courses table schema dynamically for admin approval status
  try {
    const courseColumns = await db.all('PRAGMA table_info(courses)');
    const courseColNames = courseColumns.map(c => c.name);

    if (!courseColNames.includes('isApproved')) {
      await db.exec('ALTER TABLE courses ADD COLUMN isApproved INTEGER DEFAULT 0;');
    }
    if (!courseColNames.includes('status')) {
      await db.exec("ALTER TABLE courses ADD COLUMN status TEXT DEFAULT 'Pending';");
    }
  } catch (cMigErr) {
    console.warn('[DB Migration] Notice on courses schema update:', cMigErr.message);
  }

  // Populate sample questions if question_bank is empty
  try {
    const qCount = await db.get('SELECT COUNT(*) as count FROM question_bank');
    if (qCount && qCount.count === 0) {
      await db.exec(`
        INSERT INTO question_bank (subject, chapter, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, yearTag)
        VALUES 
        ('Physics', 'গতির সমীকরণ', 'একটি কণা স্থির অবস্থা থেকে 2 m/s² সমত্বরণে যাত্রা শুরু করলে 5s পর বেগ কত হবে?', '5 m/s', '10 m/s', '15 m/s', '20 m/s', 'B', 'v = u + at = 0 + (2 * 5) = 10 m/s', 'easy', 'DU Ka 2022'),
        ('Physics', 'মহাকর্ষ ও অভিকর্ষ', 'ভূপৃষ্ঠ থেকে কত উচ্চতায় অভিকর্ষজ ত্বরণ এর মান ভূপৃষ্ঠের মানের এক চতুর্থাংশ (g/4) হবে?', 'R', '2R', 'R/2', '4R', 'A', 'g'' = g * (R / (R+h))² => 1/4 = (R / (R+h))² => R+h = 2R => h = R', 'medium', 'BUET 2020'),
        ('Chemistry', 'গুণগত রসায়ন', 'হাইড্রোজেন পরমাণুর বামার সিরিজের ৩য় রেখার জন্য n₁ ও n₂ এর মান কত?', 'n₁=2, n₂=3', 'n₁=2, n₂=4', 'n₁=2, n₂=5', 'n₁=1, n₂=4', 'C', 'বামার সিরিজ মানে n₁=2। ৩য় রেখা হবে n₂ = 2 + 3 = 5।', 'medium', 'CKRUET 2021'),
        ('Higher Math', 'অন্তরীকরণ', 'd/dx [sin(ln x)] এর মান কত?', 'cos(ln x)', '(1/x) cos(ln x)', '-cos(ln x)/x', 'sin(1/x)', 'B', 'চেইন রুল অনুসারে d/dx[sin(ln x)] = cos(ln x) * d/dx[ln x] = (1/x) cos(ln x)', 'easy', 'DU Ka 2023'),
        ('Biology', 'কোষ ও এর গঠন', 'প্রোটিন তৈরির কারখানা বা প্রোটিন ফ্যাক্টরি বলা হয় কোন অঙ্গাণুকে?', 'মাইটোকন্ড্রিয়া', 'গলজি বস্তু', 'রাইবোজোম', 'লাইসোজোম', 'C', 'রাইবোজোম কোষে প্রোটিন সংশ্লেষণ করে বলে একে প্রোটিন ফ্যাক্টরি বলে।', 'easy', 'Medical 2022');
      `);
    }

    // Mirror existing students into users_auth and student_profiles if empty
    const authCount = await db.get('SELECT COUNT(*) as count FROM users_auth');
    if (authCount && authCount.count === 0) {
      const allStudents = await db.all('SELECT * FROM students');
      for (const s of allStudents) {
        const res = await db.run(
          'INSERT OR IGNORE INTO users_auth (role, email, mobile, password, isVerified, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          ['student', s.email || `${s.mobile}@edufast.com`, s.mobile, s.password || 'password123', s.isVerified || 1, s.createdAt || new Date().toISOString()]
        );
        if (res.lastID) {
          await db.run(
            `INSERT INTO student_profiles (userId, name, fathersName, mothersName, dob, academicGroup, sscRoll, sscReg, sscBoard, sscGpa, sscSchool, hscRoll, hscReg, hscBoard, hscGpa, hscCollege, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [res.lastID, s.name, s.fathersName, s.mothersName, s.dob, s.academicGroup, s.sscRoll, s.sscReg, s.sscBoard, s.sscGpa, s.sscSchool, s.hscRoll, s.hscReg, s.hscBoard, s.hscGpa, s.hscCollege, s.createdAt || new Date().toISOString()]
          );
        }
      }

      // Add default demo admin and teacher and mentor if not in users_auth
      await db.run('INSERT OR IGNORE INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@edufast.com', '01700000000', 'admin123', 1]);
      await db.run('INSERT OR IGNORE INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, ?)',
        ['teacher', 'teacher@edufast.com', '01711111111', 'teacher123', 1]);
      await db.run('INSERT OR IGNORE INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, ?)',
        ['mentor', 'mentor@edufast.com', '01722222222', 'mentor123', 1]);
    }

    // Seed universities if empty
    const uCount = await db.get('SELECT COUNT(*) as count FROM universities');
    if (uCount && uCount.count === 0) {
      const defaultUnivs = [
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
        }
      ];

      for (const u of defaultUnivs) {
        await db.run(
          `INSERT OR REPLACE INTO universities (id, name, logo, description, deadline, examDate, applicationFee, unitsJson)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.name, u.logo, u.description, u.deadline, u.examDate, u.applicationFee, JSON.stringify(u.units)]
        );
      }
    }

    // Seed default courses if courses table is empty
    const cCount = await db.get('SELECT COUNT(*) as count FROM courses');
    if (cCount && cCount.count === 0) {
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
          description: 'ভার্সিটি ' + 'ক' + ' ইউনিট ও ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার জন্য পদার্থবিজ্ঞানের শর্টকাট ও বিস্তারিত কনসেপ্ট।',
          isApproved: 1,
          status: 'Approved'
        },
        {
          id: 'course-2',
          title: 'Complete Medical & Varsity Biology Masterclass',
          instructor: 'Dr. Sadia Afrin, DMC (Medical Faculty)',
          rating: 4.9,
          reviewsCount: 98,
          duration: '40 Hours',
          price: 3000,
          discountedPrice: 1600,
          academicGroup: 'Science',
          badge: 'High Yield',
          image: '🧬',
          description: 'মেডিকেল ও ডেন্টাল কেন্দ্রীয় ভর্তি পরীক্ষার জন্য উদ্ভিদবিজ্ঞান ও প্রাণীবিজ্ঞানের স্পেশাল ট্রিকস ও প্র্যাকটিস।',
          isApproved: 1,
          status: 'Approved'
        },
        {
          id: 'course-3',
          title: 'Higher Math Shortcut & Problem Solving Course',
          instructor: 'Engr. Tanvir Ahmed, BUET',
          rating: 4.88,
          reviewsCount: 85,
          duration: '50 Hours',
          price: 3200,
          discountedPrice: 1700,
          academicGroup: 'Science',
          badge: 'Engineering Special',
          image: '📐',
          description: 'বুয়েট, কুয়েট, চুয়েট, রুয়েট ও ঢাবির উচ্চতর গণিত সমস্যা সমাধান ও সময় বাঁচানোর শর্ট টেকনিক।',
          isApproved: 1,
          status: 'Approved'
        }
      ];

      for (const c of defaultCourses) {
        await db.run(
          `INSERT INTO courses (id, title, instructor, rating, reviewsCount, duration, price, discountedPrice, academicGroup, badge, image, description, isApproved, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.title, c.instructor, c.rating, c.reviewsCount, c.duration, c.price, c.discountedPrice, c.academicGroup, c.badge, c.image, c.description, c.isApproved, c.status]
        );
      }

      // Seed initial sample curriculum lesson with our copied video
      await db.run(
        `INSERT INTO course_curriculum (courseId, moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl, orderIndex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['course-1', 'Module 1: ভেক্টর ও বলবিদ্যা', 'Lecture 1: ভেক্টর ডট গুণন ও ক্রান্তীয় বেগ', '/uploads/videos/snapsave-app_1079719101469822_hd.mp4', 'local', '18:45', 'vector_sheet_01.pdf', 1]
      );
    }
  } catch (seedErr) {
    console.warn('[DB Seed Notice]:', seedErr.message);
  }

  console.log('SQLite Database initialized at:', dbPath);
  return db;
}

/**
 * Returns active database instance.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized! Call initDb() first.');
  }
  return db;
}

module.exports = {
  initDb,
  getDb
};
