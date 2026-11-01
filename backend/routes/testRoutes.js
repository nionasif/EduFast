const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');

/**
 * 1. GET /api/tests - List all available Mock Tests
 */
router.get('/api/tests', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { subject, group } = req.query;

    let query = 'SELECT id, title, subject, groupName, duration, totalMarks, negativeMarking, badge, examTarget, isCustom, createdBy, createdAt FROM mock_tests WHERE 1=1';
    const params = [];

    if (subject && subject !== 'All') {
      query += ' AND LOWER(subject) LIKE LOWER(?)';
      params.push(`%${subject}%`);
    }

    if (group && group !== 'All') {
      query += ' AND LOWER(groupName) = LOWER(?)';
      params.push(group);
    }

    query += ' ORDER BY createdAt DESC';
    let rows = await db.all(query, params);

    // If empty, return standard admission mock tests
    if (!rows || rows.length === 0) {
      const qCount = await db.get('SELECT COUNT(*) as count FROM question_bank');
      const hasQuestions = qCount && qCount.count > 0;
      
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No mock tests currently scheduled.'
      });
    }

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching mock tests:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve mock tests.' });
  }
});

/**
 * 2. GET /api/tests/:id/start - Fetch test questions for student (without exposing answers)
 */
router.get('/api/tests/:id/start', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const test = await db.get('SELECT * FROM mock_tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Mock test not found.' });
    }

    let rawQuestions = [];
    if (test.questionsJson) {
      try {
        rawQuestions = JSON.parse(test.questionsJson);
      } catch {
        rawQuestions = [];
      }
    }

    // Fallback: If questionsJson is empty, pull 25 questions from question_bank
    if (!rawQuestions || rawQuestions.length === 0) {
      const bankQuestions = await db.all(
        'SELECT * FROM question_bank ORDER BY RANDOM() LIMIT 25'
      );
      rawQuestions = bankQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correct: q.correctAnswer === 'A' ? 0 : q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : 3,
        explanation: q.explanation,
        subject: q.subject
      }));
    }

    // Strip out correct answers and explanations for anti-cheating during active test
    const sanitizedQuestions = rawQuestions.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD],
      subject: q.subject || test.subject
    }));

    return res.json({
      success: true,
      data: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        group: test.groupName,
        duration: Number(test.duration) || 30,
        totalMarks: Number(test.totalMarks) || sanitizedQuestions.length,
        negativeMarking: Number(test.negativeMarking) || -0.25,
        badge: test.badge,
        examTarget: test.examTarget,
        questionsCount: sanitizedQuestions.length,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    console.error('Error starting test:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to start mock test.' });
  }
});

/**
 * 3. POST /api/tests/:id/submit - Grade answers server-side, store attempt & award XP
 */
router.post('/api/tests/:id/submit', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { answers = {}, timeUsed = 0 } = req.body;
    const studentEmail = req.user?.email || req.body.studentEmail || req.body.email;
    const studentId = req.user?.id || req.body.studentId || req.body.userId || studentEmail || 'guest';

    const test = await db.get('SELECT * FROM mock_tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Mock test not found.' });
    }

    let questions = [];
    if (test.questionsJson) {
      try {
        questions = JSON.parse(test.questionsJson);
      } catch {
        questions = [];
      }
    }

    const negativeMarking = Math.abs(Number(test.negativeMarking) || 0.25);
    const marksPerQuestion = 1.0;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const breakdown = questions.map((q, idx) => {
      const qKey = q.id || idx;
      const studentAns = answers[qKey] !== undefined ? answers[qKey] : answers[idx];

      let correctIndex = 0;
      if (typeof q.correct === 'number') {
        correctIndex = q.correct;
      } else if (typeof q.correctAnswer === 'string') {
        const map = { a: 0, b: 1, c: 2, d: 3 };
        correctIndex = map[q.correctAnswer.toLowerCase().trim()] ?? 0;
      }

      const isAnswered = studentAns !== undefined && studentAns !== null && studentAns !== '';
      const isCorrect = isAnswered && Number(studentAns) === Number(correctIndex);

      if (!isAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        question: q.question,
        options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD],
        studentChoice: isAnswered ? Number(studentAns) : null,
        correctChoice: correctIndex,
        isCorrect,
        explanation: q.explanation || 'No explanation provided.'
      };
    });

    const rawScore = (correctCount * marksPerQuestion) - (wrongCount * negativeMarking);
    const score = Math.max(0, Math.round(rawScore * 100) / 100);
    const totalMarks = questions.length * marksPerQuestion;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    // Coins and XP calculation: Coins are strictly exclusive to Today's AI Focus Plan daily tasks/exams.
    const coinsEarned = 0;
    const xpEarned = Math.round(score * 5);

    // Save attempt in mock_test_attempts
    try {
      await db.run(
        `INSERT OR REPLACE INTO mock_test_attempts 
         (userId, userEmail, mockTestId, score, totalMarks, percentage, answersJson, timeUsed, submittedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          String(studentId),
          studentEmail ? String(studentEmail).toLowerCase() : 'student@edufast.com',
          id,
          score,
          totalMarks,
          percentage,
          JSON.stringify(answers),
          Number(timeUsed) || 0
        ]
      );
    } catch (saveErr) {
      console.warn('Attempt save notice:', saveErr.message);
    }

    // Award score in students table (no coins for regular mock tests - coins are strictly for Today's AI Focus Plan)
    if (studentEmail) {
      await db.run(
        `UPDATE students SET
          score = COALESCE(score, 0) + ?
         WHERE LOWER(email) = LOWER(?)`,
        [score, studentEmail]
      );
    }

    return res.json({
      success: true,
      message: 'Test submitted and graded successfully!',
      result: {
        mockTestId: id,
        testTitle: test.title,
        totalQuestions: questions.length,
        correctCount,
        wrongCount,
        unansweredCount,
        score,
        totalMarks,
        percentage,
        timeUsed,
        coinsEarned,
        xpEarned,
        breakdown
      }
    });
  } catch (err) {
    console.error('Error grading test:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to grade test submission.' });
  }
});

/**
 * 4. GET /api/tests/history - Student's past test attempts
 */
router.get('/api/tests/history', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const studentEmail = req.user?.email || req.query.email || req.query.studentEmail;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: 'Student email is required.' });
    }

    const rows = await db.all(
      `SELECT m.*, t.title as testTitle, t.subject, t.duration
       FROM mock_test_attempts m
       LEFT JOIN mock_tests t ON m.mockTestId = t.id
       WHERE LOWER(m.userEmail) = LOWER(?)
       ORDER BY m.submittedAt DESC`,
      [studentEmail.trim()]
    );

    const history = rows.map(r => ({
      id: r.id,
      mockTestId: r.mockTestId,
      title: r.testTitle || 'Admission Model Test',
      subject: r.subject || 'General',
      score: Number(r.score) || 0,
      totalMarks: Number(r.totalMarks) || 100,
      percentage: Number(r.percentage) || 0,
      timeUsed: Number(r.timeUsed) || 0,
      submittedAt: r.submittedAt
    }));

    return res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    console.error('Error fetching test history:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve test history.' });
  }
});

/**
 * 5. GET /api/leaderboard - Global Student Leaderboard rankings
 */
router.get('/api/leaderboard', async (req, res) => {
  try {
    const db = getDb();
    const { metric = 'coins', group = 'all', limit = 50 } = req.query;

    let query = `
      SELECT 
        id, 
        name, 
        email, 
        academicGroup as "group", 
        hscCollege, 
        sscSchool, 
        COALESCE(coins, 100) as coins, 
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
    params.push(parseInt(limit, 10) || 50);

    const rows = await db.all(query, params);

    const leaderboard = rows.map((s, index) => {
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
        name: s.name || 'শিক্ষার্থী',
        email: s.email || '',
        institution: s.hscCollege || s.sscSchool || 'Notre Dame College',
        group: s.group || 'Science',
        score: Number(s.score) || 0,
        coins: Number(s.coins) || 100,
        streak: Number(s.streak) || 0,
        avatar,
        target,
        rank: index + 1
      };
    });

    return res.json({ success: true, count: leaderboard.length, data: leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve leaderboard.' });
  }
});

