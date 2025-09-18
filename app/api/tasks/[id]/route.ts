import { NextResponse } from "next/server";
import { updateTask, deleteTask, toggleTaskComplete } from "@/app/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task = await updateTask(parseInt(id), body);
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTask(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await toggleTaskComplete(parseInt(id));
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to toggle task:", error);
    return NextResponse.json({ error: "Failed to toggle task" }, { status: 500 });
  }
}
