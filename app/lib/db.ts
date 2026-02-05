import { neon } from "@neondatabase/serverless";
import { getCurrentDate } from "./time-server";
import { formatDateString } from "./date-utils";
import { calculateMondayOfWeek, calculateChoreDate, type DayOfWeek } from "./timezone";
import {
  calculateQualification,
  type ChoreRow,
  type TaskRow,
  type IncentiveClaim,
  type QualificationStatus,
  type RewardType,
} from "./qualification";

// Re-export timezone functions for backward compatibility
export { getDayOfWeekInTimezone, calculateMondayOfWeek, calculateChoreDate, type DayOfWeek } from "./timezone";

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  flexible: boolean;
}

export interface ChoreSchedule {
  id: number;
  chore_id: number;
  kid_name: string;
  day_of_week: DayOfWeek;
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
  scheduled_on: string;
  completed_on: string;
  notes: string | null;
  excused: boolean;
}

export interface ChoreScheduleWithCompletion extends ChoreScheduleWithChore {
  is_completed: boolean;
  completion_id?: number;
  completed_on?: string;
  flexible: boolean;
  excused: boolean;
  is_late_completion: boolean;
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

export async function getCurrentWeekChores(now?: Date): Promise<ChoreScheduleWithCompletion[]> {
  const sql = getDb();

  const currentDate = now ?? (await getCurrentDate());
  const mondayStr = calculateMondayOfWeek(currentDate);

  const result = await sql`
    WITH week_schedules AS (
      SELECT
        cs.*,
        c.name as chore_name,
        c.description as chore_description,
        c.flexible,
        CASE cs.day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END as day_number,
        (${mondayStr}::date + (
          CASE cs.day_of_week
            WHEN 'monday' THEN 0
            WHEN 'tuesday' THEN 1
            WHEN 'wednesday' THEN 2
            WHEN 'thursday' THEN 3
            WHEN 'friday' THEN 4
            WHEN 'saturday' THEN 5
            WHEN 'sunday' THEN 6
          END
        ) * INTERVAL '1 day')::date as chore_date
      FROM chore_schedules cs
      JOIN chores c ON cs.chore_id = c.id
    )
    SELECT
      ws.*,
      cc.id as completion_id,
      cc.completed_on::text as completed_on,
      COALESCE(cc.excused, false) as excused,
      CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as is_completed,
      CASE
        WHEN cc.id IS NOT NULL
          AND NOT ws.flexible
          AND cc.completed_on > ws.chore_date
        THEN true
        ELSE false
      END as is_late_completion
    FROM week_schedules ws
    LEFT JOIN chore_completions cc
      ON ws.id = cc.chore_schedule_id
      AND cc.scheduled_on = ws.chore_date
    ORDER BY
      ws.kid_name,
      -- First show uncompleted chores sorted by day
      CASE WHEN cc.id IS NULL THEN 0 ELSE 1 END,
      -- For uncompleted: sort by day number, for completed: use completion date
      CASE WHEN cc.id IS NULL THEN ws.day_number ELSE NULL END,
      -- Then show completed chores sorted by completion date (most recent first)
      cc.completed_on DESC
  `;

  return result as ChoreScheduleWithCompletion[];
}

export async function addChore(chore: Omit<Chore, "id" | "flexible"> & { flexible?: boolean }): Promise<Chore> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chores (name, description, flexible)
    VALUES (${chore.name}, ${chore.description}, ${chore.flexible ?? true})
    RETURNING *
  `;
  return result[0] as Chore;
}

export async function updateChore(
  id: number,
  chore: Omit<Chore, "id" | "flexible"> & { flexible?: boolean }
): Promise<Chore | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE chores
    SET name = ${chore.name},
        description = ${chore.description},
        flexible = ${chore.flexible ?? true}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as Chore) : null;
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

  await sql.transaction([
    sql`DELETE FROM chore_schedules WHERE chore_id = ${choreId}`,
    ...schedules.map(
      schedule => sql`
        INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
        VALUES (${choreId}, ${schedule.kid_name}, ${schedule.day_of_week})
      `
    ),
  ]);
}

export async function completeChore(
  scheduleId: number,
  scheduledOn: string,
  completedOn: string,
  notes?: string
): Promise<ChoreCompletion> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, notes)
    VALUES (${scheduleId}, ${scheduledOn}, ${completedOn}, ${notes})
    ON CONFLICT (chore_schedule_id, scheduled_on)
    DO UPDATE SET completed_on = ${completedOn}, notes = ${notes}
    RETURNING *, scheduled_on::text, completed_on::text
  `;
  return result[0] as ChoreCompletion;
}

