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
        kid_name VARCHAR(100) NOT NULL,
        day_of_week day_of_week NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create chore completions table
    await sql`
      CREATE TABLE chore_completions (
        id SERIAL PRIMARY KEY,
        chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
        completed_date DATE NOT NULL,
        completed_at TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        UNIQUE(chore_id, completed_date)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX idx_chores_kid_name ON chores(kid_name)`;
    await sql`CREATE INDEX idx_chores_day_of_week ON chores(day_of_week)`;
    await sql`CREATE INDEX idx_completions_date ON chore_completions(completed_date)`;
    await sql`CREATE INDEX idx_completions_chore_id ON chore_completions(chore_id)`;

    // Insert sample data
    const sampleChores = [
      ["Make bed", "Make your bed neatly", "Alex", "monday"],
      ["Make bed", "Make your bed neatly", "Alex", "tuesday"],
      ["Make bed", "Make your bed neatly", "Alex", "wednesday"],
      ["Make bed", "Make your bed neatly", "Alex", "thursday"],
      ["Make bed", "Make your bed neatly", "Alex", "friday"],
      ["Take out trash", "Take the kitchen trash to the outside bin", "Alex", "wednesday"],
      ["Take out trash", "Take the kitchen trash to the outside bin", "Alex", "saturday"],
      ["Clean room", "Pick up toys and clothes, organize desk", "Sam", "monday"],
      ["Clean room", "Pick up toys and clothes, organize desk", "Sam", "thursday"],
      ["Feed pet", "Feed and give fresh water", "Sam", "tuesday"],
      ["Feed pet", "Feed and give fresh water", "Sam", "thursday"],
      ["Feed pet", "Feed and give fresh water", "Sam", "saturday"],
    ];

    for (const [name, description, kid_name, day_of_week] of sampleChores) {
      await sql`
        INSERT INTO chores (name, description, kid_name, day_of_week)
        VALUES (${name}, ${description}, ${kid_name}, ${day_of_week})
      `;
    }

    console.log("✅ Database initialized successfully with sample data!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDb();
