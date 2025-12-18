import { NextResponse } from "next/server";
import { excuseChore, unexcuseChore, excuseTask, unexcuseTask } from "@/app/lib/db";
import { formatDateString } from "@/app/lib/date-utils";

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
      const todayStr = formatDateString(new Date());
      const result = await excuseChore(id, date, todayStr);
      return NextResponse.json({ success: true, result });
    } else if (type === "task") {
      const result = await excuseTask(id);
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
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to remove excuse:", error);
    return NextResponse.json({ error: "Failed to remove excuse" }, { status: 500 });
  }
}