export async function uncompleteChore(scheduleId: number, scheduledOn: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM chore_completions
    WHERE chore_schedule_id = ${scheduleId} AND scheduled_on = ${scheduledOn}
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
  completed_on: string | null;
  excused: boolean;
}

export async function getAllTasks(): Promise<Task[]> {
  const sql = getDb();
  const result = await sql`
    SELECT
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
    FROM tasks
    ORDER BY
      CASE WHEN completed_on IS NULL AND NOT excused THEN 0 ELSE 1 END,
      due_date ASC,
      completed_on DESC
  `;
  return result as Task[];
}

export async function getTasksForKid(kidName: string, now?: Date): Promise<Task[]> {
  const sql = getDb();
  const currentDate = now ?? (await getCurrentDate());
  const weekStart = calculateMondayOfWeek(currentDate);

  const result = await sql`
    SELECT
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
    FROM tasks
    WHERE kid_name = ${kidName}
      AND (
        (completed_on IS NULL AND NOT excused)
        OR completed_on >= ${weekStart}
      )
    ORDER BY
      CASE WHEN completed_on IS NULL AND NOT excused THEN 0 ELSE 1 END,
      due_date ASC,
      completed_on DESC
  `;
  return result as Task[];
}

export async function getTasksForParentView(now?: Date): Promise<Task[]> {
  const sql = getDb();
  const currentDate = now ?? (await getCurrentDate());
  const weekStart = calculateMondayOfWeek(currentDate);

  const result = await sql`
    SELECT
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
    FROM tasks
    WHERE (completed_on IS NULL AND NOT excused)
       OR completed_on >= ${weekStart}
    ORDER BY
      CASE WHEN completed_on IS NULL AND NOT excused THEN 0 ELSE 1 END,
      due_date ASC,
      completed_on DESC
  `;
  return result as Task[];
}

export async function addTask(task: Omit<Task, "id" | "completed_on" | "excused">): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO tasks (title, description, kid_name, due_date)
    VALUES (${task.title}, ${task.description}, ${task.kid_name}, ${task.due_date})
    RETURNING
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
  `;
  return result[0] as Task;
}

export async function updateTask(id: number, task: Partial<Omit<Task, "id">>): Promise<Task | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET title = ${task.title !== undefined ? task.title : sql`title`},
        description = ${task.description !== undefined ? task.description : sql`description`},
        kid_name = ${task.kid_name !== undefined ? task.kid_name : sql`kid_name`},
        due_date = ${task.due_date !== undefined ? task.due_date : sql`due_date`},
        completed_on = ${task.completed_on !== undefined ? task.completed_on : sql`completed_on`},
        excused = ${task.excused !== undefined ? task.excused : sql`excused`}
    WHERE id = ${id}
    RETURNING
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
  `;
  return result.length > 0 ? (result[0] as Task) : null;
}

