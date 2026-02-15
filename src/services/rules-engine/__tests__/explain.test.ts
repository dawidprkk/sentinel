import { describe, it, expect } from "vitest";
import { explainDecision } from "../explain";
import type { SendRequest } from "@/schemas/send-request";
import type { Rule } from "@/schemas/rule";

const testEvent: SendRequest = {
  eventId: "test",
  timestamp: "2026-02-11T10:00:00.000Z",
  sender: {
    accountId: "acc_1",
    email: "a@paypa1.com",
    domain: "paypa1.com",
    ip: "1.1.1.1",
  },
  recipient: { email: "b@c.com", domain: "c.com" },
  content: {
    subject: "Verify your account",
    body: "Verify your account now.",
    hasLinks: true,
    linkCount: 1,
    hasAttachments: false,
    bodyLengthBytes: 100,
    suspiciousKeywords: [],
  },
  metadata: { region: "us-east-1", userAgent: "test" },
};

describe("explainDecision", () => {
  it("generates human-readable explanation for a block", () => {
    const rule: Rule = {
      id: "r1",
      name: "Domain spoofing",
      description: "Detects typosquatting",
      status: "active",
      conditions: [
        { field: "sender.domain", operator: "matches", value: "paypa[l1]" },
      ],
      logic: "AND",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    const explanation = explainDecision(testEvent, rule);
    expect(explanation).toContain("Blocked");
    expect(explanation).toContain("Domain spoofing");
    expect(explanation).toContain("paypa1.com");
  });

  it("generates explanation for flagged events", () => {
    const rule: Rule = {
      id: "r2",
      name: "Suspicious",
      description: "",
      status: "active",
      conditions: [
        { field: "content.linkCount", operator: "gt", value: 0 },
      ],
      logic: "AND",
      action: "flag",
      severity: "medium",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    const explanation = explainDecision(testEvent, rule);
    expect(explanation).toContain("Flagged");
  });

  it("generates explanation for allowed events", () => {
    const explanation = explainDecision(testEvent, null);
    expect(explanation).toContain("Allowed");
    expect(explanation).toContain("No rules matched");
  });
});
