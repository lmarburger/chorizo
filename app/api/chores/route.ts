import { NextResponse } from "next/server";
import { getAllChoresWithSchedules, addChore, updateChoreSchedules, type DayOfWeek } from "@/app/lib/db";

export async function GET() {
  try {
    const chores = await getAllChoresWithSchedules();
    return NextResponse.json({ chores });
  } catch (error) {
    console.error("Failed to fetch chores:", error);
    return NextResponse.json({ error: "Failed to fetch chores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, schedules } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid chore name" }, { status: 400 });
    }

    // Create the chore
    const chore = await addChore({
      name: name.trim(),
      description: description || null,
    });

    // Add schedules if provided
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      const formattedSchedules = schedules.map(s => ({
        kid_name: s.kid_name,
        day_of_week: s.day_of_week as DayOfWeek,
      }));
      await updateChoreSchedules(chore.id, formattedSchedules);
    }

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Failed to create chore:", error);
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A chore with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create chore" }, { status: 500 });
  }
}