export async function deleteTask(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function toggleTaskComplete(id: number, completedOn: string | null): Promise<Task | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET completed_on = ${completedOn}::date
    WHERE id = ${id}
    RETURNING
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
  `;
  return result.length > 0 ? (result[0] as Task) : null;
}

// Delete a kid and all their associated data
export async function deleteKid(kidName: string): Promise<void> {
  const sql = getDb();

  await sql.transaction([
    sql`DELETE FROM incentive_claims WHERE kid_name = ${kidName}`,
    sql`DELETE FROM feedback WHERE kid_name = ${kidName}`,
    sql`DELETE FROM tasks WHERE kid_name = ${kidName}`,
    sql`DELETE FROM chore_schedules WHERE kid_name = ${kidName}`,
  ]);
}

// Add a new kid by creating a welcome task
export async function addKid(kidName: string, now?: Date): Promise<void> {
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
  const currentDate = now ?? (await getCurrentDate());
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(currentDate.getDate() + 1);
  const tomorrowStr = formatDateString(tomorrow);

  await sql`
    INSERT INTO tasks (title, description, kid_name, due_date)
    VALUES ('Welcome to Chorizo!', 'Mark this task complete when you are ready to start', ${kidName}, ${tomorrowStr})
  `;
}

// Feedback functions
export interface Feedback {
  id: number;
  kid_name: string;
  message: string;
  completed_at: Date | null;
  created_at: Date;
}

export async function getAllFeedback(): Promise<Feedback[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM feedback
    ORDER BY 
      CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END,
      created_at DESC
  `;
  return result as Feedback[];
}

export async function getIncompleteFeedback(): Promise<Feedback[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM feedback
    WHERE completed_at IS NULL
    ORDER BY created_at DESC
  `;
  return result as Feedback[];
}

export async function getCompletedFeedback(): Promise<Feedback[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM feedback
    WHERE completed_at IS NOT NULL
    ORDER BY completed_at DESC
  `;
  return result as Feedback[];
}

export async function addFeedback(kidName: string, message: string): Promise<Feedback> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO feedback (kid_name, message)
    VALUES (${kidName}, ${message})
    RETURNING *
  `;
  return result[0] as Feedback;
}

export async function markFeedbackComplete(id: number): Promise<Feedback | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE feedback
    SET completed_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as Feedback) : null;
}

export async function markFeedbackIncomplete(id: number): Promise<Feedback | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE feedback
    SET completed_at = NULL
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as Feedback) : null;
}

export async function deleteFeedback(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM feedback WHERE id = ${id}`;
}

// Excuse functions for chores
export async function excuseChore(
  scheduleId: number,
  scheduledOn: string,
  completedOn: string
): Promise<ChoreCompletion | null> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, excused)
    VALUES (${scheduleId}, ${scheduledOn}, ${completedOn}, true)
    ON CONFLICT (chore_schedule_id, scheduled_on)
    DO UPDATE SET excused = true, completed_on = ${completedOn}
    RETURNING *, scheduled_on::text, completed_on::text
  `;
  return result.length > 0 ? (result[0] as ChoreCompletion) : null;
}

export async function unexcuseChore(scheduleId: number, scheduledOn: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM chore_completions
    WHERE chore_schedule_id = ${scheduleId}
      AND scheduled_on = ${scheduledOn}
      AND excused = true
  `;
}

// Excuse functions for tasks
export async function excuseTask(taskId: number): Promise<Task | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET excused = true
    WHERE id = ${taskId}
    RETURNING
      id, title, description, kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on, excused
  `;
  return result.length > 0 ? (result[0] as Task) : null;
}

export async function unexcuseTask(taskId: number): Promise<Task | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET excused = false
    WHERE id = ${taskId}
    RETURNING
      id, title, description, kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on, excused
  `;
  return result.length > 0 ? (result[0] as Task) : null;
}

// Re-export types from qualification.ts for backwards compatibility
export type { RewardType, IncentiveClaim, QualificationStatus, MissedItem } from "./qualification";

async function getMondayOfWeek(date?: Date): Promise<string> {
  const d = date ?? (await getCurrentDate());
  return calculateMondayOfWeek(d);
}

