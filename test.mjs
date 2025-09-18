import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";

// Load test environment
dotenv.config({ path: ".env.test" });

const sql = neon(process.env.TEST_DATABASE_URL);

async function setupTestDb() {
  console.log("📦 Setting up test database...");
  const schema = readFileSync("schema.sql", "utf-8");
  const statements = schema.split(";").filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      await sql.query(statement + ";");
    }
  }
  console.log("✅ Test database ready");
}

async function testAddChore() {
  console.log("\n🧪 Testing: Add new chore");
  const result = await sql`
    INSERT INTO chores (name, description, kid_name, day_of_week)
    VALUES ('Test Chore', 'A test chore', 'Test Kid', 'monday')
    RETURNING *
  `;

  if (result.length === 1 && result[0].name === "Test Chore") {
    console.log("  ✅ Add chore works");
    return result[0].id;
  } else {
    throw new Error("Failed to add chore");
  }
}

async function testGetChores() {
  console.log("\n🧪 Testing: Get chores");
  const result = await sql`
    SELECT * FROM chores ORDER BY created_at DESC LIMIT 10
  `;

  if (Array.isArray(result)) {
    console.log(`  ✅ Get chores works (found ${result.length} chores)`);
  } else {
    throw new Error("Failed to get chores");
  }
}

async function testUpdateChore(choreId) {
  console.log("\n🧪 Testing: Update chore");
  const result = await sql`
    UPDATE chores 
    SET name = 'Updated Test Chore'
    WHERE id = ${choreId}
    RETURNING *
  `;

  if (result.length === 1 && result[0].name === "Updated Test Chore") {
    console.log("  ✅ Update chore works");
  } else {
    throw new Error("Failed to update chore");
  }
}

async function testDeleteChore(choreId) {
  console.log("\n🧪 Testing: Delete chore");
  const result = await sql`
    DELETE FROM chores 
    WHERE id = ${choreId}
    RETURNING id
  `;

  if (result.length === 1) {
    console.log("  ✅ Delete chore works");
  } else {
    throw new Error("Failed to delete chore");
  }
}

async function testChoreCompletion() {
  console.log("\n🧪 Testing: Chore completion");

  // First add a test chore
  const chore = await sql`
    INSERT INTO chores (name, description, kid_name, day_of_week)
    VALUES ('Completion Test', 'Test completion', 'Test Kid', 'monday')
    RETURNING id
  `;
  const choreId = chore[0].id;

  // Mark it complete
  const completion = await sql`
    INSERT INTO chore_completions (chore_id, completed_date, completed_at)
    VALUES (${choreId}, CURRENT_DATE, NOW())
    RETURNING *
  `;

  if (completion.length === 1 && completion[0].chore_id === choreId) {
    console.log("  ✅ Mark chore complete works");
  } else {
    throw new Error("Failed to mark chore complete");
  }

  // Clean up
  await sql`DELETE FROM chore_completions WHERE chore_id = ${choreId}`;
  await sql`DELETE FROM chores WHERE id = ${choreId}`;
}

async function runTests() {
  console.log("🚀 Running simple database tests\n");

  try {
    await setupTestDb();

    const choreId = await testAddChore();
    await testGetChores();
    await testUpdateChore(choreId);
    await testChoreCompletion();
    await testDeleteChore(choreId);

    console.log("\n✨ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
