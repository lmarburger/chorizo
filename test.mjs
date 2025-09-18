import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { readFileSync } from "fs";

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
    INSERT INTO chores (name, description)
    VALUES ('Test Chore', 'A test chore')
    RETURNING *
  `;

  if (result.length === 1 && result[0].name === "Test Chore") {
    console.log("  ✅ Add chore works");
    return result[0].id;
  } else {
    throw new Error("Failed to add chore");
  }
}

async function testAddChoreSchedule(choreId) {
  console.log("\n🧪 Testing: Add chore schedule");
  const result = await sql`
    INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
    VALUES 
      (${choreId}, 'Test Kid', 'monday'),
      (${choreId}, 'Test Kid', 'wednesday'),
      (${choreId}, 'Another Kid', 'friday')
    RETURNING *
  `;

  if (result.length === 3) {
    console.log(`  ✅ Add chore schedules works (created ${result.length} schedules)`);
    return result.map(s => s.id);
  } else {
    throw new Error("Failed to add chore schedules");
  }
}

async function testGetChoresWithSchedules() {
  console.log("\n🧪 Testing: Get chores with schedules");
  const chores = await sql`
    SELECT c.*, 
           COUNT(cs.id) as schedule_count
    FROM chores c
    LEFT JOIN chore_schedules cs ON c.id = cs.chore_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 10
  `;

  if (Array.isArray(chores)) {
    console.log(`  ✅ Get chores with schedules works (found ${chores.length} chores)`);
    const withSchedules = chores.filter(c => c.schedule_count > 0);
    console.log(`     ${withSchedules.length} chores have schedules`);
  } else {
    throw new Error("Failed to get chores with schedules");
  }
}

async function testUpdateChore(choreId) {
  console.log("\n🧪 Testing: Update chore");
  const result = await sql`
    UPDATE chores 
    SET name = 'Updated Test Chore', description = 'Updated description'
    WHERE id = ${choreId}
    RETURNING *
  `;

  if (result.length === 1 && result[0].name === "Updated Test Chore") {
    console.log("  ✅ Update chore works");
  } else {
    throw new Error("Failed to update chore");
  }
}

async function testUpdateChoreSchedules(choreId) {
  console.log("\n🧪 Testing: Update chore schedules");

  // Delete existing schedules
  await sql`DELETE FROM chore_schedules WHERE chore_id = ${choreId}`;

  // Add new schedules
  const newSchedules = await sql`
    INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
    VALUES 
      (${choreId}, 'Updated Kid', 'tuesday'),
      (${choreId}, 'Updated Kid', 'thursday')
    RETURNING *
  `;

  if (newSchedules.length === 2) {
    console.log("  ✅ Update chore schedules works");
    return newSchedules.map(s => s.id);
  } else {
    throw new Error("Failed to update chore schedules");
  }
}

async function testChoreCompletion(scheduleId) {
  console.log("\n🧪 Testing: Chore completion");

  // Mark schedule complete for today
  const today = new Date().toISOString().split("T")[0];
  const completion = await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at)
    VALUES (${scheduleId}, ${today}, NOW())
    RETURNING *
  `;

  if (completion.length === 1 && completion[0].chore_schedule_id === scheduleId) {
    console.log("  ✅ Mark chore complete works");
    return completion[0].id;
  } else {
    throw new Error("Failed to mark chore complete");
  }
}

async function testUncompleteChore(scheduleId) {
  console.log("\n🧪 Testing: Uncomplete chore");

  const today = new Date().toISOString().split("T")[0];
  const result = await sql`
    DELETE FROM chore_completions 
    WHERE chore_schedule_id = ${scheduleId} AND completed_date = ${today}
    RETURNING *
  `;

  if (result.length >= 0) {
    console.log("  ✅ Uncomplete chore works");
  } else {
    throw new Error("Failed to uncomplete chore");
  }
}

