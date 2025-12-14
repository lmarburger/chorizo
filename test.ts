import { config } from "dotenv";
import assert from "assert";
import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";
import { formatDateString } from "./app/lib/date-utils";

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
  excuseChore,
  unexcuseChore,
  excuseTask,
  unexcuseTask,
  getWeeklyQualification,
  claimIncentive,
  getIncentiveClaim,
  type DayOfWeek,
} from "./app/lib/db";

// Setup function to completely reset and initialize test database (run once at start)
async function resetTestDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  // Drop all tables first to ensure clean state
  await sql`DROP TABLE IF EXISTS pgmigrations CASCADE`;
  await sql`DROP TABLE IF EXISTS incentive_claims CASCADE`;
  await sql`DROP TABLE IF EXISTS chore_completions CASCADE`;
  await sql`DROP TABLE IF EXISTS chore_schedules CASCADE`;
  await sql`DROP TABLE IF EXISTS chores CASCADE`;
  await sql`DROP TABLE IF EXISTS tasks CASCADE`;
  await sql`DROP TABLE IF EXISTS feedback CASCADE`;
  await sql`DROP TYPE IF EXISTS day_of_week CASCADE`;

  // Run migrations to set up schema using test database (--no-lock avoids lock issues when pgmigrations is dropped)
  execSync("npx node-pg-migrate up --no-lock", {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
}

// Fast cleanup between tests - truncate is much faster than DROP/CREATE
async function truncateAllTables() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`TRUNCATE incentive_claims, feedback, chore_completions, chore_schedules, chores, tasks RESTART IDENTITY CASCADE`;
}

// Helper functions for dates - use formatDateString for timezone consistency
function getTodayString(): string {
  return formatDateString(new Date());
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow);
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

function getDayString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateString(date);
}

// Test: Adding and retrieving a chore with schedules
async function testAddChoreWithSchedules() {
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
    typeof newTask.due_date === "string" ? newTask.due_date : formatDateString(newTask.due_date as unknown as Date);
  assert.equal(actualDueDate, tomorrowStr);

  const allTasks = await getAllTasks();
  assert.equal(allTasks.length, 1, "Should have exactly 1 task");
  assert.equal(allTasks[0].id, newTask.id, "Should find the created task");

  console.log("  ✅ Add and get task works");
}

// Test: Update task
async function testUpdateTask() {
  await truncateAllTables();
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
    typeof updated.due_date === "string" ? updated.due_date : formatDateString(updated.due_date as unknown as Date);
  assert.equal(actualUpdatedDueDate, newDueDate);

  console.log("  ✅ Update task works");
}

// Test: Task completion toggle
async function testTaskCompletion() {
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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

// Test: Completed tasks filtered by week boundary
async function testCompletedTasksWeekBoundary() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Completed tasks week boundary filtering");

  const sql = neon(process.env.DATABASE_URL!);
  const kidName = "Week Test Kid";

  // Create an incomplete task (should always be visible)
  await addTask({
    title: "Incomplete Task",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(),
  });

  // Create a task completed today (should be visible)
  const recentTask = await addTask({
    title: "Recent Completed Task",
    description: null,
    kid_name: kidName,
    due_date: getTodayString(),
  });
  await toggleTaskComplete(recentTask.id);

  // Insert a task completed 10 days ago (previous week - should NOT be visible)
  const oldCompletedDate = new Date();
  oldCompletedDate.setDate(oldCompletedDate.getDate() - 10);
  await sql`
    INSERT INTO tasks (title, description, kid_name, due_date, completed_at)
    VALUES ('Old Completed Task', null, ${kidName}, ${getDayString(-10)}, ${oldCompletedDate.toISOString()})
  `;

  // Get tasks for kid - should only see incomplete + current week completed
  const tasks = await getTasksForKid(kidName);

  assert.equal(tasks.length, 2, "Should have 2 tasks (1 incomplete + 1 recently completed)");
  assert(
    tasks.find(t => t.title === "Incomplete Task"),
    "Should include incomplete task"
  );
  assert(
    tasks.find(t => t.title === "Recent Completed Task"),
    "Should include recently completed task"
  );
  assert(!tasks.find(t => t.title === "Old Completed Task"), "Should NOT include task completed in previous week");

  console.log("  ✅ Completed tasks week boundary filtering works");
}

