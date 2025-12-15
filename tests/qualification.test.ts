import assert from "assert";
import { calculateQualification } from "../app/lib/qualification";
import { getDayOfWeekInTimezone } from "../app/lib/db";
import { createChoreRow, createTaskRow, createIncentiveClaim } from "./helpers";

// Timezone tests
function testSundayEveningEST() {
  const sundayEveningUTC = new Date("2024-12-16T01:45:00Z"); // Monday 1:45am UTC = Sunday 8:45pm EST
  assert.strictEqual(getDayOfWeekInTimezone(sundayEveningUTC), 0, "Sunday 8:45pm EST should be Sunday (0)");
}

function testSundayLateNightEST() {
  const sundayLateNightUTC = new Date("2024-12-16T04:59:00Z"); // Monday 4:59am UTC = Sunday 11:59pm EST
  assert.strictEqual(getDayOfWeekInTimezone(sundayLateNightUTC), 0, "Sunday 11:59pm EST should be Sunday (0)");
}

function testMondayEarlyEST() {
  const mondayEarlyUTC = new Date("2024-12-16T05:01:00Z"); // Monday 5:01am UTC = Monday 12:01am EST
  assert.strictEqual(getDayOfWeekInTimezone(mondayEarlyUTC), 1, "Monday 12:01am EST should be Monday (1)");
}

function testMondayNoonEST() {
  const mondayNoonEST = new Date("2024-12-16T17:00:00Z"); // Monday 5pm UTC = Monday noon EST
  assert.strictEqual(getDayOfWeekInTimezone(mondayNoonEST), 1, "Monday noon EST should be Monday (1)");
}

function testSaturdayLateEST() {
  const saturdayLateUTC = new Date("2024-12-15T04:00:00Z"); // Sunday 4am UTC = Saturday 11pm EST
  assert.strictEqual(getDayOfWeekInTimezone(saturdayLateUTC), 6, "Saturday 11pm EST should be Saturday (6)");
}

function testFridayNoonEST() {
  const fridayNoonEST = new Date("2024-12-13T17:00:00Z"); // Friday 5pm UTC = Friday noon EST
  assert.strictEqual(getDayOfWeekInTimezone(fridayNoonEST), 5, "Friday noon EST should be Friday (5)");
}

function testWednesdayAfternoonEST() {
  const wednesdayAfternoon = new Date("2024-12-11T20:00:00Z"); // Wednesday 8pm UTC = Wednesday 3pm EST
  assert.strictEqual(getDayOfWeekInTimezone(wednesdayAfternoon), 3, "Wednesday 3pm EST should be Wednesday (3)");
}

// Qualification tests
function testFixedChoreOnTime() {
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
}

function testFixedChoreLate() {
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
}

function testLateChoreExcused() {
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
}

function testMissingFixedChore() {
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
}

function testFlexibleChoreBeforeFriday() {
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
}

function testFlexibleChoreOnFriday() {
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
}

function testTaskOverdue() {
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
}

function testTaskExcused() {
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
}

function testExistingClaimPassthrough() {
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
}

function testEmptyWeek() {
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
}

// Test runner
const timezoneTests = [
  { name: "Sunday 8:45pm EST → Sunday (0)", fn: testSundayEveningEST },
  { name: "Sunday 11:59pm EST → Sunday (0)", fn: testSundayLateNightEST },
  { name: "Monday 12:01am EST → Monday (1)", fn: testMondayEarlyEST },
  { name: "Monday noon EST → Monday (1)", fn: testMondayNoonEST },
  { name: "Saturday 11pm EST → Saturday (6)", fn: testSaturdayLateEST },
  { name: "Friday noon EST → Friday (5)", fn: testFridayNoonEST },
  { name: "Wednesday 3pm EST → Wednesday (3)", fn: testWednesdayAfternoonEST },
];

const qualificationTests = [
  { name: "Fixed chore completed on time → qualified", fn: testFixedChoreOnTime },
  { name: "Fixed chore completed late → disqualified", fn: testFixedChoreLate },
  { name: "Late chore but excused → qualified", fn: testLateChoreExcused },
  { name: "Missing fixed chore (past due) → disqualified", fn: testMissingFixedChore },
  { name: "Flexible chore incomplete before Friday → in progress", fn: testFlexibleChoreBeforeFriday },
  { name: "Flexible chore incomplete on Friday → disqualified", fn: testFlexibleChoreOnFriday },
  { name: "Task overdue → disqualified", fn: testTaskOverdue },
  { name: "Task excused → qualified", fn: testTaskExcused },
  { name: "Existing claim is passed through", fn: testExistingClaimPassthrough },
  { name: "Empty week (no chores or tasks) → qualified", fn: testEmptyWeek },
];

function runTests() {
  const allTests = [...timezoneTests, ...qualificationTests];
  const failures: { name: string; error: Error }[] = [];

  for (const test of allTests) {
    try {
      test.fn();
    } catch (error) {
      failures.push({ name: test.name, error: error as Error });
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} test(s) failed:\n`);
    for (const failure of failures) {
      console.error(`  ✗ ${failure.name}`);
      console.error(`    ${failure.error.message}\n`);
    }
    process.exit(1);
  }

  process.exit(0);
}

runTests();
