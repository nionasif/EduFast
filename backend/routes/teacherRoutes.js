const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken, requireRole } = require('../middleware/authMiddleware');
const { readDataFile, writeDataFile } = require('../services/dataStorageService');

/**
 * 1. GET /api/teacher/stats - Teacher Portal Overview Stats
 */
router.get('/api/teacher/stats', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const teacherEmail = req.user?.email || req.query.email;

    const teacher = teacherEmail
      ? await db.get('SELECT * FROM teachers WHERE LOWER(email) = LOWER(?)', [teacherEmail.trim()])
      : await db.get('SELECT * FROM teachers LIMIT 1');

    const teacherName = teacher?.name || 'Instructor';

    const coursesCountRow = await db.get(
      'SELECT COUNT(*) as count FROM courses WHERE instructor LIKE ?',
      [`%${teacherName}%`]
    );

    const enrollmentsCountRow = await db.get(
      `SELECT COUNT(*) as count FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE c.instructor LIKE ?`,
      [`%${teacherName}%`]
    );

    const liveClassesCountRow = await db.get(
      "SELECT COUNT(*) as count FROM live_classes WHERE status = 'Upcoming'"
    );

    return res.json({
      success: true,
      stats: {
        totalStudents: (enrollmentsCountRow?.count || 0) + (teacher?.studentsCount || 120),
        activeCourses: coursesCountRow?.count || teacher?.coursesCount || 3,
        upcomingLiveClasses: liveClassesCountRow?.count || 2,
        rating: Number(teacher?.rating) || 4.9,
        liveHours: Number(teacher?.liveHours) || 45.5
      }
    });
  } catch (err) {
    console.error('Error fetching teacher stats:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve teacher stats.' });
  }
});

/**
 * 2. GET /api/teacher/courses - Courses managed by teacher
 */
router.get('/api/teacher/courses', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const teacherEmail = req.user?.email || req.query.email;

    let courses = [];
    if (teacherEmail) {
      const teacher = await db.get('SELECT name FROM teachers WHERE LOWER(email) = LOWER(?)', [teacherEmail.trim()]);
      if (teacher) {
        courses = await db.all(
          'SELECT * FROM courses WHERE instructor LIKE ? ORDER BY createdAt DESC',
          [`%${teacher.name}%`]
        );
      }
    }

    if (courses.length === 0) {
      courses = await db.all('SELECT * FROM courses ORDER BY createdAt DESC');
    }

    // Attach curriculum modules count
    const enriched = await Promise.all(
      courses.map(async (c) => {
        const countRow = await db.get(
          'SELECT COUNT(*) as total FROM course_curriculum WHERE courseId = ?',
          [c.id]
        );
        return {
          ...c,
          totalLessons: countRow?.total || 0,
          status: c.status || (c.isApproved ? 'Approved' : 'Pending')
        };
      })
    );

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve courses.' });
  }
});

/**
 * 3. POST /api/teacher/courses - Create course & curriculum (submitted for approval)
 */
