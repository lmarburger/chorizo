/**
 * Shared utility functions for the Chorizo app
 */

/**
 * Format relative time from a date
 * @param date - The date to format
 * @returns A human-readable relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
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
 * @returns Number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseLocalDate(dueDate);
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
  const dayIndex = new Date().getDay();
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
  return date.toISOString().split("T")[0];
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
  return dateObj.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Parse a date string ensuring it's treated as local date
 * Prevents timezone issues with YYYY-MM-DD format dates
 */
export function parseLocalDate(dateString: string): Date {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 * Commonly used for default due dates
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

/**
 * Check if a date string represents today
 */
export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  const inputDate = formatDateForInput(dateString);
  return today === inputDate;
}

/**
 * Check if a date string is in the past (before today)
 */
export function isPastDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = parseLocalDate(formatDateForInput(dateString));
  return inputDate < today;
}
