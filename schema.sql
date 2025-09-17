-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS chore_completions CASCADE;
DROP TABLE IF EXISTS chores CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;

-- Create enum for days of the week
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Chores table to store all chores with their schedules
CREATE TABLE chores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  kid_name VARCHAR(100) NOT NULL,
  day_of_week day_of_week NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chore completions table to track when chores are completed
CREATE TABLE chore_completions (
  id SERIAL PRIMARY KEY,
  chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(chore_id, completed_date)
);

-- Indexes for better query performance
CREATE INDEX idx_chores_kid_name ON chores(kid_name);
CREATE INDEX idx_chores_day_of_week ON chores(day_of_week);
CREATE INDEX idx_completions_date ON chore_completions(completed_date);
CREATE INDEX idx_completions_chore_id ON chore_completions(chore_id);

-- Sample data for testing (optional - comment out in production)
INSERT INTO chores (name, description, kid_name, day_of_week) VALUES
  ('Make bed', 'Make your bed neatly', 'Alex', 'monday'),
  ('Make bed', 'Make your bed neatly', 'Alex', 'tuesday'),
  ('Make bed', 'Make your bed neatly', 'Alex', 'wednesday'),
  ('Make bed', 'Make your bed neatly', 'Alex', 'thursday'),
  ('Make bed', 'Make your bed neatly', 'Alex', 'friday'),
  ('Take out trash', 'Take the kitchen trash to the outside bin', 'Alex', 'wednesday'),
  ('Take out trash', 'Take the kitchen trash to the outside bin', 'Alex', 'saturday'),
  ('Clean room', 'Pick up toys and clothes, organize desk', 'Sam', 'monday'),
  ('Clean room', 'Pick up toys and clothes, organize desk', 'Sam', 'thursday'),
  ('Feed pet', 'Feed and give fresh water', 'Sam', 'tuesday'),
  ('Feed pet', 'Feed and give fresh water', 'Sam', 'thursday'),
  ('Feed pet', 'Feed and give fresh water', 'Sam', 'saturday');