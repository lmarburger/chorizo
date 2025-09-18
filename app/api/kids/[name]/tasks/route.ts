import { NextResponse } from "next/server";
import { getTasksForKid } from "@/app/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const kidName = decodeURIComponent(name);
    const tasks = await getTasksForKid(kidName);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch tasks for kid:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
