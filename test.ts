import { config } from "dotenv";
import assert from "assert";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load test environment
config({ path: ".env.test" });

// Override DATABASE_URL with TEST_DATABASE_URL for testing
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Import the actual application functions we want to test
import {
  addChore,
  getAllChoresWithSchedules,
  updateChore,
  deleteChore,
  addChoreSchedule,
  updateChoreSchedules,
  getCurrentWeekChores,
  completeChore,
  uncompleteChore,
  getUniqueKidNames,
  getAllTasks,
  getTasksForKid,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  type DayOfWeek,
} from "./app/lib/db";

// Setup function to completely reset and initialize test database
async function resetTestDatabase() {
  // Use the same DATABASE_URL that the imported functions use (now overridden to test DB)
  const sql = neon(process.env.DATABASE_URL!);

  // Drop all tables first to ensure clean state
  await sql`DROP TABLE IF EXISTS chore_completions CASCADE`;
  await sql`DROP TABLE IF EXISTS chore_schedules CASCADE`;
  await sql`DROP TABLE IF EXISTS chores CASCADE`;
  await sql`DROP TABLE IF EXISTS tasks CASCADE`;
  await sql`DROP TYPE IF EXISTS day_of_week CASCADE`;

  // Read and clean the schema
  const schema = readFileSync("schema.sql", "utf-8");

  // Find where sample data starts - look for the comment that precedes sample data
  const sampleDataMarker = "-- Sample data for testing";
  const sampleDataIndex = schema.indexOf(sampleDataMarker);

  // If sample data marker found, only use schema before it, otherwise use whole schema
  const schemaWithoutSampleData = sampleDataIndex > -1 ? schema.substring(0, sampleDataIndex).trim() : schema;

  // Split into statements and execute
  const statements = schemaWithoutSampleData.split(";").filter(s => s.trim());

  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
      await sql.query(trimmedStatement + ";");
    }
  }
}

// Helper functions for dates
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getDayString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

// Test: Adding and retrieving a chore with schedules
async function testAddChoreWithSchedules() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Add chore with schedules");

  // Add a chore with unique name
  const uniqueName = `Test Chore ${Date.now()}`;
  const newChore = await addChore({
    name: uniqueName,
    description: "A test chore",
  });

  assert(newChore.id, "Should return chore with ID");
  assert.equal(newChore.name, uniqueName);

  // Add schedules
  await addChoreSchedule(newChore.id, "Test Kid", "monday" as DayOfWeek);
  await addChoreSchedule(newChore.id, "Test Kid", "wednesday" as DayOfWeek);
  await addChoreSchedule(newChore.id, "Another Kid", "friday" as DayOfWeek);

  // Verify the chore and schedules
  const chores = await getAllChoresWithSchedules();
  console.log(`   Found ${chores.length} chores after adding one`);
  if (chores.length > 1) {
    console.log("   Unexpected chores found:");
    chores.forEach(c => console.log(`     - ${c.name}: ${c.description}`));
  }
  assert.equal(chores.length, 1, "Should have exactly 1 chore");
  assert.equal(chores[0].schedules.length, 3, "Should have 3 schedules");

  console.log("  ✅ Add chore with schedules works");
}

// Test: Updating a chore
async function testUpdateChore() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Update chore");

  // Create initial chore with schedules
  const chore = await addChore({
    name: "Original Chore",
    description: "Original description",
  });
  await addChoreSchedule(chore.id, "Kid A", "monday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Kid A", "tuesday" as DayOfWeek);

  // Update the chore details
  const updated = await updateChore(chore.id, {
    name: "Updated Chore",
    description: "Updated description",
  });

  assert.equal(updated.name, "Updated Chore");
  assert.equal(updated.description, "Updated description");

  console.log("  ✅ Update chore works");
}

