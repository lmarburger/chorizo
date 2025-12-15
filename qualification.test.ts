import assert from "assert";
import { calculateQualification, type ChoreRow, type TaskRow, type IncentiveClaim } from "./app/lib/qualification";
import { getDayOfWeekInTimezone } from "./app/lib/db";

// Helper to create a chore row
function chore(overrides: Partial<ChoreRow> = {}): ChoreRow {
  return {
    schedule_id: 1,
    chore_name: "Test Chore",
    flexible: false,
    scheduled_date: "2025-01-06",
    completion_id: null,
    excused: null,
    is_late_completion: false,
    ...overrides,
  };
}

// Helper to create a task row
function task(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 1,
    title: "Test Task",
    due_date: "2025-01-06",
    completed_at: null,
    excused_at: null,
    ...overrides,
  };
}

// Helper to create a claim
function claim(overrides: Partial<IncentiveClaim> = {}): IncentiveClaim {
  return {
    id: 1,
    kid_name: "Alex",
    week_start_date: "2025-01-06",
    reward_type: "screen_time",
    claimed_at: new Date("2025-01-10T12:00:00Z"),
    dismissed_at: null,
    ...overrides,
  };
}

async function runTests() {
  console.log("Running unit tests...\n");

  // Timezone Tests - ensure getDayOfWeekInTimezone correctly handles UTC vs America/New_York
  // This prevents the bug where the parent dashboard showed Monday chores on Sunday evening
  console.log("Timezone Tests (getDayOfWeekInTimezone):");
  console.log("-----------------------------------------");

  // The bug: Sunday 8:45pm EST = Monday 1:45am UTC
  // Using Date.getDay() on Vercel (UTC) would return 1 (Monday)
  // getDayOfWeekInTimezone should return 0 (Sunday) in America/New_York
  {
    const sundayEveningUTC = new Date("2024-12-16T01:45:00Z"); // Monday 1:45am UTC = Sunday 8:45pm EST
    assert.strictEqual(getDayOfWeekInTimezone(sundayEveningUTC), 0, "Sunday 8:45pm EST should be Sunday (0)");
    console.log("✓ Sunday 8:45pm EST (Monday 1:45am UTC) → Sunday (0)");
  }

  {
    const sundayLateNightUTC = new Date("2024-12-16T04:59:00Z"); // Monday 4:59am UTC = Sunday 11:59pm EST
    assert.strictEqual(getDayOfWeekInTimezone(sundayLateNightUTC), 0, "Sunday 11:59pm EST should be Sunday (0)");
    console.log("✓ Sunday 11:59pm EST (Monday 4:59am UTC) → Sunday (0)");
  }

  {
    const mondayEarlyUTC = new Date("2024-12-16T05:01:00Z"); // Monday 5:01am UTC = Monday 12:01am EST
    assert.strictEqual(getDayOfWeekInTimezone(mondayEarlyUTC), 1, "Monday 12:01am EST should be Monday (1)");
    console.log("✓ Monday 12:01am EST (Monday 5:01am UTC) → Monday (1)");
  }

  {
    const mondayNoonEST = new Date("2024-12-16T17:00:00Z"); // Monday 5pm UTC = Monday noon EST
    assert.strictEqual(getDayOfWeekInTimezone(mondayNoonEST), 1, "Monday noon EST should be Monday (1)");
    console.log("✓ Monday noon EST → Monday (1)");
  }

  {
    const saturdayLateUTC = new Date("2024-12-15T04:00:00Z"); // Sunday 4am UTC = Saturday 11pm EST
    assert.strictEqual(getDayOfWeekInTimezone(saturdayLateUTC), 6, "Saturday 11pm EST should be Saturday (6)");
    console.log("✓ Saturday 11pm EST (Sunday 4am UTC) → Saturday (6)");
  }

  {
    const fridayNoonEST = new Date("2024-12-13T17:00:00Z"); // Friday 5pm UTC = Friday noon EST
    assert.strictEqual(getDayOfWeekInTimezone(fridayNoonEST), 5, "Friday noon EST should be Friday (5)");
    console.log("✓ Friday noon EST → Friday (5)");
  }

  {
    const wednesdayAfternoon = new Date("2024-12-11T20:00:00Z"); // Wednesday 8pm UTC = Wednesday 3pm EST
    assert.strictEqual(getDayOfWeekInTimezone(wednesdayAfternoon), 3, "Wednesday 3pm EST should be Wednesday (3)");
    console.log("✓ Wednesday 3pm EST → Wednesday (3)");
  }

  console.log("\nQualification Tests:");
  console.log("-----------------------------------------");

  // Test 1: Fixed chore completed on time → qualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ completion_id: 1 })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when fixed chore done on time");
    assert.strictEqual(result.disqualified, false);
    assert.strictEqual(result.missedItems.length, 0);
    console.log("✓ Test 1: Fixed chore completed on time → qualified");
  }

  // Test 2: Fixed chore completed late → disqualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ completion_id: 1, is_late_completion: true })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should disqualify when fixed chore completed late");
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1);
    assert.strictEqual(result.missedItems[0].type, "chore");
    console.log("✓ Test 2: Fixed chore completed late → disqualified");
  }

  // Test 3: Late chore but excused → qualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ completion_id: 1, is_late_completion: true, excused: true })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when late chore is excused");
    assert.strictEqual(result.disqualified, false);
    console.log("✓ Test 3: Late chore but excused → qualified");
  }

  // Test 4: Missing fixed chore (past due) → disqualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ scheduled_date: "2025-01-06", completion_id: null })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should disqualify when fixed chore is missing");
    assert.strictEqual(result.disqualified, true);
    assert.strictEqual(result.missedItems.length, 1);
    console.log("✓ Test 4: Missing fixed chore (past due) → disqualified");
  }

  // Test 5: Flexible chore incomplete before Friday → in progress (not disqualified yet)
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ flexible: true, completion_id: null })],
      tasks: [],
      today: "2025-01-08", // Wednesday
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false, "Should not be qualified yet");
    assert.strictEqual(result.disqualified, false, "Should not be disqualified before Friday");
    assert.strictEqual(result.inProgress, true, "Should be in progress");
    console.log("✓ Test 5: Flexible chore incomplete before Friday → in progress");
  }

  // Test 6: Flexible chore incomplete on Friday → disqualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ flexible: true, completion_id: null })],
      tasks: [],
      today: "2025-01-10", // Friday
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false);
    assert.strictEqual(result.disqualified, true, "Should disqualify when flexible chore incomplete on Friday");
    assert.strictEqual(result.missedItems.length, 1);
    console.log("✓ Test 6: Flexible chore incomplete on Friday → disqualified");
  }

  // Test 7: Task overdue → disqualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [],
      tasks: [task({ due_date: "2025-01-06", completed_at: null })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, false);
    assert.strictEqual(result.disqualified, true, "Should disqualify when task is overdue");
    assert.strictEqual(result.missedItems.length, 1);
    assert.strictEqual(result.missedItems[0].type, "task");
    console.log("✓ Test 7: Task overdue → disqualified");
  }

  // Test 8: Task excused → qualified
  {
    const result = calculateQualification({
      kidName: "Alex",
      chores: [],
      tasks: [task({ due_date: "2025-01-06", completed_at: null, excused_at: "2025-01-07T12:00:00Z" })],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim: null,
    });
    assert.strictEqual(result.qualified, true, "Should qualify when overdue task is excused");
    assert.strictEqual(result.disqualified, false);
    console.log("✓ Test 8: Task excused → qualified");
  }

  // Test 9: Existing claim is passed through
  {
    const existingClaim = claim();
    const result = calculateQualification({
      kidName: "Alex",
      chores: [chore({ completion_id: 1 })],
      tasks: [],
      today: "2025-01-10",
      fridayStr: "2025-01-10",
      existingClaim,
    });
    assert.strictEqual(result.claim, existingClaim, "Should pass through existing claim");
    console.log("✓ Test 9: Existing claim is passed through");
  }

  // Test 10: Empty week (no chores or tasks) → qualified
  {
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
    console.log("✓ Test 10: Empty week (no chores or tasks) → qualified");
  }

  console.log("\n✅ All 17 unit tests passed! (7 timezone + 10 qualification)");
}

runTests().catch(err => {
  console.error("\n❌ Test failed:", err.message);
  process.exit(1);
});
