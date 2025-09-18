-- Create tasks table for one-off tasks
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

-- Create index for efficient queries
CREATE INDEX idx_tasks_kid_name ON tasks(kid_name);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);

-- Add some sample tasks (optional - comment out if not needed)
INSERT INTO tasks (title, description, kid_name, due_date) VALUES
    ('Pack for trip', 'Pack clothes and toiletries for weekend trip', 'Alex', CURRENT_DATE + INTERVAL '3 days'),
    ('Science project', 'Complete volcano model for science fair', 'Sam', CURRENT_DATE + INTERVAL '5 days'),
    ('Library books', 'Return library books before they are overdue', 'Alex', CURRENT_DATE + INTERVAL '1 day');