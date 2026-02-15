import type { SendRequest } from "@/schemas/send-request";
import type { Rule, RuleCondition } from "@/schemas/rule";
import { getNestedValue } from "./field-access";

const regexCache = new Map<string, RegExp | null>();

function getCaseInsensitiveRegex(pattern: string): RegExp | null {
  const cached = regexCache.get(pattern);
  if (cached !== undefined) return cached;
  try {
    const regex = new RegExp(pattern, "i");
    regexCache.set(pattern, regex);
    return regex;
  } catch {
    regexCache.set(pattern, null);
    return null;
  }
}

export function evaluateCondition(
  event: SendRequest,
  condition: RuleCondition,
): boolean {
  const fieldValue = getNestedValue(event, condition.field);
  if (fieldValue === undefined) return false;

  const { operator, value } = condition;

  switch (operator) {
    case "eq":
      return String(fieldValue) === String(value);
    case "neq":
      return String(fieldValue) !== String(value);
    case "gt":
      return Number(fieldValue) > Number(value);
    case "lt":
      return Number(fieldValue) < Number(value);
    case "contains": {
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((item) => String(item) === String(value));
      }
      return String(fieldValue)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    }
    case "matches": {
      const regex = getCaseInsensitiveRegex(String(value));
      if (!regex) return false;
      return regex.test(String(fieldValue));
    }
    default:
      return false;
  }
}

export function evaluateRule(event: SendRequest, rule: Rule): boolean {
  if (rule.status === "disabled") return false;

  const conditions = rule.conditions;
  if (rule.logic === "AND") {
    return conditions.every((c) => evaluateCondition(event, c));
  }
  return conditions.some((c) => evaluateCondition(event, c));
}
