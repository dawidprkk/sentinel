import { z } from "zod/v4";

export const DeliveryFeedbackStatusSchema = z.enum([
  "delivered",
  "bounced",
  "complained",
  "opened",
  "clicked",
]);

export const DeliveryFeedbackSchema = z.object({
  feedbackId: z.uuid(),
  eventId: z.uuid(),
  timestamp: z.iso.datetime(),
  status: DeliveryFeedbackStatusSchema,
  detail: z.string(),
});

export type DeliveryFeedback = z.infer<typeof DeliveryFeedbackSchema>;
export type DeliveryFeedbackStatus = z.infer<typeof DeliveryFeedbackStatusSchema>;