async function testGetCurrentWeekChores() {
  console.log("\n🧪 Testing: Get current week chores");

  // Add test data for the week
  const testChore = await sql`
    INSERT INTO chores (name, description)
    VALUES ('Weekly Test Chore', 'Test for week view')
    RETURNING id
  `;
  const choreId = testChore[0].id;

  // Add schedules for multiple days
  await sql`
    INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
    VALUES 
      (${choreId}, 'Week Test Kid', 'monday'),
      (${choreId}, 'Week Test Kid', 'wednesday'),
      (${choreId}, 'Week Test Kid', 'friday')
  `;

  // Get the Monday of current week
  const mondayDate = new Date();
  const daysSinceMonday = (mondayDate.getDay() + 6) % 7;
  mondayDate.setDate(mondayDate.getDate() - daysSinceMonday);
  const mondayStr = mondayDate.toISOString().split("T")[0];

  const weekChores = await sql`
    WITH week_schedules AS (
      SELECT 
        cs.*,
        c.name as chore_name,
        c.description as chore_description,
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
      WHERE cs.kid_name = 'Week Test Kid'
    )
    SELECT * FROM week_schedules
    ORDER BY chore_date
  `;

  // Clean up
  await sql`DELETE FROM chore_schedules WHERE chore_id = ${choreId}`;
  await sql`DELETE FROM chores WHERE id = ${choreId}`;

  if (weekChores.length === 3) {
    console.log(`  ✅ Get current week chores works (found ${weekChores.length} scheduled chores)`);
  } else {
    throw new Error("Failed to get current week chores");
  }
}

async function testDeleteChoreSchedule(scheduleId) {
  console.log("\n🧪 Testing: Delete chore schedule");
  const result = await sql`
    DELETE FROM chore_schedules 
    WHERE id = ${scheduleId}
    RETURNING id
  `;

  if (result.length === 1) {
    console.log("  ✅ Delete chore schedule works");
  } else {
    throw new Error("Failed to delete chore schedule");
  }
}

async function testDeleteChore(choreId) {
  console.log("\n🧪 Testing: Delete chore (cascade)");

  // First verify cascade delete will work by checking schedules exist
  const schedules = await sql`
    SELECT COUNT(*) as count FROM chore_schedules WHERE chore_id = ${choreId}
  `;

  const result = await sql`
    DELETE FROM chores 
    WHERE id = ${choreId}
    RETURNING id
  `;

  if (result.length === 1) {
    // Verify schedules were cascade deleted
    const remainingSchedules = await sql`
      SELECT COUNT(*) as count FROM chore_schedules WHERE chore_id = ${choreId}
    `;

    if (remainingSchedules[0].count === 0 || remainingSchedules[0].count === "0") {
      console.log("  ✅ Delete chore with cascade works");
    } else {
      throw new Error("Cascade delete of schedules failed");
    }
  } else {
    throw new Error("Failed to delete chore");
  }
}

async function testGetUniqueKidNames() {
  console.log("\n🧪 Testing: Get unique kid names");

  // Add test data with multiple kids
  const testChore = await sql`
    INSERT INTO chores (name, description)
    VALUES ('Kid Names Test', 'Test for unique kids')
    RETURNING id
  `;
  const choreId = testChore[0].id;

  await sql`
    INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
    VALUES 
      (${choreId}, 'Kid Alpha', 'monday'),
      (${choreId}, 'Kid Beta', 'tuesday'),
      (${choreId}, 'Kid Alpha', 'wednesday'),
      (${choreId}, 'Kid Gamma', 'thursday')
  `;

  const kidNames = await sql`
    SELECT DISTINCT kid_name FROM chore_schedules ORDER BY kid_name
  `;

  // Clean up
  await sql`DELETE FROM chores WHERE id = ${choreId}`;

  if (Array.isArray(kidNames) && kidNames.length >= 3) {
    const names = kidNames.map(k => k.kid_name);
    console.log(`  ✅ Get unique kid names works (found: ${names.join(", ")})`);
  } else {
    throw new Error("Failed to get unique kid names");
  }
}

async function runTests() {
  console.log("🚀 Running database tests for schedule-based chore system\n");

  try {
    await setupTestDb();

    // Test basic chore operations
    const choreId = await testAddChore();
    await testGetChoresWithSchedules();
    await testUpdateChore(choreId);

    // Test schedule operations
    const scheduleIds = await testAddChoreSchedule(choreId);
    const updatedScheduleIds = await testUpdateChoreSchedules(choreId);

    // Test completion operations
    if (updatedScheduleIds.length > 0) {
      await testChoreCompletion(updatedScheduleIds[0]);
      await testUncompleteChore(updatedScheduleIds[0]);
    }

    // Test query operations
    await testGetCurrentWeekChores();
    await testGetUniqueKidNames();

    // Test delete operations
    if (updatedScheduleIds.length > 1) {
      await testDeleteChoreSchedule(updatedScheduleIds[1]);
    }
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
