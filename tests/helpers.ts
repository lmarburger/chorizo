// Shared test utilities
import { formatDateString } from "../app/lib/date-utils";
import { type ChoreRow, type TaskRow, type IncentiveClaim } from "../app/lib/qualification";
import { type DayOfWeek } from "../app/lib/db";

// Date configuration for consistent test behavior
const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";
const TEST_DATE = process.env.TEST_DATE || "2025-12-10"; // Wednesday

export function getTestDate(): Date {
  return new Date(TEST_DATE + "T12:00:00");
}

export function getTodayString(): string {
  return formatDateString(getTestDate());
}

export function getTomorrowString(): string {
  const tomorrow = getTestDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow);
}

export function getYesterdayString(): string {
  const yesterday = getTestDate();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

export function getDayString(daysOffset: number): string {
  const date = getTestDate();
  date.setDate(date.getDate() + daysOffset);
  return formatDateString(date);
}

export function getDayOfWeekInTimezone(): number {
  const dayName = getTestDate().toLocaleDateString("en-US", { weekday: "long", timeZone: TIMEZONE }).toLowerCase();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return dayNames.indexOf(dayName);
}

export function getDayNameForOffset(offset: number): DayOfWeek {
  const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayIdx = getDayOfWeekInTimezone();
  return dayNames[(todayIdx + offset + 7) % 7];
}

export function getMostRecentPastWeekday(): { dayName: DayOfWeek; dateStr: string; daysBack: number } {
  const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayIdx = getDayOfWeekInTimezone();

  let daysBack = 1;
  let targetDayIdx = (todayIdx - daysBack + 7) % 7;
  while (targetDayIdx === 0 || targetDayIdx === 6) {
    daysBack++;
    targetDayIdx = (todayIdx - daysBack + 7) % 7;
  }

  return {
    dayName: dayNames[targetDayIdx],
    dateStr: getDayString(-daysBack),
    daysBack,
  };
}

// Factory functions for test data
export function createChoreRow(overrides: Partial<ChoreRow> = {}): ChoreRow {
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

export function createTaskRow(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 1,
    title: "Test Task",
    due_date: "2025-01-06",
    completed_at: null,
    excused_at: null,
    ...overrides,
  };
}

export function createIncentiveClaim(overrides: Partial<IncentiveClaim> = {}): IncentiveClaim {
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

// Assertion helpers
export function assertExists<T>(item: T | null | undefined, message: string): asserts item is T {
  if (!item) {
    throw new Error(`${message}: item does not exist`);
  }
}
