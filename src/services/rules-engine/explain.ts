import type { SendRequest } from "@/schemas/send-request";
import type { Rule } from "@/schemas/rule";
import { getNestedValue } from "./field-access";

export function explainDecision(
  event: SendRequest,
  rule: Rule | null,
): string {
  if (!rule) {
    return "Allowed: No rules matched - event passed all checks";
  }

  const conditionDetails = rule.conditions.map((c) => {
    const actualValue = getNestedValue(event, c.field);
    return `${c.field} ${c.operator} "${c.value}" (actual: "${actualValue}")`;
  });

  const action = rule.action === "block" ? "Blocked" : "Flagged";
  return `${action}: ${rule.name} - ${conditionDetails.join(` ${rule.logic} `)}`;
}
