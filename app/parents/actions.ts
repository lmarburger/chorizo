"use server";

import { revalidatePath } from "next/cache";
import { addChore, deleteChore, updateChore, updateChoreSchedules, type DayOfWeek } from "../lib/db";

export async function addChoreWithSchedulesAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const schedulesJson = formData.getAll("schedules") as string[];

  // Create the chore
  const chore = await addChore({
    name,
    description: description || null,
  });

  // Parse and add schedules
  const schedules: { kid_name: string; day_of_week: DayOfWeek }[] = schedulesJson.map(json => JSON.parse(json));

  if (schedules.length > 0) {
    await updateChoreSchedules(chore.id, schedules);
  }

  revalidatePath("/parents");
}

export async function updateChoreWithSchedulesAction(formData: FormData) {
  const choreIdStr = formData.get("choreId") as string;
  const choreId = parseInt(choreIdStr, 10);

  if (isNaN(choreId)) {
    throw new Error(`Invalid chore ID: ${choreIdStr}`);
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const schedulesJson = formData.getAll("schedules") as string[];

  // Update the chore
  await updateChore(choreId, {
    name,
    description: description || null,
  });

  // Parse and update schedules
  const schedules: { kid_name: string; day_of_week: DayOfWeek }[] = schedulesJson.map(json => JSON.parse(json));
  await updateChoreSchedules(choreId, schedules);

  revalidatePath("/parents");
}

export async function deleteChoreAction(formData: FormData) {
  const choreId = parseInt(formData.get("choreId") as string);
  await deleteChore(choreId);
  revalidatePath("/parents");
}
