import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateQualification } from "../app/lib/qualification";
import { getDayOfWeekInTimezone, calculateMondayOfWeek, calculateChoreDate } from "../app/lib/db";
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

describe("Week boundary calculations", () => {
  it("calculateMondayOfWeek on Sunday returns previous Monday", () => {
    // Sunday Dec 15, 2024 at 3pm EST = 8pm UTC
    const sunday = new Date("2024-12-15T20:00:00Z");
    assert.strictEqual(calculateMondayOfWeek(sunday), "2024-12-09");
  });

  it("calculateMondayOfWeek on Monday returns same day", () => {
    // Monday Dec 9, 2024 at noon EST = 5pm UTC
    const monday = new Date("2024-12-09T17:00:00Z");
    assert.strictEqual(calculateMondayOfWeek(monday), "2024-12-09");
  });

  it("calculateMondayOfWeek on Saturday returns Monday of same week", () => {
    // Saturday Dec 14, 2024 at noon EST = 5pm UTC
    const saturday = new Date("2024-12-14T17:00:00Z");
    assert.strictEqual(calculateMondayOfWeek(saturday), "2024-12-09");
  });

  it("calculateMondayOfWeek at 11:59pm EST is still same day", () => {
    // Wednesday 11:59pm EST = Thursday 4:59am UTC
    const lateWed = new Date("2024-12-12T04:59:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(lateWed), 3, "Should be Wednesday");
    assert.strictEqual(calculateMondayOfWeek(lateWed), "2024-12-09");
  });

  it("calculateMondayOfWeek at 12:01am EST is next day", () => {
    // Thursday 12:01am EST = Thursday 5:01am UTC
    const earlyThurs = new Date("2024-12-12T05:01:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(earlyThurs), 4, "Should be Thursday");
    assert.strictEqual(calculateMondayOfWeek(earlyThurs), "2024-12-09");
  });

  it("calculateChoreDate returns correct date for each day of week", () => {
    const mondayStr = "2024-12-09";
    assert.strictEqual(calculateChoreDate(mondayStr, "monday"), "2024-12-09");
    assert.strictEqual(calculateChoreDate(mondayStr, "tuesday"), "2024-12-10");
    assert.strictEqual(calculateChoreDate(mondayStr, "wednesday"), "2024-12-11");
    assert.strictEqual(calculateChoreDate(mondayStr, "thursday"), "2024-12-12");
    assert.strictEqual(calculateChoreDate(mondayStr, "friday"), "2024-12-13");
    assert.strictEqual(calculateChoreDate(mondayStr, "saturday"), "2024-12-14");
    assert.strictEqual(calculateChoreDate(mondayStr, "sunday"), "2024-12-15");
  });

  it("Week boundary: Saturday 11:59pm EST to Sunday 12:01am EST", () => {
    // Saturday 11:59pm EST = Sunday 4:59am UTC
    const saturdayLate = new Date("2024-12-15T04:59:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(saturdayLate), 6, "Should be Saturday");
    assert.strictEqual(calculateMondayOfWeek(saturdayLate), "2024-12-09", "Should be week of Dec 9");

    // Sunday 12:01am EST = Sunday 5:01am UTC
    const sundayEarly = new Date("2024-12-15T05:01:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(sundayEarly), 0, "Should be Sunday");
    assert.strictEqual(calculateMondayOfWeek(sundayEarly), "2024-12-09", "Should still be week of Dec 9");
  });

  it("Week transition: Sunday 11:59pm EST to Monday 12:01am EST", () => {
    // Sunday 11:59pm EST = Monday 4:59am UTC
    const sundayLate = new Date("2024-12-16T04:59:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(sundayLate), 0, "Should be Sunday");
    assert.strictEqual(calculateMondayOfWeek(sundayLate), "2024-12-09", "Should be week of Dec 9");

    // Monday 12:01am EST = Monday 5:01am UTC
    const mondayEarly = new Date("2024-12-16T05:01:00Z");
    assert.strictEqual(getDayOfWeekInTimezone(mondayEarly), 1, "Should be Monday");
    assert.strictEqual(calculateMondayOfWeek(mondayEarly), "2024-12-16", "Should be NEW week of Dec 16");
  });
});
