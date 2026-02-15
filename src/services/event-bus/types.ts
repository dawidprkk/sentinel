import type { SendRequest } from "@/schemas/send-request";
import type { DeliveryFeedback } from "@/schemas/delivery-feedback";
import type { Decision } from "@/schemas/decision";

export type ProcessedSendRequestEvent = {
  type: "send_request_processed";
  payload: {
    event: SendRequest;
    decision: Decision & { severity: string };
  };
};

export type DeliveryFeedbackReceivedEvent = {
  type: "delivery_feedback_received";
  payload: {
    feedback: DeliveryFeedback;
  };
};

export type PipelineEvent =
  | ProcessedSendRequestEvent
  | DeliveryFeedbackReceivedEvent;

export type EventHandler<T extends PipelineEvent = PipelineEvent> = (
  event: T,
) => Promise<void> | void;

export interface EventBus {
  publish(event: PipelineEvent): Promise<void>;
  subscribe<T extends PipelineEvent["type"]>(
    type: T,
    handler: EventHandler<Extract<PipelineEvent, { type: T }>>,
  ): () => void;
}
