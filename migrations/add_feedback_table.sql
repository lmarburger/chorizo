-- Add feedback table for kids to submit ideas and feedback
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  kid_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_feedback_kid_name ON feedback(kid_name);
CREATE INDEX idx_feedback_completed ON feedback(completed_at);
CREATE INDEX idx_feedback_created ON feedback(created_at);