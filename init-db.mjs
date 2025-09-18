import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: ".env.local" });

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("Initializing database...");

    // Drop existing tables
    await sql`DROP TABLE IF EXISTS chore_completions CASCADE`;
    await sql`DROP TABLE IF EXISTS chore_schedules CASCADE`;
    await sql`DROP TABLE IF EXISTS chores CASCADE`;
    await sql`DROP TYPE IF EXISTS day_of_week CASCADE`;

    // Create enum for days of the week
    await sql`CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`;

    // Create chores table
    await sql`
      CREATE TABLE chores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name)
      )
    `;

    // Create chore schedules table
    await sql`
      CREATE TABLE chore_schedules (
        id SERIAL PRIMARY KEY,
        chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
        kid_name VARCHAR(100) NOT NULL,
        day_of_week day_of_week NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(chore_id, kid_name, day_of_week)
      )
    `;

    // Create chore completions table
    await sql`
      CREATE TABLE chore_completions (
        id SERIAL PRIMARY KEY,
        chore_schedule_id INTEGER NOT NULL REFERENCES chore_schedules(id) ON DELETE CASCADE,
        completed_date DATE NOT NULL,
        completed_at TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        UNIQUE(chore_schedule_id, completed_date)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX idx_schedules_kid_name ON chore_schedules(kid_name)`;
    await sql`CREATE INDEX idx_schedules_day_of_week ON chore_schedules(day_of_week)`;
    await sql`CREATE INDEX idx_schedules_chore_id ON chore_schedules(chore_id)`;
    await sql`CREATE INDEX idx_completions_date ON chore_completions(completed_date)`;
    await sql`CREATE INDEX idx_completions_schedule_id ON chore_completions(chore_schedule_id)`;

    // Insert sample chores
    const chores = [
      { name: "Make bed", description: "Make your bed neatly" },
      { name: "Take out trash", description: "Take the kitchen trash to the outside bin" },
      { name: "Clean room", description: "Pick up toys and clothes, organize desk" },
      { name: "Feed pet", description: "Feed and give fresh water" },
      { name: "Do the dishes", description: "Wash, dry, and put away dishes" },
      { name: "Practice piano", description: "Practice for at least 30 minutes" },
    ];

    const choreIds = {};
    for (const chore of chores) {
      const result = await sql`
        INSERT INTO chores (name, description)
        VALUES (${chore.name}, ${chore.description})
        RETURNING id
      `;
      choreIds[chore.name] = result[0].id;
    }

    // Insert sample schedules
    const schedules = [
      // Make bed - Alex Monday through Friday
      { chore: "Make bed", kid: "Alex", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
      // Take out trash - Alex on Wednesday and Saturday
      { chore: "Take out trash", kid: "Alex", days: ["wednesday", "saturday"] },
      // Clean room - Sam on Monday and Thursday
      { chore: "Clean room", kid: "Sam", days: ["monday", "thursday"] },
      // Feed pet - Sam on Tuesday, Thursday, and Saturday
      { chore: "Feed pet", kid: "Sam", days: ["tuesday", "thursday", "saturday"] },
      // Do the dishes - alternating between kids
      { chore: "Do the dishes", kid: "Alex", days: ["monday", "wednesday", "friday", "sunday"] },
      { chore: "Do the dishes", kid: "Sam", days: ["tuesday", "thursday", "saturday"] },
      // Practice piano - both kids Monday through Friday
      { chore: "Practice piano", kid: "Alex", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
      { chore: "Practice piano", kid: "Sam", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
    ];

    for (const schedule of schedules) {
      const choreId = choreIds[schedule.chore];
      for (const day of schedule.days) {
        await sql`
          INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
          VALUES (${choreId}, ${schedule.kid}, ${day})
        `;
      }
    }

    console.log("✅ Database initialized successfully with sample data!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDb();
