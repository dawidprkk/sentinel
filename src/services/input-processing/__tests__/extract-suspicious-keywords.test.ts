import { describe, it, expect } from "vitest";
import { extractSuspiciousKeywords } from "../extract-suspicious-keywords";
import type { SendRequestInput } from "@/schemas/send-request";

const baseEvent: SendRequestInput = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2026-02-11T10:00:00.000Z",
  sender: {
    accountId: "acc_1",
    email: "user@example.com",
    domain: "example.com",
    ip: "1.1.1.1",
  },
  recipient: { email: "target@test.com", domain: "test.com" },
  content: {
    subject: "Please verify your account",
    body: "Act immediately to reset your password.",
    hasLinks: true,
    linkCount: 1,
    hasAttachments: false,
    bodyLengthBytes: 100,
  },
  metadata: { region: "us-east-1", userAgent: "test" },
};

describe("extractSuspiciousKeywords", () => {
  it("extracts suspicious keywords from subject and body", () => {
    const extracted = extractSuspiciousKeywords(baseEvent);
    expect(extracted.content.suspiciousKeywords).toEqual(
      expect.arrayContaining(["verify", "account", "immediately", "reset", "password"]),
    );
  });

  it("deduplicates extracted suspicious keywords", () => {
    const extracted = extractSuspiciousKeywords({
      ...baseEvent,
      content: {
        ...baseEvent.content,
        subject: "Verify verify account",
        body: "Please verify your account immediately.",
      },
    });
    const verifyCount = extracted.content.suspiciousKeywords.filter(
      (keyword) => keyword === "verify",
    ).length;
    expect(verifyCount).toBe(1);
  });
});
