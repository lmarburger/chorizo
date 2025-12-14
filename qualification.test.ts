import assert from "assert";
import { calculateQualification, type ChoreRow, type TaskRow, type IncentiveClaim } from "./app/lib/qualification";

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
  console.log("Running qualification unit tests...\n");

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

  console.log("\n✅ All 10 qualification unit tests passed!");
}

runTests().catch(err => {
  console.error("\n❌ Test failed:", err.message);
  process.exit(1);
});
