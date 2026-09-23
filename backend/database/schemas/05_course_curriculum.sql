-- ============================================================================
-- 5. Course Curriculum & Video Lessons Table (টপিক অনুযায়ী ভিডিও লেকচার ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_curriculum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courseId TEXT NOT NULL,                  -- কোর্স আইডি (যেমন: 'course-1')
  moduleTitle TEXT NOT NULL,               -- অধ্যায় / মডিউল নাম (যেমন: 'Module 1: ভেক্টর ও বলবিদ্যা')
  topicTitle TEXT NOT NULL,                -- লেকচার / টপিক নাম (যেমন: 'Lecture 1: ভেক্টর ডট গুণন')
  videoUrl TEXT NOT NULL,                  -- ভিডিও ফাইল পাথ (/uploads/videos/file.mp4) অথবা অনলাইন লিঙ্ক
  videoSourceType TEXT DEFAULT 'local',    -- 'local' (uploaded file) অথবা 'external' (youtube/drive)
  duration TEXT DEFAULT '20:00',           -- সময়কাল (mm:ss)
  lectureNotesUrl TEXT,                    -- হ্যান্ডনোট বা লেকচার শিট (PDF লিঙ্ক)
  orderIndex INTEGER DEFAULT 0,            -- ক্রমানুসার
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_curriculum_course ON course_curriculum(courseId);
