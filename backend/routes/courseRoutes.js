const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');

/**
 * 1. GET /api/courses - List all approved courses with filters
 */
router.get('/api/courses', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { group, search, limit = 50 } = req.query;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    // Unless admin, show approved courses (or status is null / approved)
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      query += " AND (isApproved = 1 OR status = 'Approved' OR isApproved IS NULL)";
    }

    if (group && group !== 'All') {
      query += ' AND LOWER(academicGroup) = LOWER(?)';
      params.push(group);
    }

    if (search && search.trim()) {
      query += ' AND (title LIKE ? OR instructor LIKE ? OR description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY id ASC LIMIT ?';
    params.push(Number(limit));

    const rows = await db.all(query, params);

    // Also get module counts for each course
    const enriched = await Promise.all(
      rows.map(async (c) => {
        const lessonCountRow = await db.get(
          'SELECT COUNT(*) as count FROM course_curriculum WHERE courseId = ?',
          [c.id]
        );
        return {
          ...c,
          totalLessons: lessonCountRow ? lessonCountRow.count : 0,
          price: Number(c.price) || 0,
          discountedPrice: Number(c.discountedPrice) || 0,
          rating: Number(c.rating) || 4.9,
          reviewsCount: Number(c.reviewsCount) || 120
        };
      })
    );

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Error fetching courses:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve courses.' });
  }
});

/**
 * 2. GET /api/courses/:id - Single Course Details + Curriculum Tree
 */
router.get('/api/courses/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    const curriculumRows = await db.all(
      'SELECT * FROM course_curriculum WHERE courseId = ? ORDER BY orderIndex ASC, id ASC',
      [id]
    );

    // Group lessons by moduleTitle
    const modulesMap = new Map();
    curriculumRows.forEach((row) => {
      const modTitle = row.moduleTitle || 'General Lectures';
      if (!modulesMap.has(modTitle)) {
        modulesMap.set(modTitle, []);
      }
      modulesMap.get(modTitle).push(row);
    });

    const curriculum = Array.from(modulesMap.entries()).map(([moduleTitle, lessons], index) => ({
      moduleIndex: index + 1,
      moduleTitle,
      lessons: lessons.map((l, lIdx) => ({
        id: l.id,
        lessonIndex: lIdx + 1,
        title: l.topicTitle,
        topicTitle: l.topicTitle,
        videoUrl: l.videoUrl,
        videoSourceType: l.videoSourceType || 'local',
        duration: l.duration || '20:00',
        lectureNotesUrl: l.lectureNotesUrl,
        orderIndex: l.orderIndex
      }))
    }));

    // If user is authenticated student, check enrollment and completed lessons
    let isEnrolled = false;
    let completedLessonIds = [];
    let progressPercent = 0;

    const studentEmail = req.user?.email || req.query.studentEmail;
    if (studentEmail) {
      const enrollment = await db.get(
        'SELECT * FROM enrollments WHERE LOWER(studentEmail) = LOWER(?) AND courseId = ?',
        [studentEmail, id]
      );
      if (enrollment) {
        isEnrolled = true;
        progressPercent = enrollment.progressPercent || 0;
      }

      const completedRows = await db.all(
        'SELECT lessonId FROM lesson_progress WHERE LOWER(studentEmail) = LOWER(?) AND courseId = ?',
        [studentEmail, id]
      );
      completedLessonIds = completedRows.map(r => String(r.lessonId));
    }

    return res.json({
      success: true,
      data: {
        ...course,
        price: Number(course.price) || 0,
        discountedPrice: Number(course.discountedPrice) || 0,
        rating: Number(course.rating) || 4.9,
        reviewsCount: Number(course.reviewsCount) || 120,
        totalLessons: curriculumRows.length,
        curriculum,
        isEnrolled,
        progressPercent,
        completedLessonIds
      }
    });
  } catch (err) {
    console.error('Error fetching course details:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve course details.' });
  }
});

/**
 * 2b. GET /api/courses/:id/curriculum - Direct Curriculum Tree
 */
router.get('/api/courses/:id/curriculum', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const curriculumRows = await db.all(
      'SELECT * FROM course_curriculum WHERE courseId = ? ORDER BY orderIndex ASC, id ASC',
      [id]
    );

    const modulesMap = new Map();
    curriculumRows.forEach((row) => {
      const modTitle = row.moduleTitle || 'General Lectures';
      if (!modulesMap.has(modTitle)) {
        modulesMap.set(modTitle, []);
      }
      modulesMap.get(modTitle).push(row);
    });

    const curriculum = Array.from(modulesMap.entries()).map(([moduleTitle, lessons], index) => ({
      moduleIndex: index + 1,
      moduleTitle,
      lessons: lessons.map((l, lIdx) => ({
        id: l.id,
        lessonIndex: lIdx + 1,
        title: l.topicTitle,
        topicTitle: l.topicTitle,
        videoUrl: l.videoUrl,
        videoSourceType: l.videoSourceType || 'local',
        duration: l.duration || '20:00',
        lectureNotesUrl: l.lectureNotesUrl,
        orderIndex: l.orderIndex
      }))
    }));

    return res.json({ success: true, count: curriculumRows.length, data: curriculum });
  } catch (err) {
    console.error('Error fetching course curriculum:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve course curriculum.' });
  }
});


/**
 * 3. POST /api/courses/:id/enroll - Enroll authenticated student into course
 */
