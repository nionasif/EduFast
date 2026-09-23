const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/db');

// Ensure video upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// Allowed video mime types
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (.mp4, .webm, .mkv, .mov) are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 500 } // 500 MB limit
});

// 1. POST /api/upload/video - Upload video file directly
router.post('/api/upload/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided.' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    return res.json({
      success: true,
      message: 'Video file successfully uploaded!',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        sizeBytes: req.file.size,
        videoUrl: videoUrl,
        fullUrl: `http://localhost:5001${videoUrl}`
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to upload video.' });
  }
});

// 2. GET /api/upload/videos - List all videos in uploads/videos folder
router.get('/api/upload/videos', (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(uploadDir);
    const videoList = files
      .filter(f => f !== 'README.md' && !f.startsWith('.'))
      .map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          sizeBytes: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          videoUrl: `/uploads/videos/${filename}`,
          createdAt: stats.birthtime
        };
      });

    return res.json({ success: true, data: videoList });
  } catch (err) {
    console.error('List videos error:', err);
    return res.status(500).json({ success: false, error: 'Failed to list videos.' });
  }
});

// 3. GET /api/courses/:courseId/curriculum - Get topic-wise lessons for a course
router.get('/api/courses/:courseId/curriculum', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM course_curriculum WHERE courseId = ? ORDER BY orderIndex ASC, id ASC',
      [req.params.courseId]
    );

    // Group by moduleTitle
    const moduleMap = {};
    rows.forEach(item => {
      const modTitle = item.moduleTitle || 'General Module';
      if (!moduleMap[modTitle]) {
        moduleMap[modTitle] = {
          id: `mod-${modTitle.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`,
          title: modTitle,
          lessons: []
        };
      }
      moduleMap[modTitle].lessons.push({
        id: item.id,
        title: item.topicTitle,
        duration: item.duration || '20:00',
        videoUrl: item.videoUrl,
        videoSourceType: item.videoSourceType,
        sheetUrl: item.lectureNotesUrl,
        orderIndex: item.orderIndex || 0,
        createdAt: item.createdAt,
        completed: false
      });
    });

    return res.json({
      success: true,
      data: Object.values(moduleMap),
      rawRows: rows
    });
  } catch (err) {
    console.error('Curriculum error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve curriculum.' });
  }
});

// 4. POST /api/courses/:courseId/curriculum - Add topic lesson to a course
router.post('/api/courses/:courseId/curriculum', async (req, res) => {
  try {
    const db = getDb();
    const { courseId } = req.params;
    const { moduleTitle, topicTitle, videoUrl, videoSourceType = 'local', duration = '20:00', lectureNotesUrl, orderIndex = 0, courseTitle, instructor } = req.body;

    if (!moduleTitle || !topicTitle || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'moduleTitle, topicTitle, and videoUrl are required.'
      });
    }

    // Ensure courseId exists in courses table so foreign key doesn't fail
    const existingCourse = await db.get('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!existingCourse) {
      await db.run(
        `INSERT OR IGNORE INTO courses (id, title, instructor, isApproved, status)
         VALUES (?, ?, ?, 0, 'Pending')`,
        [courseId, courseTitle || 'Custom Masterclass Course', instructor || 'EduFast Instructor']
      );
    }

    const result = await db.run(
      `INSERT INTO course_curriculum (courseId, moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl, orderIndex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, moduleTitle.trim(), topicTitle.trim(), videoUrl.trim(), videoSourceType, duration.trim(), lectureNotesUrl || '', orderIndex]
    );

    const inserted = await db.get('SELECT * FROM course_curriculum WHERE id = ?', [result.lastID]);

    // Fetch updated grouped modules
    const allRows = await db.all(
      'SELECT * FROM course_curriculum WHERE courseId = ? ORDER BY orderIndex ASC, id ASC',
      [courseId]
    );
    const moduleMap = {};
    allRows.forEach(item => {
      const modTitle = item.moduleTitle || 'General Module';
      if (!moduleMap[modTitle]) {
        moduleMap[modTitle] = {
          id: `mod-${modTitle.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`,
          title: modTitle,
          lessons: []
        };
      }
      moduleMap[modTitle].lessons.push({
        id: item.id,
        title: item.topicTitle,
        duration: item.duration || '20:00',
        videoUrl: item.videoUrl,
        videoSourceType: item.videoSourceType,
        sheetUrl: item.lectureNotesUrl,
        completed: false
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Topic lecture successfully added to course curriculum!',
      data: inserted,
      curriculum: Object.values(moduleMap)
    });
  } catch (err) {
    console.error('Add topic error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add topic lesson: ' + err.message });
  }
});

// 5. PUT /api/courses/curriculum/:lessonId - Edit lesson
router.put('/api/courses/curriculum/:lessonId', async (req, res) => {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const { moduleTitle, topicTitle, videoUrl, videoSourceType, duration, lectureNotesUrl } = req.body;

    const existing = await db.get('SELECT * FROM course_curriculum WHERE id = ?', [lessonId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Lesson not found.' });
    }

    await db.run(
      `UPDATE course_curriculum
       SET moduleTitle = ?, topicTitle = ?, videoUrl = ?, videoSourceType = ?, duration = ?, lectureNotesUrl = ?
       WHERE id = ?`,
      [
        moduleTitle ? moduleTitle.trim() : existing.moduleTitle,
        topicTitle ? topicTitle.trim() : existing.topicTitle,
        videoUrl ? videoUrl.trim() : existing.videoUrl,
        videoSourceType || existing.videoSourceType,
        duration ? duration.trim() : existing.duration,
        lectureNotesUrl !== undefined ? lectureNotesUrl : existing.lectureNotesUrl,
        lessonId
      ]
    );

    const updated = await db.get('SELECT * FROM course_curriculum WHERE id = ?', [lessonId]);
    return res.json({ success: true, message: 'Lesson updated successfully.', data: updated });
  } catch (err) {
    console.error('Update lesson error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update lesson.' });
  }
});

// 6. DELETE /api/courses/curriculum/:lessonId - Delete lesson
router.delete('/api/courses/curriculum/:lessonId', async (req, res) => {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const existing = await db.get('SELECT courseId FROM course_curriculum WHERE id = ?', [lessonId]);
    await db.run('DELETE FROM course_curriculum WHERE id = ?', [lessonId]);

    let updatedCurriculum = [];
    if (existing && existing.courseId) {
      const allRows = await db.all(
        'SELECT * FROM course_curriculum WHERE courseId = ? ORDER BY orderIndex ASC, id ASC',
        [existing.courseId]
      );
      const moduleMap = {};
      allRows.forEach(item => {
        const modTitle = item.moduleTitle || 'General Module';
        if (!moduleMap[modTitle]) {
          moduleMap[modTitle] = {
            id: `mod-${modTitle.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`,
            title: modTitle,
            lessons: []
          };
        }
        moduleMap[modTitle].lessons.push({
          id: item.id,
          title: item.topicTitle,
          duration: item.duration || '20:00',
          videoUrl: item.videoUrl,
          videoSourceType: item.videoSourceType,
          sheetUrl: item.lectureNotesUrl,
          completed: false
        });
      });
      updatedCurriculum = Object.values(moduleMap);
    }

    return res.json({ success: true, message: 'Lesson deleted.', curriculum: updatedCurriculum });
  } catch (err) {
    console.error('Delete lesson error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete lesson.' });
  }
});

module.exports = router;
