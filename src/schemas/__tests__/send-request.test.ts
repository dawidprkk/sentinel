import { describe, it, expect } from "vitest";
import { IngestSendRequestSchema, SendRequestSchema } from "../send-request";

describe("SendRequestSchema", () => {
  it("validates a processed send request", () => {
    const valid = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:00.000Z",
      sender: {
        accountId: "acc_123",
        email: "user@company.com",
        domain: "company.com",
        ip: "192.168.1.1",
      },
      recipient: { email: "target@example.com", domain: "example.com" },
      content: {
        subject: "Hello",
        body: "Hello world",
        hasLinks: false,
        linkCount: 0,
        hasAttachments: false,
        bodyLengthBytes: 256,
        suspiciousKeywords: [],
      },
      metadata: { region: "us-east-1", userAgent: "resend-node/1.0" },
    };
    expect(SendRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects send request with missing required fields", () => {
    expect(SendRequestSchema.safeParse({}).success).toBe(false);
  });

  it("rejects send request with invalid email", () => {
    const invalid = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:00.000Z",
      sender: {
        accountId: "acc_1",
        email: "not-an-email",
        domain: "b.com",
        ip: "1.1.1.1",
      },
      recipient: { email: "c@d.com", domain: "d.com" },
      content: {
        subject: "X",
        body: "test",
        hasLinks: false,
        linkCount: 0,
        hasAttachments: false,
        bodyLengthBytes: 10,
        suspiciousKeywords: [],
      },
      metadata: { region: "us-east-1", userAgent: "test" },
    };
    expect(SendRequestSchema.safeParse(invalid).success).toBe(false);
  });

  it("requires suspiciousKeywords on processed events", () => {
    const withoutKeywords = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:00.000Z",
      sender: {
        accountId: "acc_1",
        email: "user@company.com",
        domain: "company.com",
        ip: "1.1.1.1",
      },
      recipient: { email: "target@example.com", domain: "example.com" },
      content: {
        subject: "Please verify your account",
        body: "Reset your password immediately",
        hasLinks: true,
        linkCount: 1,
        hasAttachments: false,
        bodyLengthBytes: 100,
      },
      metadata: { region: "us-east-1", userAgent: "resend-node/1.0" },
    };

    expect(SendRequestSchema.safeParse(withoutKeywords).success).toBe(false);
  });
});

describe("IngestSendRequestSchema", () => {
  it("accepts input without suspiciousKeywords", () => {
    const ingestRequest = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:00.000Z",
      sender: {
        accountId: "acc_1",
        email: "user@company.com",
        domain: "company.com",
        ip: "1.1.1.1",
      },
      recipient: { email: "target@example.com", domain: "example.com" },
      content: {
        subject: "Please verify your account",
        body: "Reset your password immediately",
        hasLinks: true,
        linkCount: 1,
        hasAttachments: false,
        bodyLengthBytes: 100,
      },
      metadata: { region: "us-east-1", userAgent: "resend-node/1.0" },
    };

    expect(IngestSendRequestSchema.safeParse(ingestRequest).success).toBe(true);
  });

  it("rejects input when suspiciousKeywords are provided", () => {
    const ingestRequestWithKeywords = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-02-11T10:00:00.000Z",
      sender: {
        accountId: "acc_1",
        email: "user@company.com",
        domain: "company.com",
        ip: "1.1.1.1",
      },
      recipient: { email: "target@example.com", domain: "example.com" },
      content: {
        subject: "Please verify your account",
        body: "Reset your password immediately",
        hasLinks: true,
        linkCount: 1,
        hasAttachments: false,
        bodyLengthBytes: 100,
        suspiciousKeywords: ["verify"],
      },
      metadata: { region: "us-east-1", userAgent: "resend-node/1.0" },
    };

    expect(
      IngestSendRequestSchema.safeParse(ingestRequestWithKeywords).success,
    ).toBe(false);
  });
});
