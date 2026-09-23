const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { writeDataFile } = require('../services/dataStorageService');

// Helper to keep DATA/questions.json in sync with DB
async function syncQuestionsFile(db) {
  try {
    const all = await db.all('SELECT * FROM question_bank ORDER BY id DESC');
    writeDataFile('questions.json', all || []);
  } catch (e) {
    console.warn('Failed to sync questions.json:', e.message);
  }
}

// 1. GET /api/questions - List questions with search, subject filter, and pagination
router.get('/api/questions', async (req, res) => {
  try {
    const db = getDb();
    const { search, subject, difficulty, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM question_bank WHERE 1=1';
    const params = [];

    if (subject && subject !== 'All') {
      query += ' AND LOWER(subject) = LOWER(?)';
      params.push(subject);
    }

    if (difficulty && difficulty !== 'All') {
      query += ' AND LOWER(difficulty) = LOWER(?)';
      params.push(difficulty);
    }

    if (search && search.trim()) {
      query += ' AND (question LIKE ? OR chapter LIKE ? OR yearTag LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    // Count total matching
    const countSql = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalRow = await db.get(countSql, params);
    const total = totalRow ? totalRow.total : 0;

    // Order & Pagination
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const rows = await db.all(query, params);

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: rows
    });
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve questions.' });
  }
});

// 2. GET /api/questions/:id - Get single question
router.get('/api/questions/:id', async (req, res) => {
  try {
    const db = getDb();
    const row = await db.get('SELECT * FROM question_bank WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error getting question:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch question.' });
  }
});

// 3. POST /api/questions - Create a new question
router.post('/api/questions', async (req, res) => {
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
        error: 'Missing required fields: subject, question, optionA, optionB, optionC, optionD, and correctAnswer are mandatory.'
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
        correctAnswer.trim(),
        explanation ? explanation.trim() : '',
        difficulty ? difficulty.toLowerCase() : 'medium',
        yearTag ? yearTag.trim() : ''
      ]
    );

    const inserted = await db.get('SELECT * FROM question_bank WHERE id = ?', [result.lastID]);
    await syncQuestionsFile(db);

    return res.status(201).json({
      success: true,
      message: 'Question successfully created in question bank.',
      data: inserted
    });
  } catch (err) {
    console.error('Error creating question:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create question.' });
  }
});

// 4. PUT /api/questions/:id - Update question
router.put('/api/questions/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM question_bank WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Question not found to update.' });
    }

    const {
      subject = existing.subject,
      chapter = existing.chapter,
      question = existing.question,
      optionA = existing.optionA,
      optionB = existing.optionB,
      optionC = existing.optionC,
      optionD = existing.optionD,
      correctAnswer = existing.correctAnswer,
      explanation = existing.explanation,
      difficulty = existing.difficulty,
      yearTag = existing.yearTag
    } = req.body;

    await db.run(
      `UPDATE question_bank SET 
       subject = ?, chapter = ?, question = ?, 
       optionA = ?, optionB = ?, optionC = ?, optionD = ?, 
       correctAnswer = ?, explanation = ?, difficulty = ?, yearTag = ?
       WHERE id = ?`,
      [
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
        yearTag,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM question_bank WHERE id = ?', [id]);
    await syncQuestionsFile(db);

    return res.json({
      success: true,
      message: 'Question successfully updated.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating question:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update question.' });
  }
});

// 5. DELETE /api/questions/:id - Delete question
router.delete('/api/questions/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM question_bank WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }

    await db.run('DELETE FROM question_bank WHERE id = ?', [id]);
    await syncQuestionsFile(db);

    return res.json({
      success: true,
      message: `Question #${id} successfully deleted.`
    });
  } catch (err) {
    console.error('Error deleting question:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete question.' });
  }
});

module.exports = router;
