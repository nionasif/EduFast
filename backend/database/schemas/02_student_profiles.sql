-- ============================================================================
-- 2. Student Profiles Table (শিক্ষার্থীদের ব্যক্তিগত ও অ্যাকাডেমিক প্রোফাইল ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  name TEXT NOT NULL,
  fathersName TEXT,
  mothersName TEXT,
  dob TEXT,
  academicGroup TEXT,
  sscRoll TEXT,
  sscReg TEXT,
  sscBoard TEXT,
  sscGpa REAL,
  sscSchool TEXT,
  hscRoll TEXT,
  hscReg TEXT,
  hscBoard TEXT,
  hscGpa REAL,
  hscCollege TEXT,
  avatar TEXT,
  bio TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users_auth(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_student_profiles_hscBoard ON student_profiles(hscBoard);
