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

// Test: Get chore by ID
async function testGetChoreById() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Get chore by ID");

  // Create a chore
  const chore = await addChore({
    name: "Test Get By ID",
    description: "Test description",
  });

  // Import getChoreById function
  const { getChoreById } = await import("./app/lib/db");

  // Test existing chore retrieval
  const retrieved = await getChoreById(chore.id);
  assert(retrieved, "Should retrieve existing chore");
  assert.equal(retrieved?.id, chore.id, "Retrieved chore should have correct ID");
  assert.equal(retrieved?.name, "Test Get By ID", "Retrieved chore should have correct name");

  // Test non-existent chore
  const nonExistent = await getChoreById(999999);
  assert.equal(nonExistent, null, "Should return null for non-existent chore");

  console.log("  ✅ Get chore by ID works");
}

// Test: Tasks for parent view (past week filtering)
async function testTasksForParentView() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Tasks for parent view");

  const kidName = "Test Kid";

  // Create tasks at various times
  await addTask({
    title: "Old Task",
    description: null,
    kid_name: kidName,
    due_date: getDayString(-10), // 10 days ago
  });

  await addTask({
    title: "Recent Task",
    description: null,
    kid_name: kidName,
    due_date: getDayString(-3), // 3 days ago
  });

  const futureTask = await addTask({
    title: "Future Task",
    description: null,
    kid_name: kidName,
    due_date: getTomorrowString(),
  });

  // Mark the future task as completed
  await toggleTaskComplete(futureTask.id);

  // Import and test getTasksForParentView
  const { getTasksForParentView } = await import("./app/lib/db");
  const parentTasks = await getTasksForParentView();

  // Should include all tasks (parent view shows all pending + recent completed)
  assert(parentTasks.length >= 2, "Should have at least 2 tasks in parent view");

  // Check that completed tasks from past week are included
  const completedRecent = parentTasks.filter(t => t.completed_at !== null);
  assert(completedRecent.length > 0, "Should include recently completed tasks");

  console.log("  ✅ Tasks for parent view works");
}

// Test: Error handling and edge cases
async function testErrorHandling() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Error handling");

  // Test invalid chore schedule (invalid day)
  try {
    await addChoreSchedule(999999, "Test Kid", "invalid_day" as any);
    assert.fail("Should have thrown error for invalid day");
  } catch (error) {
    assert(error, "Should throw error for invalid chore ID or day");
  }

  // Test duplicate chore names (unique constraint exists)
  const uniqueName = `Unique Test ${Date.now()}`;
  const chore1 = await addChore({ name: uniqueName, description: "First" });

  // This should fail due to unique constraint on name
  try {
    await addChore({ name: uniqueName, description: "Second" });
    assert.fail("Should have thrown error for duplicate chore name");
  } catch (error: any) {
    assert(
      error.message.includes("duplicate key") || error.message.includes("already exists"),
      "Should throw duplicate key error"
    );
  }

  console.log("  ✅ Error handling works");
}