// Test: Update chore schedules
async function testUpdateChoreSchedules() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Update chore schedules");

  // Create chore with initial schedules
  const chore = await addChore({
    name: "Schedule Test Chore",
    description: "Testing schedule updates",
  });
  await addChoreSchedule(chore.id, "Kid A", "monday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Kid A", "tuesday" as DayOfWeek);

  // Update schedules (this replaces all existing schedules)
  await updateChoreSchedules(chore.id, [
    { kid_name: "Kid B", day_of_week: "wednesday" as DayOfWeek },
    { kid_name: "Kid B", day_of_week: "thursday" as DayOfWeek },
    { kid_name: "Kid C", day_of_week: "friday" as DayOfWeek },
  ]);

  const chores = await getAllChoresWithSchedules();
  const updatedChore = chores.find(c => c.id === chore.id);
  assert.equal(updatedChore?.schedules.length, 3, "Should have 3 new schedules");
  assert(
    updatedChore?.schedules.every(s => s.kid_name !== "Kid A"),
    "Old schedules should be removed"
  );

  console.log("  ✅ Update chore schedules works");
}

// Test: Chore completion toggle
async function testChoreCompletion() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Chore completion toggle");

  // Create a chore with today's schedule
  const chore = await addChore({
    name: "Completion Test Chore",
    description: "Test completion",
  });
  const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ] as DayOfWeek;
  await addChoreSchedule(chore.id, "Test Kid", todayDayOfWeek);

  const todayStr = getTodayString();

  // Get the schedule ID
  const choresWithSchedules = await getAllChoresWithSchedules();
  const testChore = choresWithSchedules.find(c => c.id === chore.id);
  const scheduleId = testChore!.schedules[0].id;

  // Complete the chore
  await completeChore(scheduleId, todayStr);
  let allChores = await getCurrentWeekChores();
  const completed = allChores.find(c => c.id === scheduleId);
  assert(completed?.completed_at, "Chore should be marked complete");
  assert(completed?.is_completed, "Chore should be marked as completed");

  // Uncomplete the chore
  await uncompleteChore(scheduleId, todayStr);
  allChores = await getCurrentWeekChores();
  const uncompleted = allChores.find(c => c.id === scheduleId);
  assert(!uncompleted?.completed_at, "Chore should be unmarked");
  assert(!uncompleted?.is_completed, "Chore should not be marked as completed");

  console.log("  ✅ Chore completion toggle works");
}

// Test: Get chores for specific kid
async function testGetChoresForKid() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Get chores for specific kid");

  // Create chores for different kids
  const chore1 = await addChore({ name: "Chore 1", description: "For Kid A" });
  await addChoreSchedule(chore1.id, "Kid A", "monday" as DayOfWeek);
  await addChoreSchedule(chore1.id, "Kid A", "wednesday" as DayOfWeek);

  const chore2 = await addChore({ name: "Chore 2", description: "For both kids" });
  await addChoreSchedule(chore2.id, "Kid A", "tuesday" as DayOfWeek);
  await addChoreSchedule(chore2.id, "Kid B", "thursday" as DayOfWeek);

  const chore3 = await addChore({ name: "Chore 3", description: "For Kid B" });
  await addChoreSchedule(chore3.id, "Kid B", "friday" as DayOfWeek);

  // Get chores for Kid A
  const allChores = await getCurrentWeekChores();
  const kidAChores = allChores.filter(c => c.kid_name === "Kid A");
  const kidAChoreNames = [...new Set(kidAChores.map(c => c.chore_name))];
  assert(kidAChoreNames.includes("Chore 1"), "Kid A should have Chore 1");
  assert(kidAChoreNames.includes("Chore 2"), "Kid A should have Chore 2");
  assert(!kidAChoreNames.includes("Chore 3"), "Kid A should not have Chore 3");

  // Get chores for Kid B
  const kidBChores = allChores.filter(c => c.kid_name === "Kid B");
  const kidBChoreNames = [...new Set(kidBChores.map(c => c.chore_name))];
  assert(!kidBChoreNames.includes("Chore 1"), "Kid B should not have Chore 1");
  assert(kidBChoreNames.includes("Chore 2"), "Kid B should have Chore 2");
  assert(kidBChoreNames.includes("Chore 3"), "Kid B should have Chore 3");

  console.log("  ✅ Get chores for specific kid works");
}

