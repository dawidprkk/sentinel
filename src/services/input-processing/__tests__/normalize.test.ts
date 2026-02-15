import { describe, it, expect } from "vitest";
import { normalizeSendRequest } from "../normalize";
import type { SendRequestInput } from "@/schemas/send-request";

describe("normalizeSendRequest", () => {
  const baseEvent: SendRequestInput = {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: "2026-02-11T10:00:00.000Z",
    sender: {
      accountId: "acc_1",
      email: "User@EXAMPLE.COM",
      domain: "EXAMPLE.COM",
      ip: "1.1.1.1",
    },
    recipient: { email: "TARGET@Test.COM", domain: "Test.COM" },
    content: {
      subject: "  Hello  ",
      body: "  Please verify your account immediately.  ",
      hasLinks: false,
      linkCount: 0,
      hasAttachments: false,
      bodyLengthBytes: 100,
    },
    metadata: { region: "us-east-1", userAgent: "test" },
  };

  it("lowercases email addresses", () => {
    const normalized = normalizeSendRequest(baseEvent);
    expect(normalized.sender.email).toBe("user@example.com");
    expect(normalized.recipient.email).toBe("target@test.com");
  });

  it("lowercases domains", () => {
    const normalized = normalizeSendRequest(baseEvent);
    expect(normalized.sender.domain).toBe("example.com");
    expect(normalized.recipient.domain).toBe("test.com");
  });

  it("trims subject whitespace", () => {
    const normalized = normalizeSendRequest(baseEvent);
    expect(normalized.content.subject).toBe("Hello");
  });

  it("trims body whitespace", () => {
    const normalized = normalizeSendRequest(baseEvent);
    expect(normalized.content.body).toBe(
      "Please verify your account immediately.",
    );
  });

  it("canonicalizes timestamp to UTC ISO-8601", () => {
    const normalized = normalizeSendRequest({
      ...baseEvent,
      timestamp: "2026-02-11T12:00:00+02:00",
    });
    expect(normalized.timestamp).toBe("2026-02-11T10:00:00.000Z");
  });

  it("preserves other fields unchanged", () => {
    const normalized = normalizeSendRequest(baseEvent);
    expect(normalized.sender.accountId).toBe("acc_1");
    expect(normalized.sender.ip).toBe("1.1.1.1");
    expect(normalized.content.linkCount).toBe(0);
  });
});
