import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateQualification } from "../app/lib/qualification";
import { getDayOfWeekInTimezone } from "../app/lib/db";
import { createChoreRow, createTaskRow, createIncentiveClaim } from "./helpers";

describe("Timezone tests", () => {
  it("Sunday 8:45pm EST → Sunday (0)", () => {
    const sundayEveningUTC = new Date("2024-12-16T01:45:00Z"); // Monday 1:45am UTC = Sunday 8:45pm EST
    assert.strictEqual(getDayOfWeekInTimezone(sundayEveningUTC), 0, "Sunday 8:45pm EST should be Sunday (0)");
  });

  it("Sunday 11:59pm EST → Sunday (0)", () => {
    const sundayLateNightUTC = new Date("2024-12-16T04:59:00Z"); // Monday 4:59am UTC = Sunday 11:59pm EST
    assert.strictEqual(getDayOfWeekInTimezone(sundayLateNightUTC), 0, "Sunday 11:59pm EST should be Sunday (0)");
  });

  it("Monday 12:01am EST → Monday (1)", () => {
    const mondayEarlyUTC = new Date("2024-12-16T05:01:00Z"); // Monday 5:01am UTC = Monday 12:01am EST
    assert.strictEqual(getDayOfWeekInTimezone(mondayEarlyUTC), 1, "Monday 12:01am EST should be Monday (1)");
  });

  it("Monday noon EST → Monday (1)", () => {
    const mondayNoonEST = new Date("2024-12-16T17:00:00Z"); // Monday 5pm UTC = Monday noon EST
    assert.strictEqual(getDayOfWeekInTimezone(mondayNoonEST), 1, "Monday noon EST should be Monday (1)");
  });

  it("Saturday 11pm EST → Saturday (6)", () => {
    const saturdayLateUTC = new Date("2024-12-15T04:00:00Z"); // Sunday 4am UTC = Saturday 11pm EST
    assert.strictEqual(getDayOfWeekInTimezone(saturdayLateUTC), 6, "Saturday 11pm EST should be Saturday (6)");
  });

  it("Friday noon EST → Friday (5)", () => {
    const fridayNoonEST = new Date("2024-12-13T17:00:00Z"); // Friday 5pm UTC = Friday noon EST
    assert.strictEqual(getDayOfWeekInTimezone(fridayNoonEST), 5, "Friday noon EST should be Friday (5)");
  });

  it("Wednesday 3pm EST → Wednesday (3)", () => {
    const wednesdayAfternoon = new Date("2024-12-11T20:00:00Z"); // Wednesday 8pm UTC = Wednesday 3pm EST
    assert.strictEqual(getDayOfWeekInTimezone(wednesdayAfternoon), 3, "Wednesday 3pm EST should be Wednesday (3)");
  });
});

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
      tasks: [createTaskRow({ due_date: "2025-01-06", completed_at: null })],
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
      tasks: [createTaskRow({ due_date: "2025-01-06", completed_at: null, excused_at: "2025-01-07T12:00:00Z" })],
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
});
