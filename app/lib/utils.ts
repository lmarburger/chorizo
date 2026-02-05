/**
 * Shared utility functions for the Chorizo app
 */

import { getClientCurrentDate } from "./time";
import { formatDateString } from "./date-utils";
import { TIMEZONE } from "./timezone-config";
import { getDayOfWeekInTimezone } from "./timezone";

/**
 * Format relative time from a date
 * @param date - The date to format
 * @param now - Optional current date (for testing)
 * @returns A human-readable relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date, now: Date = getClientCurrentDate()): string {
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
}

/**
 * Calculate days until a due date
 * @param dueDate - The due date string
 * @param now - Optional current date (for testing)
 * @returns Number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string, now: Date = getClientCurrentDate()): number {
  // Convert both dates to noon UTC for timezone-safe comparison
  const todayStr = formatDateString(now);
  const todayNoon = parseLocalDate(todayStr);
  const dueNoon = parseLocalDate(dueDate);
  const diffMs = dueNoon.getTime() - todayNoon.getTime();
  // Both dates are at noon UTC, so diff is exact multiple of 24 hours
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Day of week utilities
 */
export const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * Get the current day of week as lowercase string
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const dayIndex = getDayOfWeekInTimezone(getClientCurrentDate());
  // Convert Sunday (0) to 6, and shift Monday (1) to 0
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAYS_OF_WEEK[adjustedIndex];
}

/**
 * Get today's day index in the week (0 = Monday, 6 = Sunday)
 */
export function getTodayIndex(): number {
  const today = getCurrentDayOfWeek();
  return DAYS_OF_WEEK.indexOf(today);
}

/**
 * Check if a chore for a given day is overdue
 */
export function isChoreOverdue(choreDay: DayOfWeek, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  const todayIndex = getTodayIndex();
  const choreIndex = DAYS_OF_WEEK.indexOf(choreDay);
  return choreIndex < todayIndex;
}

/**
 * Check if a chore is for the future
 */
export function isChoreFuture(choreDay: DayOfWeek): boolean {
  const todayIndex = getTodayIndex();
  const choreIndex = DAYS_OF_WEEK.indexOf(choreDay);
  return choreIndex > todayIndex;
}

/**
 * Format a date for HTML date input
 */
export function formatDateForInput(date: string | Date): string {
  if (typeof date === "string") {
    return date.includes("T") ? date.split("T")[0] : date;
  }
  return formatDateString(date);
}

/**
 * Get a human-readable date string
 */
export function formatDateDisplay(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Get the day of week abbreviation from a date
 */
export function getDayAbbreviation(date: string | Date): string {
  let dateObj: Date;
  if (typeof date === "string") {
    // Extract just the date portion if it's an ISO string
    const dateOnlyMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) {
      const [year, month, day] = dateOnlyMatch[1].split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  return dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: TIMEZONE });
}

/**
 * Parse a date string to a Date object that represents that calendar date.
 * Uses noon UTC to ensure the date is stable across all timezones.
 *
 * Why noon UTC? JavaScript Date represents an instant in time, but date strings
 * like "2024-12-18" represent a calendar date (no time). Noon UTC is safe because:
 * - In EST (UTC-5): 12:00 UTC = 07:00 EST → still Dec 18
 * - In PST (UTC-8): 12:00 UTC = 04:00 PST → still Dec 18
 * - In UTC+12: 12:00 UTC = 00:00+12 → still Dec 18
 *
 * Midnight system time would fail in production (UTC) because 00:00 UTC = 19:00 EST (previous day).
 */
export function parseLocalDate(dateString: string): Date {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + "T12:00:00Z");
  }
  return new Date(dateString);
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 * Commonly used for default due dates
 */
export function getTomorrowDateString(): string {
  const tomorrow = getClientCurrentDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow);
}

/**
 * Check if a date string represents today
 */
export function isToday(dateString: string, now: Date = getClientCurrentDate()): boolean {
  const today = formatDateString(now);
  const inputDate = formatDateForInput(dateString);
  return today === inputDate;
}

/**
 * Check if a date string is in the past (before today)
 */
export function isPastDate(dateString: string, now: Date = getClientCurrentDate()): boolean {
  const today = formatDateString(now);
  const inputDate = formatDateForInput(dateString);
  return inputDate < today;
}
