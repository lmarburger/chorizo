-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS chore_completions CASCADE;
DROP TABLE IF EXISTS chore_schedules CASCADE;
DROP TABLE IF EXISTS chores CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;

-- Create enum for days of the week
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Chores table to store chore definitions
CREATE TABLE chores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name) -- Chore names should be unique
);

-- Chore schedules table to define which kid does what chore on which day
CREATE TABLE chore_schedules (
  id SERIAL PRIMARY KEY,
  chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  kid_name VARCHAR(100) NOT NULL,
  day_of_week day_of_week NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chore_id, kid_name, day_of_week) -- Prevent duplicate schedules
);

-- Chore completions table to track when chores are completed
CREATE TABLE chore_completions (
  id SERIAL PRIMARY KEY,
  chore_schedule_id INTEGER NOT NULL REFERENCES chore_schedules(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(chore_schedule_id, completed_date)
);

-- Tasks table to store one-off tasks with due dates
CREATE TABLE tasks (
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
CREATE INDEX idx_schedules_kid_name ON chore_schedules(kid_name);
CREATE INDEX idx_schedules_day_of_week ON chore_schedules(day_of_week);
CREATE INDEX idx_schedules_chore_id ON chore_schedules(chore_id);
CREATE INDEX idx_completions_date ON chore_completions(completed_date);
CREATE INDEX idx_completions_schedule_id ON chore_completions(chore_schedule_id);
CREATE INDEX idx_tasks_kid_name ON tasks(kid_name);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed_at);

-- Sample data for testing
-- First, create the chores
INSERT INTO chores (name, description) VALUES
  ('Make bed', 'Make your bed neatly'),
  ('Take out trash', 'Take the kitchen trash to the outside bin'),
  ('Clean room', 'Pick up toys and clothes, organize desk'),
  ('Feed pet', 'Feed and give fresh water'),
  ('Do the dishes', 'Wash, dry, and put away dishes'),
  ('Practice piano', 'Practice for at least 30 minutes');

-- Then create the schedules
INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
SELECT c.id, s.kid_name, s.day_of_week
FROM chores c
CROSS JOIN (VALUES
  -- Make bed - Alex Monday through Friday
  ('Make bed', 'Alex', 'monday'::day_of_week),
  ('Make bed', 'Alex', 'tuesday'::day_of_week),
  ('Make bed', 'Alex', 'wednesday'::day_of_week),
  ('Make bed', 'Alex', 'thursday'::day_of_week),
  ('Make bed', 'Alex', 'friday'::day_of_week),
  -- Take out trash - Alex on Wednesday and Saturday
  ('Take out trash', 'Alex', 'wednesday'::day_of_week),
  ('Take out trash', 'Alex', 'saturday'::day_of_week),
  -- Clean room - Sam on Monday and Thursday
  ('Clean room', 'Sam', 'monday'::day_of_week),
  ('Clean room', 'Sam', 'thursday'::day_of_week),
  -- Feed pet - Sam on Tuesday, Thursday, and Saturday
  ('Feed pet', 'Sam', 'tuesday'::day_of_week),
  ('Feed pet', 'Sam', 'thursday'::day_of_week),
  ('Feed pet', 'Sam', 'saturday'::day_of_week),
  -- Do the dishes - alternating kids each day
  ('Do the dishes', 'Alex', 'monday'::day_of_week),
  ('Do the dishes', 'Sam', 'tuesday'::day_of_week),
  ('Do the dishes', 'Alex', 'wednesday'::day_of_week),
  ('Do the dishes', 'Sam', 'thursday'::day_of_week),
  ('Do the dishes', 'Alex', 'friday'::day_of_week),
  ('Do the dishes', 'Sam', 'saturday'::day_of_week),
  ('Do the dishes', 'Alex', 'sunday'::day_of_week),
  -- Practice piano - both kids Monday through Friday
  ('Practice piano', 'Alex', 'monday'::day_of_week),
  ('Practice piano', 'Alex', 'tuesday'::day_of_week),
  ('Practice piano', 'Alex', 'wednesday'::day_of_week),
  ('Practice piano', 'Alex', 'thursday'::day_of_week),
  ('Practice piano', 'Alex', 'friday'::day_of_week),
  ('Practice piano', 'Sam', 'monday'::day_of_week),
  ('Practice piano', 'Sam', 'tuesday'::day_of_week),
  ('Practice piano', 'Sam', 'wednesday'::day_of_week),
  ('Practice piano', 'Sam', 'thursday'::day_of_week),
  ('Practice piano', 'Sam', 'friday'::day_of_week)
) AS s(chore_name, kid_name, day_of_week)
WHERE c.name = s.chore_name;