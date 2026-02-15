"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PersonasSummary {
  total: number;
  byType: { legitimate: number; bad_actor: number; high_legit: number };
  totalRate: number;
  personas: Array<{
    id: string;
    accountId: string;
    type: string;
    currentRate: number;
  }>;
}

interface SimulatorStatus {
  running: boolean;
  personas: PersonasSummary;
}

const BAD_ACTOR_TYPES = [
  { index: 0, label: "Phishing", accountPrefix: "bad_actor_phishing_" },
  { index: 1, label: "Spoofing", accountPrefix: "bad_actor_spoofing_" },
  { index: 2, label: "High Volume", accountPrefix: "bad_actor_highvolume_" },
  { index: 3, label: "Suspicious Content", accountPrefix: "bad_actor_suspicious_" },
  { index: 4, label: "Credential", accountPrefix: "bad_actor_credential_" },
];
const LEGITIMATE_TYPES = [
  { index: 0, label: "Shopify", accountPrefix: "legit_shopify_" },
  { index: 1, label: "Amazon Seller", accountPrefix: "legit_amazon_seller_" },
  { index: 2, label: "Etsy", accountPrefix: "legit_etsy_" },
  { index: 3, label: "Stripe Billing", accountPrefix: "legit_stripe_billing_" },
  { index: 4, label: "Square", accountPrefix: "legit_square_" },
];
const HIGH_THROUGHPUT_TYPES = [
  { index: 0, label: "Black Friday Promo", accountPrefix: "high_legit_blackfriday_promo_" },
  { index: 1, label: "Product Launch", accountPrefix: "high_legit_product_launch_" },
];

export function SimulatorControl() {
  const { data: status, mutate } = useSWR<SimulatorStatus>(
    "/api/simulate",
    fetcher,
    { refreshInterval: 1000 }
  );

  const [showPersonas, setShowPersonas] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const start = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await mutate(
        async (current) => {
          await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "start",
            }),
          });
          return current
            ? { ...current, running: true }
            : current;
        },
        { revalidate: true }
      );
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, mutate]);

  const stop = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await mutate(
        async (current) => {
          await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop" }),
          });
          return current
            ? {
                ...current,
                running: false,
                personas: {
                  ...current.personas,
                  total: 0,
                  totalRate: 0,
                  byType: { legitimate: 0, bad_actor: 0, high_legit: 0 },
                  personas: [],
                },
              }
            : current;
        },
        { revalidate: true }
      );
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, mutate]);

  const spawnLegitimate = useCallback(async (profileIndex: number) => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "spawn_legitimate", profileIndex }),
    });
    mutate();
  }, [mutate]);

  const spawnBadActor = useCallback(async (profileIndex: number) => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "spawn_bad_actor", profileIndex }),
    });
    mutate();
  }, [mutate]);

  const spawnHighThroughput = useCallback(async (profileIndex: number) => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "spawn_high_throughput", profileIndex }),
    });
    mutate();
  }, [mutate]);

  const removePersona = useCallback(async (personaId: string) => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_persona", personaId }),
    });
    mutate();
  }, [mutate]);

  const inputClass =
    "bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-xs font-mono text-white";
  const personas = status?.personas.personas ?? [];

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
            Simulator
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status?.running ? "bg-[rgba(70,254,165,0.83)]" : "bg-white/20"
              }`}
            />
            <span className="text-sm font-mono">
              {status?.running ? "Running" : "Stopped"}
            </span>
            {status?.running && (
              <span className="text-xs text-white/40">
                ({Math.round(status.personas.totalRate * 60 * 10) / 10} rpm)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status?.running && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    spawnLegitimate(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                className={`${inputClass} text-[rgba(70,254,165,0.83)] bg-[rgba(34,255,153,0.08)]`}
                defaultValue=""
              >
                <option value="" disabled>+ Normal User</option>
                {LEGITIMATE_TYPES.map((t) => (
                  <option
                    key={t.index}
                    value={t.index}
                    disabled={personas.some(
                      (p) =>
                        p.type === "legitimate" &&
                        p.accountId.startsWith(t.accountPrefix),
                    )}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    spawnHighThroughput(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                className={`${inputClass} text-[rgba(70,254,165,0.83)] bg-[rgba(34,255,153,0.08)]`}
                defaultValue=""
              >
                <option value="" disabled>+ High Volume Sender</option>
                {HIGH_THROUGHPUT_TYPES.map((t) => (
                  <option
                    key={t.index}
                    value={t.index}
                    disabled={personas.some(
                      (p) =>
                        p.type === "high_legit" &&
                        p.accountId.startsWith(t.accountPrefix),
                    )}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    spawnBadActor(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                className={`${inputClass} text-[#FFCA16] bg-[rgba(250,130,0,0.13)]`}
                defaultValue=""
              >
                <option value="" disabled>+ Spawn Attacker</option>
                {BAD_ACTOR_TYPES.map((t) => (
                  <option
                    key={t.index}
                    value={t.index}
                    disabled={personas.some(
                      (p) =>
                        p.type === "bad_actor" &&
                        p.accountId.startsWith(t.accountPrefix),
                    )}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {status?.running && (
            <button
              onClick={() => setShowPersonas(!showPersonas)}
              className="px-2 py-1 rounded text-xs text-white/50 hover:text-white/80"
            >
              {showPersonas ? "Hide" : "Show"} Personas
            </button>
          )}
          <button
            onClick={status?.running ? stop : start}
            disabled={isToggling}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              status?.running
                ? "bg-[rgba(255,23,63,0.18)] text-[#FF9592] hover:bg-[rgba(255,23,63,0.25)]"
                : "bg-[rgba(34,255,153,0.12)] text-[rgba(70,254,165,0.83)] hover:bg-[rgba(34,255,153,0.18)]"
            } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {status?.running ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      
      {status?.running && showPersonas && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex gap-4 mb-2 text-xs">
            <span className="text-white/40">
              Legitimate: <span className="text-[rgba(70,254,165,0.83)]">{status.personas.byType.legitimate}</span>
            </span>
            <span className="text-white/40">
              Bad Actors: <span className="text-[#FF9592]">{status.personas.byType.bad_actor}</span>
            </span>
            <span className="text-white/40">
              High Throughput: <span className="text-[rgba(70,254,165,0.83)]">{status.personas.byType.high_legit}</span>
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {status.personas.personas.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs font-mono bg-white/[0.02] rounded px-2 py-1"
                >
                  <span className={p.type === "bad_actor" ? "text-[#FF9592]" : p.type === "high_legit" ? "text-emerald-600" : "text-white/60"}>
                    {p.accountId}
                  </span>
                <div className="flex items-center gap-3">
                  <span className="text-white/40 w-16 text-right">
                    {Math.round(p.currentRate * 60 * 10) / 10} rpm
                  </span>
                  <button
                    onClick={() => removePersona(p.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.12] text-white/40 hover:text-white/80 hover:border-white/30"
                    aria-label={`Remove ${p.accountId}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