export async function getWeeklyQualification(
  kidName: string,
  weekStart?: string,
  now?: Date
): Promise<QualificationStatus> {
  const sql = getDb();
  const currentDate = now ?? (await getCurrentDate());
  const mondayStr = weekStart || calculateMondayOfWeek(currentDate);
  const fridayStr = calculateChoreDate(mondayStr, "friday");
  const today = formatDateString(currentDate);

  // Get all chores for Mon-Fri of the week
  const chores = await sql`
    WITH week_schedules AS (
      SELECT
        cs.id as schedule_id,
        cs.kid_name,
        c.name as chore_name,
        c.flexible,
        cs.day_of_week,
        (${mondayStr}::date + (
          CASE cs.day_of_week
            WHEN 'monday' THEN 0
            WHEN 'tuesday' THEN 1
            WHEN 'wednesday' THEN 2
            WHEN 'thursday' THEN 3
            WHEN 'friday' THEN 4
            ELSE NULL
          END
        ) * INTERVAL '1 day')::date as scheduled_date
      FROM chore_schedules cs
      JOIN chores c ON cs.chore_id = c.id
      WHERE cs.kid_name = ${kidName}
        AND cs.day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
    )
    SELECT
      ws.*,
      cc.id as completion_id,
      cc.excused,
      cc.completed_on,
      CASE
        WHEN cc.id IS NOT NULL
          AND NOT ws.flexible
          AND cc.completed_on > ws.scheduled_date
        THEN true
        ELSE false
      END as is_late_completion
    FROM week_schedules ws
    LEFT JOIN chore_completions cc
      ON ws.schedule_id = cc.chore_schedule_id
      AND cc.scheduled_on = ws.scheduled_date
    WHERE ws.scheduled_date IS NOT NULL
  `;

  // Get all tasks due Mon-Fri of the week
  const tasks = await sql`
    SELECT
      id,
      title,
      kid_name,
      due_date::text as due_date,
      completed_on::text as completed_on,
      excused
    FROM tasks
    WHERE kid_name = ${kidName}
      AND due_date >= ${mondayStr}
      AND due_date <= ${fridayStr}
  `;

  // Get existing claim
  const claimResult = await sql`
    SELECT * FROM incentive_claims
    WHERE kid_name = ${kidName} AND week_start_date = ${mondayStr}
  `;
  const claim = claimResult.length > 0 ? (claimResult[0] as IncentiveClaim) : null;

  return calculateQualification({
    kidName,
    chores: chores as ChoreRow[],
    tasks: tasks as TaskRow[],
    today,
    fridayStr,
    existingClaim: claim,
  });
}

export async function claimIncentive(kidName: string, rewardType: RewardType): Promise<IncentiveClaim | null> {
  const sql = getDb();
  const mondayStr = await getMondayOfWeek();

  const result = await sql`
    INSERT INTO incentive_claims (kid_name, week_start_date, reward_type)
    VALUES (${kidName}, ${mondayStr}, ${rewardType})
    ON CONFLICT (kid_name, week_start_date)
    DO UPDATE SET reward_type = ${rewardType}, claimed_at = NOW()
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as IncentiveClaim) : null;
}

export async function getIncentiveClaim(kidName: string, weekStart?: string): Promise<IncentiveClaim | null> {
  const sql = getDb();
  const mondayStr = weekStart || (await getMondayOfWeek());

  const result = await sql`
    SELECT * FROM incentive_claims
    WHERE kid_name = ${kidName} AND week_start_date = ${mondayStr}
  `;
  return result.length > 0 ? (result[0] as IncentiveClaim) : null;
}

export async function dismissClaim(claimId: number): Promise<IncentiveClaim | null> {
  const sql = getDb();
  const result = await sql`
    UPDATE incentive_claims
    SET dismissed_at = NOW()
    WHERE id = ${claimId}
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as IncentiveClaim) : null;
}

export async function getAllIncentiveClaims(weekStart?: string): Promise<IncentiveClaim[]> {
  const sql = getDb();
  const mondayStr = weekStart || (await getMondayOfWeek());

  const result = await sql`
    SELECT * FROM incentive_claims
    WHERE week_start_date = ${mondayStr}
    ORDER BY claimed_at DESC
  `;
  return result as IncentiveClaim[];
}
