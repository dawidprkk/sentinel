import { randomUUID } from "crypto";
import type { DeliveryFeedbackStatus } from "@/schemas/delivery-feedback";
import { pick } from "./utils";

const FEEDBACK_DETAILS: Record<DeliveryFeedbackStatus, string[]> = {
  delivered: [
    "Message accepted by recipient server",
    "250 OK",
    "Delivered to inbox",
  ],
  bounced: [
    "550 mailbox not found",
    "550 user unknown",
    "452 insufficient storage",
  ],
  complained: [
    "Reported as spam by recipient",
    "Marked as junk",
    "Abuse report received",
  ],
  opened: ["Email opened by recipient", "Tracking pixel loaded"],
  clicked: ["Link clicked by recipient", "Click registered"],
};

export function generateFeedback(
  eventId: string,
  isLegitimate: boolean,
): {
  feedbackId: string;
  eventId: string;
  timestamp: string;
  status: DeliveryFeedbackStatus;
  detail: string;
} {
  const rand = Math.random();
  let status: DeliveryFeedbackStatus;

  if (isLegitimate) {
    if (rand < 0.90) status = "delivered";
    else if (rand < 0.93) status = "bounced";
    else if (rand < 0.97) status = "opened";
    else status = "clicked";
  } else {
    if (rand < 0.4) status = "delivered";
    else if (rand < 0.7) status = "bounced";
    else if (rand < 0.95) status = "complained";
    else status = "opened";
  }

  return {
    feedbackId: randomUUID(),
    eventId,
    timestamp: new Date().toISOString(),
    status,
    detail: pick(FEEDBACK_DETAILS[status]),
  };
}


class FeedbackScheduler {
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  private feedbackQueue: Array<{ eventId: string; isLegitimate: boolean; feedbackUrl: string }> = [];
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;
  private isStopped = true;
  private readonly MAX_PENDING_TIMEOUTS = 500;
  private readonly MAX_QUEUE_SIZE = 2000;
  private readonly BATCH_SIZE = 10;
  private readonly PROCESS_INTERVAL_MS = 200;

  
  start(): void {
    this.isStopped = false;
  }

  
  schedule(eventId: string, isLegitimate: boolean, feedbackUrl: string): void {
    if (this.isStopped) return;
    if (this.pendingTimeouts.size < this.MAX_PENDING_TIMEOUTS) {
      this.scheduleImmediate(eventId, isLegitimate, feedbackUrl);
      return;
    }
    if (this.feedbackQueue.length < this.MAX_QUEUE_SIZE) {
      this.feedbackQueue.push({ eventId, isLegitimate, feedbackUrl });
      this.ensureProcessingInterval();
    }
  }

  private scheduleImmediate(eventId: string, isLegitimate: boolean, feedbackUrl: string): void {
    const delayMs = 2000 + Math.random() * 2000;
    const timeoutId = setTimeout(async () => {
      this.pendingTimeouts.delete(timeoutId);
      const feedback = generateFeedback(eventId, isLegitimate);
      try {
        await fetch(feedbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        });
      } catch {}
    }, delayMs);
    this.pendingTimeouts.add(timeoutId);
  }

  private ensureProcessingInterval(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL_MS);
  }

  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      let processed = 0;
      while (
        processed < this.BATCH_SIZE &&
        this.feedbackQueue.length > 0 &&
        this.pendingTimeouts.size < this.MAX_PENDING_TIMEOUTS
      ) {
        const item = this.feedbackQueue.shift();
        if (item) {
          this.scheduleImmediate(item.eventId, item.isLegitimate, item.feedbackUrl);
          processed++;
        }
      }
      if (this.feedbackQueue.length === 0 && this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  
  cancelAll(): void {
    this.isStopped = true;
    for (const timeoutId of this.pendingTimeouts) {
      clearTimeout(timeoutId);
    }
    this.pendingTimeouts.clear();
    this.feedbackQueue = [];
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  
  getStats(): { pendingCount: number; queuedCount: number } {
    return {
      pendingCount: this.pendingTimeouts.size,
      queuedCount: this.feedbackQueue.length,
    };
  }
}
const feedbackScheduler = new FeedbackScheduler();


export function startFeedbackScheduler(): void {
  feedbackScheduler.start();
}

export function scheduleFeedback(
  eventId: string,
  isLegitimate: boolean,
  feedbackUrl: string,
) {
  feedbackScheduler.schedule(eventId, isLegitimate, feedbackUrl);
}


export function cancelAllFeedbacks(): void {
  feedbackScheduler.cancelAll();
}


export function getFeedbackStats(): { pendingCount: number; queuedCount: number } {
  return feedbackScheduler.getStats();
}
