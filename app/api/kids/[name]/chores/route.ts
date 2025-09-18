import { NextResponse } from "next/server";
import { getCurrentWeekChores } from "@/app/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const kidName = decodeURIComponent(name);
    const allChores = await getCurrentWeekChores();

    // Filter chores for this specific kid
    const kidChores = allChores.filter(chore => chore.kid_name === kidName);

    return NextResponse.json({ chores: kidChores });
  } catch (error) {
    console.error("Failed to fetch chores:", error);
    return NextResponse.json({ error: "Failed to fetch chores" }, { status: 500 });
  }
}
