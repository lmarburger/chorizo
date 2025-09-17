"use server";

import { revalidatePath } from "next/cache";
import { completeChore, uncompleteChore } from "../lib/db";

export async function toggleChoreAction(formData: FormData) {
  const choreId = parseInt(formData.get("choreId") as string);
  const dayOfWeek = formData.get("dayOfWeek") as string;
  const isCompleted = formData.get("isCompleted") === "true";

  // Calculate the date for this chore based on the day of week
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetDayIndex = daysOfWeek.indexOf(dayOfWeek);

  // Calculate how many days ago this chore was due
  let daysDiff = currentDay - targetDayIndex;
  if (daysDiff < 0) daysDiff += 7;

  const choreDate = new Date(today);
  choreDate.setDate(today.getDate() - daysDiff);
  const choreDateStr = choreDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format

  if (isCompleted) {
    // Uncomplete the chore
    await uncompleteChore(choreId, choreDateStr);
  } else {
    // Complete the chore
    await completeChore(choreId, choreDateStr);
  }

  revalidatePath("/kids");
}
