"use client";

import { useState, useMemo } from "react";
import { AutoRefreshToggle } from "@/components/auto-refresh-toggle";
import { SimulatorControl } from "@/components/simulator-control";
import { OverviewStats } from "@/components/overview-stats";
import { ThroughputChart } from "@/components/charts/throughput-chart";
import { DecisionsChart } from "@/components/charts/decisions-chart";
import { DeliveryOutcomesChart } from "@/components/charts/delivery-outcomes-chart";
import { ActiveThreatsTable } from "@/components/active-threats-table";
import { TopBlockedAccounts } from "@/components/top-blocked-accounts";
import { DASHBOARD_TIME_RANGES, getRangeStartTime } from "@/lib/time-range";

export default function OverviewPage() {
  const [timeRange, setTimeRange] = useState(60);

  const startTime = useMemo(() => {
    return getRangeStartTime(timeRange);
  }, [timeRange]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Overview</h1>
          <div className="flex rounded-md border border-white/[0.08] overflow-hidden">
            {DASHBOARD_TIME_RANGES.map((r) => (
              <button
                key={r.minutes}
                onClick={() => setTimeRange(r.minutes)}
                className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                  timeRange === r.minutes
                    ? "bg-white/[0.12] text-white"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <AutoRefreshToggle />
      </div>

      <SimulatorControl />

      <OverviewStats startTime={startTime} timeRange={timeRange} />

      <div className="grid grid-cols-2 gap-4">
        <ThroughputChart startTime={startTime} />
        <DecisionsChart startTime={startTime} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DeliveryOutcomesChart startTime={startTime} />
        <ActiveThreatsTable startTime={startTime} timeRange={timeRange} />
      </div>

      <TopBlockedAccounts startTime={startTime} timeRange={timeRange} />
    </div>
  );
}
