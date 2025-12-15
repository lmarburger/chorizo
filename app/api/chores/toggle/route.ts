import { NextResponse } from "next/server";
import {
  completeChore,
  uncompleteChore,
  calculateMondayOfWeek,
  calculateChoreDate,
  type DayOfWeek,
} from "@/app/lib/db";
import { getCurrentDate } from "@/app/lib/time-server";

export async function POST(request: Request) {
  try {
    const { scheduleId, dayOfWeek, isCompleted } = await request.json();

    const today = await getCurrentDate();
    const mondayStr = calculateMondayOfWeek(today);
    const choreDateStr = calculateChoreDate(mondayStr, dayOfWeek as DayOfWeek);

    if (isCompleted) {
      await uncompleteChore(scheduleId, choreDateStr);
    } else {
      await completeChore(scheduleId, choreDateStr, undefined, today);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle chore:", error);
    return NextResponse.json({ error: "Failed to toggle chore" }, { status: 500 });
  }
}
