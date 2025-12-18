import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDayOfWeekInTimezone,
  getDayOfWeekFromDateString,
  calculateMondayOfWeek,
  calculateChoreDate,
} from "../../app/lib/timezone";

describe("getDayOfWeekFromDateString (calendar date)", () => {
  it("returns correct day for each day of week", () => {
    // Dec 9-15, 2024 is Mon-Sun
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-09"), 1, "Dec 9 is Monday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-10"), 2, "Dec 10 is Tuesday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-11"), 3, "Dec 11 is Wednesday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-12"), 4, "Dec 12 is Thursday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-13"), 5, "Dec 13 is Friday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-14"), 6, "Dec 14 is Saturday");
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-15"), 0, "Dec 15 is Sunday");
  });

  it("is timezone-independent (same result regardless of system timezone)", () => {
    // This is the key test - the function should return the same value
    // whether run on a machine in UTC, EST, or any other timezone
    // Dec 11, 2024 is a Wednesday (day 3)
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-11"), 3);
  });

  it("handles year boundaries", () => {
    assert.strictEqual(getDayOfWeekFromDateString("2024-12-31"), 2, "Dec 31, 2024 is Tuesday");
    assert.strictEqual(getDayOfWeekFromDateString("2025-01-01"), 3, "Jan 1, 2025 is Wednesday");
  });
});

describe("getDayOfWeekInTimezone (instant in time)", () => {
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

  it("calculateChoreDate for Friday is correctly after Thursday (regression test)", () => {
    // This test prevents the bug where Friday was calculated as Thursday in UTC
    // due to missing 'Z' suffix causing midnight UTC → 7pm EST (previous day)
    const mondayStr = "2024-12-16"; // Monday Dec 16, 2024
    const fridayStr = calculateChoreDate(mondayStr, "friday");
    const thursdayStr = calculateChoreDate(mondayStr, "thursday");

    assert.strictEqual(fridayStr, "2024-12-20", "Friday should be Dec 20");
    assert.strictEqual(thursdayStr, "2024-12-19", "Thursday should be Dec 19");

    // The critical check: Friday must be AFTER Thursday in string comparison
    // This was broken when running in UTC without the 'Z' suffix
    assert.ok(fridayStr > thursdayStr, "Friday date string must be greater than Thursday");

    // Simulate the qualification check: on Thursday, Friday should NOT be past
    const todayThursday = "2024-12-19";
    const isFridayOrLater = todayThursday >= fridayStr;
    assert.strictEqual(isFridayOrLater, false, "Thursday should NOT be >= Friday");
  });
});
