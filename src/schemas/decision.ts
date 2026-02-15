import { z } from "zod/v4";

const DecisionSchema = z.object({
  id: z.string(),
  eventId: z.uuid(),
  ruleId: z.string().nullable(),
  ruleName: z.string().nullable(),
  action: z.enum(["block", "flag", "allow"]),
  reason: z.string(),
  timestamp: z.iso.datetime(),
});

export type Decision = z.infer<typeof DecisionSchema>;
