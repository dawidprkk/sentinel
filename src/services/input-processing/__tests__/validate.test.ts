import { describe, it, expect } from "vitest";
import { validateSendRequest } from "../validate";

const validRequest = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2026-02-11T10:00:00.000Z",
  sender: {
    accountId: "acc_1",
    email: "a@b.com",
    domain: "b.com",
    ip: "1.1.1.1",
  },
  recipient: { email: "c@d.com", domain: "d.com" },
  content: {
    subject: "Hi",
    body: "Hello there",
    hasLinks: false,
    linkCount: 0,
    hasAttachments: false,
    bodyLengthBytes: 100,
  },
  metadata: { region: "us-east-1", userAgent: "test" },
};

describe("validateSendRequest", () => {
  it("returns success for valid request", () => {
    expect(validateSendRequest(validRequest).success).toBe(true);
  });

  it("returns failure for invalid request", () => {
    const result = validateSendRequest({ bad: "data" });
    expect(result.success).toBe(false);
  });

  it("returns failure for missing fields", () => {
    expect(validateSendRequest({}).success).toBe(false);
  });

  it("returns failure when suspiciousKeywords are provided by input", () => {
    const withKeywords = {
      ...validRequest,
      content: {
        ...validRequest.content,
        suspiciousKeywords: ["verify"],
      },
    };
    expect(validateSendRequest(withKeywords).success).toBe(false);
  });
});
