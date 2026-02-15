import type { SendRequest, SendRequestInput } from "@/schemas/send-request";

const SUSPICIOUS_KEYWORDS = new Set([
  "verify",
  "account",
  "security",
  "immediately",
  "paypal",
  "limited",
  "verification",
  "deals",
  "click",
  "free",
  "login",
  "credential",
  "password",
  "reset",
]);

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  return matches ?? [];
}

export function extractSuspiciousKeywords(event: SendRequestInput): SendRequest {
  const contentTokens = tokenize(`${event.content.subject} ${event.content.body}`);
  const extracted = contentTokens.filter((token) =>
    SUSPICIOUS_KEYWORDS.has(token),
  );

  const normalizedKeywords = Array.from(new Set(extracted));

  return {
    ...event,
    content: {
      ...event.content,
      suspiciousKeywords: normalizedKeywords,
    },
  };
}
