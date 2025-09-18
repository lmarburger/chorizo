import { neon } from "@neondatabase/serverless";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChoreSchedule {
  id: number;
  chore_id: number;
  kid_name: string;
  day_of_week: DayOfWeek;
  created_at: Date;
}

export interface ChoreWithSchedules extends Chore {
  schedules: ChoreSchedule[];
}

export interface ChoreScheduleWithChore extends ChoreSchedule {
  chore_name: string;
  chore_description: string | null;
}

export interface ChoreCompletion {
  id: number;
  chore_schedule_id: number;
  completed_date: string;
  completed_at: Date;
  notes: string | null;
}

export interface ChoreScheduleWithCompletion extends ChoreScheduleWithChore {
  is_completed: boolean;
  completion_id?: number;
  completed_at?: Date;
}

function getDb() {
  // Use TEST_DATABASE_URL if available (for testing), otherwise use DATABASE_URL
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(dbUrl);
}

export async function getAllChoresWithSchedules(): Promise<ChoreWithSchedules[]> {
  const sql = getDb();
  const chores = await sql`
    SELECT * FROM chores 
    ORDER BY name
  `;

  const schedules = await sql`
    SELECT * FROM chore_schedules
    ORDER BY 
      CASE day_of_week
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
      END,
      kid_name
  `;

  return (chores as Chore[]).map(chore => ({
    ...chore,
    schedules: (schedules as ChoreSchedule[]).filter(s => s.chore_id === chore.id),
  }));
}

export async function getChoreById(id: number): Promise<ChoreWithSchedules | null> {
  const sql = getDb();
  const choreResult = await sql`
    SELECT * FROM chores WHERE id = ${id}
  `;

  if (choreResult.length === 0) {
    return null;
  }

  const chore = choreResult[0] as Chore;
  const schedules = await sql`
    SELECT * FROM chore_schedules 
    WHERE chore_id = ${id}
    ORDER BY 
      CASE day_of_week
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
      END,
      kid_name
  `;

  return {
    ...chore,
    schedules: schedules as ChoreSchedule[],
  };
}

export async function getCurrentWeekChores(): Promise<ChoreScheduleWithCompletion[]> {
  const sql = getDb();

  // Get the Monday of current week
  const mondayDate = new Date();
  const daysSinceMonday = (mondayDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  mondayDate.setDate(mondayDate.getDate() - daysSinceMonday);
  const mondayStr = mondayDate.toLocaleDateString("en-CA");

  const result = await sql`
    WITH week_schedules AS (
      SELECT 
        cs.*,
        c.name as chore_name,
        c.description as chore_description,
        CASE cs.day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END as day_number,
        DATE(${mondayStr}::date + (
          CASE cs.day_of_week
            WHEN 'monday' THEN 0
            WHEN 'tuesday' THEN 1
            WHEN 'wednesday' THEN 2
            WHEN 'thursday' THEN 3
            WHEN 'friday' THEN 4
            WHEN 'saturday' THEN 5
            WHEN 'sunday' THEN 6
          END
        ) * INTERVAL '1 day') as chore_date
      FROM chore_schedules cs
      JOIN chores c ON cs.chore_id = c.id
    )
    SELECT 
      ws.*,
      cc.id as completion_id,
      cc.completed_at,
      CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as is_completed
    FROM week_schedules ws
    LEFT JOIN chore_completions cc 
      ON ws.id = cc.chore_schedule_id 
      AND cc.completed_date = ws.chore_date
    ORDER BY 
      ws.kid_name,
      -- First show uncompleted chores sorted by day
      CASE WHEN cc.id IS NULL THEN 0 ELSE 1 END,
      -- For uncompleted: sort by day number, for completed: use completion time
      CASE WHEN cc.id IS NULL THEN ws.day_number ELSE NULL END,
      -- Then show completed chores sorted by completion time (most recent first)
      cc.completed_at DESC
  `;

  return result as ChoreScheduleWithCompletion[];
}

export async function addChore(chore: Omit<Chore, "id" | "created_at" | "updated_at">): Promise<Chore> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chores (name, description)
    VALUES (${chore.name}, ${chore.description})
    RETURNING *
  `;
  return result[0] as Chore;
}

export async function updateChore(id: number, chore: Omit<Chore, "id" | "created_at" | "updated_at">): Promise<Chore> {
  const sql = getDb();
  const result = await sql`
    UPDATE chores 
    SET name = ${chore.name}, 
        description = ${chore.description}, 
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Chore;
}

export async function deleteChore(id: number): Promise<void> {
  const sql = getDb();
  // Schedules and completions will be cascade deleted
  await sql`DELETE FROM chores WHERE id = ${id}`;
}

export async function addChoreSchedule(choreId: number, kidName: string, dayOfWeek: DayOfWeek): Promise<ChoreSchedule> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
    VALUES (${choreId}, ${kidName}, ${dayOfWeek})
    RETURNING *
  `;
  return result[0] as ChoreSchedule;
}

export async function deleteChoreSchedule(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM chore_schedules WHERE id = ${id}`;
}

