import { NextResponse } from "next/server";
import { completeChore, uncompleteChore } from "@/app/lib/db";
import { getCurrentDate } from "@/app/lib/time-server";

export async function POST(request: Request) {
  try {
    const { scheduleId, dayOfWeek, isCompleted } = await request.json();

    // Calculate the date for this chore based on the day of week
    // We need to find the date of this day in the current week (Mon-Sun)
    const today = await getCurrentDate();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle chore:", error);
    return NextResponse.json({ error: "Failed to toggle chore" }, { status: 500 });
  }
}
