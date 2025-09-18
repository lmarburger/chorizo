import { NextResponse } from "next/server";
import { getAllChoresWithSchedules } from "@/app/lib/db";

export async function GET() {
  try {
    const chores = await getAllChoresWithSchedules();
    return NextResponse.json({ chores });
  } catch (error) {
    console.error("Failed to fetch chores:", error);
    return NextResponse.json({ error: "Failed to fetch chores" }, { status: 500 });
  }
}
