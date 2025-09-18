/* global process, console */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

try {
  // Create feedback table
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      kid_name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_kid_name ON feedback(kid_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_completed ON feedback(completed_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)`;

  console.log("Feedback table created successfully");
} catch (error) {
  console.error("Error creating feedback table:", error);
}