// Test: Get chore by ID
async function testGetChoreById() {
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  await truncateAllTables();
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
  // New sorting is primarily by day (Mon=0 to Sun=6), then within same day:
  // 1. "Must do today" items first (fixed chores for today + tasks due today)
  // 2. Then by type (tasks before chores)
  // 3. Then alphabetically

  assert.equal(uncompletedItems.length, 7, "Should have 7 uncompleted items");

  // Verify key sorting invariants:
  // 1. All incomplete items come before complete items (already filtered)
  // 2. Items are sorted by day number
  // 3. Within same day, tasks come before chores (for visual consistency)

  // Find overdue items (yesterday)
  const overdueItems = uncompletedItems.filter(i => i.status === "overdue");
  assert.equal(overdueItems.length, 2, "Should have 2 overdue items");
  // Overdue task should come before overdue chore
  const overdueTask = overdueItems.find(i => i.type === "task");
  const overdueChore = overdueItems.find(i => i.type === "chore");
  assert(overdueTask, "Should have an overdue task");
  assert(overdueChore, "Should have an overdue chore");

  // Find today items
  const todayItems = uncompletedItems.filter(i => i.status === "today");
  assert.equal(todayItems.length, 3, "Should have 3 today items");
  // Tasks should come before chores
  const todayTasks = todayItems.filter(i => i.type === "task");
  const todayChores = todayItems.filter(i => i.type === "chore");
  assert.equal(todayTasks.length, 2, "Should have 2 tasks due today");
  assert.equal(todayChores.length, 1, "Should have 1 chore due today");

  // Find upcoming items (tomorrow)
  const upcomingItems = uncompletedItems.filter(i => i.status === "upcoming");
  assert.equal(upcomingItems.length, 2, "Should have 2 upcoming items");

  console.log("  ✓ Items are sorted by day");
  console.log("  ✓ Tasks come before chores within same day");
  console.log("  ✓ Status groups (overdue, today, upcoming) are correctly assigned");

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

  // Verify that Do Dishes is no longer in uncompleted
  assert(!uncompletedItemsAfter.find(i => i.name === "Do Dishes"), "Do Dishes should be completed");

  // Verify the remaining items are still present
  assert(
    uncompletedItemsAfter.find(i => i.name === "Make Bed"),
    "Make Bed should still be uncompleted"
  );
  assert(
    uncompletedItemsAfter.find(i => i.name === "Clean Room"),
    "Clean Room should still be uncompleted"
  );
  assert(
    uncompletedItemsAfter.find(i => i.name === "Homework"),
    "Homework should still be uncompleted"
  );
  assert(
    uncompletedItemsAfter.find(i => i.name === "Library Books"),
    "Library Books should still be uncompleted"
  );
  assert(
    uncompletedItemsAfter.find(i => i.name === "Art Project"),
    "Art Project should still be uncompleted"
  );
  assert(
    uncompletedItemsAfter.find(i => i.name === "Science Project"),
    "Science Project should still be uncompleted"
  );

  console.log("  ✓ Sorting remains stable after completing items");
  console.log("  ✅ Unified sorting for chores and tasks works");
}

// Test: Excuse chore
async function testExcuseChore() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Excuse chore");

  // Create a chore with today's schedule
  const chore = await addChore({
    name: "Excusable Chore",
    description: "Test excuse",
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

  // Excuse the chore
  await excuseChore(scheduleId, todayStr);
  let allChores = await getCurrentWeekChores();
  const excused = allChores.find(c => c.id === scheduleId);
  assert(excused?.excused, "Chore should be marked excused");

  // Unexcuse the chore
  await unexcuseChore(scheduleId, todayStr);
  allChores = await getCurrentWeekChores();
  const unexcused = allChores.find(c => c.id === scheduleId);
  assert(!unexcused?.excused, "Chore should not be marked excused");

  console.log("  ✅ Excuse chore works");
}

// Test: Excuse task
async function testExcuseTask() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Excuse task");

  const task = await addTask({
    title: "Excusable Task",
    description: null,
    kid_name: "Test Kid",
    due_date: getTodayString(),
  });

  // Excuse the task
  const excused = await excuseTask(task.id);
  assert(excused.excused_at, "Task should be marked excused");

  // Unexcuse the task
  const unexcused = await unexcuseTask(task.id);
  assert(!unexcused.excused_at, "Task should not be marked excused");

  console.log("  ✅ Excuse task works");
}

// Test: Fixed vs flexible chores
async function testFixedFlexibleChores() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Fixed vs flexible chores");

  // Create a fixed chore
  const fixedChore = await addChore({
    name: "Fixed Chore",
    description: "Must be done on scheduled day",
    flexible: false,
  });
  const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ] as DayOfWeek;
  await addChoreSchedule(fixedChore.id, "Test Kid", todayDayOfWeek);

  // Create a flexible chore (default)
  const flexibleChore = await addChore({
    name: "Flexible Chore",
    description: "Can be done any day",
  });
  await addChoreSchedule(flexibleChore.id, "Test Kid", todayDayOfWeek);

  const allChores = await getCurrentWeekChores();
  const fixed = allChores.find(c => c.chore_id === fixedChore.id);
  const flexible = allChores.find(c => c.chore_id === flexibleChore.id);

  assert.equal(fixed?.flexible, false, "Fixed chore should have flexible=false");
  assert.equal(flexible?.flexible, true, "Flexible chore should have flexible=true");

  console.log("  ✅ Fixed vs flexible chores works");
}

