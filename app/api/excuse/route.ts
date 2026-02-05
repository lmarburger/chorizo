import { NextResponse } from "next/server";
import { excuseChore, unexcuseChore, excuseTask, unexcuseTask } from "@/app/lib/db";
import { formatDateString } from "@/app/lib/date-utils";
import { getCurrentDate } from "@/app/lib/time-server";

// POST /api/excuse - Excuse a chore or task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, id, date } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (type === "chore") {
      if (!date) {
        return NextResponse.json({ error: "Missing date for chore excuse" }, { status: 400 });
      }
      const todayStr = formatDateString(await getCurrentDate());
      const result = await excuseChore(id, date, todayStr);
      if (!result) return NextResponse.json({ error: "Chore not found" }, { status: 404 });
      return NextResponse.json({ success: true, result });
    } else if (type === "task") {
      const result = await excuseTask(id);
      if (!result) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to excuse item:", error);
    return NextResponse.json({ error: "Failed to excuse item" }, { status: 500 });
  }
}

// DELETE /api/excuse - Remove an excuse
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { type, id, date } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (type === "chore") {
      if (!date) {
        return NextResponse.json({ error: "Missing date for chore unexcuse" }, { status: 400 });
      }
      await unexcuseChore(id, date);
      return NextResponse.json({ success: true });
    } else if (type === "task") {
      const result = await unexcuseTask(id);
      if (!result) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to remove excuse:", error);
    return NextResponse.json({ error: "Failed to remove excuse" }, { status: 500 });
  }
}
