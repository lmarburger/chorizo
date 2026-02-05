import { NextRequest, NextResponse } from "next/server";
import { markFeedbackComplete, markFeedbackIncomplete, deleteFeedback } from "@/app/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const feedbackId = parseInt(id, 10);

    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

    const body = await request.json();
    const { completed } = body;

    let feedback;
    if (completed === true) {
      feedback = await markFeedbackComplete(feedbackId);
    } else if (completed === false) {
      feedback = await markFeedbackIncomplete(feedbackId);
    } else {
      return NextResponse.json({ error: "Invalid completion status" }, { status: 400 });
    }

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Failed to update feedback:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const feedbackId = parseInt(id, 10);

    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

    await deleteFeedback(feedbackId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
