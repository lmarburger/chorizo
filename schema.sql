-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS incentive_claims CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS chore_completions CASCADE;
DROP TABLE IF EXISTS chore_schedules CASCADE;
DROP TABLE IF EXISTS chores CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;

-- Feedback table for kids to submit ideas and feedback
CREATE TABLE feedback (
    id serial PRIMARY KEY,
    kid_name varchar(100) NOT NULL,
    message text NOT NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);

-- Create enum for days of the week
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Chores table to store chore definitions
CREATE TABLE chores (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL, -- noqa: RF04
    description text,
    flexible boolean DEFAULT true,  -- true = can do any day this week, false = must do on scheduled day
    UNIQUE(name) -- Chore names should be unique
);

-- Chore schedules table to define which kid does what chore on which day
CREATE TABLE chore_schedules (
    id serial PRIMARY KEY,
    chore_id integer NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    kid_name varchar(100) NOT NULL,
    day_of_week day_of_week NOT NULL,
    UNIQUE(chore_id, kid_name, day_of_week) -- Prevent duplicate schedules
);

-- Chore completions table to track when chores are completed
CREATE TABLE chore_completions (
    id serial PRIMARY KEY,
    chore_schedule_id integer NOT NULL REFERENCES chore_schedules(id) ON DELETE CASCADE,
    scheduled_on date NOT NULL,   -- the scheduled date for this chore occurrence
    completed_on date NOT NULL,   -- the actual date it was completed
    notes text,
    excused boolean DEFAULT false,  -- true if parent excused this chore (counts as done for qualification)
    UNIQUE(chore_schedule_id, scheduled_on)
);

-- Tasks table to store one-off tasks with due dates
CREATE TABLE tasks (
    id serial PRIMARY KEY,
    title varchar(255) NOT NULL,
    description text,
    kid_name varchar(100) NOT NULL,
    due_date date NOT NULL,
    completed_on date,         -- the date it was completed (NULL if not completed)
    excused boolean DEFAULT false  -- true if parent excused this task (counts as done for qualification)
);

-- Incentive claims table to track weekly rewards
CREATE TABLE incentive_claims (
    id serial PRIMARY KEY,
    kid_name varchar(100) NOT NULL,
    week_start_date date NOT NULL,  -- Monday of the week
    reward_type varchar(20) NOT NULL CHECK (reward_type IN ('screen_time', 'money')),
    claimed_at timestamptz DEFAULT NOW(),
    dismissed_at timestamptz,  -- when parent acknowledged the claim
    UNIQUE(kid_name, week_start_date)
);

-- Indexes for better query performance
CREATE INDEX idx_schedules_kid_name ON chore_schedules(kid_name);
CREATE INDEX idx_schedules_day_of_week ON chore_schedules(day_of_week);
CREATE INDEX idx_schedules_chore_id ON chore_schedules(chore_id);
CREATE INDEX idx_completions_scheduled_on ON chore_completions(scheduled_on);
CREATE INDEX idx_completions_schedule_id ON chore_completions(chore_schedule_id);
CREATE INDEX idx_tasks_kid_name ON tasks(kid_name);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed_on ON tasks(completed_on);
CREATE INDEX idx_claims_kid_name ON incentive_claims(kid_name);
CREATE INDEX idx_claims_week ON incentive_claims(week_start_date);
CREATE INDEX idx_feedback_kid_name ON feedback(kid_name);
CREATE INDEX idx_feedback_completed ON feedback(completed_at);
CREATE INDEX idx_feedback_created ON feedback(created_at);

-- Sample data for testing
-- First, create the chores (flexible = true by default, some are fixed)
INSERT INTO chores (name, description, flexible) VALUES
('Make bed', 'Make your bed neatly', false),  -- fixed: must be done each morning
('Take out trash', 'Take the kitchen trash to the outside bin', false),  -- fixed: trash day is specific
('Clean room', 'Pick up toys and clothes, organize desk', true),  -- flexible: can do any day
('Feed pet', 'Feed and give fresh water', false),  -- fixed: must be done daily
('Do the dishes', 'Wash, dry, and put away dishes', false),  -- fixed: must be done after meals
('Practice piano', 'Practice for at least 30 minutes', true);  -- flexible: can do any day

-- Then create the schedules
INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
SELECT c.id, s.kid_name, s.day_of_week
FROM chores AS c
CROSS JOIN (
    VALUES
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
