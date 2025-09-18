import { NextResponse } from "next/server";
import { getTasksForParentView, addTask, getAllTasks } from "@/app/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    const tasks = view === "parent" ? await getTasksForParentView() : await getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await addTask(body);
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to add task:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
