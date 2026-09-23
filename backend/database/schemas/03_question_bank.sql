-- ============================================================================
-- 3. Question Bank Table (এমসিকিউ প্রশ্ন ও বিস্তারিত সমাধান ডাটা)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,                   -- 'Physics', 'Chemistry', 'Higher Math', etc.
  chapter TEXT,                            -- 'গতির সমীকরণ', 'ম্যাট্রিক্স ও নির্ণায়ক'
  question TEXT NOT NULL,                  -- মূল প্রশ্ন টেক্সট
  optionA TEXT NOT NULL,                   -- অপশন A
  optionB TEXT NOT NULL,                   -- অপশন B
  optionC TEXT NOT NULL,                   -- অপশন C
  optionD TEXT NOT NULL,                   -- অপশন D
  correctAnswer TEXT NOT NULL,             -- 'A', 'B', 'C', 'D'
  explanation TEXT,                        -- বিস্তারিত সমাধান ও শর্টকাট নোটস
  difficulty TEXT DEFAULT 'medium',        -- 'easy', 'medium', 'hard'
  yearTag TEXT,                            -- 'BUET 2024', 'DU Ka 2023', etc.
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject);
CREATE INDEX IF NOT EXISTS idx_question_bank_diff ON question_bank(difficulty);
