import { normalizeSendRequest } from "./normalize";
import { extractSuspiciousKeywords } from "./extract-suspicious-keywords";
import type { SendRequest, SendRequestInput } from "@/schemas/send-request";

export function processInput(input: SendRequestInput): SendRequest {
  const normalized = normalizeSendRequest(input);
  const enriched = extractSuspiciousKeywords(normalized);
  return enriched;
}
