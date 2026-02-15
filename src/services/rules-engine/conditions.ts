import { z } from "zod/v4";
import { RuleConditionSchema } from "@/schemas/rule";
import type { RuleCondition } from "@/schemas/rule";

const RuleConditionsArraySchema = z.array(RuleConditionSchema).min(1);

export function parseRuleConditions(raw: string): RuleCondition[] {
  const parsedJson = JSON.parse(raw);
  return RuleConditionsArraySchema.parse(parsedJson);
}

export function safeParseRuleConditions(raw: string): RuleCondition[] | null {
  try {
    return parseRuleConditions(raw);
  } catch {
    return null;
  }
}
