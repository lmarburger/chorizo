import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    console.log("Running incentives migration...");

    // Add flexible column to chores table
    console.log("Adding flexible column to chores...");
    await sql`
      ALTER TABLE chores
      ADD COLUMN IF NOT EXISTS flexible BOOLEAN DEFAULT true
    `;

    // Add excused column to chore_completions table
    console.log("Adding excused column to chore_completions...");
    await sql`
      ALTER TABLE chore_completions
      ADD COLUMN IF NOT EXISTS excused BOOLEAN DEFAULT false
    `;

    // Add excused_at column to tasks table
    console.log("Adding excused_at column to tasks...");
    await sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS excused_at TIMESTAMPTZ
    `;

    // Create incentive_claims table
    console.log("Creating incentive_claims table...");
    await sql`
      CREATE TABLE IF NOT EXISTS incentive_claims (
        id SERIAL PRIMARY KEY,
        kid_name VARCHAR(100) NOT NULL,
        week_start_date DATE NOT NULL,
        reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('screen_time', 'money')),
        claimed_at TIMESTAMPTZ DEFAULT NOW(),
        dismissed_at TIMESTAMPTZ,
        UNIQUE(kid_name, week_start_date)
      )
    `;

    // Create indexes
    console.log("Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_claims_kid_name ON incentive_claims(kid_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_claims_week ON incentive_claims(week_start_date)`;

    // Update existing chores to have sensible defaults for flexible
    console.log("Setting fixed chores (Make bed, Take out trash, Feed pet, Do the dishes)...");
    await sql`
      UPDATE chores
      SET flexible = false
      WHERE name IN ('Make bed', 'Take out trash', 'Feed pet', 'Do the dishes')
    `;

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
