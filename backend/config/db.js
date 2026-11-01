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

    -- 2b. Dedicated Teacher Profiles Table (Credentials, Academic & Personal info)
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT,
      fathersName TEXT,
      dob TEXT,
      academicGroup TEXT,
      subject TEXT,
      institution TEXT,
      qualification TEXT,
      experience TEXT,
      designation TEXT,
      department TEXT,
      bio TEXT,
      avatar TEXT,
      rating REAL DEFAULT 5.0,
      studentsCount INTEGER DEFAULT 0,
      coursesCount INTEGER DEFAULT 0,
      liveHours REAL DEFAULT 0,
      isVerified INTEGER DEFAULT 1,
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

    -- 8. Dedicated Mentors Table
    CREATE TABLE IF NOT EXISTS mentors (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT,
      subject TEXT,
      institution TEXT,
      bio TEXT,
      avatar TEXT,
      rating REAL DEFAULT 5.0,
      doubtsResolved INTEGER DEFAULT 0,
      isVerified INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users_auth(id) ON DELETE CASCADE
    );

    -- 9. Dedicated Lesson Progress Table
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentEmail TEXT NOT NULL,
      courseId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(studentEmail, courseId, lessonId)
    );

    -- 10. Dedicated Daily Tasks Table
    CREATE TABLE IF NOT EXISTS daily_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      coins INTEGER DEFAULT 10,
      xp INTEGER DEFAULT 25,
      date TEXT,
      question TEXT NOT NULL,
      optionsJson TEXT NOT NULL,
      correctIndex INTEGER DEFAULT 0,
      explanation TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Student Daily Task Completions Table
    CREATE TABLE IF NOT EXISTS student_daily_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentEmail TEXT NOT NULL,
      taskId TEXT NOT NULL,
      coinsAwarded INTEGER DEFAULT 10,
      solvedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(studentEmail, taskId)
    );

    -- 11b. Student Personal Lecture Notes Table
    CREATE TABLE IF NOT EXISTS student_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentEmail TEXT NOT NULL,
      courseId TEXT NOT NULL,
      noteText TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(studentEmail, courseId)
    );

    -- 11c. Virtual Study Lounge Sessions Log Table
    CREATE TABLE IF NOT EXISTS study_lounge_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentEmail TEXT NOT NULL,
      durationMinutes INTEGER DEFAULT 25,
      subject TEXT DEFAULT 'General Study',
      coinsAwarded INTEGER DEFAULT 5,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Dedicated Mock Tests Table
    CREATE TABLE IF NOT EXISTS mock_tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      groupName TEXT DEFAULT 'Science',
      duration INTEGER DEFAULT 30,
      totalMarks REAL DEFAULT 100,
      negativeMarking REAL DEFAULT -0.25,
      badge TEXT DEFAULT 'Standard',
      examTarget TEXT DEFAULT 'University Admission',
      questionsJson TEXT,
      isCustom INTEGER DEFAULT 0,
      createdBy TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Dedicated Live Classes Table
    CREATE TABLE IF NOT EXISTS live_classes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instructor TEXT,
      instructorTitle TEXT,
      academicGroup TEXT DEFAULT 'Science',
      duration TEXT DEFAULT '60 Minutes',
      status TEXT DEFAULT 'Upcoming',
      streamUrl TEXT,
      overview TEXT,
      registeredCount INTEGER DEFAULT 0,
      scheduledAt TEXT,
      startedAt TEXT,
      endedAt TEXT,
      recordingUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. Dedicated Virtual Study Lounge Messages Table
    CREATE TABLE IF NOT EXISTS study_lounge_messages (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      senderId TEXT,
      senderName TEXT NOT NULL,
      senderAvatar TEXT,
      senderRole TEXT DEFAULT 'student',
      text TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. Dedicated Payments & Subscriptions Table (bKash, Nagad, Rocket)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      studentEmail TEXT NOT NULL,
      studentName TEXT,
      studentMobile TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'BDT',
      paymentMethod TEXT NOT NULL, -- 'bKash' | 'Nagad' | 'Rocket'
      paymentType TEXT NOT NULL, -- 'subscription' | 'course'
      targetId TEXT, -- plan name (e.g., 'pro_monthly') or courseId
      targetTitle TEXT,
      transactionId TEXT UNIQUE NOT NULL,
      senderNumber TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Dedicated Broadcast Notices & Circulars Table
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'General',
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(studentEmail, courseId);
    CREATE INDEX IF NOT EXISTS idx_student_daily_tasks_email ON student_daily_tasks(studentEmail);
    CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
    CREATE INDEX IF NOT EXISTS idx_lounge_room ON study_lounge_messages(roomId);
    CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(studentEmail);
    CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(isActive);
    CREATE INDEX IF NOT EXISTS idx_student_notes_email ON student_notes(studentEmail, courseId);
    CREATE INDEX IF NOT EXISTS idx_study_lounge_logs_email ON study_lounge_logs(studentEmail);
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
      await db.exec('ALTER TABLE students ADD COLUMN coins INTEGER DEFAULT 100;');
    }
    // Grant 100 Welcome Coins to new student accounts with 0 or null coins
    try {
      await db.run('UPDATE students SET coins = 100 WHERE coins IS NULL OR coins = 0;');
    } catch {}
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
    if (!columnNames.includes('sscYear')) {
      await db.exec('ALTER TABLE students ADD COLUMN sscYear TEXT;');
    }
    if (!columnNames.includes('hscYear')) {
      await db.exec('ALTER TABLE students ADD COLUMN hscYear TEXT;');
    }
    if (!columnNames.includes('isPremium')) {
      await db.exec('ALTER TABLE students ADD COLUMN isPremium INTEGER DEFAULT 0;');
    }
    if (!columnNames.includes('subscriptionPlan')) {
      await db.exec('ALTER TABLE students ADD COLUMN subscriptionPlan TEXT DEFAULT "free";');
    }
    if (!columnNames.includes('subscriptionExpiresAt')) {
      await db.exec('ALTER TABLE students ADD COLUMN subscriptionExpiresAt DATETIME;');
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
    if (!courseColNames.includes('teacherEmail')) {
      await db.exec('ALTER TABLE courses ADD COLUMN teacherEmail TEXT;');
    }
  } catch (cMigErr) {
    console.warn('[DB Migration] Notice on courses schema update:', cMigErr.message);
  }

  // Migrate mentor_doubts schema dynamically
  try {
    const doubtColumns = await db.all('PRAGMA table_info(mentor_doubts)');
    const doubtColNames = doubtColumns.map(c => c.name);

    if (!doubtColNames.includes('studentEmail')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN studentEmail TEXT;');
    }
    if (!doubtColNames.includes('attachmentUrl')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN attachmentUrl TEXT;');
    }
    if (!doubtColNames.includes('repliedAt')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN repliedAt DATETIME;');
    }
    if (!doubtColNames.includes('resolvedAt')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN resolvedAt DATETIME;');
    }
    if (!doubtColNames.includes('claimedEmail')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN claimedEmail TEXT;');
    }
    if (!doubtColNames.includes('escalationReason')) {
      await db.exec('ALTER TABLE mentor_doubts ADD COLUMN escalationReason TEXT;');
    }
  } catch (dMigErr) {
    console.warn('[DB Migration] Notice on mentor_doubts schema update:', dMigErr.message);
  }

  // Migrate universities schema dynamically for admit card and results
  try {
    const univColumns = await db.all('PRAGMA table_info(universities)');
    const univColNames = univColumns.map(c => c.name);

    if (!univColNames.includes('admitCardUrl')) {
      await db.exec('ALTER TABLE universities ADD COLUMN admitCardUrl TEXT;');
    }
    if (!univColNames.includes('admitCardStatus')) {
      await db.exec("ALTER TABLE universities ADD COLUMN admitCardStatus TEXT DEFAULT 'upcoming';");
    }
    if (!univColNames.includes('resultUrl')) {
      await db.exec('ALTER TABLE universities ADD COLUMN resultUrl TEXT;');
    }
    if (!univColNames.includes('resultStatus')) {
      await db.exec("ALTER TABLE universities ADD COLUMN resultStatus TEXT DEFAULT 'pending';");
    }
    if (!univColNames.includes('examCenter')) {
      await db.exec('ALTER TABLE universities ADD COLUMN examCenter TEXT;');
    }
    if (!univColNames.includes('reportingTime')) {
      await db.exec('ALTER TABLE universities ADD COLUMN reportingTime TEXT;');
    }
  } catch (uMigErr) {
    console.warn('[DB Migration] Notice on universities schema update:', uMigErr.message);
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

      // Seed default teacher in teachers table
      await db.run(`INSERT OR IGNORE INTO teachers (
        id, name, email, mobile, fathersName, dob, academicGroup, subject,
        institution, qualification, experience, designation, department, bio,
        rating, studentsCount, coursesCount, liveHours, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'teacher-default',
        'Dr. Mahfuzur Rahman',
        'teacher@edufast.com',
        '01711111111',
        'Md. Abdur Rahim',
        '1988-06-15',
        'Science',
        'Higher Mathematics',
        'BUET / Notre Dame College',
        'Ph.D in Applied Mathematics (BUET)',
        '8+ Years',
        'Senior Lead Instructor',
        'Senior Lead Instructor, Science Wing',
        'Lead Higher Mathematics & Engineering admission instructor with 8+ years of dedicated mentoring experience.',
        4.9,
        2450,
        6,
        120,
        1
      ]);
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

    // Note: Default courses seeding removed to ensure zero demo data
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