// Test: Get unique kid names
async function testGetUniqueKidNames() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Get unique kid names");

  // Create chores with various kid assignments
  const chore = await addChore({ name: "Test Chore", description: "Test" });
  await addChoreSchedule(chore.id, "Alice", "monday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Bob", "tuesday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Charlie", "wednesday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Alice", "thursday" as DayOfWeek); // Duplicate

  const kidNames = await getUniqueKidNames();
  assert.equal(kidNames.length, 3, "Should have 3 unique kid names");
  assert(kidNames.includes("Alice"), "Should include Alice");
  assert(kidNames.includes("Bob"), "Should include Bob");
  assert(kidNames.includes("Charlie"), "Should include Charlie");

  console.log("  ✅ Get unique kid names works");
}

// Test: Delete chore with cascade
async function testDeleteChore() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Delete chore (cascade)");

  // Create chore with schedules
  const chore = await addChore({ name: "Delete Test", description: "Will be deleted" });
  await addChoreSchedule(chore.id, "Kid", "monday" as DayOfWeek);
  await addChoreSchedule(chore.id, "Kid", "tuesday" as DayOfWeek);

  // Verify it exists
  let chores = await getAllChoresWithSchedules();
  assert(
    chores.find(c => c.id === chore.id),
    "Chore should exist"
  );

  // Delete it
  await deleteChore(chore.id);

  // Verify it's gone
  chores = await getAllChoresWithSchedules();
  assert(!chores.find(c => c.id === chore.id), "Chore should be deleted");

  console.log("  ✅ Delete chore with cascade works");
}

// Test: Add and get task
async function testAddTask() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Add and get task");

  const tomorrowStr = getTomorrowString();
  const newTask = await addTask({
    title: "Test Task",
    description: "A test task",
    kid_name: "Test Kid",
    due_date: tomorrowStr,
  });

  assert(newTask.id, "Should return task with ID");
  assert.equal(newTask.title, "Test Task");
  // Handle both string and Date types for due_date
  const actualDueDate =
    typeof newTask.due_date === "string"
      ? newTask.due_date
      : (newTask.due_date as unknown as Date).toISOString().split("T")[0];
  assert.equal(actualDueDate, tomorrowStr);

  const allTasks = await getAllTasks();
  assert.equal(allTasks.length, 1, "Should have exactly 1 task");
  assert.equal(allTasks[0].id, newTask.id, "Should find the created task");

  console.log("  ✅ Add and get task works");
}

// Test: Update task
async function testUpdateTask() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Update task");

  // Create initial task
  const task = await addTask({
    title: "Original Task",
    description: "Original",
    kid_name: "Kid A",
    due_date: getTomorrowString(),
  });

  // Update it
  const newDueDate = getDayString(3);
  const updated = await updateTask(task.id, {
    title: "Updated Task",
    description: "Updated",
    kid_name: "Kid B",
    due_date: newDueDate,
  });

  assert.equal(updated.title, "Updated Task");
  assert.equal(updated.description, "Updated");
  assert.equal(updated.kid_name, "Kid B");
  // Handle both string and Date types for due_date
  const actualUpdatedDueDate =
    typeof updated.due_date === "string"
      ? updated.due_date
      : (updated.due_date as unknown as Date).toISOString().split("T")[0];
  assert.equal(actualUpdatedDueDate, newDueDate);

  console.log("  ✅ Update task works");
}

// Test: Task completion toggle
async function testTaskCompletion() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Task completion toggle");

  const task = await addTask({
    title: "Completion Test",
    description: null,
    kid_name: "Test Kid",
    due_date: getTodayString(),
  });

  // Complete it
  let toggled = await toggleTaskComplete(task.id);
  assert(toggled.completed_at, "Task should be marked complete");

  // Uncomplete it
  toggled = await toggleTaskComplete(task.id);
  assert(!toggled.completed_at, "Task should be unmarked");

  console.log("  ✅ Task completion toggle works");
}

