"use client";

import { useSyncExternalStore } from "react";

let rateLimited = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return rateLimited;
}

export function setRateLimited(value: boolean) {
  if (rateLimited !== value) {
    rateLimited = value;
    listeners.forEach((cb) => cb());
  }
}

export function RateLimitBanner() {
  const limited = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!limited) return null;

  return (
    <div className="bg-[rgba(250,130,0,0.15)] border-b border-[rgba(250,130,0,0.3)] px-4 py-2.5 text-center text-sm text-[#FFCA16]">
      Daily request limit exceeded (1,000 requests/day). Data may be stale
      until the limit resets.
    </div>
  );
}
