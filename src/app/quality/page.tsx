"use client";

import { useState, useMemo } from "react";
import { AutoRefreshToggle } from "@/components/auto-refresh-toggle";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTinybird } from "@/hooks/use-tinybird";
import { StatCard } from "@/components/stat-card";
import { formatTimestamp } from "@/lib/format";
import {
  DASHBOARD_TIME_RANGES,
  getRangeLabel,
  getRangeStartTime,
} from "@/lib/time-range";

interface DeliveryBucket {
  bucket: string;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
}

interface ProblemAccount {
  sender_account_id: string;
  total_feedback: number;
  bounces: number;
  complaints: number;
  problem_rate_pct: number;
}

interface QualitySummary {
  total_decisions: number;
  total_blocks: number;
  total_flags: number;
  total_feedback: number;
  delivered: number;
  bounced: number;
  complained: number;
  detection_rate_pct: number;
  complaint_rate_pct: number;
  bounce_rate_pct: number;
  delivery_success_rate_pct: number;
}
const STATUS_ORDER = ["delivered", "bounced", "complained", "opened", "clicked"];

const statusColors: Record<string, string> = {
  delivered: "rgba(70,254,165,0.83)",
  bounced: "#FF9592",
  complained: "#FFCA16",
  opened: "#70B8FF",
  clicked: "#A78BFA",
};

