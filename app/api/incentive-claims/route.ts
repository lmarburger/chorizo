import { NextResponse } from "next/server";
import { claimIncentive, getAllIncentiveClaims, getWeeklyQualification, type RewardType } from "@/app/lib/db";

// GET /api/incentive-claims - Get all claims for the current week
export async function GET() {
  try {
    const claims = await getAllIncentiveClaims();
    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Failed to get incentive claims:", error);
    return NextResponse.json({ error: "Failed to get incentive claims" }, { status: 500 });
  }
}

// POST /api/incentive-claims - Claim an incentive
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kidName, rewardType } = body;

    if (!kidName || !rewardType) {
      return NextResponse.json({ error: "Missing kidName or rewardType" }, { status: 400 });
    }

    if (rewardType !== "screen_time" && rewardType !== "money") {
      return NextResponse.json({ error: "Invalid rewardType" }, { status: 400 });
    }

    const qualification = await getWeeklyQualification(kidName);
    if (!qualification.qualified) {
      return NextResponse.json({ error: "Not qualified for incentive" }, { status: 403 });
    }

    const claim = await claimIncentive(kidName, rewardType as RewardType);
    if (!claim) {
      return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
    }
    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("Failed to claim incentive:", error);
    return NextResponse.json({ error: "Failed to claim incentive" }, { status: 500 });
  }
}
