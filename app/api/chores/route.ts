import { NextResponse } from "next/server";
import { getAllChoresWithSchedules, addChoreWithSchedules, type DayOfWeek } from "@/app/lib/db";
import { validateStringLength } from "@/app/lib/api-utils";

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
    const { name, description, schedules, flexible } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid chore name" }, { status: 400 });
    }

    const nameError = validateStringLength(name.trim(), "Chore name", 200);
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

    if (description && typeof description === "string") {
      const descError = validateStringLength(description, "Description", 2000);
      if (descError) return NextResponse.json({ error: descError }, { status: 400 });
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: "At least one schedule is required" }, { status: 400 });
    }

    const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    for (const s of schedules) {
      if (!s.kid_name || typeof s.kid_name !== "string") {
        return NextResponse.json({ error: "Invalid kid_name in schedule" }, { status: 400 });
      }
      const kidNameError = validateStringLength(s.kid_name, "Kid name", 100);
      if (kidNameError) return NextResponse.json({ error: kidNameError }, { status: 400 });
      if (!validDays.includes(s.day_of_week)) {
        return NextResponse.json({ error: `Invalid day_of_week: ${s.day_of_week}` }, { status: 400 });
      }
    }

    const formattedSchedules = schedules.map((s: { kid_name: string; day_of_week: string }) => ({
      kid_name: s.kid_name,
      day_of_week: s.day_of_week as DayOfWeek,
    }));

    const chore = await addChoreWithSchedules(
      {
        name: name.trim(),
        description: description || null,
        flexible: flexible !== false,
      },
      formattedSchedules
    );

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Failed to create chore:", error);
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A chore with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create chore" }, { status: 500 });
  }
}
