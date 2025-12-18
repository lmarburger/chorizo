-- Initial schema baseline (matches prod at commit 666854fcfcd5)
-- Uses IF NOT EXISTS to be idempotent when run on existing databases

-- Create enum for days of the week
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week') THEN
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  END IF;
END$$;

-- Chores table to store chore definitions
CREATE TABLE IF NOT EXISTS chores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- noqa: RF04
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name)
);

-- Chore schedules table to define which kid does what chore on which day
CREATE TABLE IF NOT EXISTS chore_schedules (
    id SERIAL PRIMARY KEY,
    chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    kid_name VARCHAR(100) NOT NULL,
    day_of_week DAY_OF_WEEK NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chore_id, kid_name, day_of_week)
);

-- Chore completions table to track when chores are completed
CREATE TABLE IF NOT EXISTS chore_completions (
    id SERIAL PRIMARY KEY,
    chore_schedule_id INTEGER NOT NULL REFERENCES chore_schedules(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(chore_schedule_id, completed_date)
);

-- Tasks table to store one-off tasks with due dates
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    kid_name VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_kid_name ON chore_schedules(kid_name);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON chore_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_chore_id ON chore_schedules(chore_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON chore_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_completions_schedule_id ON chore_completions(chore_schedule_id);
CREATE INDEX IF NOT EXISTS idx_tasks_kid_name ON tasks(kid_name);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed_at);
