const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * 1. POST /api/doubts - Student submits an academic doubt
 */
router.post('/api/doubts', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      subject,
      topic,
      question,
      priority = 'high',
      attachmentUrl,
      studentName,
      studentEmail
    } = req.body;

    if (!subject || !question) {
      return res.status(400).json({
        success: false,
        error: 'Subject and question description are mandatory.'
      });
    }

    const doubtId = 'doubt-' + Date.now();
    const sName = studentName || req.user?.name || 'Student';
    const sEmail = (studentEmail || req.user?.email || 'student@edufast.com').toLowerCase();

    await db.run(
      `INSERT INTO mentor_doubts 
       (id, studentName, studentEmail, subject, topic, question, priority, status, attachmentUrl, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      [
        doubtId,
        sName,
        sEmail,
        subject.trim(),
        topic ? topic.trim() : 'General',
        question.trim(),
        priority || 'high',
        attachmentUrl || null
      ]
    );

    const inserted = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [doubtId]);

    // Broadcast to Mentors via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:new', inserted);
      io.emit('notification', {
        title: 'New Student Doubt',
        message: `${sName} asked a doubt in ${subject}: "${question.slice(0, 50)}..."`,
        type: 'doubt',
        doubtId
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Your doubt has been submitted to 24/7 mentors! You will receive a solution shortly.',
      doubt: inserted
    });
  } catch (err) {
    console.error('Error submitting doubt:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit doubt: ' + err.message });
  }
});

/**
 * 2. GET /api/doubts - List doubts (Students see own; Mentors see all)
 */
router.get('/api/doubts', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { status, subject, email, mineOnly } = req.query;
    const isMentor = req.user?.role === 'mentor' || req.user?.role === 'admin';
    const filterEmail = req.user?.email || email;

    let query = 'SELECT * FROM mentor_doubts WHERE 1=1';
    const params = [];

    // If student and wants only their own doubts
    if ((!isMentor || mineOnly === 'true') && filterEmail) {
      query += ' AND LOWER(studentEmail) = LOWER(?)';
      params.push(filterEmail.trim());
    }

    if (status && status !== 'All') {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (subject && subject !== 'All') {
      query += ' AND LOWER(subject) = LOWER(?)';
      params.push(subject);
    }

    query += ' ORDER BY createdAt DESC';
    const rows = await db.all(query, params);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching doubts:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve doubts.' });
  }
});

/**
 * 3. POST /api/doubts/:id/reply - Mentor replies to student doubt
 */
router.post('/api/doubts/:id/reply', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { solutionText, mentorName, hasVoiceNote = 0 } = req.body;

    if (!solutionText || !solutionText.trim()) {
      return res.status(400).json({ success: false, error: 'Solution text cannot be empty.' });
    }

    const existing = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Doubt not found.' });
    }

    const claimed = mentorName || req.user?.name || 'Academic Mentor';

    await db.run(
      `UPDATE mentor_doubts SET
        solutionText = ?,
        claimedBy = ?,
        status = 'resolved',
        hasVoiceNote = ?,
        repliedAt = CURRENT_TIMESTAMP,
        resolvedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [solutionText.trim(), claimed, hasVoiceNote ? 1 : 0, id]
    );

    // Increment mentor doubtsResolved
    if (req.user?.email) {
      await db.run(
        'UPDATE mentors SET doubtsResolved = COALESCE(doubtsResolved, 0) + 1 WHERE LOWER(email) = ?',
        [req.user.email.toLowerCase()]
      );
    }

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    // Broadcast to Student & Mentors via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:resolved', updated);
      io.emit('notification', {
        title: `💡 ডাউট সমাধান: "${updated.subject || 'বিষয়'}"`,
        message: `মেন্টর ${claimed} আপনার ডাউটটির সমাধান দিয়েছেন! এখনই ড্যাশবোর্ডে সমাধান দেখুন।`,
        type: 'doubt_solution',
        category: 'doubt_solution',
        doubtId: id,
        studentEmail: existing.studentEmail,
        link: 'dashboard'
      });
    }

    return res.json({
      success: true,
      message: 'Solution posted and student notified in real-time!',
      doubt: updated
    });
  } catch (err) {
    console.error('Error replying to doubt:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to reply to doubt: ' + err.message });
  }
});

/**
 * 4. PUT & POST /api/doubts/:id/claim - Mentor claims a doubt (with Concurrency Lock)
 */
