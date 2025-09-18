/* eslint-env node */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load test environment
config({ path: ".env.test" });

const sql = neon(process.env.TEST_DATABASE_URL);

async function initTestDatabase() {
  try {
    console.log("🔄 Initializing test database...");

    // Read schema file
    const schema = readFileSync(resolve("schema.sql"), "utf-8");

    // Split and execute each statement
    const statements = schema
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      // Use sql.query for raw SQL strings
      await sql.query(statement + ";");
    }

    console.log("✅ Test database initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing test database:", error.message);
    process.exit(1);
  }
}

initTestDatabase();
