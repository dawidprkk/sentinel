import { describe, it, expect } from "vitest";
import { evaluateCondition, evaluateRule } from "../evaluate";
import type { SendRequest } from "@/schemas/send-request";
import type { Rule } from "@/schemas/rule";

const testEvent: SendRequest = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2026-02-11T10:00:00.000Z",
  sender: {
    accountId: "acc_1",
    email: "user@paypa1.com",
    domain: "paypa1.com",
    ip: "1.1.1.1",
  },
  recipient: { email: "victim@example.com", domain: "example.com" },
  content: {
    subject: "Verify your account now",
    body: "Please verify your account to avoid suspension.",
    hasLinks: true,
    linkCount: 3,
    hasAttachments: false,
    bodyLengthBytes: 200,
    suspiciousKeywords: ["verify", "account"],
  },
  metadata: { region: "us-east-1", userAgent: "test" },
};

describe("evaluateCondition", () => {
  it('evaluates "contains" on string field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "content.subject",
        operator: "contains",
        value: "verify",
      }),
    ).toBe(true);
  });

  it('evaluates "contains" on array field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "content.suspiciousKeywords",
        operator: "contains",
        value: "verify",
      }),
    ).toBe(true);
  });

  it('evaluates "gt" on numeric field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "content.linkCount",
        operator: "gt",
        value: 2,
      }),
    ).toBe(true);
    expect(
      evaluateCondition(testEvent, {
        field: "content.linkCount",
        operator: "gt",
        value: 5,
      }),
    ).toBe(false);
  });

  it('evaluates "lt" on numeric field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "content.bodyLengthBytes",
        operator: "lt",
        value: 500,
      }),
    ).toBe(true);
  });

  it('evaluates "eq" on string field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "sender.domain",
        operator: "eq",
        value: "paypa1.com",
      }),
    ).toBe(true);
  });

  it('evaluates "neq" on string field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "sender.domain",
        operator: "neq",
        value: "example.com",
      }),
    ).toBe(true);
    expect(
      evaluateCondition(testEvent, {
        field: "sender.domain",
        operator: "neq",
        value: "paypa1.com",
      }),
    ).toBe(false);
  });

  it('evaluates "matches" regex on string field', () => {
    expect(
      evaluateCondition(testEvent, {
        field: "sender.domain",
        operator: "matches",
        value: "(paypa[l1]|arnazon)",
      }),
    ).toBe(true);
  });

  it("returns false for undefined field", () => {
    expect(
      evaluateCondition(testEvent, {
        field: "nonexistent.field",
        operator: "eq",
        value: "x",
      }),
    ).toBe(false);
  });

  it("returns false for rate_exceeds (handled separately)", () => {
    expect(
      evaluateCondition(testEvent, {
        field: "sender.accountId",
        operator: "rate_exceeds",
        value: 100,
        window: "1m",
      }),
    ).toBe(false);
  });
});

describe("evaluateRule", () => {
  it("returns true when all AND conditions match", () => {
    const rule: Rule = {
      id: "r1",
      name: "Test",
      description: "",
      status: "active",
      conditions: [
        { field: "content.subject", operator: "contains", value: "verify" },
        { field: "content.hasLinks", operator: "eq", value: "true" },
      ],
      logic: "AND",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(evaluateRule(testEvent, rule)).toBe(true);
  });

  it("returns false when one AND condition fails", () => {
    const rule: Rule = {
      id: "r2",
      name: "Test",
      description: "",
      status: "active",
      conditions: [
        { field: "content.subject", operator: "contains", value: "verify" },
        { field: "content.linkCount", operator: "gt", value: 100 },
      ],
      logic: "AND",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(evaluateRule(testEvent, rule)).toBe(false);
  });

  it("returns true when one OR condition matches", () => {
    const rule: Rule = {
      id: "r3",
      name: "Test",
      description: "",
      status: "active",
      conditions: [
        {
          field: "content.subject",
          operator: "contains",
          value: "nonexistent",
        },
        { field: "sender.domain", operator: "matches", value: "paypa[l1]" },
      ],
      logic: "OR",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(evaluateRule(testEvent, rule)).toBe(true);
  });

  it("skips disabled rules", () => {
    const rule: Rule = {
      id: "r4",
      name: "Disabled",
      description: "",
      status: "disabled",
      conditions: [
        { field: "content.subject", operator: "contains", value: "verify" },
      ],
      logic: "AND",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(evaluateRule(testEvent, rule)).toBe(false);
  });
});
