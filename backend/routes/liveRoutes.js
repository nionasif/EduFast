const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * 1. GET /api/live/classes - List all upcoming, live, and recorded classes from SQLite
 */
router.get('/api/live/classes', async (req, res) => {
  try {
    const db = getDb();
    const { status, group } = req.query;

    let query = 'SELECT * FROM live_classes WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (group && group !== 'All') {
      query += ' AND LOWER(academicGroup) = LOWER(?)';
      params.push(group);
    }

    query += ' ORDER BY createdAt DESC';
    const rows = await db.all(query, params);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching live classes:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve live classes.' });
  }
});

/**
 * 2. POST /api/live/classes - Schedule or start a live class (Teacher/Admin)
 */
router.post('/api/live/classes', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      id,
      title,
      instructor,
      instructorTitle,
      group,
      academicGroup,
      duration,
      status = 'Upcoming',
      streamUrl,
      overview,
      scheduledAt
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Class title is required.' });
    }

    const classId = id || 'live-' + Date.now();
    const actualGroup = academicGroup || group || 'Science';
    const instructorName = instructor || req.user?.name || 'Lead Instructor';

    await db.run(
      `INSERT OR REPLACE INTO live_classes 
       (id, title, instructor, instructorTitle, academicGroup, duration, status, streamUrl, overview, scheduledAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId,
        title,
        instructorName,
        instructorTitle || 'Senior Instructor',
        actualGroup,
        duration || '60 Minutes',
        status,
        streamUrl || '',
        overview || '',
        scheduledAt || new Date().toISOString()
      ]
    );

    const inserted = await db.get('SELECT * FROM live_classes WHERE id = ?', [classId]);

    // Broadcast via Socket.IO if live or status change
    const io = req.app.get('io');
    if (io) {
      io.emit('class:status_change', inserted);
      io.emit('live_class:created', inserted);
    }

    return res.status(201).json({
      success: true,
      message: 'Live class scheduled successfully.',
      data: inserted
    });
  } catch (err) {
    console.error('Error saving live class:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to save live class: ' + err.message });
  }
});

/**
 * 3. PUT /api/live/classes/:id - Update status / recording
 */
router.put('/api/live/classes/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, recordingUrl, streamUrl } = req.body;

    const existing = await db.get('SELECT * FROM live_classes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Live class not found.' });
    }

    await db.run(
      `UPDATE live_classes SET
        status = COALESCE(?, status),
        recordingUrl = COALESCE(?, recordingUrl),
        streamUrl = COALESCE(?, streamUrl),
        endedAt = CASE WHEN ? = 'ENDED' THEN CURRENT_TIMESTAMP ELSE endedAt END
       WHERE id = ?`,
      [status || null, recordingUrl || null, streamUrl || null, status || '', id]
    );

    const updated = await db.get('SELECT * FROM live_classes WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('class:status_change', updated);
    }

    return res.json({ success: true, message: 'Class status updated.', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update live class.' });
  }
});

/**
 * 4. GET /api/live/lounge/:roomId/messages - Virtual Study Lounge Chat History
 */
router.get('/api/live/lounge/:roomId/messages', async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const rows = await db.all(
      'SELECT * FROM study_lounge_messages WHERE roomId = ? ORDER BY createdAt ASC LIMIT 100',
      [roomId]
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to load lounge messages.' });
  }
});

/**
 * 5. POST /api/live/lounge/:roomId/messages - Send Study Lounge Message
 */
router.post('/api/live/lounge/:roomId/messages', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { roomId } = req.params;
    const { text, senderName, senderAvatar, senderRole } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    const msgId = 'lounge-msg-' + Date.now();
    const name = senderName || req.user?.name || 'Aspirant';
    const role = senderRole || req.user?.role || 'student';
    const avatar = senderAvatar || req.user?.avatar || null;

    await db.run(
      `INSERT INTO study_lounge_messages (id, roomId, senderId, senderName, senderAvatar, senderRole, text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [msgId, roomId, req.user?.id || 'guest', name, avatar, role, text.trim()]
    );

    const inserted = await db.get('SELECT * FROM study_lounge_messages WHERE id = ?', [msgId]);

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('lounge:new_message', inserted);
      io.emit('lounge:global_message', { roomId, message: inserted });
    }

    return res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to save message: ' + err.message });
  }
});

module.exports = router;
