/**
 * Pure timezone-aware date calculation utilities.
 * These functions have no server dependencies and can be used in both client and server code.
 */

import { formatDateString } from "./date-utils";
import { TIMEZONE } from "./timezone-config";

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a Date object in the configured timezone.
 * Use this for "what day is it NOW?" questions where you have an instant in time.
 */
export function getDayOfWeekInTimezone(date: Date): number {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: TIMEZONE }).toLowerCase();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return dayNames.indexOf(dayName);
}

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a calendar date string (YYYY-MM-DD).
 * Use this for "what day of week is Dec 11, 2024?" questions where you have a calendar date.
 * Uses UTC to avoid system timezone dependencies.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
  const date = new Date(dateStr + "T12:00:00Z");
  return date.getUTCDay();
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAY_OFFSETS: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/**
 * Pure function: Calculate the Monday of the week containing the given date.
 * Uses timezone-aware day calculation to handle edge cases like late evening.
 */
export function calculateMondayOfWeek(date: Date): string {
  const daysSinceMonday = (getDayOfWeekInTimezone(date) + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - daysSinceMonday);
  return formatDateString(monday);
}

/**
 * Pure function: Calculate a specific date within a week given the Monday and day of week.
 */
export function calculateChoreDate(mondayStr: string, dayOfWeek: DayOfWeek): string {
  const monday = new Date(mondayStr + "T12:00:00Z"); // Noon UTC for timezone stability
  monday.setDate(monday.getDate() + DAY_OFFSETS[dayOfWeek]);
  return formatDateString(monday);
}
