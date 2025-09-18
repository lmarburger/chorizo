import { NextResponse } from "next/server";
import { getUniqueKidNames, addKid } from "@/app/lib/db";

export async function GET() {
  try {
    const kids = await getUniqueKidNames();
    return NextResponse.json({ kids });
  } catch (error) {
    console.error("Failed to fetch kid names:", error);
    return NextResponse.json({ error: "Failed to fetch kid names" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid kid name" }, { status: 400 });
    }

    await addKid(name.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add kid:", error);
    if (error instanceof Error && error.message === "Kid already exists") {
      return NextResponse.json({ error: "Kid already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add kid" }, { status: 500 });
  }
}
