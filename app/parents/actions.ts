"use server";

import { revalidatePath } from "next/cache";
import { addChore, deleteChore, updateChore, type DayOfWeek } from "../lib/db";

export async function addChoreAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const kid_name = formData.get("kid_name") as string;
  const day_of_week = formData.get("day_of_week") as DayOfWeek;

  await addChore({
    name,
    description: description || null,
    kid_name,
    day_of_week,
  });

  revalidatePath("/parents");
}

export async function deleteChoreAction(formData: FormData) {
  const choreId = parseInt(formData.get("choreId") as string);
  await deleteChore(choreId);
  revalidatePath("/parents");
}

export async function updateChoreAction(formData: FormData) {
  const choreIdStr = formData.get("choreId") as string;
  const choreId = parseInt(choreIdStr, 10);

  if (isNaN(choreId)) {
    throw new Error(`Invalid chore ID: ${choreIdStr}`);
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const kid_name = formData.get("kid_name") as string;
  const day_of_week = formData.get("day_of_week") as DayOfWeek;

  await updateChore(choreId, {
    name,
    description: description || null,
    kid_name,
    day_of_week,
  });

  revalidatePath("/parents");
}
