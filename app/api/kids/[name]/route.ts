import { NextResponse } from "next/server";
import { deleteKid } from "../../../lib/db";

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
