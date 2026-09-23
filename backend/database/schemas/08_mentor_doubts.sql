-- ============================================================================
-- 8. Mentor Doubts Queue Table (২৪/৭ লাইভ ডাউট সলভার ও মেন্টরিং ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mentor_doubts (
  id TEXT PRIMARY KEY,
  studentName TEXT NOT NULL,
  subject TEXT NOT NULL,                   -- 'Physics', 'Chemistry', 'Math', 'Biology'
  topic TEXT,                              -- নির্দিষ্ট টপিক
  question TEXT NOT NULL,                  -- শিক্ষার্থীর ডাউট প্রশ্ন
  priority TEXT DEFAULT 'high',            -- 'high', 'normal'
  status TEXT DEFAULT 'pending',           -- 'pending', 'claimed', 'resolved', 'escalated'
  claimedBy TEXT,                          -- মেন্টরের নাম
  solutionText TEXT,                       -- লিখিত উত্তর
  hasVoiceNote INTEGER DEFAULT 0,          -- ভয়েস নোট আছে কি না (1 বা 0)
  rating INTEGER DEFAULT 0,                -- রেটিং (১-৫)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_doubts_status ON mentor_doubts(status);
CREATE INDEX IF NOT EXISTS idx_mentor_doubts_subj ON mentor_doubts(subject);
