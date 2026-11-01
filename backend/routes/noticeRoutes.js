const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

/**
 * Ensures the notices table exists and has initial data seeded if empty
 */
async function ensureNoticesTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'General',
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// -------------------------------------------------------------
// 1. GET /api/notices - List all active broadcast notices
// -------------------------------------------------------------
router.get('/api/notices', async (req, res) => {
  try {
    const db = getDb();
    await ensureNoticesTable(db);

    const notices = await db.all(
      'SELECT id, title, priority, content, date, createdAt FROM notices WHERE isActive = 1 ORDER BY id DESC'
    );

    return res.json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (err) {
    console.error('Error fetching notices:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch broadcast notices: ' + err.message
    });
  }
});

// -------------------------------------------------------------
// 2. POST /api/notices - Publish a new broadcast notice
// -------------------------------------------------------------
router.post('/api/notices', async (req, res) => {
  const { title, priority, content, date } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Notice title and content/description are required.'
    });
  }

  try {
    const db = getDb();
    await ensureNoticesTable(db);

    const noticeDate = date || new Date().toISOString().slice(0, 10);
    const noticePriority = priority || 'General';

    const result = await db.run(
      'INSERT INTO notices (title, priority, content, date, isActive) VALUES (?, ?, ?, ?, 1)',
      [String(title).trim(), noticePriority, String(content).trim(), noticeDate]
    );

    const newNotice = await db.get('SELECT * FROM notices WHERE id = ?', [result.lastID]);

    // Real-time broadcast via Socket.io if available
    try {
      const { io } = require('../server');
      if (io) {
        io.emit('notice:broadcast', newNotice);
        io.emit('notice:updated', { action: 'publish', notice: newNotice });
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Notice published successfully!',
      data: newNotice
    });
  } catch (err) {
    console.error('Error publishing notice:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to publish notice: ' + err.message
    });
  }
});

// -------------------------------------------------------------
// 3. DELETE /api/notices/:id - Delete / remove a notice
// -------------------------------------------------------------
router.delete('/api/notices/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDb();
    await ensureNoticesTable(db);

    await db.run('DELETE FROM notices WHERE id = ?', [id]);

    // Real-time broadcast deletion via Socket.io
    try {
      const { io } = require('../server');
      if (io) {
        io.emit('notice:deleted', { id: Number(id) });
        io.emit('notice:updated', { action: 'delete', id: Number(id) });
      }
    } catch (e) {
      console.warn('Socket deletion notice warning:', e.message);
    }

    return res.json({
      success: true,
      message: 'Notice deleted successfully!',
      id: Number(id)
    });
  } catch (err) {
    console.error('Error deleting notice:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete notice: ' + err.message
    });
  }
});

module.exports = router;

