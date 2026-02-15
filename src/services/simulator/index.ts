import { scheduleFeedback, cancelAllFeedbacks, getFeedbackStats, startFeedbackScheduler } from "./feedback";
import {
  personaManager,
  initializePersonas,
  getPersonasSummary,
  spawnBadActor,
  spawnLegitimate,
  spawnHighThroughputLegitimate,
  type Persona,
} from "./personas";

type SimulatorState = {
  running: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  abortController: AbortController | null;
  runVersion: number;
  eventsAttempted: number;
  ingestFailures: number;
  lastIngestError: string | null;
};

const state: SimulatorState = {
  running: false,
  intervalId: null,
  abortController: null,
  runVersion: 0,
  eventsAttempted: 0,
  ingestFailures: 0,
  lastIngestError: null,
};

const TICK_INTERVAL_MS = 100;

function getDefaultBaseUrl() {
  if (process.env.SIMULATOR_BASE_URL) {
    return process.env.SIMULATOR_BASE_URL;
  }
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

export function startSimulator(
  baseUrl = getDefaultBaseUrl(),
  options: {
    legitimateCount?: number;
    badActorCount?: number;
    highThroughputCount?: number;
  } = {},
) {
  if (state.running)
    return { status: "already_running" as const };

  state.runVersion += 1;
  const currentRunVersion = state.runVersion;
  state.running = true;
  state.abortController = new AbortController();
  state.eventsAttempted = 0;
  state.ingestFailures = 0;
  state.lastIngestError = null;
  startFeedbackScheduler();
  initializePersonas({
    legitimateCount: options.legitimateCount ?? 1,
    badActorCount: options.badActorCount ?? 1,
    highThroughputCount: options.highThroughputCount ?? 1,
  });

  let isProcessingTick = false;
  const CONCURRENCY_LIMIT = 10;
  const { signal } = state.abortController!;

  state.intervalId = setInterval(async () => {
    if (isProcessingTick || signal.aborted || !state.running || currentRunVersion !== state.runVersion) return;
    isProcessingTick = true;

    try {
      if (!state.running || currentRunVersion !== state.runVersion) return;
      const events = personaManager.tick();
      if (events.length === 0) return;

      for (let i = 0; i < events.length; i += CONCURRENCY_LIMIT) {
        if (signal.aborted || !state.running || currentRunVersion !== state.runVersion) break;

        const batch = events.slice(i, i + CONCURRENCY_LIMIT);

        await Promise.all(
          batch.map(async (event) => {
            if (signal.aborted || !state.running || currentRunVersion !== state.runVersion) return;
            try {
              state.eventsAttempted += 1;
              const res = await fetch(`${baseUrl}/api/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event),
                signal,
              });
              if (!res.ok) {
                state.ingestFailures += 1;
                state.lastIngestError = `HTTP ${res.status}`;
                return;
              }
              const data = (await res.json()) as {
                decision?: string;
                eventId?: string;
              };
              if (data.decision === "allow" || data.decision === "flag") {
                const personas = personaManager.getActivePersonas();
                const persona = personas.find((p) => p.accountId === event.sender.accountId);
                const isLegitimate = persona?.type === "legitimate" || persona?.type === "high_legit";
                scheduleFeedback(
                  event.eventId,
                  isLegitimate,
                  `${baseUrl}/api/feedback`,
                );
              }
            } catch {
              state.ingestFailures += 1;
              state.lastIngestError = "Network or runtime fetch error";
            }
          })
        );
      }
    } finally {
      isProcessingTick = false;
    }
  }, TICK_INTERVAL_MS);

  return { status: "started" as const };
}

export function stopSimulator() {
  if (!state.running) return { status: "not_running" as const };

  state.running = false;
  state.runVersion += 1;

  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }

  if (state.intervalId) clearInterval(state.intervalId);
  state.intervalId = null;
  personaManager.reset();
  cancelAllFeedbacks();
  return { status: "stopped" as const };
}

export function getSimulatorStatus() {
  return {
    running: state.running,
    personas: getPersonasSummary(),
    feedbackStats: getFeedbackStats(),
    ingestStats: {
      eventsAttempted: state.eventsAttempted,
      ingestFailures: state.ingestFailures,
      lastIngestError: state.lastIngestError,
    },
  };
}


export function addBadActor(profileIndex = 0): Persona | null {
  if (!state.running) return null;
  return spawnBadActor(profileIndex);
}


export function addLegitimateUser(profileIndex = 0): Persona | null {
  if (!state.running) return null;
  return spawnLegitimate(profileIndex);
}


export function addHighThroughputLegitimate(profileIndex = 0): Persona | null {
  if (!state.running) return null;
  return spawnHighThroughputLegitimate(profileIndex);
}


export function removePersona(id: string): boolean {
  if (!state.running) return false;

  const exists = personaManager.getActivePersonas().some((persona) => persona.id === id);
  if (!exists) return false;

  personaManager.removePersona(id);
  return true;
}
