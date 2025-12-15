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
 * @param now - Optional date to use as "now" (for testing)
 */
export function getTodayString(now: Date = new Date()): string {
  return formatDateString(now);
}

/**
 * Get tomorrow's date as YYYY-MM-DD string in the configured timezone
 * @param now - Optional date to use as "now" (for testing)
 */
export function getTomorrowString(now: Date = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return formatDateString(tomorrow);
}

/**
 * Get yesterday's date as YYYY-MM-DD string in the configured timezone
 * @param now - Optional date to use as "now" (for testing)
 */
export function getYesterdayString(now: Date = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return formatDateString(yesterday);
}

/**
 * Get a date offset by N days as YYYY-MM-DD string in the configured timezone
 * @param daysOffset - Number of days to offset (positive = future, negative = past)
 * @param now - Optional date to use as "now" (for testing)
 */
export function getDayString(daysOffset: number, now: Date = new Date()): string {
  const date = new Date(now);
  date.setDate(now.getDate() + daysOffset);
  return formatDateString(date);
}
