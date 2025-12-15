import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSortableItems, sortItems, type SortableItem } from "../app/lib/sorting";
import { type ChoreScheduleWithCompletion, type Task } from "../app/lib/db";

// Helper to create mock chore data
function createMockChore(overrides: Partial<ChoreScheduleWithCompletion> = {}): ChoreScheduleWithCompletion {
  return {
    id: 1,
    chore_id: 1,
    kid_name: "Test Kid",
    day_of_week: "monday",
    chore_name: "Test Chore",
    chore_description: null,
    flexible: false,
    is_completed: false,
    excused: false,
    is_late_completion: false,
    created_at: new Date(),
    ...overrides,
  };
}

// Helper to create mock task data
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Test Task",
    description: null,
    kid_name: "Test Kid",
    due_date: "2024-12-11", // Wednesday
    completed_at: null,
    excused_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe("Sorting with timezone-aware dates", () => {
  it("sorts correctly when viewed on Sunday", () => {
    // Sunday Dec 15, 2024 at 3pm EST = 8pm UTC
    const sunday = new Date("2024-12-15T20:00:00Z");

    const chores: ChoreScheduleWithCompletion[] = [
      createMockChore({ id: 1, day_of_week: "wednesday", chore_name: "Wednesday Chore" }),
      createMockChore({ id: 2, day_of_week: "monday", chore_name: "Monday Chore" }),
      createMockChore({ id: 3, day_of_week: "sunday", chore_name: "Sunday Chore" }),
    ];

    const items = createSortableItems(chores, [], sunday, "America/New_York");
    const sorted = sortItems(items);

    // When viewing on Sunday, Monday should be first (day 0), then Wednesday (day 2), then Sunday (day 6)
    assert.strictEqual(sorted[0].name, "Monday Chore", "Monday should be first");
    assert.strictEqual(sorted[1].name, "Wednesday Chore", "Wednesday should be second");
    assert.strictEqual(sorted[2].name, "Sunday Chore", "Sunday should be last");
  });

  it("task dayNumber is calculated with timezone awareness", () => {
    // Wednesday Dec 11, 2024 at 11:59pm EST = Thursday 4:59am UTC
    const lateWednesday = new Date("2024-12-12T04:59:00Z");

    const tasks: Task[] = [createMockTask({ id: 1, title: "Wednesday Task", due_date: "2024-12-11" })];

    const items = createSortableItems([], tasks, lateWednesday, "America/New_York");

    // Task due on Wednesday should have dayNumber = 2 (Mon=0, Tue=1, Wed=2)
    assert.strictEqual(items[0].dayNumber, 2, "Wednesday task should have dayNumber 2");
  });

  it("completed items sort to bottom by completion time", () => {
    const now = new Date("2024-12-11T17:00:00Z"); // Wednesday noon EST

    const chores: ChoreScheduleWithCompletion[] = [
      createMockChore({
        id: 1,
        day_of_week: "monday",
        chore_name: "Completed Monday",
        is_completed: true,
        completed_at: new Date("2024-12-09T18:00:00Z"),
      }),
      createMockChore({
        id: 2,
        day_of_week: "wednesday",
        chore_name: "Incomplete Wednesday",
        is_completed: false,
      }),
      createMockChore({
        id: 3,
        day_of_week: "tuesday",
        chore_name: "Completed Tuesday",
        is_completed: true,
        completed_at: new Date("2024-12-10T20:00:00Z"),
      }),
    ];

    const items = createSortableItems(chores, [], now, "America/New_York");
    const sorted = sortItems(items);

    // Incomplete items first, then completed items by completion time (most recent first)
    assert.strictEqual(sorted[0].name, "Incomplete Wednesday", "Incomplete should be first");
    assert.strictEqual(sorted[1].name, "Completed Tuesday", "Most recently completed should be next");
    assert.strictEqual(sorted[2].name, "Completed Monday", "Earlier completed should be last");
  });

  it("mixed chores and tasks sort by day then type", () => {
    const now = new Date("2024-12-09T17:00:00Z"); // Monday noon EST

    const chores: ChoreScheduleWithCompletion[] = [
      createMockChore({ id: 1, day_of_week: "wednesday", chore_name: "Wed Chore" }),
    ];

    const tasks: Task[] = [createMockTask({ id: 1, title: "Wed Task", due_date: "2024-12-11" })];

    const items = createSortableItems(chores, tasks, now, "America/New_York");
    const sorted = sortItems(items);

    // Same day (Wednesday): tasks before chores
    assert.strictEqual(sorted[0].name, "Wed Task", "Task should come before chore on same day");
    assert.strictEqual(sorted[1].name, "Wed Chore", "Chore should come after task on same day");
  });

  it("sorts correctly at late evening when UTC is next day", () => {
    // Wednesday 11:30pm EST = Thursday 4:30am UTC
    const lateEvening = new Date("2024-12-12T04:30:00Z");

    const chores: ChoreScheduleWithCompletion[] = [
      createMockChore({ id: 1, day_of_week: "thursday", chore_name: "Thursday Chore" }),
      createMockChore({ id: 2, day_of_week: "wednesday", chore_name: "Wednesday Chore" }),
    ];

    const items = createSortableItems(chores, [], lateEvening, "America/New_York");
    const sorted = sortItems(items);

    // At 11:30pm Wednesday EST, today should still be Wednesday (today status)
    const wedItem = sorted.find(i => i.name === "Wednesday Chore");
    const thuItem = sorted.find(i => i.name === "Thursday Chore");

    assert.strictEqual(wedItem?.status, "today", "Wednesday chore should be 'today' status");
    assert.strictEqual(thuItem?.status, "upcoming", "Thursday chore should be 'upcoming'");
  });

  it("task status uses timezone-aware comparison", () => {
    // Wednesday 11:59pm EST = Thursday 4:59am UTC
    const lateWednesday = new Date("2024-12-12T04:59:00Z");

    const tasks: Task[] = [
      createMockTask({ id: 1, title: "Due Today", due_date: "2024-12-11" }), // Wednesday
      createMockTask({ id: 2, title: "Due Tomorrow", due_date: "2024-12-12" }), // Thursday
      createMockTask({ id: 3, title: "Overdue", due_date: "2024-12-10" }), // Tuesday
    ];

    const items = createSortableItems([], tasks, lateWednesday, "America/New_York");

    const dueToday = items.find(i => i.name === "Due Today");
    const dueTomorrow = items.find(i => i.name === "Due Tomorrow");
    const overdue = items.find(i => i.name === "Overdue");

    assert.strictEqual(dueToday?.status, "today", "Task due Wednesday should be 'today' at 11:59pm Wed");
    assert.strictEqual(dueTomorrow?.status, "upcoming", "Task due Thursday should be 'upcoming'");
    assert.strictEqual(overdue?.status, "overdue", "Task due Tuesday should be 'overdue'");
  });
});
