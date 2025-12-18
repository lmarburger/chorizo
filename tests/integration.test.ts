import { config } from "dotenv";
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";
import { formatDateString } from "../app/lib/date-utils";
import {
  getTestDate,
  getTodayString,
  getTomorrowString,
  getYesterdayString,
  getDayString,
  getDayOfWeekInTimezone,
  getDayNameForOffset,
  getMostRecentPastWeekday,
} from "./helpers";

config({ path: ".env.test" });

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

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
} from "../app/lib/db";

const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

async function resetTestDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`DROP TABLE IF EXISTS pgmigrations CASCADE`;
  await sql`DROP TABLE IF EXISTS incentive_claims CASCADE`;
  await sql`DROP TABLE IF EXISTS chore_completions CASCADE`;
  await sql`DROP TABLE IF EXISTS chore_schedules CASCADE`;
  await sql`DROP TABLE IF EXISTS chores CASCADE`;
  await sql`DROP TABLE IF EXISTS tasks CASCADE`;
  await sql`DROP TABLE IF EXISTS feedback CASCADE`;
  await sql`DROP TYPE IF EXISTS day_of_week CASCADE`;

  execSync("npx node-pg-migrate up --no-lock", {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
}

async function truncateAllTables() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`TRUNCATE incentive_claims, feedback, chore_completions, chore_schedules, chores, tasks RESTART IDENTITY CASCADE`;
}