export async function updateChoreSchedules(
  choreId: number,
  schedules: { kid_name: string; day_of_week: DayOfWeek }[]
): Promise<void> {
  const sql = getDb();

  // Delete existing schedules
  await sql`DELETE FROM chore_schedules WHERE chore_id = ${choreId}`;

  // Add new schedules one by one using parameterized queries
  for (const schedule of schedules) {
    await sql`
      INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
      VALUES (${choreId}, ${schedule.kid_name}, ${schedule.day_of_week})
    `;
  }
}

export async function completeChore(scheduleId: number, date: string, notes?: string): Promise<ChoreCompletion> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, notes)
    VALUES (${scheduleId}, ${date}, ${notes})
    ON CONFLICT (chore_schedule_id, completed_date) 
    DO UPDATE SET completed_at = NOW(), notes = ${notes}
    RETURNING *
  `;
  return result[0] as ChoreCompletion;
}

export async function uncompleteChore(scheduleId: number, date: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM chore_completions 
    WHERE chore_schedule_id = ${scheduleId} AND completed_date = ${date}
  `;
}

export async function getUniqueKidNames(): Promise<string[]> {
  const sql = getDb();
  const result = await sql`
    SELECT DISTINCT kid_name FROM (
      SELECT kid_name FROM chore_schedules
      UNION
      SELECT kid_name FROM tasks
    ) AS all_kids
    WHERE kid_name IS NOT NULL
    ORDER BY kid_name
  `;
  return result.map(r => r.kid_name) as string[];
}

// Task-related types and functions
export interface Task {
  id: number;
  title: string;
  description: string | null;
  kid_name: string;
  due_date: string;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function getAllTasks(): Promise<Task[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM tasks 
    ORDER BY 
      CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function getTasksForKid(kidName: string): Promise<Task[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM tasks 
    WHERE kid_name = ${kidName}
    ORDER BY 
      CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function getTasksForParentView(): Promise<Task[]> {
  const sql = getDb();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const result = await sql`
    SELECT * FROM tasks 
    WHERE completed_at IS NULL 
       OR completed_at >= ${oneWeekAgo.toISOString()}
    ORDER BY 
      CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function addTask(task: Omit<Task, "id" | "completed_at" | "created_at" | "updated_at">): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO tasks (title, description, kid_name, due_date)
    VALUES (${task.title}, ${task.description}, ${task.kid_name}, ${task.due_date})
    RETURNING *
  `;
  return result[0] as Task;
}

export async function updateTask(
  id: number,
  task: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
): Promise<Task> {
  const sql = getDb();
  const updates: string[] = [];
  const values: Record<string, unknown> = {};

  if (task.title !== undefined) {
    updates.push("title = ${title}");
    values.title = task.title;
  }
  if (task.description !== undefined) {
    updates.push("description = ${description}");
    values.description = task.description;
  }
  if (task.kid_name !== undefined) {
    updates.push("kid_name = ${kid_name}");
    values.kid_name = task.kid_name;
  }
  if (task.due_date !== undefined) {
    updates.push("due_date = ${due_date}");
    values.due_date = task.due_date;
  }
  if (task.completed_at !== undefined) {
    updates.push("completed_at = ${completed_at}");
    values.completed_at = task.completed_at;
  }

  updates.push("updated_at = NOW()");

  const result = await sql`
    UPDATE tasks 
    SET title = ${task.title || sql`title`},
        description = ${task.description !== undefined ? task.description : sql`description`},
        kid_name = ${task.kid_name || sql`kid_name`},
        due_date = ${task.due_date || sql`due_date`},
        completed_at = ${task.completed_at !== undefined ? task.completed_at : sql`completed_at`},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Task;
}

export async function deleteTask(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function toggleTaskComplete(id: number): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks 
    SET completed_at = CASE 
      WHEN completed_at IS NULL THEN NOW() 
      ELSE NULL 
    END,
    updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Task;
}

// Delete a kid and all their associated data
export async function deleteKid(kidName: string): Promise<void> {
  const sql = getDb();

  // Delete all tasks for this kid
  await sql`DELETE FROM tasks WHERE kid_name = ${kidName}`;

  // Delete all chore schedules for this kid (will cascade delete completions)
  await sql`DELETE FROM chore_schedules WHERE kid_name = ${kidName}`;
}

// Add a new kid by creating a welcome task
export async function addKid(kidName: string): Promise<void> {
  const sql = getDb();

  // Check if kid already exists
  const existing = await sql`
    SELECT DISTINCT kid_name 
    FROM (
      SELECT kid_name FROM tasks WHERE kid_name = ${kidName}
      UNION
      SELECT kid_name FROM chore_schedules WHERE kid_name = ${kidName}
    ) AS kids
    LIMIT 1
  `;

  if (existing.length > 0) {
    throw new Error("Kid already exists");
  }

  // Create a welcome task for the new kid that's due tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  await sql`
    INSERT INTO tasks (title, description, kid_name, due_date)
    VALUES ('Welcome to Chorizo!', 'Mark this task complete when you are ready to start', ${kidName}, ${tomorrowStr})
  `;
}
