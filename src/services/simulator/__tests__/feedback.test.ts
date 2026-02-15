import { describe, it, expect } from "vitest";
import { generateFeedback } from "../feedback";
import { DeliveryFeedbackSchema } from "@/schemas/delivery-feedback";

describe("generateFeedback", () => {
  it("generates valid delivery feedback", () => {
    const feedback = generateFeedback(
      "550e8400-e29b-41d4-a716-446655440000",
      true,
    );
    const result = DeliveryFeedbackSchema.safeParse(feedback);
    expect(result.success).toBe(true);
  });

  it("legitimate events mostly get delivered", () => {
    let deliveredCount = 0;
    const total = 500;
    for (let i = 0; i < total; i++) {
      const fb = generateFeedback(
        "550e8400-e29b-41d4-a716-446655440000",
        true,
      );
      if (fb.status === "delivered") deliveredCount++;
    }
    expect(deliveredCount / total).toBeGreaterThan(0.7);
    expect(deliveredCount / total).toBeLessThan(0.95);
  });

  it("non-legitimate events get more complaints", () => {
    let complainedCount = 0;
    const total = 500;
    for (let i = 0; i < total; i++) {
      const fb = generateFeedback(
        "550e8400-e29b-41d4-a716-446655440000",
        false,
      );
      if (fb.status === "complained") complainedCount++;
    }
    expect(complainedCount / total).toBeGreaterThan(0.1);
    expect(complainedCount / total).toBeLessThan(0.4);
  });
});
