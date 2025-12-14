/**
 * Timezone-aware date formatting utilities
 * Uses APP_TIMEZONE environment variable (defaults to America/New_York)
 */

const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

/**
 * Format a Date object as YYYY-MM-DD string in the configured timezone
 */
export function formatDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/**
 * Get today's date as YYYY-MM-DD string in the configured timezone
 */
export function getTodayString(): string {
  return formatDateString(new Date());
}

/**
 * Get tomorrow's date as YYYY-MM-DD string in the configured timezone
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow);
}

/**
 * Get yesterday's date as YYYY-MM-DD string in the configured timezone
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

/**
 * Get a date offset by N days as YYYY-MM-DD string in the configured timezone
 */
export function getDayString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDateString(date);
}