describe("Integration tests", { concurrency: false }, () => {
  before(async () => {
    await resetTestDatabase();
  });

  it("Add chore with schedules", async () => {
    await truncateAllTables();

    const uniqueName = `Test Chore ${Date.now()}`;
    const newChore = await addChore({
      name: uniqueName,
      description: "A test chore",
    });

    assert(newChore.id, "Should return chore with ID");
    assert.equal(newChore.name, uniqueName);

    await addChoreSchedule(newChore.id, "Test Kid", "monday" as DayOfWeek);
    await addChoreSchedule(newChore.id, "Test Kid", "wednesday" as DayOfWeek);
    await addChoreSchedule(newChore.id, "Another Kid", "friday" as DayOfWeek);

    const chores = await getAllChoresWithSchedules();
    assert.equal(chores.length, 1, "Should have exactly 1 chore");
    assert.equal(chores[0].schedules.length, 3, "Should have 3 schedules");
  });

  it("Update chore", async () => {
    await truncateAllTables();

    const chore = await addChore({
      name: "Original Chore",
      description: "Original description",
    });
    await addChoreSchedule(chore.id, "Kid A", "monday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Kid A", "tuesday" as DayOfWeek);

    const updated = await updateChore(chore.id, {
      name: "Updated Chore",
      description: "Updated description",
    });

    assert.equal(updated.name, "Updated Chore");
    assert.equal(updated.description, "Updated description");
  });

  it("Update chore schedules", async () => {
    await truncateAllTables();

    const chore = await addChore({
      name: "Schedule Test Chore",
      description: "Testing schedule updates",
    });
    await addChoreSchedule(chore.id, "Kid A", "monday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Kid A", "tuesday" as DayOfWeek);

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
  });

  it("Chore completion toggle", async () => {
    await truncateAllTables();

    const chore = await addChore({
      name: "Completion Test Chore",
      description: "Test completion",
    });
    const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      getDayOfWeekInTimezone()
    ] as DayOfWeek;
    await addChoreSchedule(chore.id, "Test Kid", todayDayOfWeek);

    const todayStr = getTodayString();

    const choresWithSchedules = await getAllChoresWithSchedules();
    const testChore = choresWithSchedules.find(c => c.id === chore.id);
    const scheduleId = testChore!.schedules[0].id;

    await completeChore(scheduleId, todayStr, todayStr);
    let allChores = await getCurrentWeekChores();
    const completed = allChores.find(c => c.id === scheduleId);
    assert(completed?.completed_on, "Chore should be marked complete");
    assert(completed?.is_completed, "Chore should be marked as completed");

    await uncompleteChore(scheduleId, todayStr);
    allChores = await getCurrentWeekChores();
    const uncompleted = allChores.find(c => c.id === scheduleId);
    assert(!uncompleted?.completed_on, "Chore should be unmarked");
    assert(!uncompleted?.is_completed, "Chore should not be marked as completed");
  });

  it("Get chores for kid", async () => {
    await truncateAllTables();

    const chore1 = await addChore({ name: "Chore 1", description: "For Kid A" });
    await addChoreSchedule(chore1.id, "Kid A", "monday" as DayOfWeek);
    await addChoreSchedule(chore1.id, "Kid A", "wednesday" as DayOfWeek);

    const chore2 = await addChore({ name: "Chore 2", description: "For both kids" });
    await addChoreSchedule(chore2.id, "Kid A", "tuesday" as DayOfWeek);
    await addChoreSchedule(chore2.id, "Kid B", "thursday" as DayOfWeek);

    const chore3 = await addChore({ name: "Chore 3", description: "For Kid B" });
    await addChoreSchedule(chore3.id, "Kid B", "friday" as DayOfWeek);

    const allChores = await getCurrentWeekChores();
    const kidAChores = allChores.filter(c => c.kid_name === "Kid A");
    const kidAChoreNames = [...new Set(kidAChores.map(c => c.chore_name))];
    assert(kidAChoreNames.includes("Chore 1"), "Kid A should have Chore 1");
    assert(kidAChoreNames.includes("Chore 2"), "Kid A should have Chore 2");
    assert(!kidAChoreNames.includes("Chore 3"), "Kid A should not have Chore 3");

    const kidBChores = allChores.filter(c => c.kid_name === "Kid B");
    const kidBChoreNames = [...new Set(kidBChores.map(c => c.chore_name))];
    assert(!kidBChoreNames.includes("Chore 1"), "Kid B should not have Chore 1");
    assert(kidBChoreNames.includes("Chore 2"), "Kid B should have Chore 2");
    assert(kidBChoreNames.includes("Chore 3"), "Kid B should have Chore 3");
  });

  it("Get unique kid names", async () => {
    await truncateAllTables();

    const chore = await addChore({ name: "Test Chore", description: "Test" });
    await addChoreSchedule(chore.id, "Alice", "monday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Bob", "tuesday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Charlie", "wednesday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Alice", "thursday" as DayOfWeek);

    const kidNames = await getUniqueKidNames();
    assert.equal(kidNames.length, 3, "Should have 3 unique kid names");
    assert(kidNames.includes("Alice"), "Should include Alice");
    assert(kidNames.includes("Bob"), "Should include Bob");
    assert(kidNames.includes("Charlie"), "Should include Charlie");
  });

  it("Delete chore cascade", async () => {
    await truncateAllTables();

    const chore = await addChore({ name: "Delete Test", description: "Will be deleted" });
    await addChoreSchedule(chore.id, "Kid", "monday" as DayOfWeek);
    await addChoreSchedule(chore.id, "Kid", "tuesday" as DayOfWeek);

    let chores = await getAllChoresWithSchedules();
    assert(
      chores.find(c => c.id === chore.id),
      "Chore should exist"
    );

    await deleteChore(chore.id);

    chores = await getAllChoresWithSchedules();
    assert(!chores.find(c => c.id === chore.id), "Chore should be deleted");
  });

  it("Get chore by ID", async () => {
    await truncateAllTables();

    const chore = await addChore({
      name: "Test Get By ID",
      description: "Test description",
    });

    const { getChoreById } = await import("../app/lib/db");

    const retrieved = await getChoreById(chore.id);
    assert(retrieved, "Should retrieve existing chore");
    assert.equal(retrieved?.id, chore.id, "Retrieved chore should have correct ID");
    assert.equal(retrieved?.name, "Test Get By ID", "Retrieved chore should have correct name");

    const nonExistent = await getChoreById(999999);
    assert.equal(nonExistent, null, "Should return null for non-existent chore");
  });

  it("Add and get task", async () => {
    await truncateAllTables();

    const tomorrowStr = getTomorrowString();
    const newTask = await addTask({
      title: "Test Task",
      description: "A test task",
      kid_name: "Test Kid",
      due_date: tomorrowStr,
    });

    assert(newTask.id, "Should return task with ID");
    assert.equal(newTask.title, "Test Task");
    const actualDueDate =
      typeof newTask.due_date === "string" ? newTask.due_date : formatDateString(newTask.due_date as unknown as Date);
    assert.equal(actualDueDate, tomorrowStr);

    const allTasks = await getAllTasks();
    assert.equal(allTasks.length, 1, "Should have exactly 1 task");
    assert.equal(allTasks[0].id, newTask.id, "Should find the created task");
  });

  it("Update task", async () => {
    await truncateAllTables();

    const task = await addTask({
      title: "Original Task",
      description: "Original",
      kid_name: "Kid A",
      due_date: getTomorrowString(),
    });

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
    const actualUpdatedDueDate =
      typeof updated.due_date === "string" ? updated.due_date : formatDateString(updated.due_date as unknown as Date);
    assert.equal(actualUpdatedDueDate, newDueDate);
  });

  it("Task completion toggle", async () => {
    await truncateAllTables();

    const task = await addTask({
      title: "Completion Test",
      description: null,
      kid_name: "Test Kid",
      due_date: getTodayString(),
    });

    const todayStr = getTodayString();
    let toggled = await toggleTaskComplete(task.id, todayStr);
    assert(toggled.completed_on, "Task should be marked complete");

    toggled = await toggleTaskComplete(task.id, null);
    assert(!toggled.completed_on, "Task should be unmarked");
  });

  it("Get tasks for kid", async () => {
    await truncateAllTables();

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
  });

  it("Task priority sorting", async () => {
    await truncateAllTables();

    const kidName = "Sort Test Kid";

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

    const completedTask = await addTask({
      title: "Completed Task",
      description: null,
      kid_name: kidName,
      due_date: getTodayString(),
    });
    await toggleTaskComplete(completedTask.id, getTodayString());

    const tasks = await getTasksForKid(kidName);
    assert.equal(tasks.length, 4, "Should have 4 tasks");

    const lastTask = tasks[tasks.length - 1];
    assert(lastTask.completed_on, "Last task should be completed");

    const uncompletedTasks = tasks.slice(0, 3);
    assert(
      uncompletedTasks.every(t => !t.completed_on),
      "First 3 tasks should be uncompleted"
    );
  });

  it("Delete task", async () => {
    await truncateAllTables();

    const task = await addTask({
      title: "Delete Test",
      description: null,
      kid_name: "Test Kid",
      due_date: getTomorrowString(),
    });

    let tasks = await getAllTasks();
    assert.equal(tasks.length, 1, "Should have 1 task");

    await deleteTask(task.id);

    tasks = await getAllTasks();
    assert.equal(tasks.length, 0, "Should have no tasks");
  });

  it("Completed tasks week boundary", async () => {
    await truncateAllTables();

    const sql = neon(process.env.DATABASE_URL!);
    const kidName = "Week Test Kid";

    await addTask({
      title: "Incomplete Task",
      description: null,
      kid_name: kidName,
      due_date: getTodayString(),
    });

    const recentTask = await addTask({
      title: "Recent Completed Task",
      description: null,
      kid_name: kidName,
      due_date: getTodayString(),
    });
    await toggleTaskComplete(recentTask.id, getTodayString());

    const oldCompletedDateStr = getDayString(-10);
    await sql`
      INSERT INTO tasks (title, description, kid_name, due_date, completed_on)
      VALUES ('Old Completed Task', null, ${kidName}, ${getDayString(-10)}, ${oldCompletedDateStr})
    `;

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
  });

  it("Tasks for parent view", async () => {
    await truncateAllTables();

    const kidName = "Test Kid";

    await addTask({
      title: "Old Task",
      description: null,
      kid_name: kidName,
      due_date: getDayString(-10),
    });

    await addTask({
      title: "Recent Task",
      description: null,
      kid_name: kidName,
      due_date: getDayString(-3),
    });

    const futureTask = await addTask({
      title: "Future Task",
      description: null,
      kid_name: kidName,
      due_date: getTomorrowString(),
    });

    await toggleTaskComplete(futureTask.id, getTodayString());

    const { getTasksForParentView } = await import("../app/lib/db");
    const parentTasks = await getTasksForParentView();

    assert(parentTasks.length >= 2, "Should have at least 2 tasks in parent view");

    const completedRecent = parentTasks.filter(t => t.completed_on !== null);
    assert(completedRecent.length > 0, "Should include recently completed tasks");
  });

  it("Error handling", async () => {
    await truncateAllTables();

    try {
      await addChoreSchedule(999999, "Test Kid", "invalid_day" as DayOfWeek);
      assert.fail("Should have thrown error for invalid day");
    } catch {
      // Expected
    }

    const uniqueName = `Unique Test ${Date.now()}`;
    await addChore({ name: uniqueName, description: "First" });

    try {
      await addChore({ name: uniqueName, description: "Second" });
      assert.fail("Should have thrown error for duplicate chore name");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      assert(
        message.includes("duplicate key") || message.includes("already exists"),
        "Should throw duplicate key error"
      );
    }
  });

  it("Unified sorting", async () => {
    await truncateAllTables();

    const kidName = "Sorting Kid";

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

    const dayOfWeek = getDayOfWeekInTimezone();
    const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayName = dayNames[dayOfWeek];
    const yesterdayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
    const tomorrowName = dayNames[dayOfWeek === 6 ? 0 : dayOfWeek + 1];

    await addChoreSchedule(bedChore.id, kidName, yesterdayName);
    await addChoreSchedule(dishesChore.id, kidName, todayName);
    await addChoreSchedule(roomChore.id, kidName, tomorrowName);

    await addTask({
      title: "Homework",
      description: null,
      kid_name: kidName,
      due_date: getYesterdayString(),
    });
    await addTask({
      title: "Library Books",
      description: null,
      kid_name: kidName,
      due_date: getTodayString(),
    });
    await addTask({
      title: "Science Project",
      description: null,
      kid_name: kidName,
      due_date: getTomorrowString(),
    });

    await addTask({
      title: "Art Project",
      description: null,
      kid_name: kidName,
      due_date: getTodayString(),
    });

    const allChores = await getCurrentWeekChores();
    const chores = allChores.filter(c => c.kid_name === kidName);
    const tasks = await getTasksForKid(kidName);

    const { createSortableItems, sortItems } = await import("../app/lib/sorting");

    const sortableItems = createSortableItems(chores, tasks, getTestDate(), TIMEZONE);
    const sortedItems = sortItems(sortableItems);

    const uncompletedItems = sortedItems.filter(item => !item.isCompleted);

    assert.equal(uncompletedItems.length, 7, "Should have 7 uncompleted items");

    const overdueItems = uncompletedItems.filter(i => i.status === "overdue");
    assert.equal(overdueItems.length, 2, "Should have 2 overdue items");
    const overdueTask = overdueItems.find(i => i.type === "task");
    const overdueChore = overdueItems.find(i => i.type === "chore");
    assert(overdueTask, "Should have an overdue task");
    assert(overdueChore, "Should have an overdue chore");

    const todayItems = uncompletedItems.filter(i => i.status === "today");
    assert.equal(todayItems.length, 3, "Should have 3 today items");
    const todayTasks = todayItems.filter(i => i.type === "task");
    const todayChores = todayItems.filter(i => i.type === "chore");
    assert.equal(todayTasks.length, 2, "Should have 2 tasks due today");
    assert.equal(todayChores.length, 1, "Should have 1 chore due today");

    const upcomingItems = uncompletedItems.filter(i => i.status === "upcoming");
    assert.equal(upcomingItems.length, 2, "Should have 2 upcoming items");

    const allSchedules = await getCurrentWeekChores();
    const dishesSchedule = allSchedules.find(
      s => s.chore_id === dishesChore.id && s.day_of_week === todayName && s.kid_name === kidName
    );
    if (!dishesSchedule) {
      throw new Error("Could not find dishes schedule");
    }
    const todayStr = getTodayString();
    await completeChore(dishesSchedule.id, todayStr, todayStr);

    const allChoresAfter = await getCurrentWeekChores();
    const choresAfter = allChoresAfter.filter(c => c.kid_name === kidName);
    const sortableItemsAfter = createSortableItems(choresAfter, tasks, getTestDate(), TIMEZONE);
    const sortedItemsAfter = sortItems(sortableItemsAfter);
    const uncompletedItemsAfter = sortedItemsAfter.filter(item => !item.isCompleted);

    assert.equal(uncompletedItemsAfter.length, 6, "Should have 6 uncompleted items after completion");
    assert(!uncompletedItemsAfter.find(i => i.name === "Do Dishes"), "Do Dishes should be completed");
  });

  it("Excuse chore", async () => {
    await truncateAllTables();

    const chore = await addChore({
      name: "Excusable Chore",
      description: "Test excuse",
    });
    const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      getDayOfWeekInTimezone()
    ] as DayOfWeek;
    await addChoreSchedule(chore.id, "Test Kid", todayDayOfWeek);

    const todayStr = getTodayString();

    const choresWithSchedules = await getAllChoresWithSchedules();
    const testChore = choresWithSchedules.find(c => c.id === chore.id);
    const scheduleId = testChore!.schedules[0].id;

    await excuseChore(scheduleId, todayStr, todayStr);
    let allChores = await getCurrentWeekChores();
    const excused = allChores.find(c => c.id === scheduleId);
    assert(excused?.excused, "Chore should be marked excused");

    await unexcuseChore(scheduleId, todayStr);
    allChores = await getCurrentWeekChores();
    const unexcused = allChores.find(c => c.id === scheduleId);
    assert(!unexcused?.excused, "Chore should not be marked excused");
  });

  it("Excuse task", async () => {
    await truncateAllTables();

    const task = await addTask({
      title: "Excusable Task",
      description: null,
      kid_name: "Test Kid",
      due_date: getTodayString(),
    });

    const excused = await excuseTask(task.id);
    assert(excused.excused, "Task should be marked excused");

    const unexcused = await unexcuseTask(task.id);
    assert(!unexcused.excused, "Task should not be marked excused");
  });

  it("Fixed vs flexible chores", async () => {
    await truncateAllTables();

    const fixedChore = await addChore({
      name: "Fixed Chore",
      description: "Must be done on scheduled day",
      flexible: false,
    });
    const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      getDayOfWeekInTimezone()
    ] as DayOfWeek;
    await addChoreSchedule(fixedChore.id, "Test Kid", todayDayOfWeek);

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
  });

  it("Weekly qualification", async () => {
    await truncateAllTables();

    const kidName = "Qualified Kid";
    const todayDayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      getDayOfWeekInTimezone()
    ] as DayOfWeek;

    const chore = await addChore({
      name: "Today Chore",
      description: null,
    });
    await addChoreSchedule(chore.id, kidName, todayDayOfWeek);

    const allChores = await getCurrentWeekChores();
    const schedule = allChores.find(c => c.kid_name === kidName);
    const todayStr = getTodayString();
    await completeChore(schedule!.id, todayStr, todayStr);

    const qualification = await getWeeklyQualification(kidName);
    assert(qualification.qualified, "Kid should be qualified after completing all chores");
    assert.equal(qualification.missedItems.length, 0, "Should have no missed items");
  });

  it("Incentive claim", async () => {
    await truncateAllTables();

    const kidName = "Claiming Kid";

    const claim = await claimIncentive(kidName, "screen_time");
    assert(claim.id, "Claim should have ID");
    assert.equal(claim.kid_name, kidName, "Claim should be for correct kid");
    assert.equal(claim.reward_type, "screen_time", "Claim should be for screen time");

    const retrieved = await getIncentiveClaim(kidName);
    assert(retrieved, "Should be able to retrieve claim");
    assert.equal(retrieved?.reward_type, "screen_time", "Retrieved claim should match");
  });

  it("Late completion detection", async () => {
    await truncateAllTables();

    const sql = neon(process.env.DATABASE_URL!);
    const kidName = "Late Test Kid";

    const yesterdayDayOfWeek = getDayNameForOffset(-1);

    const fixedChore = await addChore({
      name: "Fixed Chore Yesterday",
      description: null,
      flexible: false,
    });
    await addChoreSchedule(fixedChore.id, kidName, yesterdayDayOfWeek);

    const allChores = await getCurrentWeekChores();
    const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
    assert(schedule, "Should find the schedule");

    const yesterdayStr = getYesterdayString();
    const todayStr = getTodayString();
    await sql`
      INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, excused)
      VALUES (${schedule!.id}, ${yesterdayStr}, ${todayStr}, false)
    `;

    const updatedChores = await getCurrentWeekChores();
    const completed = updatedChores.find(c => c.id === schedule!.id);
    assert(completed?.is_completed, "Chore should be completed");
    assert(completed?.is_late_completion, "Should be marked as late completion");
  });

  it("Late completion disqualifies", async () => {
    await truncateAllTables();

    const sql = neon(process.env.DATABASE_URL!);
    const kidName = "Disqualified Kid";

    const { dayName: yesterdayDayOfWeek, dateStr: yesterdayStr } = getMostRecentPastWeekday();

    const fixedChore = await addChore({
      name: "Fixed Chore Weekday",
      description: null,
      flexible: false,
    });
    await addChoreSchedule(fixedChore.id, kidName, yesterdayDayOfWeek);

    const allChores = await getCurrentWeekChores();
    const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
    assert(schedule, "Should find the schedule");

    const todayStr = getTodayString();
    await sql`
      INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, excused)
      VALUES (${schedule!.id}, ${yesterdayStr}, ${todayStr}, false)
    `;

    const qualification = await getWeeklyQualification(kidName);
    assert(qualification.disqualified, "Should be disqualified due to late completion");
    assert(qualification.missedItems.length > 0, "Should have missed items");
  });

  it("Excuse late completion restores qualification", async () => {
    await truncateAllTables();

    const sql = neon(process.env.DATABASE_URL!);
    const kidName = "Excuse Late Kid";

    const { dayName: targetDayOfWeek, dateStr: targetDayStr } = getMostRecentPastWeekday();

    const fixedChore = await addChore({
      name: "Fixed Chore To Excuse",
      description: null,
      flexible: false,
    });
    await addChoreSchedule(fixedChore.id, kidName, targetDayOfWeek);

    const allChores = await getCurrentWeekChores();
    const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === fixedChore.id);
    assert(schedule, "Should find the schedule");

    const todayStr = getTodayString();
    await sql`
      INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, excused)
      VALUES (${schedule!.id}, ${targetDayStr}, ${todayStr}, false)
    `;

    let qualification = await getWeeklyQualification(kidName);
    assert(qualification.disqualified, "Should be disqualified before excuse");

    await excuseChore(schedule!.id, targetDayStr, todayStr);

    qualification = await getWeeklyQualification(kidName);
    assert(!qualification.disqualified, "Should not be disqualified after excuse");
    assert(qualification.qualified, "Should be qualified after excuse");
  });

  it("Flexible chores not marked late", async () => {
    await truncateAllTables();

    const sql = neon(process.env.DATABASE_URL!);
    const kidName = "Flexible Test Kid";

    const yesterdayDayOfWeek = getDayNameForOffset(-1);
    const yesterdayStr = getYesterdayString();

    const flexibleChore = await addChore({
      name: "Flexible Chore Yesterday",
      description: null,
      flexible: true,
    });
    await addChoreSchedule(flexibleChore.id, kidName, yesterdayDayOfWeek);

    const allChores = await getCurrentWeekChores();
    const schedule = allChores.find(c => c.kid_name === kidName && c.chore_id === flexibleChore.id);
    assert(schedule, "Should find the schedule");

    const todayStr = getTodayString();
    await sql`
      INSERT INTO chore_completions (chore_schedule_id, scheduled_on, completed_on, excused)
      VALUES (${schedule!.id}, ${yesterdayStr}, ${todayStr}, false)
    `;

    const updatedChores = await getCurrentWeekChores();
    const completed = updatedChores.find(c => c.id === schedule!.id);
    assert(completed?.is_completed, "Chore should be completed");
    assert(!completed?.is_late_completion, "Flexible chore should NOT be marked as late completion");
  });
});
