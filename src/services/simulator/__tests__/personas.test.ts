import { describe, it, expect, beforeEach } from "vitest";
import {
  personaManager,
  initializePersonas,
  spawnBadActor,
  spawnLegitimate,
  spawnHighThroughputLegitimate,
  getPersonasSummary,
} from "../personas";
import { simulatorConfig } from "../config";

describe("Persona System", () => {
  beforeEach(() => {
    personaManager.reset();
  });

  it("should initialize with legitimate and bad actor personas", () => {
    initializePersonas({
      legitimateCount: 10,
      badActorCount: 3,
      highThroughputCount: 0,
    });

    const summary = getPersonasSummary();
    expect(summary.total).toBe(8);
    expect(summary.byType.legitimate).toBe(5);
    expect(summary.byType.bad_actor).toBe(3);
  });

  it("should cap normal legitimate users at 5", () => {
    initializePersonas({
      legitimateCount: 30,
      badActorCount: 0,
      highThroughputCount: 0,
    });

    const summary = getPersonasSummary();
    expect(summary.byType.legitimate).toBe(5);
  });

  it("should spawn different bad actor types", () => {
    for (let i = 0; i < 5; i++) {
      expect(spawnBadActor(i)).not.toBeNull();
    }

    const summary = getPersonasSummary();
    expect(summary.byType.bad_actor).toBe(5);
    const accountIds = summary.personas.map(p => p.accountId);
    expect(accountIds.some(id => id.includes("phishing"))).toBe(true);
    expect(accountIds.some(id => id.includes("spoofing"))).toBe(true);
    expect(accountIds.some(id => id.includes("highvolume"))).toBe(true);
    expect(accountIds.some(id => id.includes("suspicious"))).toBe(true);
    expect(accountIds.some(id => id.includes("credential"))).toBe(true);
  });

  it("should keep per-type counts for mixed persona sets", () => {
    initializePersonas({
      legitimateCount: 1,
      badActorCount: 1,
      highThroughputCount: 0,
    });
    spawnHighThroughputLegitimate(0);

    const summary = getPersonasSummary();
    expect(summary.byType.legitimate).toBe(1);
    expect(summary.byType.bad_actor).toBe(1);
    expect(summary.byType.high_legit).toBe(1);
  });

  it("should generate events on tick", () => {
    initializePersonas({
      legitimateCount: 2,
      badActorCount: 0,
      highThroughputCount: 0,
    });
    const events = personaManager.tick();
    expect(Array.isArray(events)).toBe(true);
  });

  it("should reset all personas", () => {
    initializePersonas({
      legitimateCount: 3,
      badActorCount: 2,
      highThroughputCount: 0,
    });
    expect(getPersonasSummary().total).toBe(5);

    personaManager.reset();
    expect(getPersonasSummary().total).toBe(0);
  });

  it("should use fixed IPs from profiles", () => {
    initializePersonas({
      legitimateCount: 1,
      badActorCount: 1,
      highThroughputCount: 0,
    });

    const personas = personaManager.getActivePersonas();
    for (const p of personas) {
      expect(p.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    }
  });

  it("should expose configured RPM for each persona type", () => {
    initializePersonas({
      legitimateCount: 1,
      badActorCount: 0,
      highThroughputCount: 0,
    });
    spawnHighThroughputLegitimate(0);
    spawnBadActor(0);

    const summary = getPersonasSummary();
    const toRpm = (ratePerSecond: number) => ratePerSecond * 60;

    const legit = summary.personas.find((p) => p.type === "legitimate");
    const highThroughput = summary.personas.find((p) => p.type === "high_legit");
    const badActor = summary.personas.find((p) => p.type === "bad_actor");

    expect(legit).toBeDefined();
    expect(highThroughput).toBeDefined();
    expect(badActor).toBeDefined();

    expect(toRpm(legit!.currentRate)).toBeCloseTo(
      simulatorConfig.legitimateRatePerMinute,
      6,
    );
    expect(toRpm(highThroughput!.currentRate)).toBeCloseTo(
      simulatorConfig.highThroughputRatePerMinute,
      6,
    );
    expect(toRpm(badActor!.currentRate)).toBeCloseTo(
      simulatorConfig.badActorRatePerMinute,
      6,
    );
    expect(legit!.accountId).toMatch(/^legit_[a-z_]+_\d+$/);
    expect(highThroughput!.accountId).toMatch(/^high_legit_[a-z_]+_\d+$/);
    expect(badActor!.accountId).toMatch(/^bad_actor_[a-z_]+_\d+$/);
  });

  it("should allow each bad actor subtype only once", () => {
    const first = spawnBadActor(1);
    const duplicate = spawnBadActor(1);

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  it("should allow each high-throughput subtype only once", () => {
    const first = spawnHighThroughputLegitimate(0);
    const duplicate = spawnHighThroughputLegitimate(0);

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  it("should stop spawning legitimate users after 5", () => {
    for (let i = 0; i < 5; i++) {
      expect(spawnLegitimate()).not.toBeNull();
    }

    expect(spawnLegitimate()).toBeNull();
  });
});
