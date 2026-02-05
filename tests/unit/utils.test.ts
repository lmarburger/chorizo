import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseLocalDate, getDaysUntilDue, isToday, isPastDate, formatDateForInput } from "../../app/lib/utils";
import { formatDateString } from "../../app/lib/date-utils";

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD format correctly", () => {
    const result = parseLocalDate("2024-12-18");
    // When formatted back to string in APP_TIMEZONE, should produce same date
    assert.strictEqual(formatDateString(result), "2024-12-18");
  });

  it("parses various dates correctly", () => {
    // Test several dates to ensure consistency
    assert.strictEqual(formatDateString(parseLocalDate("2024-01-01")), "2024-01-01");
    assert.strictEqual(formatDateString(parseLocalDate("2024-06-15")), "2024-06-15");
    assert.strictEqual(formatDateString(parseLocalDate("2024-12-31")), "2024-12-31");
    assert.strictEqual(formatDateString(parseLocalDate("2025-02-28")), "2025-02-28");
  });

  it("handles leap year date", () => {
    assert.strictEqual(formatDateString(parseLocalDate("2024-02-29")), "2024-02-29");
  });

  it("uses noon UTC internally for timezone stability", () => {
    const result = parseLocalDate("2024-12-18");
    // Should be noon UTC
    assert.strictEqual(result.getUTCHours(), 12);
    assert.strictEqual(result.getUTCMinutes(), 0);
    assert.strictEqual(result.getUTCSeconds(), 0);
  });

  it("passes through ISO datetime strings", () => {
    const isoString = "2024-12-18T15:30:00Z";
    const result = parseLocalDate(isoString);
    // toISOString() normalizes to .000Z format
    assert.strictEqual(result.toISOString(), "2024-12-18T15:30:00.000Z");
  });

  it("produces consistent results for date comparisons", () => {
    const date1 = parseLocalDate("2024-12-18");
    const date2 = parseLocalDate("2024-12-19");
    const date3 = parseLocalDate("2024-12-17");

    assert.ok(date1 < date2, "Dec 18 should be before Dec 19");
    assert.ok(date1 > date3, "Dec 18 should be after Dec 17");
  });
});

describe("getDaysUntilDue", () => {
  it("returns 0 for today", () => {
    // Wednesday Dec 11, 2024 at noon EST = 5pm UTC
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getDaysUntilDue("2024-12-11", now), 0);
  });

  it("returns positive number for future dates", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getDaysUntilDue("2024-12-12", now), 1);
    assert.strictEqual(getDaysUntilDue("2024-12-18", now), 7);
  });

  it("returns negative number for past dates", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getDaysUntilDue("2024-12-10", now), -1);
    assert.strictEqual(getDaysUntilDue("2024-12-04", now), -7);
  });

  it("works correctly at late evening (11:59pm EST)", () => {
    // Wednesday 11:59pm EST = Thursday 4:59am UTC
    // In EST this is still Wednesday Dec 11
    const lateWed = new Date("2024-12-12T04:59:00Z");
    // Due date is Dec 11 (today in EST) - should be 0
    assert.strictEqual(getDaysUntilDue("2024-12-11", lateWed), 0);
    // Due date is Dec 12 (tomorrow in EST) - should be 1
    assert.strictEqual(getDaysUntilDue("2024-12-12", lateWed), 1);
  });

  it("works correctly at early morning (12:01am EST)", () => {
    // Thursday 12:01am EST = Thursday 5:01am UTC
    // In EST this is Thursday Dec 12
    const earlyThurs = new Date("2024-12-12T05:01:00Z");
    // Due date is Dec 12 (today in EST) - should be 0
    assert.strictEqual(getDaysUntilDue("2024-12-12", earlyThurs), 0);
    // Due date is Dec 11 (yesterday in EST) - should be -1
    assert.strictEqual(getDaysUntilDue("2024-12-11", earlyThurs), -1);
  });
});

describe("isToday", () => {
  it("returns true for today's date string", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isToday("2024-12-11", now), true);
  });

  it("returns false for yesterday's date string", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isToday("2024-12-10", now), false);
  });

  it("returns false for tomorrow's date string", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isToday("2024-12-12", now), false);
  });

  it("handles late evening EST correctly", () => {
    // 11:59pm EST Wed Dec 11 = Thu Dec 12 4:59am UTC
    const lateWed = new Date("2024-12-12T04:59:00Z");
    assert.strictEqual(isToday("2024-12-11", lateWed), true);
    assert.strictEqual(isToday("2024-12-12", lateWed), false);
  });

  it("handles ISO datetime strings", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isToday("2024-12-11T00:00:00Z", now), true);
  });
});

