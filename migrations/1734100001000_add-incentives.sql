-- Add incentive system: flexible/fixed chores, excuse mechanism, feedback, and reward claims

-- Add flexible column to chores (true = can do any day, false = must do on scheduled day)
ALTER TABLE chores ADD COLUMN IF NOT EXISTS flexible BOOLEAN DEFAULT true;

-- Add excused column to chore_completions (true if parent excused this chore)
ALTER TABLE chore_completions ADD COLUMN IF NOT EXISTS excused BOOLEAN DEFAULT false;

-- Add excused_at column to tasks (if set, parent excused this task)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS excused_at TIMESTAMPTZ;

-- Feedback table for kids to submit ideas and feedback
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    kid_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incentive claims table to track weekly rewards
CREATE TABLE IF NOT EXISTS incentive_claims (
    id SERIAL PRIMARY KEY,
    kid_name VARCHAR(100) NOT NULL,
    week_start_date DATE NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('screen_time', 'money')),
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    dismissed_at TIMESTAMPTZ,
    UNIQUE(kid_name, week_start_date)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_claims_kid_name ON incentive_claims(kid_name);
CREATE INDEX IF NOT EXISTS idx_claims_week ON incentive_claims(week_start_date);
CREATE INDEX IF NOT EXISTS idx_feedback_kid_name ON feedback(kid_name);
CREATE INDEX IF NOT EXISTS idx_feedback_completed ON feedback(completed_at);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- Set fixed chores (must be done on scheduled day exactly)
UPDATE chores SET flexible = false
WHERE name IN ('Make bed', 'Take out trash', 'Feed pet', 'Do the dishes');