/**
 * 6. GET /api/student/daily-tasks - Persisted Daily Tasks & Completion Status
 */
router.get('/api/student/daily-tasks', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const studentEmail = req.user?.email || req.query.email || req.query.studentEmail;

    const tasks = await db.all('SELECT * FROM daily_tasks ORDER BY id ASC');

    let completedTaskIds = new Set();
    if (studentEmail) {
      const completions = await db.all(
        'SELECT taskId FROM student_daily_tasks WHERE LOWER(studentEmail) = LOWER(?)',
        [studentEmail.trim()]
      );
      completedTaskIds = new Set(completions.map(c => String(c.taskId)));
    }

    const formatted = tasks.map(t => {
      let options = [];
      try {
        options = JSON.parse(t.optionsJson);
      } catch {
        options = ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'];
      }
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        coins: Number(t.coins) || 10,
        xp: Number(t.xp) || 25,
        date: t.date,
        question: t.question,
        options,
        isCompleted: completedTaskIds.has(String(t.id))
      };
    });

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('Error fetching daily tasks:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve daily tasks.' });
  }
});

/**
 * 7. POST /api/student/daily-tasks/:id/solve - Persist task completion in SQLite
 */
router.post('/api/student/daily-tasks/:id/solve', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { answerIndex } = req.body;
    const studentEmail = req.user?.email || req.body.studentEmail || req.body.email;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: 'Student email is required.' });
    }

    const cleanEmail = studentEmail.trim().toLowerCase();
    const task = await db.get('SELECT * FROM daily_tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Daily task not found.' });
    }

    const isCorrect = Number(answerIndex) === Number(task.correctIndex);
    if (!isCorrect) {
      return res.json({
        success: false,
        isCorrect: false,
        explanation: task.explanation,
        message: 'Incorrect answer. Try reviewing the concept!'
      });
    }

    // Insert into student_daily_tasks
    const coinsAwarded = Number(task.coins) || 10;
    await db.run(
      `INSERT OR IGNORE INTO student_daily_tasks (studentEmail, taskId, coinsAwarded)
       VALUES (?, ?, ?)`,
      [cleanEmail, id, coinsAwarded]
    );

    // Increment coins and score in students table
    await db.run(
      `UPDATE students SET
        coins = COALESCE(coins, 0) + ?,
        score = COALESCE(score, 0) + ?
       WHERE LOWER(email) = ?`,
      [coinsAwarded, Number(task.xp) || 25, cleanEmail]
    );

    const updatedStudent = await db.get('SELECT coins, score FROM students WHERE LOWER(email) = ?', [cleanEmail]);

    return res.json({
      success: true,
      isCorrect: true,
      coinsEarned: coinsAwarded,
      totalCoins: updatedStudent ? updatedStudent.coins : coinsAwarded,
      explanation: task.explanation,
      message: `Brilliant! You earned +${coinsAwarded} coins.`
    });
  } catch (err) {
    console.error('Error solving daily task:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to record daily task completion.' });
  }
});

module.exports = router;
