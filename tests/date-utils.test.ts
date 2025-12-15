import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateString,
  getTodayString,
  getTomorrowString,
  getYesterdayString,
  getDayString,
} from "../app/lib/date-utils";

describe("Date utilities with injected now", () => {
  it("formatDateString returns YYYY-MM-DD format", () => {
    // Wednesday Dec 11, 2024 at noon EST = 5pm UTC
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(formatDateString(wed), "2024-12-11");
  });

  it("getTodayString uses provided date", () => {
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getTodayString(wed), "2024-12-11");
  });

  it("getTomorrowString calculates tomorrow from provided date", () => {
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getTomorrowString(wed), "2024-12-12");
  });

  it("getYesterdayString calculates yesterday from provided date", () => {
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getYesterdayString(wed), "2024-12-10");
  });

  it("getDayString calculates positive offset correctly", () => {
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getDayString(1, wed), "2024-12-12"); // Tomorrow
    assert.strictEqual(getDayString(3, wed), "2024-12-14"); // Saturday
    assert.strictEqual(getDayString(7, wed), "2024-12-18"); // Next Wednesday
  });

  it("getDayString calculates negative offset correctly", () => {
    const wed = new Date("2024-12-11T17:00:00Z");
    assert.strictEqual(getDayString(-1, wed), "2024-12-10"); // Yesterday
    assert.strictEqual(getDayString(-3, wed), "2024-12-08"); // Sunday
    assert.strictEqual(getDayString(-7, wed), "2024-12-04"); // Last Wednesday
  });

  it("getTodayString at 11:59pm EST returns same day", () => {
    // Wednesday 11:59pm EST = Thursday 4:59am UTC
    const lateWed = new Date("2024-12-12T04:59:00Z");
    assert.strictEqual(getTodayString(lateWed), "2024-12-11");
  });

  it("getTodayString at 12:01am EST returns next day", () => {
    // Thursday 12:01am EST = Thursday 5:01am UTC
    const earlyThurs = new Date("2024-12-12T05:01:00Z");
    assert.strictEqual(getTodayString(earlyThurs), "2024-12-12");
  });

  it("getTomorrowString at 11:59pm EST calculates correctly", () => {
    // Wednesday 11:59pm EST = Thursday 4:59am UTC
    // Tomorrow should be Thursday
    const lateWed = new Date("2024-12-12T04:59:00Z");
    assert.strictEqual(getTomorrowString(lateWed), "2024-12-12");
  });

  it("month boundary: getDayString across month end", () => {
    // Dec 30, 2024
    const dec30 = new Date("2024-12-30T17:00:00Z");
    assert.strictEqual(getDayString(2, dec30), "2025-01-01"); // New Year's Day
    assert.strictEqual(getDayString(3, dec30), "2025-01-02");
  });

  it("year boundary: getTomorrowString at year end", () => {
    // Dec 31, 2024 at noon EST
    const dec31 = new Date("2024-12-31T17:00:00Z");
    assert.strictEqual(getTomorrowString(dec31), "2025-01-01");
  });
});
