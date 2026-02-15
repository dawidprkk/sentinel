"use client";

import { useTinybird } from "@/hooks/use-tinybird";
import { StatCard } from "./stat-card";
import { getRangeLabel } from "@/lib/time-range";

interface OverviewSummary {
  total_requests: number;
  total_decisions: number;
  total_blocks: number;
  total_flags: number;
  block_rate_pct: number;
}

interface Threat {
  rule_name: string;
  block_count: number;
}

interface Props {
  startTime: string;
  timeRange: number;
}

export function OverviewStats({ startTime, timeRange }: Props) {
  const timeParams = { start_time: startTime };

  const { data: summary } = useTinybird<OverviewSummary>(
    "overview_summary",
    timeParams,
    15_000,
  );
  const { data: threats } = useTinybird<Threat>(
    "active_threats",
    timeParams,
    15_000,
  );

  const row = summary?.data?.[0];
  const totalRequests = row?.total_requests ?? 0;
  const totalBlocks = row?.total_blocks ?? 0;
  const totalDecisions = row?.total_decisions ?? 0;
  const totalFlags = row?.total_flags ?? 0;
  const blockRate = `${(row?.block_rate_pct ?? 0).toFixed(1)}%`;

  const activeThreats = threats?.data?.length ?? 0;
  const rangeLabel = getRangeLabel(timeRange);

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard
        label={`Requests (${rangeLabel})`}
        value={totalRequests.toLocaleString()}
        tooltip={`Total email send requests received in the last ${rangeLabel}`}
        color="blue"
      />
      <StatCard
        label={`Block Rate (${rangeLabel})`}
        value={blockRate}
        sub={`${totalBlocks} blocked of ${totalDecisions} total`}
        tooltip={`Percentage of events blocked by rules in the last ${rangeLabel}. A higher block rate may indicate more aggressive rule enforcement or an increase in abusive activity.`}
        color={totalBlocks > 0 ? "red" : "green"}
      />
      <StatCard
        label={`Active Threats (${rangeLabel})`}
        value={activeThreats}
        sub={activeThreats > 0 ? `${activeThreats} distinct rules firing` : undefined}
        tooltip={`Number of distinct rules that have triggered at least one block in the last ${rangeLabel}. Each active threat represents a different type of abuse being detected.`}
        color={activeThreats > 0 ? "amber" : "green"}
      />
      <StatCard
        label={`Flags (${rangeLabel})`}
        value={totalFlags.toLocaleString()}
        tooltip={`Events flagged for review but not blocked in the last ${rangeLabel}. Flagged events are still delivered but marked for analyst attention.`}
        color="amber"
      />
    </div>
  );
}
