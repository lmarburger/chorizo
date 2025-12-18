-- Simplify schema: eliminate timezone logic, clarify column names, remove unused columns

-- === CHORE_COMPLETIONS ===
-- Rename confusing column: completed_date was actually the scheduled date
ALTER TABLE chore_completions RENAME COLUMN completed_date TO scheduled_on;

-- Convert completed_at TIMESTAMPTZ → completed_on DATE
-- This eliminates timezone concerns - app provides dates, DB stores them
ALTER TABLE chore_completions RENAME COLUMN completed_at TO completed_on;
ALTER TABLE chore_completions ALTER COLUMN completed_on TYPE DATE
USING (completed_on AT TIME ZONE 'America/New_York')::DATE;
ALTER TABLE chore_completions ALTER COLUMN completed_on DROP DEFAULT;

-- Update index name to match column rename
DROP INDEX IF EXISTS idx_completions_date;
CREATE INDEX idx_completions_scheduled_on ON chore_completions(scheduled_on);

-- === TASKS ===
-- Convert completed_at TIMESTAMPTZ → completed_on DATE
ALTER TABLE tasks RENAME COLUMN completed_at TO completed_on;
ALTER TABLE tasks ALTER COLUMN completed_on TYPE DATE
USING (completed_on AT TIME ZONE 'America/New_York')::DATE;

-- Convert excused_at TIMESTAMPTZ → excused BOOLEAN
-- We only care if it's excused, not when it was excused
ALTER TABLE tasks ADD COLUMN excused BOOLEAN DEFAULT false;
UPDATE tasks SET excused = (excused_at IS NOT null);
ALTER TABLE tasks DROP COLUMN excused_at;

-- === FEEDBACK ===
-- Keep feedback timestamps as-is (TIMESTAMPTZ with NOW())
-- Feedback has no date boundary logic, so no timezone concerns
-- NOW() is fine because there's no "was this done on the right day?" question

-- === DROP UNUSED COLUMNS ===
ALTER TABLE chores DROP COLUMN IF EXISTS created_at;
ALTER TABLE chores DROP COLUMN IF EXISTS updated_at;
ALTER TABLE chore_schedules DROP COLUMN IF EXISTS created_at;
ALTER TABLE tasks DROP COLUMN IF EXISTS created_at;
ALTER TABLE tasks DROP COLUMN IF EXISTS updated_at;