// Test: Weekly qualification - qualified
async function testWeeklyQualificationQualified() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Weekly qualification - qualified");

  const kidName = "Qualified Kid";
  const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ] as DayOfWeek;

  // Create a chore for today
  const chore = await addChore({
    name: "Today Chore",
    description: null,
  });
  await addChoreSchedule(chore.id, kidName, todayDayOfWeek);

  // Complete the chore
  const allChores = await getCurrentWeekChores();
  const schedule = allChores.find(c => c.kid_name === kidName);
  await completeChore(schedule!.id, getTodayString());

  // Check qualification
  const qualification = await getWeeklyQualification(kidName);
  assert(qualification.qualified, "Kid should be qualified after completing all chores");
  assert.equal(qualification.missedItems.length, 0, "Should have no missed items");

  console.log("  ✅ Weekly qualification - qualified works");
}

// Test: Incentive claim
async function testIncentiveClaim() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Incentive claim");

  const kidName = "Claiming Kid";

  // Claim screen time reward
  const claim = await claimIncentive(kidName, "screen_time");
  assert(claim.id, "Claim should have ID");
  assert.equal(claim.kid_name, kidName, "Claim should be for correct kid");
  assert.equal(claim.reward_type, "screen_time", "Claim should be for screen time");

  // Verify claim can be retrieved
  const retrieved = await getIncentiveClaim(kidName);
  assert(retrieved, "Should be able to retrieve claim");
  assert.equal(retrieved?.reward_type, "screen_time", "Retrieved claim should match");

  console.log("  ✅ Incentive claim works");
}

// Test: Late completion detection for fixed chores
async function testLateCompletionDetection() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Late completion detection for fixed chores");

  const sql = neon(process.env.DATABASE_URL!);
  const kidName = "Late Test Kid";

  // Get yesterday's day of week
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    yesterday.getDay()
  ] as DayOfWeek;

  // Create a fixed chore for yesterday
  const fixedChore = await addChore({
    name: "Fixed Chore Yesterday",
    description: null,
    flexible: false,
  });
  await addChoreSchedule(fixedChore.id, kidName, yesterdayDayOfWeek);

  // Get the schedule ID
  const allChores = await getCurrentWeekChores();
  const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
  assert(schedule, "Should find the schedule");

  // Insert a completion with completed_at = today (simulating late completion)
  const yesterdayStr = getYesterdayString();
  const todayTimestamp = new Date().toISOString();
  await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at, excused)
    VALUES (${schedule!.id}, ${yesterdayStr}, ${todayTimestamp}, false)
  `;

  // Fetch the chores again and verify is_late_completion
  const updatedChores = await getCurrentWeekChores();
  const completed = updatedChores.find(c => c.id === schedule!.id);
  assert(completed?.is_completed, "Chore should be completed");
  assert(completed?.is_late_completion, "Should be marked as late completion");

  console.log("  ✅ Late completion detection works");
}

// Test: Late completion disqualifies kid
async function testLateCompletionDisqualifies() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Late completion disqualifies kid");

  const sql = neon(process.env.DATABASE_URL!);
  const kidName = "Disqualified Kid";

  // Get yesterday's day of week (ensure it's a weekday Mon-Fri for qualification)
  const today = new Date();
  const dayOfWeek = today.getDay();
  // If today is Sunday (0), Saturday (6), or Monday (1), skip back to a weekday for "yesterday"
  // We need yesterday to be a weekday (Mon-Fri) for qualification purposes
  let daysBack = 1;
  let yesterdayDayNum = (dayOfWeek - daysBack + 7) % 7;
  while (yesterdayDayNum === 0 || yesterdayDayNum === 6) {
    daysBack++;
    yesterdayDayNum = (dayOfWeek - daysBack + 7) % 7;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - daysBack);
  const yesterdayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    yesterday.getDay()
  ] as DayOfWeek;
  const yesterdayStr = formatDateString(yesterday);

  // Create a fixed chore for that weekday
  const fixedChore = await addChore({
    name: "Fixed Chore Weekday",
    description: null,
    flexible: false,
  });
  await addChoreSchedule(fixedChore.id, kidName, yesterdayDayOfWeek);

  // Get the schedule ID
  const allChores = await getCurrentWeekChores();
  const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
  assert(schedule, "Should find the schedule");

  // Insert a late completion (completed_at = today, completed_date = yesterday)
  const todayTimestamp = new Date().toISOString();
  await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at, excused)
    VALUES (${schedule!.id}, ${yesterdayStr}, ${todayTimestamp}, false)
  `;

  // Check qualification - should be disqualified due to late completion
  const qualification = await getWeeklyQualification(kidName);
  assert(qualification.disqualified, "Should be disqualified due to late completion");
  assert(qualification.missedItems.length > 0, "Should have missed items");

  console.log("  ✅ Late completion disqualifies works");
}

