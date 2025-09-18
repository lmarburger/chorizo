import { NextRequest, NextResponse } from "next/server";
import { getAllFeedback, addFeedback, getIncompleteFeedback, getCompletedFeedback } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter");

    let feedback;
    if (filter === "incomplete") {
      feedback = await getIncompleteFeedback();
    } else if (filter === "completed") {
      feedback = await getCompletedFeedback();
    } else {
      feedback = await getAllFeedback();
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kid_name, message } = body;

    if (!kid_name || !message) {
      return NextResponse.json({ error: "Kid name and message are required" }, { status: 400 });
    }

    const feedback = await addFeedback(kid_name, message);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Failed to add feedback:", error);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