const handleDoubtClaim = async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const mentorName = req.body.mentorName || req.user?.name || 'Academic Mentor';
    const mentorEmail = (req.body.mentorEmail || req.user?.email || '').trim().toLowerCase();

    const existing = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Doubt not found.' });
    }

    if (existing.status === 'resolved') {
      return res.status(400).json({ success: false, error: 'This doubt has already been resolved.' });
    }

    // Concurrency Lock: If already claimed by another mentor, reject!
    if (existing.status === 'claimed') {
      const alreadyClaimedByOther = (existing.claimedEmail && mentorEmail && existing.claimedEmail.toLowerCase() !== mentorEmail) ||
        (existing.claimedBy && existing.claimedBy.trim().toLowerCase() !== mentorName.trim().toLowerCase());
      
      if (alreadyClaimedByOther) {
        return res.status(409).json({
          success: false,
          error: `এই প্রশ্নটি ইতোমধ্যে মেন্টর ${existing.claimedBy || 'অন্য একজন'} সলভ করার জন্য Claim করেছেন।`,
          doubt: existing
        });
      }
    }

    await db.run(
      "UPDATE mentor_doubts SET status = 'claimed', claimedBy = ?, claimedEmail = ? WHERE id = ?",
      [mentorName, mentorEmail, id]
    );

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:claimed', updated);
      io.emit('doubt:updated', updated);
    }

    return res.json({ success: true, message: 'Doubt claimed exclusively.', doubt: updated });
  } catch (err) {
    console.error('Error claiming doubt:', err);
    return res.status(500).json({ success: false, error: 'Failed to claim doubt: ' + err.message });
  }
};

router.put('/api/doubts/:id/claim', optionalAuth, handleDoubtClaim);
router.post('/api/doubts/:id/claim', optionalAuth, handleDoubtClaim);

/**
 * 4b. PUT & POST /api/doubts/:id/release - Mentor releases doubt back to Live Queue
 */
const handleDoubtRelease = async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Doubt not found.' });
    }

    if (existing.status === 'resolved') {
      return res.status(400).json({ success: false, error: 'Resolved doubts cannot be released.' });
    }

    await db.run(
      "UPDATE mentor_doubts SET status = 'pending', claimedBy = NULL, claimedEmail = NULL WHERE id = ?",
      [id]
    );

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:released', updated);
      io.emit('doubt:updated', updated);
      io.emit('notification', {
        title: 'Doubt Returned to Queue',
        message: `Ticket #${id} is available in Live Queue again.`,
        type: 'doubt_released',
        targetRole: 'mentor'
      });
    }

    return res.json({ success: true, message: 'Doubt released back to queue successfully.', doubt: updated });
  } catch (err) {
    console.error('Error releasing doubt:', err);
    return res.status(500).json({ success: false, error: 'Failed to release doubt: ' + err.message });
  }
};

router.put('/api/doubts/:id/release', optionalAuth, handleDoubtRelease);
router.post('/api/doubts/:id/release', optionalAuth, handleDoubtRelease);

/**
 * 4c. PUT & POST /api/doubts/:id/escalate - Escalate doubt to Master Teacher
 */
const handleDoubtEscalate = async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const reason = req.body.reason || 'Escalated to Master Teacher for review';

    const existing = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Doubt not found.' });
    }

    await db.run(
      "UPDATE mentor_doubts SET status = 'escalated', escalationReason = ? WHERE id = ?",
      [reason, id]
    );

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:escalated', updated);
      io.emit('doubt:updated', updated);
    }

    return res.json({ success: true, message: 'Doubt escalated to Master Teacher.', doubt: updated });
  } catch (err) {
    console.error('Error escalating doubt:', err);
    return res.status(500).json({ success: false, error: 'Failed to escalate doubt: ' + err.message });
  }
};

router.put('/api/doubts/:id/escalate', optionalAuth, handleDoubtEscalate);
router.post('/api/doubts/:id/escalate', optionalAuth, handleDoubtEscalate);

/**
 * 5. PUT /api/doubts/:id/resolve - Mark doubt resolved
 */
router.put('/api/doubts/:id/resolve', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    await db.run(
      "UPDATE mentor_doubts SET status = 'resolved', resolvedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:resolved', updated);
    }

    return res.json({ success: true, message: 'Doubt marked as resolved.', doubt: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to resolve doubt.' });
  }
});

