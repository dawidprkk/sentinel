import { evaluateCondition, evaluateRule } from "./evaluate";
import { explainDecision } from "./explain";
import { getAccountEventCount } from "@/services/tinybird/queries";
import type { SendRequest } from "@/schemas/send-request";
import type { Rule, RuleCondition } from "@/schemas/rule";
import type { Decision } from "@/schemas/decision";
import { randomUUID } from "crypto";

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h)$/);
  if (!match) return 60;
  const [, num, unit] = match;
  switch (unit) {
    case "s":
      return Number(num);
    case "m":
      return Number(num) * 60;
    case "h":
      return Number(num) * 3600;
    default:
      return 60;
  }
}

function createDecision(
  event: SendRequest,
  rule: Rule | null,
): Decision & { severity: string } {
  return {
    id: randomUUID(),
    eventId: event.eventId,
    ruleId: rule?.id ?? null,
    ruleName: rule?.name ?? null,
    action: rule?.action ?? "allow",
    severity: rule?.severity ?? "low",
    reason: explainDecision(event, rule),
    timestamp: new Date().toISOString(),
  };
}

async function evaluateConditionWithRate(
  event: SendRequest,
  rule: Rule,
  condition: RuleCondition,
): Promise<boolean> {
  if (condition.operator !== "rate_exceeds") {
    return evaluateCondition(event, condition);
  }

  const window = condition.window || "1m";
  const windowSeconds = parseWindow(window);
  try {
    const result = await getAccountEventCount(
      event.sender.accountId,
      windowSeconds,
    );
    const firstRow = result.data[0];
    const count = firstRow?.event_count ?? 0;
    return count > Number(condition.value);
  } catch (error) {
    console.warn("[rules-engine] Tinybird rate lookup failed", {
      accountId: event.sender.accountId,
      eventId: event.eventId,
      ruleId: rule.id,
      ruleName: rule.name,
      window,
      error,
    });
    return false;
  }
}

async function evaluateRuleWithRate(
  event: SendRequest,
  rule: Rule,
): Promise<boolean> {
  const hasRateCondition = rule.conditions.some(
    (condition) => condition.operator === "rate_exceeds",
  );
  if (!hasRateCondition) {
    return evaluateRule(event, rule);
  }

  if (rule.logic === "AND") {
    for (const condition of rule.conditions) {
      const matches = await evaluateConditionWithRate(event, rule, condition);
      if (!matches) return false;
    }
    return true;
  }

  for (const condition of rule.conditions) {
    const matches = await evaluateConditionWithRate(event, rule, condition);
    if (matches) return true;
  }
  return false;
}

export async function evaluateEvent(
  event: SendRequest,
  rules: Rule[],
): Promise<Decision & { severity: string }> {
  const activeRules = rules.filter((r) => r.status === "active");

  for (const rule of activeRules) {
    const matches = await evaluateRuleWithRate(event, rule);
    if (matches) {
      return createDecision(event, rule);
    }
  }

  return createDecision(event, null);
}
