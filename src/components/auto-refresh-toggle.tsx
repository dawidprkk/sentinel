"use client";

import { useAutoRefresh } from "@/hooks/use-autorefresh";

export function AutoRefreshToggle() {
  const { enabled, toggle } = useAutoRefresh();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-mono transition-colors ${
        enabled
          ? "border-[rgba(70,254,165,0.35)] bg-[rgba(70,254,165,0.12)] text-[rgba(70,254,165,0.83)] hover:bg-[rgba(70,254,165,0.18)]"
          : "border-white/[0.1] bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
      }`}
      aria-pressed={enabled}
      aria-label="Toggle auto refresh"
    >
      <span
        className={`h-2 w-2 rounded-full ${enabled ? "bg-[rgba(70,254,165,0.83)]" : "bg-white/25"}`}
      />
      {enabled ? "Auto-refresh on" : "Auto-refresh off"}
    </button>
  );
}