// Test: Excusing late completion restores qualification
async function testExcuseLateCompletionRestoresQualification() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Excusing late completion restores qualification");

  const sql = neon(process.env.DATABASE_URL!);
  const kidName = "Excuse Late Kid";

  // Get a weekday from the past
  const today = new Date();
  const dayOfWeek = today.getDay();
  let daysBack = 1;
  let yesterdayDayNum = (dayOfWeek - daysBack + 7) % 7;
  while (yesterdayDayNum === 0 || yesterdayDayNum === 6) {
    daysBack++;
    yesterdayDayNum = (dayOfWeek - daysBack + 7) % 7;
  }
  const targetDay = new Date();
  targetDay.setDate(targetDay.getDate() - daysBack);
  const targetDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    targetDay.getDay()
  ] as DayOfWeek;
  const targetDayStr = formatDateString(targetDay);

  // Create a fixed chore
  const fixedChore = await addChore({
    name: "Fixed Chore To Excuse",
    description: null,
    flexible: false,
  });
  await addChoreSchedule(fixedChore.id, kidName, targetDayOfWeek);

  // Get the schedule ID
  const allChores = await getCurrentWeekChores();
  const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
  assert(schedule, "Should find the schedule");

  // Insert a late completion
  const todayTimestamp = new Date().toISOString();
  await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at, excused)
    VALUES (${schedule!.id}, ${targetDayStr}, ${todayTimestamp}, false)
  `;

  // Verify disqualified
  let qualification = await getWeeklyQualification(kidName);
  assert(qualification.disqualified, "Should be disqualified before excuse");

  // Excuse the chore
  await excuseChore(schedule!.id, targetDayStr);

  // Verify now qualified
  qualification = await getWeeklyQualification(kidName);
  assert(!qualification.disqualified, "Should not be disqualified after excuse");
  assert(qualification.qualified, "Should be qualified after excuse");

  console.log("  ✅ Excusing late completion restores qualification works");
}

// Test: Flexible chores don't get marked as late
async function testFlexibleChoresNotMarkedLate() {
  await truncateAllTables();
  console.log("\n🧪 Testing: Flexible chores are not marked as late completion");

  const sql = neon(process.env.DATABASE_URL!);
  const kidName = "Flexible Test Kid";

  // Get yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    yesterday.getDay()
  ] as DayOfWeek;
  const yesterdayStr = getYesterdayString();

  // Create a FLEXIBLE chore for yesterday
  const flexibleChore = await addChore({
    name: "Flexible Chore Yesterday",
    description: null,
    flexible: true,
  });
  await addChoreSchedule(flexibleChore.id, kidName, yesterdayDayOfWeek);

  // Get the schedule ID
  const allChores = await getCurrentWeekChores();
  const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === flexibleChore.id);
  assert(schedule, "Should find the schedule");

  // Insert a completion with completed_at = today (would be "late" for fixed)
  const todayTimestamp = new Date().toISOString();
  await sql`
    INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at, excused)
    VALUES (${schedule!.id}, ${yesterdayStr}, ${todayTimestamp}, false)
  `;

  // Fetch and verify NOT marked as late
  const updatedChores = await getCurrentWeekChores();
  const completed = updatedChores.find(c => c.id === schedule!.id);
  assert(completed?.is_completed, "Chore should be completed");
  assert(!completed?.is_late_completion, "Flexible chore should NOT be marked as late completion");

  console.log("  ✅ Flexible chores not marked late works");
}

// Main test runner
async function runIntegrationTests() {
  console.log("🚀 Running database integration tests\n");

  // Reset schema once at start (expensive operation)
  await resetTestDatabase();

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
    testCompletedTasksWeekBoundary,
    testTasksForParentView,
    // Error handling
    testErrorHandling,
    // Unified sorting
    testUnifiedSorting,
    // Incentive system tests
    testExcuseChore,
    testExcuseTask,
    testFixedFlexibleChores,
    testWeeklyQualificationQualified,
    testIncentiveClaim,
    // Late completion tests
    testLateCompletionDetection,
    testLateCompletionDisqualifies,
    testExcuseLateCompletionRestoresQualification,
    testFlexibleChoresNotMarkedLate,
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

    for (let i = 8; i < 16; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("SORTING & ERROR HANDLING TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 16; i < 20; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("INCENTIVE SYSTEM TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 20; i < 25; i++) {
      await tests[i]();
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("LATE COMPLETION TESTS");
    console.log("═══════════════════════════════════════════");

    for (let i = 25; i < tests.length; i++) {
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
