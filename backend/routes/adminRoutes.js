const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { generateToken, verifyToken, requireRole } = require('../middleware/authMiddleware');
const { readDataFile, writeDataFile } = require('../services/dataStorageService');

// In-memory / configurable admin credentials
let adminCredentials = {
  username: 'admin',
  email: 'admin@edufast.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  name: 'EduFast Administrator',
  role: 'Super Admin'
};

// Admin Login Route
router.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required.'
    });
  }

  const cleanUser = username.trim().toLowerCase();
  const isValidUser = (cleanUser === adminCredentials.username.toLowerCase() || cleanUser === adminCredentials.email.toLowerCase());
  const isValidPass = (password === adminCredentials.password);

  if (isValidUser && isValidPass) {
    const adminObj = {
      id: 1,
      username: adminCredentials.username,
      email: adminCredentials.email,
      name: adminCredentials.name,
      role: 'admin'
    };
    const token = generateToken(adminObj);
    return res.json({
      success: true,
      message: 'Admin authentication successful',
      token,
      admin: adminObj,
      user: adminObj
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid admin credentials. Please verify your username and password.'
  });
});

// Admin Stats & Analytics Route
router.get('/api/admin/stats', async (req, res) => {
  try {
    const db = getDb();
    const totalRow = await db.get('SELECT COUNT(*) as total FROM students');
    const totalStudents = totalRow ? totalRow.total : 0;

    const groupRows = await db.all('SELECT academicGroup, COUNT(*) as count FROM students GROUP BY academicGroup');
    const boardRows = await db.all('SELECT hscBoard, COUNT(*) as count FROM students GROUP BY hscBoard');
    const avgGpaRow = await db.get('SELECT AVG(sscGpa) as avgSsc, AVG(hscGpa) as avgHsc FROM students');
    const recentStudents = await db.all('SELECT * FROM students ORDER BY createdAt DESC LIMIT 5');

    return res.json({
      success: true,
      data: {
        totalStudents,
        groups: groupRows,
        boards: boardRows,
        averageSscGpa: avgGpaRow?.avgSsc ? Number(avgGpaRow.avgSsc.toFixed(2)) : 0,
        averageHscGpa: avgGpaRow?.avgHsc ? Number(avgGpaRow.avgHsc.toFixed(2)) : 0,
        recentStudents
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin stats.' });
  }
});

// Admin Students Listing with Search & Filters
router.get('/api/admin/students', async (req, res) => {
  try {
    const db = getDb();
    const { search, group, board } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ? OR sscRoll LIKE ? OR hscRoll LIKE ? OR sscReg LIKE ? OR hscReg LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term);
    }

    if (group && group !== 'All') {
      query += ' AND academicGroup = ?';
      params.push(group);
    }

    if (board && board !== 'All') {
      query += ' AND (hscBoard LIKE ? OR sscBoard LIKE ?)';
      params.push(`%${board}%`, `%${board}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const rows = await db.all(query, params);
    return res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching admin students list:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch students list.' });
  }
});

// Admin Add Student Manually
router.post('/api/admin/students', async (req, res) => {
  const { name, fathersName, mothersName, dob, mobile, email, academicGroup, sscRoll, sscReg, sscBoard, sscGpa, sscSchool, hscRoll, hscReg, hscBoard, hscGpa, hscCollege } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ success: false, error: 'Name and mobile number are required.' });
  }

  try {
    const db = getDb();
    const query = `
      INSERT INTO students (
        name, fathersName, mothersName, dob, mobile, email, academicGroup,
        sscRoll, sscReg, sscBoard, sscGpa, sscSchool,
        hscRoll, hscReg, hscBoard, hscGpa, hscCollege
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const result = await db.run(query, [
      name, fathersName || '', mothersName || '', dob || '', mobile, email || '', academicGroup || 'Science',
      sscRoll || '', sscReg || '', sscBoard || 'Dhaka', Number(sscGpa) || 5.0, sscSchool || '',
      hscRoll || '', hscReg || '', hscBoard || 'Dhaka', Number(hscGpa) || 5.0, hscCollege || ''
    ]);

    const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    return res.json({ success: true, message: 'Student created successfully.', data: newStudent });
  } catch (err) {
    console.error('Error creating student:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Update Student
router.put('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, fathersName, mothersName, dob, mobile, email, academicGroup, sscRoll, sscReg, sscBoard, sscGpa, sscSchool, hscRoll, hscReg, hscBoard, hscGpa, hscCollege } = req.body;

  try {
    const db = getDb();
    const query = `
      UPDATE students SET
        name = ?, fathersName = ?, mothersName = ?, dob = ?, mobile = ?, email = ?, academicGroup = ?,
        sscRoll = ?, sscReg = ?, sscBoard = ?, sscGpa = ?, sscSchool = ?,
        hscRoll = ?, hscReg = ?, hscBoard = ?, hscGpa = ?, hscCollege = ?
      WHERE id = ?
    `;
    await db.run(query, [
      name, fathersName || '', mothersName || '', dob || '', mobile, email || '', academicGroup || 'Science',
      sscRoll || '', sscReg || '', sscBoard || '', Number(sscGpa) || 0, sscSchool || '',
      hscRoll || '', hscReg || '', hscBoard || '', Number(hscGpa) || 0, hscCollege || '',
      id
    ]);

    const updated = await db.get('SELECT * FROM students WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Student updated successfully.', data: updated });
  } catch (err) {
    console.error('Error updating student:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Student
router.delete('/api/admin/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.run('DELETE FROM students WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Student record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting student:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete student.' });
  }
});

// Admin Change Password Route
router.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current and new password required.' });
  }

  if (currentPassword !== adminCredentials.password) {
    return res.status(401).json({ success: false, error: 'Current password does not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
  }

  adminCredentials.password = newPassword;
  return res.json({ success: true, message: 'Admin password updated successfully!' });
});

// ==========================================
// ADMIN COURSES CRUD
// ==========================================
router.get('/api/admin/courses', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT * FROM courses ORDER BY createdAt DESC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/admin/courses', async (req, res) => {
  try {
    const db = getDb();
    const { id, title, instructor, rating, reviewsCount, duration, price, discountedPrice, group, badge, image, description } = req.body;
    const courseId = id || 'course-' + Date.now();
    await db.run(
      `INSERT INTO courses (id, title, instructor, rating, reviewsCount, duration, price, discountedPrice, academicGroup, badge, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, instructor, rating || 4.9, reviewsCount || 100, duration, price, discountedPrice, group, badge, image || '📚', description]
    );
    const newCourse = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('course:new', newCourse);
        io.emit('notification', {
          title: `🎓 নতুন কোর্স: "${newCourse.title}"`,
          message: `শিক্ষক ${newCourse.instructor || 'EduFast'} নতুন কোর্স যুক্ত করেছেন। বিস্তারিত দেখে এখনই এনরোল করুন!`,
          type: 'course',
          category: 'course',
          link: 'courses'
        });
      }
    } catch (e) {}

    return res.json({ success: true, data: newCourse });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/admin/courses/:id', async (req, res) => {
  try {
    const db = getDb();
    const { title, instructor, duration, price, discountedPrice, group, badge, image, description } = req.body;
    await db.run(
      `UPDATE courses SET title = ?, instructor = ?, duration = ?, price = ?, discountedPrice = ?, academicGroup = ?, badge = ?, image = ?, description = ?
       WHERE id = ?`,
      [title, instructor, duration, price, discountedPrice, group, badge, image, description, req.params.id]
    );
    const updated = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/admin/courses/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM courses WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM course_curriculum WHERE courseId = ?', [req.params.id]);
    await db.run('DELETE FROM enrollments WHERE courseId = ?', [req.params.id]);
    await db.run('DELETE FROM lesson_progress WHERE courseId = ?', [req.params.id]);

    // Sync deletion to courses.json
    try {
      const courses = readDataFile('courses.json') || [];
      const filtered = courses.filter(c => String(c.id) !== String(req.params.id));
      writeDataFile('courses.json', filtered);
    } catch (fErr) {
      console.warn('File delete sync warning:', fErr.message);
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('course:deleted', { id: req.params.id });
      }
    } catch (e) {}

    return res.json({ success: true, message: 'Course and curriculum deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Toggle Course Approval / Publish Permission
router.put('/api/admin/courses/:id/approval', async (req, res) => {
  try {
    const db = getDb();
    const { isApproved } = req.body;
    const approvalVal = (isApproved === true || isApproved === 1 || isApproved === '1') ? 1 : 0;
    const statusVal = approvalVal === 1 ? 'Approved' : 'Pending';

    await db.run(
      'UPDATE courses SET isApproved = ?, status = ? WHERE id = ?',
      [approvalVal, statusVal, req.params.id]
    );

    const updated = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);

    // Sync approval change to courses.json
    try {
      const courses = readDataFile('courses.json') || [];
      const idx = courses.findIndex(c => String(c.id) === String(req.params.id));
      if (idx >= 0) {
        courses[idx] = {
          ...courses[idx],
          isApproved: approvalVal === 1,
          status: statusVal,
          approvedAt: approvalVal === 1 ? new Date().toISOString() : null
        };
        writeDataFile('courses.json', courses);
      }
    } catch (fErr) {
      console.warn('Approval file sync warning:', fErr.message);
    }

    // Broadcast Real-time socket events to Teacher, Admin, and Student portals
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          courseId: req.params.id,
          isApproved: approvalVal === 1,
          status: statusVal,
          course: updated
        };
        io.emit('course:status_updated', payload);
        io.emit('course:approval_changed', payload);
        io.emit('course:update', { ...(updated || {}), isApproved: approvalVal === 1, status: statusVal });

        if (approvalVal === 1) {
          // Notify teacher specifically
          io.emit('notification', {
            title: '🎉 কোর্স অনুমোদিত হয়েছে!',
            message: `আপনার কোর্স "${updated?.title || 'Course'}" এডমিন কর্তৃক সফলভাবে অনুমোদিত হয়েছে এবং এখন লাইভ!`,
            type: 'course_approved',
            category: 'course',
            targetRole: 'teacher',
            link: 'courses'
          });

          // Notify students that course is now published
          io.emit('notification', {
            title: `🎓 নতুন কোর্স প্রকাশিত: "${updated?.title}"`,
            message: `শিক্ষক ${updated?.instructor || 'EduFast'} এর নতুন কোর্স এখন ওয়েবসাইটে উন্মুক্ত! এখনই এনরোল করুন।`,
            type: 'course',
            category: 'course',
            link: 'courses'
          });
        } else {
          io.emit('notification', {
            title: '⏸️ কোর্স প্রকাশনা স্থগিত',
            message: `কোর্স "${updated?.title || 'Course'}" এর প্রকাশনা স্থগিত বা পর্যালোচনায় ফিরিয়ে নেওয়া হয়েছে।`,
            type: 'course_pending',
            category: 'course',
            targetRole: 'teacher'
          });
        }
      }
    } catch (sErr) {
      console.warn('Socket notification emission warning:', sErr.message);
    }

    return res.json({
      success: true,
      message: approvalVal === 1 ? 'কোর্সটি সফলভাবে ওয়েবসাইটে প্রকাশের জন্য অনুমোদন দেওয়া হয়েছে!' : 'কোর্সটির প্রকাশনা স্থগিত/প্রত্যাহার করা হয়েছে।',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN UNIVERSITIES CRUD
// ==========================================
router.get('/api/admin/universities', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT * FROM universities ORDER BY createdAt DESC');
    const parsed = rows.map(r => ({
      ...r,
      units: r.unitsJson ? JSON.parse(r.unitsJson) : []
    }));
    return res.json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/admin/universities', async (req, res) => {
  try {
    const db = getDb();
    const { id, name, logo, description, deadline, examDate, applicationFee, units } = req.body;
    const univId = id || 'univ-' + Date.now();
    await db.run(
      `INSERT INTO universities (id, name, logo, description, deadline, examDate, applicationFee, unitsJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [univId, name, logo || '🏛️', description, deadline, examDate, applicationFee, JSON.stringify(units || [])]
    );
    const newUniv = await db.get('SELECT * FROM universities WHERE id = ?', [univId]);
    return res.json({ success: true, data: { ...newUniv, units: JSON.parse(newUniv.unitsJson || '[]') } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/admin/universities/:id', async (req, res) => {
  try {
    const db = getDb();
    const { name, logo, description, deadline, examDate, applicationFee, units } = req.body;
    await db.run(
      `UPDATE universities SET name = ?, logo = ?, description = ?, deadline = ?, examDate = ?, applicationFee = ?, unitsJson = ?
       WHERE id = ?`,
      [name, logo, description, deadline, examDate, applicationFee, JSON.stringify(units || []), req.params.id]
    );
    const updated = await db.get('SELECT * FROM universities WHERE id = ?', [req.params.id]);
    return res.json({ success: true, data: { ...updated, units: JSON.parse(updated.unitsJson || '[]') } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/admin/universities/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM universities WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'University deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 🗄️ DATABASE STUDIO / DATA EXPLORER GENERIC API
// =========================================================================

const ALLOWED_TABLES = [
  'users_auth',
  'students',
  'student_profiles',
  'teachers',
  'mentors',
  'courses',
  'course_curriculum',
  'universities',
  'mock_tests',
  'mock_test_attempts',
  'question_bank',
  'live_classes',
  'mentor_doubts',
  'enrollments',
  'daily_tasks',
  'study_lounge_messages',
  'lesson_progress',
  'notices'
];

// 1. List all available tables with row count and schema columns
router.get('/api/admin/db/tables', async (req, res) => {
  try {
    const db = getDb();
    const tables = [];

    for (const tableName of ALLOWED_TABLES) {
      try {
        const countRow = await db.get(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const columns = await db.all(`PRAGMA table_info("${tableName}")`);
        
        let label = tableName;
        let icon = '📁';
        if (tableName === 'users_auth') { label = 'Users & Login Auth'; icon = '🔐'; }
        else if (tableName === 'students') { label = 'Students Master DB'; icon = '🎓'; }
        else if (tableName === 'student_profiles') { label = 'Student Academic Profiles'; icon = '👨‍🎓'; }
        else if (tableName === 'teachers') { label = 'Instructors & Teachers'; icon = '👨‍🏫'; }
        else if (tableName === 'mentors') { label = 'Academic Mentors & TAs'; icon = '🧑‍🏫'; }
        else if (tableName === 'courses') { label = 'Courses Catalog'; icon = '📚'; }
        else if (tableName === 'course_curriculum') { label = 'Course Curriculum & Lessons'; icon = '🎬'; }
        else if (tableName === 'universities') { label = 'Varsity Circulars & Units'; icon = '🏛️'; }
        else if (tableName === 'mock_tests') { label = 'Mock Tests & Exam Catalog'; icon = '📝'; }
        else if (tableName === 'mock_test_attempts') { label = 'Mock Test Submissions'; icon = '📊'; }
        else if (tableName === 'question_bank') { label = 'Question Bank (MCQ)'; icon = '📑'; }
        else if (tableName === 'live_classes') { label = 'Live Virtual Classes'; icon = '🔴'; }
        else if (tableName === 'mentor_doubts') { label = 'Live Doubt Queue'; icon = '💬'; }
        else if (tableName === 'enrollments') { label = 'Course Enrollments'; icon = '🎟️'; }
        else if (tableName === 'daily_tasks') { label = 'Daily Study Tasks'; icon = '📅'; }
        else if (tableName === 'study_lounge_messages') { label = 'Virtual Study Lounge Chat'; icon = '💭'; }
        else if (tableName === 'lesson_progress') { label = 'Student Lesson Progress'; icon = '📈'; }
        else if (tableName === 'notices') { label = 'Broadcast Notices & Circulars'; icon = '📢'; }

        tables.push({
          name: tableName,
          label,
          icon,
          rowCount: countRow ? countRow.count : 0,
          columns: columns.map(c => ({
            name: c.name,
            type: c.type,
            isPk: c.pk === 1,
            notNull: c.notnull === 1,
            defaultValue: c.dflt_value
          }))
        });
      } catch (tableErr) {
        // Table may not exist yet, ignore
      }
    }

    return res.json({ success: true, data: tables });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch records from a table with optional search (supports exact ID search & priority ranking)
router.get('/api/admin/db/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const { search, limit = 100 } = req.query;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ success: false, error: 'Unauthorized or invalid table name.' });
  }

  try {
    const db = getDb();
    const columns = await db.all(`PRAGMA table_info("${tableName}")`);
    
    let query = `SELECT * FROM "${tableName}"`;
    const params = [];
    const cleanSearch = (search || '').trim();

    if (cleanSearch) {
      const searchClauses = [];
      const idCol = columns.find(c => c.name === 'id');
      const isNumeric = /^\d+$/.test(cleanSearch);

      // A. ID Specific matching
      if (idCol) {
        if (isNumeric) {
          searchClauses.push(`"id" = ?`);
          params.push(Number(cleanSearch));
        }
        searchClauses.push(`CAST("id" AS TEXT) LIKE ?`);
        params.push(`%${cleanSearch}%`);
      }

      // B. All other columns matching
      columns.forEach(col => {
        if (col.name !== 'id') {
          searchClauses.push(`CAST("${col.name}" AS TEXT) LIKE ?`);
          params.push(`%${cleanSearch}%`);
        }
      });

      if (searchClauses.length > 0) {
        query += ` WHERE (${searchClauses.join(' OR ')})`;
      }
    }

    // Ordering:
    // If a search query is active and matches an ID, rank that EXACT ID first (front & center!)
    const hasId = columns.some(c => c.name === 'id');
    const hasCreated = columns.some(c => c.name === 'createdAt');

    if (cleanSearch && hasId) {
      query += ` ORDER BY CASE WHEN CAST("id" AS TEXT) = ? THEN 0 WHEN CAST("id" AS TEXT) LIKE ? THEN 1 ELSE 2 END, "id" DESC`;
      params.push(cleanSearch, `%${cleanSearch}%`);
    } else if (hasId) {
      query += ` ORDER BY "id" DESC`;
    } else if (hasCreated) {
      query += ` ORDER BY "createdAt" DESC`;
    }

    query += ` LIMIT ?`;
    params.push(Math.min(parseInt(limit) || 100, 500));

    const rows = await db.all(query, params);
    const totalRow = await db.get(`SELECT COUNT(*) as count FROM "${tableName}"`);

    return res.json({
      success: true,
      data: rows,
      totalCount: totalRow ? totalRow.count : rows.length,
      columns: columns.map(c => ({
        name: c.name,
        type: c.type,
        isPk: c.pk === 1
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Insert a new record into any allowed table
router.post('/api/admin/db/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const payload = req.body;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ success: false, error: 'Unauthorized or invalid table name.' });
  }

  try {
    const db = getDb();
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const validColNames = columns.map(c => c.name);

    const keys = Object.keys(payload).filter(k => validColNames.includes(k) && payload[k] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for insertion.' });
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    const values = keys.map(k => payload[k]);

    const result = await db.run(sql, values);
    return res.json({
      success: true,
      message: 'Record inserted successfully',
      lastID: result.lastID
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update an existing record by Primary Key
router.put('/api/admin/db/table/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;
  const payload = req.body;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ success: false, error: 'Unauthorized or invalid table name.' });
  }

  try {
    const db = getDb();
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const pkCol = columns.find(c => c.pk === 1) || { name: 'id' };
    const validColNames = columns.map(c => c.name).filter(c => c !== pkCol.name);

    const keys = Object.keys(payload).filter(k => validColNames.includes(k) && payload[k] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided to update.' });
    }

    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${tableName} SET ${setClauses} WHERE ${pkCol.name} = ?`;
    const values = [...keys.map(k => payload[k]), id];

    await db.run(sql, values);
    return res.json({ success: true, message: 'Record updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete a record by Primary Key
router.delete('/api/admin/db/table/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ success: false, error: 'Unauthorized or invalid table name.' });
  }

  try {
    const db = getDb();
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const pkCol = columns.find(c => c.pk === 1) || { name: 'id' };

    await db.run(`DELETE FROM ${tableName} WHERE ${pkCol.name} = ?`, [id]);
    return res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Execute custom SQL query (SELECT, INSERT, UPDATE, DELETE)
router.post('/api/admin/db/query', async (req, res) => {
  const { sql, params = [] } = req.body;
  if (!sql || !sql.trim()) {
    return res.status(400).json({ success: false, error: 'SQL query string is required.' });
  }

  const cleanSql = sql.trim();
  const isSelect = cleanSql.toLowerCase().startsWith('select') || cleanSql.toLowerCase().startsWith('pragma');

  try {
    const db = getDb();
    if (isSelect) {
      const rows = await db.all(cleanSql, params);
      return res.json({
        success: true,
        type: 'select',
        rowCount: rows.length,
        data: rows
      });
    } else {
      const result = await db.run(cleanSql, params);
      return res.json({
        success: true,
        type: 'mutation',
        message: 'Query executed successfully.',
        changes: result.changes,
        lastID: result.lastID
      });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
