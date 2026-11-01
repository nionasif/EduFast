const express = require('express');
const router = express.Router();
const {
  readDataFile,
  writeDataFile,
  listFilesSummary,
  initDefaultData
} = require('../services/dataStorageService');
const { getDb } = require('../config/db');

// Ensure seed data is initialized
initDefaultData();

// =============================================================
// 1. DATA FILES SUMMARY & DIRECT FILE EDITING (For Admin Studio)
// =============================================================

// GET /api/data/files - List all data files with metadata
router.get('/api/data/files', (req, res) => {
  try {
    const files = listFilesSummary();
    return res.json({ success: true, data: files });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/data/file/:filename - Get raw content of a specific file
router.get('/api/data/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Security check to avoid path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    const data = readDataFile(filename);
    if (data === null) {
      return res.status(404).json({ success: false, error: `File ${filename} not found` });
    }
    return res.json({ success: true, filename, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/data/file/:filename - Update raw content of a specific file
router.put('/api/data/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    const { content } = req.body;
    let parsedData = content;
    if (typeof content === 'string') {
      try {
        parsedData = JSON.parse(content);
      } catch (parseErr) {
        return res.status(400).json({ success: false, error: 'Invalid JSON format: ' + parseErr.message });
      }
    }

    const success = writeDataFile(filename, parsedData);
    if (!success) {
      return res.status(500).json({ success: false, error: `Failed to write ${filename}` });
    }

    return res.json({
      success: true,
      message: `Successfully saved ${filename}`,
      itemCount: Array.isArray(parsedData) ? parsedData.length : Object.keys(parsedData || {}).length
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 2. COURSE HUB DATA ENDPOINTS (courses.json)
// =============================================================

router.get('/api/data/courses', (req, res) => {
  const courses = readDataFile('courses.json') || [];
  return res.json({ success: true, data: courses });
});

router.post('/api/data/courses', async (req, res) => {
  try {
    const course = req.body;
    if (!course || !course.title) {
      return res.status(400).json({ success: false, error: 'Course title is required' });
    }

    const courses = readDataFile('courses.json') || [];
    const courseId = course.id || 'course-' + Date.now();
    const isAppr = (course.isApproved === true || course.isApproved === 1 || course.isApproved === '1');
    const courseStatus = isAppr ? 'Approved' : (course.status || 'Pending');

    const updatedCourse = {
      ...course,
      id: courseId,
      isApproved: isAppr,
      status: courseStatus,
      updatedAt: new Date().toISOString()
    };

    const idx = courses.findIndex(c => c.id === courseId);
    if (idx >= 0) {
      courses[idx] = { ...courses[idx], ...updatedCourse };
    } else {
      courses.unshift(updatedCourse);
    }

    writeDataFile('courses.json', courses);

    // Sync to SQLite courses table
    try {
      const db = getDb();
      if (db) {
        await db.run(
          `INSERT INTO courses 
           (id, title, instructor, duration, price, discountedPrice, academicGroup, badge, image, description, isApproved, status, teacherEmail)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title=excluded.title,
             instructor=excluded.instructor,
             duration=excluded.duration,
             price=excluded.price,
             discountedPrice=excluded.discountedPrice,
             academicGroup=excluded.academicGroup,
             badge=excluded.badge,
             image=excluded.image,
             description=excluded.description,
             isApproved=excluded.isApproved,
             status=excluded.status,
             teacherEmail=coalesce(excluded.teacherEmail, courses.teacherEmail)`,
          [
            courseId,
            updatedCourse.title,
            updatedCourse.instructor || 'EduFast Instructor',
            updatedCourse.duration || '40 Hours',
            Number(updatedCourse.price) || 0,
            Number(updatedCourse.discountedPrice) || 0,
            updatedCourse.group || updatedCourse.academicGroup || 'Science',
            updatedCourse.badge || 'Masterclass',
            updatedCourse.image || '📚',
            updatedCourse.description || '',
            isAppr ? 1 : 0,
            courseStatus,
            updatedCourse.teacherEmail || null
          ]
        );
      }
    } catch (dbErr) {
      console.warn('[dataRoutes] Course SQLite sync notice:', dbErr.message);
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('course:update', updatedCourse);
        if (idx < 0) {
          io.emit('course:new', updatedCourse);
          if (!isAppr) {
            io.emit('admin:course_pending', {
              course: updatedCourse,
              message: `শিক্ষক ${updatedCourse.instructor || 'EduFast'} একটি নতুন কোর্স অনুমোদনের জন্য জমা দিয়েছেন: "${updatedCourse.title}"`
            });
            io.emit('notification', {
              title: `⏳ নতুন কোর্স অনুমোদনের অপেক্ষায়`,
              message: `শিক্ষক ${updatedCourse.instructor || ''} "${updatedCourse.title}" কোর্সটি অনুমোদনের জন্য জমা দিয়েছেন। পর্যালোচনা করুন।`,
              type: 'admin_approval',
              category: 'course',
              targetRole: 'admin',
              link: 'courses'
            });
          } else {
            io.emit('notification', {
              title: `🎓 নতুন কোর্স: "${updatedCourse.title}"`,
              message: `শিক্ষক ${updatedCourse.instructor || 'EduFast'} নতুন কোর্স শুরু করেছেন। এখনই বিস্তারিত দেখে এনরোল করুন!`,
              type: 'course',
              category: 'course',
              link: 'courses'
            });
          }
        }
      }
    } catch (e) {}

    return res.json({ success: true, data: updatedCourse, courses });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/courses/:id', async (req, res) => {
  try {
    const courses = readDataFile('courses.json') || [];
    const filtered = courses.filter(c => String(c.id) !== String(req.params.id));
    writeDataFile('courses.json', filtered);

    // Sync delete in SQLite
    try {
      const db = getDb();
      if (db) {
        await db.run('DELETE FROM courses WHERE id = ?', [req.params.id]);
        await db.run('DELETE FROM course_curriculum WHERE courseId = ?', [req.params.id]);
        await db.run('DELETE FROM enrollments WHERE courseId = ?', [req.params.id]);
        await db.run('DELETE FROM lesson_progress WHERE courseId = ?', [req.params.id]);
      }
    } catch (dbErr) {
      console.warn('[dataRoutes] Delete SQLite notice:', dbErr.message);
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('course:deleted', { id: req.params.id });
      }
    } catch (e) {}

    return res.json({ success: true, message: 'Course deleted successfully', courses: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 3. ADMISSIONS DATA ENDPOINTS (admissions.json)
// =============================================================

router.get('/api/data/admissions', (req, res) => {
  const admissions = readDataFile('admissions.json') || [];
  return res.json({ success: true, data: admissions });
});

router.post('/api/data/admissions', (req, res) => {
  try {
    const univ = req.body;
    if (!univ || !univ.name) {
      return res.status(400).json({ success: false, error: 'University name is required' });
    }

    const admissions = readDataFile('admissions.json') || [];
    const univId = univ.id || 'univ-' + Date.now();
    const updatedUniv = {
      ...univ,
      id: univId,
      updatedAt: new Date().toISOString()
    };

    const idx = admissions.findIndex(u => u.id === univId);
    if (idx >= 0) {
      admissions[idx] = { ...admissions[idx], ...updatedUniv };
    } else {
      admissions.unshift(updatedUniv);
    }

    writeDataFile('admissions.json', admissions);
    return res.json({ success: true, data: updatedUniv, admissions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/admissions/:id', (req, res) => {
  try {
    const admissions = readDataFile('admissions.json') || [];
    const filtered = admissions.filter(u => String(u.id) !== String(req.params.id));
    writeDataFile('admissions.json', filtered);
    return res.json({ success: true, message: 'Admission deleted successfully', admissions: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 4. QUESTION BANK & QUESTIONS ENDPOINTS (questions.json & questionBank.json)
// =============================================================

router.get('/api/data/questions', (req, res) => {
  const questions = readDataFile('questions.json') || [];
  return res.json({ success: true, data: questions });
});

router.post('/api/data/questions', async (req, res) => {
  try {
    const q = req.body;
    if (!q || !q.question) {
      return res.status(400).json({ success: false, error: 'Question text is required' });
    }

    const questions = readDataFile('questions.json') || [];
    const qId = q.id || 'q-' + Date.now();
    const updatedQ = {
      ...q,
      id: qId,
      createdAt: q.createdAt || new Date().toISOString()
    };

    const idx = questions.findIndex(item => String(item.id) === String(qId));
    if (idx >= 0) {
      questions[idx] = { ...questions[idx], ...updatedQ };
    } else {
      questions.unshift(updatedQ);
    }

    writeDataFile('questions.json', questions);

    // Sync with SQLite question_bank table if accessible
    try {
      const db = getDb();
      if (db) {
        const existing = await db.get('SELECT id FROM question_bank WHERE id = ?', [qId]);
        if (existing) {
          await db.run(
            `UPDATE question_bank SET subject = ?, chapter = ?, difficulty = ?, question = ?, 
             optionA = ?, optionB = ?, optionC = ?, optionD = ?, correctAnswer = ?, explanation = ? WHERE id = ?`,
            [q.subject || 'General', q.chapter || '', q.difficulty || 'medium', q.question,
             q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || '', q.correctAnswer || 'A', q.explanation || '', qId]
          );
        } else {
          await db.run(
            `INSERT INTO question_bank (id, subject, chapter, difficulty, question, optionA, optionB, optionC, optionD, correctAnswer, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [qId, q.subject || 'General', q.chapter || '', q.difficulty || 'medium', q.question,
             q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || '', q.correctAnswer || 'A', q.explanation || '']
          );
        }
      }
    } catch (dbErr) {
      console.warn('SQLite question sync warning (file saved successfully):', dbErr.message);
    }

    return res.json({ success: true, data: updatedQ, questions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/questions/:id', async (req, res) => {
  try {
    const qId = req.params.id;
    const questions = readDataFile('questions.json') || [];
    const filtered = questions.filter(item => String(item.id) !== String(qId));
    writeDataFile('questions.json', filtered);

    try {
      const db = getDb();
      if (db) {
        await db.run('DELETE FROM question_bank WHERE id = ?', [qId]);
      }
    } catch (e) {}

    return res.json({ success: true, message: 'Question deleted successfully', questions: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Question Bank Papers (archives)
router.get('/api/data/question-bank', (req, res) => {
  const papers = readDataFile('questionBank.json') || [];
  return res.json({ success: true, data: papers });
});

router.post('/api/data/question-bank', (req, res) => {
  try {
    const paper = req.body;
    if (!paper || !paper.examName) {
      return res.status(400).json({ success: false, error: 'Exam name is required' });
    }

    const papers = readDataFile('questionBank.json') || [];
    const paperId = paper.id || 'paper-' + Date.now();
    const updatedPaper = {
      ...paper,
      id: paperId,
      updatedAt: new Date().toISOString()
    };

    const idx = papers.findIndex(p => p.id === paperId);
    if (idx >= 0) {
      papers[idx] = { ...papers[idx], ...updatedPaper };
    } else {
      papers.unshift(updatedPaper);
    }

    writeDataFile('questionBank.json', papers);
    return res.json({ success: true, data: updatedPaper, papers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/question-bank/:id', (req, res) => {
  try {
    const papers = readDataFile('questionBank.json') || [];
    const filtered = papers.filter(p => String(p.id) !== String(req.params.id));
    writeDataFile('questionBank.json', filtered);
    return res.json({ success: true, message: 'Question paper deleted successfully', papers: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 5. MOCK TESTS DATA ENDPOINTS (mockTests.json)
// =============================================================

router.get('/api/data/mock-tests', (req, res) => {
  const tests = readDataFile('mockTests.json') || [];
  return res.json({ success: true, data: tests });
});

router.post('/api/data/mock-tests', (req, res) => {
  try {
    const test = req.body;
    if (!test || !test.title) {
      return res.status(400).json({ success: false, error: 'Mock test title is required' });
    }

    const tests = readDataFile('mockTests.json') || [];
    const testId = test.id || 'test-' + Date.now();
    const updatedTest = {
      ...test,
      id: testId,
      createdAt: test.createdAt || new Date().toISOString()
    };

    const idx = tests.findIndex(t => t.id === testId);
    if (idx >= 0) {
      tests[idx] = { ...tests[idx], ...updatedTest };
    } else {
      tests.unshift(updatedTest);
    }

    writeDataFile('mockTests.json', tests);
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('mock_tests:update', { action: 'save', test: updatedTest, tests });
        if (idx < 0) {
          io.emit('mock_test:new', updatedTest);
          io.emit('notification', {
            title: `🎯 নতুন মক টেস্ট: "${updatedTest.title}"`,
            message: `নতুন ${updatedTest.subject || 'এডমিশন'} মডেল টেস্ট শুরু হয়েছে (${updatedTest.totalQuestions || 25}টি প্রশ্ন)। এখনই পরীক্ষায় অংশ নিন!`,
            type: 'mock_test',
            category: 'mock_test',
            link: 'mocktest'
          });
        }
      }
    } catch (e) {}
    return res.json({ success: true, data: updatedTest, tests });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/mock-tests/:id', (req, res) => {
  try {
    const tests = readDataFile('mockTests.json') || [];
    const filtered = tests.filter(t => String(t.id) !== String(req.params.id));
    writeDataFile('mockTests.json', filtered);
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('mock_tests:update', { action: 'delete', id: req.params.id, tests: filtered });
      }
    } catch (e) {}
    return res.json({ success: true, message: 'Mock test deleted successfully', tests: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 6. LIVE CLASSES DATA ENDPOINTS (liveClasses.json)
// =============================================================

router.get('/api/data/live-classes', (req, res) => {
  const classes = readDataFile('liveClasses.json') || [];
  return res.json({ success: true, data: classes });
});

router.post('/api/data/live-classes', (req, res) => {
  try {
    const session = req.body;
    if (!session || !session.title) {
      return res.status(400).json({ success: false, error: 'Class title is required' });
    }

    if (session.status === 'Upcoming' && session.scheduledAt) {
      const scheduleTime = new Date(session.scheduledAt).getTime();
      if (!isNaN(scheduleTime) && scheduleTime < Date.now() - 60000) {
        return res.status(400).json({ success: false, error: 'অতীতের কোনো তারিখ বা সময় শিডিউল করা যাবে না।' });
      }
    }

    const classes = readDataFile('liveClasses.json') || [];
    const sessionId = session.id || 'live-' + Date.now();
    const updatedSession = {
      ...session,
      id: sessionId,
      createdAt: session.createdAt || new Date().toISOString()
    };

    const idx = classes.findIndex(c => c.id === sessionId);
    if (idx >= 0) {
      classes[idx] = { ...classes[idx], ...updatedSession };
    } else {
      classes.unshift(updatedSession);
    }

    writeDataFile('liveClasses.json', classes);
    return res.json({ success: true, data: updatedSession, classes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/live-classes/:id', (req, res) => {
  try {
    const classes = readDataFile('liveClasses.json') || [];
    const filtered = classes.filter(c => String(c.id) !== String(req.params.id));
    writeDataFile('liveClasses.json', filtered);
    return res.json({ success: true, message: 'Live class deleted successfully', classes: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// 7. RECORDINGS DATA ENDPOINTS (recordings.json)
// =============================================================

router.get('/api/data/recordings', (req, res) => {
  const recordings = readDataFile('recordings.json') || [];
  return res.json({ success: true, data: recordings });
});

router.post('/api/data/recordings', (req, res) => {
  try {
    const rec = req.body;
    if (!rec || !rec.title) {
      return res.status(400).json({ success: false, error: 'Recording title is required' });
    }

    const recordings = readDataFile('recordings.json') || [];
    const recId = rec.id || 'rec-' + Date.now();
    const updatedRec = {
      ...rec,
      id: recId,
      createdAt: rec.createdAt || new Date().toISOString()
    };

    const idx = recordings.findIndex(r => r.id === recId);
    if (idx >= 0) {
      recordings[idx] = { ...recordings[idx], ...updatedRec };
    } else {
      recordings.unshift(updatedRec);
    }

    writeDataFile('recordings.json', recordings);

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('recording:new', updatedRec);
        io.emit('recording:update', updatedRec);
      }
    } catch (e) {}

    return res.json({ success: true, data: updatedRec, recordings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/data/recordings/:id', (req, res) => {
  try {
    const recordings = readDataFile('recordings.json') || [];
    const filtered = recordings.filter(r => String(r.id) !== String(req.params.id));
    writeDataFile('recordings.json', filtered);
    return res.json({ success: true, message: 'Recording deleted successfully', recordings: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
