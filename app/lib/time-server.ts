import { cookies } from "next/headers";

export const DEV_DATE_COOKIE = "dev-date-override";

/**
 * Server-side: Get current date, respecting dev override cookie
 * In production, always returns real current date
 */
export async function getCurrentDate(): Promise<Date> {
  if (process.env.NODE_ENV === "production" || process.env.TEST_DATABASE_URL) {
    return new Date();
  }

  const cookieStore = await cookies();
  const override = cookieStore.get(DEV_DATE_COOKIE)?.value;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    const date = new Date(override + "T12:00:00");
    if (!isNaN(date.getTime())) return date;
  }
  return new Date();
}
