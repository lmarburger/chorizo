-- Fix completed_at column to use timezone-aware TIMESTAMPTZ
-- This fixes a bug where chores completed in the evening (ET) were incorrectly
-- marked as late because the stored UTC timestamp was being misinterpreted.

ALTER TABLE chore_completions
ALTER COLUMN completed_at TYPE TIMESTAMPTZ
USING completed_at AT TIME ZONE 'UTC';
