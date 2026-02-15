import type { EventBus, EventHandler, PipelineEvent } from "./types";

type HandlerSet = Set<EventHandler>;

export class InMemoryEventBus implements EventBus {
  private handlers: Map<PipelineEvent["type"], HandlerSet> = new Map();

  async publish(event: PipelineEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }
    queueMicrotask(() => {
      for (const handler of handlers) {
        Promise.resolve(handler(event)).catch((error) => {
          console.error(`Event handler failed [${event.type}]`, error);
        });
      }
    });
  }

  subscribe<T extends PipelineEvent["type"]>(
    type: T,
    handler: EventHandler<Extract<PipelineEvent, { type: T }>>,
  ): () => void {
    const existing = this.handlers.get(type) ?? new Set<EventHandler>();
    existing.add(handler as EventHandler);
    this.handlers.set(type, existing);

    return () => {
      existing.delete(handler as EventHandler);
      if (existing.size === 0) {
        this.handlers.delete(type);
      }
    };
  }
}
