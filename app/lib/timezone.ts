/**
 * Pure timezone-aware date calculation utilities.
 * These functions have no server dependencies and can be used in both client and server code.
 */

import { formatDateString } from "./date-utils";

const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a date in the configured timezone.
 */
export function getDayOfWeekInTimezone(date: Date): number {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: TIMEZONE }).toLowerCase();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return dayNames.indexOf(dayName);
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
  const monday = new Date(mondayStr + "T12:00:00");
  monday.setDate(monday.getDate() + DAY_OFFSETS[dayOfWeek]);
  return formatDateString(monday);
}
