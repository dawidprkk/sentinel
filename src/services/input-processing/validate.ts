import { IngestSendRequestSchema } from "@/schemas/send-request";
import type { SendRequestInput } from "@/schemas/send-request";

type ValidationResult =
  | { success: true; data: SendRequestInput }
  | { success: false; error: string };

export function validateSendRequest(raw: unknown): ValidationResult {
  const result = IngestSendRequestSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.message,
  };
}