router.post('/api/courses/:id/enroll', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const studentEmail = req.user?.email || req.body.studentEmail || req.body.email;
    const studentName = req.user?.name || req.body.studentName || req.body.name || 'Student';

    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        error: 'Student email is required for enrollment. Please log in.'
      });
    }

    const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    // Check if already enrolled
    const existing = await db.get(
      'SELECT * FROM enrollments WHERE LOWER(studentEmail) = LOWER(?) AND courseId = ?',
      [studentEmail.trim(), id]
    );

    if (existing) {
      return res.json({
        success: true,
        alreadyEnrolled: true,
        message: 'You are already enrolled in this course!',
        enrollment: existing
      });
    }

    const result = await db.run(
      `INSERT INTO enrollments (studentEmail, studentName, courseId, courseTitle, progressPercent)
       VALUES (?, ?, ?, ?, 0)`,
      [studentEmail.trim().toLowerCase(), studentName, id, course.title]
    );

    const newEnrollment = await db.get('SELECT * FROM enrollments WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: `Congratulations! Successfully enrolled in ${course.title}.`,
      enrollment: newEnrollment
    });
  } catch (err) {
    console.error('Enrollment error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to complete course enrollment.' });
  }
});

/**
 * 4. GET /api/student/enrolled-courses - List enrolled courses for student
 */
router.get('/api/student/enrolled-courses', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    let studentEmail = req.user?.email || req.query.email || req.query.studentEmail;

    if (!studentEmail) {
      const fallbackStudent = await db.get('SELECT email FROM students ORDER BY id ASC LIMIT 1');
      studentEmail = fallbackStudent?.email || 'student@edufast.com';
    }

    const enrollments = await db.all(
      `SELECT e.*, c.instructor, c.rating, c.duration, c.badge, c.image, c.description, c.academicGroup
       FROM enrollments e
       INNER JOIN courses c ON e.courseId = c.id
       WHERE LOWER(e.studentEmail) = LOWER(?)
       ORDER BY e.enrolledAt DESC`,
      [studentEmail.trim()]
    );

    const enriched = await Promise.all(
      enrollments.map(async (row) => {
        const totalLessonsRow = await db.get(
          'SELECT COUNT(*) as total FROM course_curriculum WHERE courseId = ?',
          [row.courseId]
        );
        const completedCountRow = await db.get(
          'SELECT COUNT(*) as completed FROM lesson_progress WHERE LOWER(studentEmail) = LOWER(?) AND courseId = ?',
          [studentEmail.trim(), row.courseId]
        );

        const total = totalLessonsRow ? totalLessonsRow.total : 0;
        const completed = completedCountRow ? completedCountRow.completed : 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : (row.progressPercent || 0);

        return {
          id: row.courseId,
          courseId: row.courseId,
          title: row.courseTitle,
          instructor: row.instructor || 'EduFast Instructor',
          rating: Number(row.rating) || 4.9,
          duration: row.duration || '40 Hours',
          badge: row.badge || 'Enrolled',
          image: row.image || '📚',
          description: row.description || '',
          academicGroup: row.academicGroup || 'Science',
          progressPercent,
          completedLessons: completed,
          totalLessons: total,
          enrolledAt: row.enrolledAt
        };
      })
    );

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Error fetching enrolled courses:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve enrolled courses.' });
  }
});

/**
 * 5. POST /api/courses/:id/lessons/:lessonId/complete - Complete lesson & award rewards
 */
router.post('/api/courses/:id/lessons/:lessonId/complete', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id: courseId, lessonId } = req.params;
    const studentEmail = req.user?.email || req.body.studentEmail || req.body.email;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: 'Student email is required.' });
    }

    const cleanEmail = studentEmail.trim().toLowerCase();

    // Insert lesson progress
    await db.run(
      `INSERT OR IGNORE INTO lesson_progress (studentEmail, courseId, lessonId)
       VALUES (?, ?, ?)`,
      [cleanEmail, courseId, String(lessonId)]
    );

    // Calculate updated progress
    const totalLessonsRow = await db.get(
      'SELECT COUNT(*) as total FROM course_curriculum WHERE courseId = ?',
      [courseId]
    );
    const completedCountRow = await db.get(
      'SELECT COUNT(*) as completed FROM lesson_progress WHERE LOWER(studentEmail) = ? AND courseId = ?',
      [cleanEmail, courseId]
    );

    const total = totalLessonsRow ? totalLessonsRow.total : 1;
    const completed = completedCountRow ? completedCountRow.completed : 1;
    const progressPercent = Math.min(100, Math.round((completed / total) * 100));

    // Update enrollment progress
    await db.run(
      'UPDATE enrollments SET progressPercent = ? WHERE LOWER(studentEmail) = ? AND courseId = ?',
      [progressPercent, cleanEmail, courseId]
    );

    // Course lesson completion awards XP/score (+50 XP), NOT coins (coins are strictly for Today's AI Focus Plan)
    const coinsAwarded = 0;
    const scoreAwarded = 50;

    await db.run(
      `UPDATE students SET
        score = COALESCE(score, 0) + ?
       WHERE LOWER(email) = ?`,
      [scoreAwarded, cleanEmail]
    );

    const updatedStudent = await db.get('SELECT coins, score FROM students WHERE LOWER(email) = ?', [cleanEmail]);

    return res.json({
      success: true,
      message: 'Lesson completed successfully!',
      progressPercent,
      completedCount: completed,
      totalLessons: total,
      coinsAwarded,
      scoreAwarded,
      totalCoins: updatedStudent ? updatedStudent.coins : coinsAwarded,
      totalScore: updatedStudent ? updatedStudent.score : scoreAwarded
    });
  } catch (err) {
    console.error('Error marking lesson complete:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update lesson completion.' });
  }
});

module.exports = router;
