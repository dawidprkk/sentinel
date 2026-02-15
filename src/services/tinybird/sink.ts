import type { PipelineEvent } from "@/services/event-bus/types";
import type { EventBus } from "@/services/event-bus/types";
import {
  ingestDecision,
  ingestDeliveryFeedback,
  ingestSendRequest,
} from "@/services/tinybird/ingest";

type AnalyticsSink = () => Promise<void>;

async function withRetry(
  fn: AnalyticsSink,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fn();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      const delay = baseDelayMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function handleEvent(event: PipelineEvent) {
  switch (event.type) {
    case "send_request_processed":
      return withRetry(async () => {
        await Promise.all([
          ingestSendRequest(event.payload.event),
          ingestDecision(event.payload.decision),
        ]);
      });
    case "delivery_feedback_received":
      return withRetry(async () => {
        await ingestDeliveryFeedback(event.payload.feedback);
      });
    default:
      return Promise.resolve();
  }
}

export function registerTinybirdSink(eventBus: EventBus) {
  const unsubscribers = [
    eventBus.subscribe("send_request_processed", handleEvent),
    eventBus.subscribe("delivery_feedback_received", handleEvent),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
