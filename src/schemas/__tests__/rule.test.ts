import { describe, it, expect } from "vitest";
import { RuleSchema } from "../rule";

describe("RuleSchema", () => {
  it("validates a correct rule", () => {
    const valid = {
      id: "rule_1",
      name: "Phishing detection",
      description: "Blocks phishing attempts",
      status: "active",
      conditions: [
        {
          field: "content.subject",
          operator: "contains",
          value: "verify your account",
        },
      ],
      logic: "AND",
      action: "block",
      severity: "critical",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(valid).success).toBe(true);
  });

  it("validates rate_exceeds operator with window", () => {
    const valid = {
      id: "rule_2",
      name: "Volume spike",
      description: "High volume sender",
      status: "active",
      conditions: [
        {
          field: "sender.accountId",
          operator: "rate_exceeds",
          value: 100,
          window: "1m",
        },
      ],
      logic: "AND",
      action: "block",
      severity: "high",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(valid).success).toBe(true);
  });

  it("validates neq operator", () => {
    const valid = {
      id: "rule_neq",
      name: "Not trusted domain",
      description: "Exclude trusted sender domains",
      status: "active",
      conditions: [
        {
          field: "sender.domain",
          operator: "neq",
          value: "launch.techstartup.io",
        },
      ],
      logic: "AND",
      action: "block",
      severity: "high",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid operator", () => {
    const invalid = {
      id: "rule_3",
      name: "Bad",
      description: "Bad rule",
      status: "active",
      conditions: [{ field: "x", operator: "nope", value: 1 }],
      logic: "AND",
      action: "block",
      severity: "low",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects rate_exceeds with non-positive threshold", () => {
    const invalid = {
      id: "rule_4",
      name: "Too low",
      description: "Invalid threshold",
      status: "active",
      conditions: [
        {
          field: "sender.accountId",
          operator: "rate_exceeds",
          value: 0,
          window: "1m",
        },
      ],
      logic: "AND",
      action: "block",
      severity: "high",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects rate_exceeds with invalid window format", () => {
    const invalid = {
      id: "rule_5",
      name: "Bad window",
      description: "Invalid window",
      status: "active",
      conditions: [
        {
          field: "sender.accountId",
          operator: "rate_exceeds",
          value: 2,
          window: "minute",
        },
      ],
      logic: "AND",
      action: "block",
      severity: "high",
      createdAt: "2026-02-11T10:00:00.000Z",
    };
    expect(RuleSchema.safeParse(invalid).success).toBe(false);
  });
});
