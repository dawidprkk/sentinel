import { NextRequest, NextResponse } from "next/server";
import { processInput } from "@/services/input-processing";
import { validateSendRequest } from "@/services/input-processing/validate";
import { evaluateEvent } from "@/services/rules-engine";
import { db, schema } from "@/services/db";
import { eq } from "drizzle-orm";
import type { Rule } from "@/schemas/rule";
import { eventBus, initializeEventBusSubscribers } from "@/services/event-bus";

initializeEventBusSubscribers();

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const validation = validateSendRequest(raw);
    if (!validation.success) {
      return NextResponse.json(
        { error: "validation", detail: validation.error },
        { status: 400 },
      );
    }

    const event = processInput(validation.data);
    const activeRules = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.status, "active"));
    const parsedRules: Rule[] = activeRules.map((r) => ({
      ...r,
      conditions: JSON.parse(r.conditions),
    }));
    const decision = await evaluateEvent(event, parsedRules);

    void eventBus.publish({
      type: "send_request_processed",
      payload: { event, decision },
    });

    return NextResponse.json({
      eventId: event.eventId,
      decision: decision.action,
      reason: decision.reason,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
