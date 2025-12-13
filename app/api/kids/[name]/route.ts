import { NextResponse } from "next/server";
import { deleteKid, getWeeklyQualification } from "../../../lib/db";

// GET /api/kids/[name] - Get kid data including qualification status
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const kidName = decodeURIComponent(name);

    const qualification = await getWeeklyQualification(kidName);

    return NextResponse.json({
      name: kidName,
      qualification,
    });
  } catch (error) {
    console.error("Failed to get kid data:", error);
    return NextResponse.json({ error: "Failed to get kid data" }, { status: 500 });
  }
}

// DELETE /api/kids/[name] - Delete a kid and all their data
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const kidName = decodeURIComponent(name);

    // Delete the kid and all associated data
    await deleteKid(kidName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete kid:", error);
    return NextResponse.json({ error: "Failed to delete kid" }, { status: 500 });
  }
}
