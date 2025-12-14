import { neon } from "@neondatabase/serverless";
import { getCurrentDate } from "./time-server";
import { formatDateString } from "./date-utils";

const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  flexible: boolean;
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
  excused: boolean;
}

export interface ChoreScheduleWithCompletion extends ChoreScheduleWithChore {
  is_completed: boolean;
  completion_id?: number;
  completed_at?: Date;
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

export async function getCurrentWeekChores(): Promise<ChoreScheduleWithCompletion[]> {
  const sql = getDb();

  // Get the Monday of current week
  const now = await getCurrentDate();
  const mondayDate = new Date(now);
  const daysSinceMonday = (mondayDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  mondayDate.setDate(mondayDate.getDate() - daysSinceMonday);
  const mondayStr = formatDateString(mondayDate);

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
      COALESCE(cc.excused, false) as excused,
      CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as is_completed,
      CASE
        WHEN cc.id IS NOT NULL
          AND NOT ws.flexible
          AND (cc.completed_at AT TIME ZONE ${TIMEZONE})::date > ws.chore_date
        THEN true
        ELSE false
      END as is_late_completion
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

export async function addChore(
  chore: Omit<Chore, "id" | "created_at" | "updated_at" | "flexible"> & { flexible?: boolean }
): Promise<Chore> {
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
  chore: Omit<Chore, "id" | "created_at" | "updated_at" | "flexible"> & { flexible?: boolean }
): Promise<Chore> {
  const sql = getDb();
  const result = await sql`
    UPDATE chores
    SET name = ${chore.name},
        description = ${chore.description},
        flexible = ${chore.flexible ?? true},
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

export async function completeChore(
  scheduleId: number,
  date: string,
  notes?: string,
  completedAt?: Date
): Promise<ChoreCompletion> {
  const sql = getDb();
  const completedAtStr = completedAt ? completedAt.toISOString() : null;
  const result = await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at, notes)
    VALUES (${scheduleId}, ${date}, COALESCE(${completedAtStr}::timestamptz, NOW()), ${notes})
    ON CONFLICT (chore_schedule_id, completed_date)
    DO UPDATE SET completed_at = COALESCE(${completedAtStr}::timestamptz, NOW()), notes = ${notes}
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
  excused_at: Date | null;
  created_at: Date;
  updated_at: Date;
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
      completed_at,
      excused_at,
      created_at,
      updated_at
    FROM tasks
    ORDER BY
      CASE WHEN completed_at IS NULL AND excused_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function getTasksForKid(kidName: string): Promise<Task[]> {
  const sql = getDb();
  const weekStart = await getMondayOfWeek();
  const weekStartTimestamp = `${weekStart}T00:00:00`;

  const result = await sql`
    SELECT
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_at,
      excused_at,
      created_at,
      updated_at
    FROM tasks
    WHERE kid_name = ${kidName}
      AND (
        (completed_at IS NULL AND excused_at IS NULL)
        OR completed_at >= ${weekStartTimestamp}::timestamp
        OR excused_at >= ${weekStartTimestamp}::timestamp
      )
    ORDER BY
      CASE WHEN completed_at IS NULL AND excused_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function getTasksForParentView(): Promise<Task[]> {
  const sql = getDb();
  const now = await getCurrentDate();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const result = await sql`
    SELECT
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_at,
      excused_at,
      created_at,
      updated_at
    FROM tasks
    WHERE (completed_at IS NULL AND excused_at IS NULL)
       OR completed_at >= ${oneWeekAgo.toISOString()}
       OR excused_at >= ${oneWeekAgo.toISOString()}
    ORDER BY
      CASE WHEN completed_at IS NULL AND excused_at IS NULL THEN 0 ELSE 1 END,
      due_date ASC,
      completed_at DESC
  `;
  return result as Task[];
}

export async function addTask(
  task: Omit<Task, "id" | "completed_at" | "excused_at" | "created_at" | "updated_at">
): Promise<Task> {
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
      completed_at,
      excused_at,
      created_at,
      updated_at
  `;
  return result[0] as Task;
}

export async function updateTask(
  id: number,
  task: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET title = ${task.title || sql`title`},
        description = ${task.description !== undefined ? task.description : sql`description`},
        kid_name = ${task.kid_name || sql`kid_name`},
        due_date = ${task.due_date || sql`due_date`},
        completed_at = ${task.completed_at !== undefined ? task.completed_at : sql`completed_at`},
        excused_at = ${task.excused_at !== undefined ? task.excused_at : sql`excused_at`},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      title,
      description,
      kid_name,
      due_date::text as due_date,
      completed_at,
      excused_at,
      created_at,
      updated_at
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
  const now = await getCurrentDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
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

export async function markFeedbackComplete(id: number): Promise<Feedback> {
  const sql = getDb();
  const result = await sql`
    UPDATE feedback
    SET completed_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Feedback;
}

export async function markFeedbackIncomplete(id: number): Promise<Feedback> {
  const sql = getDb();
  const result = await sql`
    UPDATE feedback
    SET completed_at = NULL
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Feedback;
}

export async function deleteFeedback(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM feedback WHERE id = ${id}`;
}

// Excuse functions for chores
export async function excuseChore(scheduleId: number, date: string): Promise<ChoreCompletion> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, excused)
    VALUES (${scheduleId}, ${date}, true)
    ON CONFLICT (chore_schedule_id, completed_date)
    DO UPDATE SET excused = true, completed_at = NOW()
    RETURNING *
  `;
  return result[0] as ChoreCompletion;
}

export async function unexcuseChore(scheduleId: number, date: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM chore_completions
    WHERE chore_schedule_id = ${scheduleId}
      AND completed_date = ${date}
      AND excused = true
  `;
}

// Excuse functions for tasks
export async function excuseTask(taskId: number): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET excused_at = NOW(), updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING
      id, title, description, kid_name,
      due_date::text as due_date,
      completed_at, excused_at, created_at, updated_at
  `;
  return result[0] as Task;
}

export async function unexcuseTask(taskId: number): Promise<Task> {
  const sql = getDb();
  const result = await sql`
    UPDATE tasks
    SET excused_at = NULL, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING
      id, title, description, kid_name,
      due_date::text as due_date,
      completed_at, excused_at, created_at, updated_at
  `;
  return result[0] as Task;
}

// Incentive claims types and functions
export type RewardType = "screen_time" | "money";

export interface IncentiveClaim {
  id: number;
  kid_name: string;
  week_start_date: string;
  reward_type: RewardType;
  claimed_at: Date;
  dismissed_at: Date | null;
}

export interface QualificationStatus {
  qualified: boolean;
  disqualified: boolean;
  inProgress: boolean;
  missedItems: MissedItem[];
  claim: IncentiveClaim | null;
}

export interface MissedItem {
  type: "chore" | "task";
  id: number;
  name: string;
  scheduledDate: string;
  kidName: string;
}

async function getMondayOfWeek(date?: Date): Promise<string> {
  const d = new Date(date ?? (await getCurrentDate()));
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return formatDateString(d);
}

function getFridayOfWeek(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  monday.setDate(monday.getDate() + 4);
  return formatDateString(monday);
}

export async function getWeeklyQualification(kidName: string, weekStart?: string): Promise<QualificationStatus> {
  const sql = getDb();
  const mondayStr = weekStart || (await getMondayOfWeek());
  const fridayStr = getFridayOfWeek(mondayStr);
  const today = formatDateString(await getCurrentDate());

  // Get all chores for Mon-Fri of the week
  const chores = await sql`
    WITH week_schedules AS (
      SELECT
        cs.id as schedule_id,
        cs.kid_name,
        c.name as chore_name,
        c.flexible,
        cs.day_of_week,
        DATE(${mondayStr}::date + (
          CASE cs.day_of_week
            WHEN 'monday' THEN 0
            WHEN 'tuesday' THEN 1
            WHEN 'wednesday' THEN 2
            WHEN 'thursday' THEN 3
            WHEN 'friday' THEN 4
            ELSE NULL
          END
        ) * INTERVAL '1 day') as scheduled_date
      FROM chore_schedules cs
      JOIN chores c ON cs.chore_id = c.id
      WHERE cs.kid_name = ${kidName}
        AND cs.day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
    )
    SELECT
      ws.*,
      cc.id as completion_id,
      cc.excused,
      cc.completed_at,
      CASE
        WHEN cc.id IS NOT NULL
          AND NOT ws.flexible
          AND (cc.completed_at AT TIME ZONE ${TIMEZONE})::date > ws.scheduled_date
        THEN true
        ELSE false
      END as is_late_completion
    FROM week_schedules ws
    LEFT JOIN chore_completions cc
      ON ws.schedule_id = cc.chore_schedule_id
      AND cc.completed_date = ws.scheduled_date
    WHERE ws.scheduled_date IS NOT NULL
  `;

  // Get all tasks due Mon-Fri of the week
  const tasks = await sql`
    SELECT
      id,
      title,
      kid_name,
      due_date::text as due_date,
      completed_at,
      excused_at
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

  const missedItems: MissedItem[] = [];
  let isDisqualified = false;

  // Check fixed chores - must be done on their scheduled day
  for (const chore of chores) {
    if (chore.flexible) continue;
    const scheduledDate = chore.scheduled_date;
    const isPast = scheduledDate < today;
    const isCompleted = chore.completion_id !== null && !chore.excused;
    const isExcused = chore.excused === true;
    const isLateCompletion = chore.is_late_completion === true;

    // Disqualify if: missed (past and not completed) OR completed late (unless excused)
    if ((isPast && !isCompleted && !isExcused) || (isLateCompletion && !isExcused)) {
      isDisqualified = true;
      missedItems.push({
        type: "chore",
        id: chore.schedule_id,
        name: chore.chore_name,
        scheduledDate: scheduledDate,
        kidName: kidName,
      });
    }
  }

  // Check flexible chores - can be done any day, check at end of Friday
  const isFridayOrLater = today >= fridayStr;
  if (isFridayOrLater) {
    for (const chore of chores) {
      if (!chore.flexible) continue;
      const isCompleted = chore.completion_id !== null && !chore.excused;
      const isExcused = chore.excused === true;

      if (!isCompleted && !isExcused) {
        isDisqualified = true;
        missedItems.push({
          type: "chore",
          id: chore.schedule_id,
          name: chore.chore_name,
          scheduledDate: chore.scheduled_date,
          kidName: kidName,
        });
      }
    }
  }

  // Check tasks - must be done by due date
  for (const task of tasks) {
    const dueDate = task.due_date;
    const isPast = dueDate < today;
    const isCompleted = task.completed_at !== null;
    const isExcused = task.excused_at !== null;

    if (isPast && !isCompleted && !isExcused) {
      isDisqualified = true;
      missedItems.push({
        type: "task",
        id: task.id,
        name: task.title,
        scheduledDate: dueDate,
        kidName: kidName,
      });
    }
  }

  // Calculate if all items are complete (qualified)
  const allChoresComplete = chores.every(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.completion_id !== null || c.excused === true
  );
  const allTasksComplete = tasks.every(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.completed_at !== null || t.excused_at !== null
  );
  const isQualified = !isDisqualified && allChoresComplete && allTasksComplete;
  const inProgress = !isDisqualified && !isQualified;

  return {
    qualified: isQualified,
    disqualified: isDisqualified,
    inProgress,
    missedItems,
    claim,
  };
}

export async function claimIncentive(kidName: string, rewardType: RewardType): Promise<IncentiveClaim> {
  const sql = getDb();
  const mondayStr = await getMondayOfWeek();

  const result = await sql`
    INSERT INTO incentive_claims (kid_name, week_start_date, reward_type)
    VALUES (${kidName}, ${mondayStr}, ${rewardType})
    ON CONFLICT (kid_name, week_start_date)
    DO UPDATE SET reward_type = ${rewardType}, claimed_at = NOW()
    RETURNING *
  `;
  return result[0] as IncentiveClaim;
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

export async function dismissClaim(claimId: number): Promise<IncentiveClaim> {
  const sql = getDb();
  const result = await sql`
    UPDATE incentive_claims
    SET dismissed_at = NOW()
    WHERE id = ${claimId}
    RETURNING *
  `;
  return result[0] as IncentiveClaim;
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
