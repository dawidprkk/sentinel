import { describe, it, expect } from "vitest";
import { DeliveryFeedbackSchema } from "../delivery-feedback";

describe("DeliveryFeedbackSchema", () => {
  it("validates a correct feedback event", () => {
    const valid = {
      feedbackId: "660e8400-e29b-41d4-a716-446655440000",
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:05.000Z",
      status: "delivered",
      detail: "Message accepted by recipient server",
    };
    expect(DeliveryFeedbackSchema.safeParse(valid).success).toBe(true);
  });

  it("validates all status types", () => {
    for (const status of [
      "delivered",
      "bounced",
      "complained",
      "opened",
      "clicked",
    ]) {
      const event = {
        feedbackId: "660e8400-e29b-41d4-a716-446655440000",
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: "2026-02-11T10:00:05.000Z",
        status,
        detail: "test",
      };
      expect(DeliveryFeedbackSchema.safeParse(event).success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const invalid = {
      feedbackId: "660e8400-e29b-41d4-a716-446655440000",
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:05.000Z",
      status: "unknown",
      detail: "test",
    };
    expect(DeliveryFeedbackSchema.safeParse(invalid).success).toBe(false);
  });
});