router.post('/api/teacher/courses', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      id,
      title,
      instructor,
      academicGroup,
      duration,
      price,
      discountedPrice,
      badge,
      image,
      description,
      modules = []
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Course title is required.' });
    }

    const courseId = id || 'course-' + Date.now();
    const instName = instructor || req.user?.name || 'Lead Instructor';

    await db.run(
      `INSERT INTO courses 
       (id, title, instructor, rating, reviewsCount, duration, price, discountedPrice, academicGroup, badge, image, description, isApproved, status, teacherEmail)
       VALUES (?, ?, ?, 5.0, 1, ?, ?, ?, ?, ?, ?, ?, 0, 'Pending', ?)`,
      [
        courseId,
        title,
        instName,
        duration || '40 Hours',
        Number(price) || 3000,
        Number(discountedPrice) || 1500,
        academicGroup || 'Science',
        badge || 'New Course',
        image || '📚',
        description || '',
        req.user?.email || null
      ]
    );

    // Insert curriculum lessons if provided
    if (Array.isArray(modules) && modules.length > 0) {
      let order = 1;
      for (const m of modules) {
        const modTitle = m.moduleTitle || m.title || 'Module';
        const lessons = m.lessons || [];
        for (const l of lessons) {
          await db.run(
            `INSERT INTO course_curriculum 
             (courseId, moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl, orderIndex)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              courseId,
              modTitle,
              l.topicTitle || l.title || 'Lesson',
              l.videoUrl || '',
              l.videoSourceType || 'local',
              l.duration || '20:00',
              l.lectureNotesUrl || '',
              order++
            ]
          );
        }
      }
    }

    const inserted = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);

    // Sync to courses.json
    try {
      const courses = readDataFile('courses.json') || [];
      const jsonCourse = {
        id: courseId,
        title,
        instructor: instName,
        duration: duration || '40 Hours',
        price: Number(price) || 3000,
        discountedPrice: Number(discountedPrice) || 1500,
        group: academicGroup || 'Science',
        academicGroup: academicGroup || 'Science',
        badge: badge || 'New Course',
        image: image || '📚',
        description: description || '',
        modules: modules || [],
        isApproved: false,
        status: 'Pending',
        teacherEmail: req.user?.email || null,
        createdAt: new Date().toISOString()
      };
      const idx = courses.findIndex(c => c.id === courseId);
      if (idx >= 0) courses[idx] = jsonCourse;
      else courses.unshift(jsonCourse);
      writeDataFile('courses.json', courses);
    } catch (fErr) {
      console.warn('courses.json write warning:', fErr.message);
    }

    // Socket alert to Admin & Teacher
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('course:new', { ...inserted, isApproved: false, status: 'Pending', modules });
        io.emit('admin:course_pending', {
          course: inserted,
          message: `শিক্ষক ${instName} একটি নতুন কোর্স অনুমোদনের জন্য জমা দিয়েছেন: "${title}"`
        });
        io.emit('notification', {
          title: '⏳ নতুন কোর্স অনুমোদনের অপেক্ষায়',
          message: `শিক্ষক ${instName} "${title}" কোর্সটি অনুমোদনের জন্য জমা দিয়েছেন। পর্যালোচনা করুন।`,
          type: 'admin_approval',
          category: 'course',
          targetRole: 'admin',
          link: 'courses'
        });
      }
    } catch (sErr) {}

    return res.status(201).json({
      success: true,
      message: 'Course created and submitted for admin review.',
      course: inserted
    });
  } catch (err) {
    console.error('Error creating course:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create course: ' + err.message });
  }
});

/**
 * 4. PUT /api/teacher/courses/:id - Update course & curriculum
 */
router.put('/api/teacher/courses/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      title,
      duration,
      price,
      discountedPrice,
      academicGroup,
      badge,
      image,
      description,
      modules
    } = req.body;

    const existing = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    await db.run(
      `UPDATE courses SET
        title = COALESCE(?, title),
        duration = COALESCE(?, duration),
        price = COALESCE(?, price),
        discountedPrice = COALESCE(?, discountedPrice),
        academicGroup = COALESCE(?, academicGroup),
        badge = COALESCE(?, badge),
        image = COALESCE(?, image),
        description = COALESCE(?, description)
       WHERE id = ?`,
      [
        title || null,
        duration || null,
        price !== undefined ? Number(price) : null,
        discountedPrice !== undefined ? Number(discountedPrice) : null,
        academicGroup || null,
        badge || null,
        image || null,
        description || null,
        id
      ]
    );

    // Update modules if provided
    if (Array.isArray(modules)) {
      await db.run('DELETE FROM course_curriculum WHERE courseId = ?', [id]);
      let order = 1;
      for (const m of modules) {
        const modTitle = m.moduleTitle || m.title || 'Module';
        const lessons = m.lessons || [];
        for (const l of lessons) {
          await db.run(
            `INSERT INTO course_curriculum 
             (courseId, moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl, orderIndex)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              modTitle,
              l.topicTitle || l.title || 'Lesson',
              l.videoUrl || '',
              l.videoSourceType || 'local',
              l.duration || '20:00',
              l.lectureNotesUrl || '',
              order++
            ]
          );
        }
      }
    }

    const updated = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Course updated successfully.', course: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update course: ' + err.message });
  }
});

/**
 * 5. POST /api/teacher/questions - Add questions to Question Bank
 */
router.post('/api/teacher/questions', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      subject,
      chapter,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      yearTag
    } = req.body;

    if (!subject || !question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all mandatory fields: subject, question, all 4 options, and correct answer.'
      });
    }

    const result = await db.run(
      `INSERT INTO question_bank 
       (subject, chapter, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, yearTag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject.trim(),
        chapter ? chapter.trim() : '',
        question.trim(),
        optionA.trim(),
        optionB.trim(),
        optionC.trim(),
        optionD.trim(),
        correctAnswer.trim().toUpperCase(),
        explanation ? explanation.trim() : '',
        difficulty ? difficulty.toLowerCase() : 'medium',
        yearTag ? yearTag.trim() : 'Admission 2026'
      ]
    );

    const inserted = await db.get('SELECT * FROM question_bank WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Question added to question bank successfully.',
      data: inserted
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to add question: ' + err.message });
  }
});

module.exports = router;
