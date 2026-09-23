-- ============================================================================
-- 4. Courses Catalog Table (কোর্স ক্যাটালগ ও বিবরণ ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT,
  rating REAL DEFAULT 4.9,
  reviewsCount INTEGER DEFAULT 120,
  duration TEXT,
  price REAL,
  discountedPrice REAL,
  academicGroup TEXT,                      -- 'Science', 'Commerce', 'Arts'
  badge TEXT,                              -- 'Best Seller', 'AI-Powered', etc.
  image TEXT,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_group ON courses(academicGroup);
