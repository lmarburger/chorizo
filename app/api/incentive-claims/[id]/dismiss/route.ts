import { NextResponse } from "next/server";
import { dismissClaim } from "@/app/lib/db";

// POST /api/incentive-claims/[id]/dismiss - Dismiss a claim notification
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const claimId = parseInt(id, 10);

    if (isNaN(claimId)) {
      return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 });
    }

    const claim = await dismissClaim(claimId);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("Failed to dismiss claim:", error);
    return NextResponse.json({ error: "Failed to dismiss claim" }, { status: 500 });
  }
}
