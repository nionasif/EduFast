const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');

/**
 * Idempotent seed function for EduFast database.
 * Populates all tables if empty so that the application is 100% database driven from day 1.
 */
async function seedDatabase(customDb) {
  const db = customDb || getDb();
  console.log('[Seed] Starting idempotent database population...');

  const hashedPass = (plain) => bcrypt.hashSync(plain, 8);

  // Upgrade any unhashed passwords in users_auth
  try {
    const authList = await db.all("SELECT id, password FROM users_auth");
    for (const u of authList) {
      if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        await db.run("UPDATE users_auth SET password = ? WHERE id = ?", [hashedPass(u.password), u.id]);
      }
    }
  } catch {}

  // 1. Seed Demo Users in users_auth
  const adminUser = await db.get("SELECT id FROM users_auth WHERE email = 'admin@edufast.com'");
  if (!adminUser) {
    await db.run(
      'INSERT INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
      ['admin', 'admin@edufast.com', '01700000000', hashedPass('admin123')]
    );
  } else {
    await db.run("UPDATE users_auth SET password = ? WHERE email = 'admin@edufast.com'", [hashedPass('admin123')]);
  }

  const teacherUser = await db.get("SELECT id FROM users_auth WHERE email = 'teacher@edufast.com'");
  let teacherUserId = teacherUser?.id;
  if (!teacherUser) {
    const res = await db.run(
      'INSERT INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
      ['teacher', 'teacher@edufast.com', '01711111111', hashedPass('teacher123')]
    );
    teacherUserId = res.lastID;
  } else {
    await db.run("UPDATE users_auth SET password = ? WHERE email = 'teacher@edufast.com'", [hashedPass('teacher123')]);
  }

  const mentorUser = await db.get("SELECT id FROM users_auth WHERE email = 'mentor@edufast.com'");
  let mentorUserId = mentorUser?.id;
  if (!mentorUser) {
    const res = await db.run(
      'INSERT INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
      ['mentor', 'mentor@edufast.com', '01722222222', hashedPass('mentor123')]
    );
    mentorUserId = res.lastID;
  } else {
    await db.run("UPDATE users_auth SET password = ? WHERE email = 'mentor@edufast.com'", [hashedPass('mentor123')]);
  }

  const studentUser = await db.get("SELECT id FROM users_auth WHERE email = 'student@edufast.com'");
  let studentUserId = studentUser?.id;
  if (!studentUser) {
    const res = await db.run(
      'INSERT INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
      ['student', 'student@edufast.com', '01823456789', hashedPass('password123')]
    );
    studentUserId = res.lastID;
  } else {
    await db.run("UPDATE users_auth SET password = ? WHERE email = 'student@edufast.com'", [hashedPass('password123')]);
  }


  // 2. Seed Student Profile
  const existingStudent = await db.get("SELECT id FROM students WHERE LOWER(email) = 'student@edufast.com'");
  if (!existingStudent) {
    await db.run(
      `INSERT INTO students (
        name, fathersName, mothersName, dob, mobile, email, academicGroup,
        sscRoll, sscReg, sscBoard, sscGpa, sscSchool, sscYear,
        hscRoll, hscReg, hscBoard, hscGpa, hscCollege, hscYear,
        coins, score, streak, target, password, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'Sadman Sakib', 'Md. Nazrul Islam', 'Salma Begum', '2006-05-14',
        '01823456789', 'student@edufast.com', 'Science',
        '109823', '2013897456', 'Dhaka', 5.00, 'Dhaka Residential Model College', '2024',
        '402834', '2013897456', 'Dhaka', 5.00, 'Notre Dame College', '2026',
        100, 0.0, 0, 'DU Ka & BUET Engineering', hashedPass('password123')
      ]
    );

    // Also link in student_profiles
    await db.run(
      `INSERT INTO student_profiles (
        userId, name, fathersName, mothersName, dob, academicGroup,
        sscRoll, sscReg, sscBoard, sscGpa, sscSchool,
        hscRoll, hscReg, hscBoard, hscGpa, hscCollege
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentUserId, 'Sadman Sakib', 'Md. Nazrul Islam', 'Salma Begum', '2006-05-14', 'Science',
        '109823', '2013897456', 'Dhaka', 5.00, 'Dhaka Residential Model College',
        '402834', '2013897456', 'Dhaka', 5.00, 'Notre Dame College'
      ]
    );
  }

  // 3. Seed Teacher Profile
  const existingTeacher = await db.get("SELECT id FROM teachers WHERE LOWER(email) = 'teacher@edufast.com' OR id = 'teacher-default'");
  if (!existingTeacher) {
    await db.run(
      `INSERT OR REPLACE INTO teachers (
        id, userId, name, email, mobile, fathersName, dob, academicGroup, subject,
        institution, qualification, experience, designation, department, bio,
        rating, studentsCount, coursesCount, liveHours, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'teacher-default',
        teacherUserId,
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
        4.95,
        2450,
        6,
        120
      ]
    );
  }

  // 4. Seed Mentor Profile
  const existingMentor = await db.get("SELECT id FROM mentors WHERE LOWER(email) = 'mentor@edufast.com' OR id = 'mentor-default'");
  if (!existingMentor) {
    await db.run(
      `INSERT OR REPLACE INTO mentors (
        id, userId, name, email, mobile, subject, institution, bio, rating, doubtsResolved, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'mentor-default',
        mentorUserId,
        'Engr. Abrar Fahim',
        'mentor@edufast.com',
        '01722222222',
        'Physics & Higher Math',
        'BUET CSE (Admission Rank 12)',
        '24/7 Lead Doubt Solver. Passionate about helping students crack tough analytical admission problems.',
        4.98,
        342
      ]
    );
  }

  // 5. Seed Courses & Curriculum
  const courseCount = await db.get('SELECT COUNT(*) as count FROM courses');
  if (!courseCount || courseCount.count < 3) {
    const initialCourses = [
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
        rating: 4.90,
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
        title: 'Business Studies Accounting & Management Batch',
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

    for (const c of initialCourses) {
      await db.run(
        `INSERT OR REPLACE INTO courses 
         (id, title, instructor, rating, reviewsCount, duration, price, discountedPrice, academicGroup, badge, image, description, isApproved, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Approved')`,
        [c.id, c.title, c.instructor, c.rating, c.reviewsCount, c.duration, c.price, c.discountedPrice, c.academicGroup, c.badge, c.image, c.description]
      );
    }

    // Seed lessons for course-1
    await db.run('DELETE FROM course_curriculum WHERE courseId = ?', ['course-1']);
    const lessonsCourse1 = [
      { mod: 'Module 1: ভেক্টর ও বলবিদ্যা', topic: 'Lecture 1: ভেক্টর ডট গুণন ও ক্রান্তীয় বেগ', dur: '22:15' },
      { mod: 'Module 1: ভেক্টর ও বলবিদ্যা', topic: 'Lecture 2: নিউটনিয়ান বলবিদ্যা ও সংঘর্ষ', dur: '25:40' },
      { mod: 'Module 2: কাজ, শক্তি ও ক্ষমতা', topic: 'Lecture 3: সরল ছন্দিত স্পন্দন ও সংরক্ষণশীল বল', dur: '18:50' },
      { mod: 'Module 3: স্থির তড়িৎ ও চল তড়িৎ', topic: 'Lecture 4: গাউসের সূত্র ও রোধের সন্নিবেশ', dur: '24:10' }
    ];

    let order = 1;
    for (const l of lessonsCourse1) {
      await db.run(
        `INSERT INTO course_curriculum (courseId, moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl, orderIndex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['course-1', l.mod, l.topic, '/uploads/videos/snapsave-app_1079719101469822_hd.mp4', 'local', l.dur, 'vector_notes_sheet.pdf', order++]
      );
    }

    // Seed default enrollment for demo student
    await db.run(
      `INSERT OR IGNORE INTO enrollments (studentEmail, studentName, courseId, courseTitle, progressPercent)
       VALUES (?, ?, ?, ?, 25)`,
      ['student@edufast.com', 'Sadman Sakib', 'course-1', 'University Admission Physics Masterclass']
    );
  }

  // 6. Seed Universities
  const uCount = await db.get('SELECT COUNT(*) as count FROM universities');
  if (!uCount || uCount.count < 3) {
    const univs = [
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

    for (const u of univs) {
      await db.run(
        `INSERT OR REPLACE INTO universities 
         (id, name, logo, description, deadline, examDate, applicationFee, unitsJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.logo, u.description, u.deadline, u.examDate, u.applicationFee, JSON.stringify(u.units)]
      );
    }
  }

  // 7. Seed Question Bank
  const qBankCount = await db.get('SELECT COUNT(*) as count FROM question_bank');
  if (!qBankCount || qBankCount.count < 5) {
    const questions = [
      {
        subject: 'Physics',
        chapter: 'গতির সমীকরণ',
        question: 'একটি কণা স্থির অবস্থা থেকে 2 m/s² সমত্বরণে যাত্রা শুরু করলে 5s পর বেগ কত হবে?',
        optionA: '5 m/s',
        optionB: '10 m/s',
        optionC: '15 m/s',
        optionD: '20 m/s',
        correctAnswer: 'B',
        explanation: 'v = u + at = 0 + (2 * 5) = 10 m/s',
        difficulty: 'easy',
        yearTag: 'DU Ka 2023'
      },
      {
        subject: 'Physics',
        chapter: 'মহাকর্ষ ও অভিকর্ষ',
        question: 'ভূপৃষ্ঠ থেকে কত উচ্চতায় অভিকর্ষজ ত্বরণ এর মান ভূপৃষ্ঠের মানের এক চতুর্থাংশ (g/4) হবে?',
        optionA: 'R',
        optionB: '2R',
        optionC: 'R/2',
        optionD: '4R',
        correctAnswer: 'A',
        explanation: "g' = g * (R / (R+h))² => 1/4 = (R / (R+h))² => R+h = 2R => h = R",
        difficulty: 'medium',
        yearTag: 'BUET 2022'
      },
      {
        subject: 'Chemistry',
        chapter: 'গুণগত রসায়ন',
        question: 'হাইড্রোজেন পরমাণুর বামার সিরিজের ৩য় রেখার জন্য n₁ ও n₂ এর মান কত?',
        optionA: 'n₁=2, n₂=3',
        optionB: 'n₁=2, n₂=4',
        optionC: 'n₁=2, n₂=5',
        optionD: 'n₁=1, n₂=4',
        correctAnswer: 'C',
        explanation: 'বামার সিরিজ মানে n₁=2। ৩য় রেখা হবে n₂ = 2 + 3 = 5।',
        difficulty: 'medium',
        yearTag: 'CKRUET 2021'
      },
      {
        subject: 'Higher Math',
        chapter: 'অন্তরীকরণ',
        question: 'd/dx [sin(ln x)] এর মান কত?',
        optionA: 'cos(ln x)',
        optionB: '(1/x) cos(ln x)',
        optionC: '-cos(ln x)/x',
        optionD: 'sin(1/x)',
        correctAnswer: 'B',
        explanation: 'চেইন রুল অনুসারে d/dx[sin(ln x)] = cos(ln x) * (1/x)',
        difficulty: 'easy',
        yearTag: 'DU Ka 2024'
      },
      {
        subject: 'Biology',
        chapter: 'কোষ ও এর গঠন',
        question: 'প্রোটিন তৈরির কারখানা বা প্রোটিন ফ্যাক্টরি বলা হয় কোন অঙ্গাণুকে?',
        optionA: 'মাইটোকন্ড্রিয়া',
        optionB: 'গলজি বস্তু',
        optionC: 'রাইবোজোম',
        optionD: 'লাইসোজোম',
        correctAnswer: 'C',
        explanation: 'রাইবোজোম কোষে প্রোটিন সংশ্লেষণ করে বলে একে প্রোটিন ফ্যাক্টরি বলে।',
        difficulty: 'easy',
        yearTag: 'Medical 2023'
      },
      {
        subject: 'English',
        chapter: 'Vocabulary & Prepositions',
        question: 'He is proficient _____ Mathematics and Physics.',
        optionA: 'at',
        optionB: 'in',
        optionC: 'with',
        optionD: 'for',
        correctAnswer: 'B',
        explanation: "Appropriate preposition: 'Proficient in' means skilled in a particular branch of study.",
        difficulty: 'easy',
        yearTag: 'IBA 2022'
      }
    ];

    for (const q of questions) {
      await db.run(
        `INSERT INTO question_bank 
         (subject, chapter, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, yearTag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.subject, q.chapter, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer, q.explanation, q.difficulty, q.yearTag]
      );
    }
  }

  // 8. Seed Mock Tests in mock_tests
  const testCount = await db.get('SELECT COUNT(*) as count FROM mock_tests');
  if (!testCount || testCount.count === 0) {
    const qRows = await db.all('SELECT * FROM question_bank LIMIT 10');
    const questionsSample = qRows.map((q, idx) => ({
      id: `q-${idx + 1}`,
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correct: q.correctAnswer === 'A' ? 0 : q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : 3,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      subject: q.subject
    }));

    const mockTests = [
      {
        id: 'test-du-ka-01',
        title: 'Dhaka University Ka Unit Full Model Test',
        subject: 'Physics, Chemistry, Higher Math, Biology',
        groupName: 'Science',
        duration: 30,
        totalMarks: 25,
        negativeMarking: -0.25,
        badge: '🔥 DU Special',
        examTarget: 'Dhaka University Admission',
        questionsJson: JSON.stringify(questionsSample)
      },
      {
        id: 'test-buet-01',
        title: 'BUET Engineering Pre-Admission Assessment',
        subject: 'Physics, Chemistry, Higher Math',
        groupName: 'Science',
        duration: 40,
        totalMarks: 25,
        negativeMarking: -0.25,
        badge: '⚙️ BUET Target',
        examTarget: 'BUET & Engineering',
        questionsJson: JSON.stringify(questionsSample)
      },
      {
        id: 'test-medical-01',
        title: 'National Medical & Dental Central Model Test',
        subject: 'Biology, Chemistry, Physics, English, GK',
        groupName: 'Science',
        duration: 25,
        totalMarks: 25,
        negativeMarking: -0.25,
        badge: '🩺 Medical High Yield',
        examTarget: 'Medical Colleges',
        questionsJson: JSON.stringify(questionsSample)
      }
    ];

    for (const t of mockTests) {
      await db.run(
        `INSERT INTO mock_tests 
         (id, title, subject, groupName, duration, totalMarks, negativeMarking, badge, examTarget, questionsJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.subject, t.groupName, t.duration, t.totalMarks, t.negativeMarking, t.badge, t.examTarget, t.questionsJson]
      );
    }
  }

  // 9. Seed Live Classes
  const liveCount = await db.get('SELECT COUNT(*) as count FROM live_classes');
  if (!liveCount || liveCount.count === 0) {
    const defaultClasses = [
      {
        id: 'live-class-1',
        title: 'ভেক্টর ও গতিবিদ্যা সুপার ট্রিকস লাইভ ক্লাস',
        instructor: 'Dr. Rafiqul Islam',
        instructorTitle: 'BUET Lead Physics Faculty',
        academicGroup: 'Science',
        duration: '75 Minutes',
        status: 'Upcoming',
        streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        overview: 'ঢাবি ও বুয়েট ভর্তি পরীক্ষায় আসা জটিল ভেক্টর ক্যালকুলাস ও ত্বরণ সম্পর্কিত প্রশ্নসমূহ দ্রুত সমাধানের টেকনিক।'
      },
      {
        id: 'live-class-2',
        title: 'জৈব রসায়ন বিক্রিয়া মেকানিজম রিভিশন সেশন',
        instructor: 'Tanvir Ahmed',
        instructorTitle: 'University of Dhaka',
        academicGroup: 'Science',
        duration: '90 Minutes',
        status: 'Recorded',
        streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        overview: 'মেডিকেল ও ইঞ্জিনিয়ারিং এডমিশনের সবচেয়ে গুরুত্বপূর্ণ ১৫টি জৈব রসায়ন বিক্রিয়ার ব্যাখ্যা ও প্র্যাকটিস।'
      }
    ];

    for (const lc of defaultClasses) {
      await db.run(
        `INSERT INTO live_classes 
         (id, title, instructor, instructorTitle, academicGroup, duration, status, streamUrl, overview)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lc.id, lc.title, lc.instructor, lc.instructorTitle, lc.academicGroup, lc.duration, lc.status, lc.streamUrl, lc.overview]
      );
    }
  }

  // 10. Seed Daily Tasks
  const dailyTasksCount = await db.get('SELECT COUNT(*) as count FROM daily_tasks');
  if (!dailyTasksCount || dailyTasksCount.count === 0) {
    const tasks = [
      {
        id: 'task-1',
        title: 'পদার্থবিজ্ঞান: ভেক্টর গুণন চ্যালেঞ্জ',
        subject: 'Physics',
        coins: 10,
        xp: 25,
        date: 'Today',
        question: 'দুটি ভেক্টর A ও B পরস্পর লম্ব হলে তাদের ডট গুণন (A · B) এর মান কত হবে?',
        options: ['1', '0', '-1', 'অসীম (Infinity)'],
        correctIndex: 1,
        explanation: 'A · B = |A||B| cos(90°) = 0, কারণ cos 90° = 0।'
      },
      {
        id: 'task-2',
        title: 'রসায়ন: হাইব্রিডাইজেশন টেস্ট',
        subject: 'Chemistry',
        coins: 15,
        xp: 30,
        date: 'Today',
        question: 'মিথেন (CH₄) অণুতে কেন্দ্রীয় কার্বনের সংকরায়ন (Hybridization) কী?',
        options: ['sp', 'sp²', 'sp³', 'dsp²'],
        correctIndex: 2,
        explanation: 'মিথেনে কার্বনের ৪টি সমযোজী একক বন্ধন রয়েছে, তাই এটি sp³ সংকরিত।'
      },
      {
        id: 'task-3',
        title: 'উচ্চতর গণিত: সীমা (Limits)',
        subject: 'Higher Math',
        coins: 10,
        xp: 25,
        date: 'Today',
        question: 'lim (x -> 0) [sin(x) / x] এর মান কত?',
        options: ['0', '1', 'e', 'অনির্ণেয়'],
        correctIndex: 1,
        explanation: 'মৌলিক ক্যালকুলাস উপপাদ্য অনুযায়ী lim (x -> 0) [sin(x) / x] = 1।'
      }
    ];

    for (const t of tasks) {
      await db.run(
        `INSERT INTO daily_tasks (id, title, subject, coins, xp, date, question, optionsJson, correctIndex, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.subject, t.coins, t.xp, t.date, t.question, JSON.stringify(t.options), t.correctIndex, t.explanation]
      );
    }
  }

  // 11. Seed Sample Doubts
  const doubtCount = await db.get('SELECT COUNT(*) as count FROM mentor_doubts');
  if (!doubtCount || doubtCount.count === 0) {
    await db.run(
      `INSERT INTO mentor_doubts (id, studentName, studentEmail, subject, topic, question, priority, status, claimedBy, solutionText, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        'doubt-sample-1',
        'Sadman Sakib',
        'student@edufast.com',
        'Physics',
        'মহাকর্ষ ও অভিকর্ষ',
        'একটি গ্রহের ভর পৃথিবীর ৪ গুণ এবং ব্যাসার্ধ পৃথিবীর ২ গুণ হলে ঐ গ্রহের মুক্তিবেগ কত হবে?',
        'high',
        'resolved',
        'Engr. Abrar Fahim',
        'মুক্তিবেগ v = sqrt(2GM/R)। যদি M -> 4M এবং R -> 2R হয়, তাহলে v\' = sqrt(2G(4M)/(2R)) = sqrt(2) * v। অর্থাৎ মুক্তিবেগ পৃথিবীর মানের √২ গুণ হবে।'
      ]
    );

    await db.run(
      `INSERT INTO mentor_doubts (id, studentName, studentEmail, subject, topic, question, priority, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
      [
        'doubt-sample-2',
        'Sadman Sakib',
        'student@edufast.com',
        'Chemistry',
        'জৈব রসায়ন',
        'গ্রিগনার্ড বিকারকের সাথে ফর্মালডিহাইডের বিক্রিয়ায় কোন ডিগ্রি অ্যালকোহল তৈরি হয়?',
        'high'
      ]
    );
  }

  console.log('[Seed] Database initialization and seed completed successfully.');
}

module.exports = { seedDatabase };

if (require.main === module) {
  const { initDb } = require('../config/db');
  initDb()
    .then(db => seedDatabase(db))
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}