// Test: Get tasks for specific kid
async function testGetTasksForKid() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Get tasks for specific kid");

  // Create tasks for different kids
  await addTask({
    title: "Task for Kid A",
    description: null,
    kid_name: "Kid A",
    due_date: getTodayString(),
  });
  await addTask({
    title: "Another Task for Kid A",
    description: null,
    kid_name: "Kid A",
    due_date: getTomorrowString(),
  });
  await addTask({
    title: "Task for Kid B",
    description: null,
    kid_name: "Kid B",
    due_date: getTodayString(),
  });

  const kidATasks = await getTasksForKid("Kid A");
  assert.equal(kidATasks.length, 2, "Kid A should have 2 tasks");
  assert(
    kidATasks.every(t => t.kid_name === "Kid A"),
    "All tasks should be for Kid A"
  );

  const kidBTasks = await getTasksForKid("Kid B");
  assert.equal(kidBTasks.length, 1, "Kid B should have 1 task");
  assert(
    kidBTasks.every(t => t.kid_name === "Kid B"),
    "All tasks should be for Kid B"
  );

  console.log("  ✅ Get tasks for specific kid works");
}

// Test: Task priority sorting
async function testTaskPrioritySorting() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Task priority sorting");

  const kidName = "Sort Test Kid";

  // Create tasks with different priorities
  await addTask({
    title: "Overdue Task",
    description: null,
    kid_name: kidName,
    due_date: getYesterdayString(),
  });
  await addTask({
    title: "Today Task",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(),
  });
  await addTask({
    title: "Future Task",
    description: null,
    kid_name: kidName,
    due_date: getTomorrowString(),
  });

  // Create and complete a task
  const completedTask = await addTask({
    title: "Completed Task",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(),
  });
  await toggleTaskComplete(completedTask.id);

  // Get tasks - should be sorted by priority
  const tasks = await getTasksForKid(kidName);
  assert.equal(tasks.length, 4, "Should have 4 tasks");

  // Check that completed task is last
  const lastTask = tasks[tasks.length - 1];
  assert(lastTask.completed_at, "Last task should be completed");

  // Check that uncompleted tasks come first
  const uncompletedTasks = tasks.slice(0, 3);
  assert(
    uncompletedTasks.every(t => !t.completed_at),
    "First 3 tasks should be uncompleted"
  );

  console.log("  ✅ Task priority sorting works");
}

// Test: Delete task
async function testDeleteTask() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Delete task");

  const task = await addTask({
    title: "Delete Test",
    description: null,
    kid_name: "Test Kid",
    due_date: getTomorrowString(),
  });

  // Verify it exists
  let tasks = await getAllTasks();
  assert.equal(tasks.length, 1, "Should have 1 task");

  // Delete it
  await deleteTask(task.id);

  // Verify it's gone
  tasks = await getAllTasks();
  assert.equal(tasks.length, 0, "Should have no tasks");

  console.log("  ✅ Delete task works");
}

// Main test runner
async function runIntegrationTests() {
  console.log("🚀 Running database integration tests");
  console.log("Each test runs in a fresh database\n");

  const tests = [
    // Chore tests
    testAddChoreWithSchedules,
    testUpdateChore,
    testUpdateChoreSchedules,
    testChoreCompletion,
    testGetChoresForKid,
    testGetUniqueKidNames,
    testDeleteChore,
    // Task tests
    testAddTask,
    testUpdateTask,
    testTaskCompletion,
    testGetTasksForKid,
    testTaskPrioritySorting,
    testDeleteTask,
  ];

  try {
    console.log("═══════════════════════════════════════════");
    console.log("CHORE TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 0; i < 7; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("TASK TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 7; i < tests.length; i++) {
      await tests[i]();
    }

    console.log("\n✨ All integration tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error instanceof Error ? error.message : String(error));
    console.error(error);
    process.exit(1);
  }
}

runIntegrationTests();
