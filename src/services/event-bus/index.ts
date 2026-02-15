import { InMemoryEventBus } from "./in-memory";
import { registerTinybirdSink } from "@/services/tinybird/sink";

export const eventBus = new InMemoryEventBus();

let initialized = false;

export function initializeEventBusSubscribers() {
  if (initialized) {
    return;
  }
  registerTinybirdSink(eventBus);
  initialized = true;
}
