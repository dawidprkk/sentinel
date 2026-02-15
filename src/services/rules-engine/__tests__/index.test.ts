import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateEvent } from "../index";
import type { SendRequest } from "@/schemas/send-request";
import type { Rule } from "@/schemas/rule";
import { getAccountEventCount } from "@/services/tinybird/queries";

vi.mock("@/services/tinybird/queries", () => ({
  getAccountEventCount: vi.fn(),
}));

const baseEvent: SendRequest = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2026-02-11T10:00:00.000Z",
  sender: {
    accountId: "acc_1",
    email: "user@example.com",
    domain: "example.com",
    ip: "1.1.1.1",
  },
  recipient: { email: "victim@example.com", domain: "example.com" },
  content: {
    subject: "Hello",
    body: "Body",
    hasLinks: false,
    linkCount: 0,
    hasAttachments: false,
    bodyLengthBytes: 120,
    suspiciousKeywords: [],
  },
  metadata: { region: "us-east-1", userAgent: "test" },
};

const volumeRule: Rule = {
  id: "rule_volume_spike",
  name: "Volume spike",
  description: "Blocks high-volume senders when suspicious keywords are present",
  status: "active",
  conditions: [
    {
      field: "sender.accountId",
      operator: "rate_exceeds",
      value: 2,
      window: "1m",
    },
    {
      field: "content.suspiciousKeywords",
      operator: "contains",
      value: "verify",
    },
  ],
  logic: "AND",
  action: "block",
  severity: "high",
  createdAt: "2026-02-11T10:00:00.000Z",
};

describe("evaluateEvent with mixed rate and content conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not match when rate is exceeded but suspicious keyword is absent", async () => {
    vi.mocked(getAccountEventCount).mockResolvedValue({
      data: [{ event_count: 5 }],
      rows: 1,
    });

    const decision = await evaluateEvent(baseEvent, [volumeRule]);
    expect(decision.action).toBe("allow");
  });

  it("matches when both rate and suspicious keyword condition are true", async () => {
    vi.mocked(getAccountEventCount).mockResolvedValue({
      data: [{ event_count: 5 }],
      rows: 1,
    });
    const event: SendRequest = {
      ...baseEvent,
      content: {
        ...baseEvent.content,
        suspiciousKeywords: ["verify"],
      },
    };

    const decision = await evaluateEvent(event, [volumeRule]);
    expect(decision.action).toBe("block");
    expect(decision.ruleId).toBe("rule_volume_spike");
  });
});
