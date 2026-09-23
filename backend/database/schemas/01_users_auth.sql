-- ============================================================================
-- 1. Users Auth Table (লগইন ও অথেন্টিকেশন ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL DEFAULT 'student',   -- 'student', 'admin', 'teacher', 'mentor'
  email TEXT UNIQUE,
  mobile TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  isVerified INTEGER DEFAULT 0,
  lastLoginAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_auth_email ON users_auth(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_mobile ON users_auth(mobile);
