const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// ROUTE: Get all saved student submissions
router.get('/api/students', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT * FROM students ORDER BY createdAt DESC');
    return res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching students:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve student records.'
    });
  }
});

// ROUTE: Live Student Leaderboard (Top 10 real registered students)
router.get('/api/students/leaderboard', async (req, res) => {
  try {
    const db = getDb();
    const { metric = 'coins', group = 'all', limit = 10 } = req.query;

    let query = `
      SELECT 
        id, 
        name, 
        email, 
        academicGroup as "group", 
        hscCollege, 
        sscSchool, 
        COALESCE(coins, 0) as coins, 
        COALESCE(score, 0.0) as score, 
        COALESCE(streak, 0) as streak, 
        avatar, 
        target, 
        createdAt
      FROM students
    `;

    const params = [];
    if (group && group !== 'all') {
      query += ` WHERE LOWER(academicGroup) = LOWER(?)`;
      params.push(group);
    }

    let orderBy = 'coins DESC, score DESC, streak DESC, id ASC';
    if (metric === 'score') {
      orderBy = 'score DESC, coins DESC, streak DESC, id ASC';
    } else if (metric === 'streak') {
      orderBy = 'streak DESC, coins DESC, score DESC, id ASC';
    }

    query += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(parseInt(limit, 10) || 10);

    const rows = await db.all(query, params);

    // Format output with avatar and target fallbacks
    const formatted = rows.map((s, index) => {
      let avatar = s.avatar;
      if (!avatar) {
        if (s.group === 'Science') avatar = '👨‍🔬';
        else if (s.group === 'Commerce') avatar = '👨‍💼';
        else avatar = '👩‍🎓';
      }

      let target = s.target;
      if (!target) {
        if (s.group === 'Science') target = 'BUET / Medical / DU A-Unit';
        else if (s.group === 'Commerce') target = 'DU C-Unit & IBA';
        else target = 'DU B-Unit (Law)';
      }

      return {
        id: `student-${s.id}`,
        dbId: s.id,
        name: s.name,
        email: s.email,
        group: s.group || 'Science',
        avatar,
        target,
        coins: Number(s.coins) || 0,
        score: Number(s.score) || 0.0,
        streak: Number(s.streak) || 0,
        college: s.hscCollege || s.sscSchool || 'Bangladesh',
        location: 'Bangladesh',
        rank: index + 1
      };
    });

    return res.json({
      success: true,
      data: formatted,
      totalStudents: rows.length
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve live leaderboard.'
    });
  }
});

// ROUTE: Update student stats (coins, score, streak, target)
router.post('/api/students/update-stats', async (req, res) => {
  try {
    const db = getDb();
    const { email, id, coins, score, streak, target, avatar } = req.body;

    if (!email && !id) {
      return res.status(400).json({ success: false, error: 'Email or ID is required.' });
    }

    const student = email 
      ? await db.get('SELECT * FROM students WHERE LOWER(email) = LOWER(?)', [String(email).trim()])
      : await db.get('SELECT * FROM students WHERE id = ?', [id]);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const newCoins = coins !== undefined ? Math.max(0, parseInt(coins, 10)) : (student.coins || 0);
    const newScore = score !== undefined ? parseFloat(score) : (student.score || 0.0);
    const newStreak = streak !== undefined ? Math.max(0, parseInt(streak, 10)) : (student.streak || 0);
    const newTarget = target !== undefined ? target : student.target;
    const newAvatar = avatar !== undefined ? avatar : student.avatar;

    await db.run(`
      UPDATE students 
      SET coins = ?, score = ?, streak = ?, target = ?, avatar = ? 
      WHERE id = ?
    `, [newCoins, newScore, newStreak, newTarget, newAvatar, student.id]);

    return res.json({
      success: true,
      message: 'Student stats updated successfully.',
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        coins: newCoins,
        score: newScore,
        streak: newStreak
      }
    });
  } catch (err) {
    console.error('Error updating student stats:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to update student stats.'
    });
  }
});

// =============================================================
// MOCK TEST ONE-TIME ATTEMPT RESTRICTION ENDPOINTS
// =============================================================

// ROUTE: Get all mock test attempts for a student (userId or email)
router.get('/api/mock-tests/attempts', async (req, res) => {
  try {
    const db = getDb();
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'userId or email is required.' });
    }

    const uId = userId ? String(userId).trim() : '';
    const uEmail = email ? String(email).trim().toLowerCase() : '';

    const rows = await db.all(`
      SELECT * FROM mock_test_attempts 
      WHERE userId = ? OR (userEmail IS NOT NULL AND LOWER(userEmail) = ?)
      ORDER BY submittedAt DESC
    `, [uId || uEmail, uEmail || uId]);

    const formatted = rows.map(r => {
      let answers = {};
      try {
        answers = r.answersJson ? JSON.parse(r.answersJson) : {};
      } catch (e) {
        answers = {};
      }
      return {
        id: r.id,
        userId: r.userId,
        mockTestId: r.mockTestId,
        score: Number(r.score) || 0,
        totalMarks: Number(r.totalMarks) || 0,
        percentage: Number(r.percentage) || 0,
        timeUsed: Number(r.timeUsed) || 0,
        answers,
        submittedAt: r.submittedAt
      };
    });

    return res.json({
      success: true,
      attempts: formatted
    });
  } catch (err) {
    console.error('Error fetching mock test attempts:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve mock test attempts.'
    });
  }
});