describe("isPastDate", () => {
  it("returns false for today", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isPastDate("2024-12-11", now), false);
  });

  it("returns true for yesterday", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isPastDate("2024-12-10", now), true);
  });

  it("returns false for tomorrow", () => {
    const now = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(isPastDate("2024-12-12", now), false);
  });

  it("handles late evening EST correctly", () => {
    // 11:59pm EST Wed Dec 11 = Thu Dec 12 4:59am UTC
    const lateWed = new Date("2024-12-12T04:59:00Z");
    assert.strictEqual(isPastDate("2024-12-11", lateWed), false, "Today is not past");
    assert.strictEqual(isPastDate("2024-12-10", lateWed), true, "Yesterday is past");
    assert.strictEqual(isPastDate("2024-12-12", lateWed), false, "Tomorrow is not past");
  });

  it("handles near-midnight boundary correctly", () => {
    // 12:01am EST Thu Dec 12 = Thu Dec 12 5:01am UTC
    const earlyThu = new Date("2024-12-12T05:01:00Z");
    assert.strictEqual(isPastDate("2024-12-11", earlyThu), true, "Yesterday is past");
    assert.strictEqual(isPastDate("2024-12-12", earlyThu), false, "Today is not past");
  });
});

describe("formatDateForInput", () => {
  it("returns date string unchanged for YYYY-MM-DD format", () => {
    assert.strictEqual(formatDateForInput("2024-12-11"), "2024-12-11");
  });

  it("extracts date from ISO datetime string", () => {
    assert.strictEqual(formatDateForInput("2024-12-11T17:00:00Z"), "2024-12-11");
    assert.strictEqual(formatDateForInput("2024-12-11T00:00:00.000Z"), "2024-12-11");
  });

  it("formats Date object correctly", () => {
    // Wednesday Dec 11, 2024 at noon EST = 5pm UTC
    const date = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(formatDateForInput(date), "2024-12-11");
  });
});

describe("parseLocalDate timezone stability", () => {
  // These tests verify the fix for the production/local timezone bug
  // The key insight: parseLocalDate("2024-12-18") should always represent Dec 18,
  // regardless of whether the server is running in UTC or EST

  it("roundtrips correctly: parse then format returns same date", () => {
    const dates = ["2024-01-01", "2024-06-15", "2024-12-18", "2024-12-31"];
    for (const dateStr of dates) {
      const parsed = parseLocalDate(dateStr);
      const formatted = formatDateString(parsed);
      assert.strictEqual(formatted, dateStr, `Roundtrip failed for ${dateStr}`);
    }
  });

  it("comparison with formatDateString-generated dates works correctly", () => {
    // Simulate what happens in production:
    // 1. Server has a Date object representing "now" in UTC
    // 2. formatDateString converts it to "2024-12-11" in EST
    // 3. parseLocalDate parses a due date "2024-12-11"
    // 4. These should compare as equal

    // 5pm UTC = noon EST on Dec 11
    const serverNow = new Date("2024-12-11T17:00:00Z");
    const todayStr = formatDateString(serverNow); // "2024-12-11" in EST

    const dueDate = "2024-12-11";
    const parsedDue = parseLocalDate(dueDate);
    const parsedDueStr = formatDateString(parsedDue);

    assert.strictEqual(todayStr, "2024-12-11");
    assert.strictEqual(parsedDueStr, "2024-12-11");
    assert.strictEqual(todayStr, parsedDueStr, "Today and due date should match");
  });

  it("late night EST edge case: parseLocalDate remains stable", () => {
    // 4am UTC = 11pm EST (previous calendar day)
    // If we're in UTC and parse "2024-12-11", it should still be Dec 11
    const parsed = parseLocalDate("2024-12-11");
    assert.strictEqual(formatDateString(parsed), "2024-12-11");

    // The bug was: new Date(2024, 11, 11) in UTC creates midnight UTC,
    // which is 7pm EST on Dec 10 - wrong day!
    // The fix uses noon UTC, which is 7am EST on Dec 11 - correct!
  });
});
