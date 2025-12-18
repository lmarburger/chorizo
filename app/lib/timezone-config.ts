/**
 * Single source of truth for timezone configuration.
 * All date utilities should import from here to ensure consistency.
 */
export const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";