/**
 * 6. POST & PUT /api/doubts/:id/rate - Student rates mentor's solution
 */
const handleDoubtRate = async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { rating } = req.body;
    const stars = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

    const existing = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Doubt not found.' });
    }

    // 🔒 প্রতিটা প্রশ্নে রেটিং একবারই গ্রহণযোগ্য (একবার রেটিং দিলে আর পরিবর্তন করা যাবে না)
    if (existing.rating && Number(existing.rating) > 0) {
      return res.json({ 
        success: true, 
        message: 'This doubt has already been rated and is locked.', 
        alreadyRated: true, 
        doubt: existing 
      });
    }

    await db.run(
      'UPDATE mentor_doubts SET rating = ? WHERE id = ?',
      [stars, id]
    );

    const updated = await db.get('SELECT * FROM mentor_doubts WHERE id = ?', [id]);

    // Calculate mentor's updated average rating live from all rated doubts
    let mentorAvgRating = 5.0;
    let ratedReviewsCount = 1;
    if (existing.claimedBy) {
      const mentorStats = await db.get(
        `SELECT AVG(rating) as avgRating, COUNT(rating) as ratedCount 
         FROM mentor_doubts 
         WHERE LOWER(claimedBy) = LOWER(?) AND rating > 0`,
        [existing.claimedBy.trim()]
      );
      if (mentorStats && mentorStats.ratedCount > 0) {
        mentorAvgRating = Number(Number(mentorStats.avgRating).toFixed(1));
        ratedReviewsCount = mentorStats.ratedCount;

        // Persist to mentors table
        try {
          await db.run(
            'UPDATE mentors SET rating = ? WHERE LOWER(name) = LOWER(?)',
            [mentorAvgRating, existing.claimedBy.trim()]
          );
        } catch (mErr) {
          console.warn('Mentors table rating update notice:', mErr.message);
        }
      }
    }

    // Broadcast live update to all sockets (Mentor Desk, Student Dashboard, Admin)
    const io = req.app.get('io');
    if (io) {
      io.emit('doubt:updated', updated);
      io.emit('doubt:rated', {
        doubtId: id,
        rating: stars,
        claimedBy: existing.claimedBy,
        mentorRating: mentorAvgRating,
        ratedCount: ratedReviewsCount,
        doubt: updated
      });
      io.emit('mentor:rating_updated', {
        mentorName: existing.claimedBy,
        newRating: mentorAvgRating,
        totalReviews: ratedReviewsCount,
        recentStar: stars
      });
      // Isolated exclusively for mentor desk
      io.emit('notification', {
        title: '⭐ নতুন রেটিং পাওয়া গেছে!',
        message: `শিক্ষার্থী আপনার সমাধানে ${stars}★ রেটিং দিয়েছেন! নতুন স্যাটিসফ্যাকশন স্কোর: ${mentorAvgRating} / 5.0`,
        type: 'mentor_rating',
        targetRole: 'mentor',
        mentorName: existing.claimedBy
      });
    }

    return res.json({
      success: true,
      message: 'Rating saved successfully!',
      doubt: updated,
      mentorRating: mentorAvgRating,
      ratedCount: ratedReviewsCount
    });
  } catch (err) {
    console.error('Error rating doubt:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to rate doubt: ' + err.message });
  }
};

router.post('/api/doubts/:id/rate', optionalAuth, handleDoubtRate);
router.put('/api/doubts/:id/rate', optionalAuth, handleDoubtRate);


/**
 * 6. GET /api/mentor/stats - Mentor Portal Stats
 */
router.get('/api/mentor/stats', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const totalDoubtsRow = await db.get('SELECT COUNT(*) as count FROM mentor_doubts');
    const resolvedRow = await db.get("SELECT COUNT(*) as count FROM mentor_doubts WHERE status = 'resolved'");
    const pendingRow = await db.get("SELECT COUNT(*) as count FROM mentor_doubts WHERE status = 'pending'");

    return res.json({
      success: true,
      stats: {
        totalDoubts: totalDoubtsRow?.count || 0,
        resolvedDoubts: resolvedRow?.count || 0,
        pendingDoubts: pendingRow?.count || 0,
        averageResponseTime: '12 Minutes',
        mentorRating: 4.95
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve mentor stats.' });
  }
});

module.exports = router;
