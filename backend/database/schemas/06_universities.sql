-- ============================================================================
-- 6. Universities & Admission Circulars Table (বিশ্ববিদ্যালয় ও ভর্তি ইউনিট ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                      -- 'Dhaka University (DU)', 'BUET', etc.
  logo TEXT,                               -- '🏛️', '⚙️', '🩺', etc.
  description TEXT,
  deadline TEXT,
  examDate TEXT,
  applicationFee REAL,
  unitsJson TEXT,                          -- ইউনিটের তালিকা (Science, Arts, Business, IBA ইত্যাদি)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_universities_deadline ON universities(deadline);
