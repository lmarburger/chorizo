import { neon } from "@neondatabase/serverless";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  kid_name: string;
  day_of_week: DayOfWeek;
  created_at: Date;
  updated_at: Date;
}

export interface ChoreCompletion {
  id: number;
  chore_id: number;
  completed_date: string;
  completed_at: Date;
  notes: string | null;
}

export interface ChoreWithCompletion extends Chore {
  is_completed: boolean;
  completion_id?: number;
}

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export async function getAllChores(): Promise<Chore[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM chores 
    ORDER BY kid_name, 
      CASE day_of_week
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
      END
  `;
  return result as Chore[];
}

export async function getChoresForKid(kidName: string): Promise<Chore[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM chores 
    WHERE kid_name = ${kidName}
    ORDER BY 
      CASE day_of_week
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
      END
  `;
  return result as Chore[];
}

export async function getTodayAndOverdueChores(): Promise<ChoreWithCompletion[]> {
  const sql = getDb();
  // const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format - unused for now
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() as DayOfWeek;
  const currentDayNumber = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(
    currentDay
  );

  // Get the Monday of current week
  const mondayDate = new Date();
  const daysSinceMonday = (mondayDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  mondayDate.setDate(mondayDate.getDate() - daysSinceMonday);
  const mondayStr = mondayDate.toLocaleDateString("en-CA");

  const result = await sql`
    WITH week_chores AS (
      SELECT 
        c.*,
        CASE c.day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END as day_number,
        DATE(${mondayStr}::date + (
          CASE c.day_of_week
            WHEN 'monday' THEN 0
            WHEN 'tuesday' THEN 1
            WHEN 'wednesday' THEN 2
            WHEN 'thursday' THEN 3
            WHEN 'friday' THEN 4
            WHEN 'saturday' THEN 5
            WHEN 'sunday' THEN 6
          END
        ) * INTERVAL '1 day') as chore_date
      FROM chores c
    )
    SELECT 
      wc.*,
      cc.id as completion_id,
      CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as is_completed
    FROM week_chores wc
    LEFT JOIN chore_completions cc 
      ON wc.id = cc.chore_id 
      AND cc.completed_date = wc.chore_date
    WHERE wc.day_number <= ${currentDayNumber === 0 ? 7 : currentDayNumber}
    ORDER BY wc.kid_name, wc.day_number
  `;

  return result as ChoreWithCompletion[];
}

export async function addChore(chore: Omit<Chore, "id" | "created_at" | "updated_at">): Promise<Chore> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chores (name, description, kid_name, day_of_week)
    VALUES (${chore.name}, ${chore.description}, ${chore.kid_name}, ${chore.day_of_week})
    RETURNING *
  `;
  return result[0] as Chore;
}

export async function deleteChore(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM chores WHERE id = ${id}`;
}

export async function completeChore(choreId: number, date: string, notes?: string): Promise<ChoreCompletion> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO chore_completions (chore_id, completed_date, notes)
    VALUES (${choreId}, ${date}, ${notes})
    ON CONFLICT (chore_id, completed_date) 
    DO UPDATE SET completed_at = NOW(), notes = ${notes}
    RETURNING *
  `;
  return result[0] as ChoreCompletion;
}

export async function uncompleteChore(choreId: number, date: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM chore_completions 
    WHERE chore_id = ${choreId} AND completed_date = ${date}
  `;
}

export async function getUniqueKidNames(): Promise<string[]> {
  const sql = getDb();
  const result = await sql`
    SELECT DISTINCT kid_name FROM chores ORDER BY kid_name
  `;
  return result.map(r => r.kid_name) as string[];
}
