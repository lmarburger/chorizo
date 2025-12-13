export const DEV_DATE_COOKIE = "dev-date-override";

/**
 * Client-side: Get current date, respecting dev override cookie
 * Reads from document.cookie synchronously
 * In production, always returns real current date
 */
export function getClientCurrentDate(): Date {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") {
    return new Date();
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === DEV_DATE_COOKIE && value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value + "T12:00:00");
      if (!isNaN(date.getTime())) return date;
    }
  }
  return new Date();
}
