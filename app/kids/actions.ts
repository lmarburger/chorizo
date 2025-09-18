"use server";

import { revalidatePath } from "next/cache";
import { completeChore, uncompleteChore } from "../lib/db";

export async function toggleChoreAction(formData: FormData) {
  const scheduleId = parseInt(formData.get("scheduleId") as string);
  const dayOfWeek = formData.get("dayOfWeek") as string;
  const isCompleted = formData.get("isCompleted") === "true";

  // Calculate the date for this chore based on the day of week
  // We need to find the date of this day in the current week (Mon-Sun)
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetDayIndex = daysOfWeek.indexOf(dayOfWeek);

  // Get Monday of current week
  const monday = new Date(today);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert Sunday=0 to days from Monday
  monday.setDate(today.getDate() - daysFromMonday);

  // Calculate the target date in this week
  const daysFromMondayToTarget = targetDayIndex === 0 ? 6 : targetDayIndex - 1; // Convert to Monday-based
  const choreDate = new Date(monday);
  choreDate.setDate(monday.getDate() + daysFromMondayToTarget);
  const choreDateStr = choreDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format

  if (isCompleted) {
    // Uncomplete the chore
    await uncompleteChore(scheduleId, choreDateStr);
  } else {
    // Complete the chore
    await completeChore(scheduleId, choreDateStr);
  }

  revalidatePath("/kids");
}
