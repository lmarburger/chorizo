import { NextResponse } from "next/server";
import { getUniqueKidNames } from "@/app/lib/db";

export async function GET() {
  try {
    const kids = await getUniqueKidNames();
    return NextResponse.json({ kids });
  } catch (error) {
    console.error("Failed to fetch kid names:", error);
    return NextResponse.json({ error: "Failed to fetch kid names" }, { status: 500 });
  }
}
