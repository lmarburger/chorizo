import { NextResponse } from "next/server";
import {
  completeChore,
  uncompleteChore,
  calculateMondayOfWeek,
  calculateChoreDate,
  type DayOfWeek,
} from "@/app/lib/db";
import { getCurrentDate } from "@/app/lib/time-server";
import { formatDateString } from "@/app/lib/date-utils";

const VALID_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function POST(request: Request) {
  try {
    const { scheduleId, dayOfWeek, isCompleted } = await request.json();

    if (typeof scheduleId !== "number" || !Number.isInteger(scheduleId)) {
      return NextResponse.json({ error: "Invalid scheduleId" }, { status: 400 });
    }
    if (!VALID_DAYS.includes(dayOfWeek)) {
      return NextResponse.json({ error: "Invalid dayOfWeek" }, { status: 400 });
    }
    if (typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Invalid isCompleted" }, { status: 400 });
    }

    const today = await getCurrentDate();
    const mondayStr = calculateMondayOfWeek(today);
    const choreDateStr = calculateChoreDate(mondayStr, dayOfWeek as DayOfWeek);
    const todayStr = formatDateString(today);

    if (isCompleted) {
      await uncompleteChore(scheduleId, choreDateStr);
    } else {
      await completeChore(scheduleId, choreDateStr, todayStr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle chore:", error);
    return NextResponse.json({ error: "Failed to toggle chore" }, { status: 500 });
  }
}