export default function QualityPage() {
  const [timeRange, setTimeRange] = useState(60);

  const startTime = useMemo(() => {
    return getRangeStartTime(timeRange);
  }, [timeRange]);

  const timeParams = { start_time: startTime };
  const rangeLabel = getRangeLabel(timeRange);

  const { data: delivery } = useTinybird<DeliveryBucket>(
    "delivery_outcomes_pivoted",
    timeParams,
    15_000,
  );
  const { data: summary } = useTinybird<QualitySummary>(
    "quality_summary",
    timeParams,
    15_000,
  );
  const { data: problems } = useTinybird<ProblemAccount>(
    "problem_accounts_top",
    { ...timeParams, limit: 10 },
    15_000,
  );

  const deliveryRows = delivery?.data ?? [];
  const summaryRow = summary?.data?.[0];
  const topProblems = problems?.data ?? [];
  const statuses = STATUS_ORDER.filter((s) =>
    deliveryRows.some((r) => r[s as keyof DeliveryBucket] as number > 0),
  );
  const chartData = deliveryRows
    .slice()
    .reverse()
    .map((d) => ({
      time: formatTimestamp(d.bucket),
      delivered: d.delivered,
      bounced: d.bounced,
      complained: d.complained,
      opened: d.opened,
      clicked: d.clicked,
    }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Signal Quality</h1>
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

      
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label={`Detection Rate (${rangeLabel})`}
          value={`${(summaryRow?.detection_rate_pct ?? 0).toFixed(1)}%`}
          sub={`${(summaryRow?.total_blocks ?? 0) + (summaryRow?.total_flags ?? 0)} detected of ${summaryRow?.total_decisions ?? 0} events`}
          tooltip={`Percentage of events that triggered a block or flag rule in the last ${rangeLabel}. Higher = more aggressive detection.`}
          color={(summaryRow?.detection_rate_pct ?? 0) > 20 ? "amber" : "blue"}
        />
        <StatCard
          label={`Complaint Rate (${rangeLabel})`}
          value={`${(summaryRow?.complaint_rate_pct ?? 0).toFixed(2)}%`}
          sub={`${summaryRow?.complained ?? 0} complaints of ${summaryRow?.total_feedback ?? 0} deliveries`}
          tooltip={`Percentage of delivered emails that recipients reported as spam in the last ${rangeLabel}. High complaint rate suggests false negatives. Target: <0.1%.`}
          color={(summaryRow?.complaint_rate_pct ?? 0) > 0.1 ? "red" : "green"}
        />
        <StatCard
          label={`Bounce Rate (${rangeLabel})`}
          value={`${(summaryRow?.bounce_rate_pct ?? 0).toFixed(2)}%`}
          sub={`${summaryRow?.bounced ?? 0} bounces of ${summaryRow?.total_feedback ?? 0} deliveries`}
          tooltip={`Percentage of delivered emails that bounced in the last ${rangeLabel}. High bounce rates suggest senders are using invalid recipient lists.`}
          color={
            (summaryRow?.bounce_rate_pct ?? 0) > 5
              ? "red"
              : (summaryRow?.bounce_rate_pct ?? 0) > 2
                ? "amber"
                : "green"
          }
        />
        <StatCard
          label={`Delivery Success (${rangeLabel})`}
          value={`${(summaryRow?.delivery_success_rate_pct ?? 0).toFixed(1)}%`}
          sub={`${summaryRow?.delivered ?? 0} delivered`}
          tooltip={`Percentage of allowed emails successfully delivered to the recipient's inbox in the last ${rangeLabel}.`}
          color={
            (summaryRow?.delivery_success_rate_pct ?? 0) > 90
              ? "green"
              : (summaryRow?.delivery_success_rate_pct ?? 0) > 70
                ? "amber"
                : "red"
          }
        />
      </div>

      
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Delivery Outcomes Over Time
          </div>
          <div className="group relative">
            <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center cursor-help text-[9px] text-white/30">
              ?
            </div>
            <div className="hidden group-hover:block absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 px-3 py-2 rounded-md bg-[rgba(22,23,26,0.98)] border border-white/[0.1] text-[11px] text-white/60 leading-relaxed shadow-lg">
              Breakdown of delivery feedback for allowed emails. Spikes in bounces or complaints indicate potential false negatives.
            </div>
          </div>
        </div>
        <div className="h-[250px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                  label={{
                    value: "Time",
                    position: "insideBottomRight",
                    offset: -5,
                    style: { fill: "rgba(255,255,255,0.2)", fontSize: 10 },
                  }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <Tooltip
                  itemSorter={(item) => -(STATUS_ORDER.indexOf(item.dataKey as string))}
                  contentStyle={{
                    background: "rgba(22,23,26,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#fff",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
                {statuses.map((status) => (
                  <Area
                    key={status}
                    type="monotone"
                    dataKey={status}
                    stroke={statusColors[status] ?? "#888"}
                    fill={statusColors[status] ?? "#888"}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-white/20">
              No delivery feedback yet  start the simulator to generate data
            </div>
          )}
        </div>
      </div>

      
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Suspected False Negatives
          </div>
          <div className="group relative">
            <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center cursor-help text-[9px] text-white/30">
              ?
            </div>
            <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-md bg-[rgba(22,23,26,0.98)] border border-white/[0.1] text-[11px] text-white/60 leading-relaxed shadow-lg">
              Accounts whose allowed emails have high bounce or complaint rates.
              These are potential false negatives  senders we should consider
              blocking. Only accounts with 5+ delivery events are shown.
            </div>
          </div>
        </div>
        {topProblems.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-[11px] uppercase">
                <th className="text-left py-1.5 font-medium">Account</th>
                <th className="text-right py-1.5 font-medium">Deliveries</th>
                <th className="text-right py-1.5 font-medium">Bounces</th>
                <th className="text-right py-1.5 font-medium">Complaints</th>
                <th className="text-right py-1.5 font-medium">Problem Rate</th>
              </tr>
            </thead>
            <tbody>
              {topProblems.map((a) => (
                <tr
                  key={a.sender_account_id}
                  className="border-t border-white/[0.04]"
                >
                  <td className="py-2 font-mono text-xs text-white/60">
                    {a.sender_account_id}
                  </td>
                  <td className="py-2 text-right font-mono text-white/40">
                    {a.total_feedback}
                  </td>
                  <td className="py-2 text-right font-mono text-[#FF9592]">
                    {a.bounces}
                  </td>
                  <td className="py-2 text-right font-mono text-[#FFCA16]">
                    {a.complaints}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        a.problem_rate_pct > 20
                          ? "bg-[rgba(255,23,63,0.18)] text-[#FF9592]"
                          : a.problem_rate_pct > 5
                            ? "bg-[rgba(250,130,0,0.13)] text-[#FFCA16]"
                            : "text-white/40"
                      }`}
                    >
                      {a.problem_rate_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-6 text-center text-sm text-white/20">
            No accounts with problematic delivery patterns detected
          </div>
        )}
      </div>

    </div>
  );
}
