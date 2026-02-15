import { z } from "zod/v4";

export const ConditionOperatorSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "lt",
  "contains",
  "matches",
  "rate_exceeds",
]);

export const RuleConditionSchema = z.object({
  field: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.union([z.string(), z.number()]),
  window: z.string().optional(),
}).superRefine((condition, ctx) => {
  if (condition.operator === "rate_exceeds") {
    if (
      typeof condition.value !== "number" ||
      !Number.isFinite(condition.value) ||
      condition.value <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "rate_exceeds value must be a number greater than 0",
      });
    }

    const window = condition.window ?? "";
    if (!/^(\d+)(s|m|h)$/.test(window)) {
      ctx.addIssue({
        code: "custom",
        path: ["window"],
        message: "rate_exceeds window must match format like 10s, 1m, 2h",
      });
    }
  }
});

export const RuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(["active", "disabled"]),
  conditions: z.array(RuleConditionSchema).min(1),
  logic: z.enum(["AND", "OR"]),
  action: z.enum(["block", "flag"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  createdAt: z.iso.datetime(),
});

export type Rule = z.infer<typeof RuleSchema>;
export type RuleCondition = z.infer<typeof RuleConditionSchema>;
