import type { SendRequestInput } from "@/schemas/send-request";

export function normalizeSendRequest(event: SendRequestInput): SendRequestInput {
  return {
    ...event,
    timestamp: new Date(event.timestamp).toISOString(),
    sender: {
      ...event.sender,
      email: event.sender.email.toLowerCase(),
      domain: event.sender.domain.toLowerCase(),
    },
    recipient: {
      ...event.recipient,
      email: event.recipient.email.toLowerCase(),
      domain: event.recipient.domain.toLowerCase(),
    },
    content: {
      ...event.content,
      subject: event.content.subject.trim(),
      body: event.content.body.trim(),
    },
  };
}
