"use server";

import { revalidatePath } from "next/cache";
import { completeChore, uncompleteChore, calculateMondayOfWeek, calculateChoreDate, type DayOfWeek } from "../lib/db";
import { getCurrentDate } from "../lib/time-server";
import { formatDateString } from "../lib/date-utils";

export async function toggleChoreAction(formData: FormData) {
  const scheduleId = parseInt(formData.get("scheduleId") as string);
  const dayOfWeek = formData.get("dayOfWeek") as DayOfWeek;
  const isCompleted = formData.get("isCompleted") === "true";

  const today = await getCurrentDate();
  const mondayStr = calculateMondayOfWeek(today);
  const choreDateStr = calculateChoreDate(mondayStr, dayOfWeek);
  const todayStr = formatDateString(today);

  if (isCompleted) {
    await uncompleteChore(scheduleId, choreDateStr);
  } else {
    await completeChore(scheduleId, choreDateStr, todayStr);
  }

  revalidatePath("/kids");
}