// ROUTE: Get single mock test attempt status for a student
router.get('/api/mock-tests/attempt/:testId', async (req, res) => {
  try {
    const db = getDb();
    const { testId } = req.params;
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'userId or email is required.' });
    }

    const uId = userId ? String(userId).trim() : '';
    const uEmail = email ? String(email).trim().toLowerCase() : '';

    const row = await db.get(`
      SELECT * FROM mock_test_attempts 
      WHERE (userId = ? OR (userEmail IS NOT NULL AND LOWER(userEmail) = ?))
        AND mockTestId = ?
    `, [uId || uEmail, uEmail || uId, String(testId)]);

    if (!row) {
      return res.json({
        success: true,
        attempted: false,
        data: null
      });
    }

    let answers = {};
    try {
      answers = row.answersJson ? JSON.parse(row.answersJson) : {};
    } catch (e) {
      answers = {};
    }

    return res.json({
      success: true,
      attempted: true,
      data: {
        id: row.id,
        userId: row.userId,
        mockTestId: row.mockTestId,
        score: Number(row.score) || 0,
        totalMarks: Number(row.totalMarks) || 0,
        percentage: Number(row.percentage) || 0,
        timeUsed: Number(row.timeUsed) || 0,
        answers,
        submittedAt: row.submittedAt
      }
    });
  } catch (err) {
    console.error('Error checking mock test attempt:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to check mock test attempt.'
    });
  }
});

// ROUTE: Record a completed mock test attempt (Enforces One-Time Attempt Rule)
router.post('/api/mock-tests/attempt', async (req, res) => {
  try {
    const db = getDb();
    const {
      userId,
      userEmail,
      mockTestId,
      score = 0,
      totalMarks = 0,
      percentage = 0,
      answers = {},
      timeUsed = 0
    } = req.body;

    if ((!userId && !userEmail) || !mockTestId) {
      return res.status(400).json({
        success: false,
        error: 'userId and mockTestId are required.'
      });
    }

    const cleanUserId = userId ? String(userId).trim() : String(userEmail).trim();
    const cleanUserEmail = userEmail ? String(userEmail).trim().toLowerCase() : null;
    const cleanTestId = String(mockTestId).trim();

    // Check if attempt already exists for this student and test
    const existing = await db.get(`
      SELECT * FROM mock_test_attempts 
      WHERE (userId = ? OR (userEmail IS NOT NULL AND LOWER(userEmail) = ?))
        AND mockTestId = ?
    `, [cleanUserId, cleanUserEmail || cleanUserId, cleanTestId]);

    if (existing) {
      // BLOCK RETAKE
      let existingAnswers = {};
      try {
        existingAnswers = existing.answersJson ? JSON.parse(existing.answersJson) : {};
      } catch (e) {}

      return res.status(409).json({
        success: false,
        error: 'You have already attempted this mock test.',
        code: 'ALREADY_ATTEMPTED',
        attempt: {
          id: existing.id,
          userId: existing.userId,
          mockTestId: existing.mockTestId,
          score: Number(existing.score) || 0,
          totalMarks: Number(existing.totalMarks) || 0,
          percentage: Number(existing.percentage) || 0,
          timeUsed: Number(existing.timeUsed) || 0,
          answers: existingAnswers,
          submittedAt: existing.submittedAt
        }
      });
    }

    // ALLOW FIRST ATTEMPT: Insert new attempt
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers || {});
    const submittedAt = new Date().toISOString();

    const result = await db.run(`
      INSERT INTO mock_test_attempts (
        userId, userEmail, mockTestId, score, totalMarks, percentage, answersJson, timeUsed, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cleanUserId,
      cleanUserEmail,
      cleanTestId,
      Number(score) || 0,
      Number(totalMarks) || 0,
      Number(percentage) || 0,
      answersJson,
      Number(timeUsed) || 0,
      submittedAt
    ]);

    return res.status(201).json({
      success: true,
      message: 'Mock test attempt recorded successfully.',
      data: {
        id: result.lastID,
        userId: cleanUserId,
        mockTestId: cleanTestId,
        score: Number(score) || 0,
        totalMarks: Number(totalMarks) || 0,
        percentage: Number(percentage) || 0,
        timeUsed: Number(timeUsed) || 0,
        answers: typeof answers === 'string' ? JSON.parse(answers) : answers,
        submittedAt
      }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'You have already attempted this mock test.',
        code: 'ALREADY_ATTEMPTED'
      });
    }
    console.error('Error saving mock test attempt:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to record mock test attempt.'
    });
  }
});

module.exports = router;
