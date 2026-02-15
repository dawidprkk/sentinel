import { NextRequest, NextResponse } from "next/server";
import { DeliveryFeedbackSchema } from "@/schemas/delivery-feedback";
import { eventBus, initializeEventBusSubscribers } from "@/services/event-bus";

initializeEventBusSubscribers();

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const result = DeliveryFeedbackSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid feedback", issues: result.error.issues },
        { status: 400 },
      );
    }
    void eventBus.publish({
      type: "delivery_feedback_received",
      payload: { feedback: result.data },
    });
    return NextResponse.json({
      feedbackId: result.data.feedbackId,
      status: "accepted",
    });
  } catch (error) {
    console.error("Feedback ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
