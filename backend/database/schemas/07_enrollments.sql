-- ============================================================================
-- 7. Course Enrollments Table (শিক্ষার্থীদের কোর্স এনরোলমেন্ট ও অগ্রগতি ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentEmail TEXT NOT NULL,
  studentName TEXT,
  courseId TEXT NOT NULL,
  courseTitle TEXT,
  progressPercent INTEGER DEFAULT 0,
  enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(studentEmail);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(courseId);