// Test unified sorting logic for chores and tasks
async function testUnifiedSorting() {
  await resetTestDatabase();
  console.log("\n🧪 Testing: Unified sorting for chores and tasks");

  const kidName = "Sorting Kid";

  // Create chores with different schedules
  const bedChore = await addChore({
    name: "Make Bed",
    description: null,
  });
  const dishesChore = await addChore({
    name: "Do Dishes",
    description: null,
  });
  const roomChore = await addChore({
    name: "Clean Room",
    description: null,
  });

  // Get current day and calculate relative days
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = dayNames[dayOfWeek];
  const yesterdayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
  const tomorrowName = dayNames[dayOfWeek === 6 ? 0 : dayOfWeek + 1];

  // Add chore schedules for different days
  await addChoreSchedule(bedChore.id, kidName, yesterdayName); // Overdue
  await addChoreSchedule(dishesChore.id, kidName, todayName); // Today
  await addChoreSchedule(roomChore.id, kidName, tomorrowName); // Future

  // Create tasks with different due dates
  await addTask({
    title: "Homework",
    description: null,
    kid_name: kidName,
    due_date: getYesterdayString(), // Overdue
  });
  await addTask({
    title: "Library Books",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(), // Today
  });
  await addTask({
    title: "Science Project",
    description: null,
    kid_name: kidName,
    due_date: getTomorrowString(), // Future
  });

  // Add another task due today to test alphabetical sorting within same priority
  await addTask({
    title: "Art Project",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(), // Today
  });

  // Get the combined chores and tasks (getCurrentWeekChores takes no arguments)
  const allChores = await getCurrentWeekChores();
  const chores = allChores.filter(c => c.kid_name === kidName);
  const tasks = await getTasksForKid(kidName);

  // Import and test the sorting logic
  const { createSortableItems, sortItems } = await import("./app/lib/sorting");

  const sortableItems = createSortableItems(chores, tasks);
  const sortedItems = sortItems(sortableItems);

  // Filter to uncompleted items only
  const uncompletedItems = sortedItems.filter(item => !item.isCompleted);

  // Verify the expected order:
  // 1. Tasks due today or earlier (alphabetical)
  // 2. Chores due today or earlier (alphabetical)
  // 3. Future tasks (by date, then alphabetical)
  // 4. Future chores (by day, then alphabetical)

  assert.equal(uncompletedItems.length, 7, "Should have 7 uncompleted items");

  // Tasks due today or earlier, sorted alphabetically: "Art Project", "Homework", "Library Books"
  assert.equal(uncompletedItems[0].type, "task");
  assert.equal(uncompletedItems[0].name, "Art Project");
  assert.equal(uncompletedItems[0].status, "today");

  assert.equal(uncompletedItems[1].type, "task");
  assert.equal(uncompletedItems[1].name, "Homework");
  assert.equal(uncompletedItems[1].status, "overdue");

  assert.equal(uncompletedItems[2].type, "task");
  assert.equal(uncompletedItems[2].name, "Library Books");
  assert.equal(uncompletedItems[2].status, "today");

  // Chores due today or earlier, sorted alphabetically: "Do Dishes", "Make Bed"
  assert.equal(uncompletedItems[3].type, "chore");
  assert.equal(uncompletedItems[3].name, "Do Dishes");
  assert.equal(uncompletedItems[3].status, "today");

  assert.equal(uncompletedItems[4].type, "chore");
  assert.equal(uncompletedItems[4].name, "Make Bed");
  assert.equal(uncompletedItems[4].status, "overdue");

  // Future task
  assert.equal(uncompletedItems[5].type, "task");
  assert.equal(uncompletedItems[5].name, "Science Project");
  assert.equal(uncompletedItems[5].status, "upcoming");

  // Future chore
  assert.equal(uncompletedItems[6].type, "chore");
  assert.equal(uncompletedItems[6].name, "Clean Room");
  assert.equal(uncompletedItems[6].status, "upcoming");

  console.log("  ✓ Items are sorted in correct priority order");
  console.log("  ✓ Tasks come before chores within same priority group");
  console.log("  ✓ Items are alphabetically sorted within same type and priority");

  // Test that sorting is stable after completing an item
  // completeChore expects (chore_schedule_id, completed_date)
  // Need to get the actual schedule ID for this chore
  const allSchedules = await getCurrentWeekChores();
  const dishesSchedule = allSchedules.find(
    s => s.chore_id === dishesChore.id && s.day_of_week === todayName && s.kid_name === kidName
  );
  if (!dishesSchedule) {
    throw new Error("Could not find dishes schedule");
  }
  await completeChore(dishesSchedule.id, getTodayString());

  const allChoresAfter = await getCurrentWeekChores();
  const choresAfter = allChoresAfter.filter(c => c.kid_name === kidName);
  const sortableItemsAfter = createSortableItems(choresAfter, tasks);
  const sortedItemsAfter = sortItems(sortableItemsAfter);
  const uncompletedItemsAfter = sortedItemsAfter.filter(item => !item.isCompleted);

  // Verify order remains stable (minus the completed chore)
  assert.equal(uncompletedItemsAfter.length, 6, "Should have 6 uncompleted items after completion");
  assert.equal(uncompletedItemsAfter[0].name, "Art Project", "First item should still be Art Project");
  assert.equal(uncompletedItemsAfter[1].name, "Homework", "Second item should still be Homework");
  assert.equal(uncompletedItemsAfter[2].name, "Library Books", "Third item should still be Library Books");
  // "Do Dishes" is now completed, so "Make Bed" is the only chore due today/earlier
  assert.equal(uncompletedItemsAfter[3].name, "Make Bed", "Fourth item should still be Make Bed");
  assert.equal(uncompletedItemsAfter[4].name, "Science Project", "Fifth item should be Science Project");
  assert.equal(uncompletedItemsAfter[5].name, "Clean Room", "Sixth item should be Clean Room");

  console.log("  ✓ Sorting remains stable after completing items");
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
    testGetChoreById,
    // Task tests
    testAddTask,
    testUpdateTask,
    testTaskCompletion,
    testGetTasksForKid,
    testTaskPrioritySorting,
    testDeleteTask,
    testTasksForParentView,
    // Error handling
    testErrorHandling,
    // Unified sorting
    testUnifiedSorting,
  ];

  try {
    console.log("═══════════════════════════════════════════");
    console.log("CHORE TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 0; i < 8; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("TASK TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 8; i < 14; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("ADDITIONAL TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 14; i < tests.length; i++) {
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
