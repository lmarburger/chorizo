import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateQualification } from "../../app/lib/qualification";
import { createChoreRow, createTaskRow, createIncentiveClaim } from "../helpers";

describe("Qualification tests", () => {
  it("Fixed chore completed on time → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ completion_id: 1 })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when fixed chore done on time");
    assert.strictEqual(result.disqualified, false);
    assert.strictEqual(result.missedItems.length, 0);
  });

  it("Fixed chore completed late → disqualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ completion_id: 1, is_late_completion: true })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should disqualify when fixed chore completed late");
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1);
    assert.strictEqual(result.missedItems[0].type, "chore");
  });

  it("Late chore but excused → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ completion_id: 1, is_late_completion: true, excused: true })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when late chore is excused");
    assert.strictEqual(result.disqualified, false);
  });

  it("Missing fixed chore (past due) → disqualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ scheduled_date: "2025-01-06", completion_id: null })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should disqualify when fixed chore is missing");
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1);
  });

  it("Flexible chore incomplete before Friday → in progress", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ flexible: true, completion_id: null })],
      tasks: [],
      today: "2025-01-08", // Wednesday
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should not be qualified yet");
    assert.strictEqual(result.disqualified, false, "Should not be disqualified before Friday");
    assert.strictEqual(result.inProgress, true, "Should be in progress");
  });

  it("Flexible chore incomplete on Friday → disqualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ flexible: true, completion_id: null })],
      tasks: [],
      today: "2025-01-10", // Friday
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false);
    assert.strictEqual(result.disqualified, true, "Should disqualify when flexible chore incomplete on Friday");
    assert.strictEqual(result.missedItems.length, 1);
  });

  it("Task overdue → disqualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [],
      tasks: [createTaskRow({ due_date: "2025-01-06", completed_on: null })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false);
    assert.strictEqual(result.disqualified, true, "Should disqualify when task is overdue");
    assert.strictEqual(result.missedItems.length, 1);
    assert.strictEqual(result.missedItems[0].type, "task");
  });

  it("Task excused → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [],
      tasks: [createTaskRow({ due_date: "2025-01-06", completed_on: null, excused: true })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when overdue task is excused");
    assert.strictEqual(result.disqualified, false);
  });

  it("Existing claim is passed through", () => {
    const existingClaim = createIncentiveClaim();
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ completion_id: 1 })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim,
    });
    assert.strictEqual(result.claim, existingClaim, "Should pass through existing claim");
  });

  it("Empty week (no chores or tasks) → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when no chores or tasks exist");
    assert.strictEqual(result.disqualified, false);
    assert.strictEqual(result.inProgress, false);
  });

  it("Mixed fixed + flexible chores + tasks all complete → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [
        createChoreRow({ schedule_id: 1, flexible: false, scheduled_date: "2025-01-06", completion_id: 1 }),
        createChoreRow({ schedule_id: 2, flexible: false, scheduled_date: "2025-01-07", completion_id: 2 }),
        createChoreRow({ schedule_id: 3, flexible: true, scheduled_date: "2025-01-06", completion_id: 3 }),
        createChoreRow({ schedule_id: 4, flexible: true, scheduled_date: "2025-01-08", completion_id: 4 }),
      ],
      tasks: [
        createTaskRow({ id: 1, due_date: "2025-01-07", completed_on: "2025-01-07" }),
        createTaskRow({ id: 2, due_date: "2025-01-09", completed_on: "2025-01-09" }),
      ],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true);
    assert.strictEqual(result.disqualified, false);
    assert.strictEqual(result.missedItems.length, 0);
  });

  it("Mixed obligations: one late fixed chore disqualifies despite everything else done", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [
        createChoreRow({ schedule_id: 1, flexible: false, scheduled_date: "2025-01-06", completion_id: 1 }),
        createChoreRow({
          schedule_id: 2,
          flexible: false,
          scheduled_date: "2025-01-07",
          completion_id: 2,
          is_late_completion: true,
        }),
        createChoreRow({ schedule_id: 3, flexible: true, scheduled_date: "2025-01-06", completion_id: 3 }),
      ],
      tasks: [createTaskRow({ id: 1, due_date: "2025-01-08", completed_on: "2025-01-08" })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false);
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1);
    assert.strictEqual(result.missedItems[0].id, 2);
  });

  it("Task due today but incomplete → in progress (not disqualified)", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ completion_id: 1 })],
      tasks: [createTaskRow({ id: 1, due_date: "2025-01-10", completed_on: null })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Not qualified yet");
    assert.strictEqual(result.disqualified, false, "Not disqualified because task is due today, not past");
    assert.strictEqual(result.inProgress, true);
  });

  it("Multiple disqualifying items are all reported", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [
        createChoreRow({ schedule_id: 1, flexible: false, scheduled_date: "2025-01-06", completion_id: null }),
        createChoreRow({
          schedule_id: 2,
          flexible: false,
          scheduled_date: "2025-01-07",
          completion_id: 2,
          is_late_completion: true,
        }),
      ],
      tasks: [createTaskRow({ id: 3, due_date: "2025-01-06", completed_on: null })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 3, "Should report all 3 disqualifying items");
    const ids = result.missedItems.map(m => m.id);
    assert(ids.includes(1), "Should include missed fixed chore");
    assert(ids.includes(2), "Should include late fixed chore");
    assert(ids.includes(3), "Should include overdue task");
  });

  it("Flexible chore incomplete mid-week with overdue task → disqualified by task only", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [createChoreRow({ schedule_id: 1, flexible: true, completion_id: null })],
      tasks: [createTaskRow({ id: 1, due_date: "2025-01-06", completed_on: null })],
      today: "2025-01-08", // Wednesday, before Friday
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1, "Only overdue task should be missed");
    assert.strictEqual(result.missedItems[0].type, "task");
  });

  it("Mix of excused and completed items → qualified", () => {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [
        createChoreRow({ schedule_id: 1, flexible: false, scheduled_date: "2025-01-06", completion_id: 1 }),
        createChoreRow({
          schedule_id: 2,
          flexible: false,
          scheduled_date: "2025-01-07",
          completion_id: null,
          excused: true,
        }),
        createChoreRow({
          schedule_id: 3,
          flexible: true,
          scheduled_date: "2025-01-08",
          completion_id: null,
          excused: true,
        }),
      ],
      tasks: [
        createTaskRow({ id: 1, due_date: "2025-01-06", completed_on: "2025-01-06" }),
        createTaskRow({ id: 2, due_date: "2025-01-07", completed_on: null, excused: true }),
      ],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true);
    assert.strictEqual(result.disqualified, false);
    assert.strictEqual(result.missedItems.length, 0);
  });
});
