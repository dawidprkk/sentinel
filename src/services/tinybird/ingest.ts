import { tinybird } from "./client";
import type { SendRequest } from "@/schemas/send-request";
import type { DeliveryFeedback } from "@/schemas/delivery-feedback";
import type { Decision } from "@/schemas/decision";

const BATCH_FLUSH_INTERVAL_MS = 5_000;
const BATCH_MAX_SIZE = 100;

type DecisionWithSeverity = Decision & { severity: string };

type Datasource = "send_requests" | "delivery_feedback" | "decisions";

type EventByDatasource = {
  send_requests: SendRequest;
  delivery_feedback: DeliveryFeedback;
  decisions: DecisionWithSeverity;
};

type BatchEntry = EventByDatasource[Datasource];

class IngestBatcher {
  private buffers = new Map<Datasource, BatchEntry[]>();
  private timers = new Map<Datasource, ReturnType<typeof setTimeout>>();
  private inFlight = new Map<Datasource, Promise<void>>();

  async add<D extends Datasource>(
    datasource: D,
    event: EventByDatasource[D],
  ): Promise<void> {
    const buffer = this.buffers.get(datasource);
    if (buffer) {
      buffer.push(event);
    } else {
      this.buffers.set(datasource, [event]);
    }

    const current = this.buffers.get(datasource);
    if (current && current.length >= BATCH_MAX_SIZE) {
      await this.flush(datasource);
      return;
    }

    if (!this.timers.has(datasource)) {
      this.timers.set(
        datasource,
        setTimeout(() => {
          void this.flush(datasource).catch((err) => {
            console.error(`[tinybird] timed flush failed for ${datasource}:`, err);
          });
        }, BATCH_FLUSH_INTERVAL_MS),
      );
    }
  }

  async flush(datasource: Datasource): Promise<void> {
    const existing = this.inFlight.get(datasource);
    if (existing) {
      await existing;
      return;
    }

    const run = this.flushInternal(datasource).finally(() => {
      this.inFlight.delete(datasource);
    });

    this.inFlight.set(datasource, run);
    await run;
  }

  private async flushInternal(datasource: Datasource): Promise<void> {
    const buffer = this.buffers.get(datasource);
    if (!buffer || buffer.length === 0) return;

    const timer = this.timers.get(datasource);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(datasource);
    }

    const events = buffer.splice(0, buffer.length);
    try {
      await tinybird.ingest(datasource, events);
    } catch (err) {
      buffer.unshift(...events);
      throw err;
    }
  }
}

const batcher = new IngestBatcher();

export function ingestSendRequest(event: SendRequest): Promise<void> {
  return batcher.add("send_requests", event);
}

export function ingestDeliveryFeedback(
  feedback: DeliveryFeedback,
): Promise<void> {
  return batcher.add("delivery_feedback", feedback);
}

export function ingestDecision(decision: DecisionWithSeverity): Promise<void> {
  return batcher.add("decisions", decision);
}
