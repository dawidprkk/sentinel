"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTinybird } from "@/hooks/use-tinybird";
import { formatTimestamp } from "@/lib/format";

interface PivotedBucket {
  bucket: string;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
}

const STATUS_KEYS = ["delivered", "bounced", "complained", "opened", "clicked"] as const;

const STATUS_COLORS: Record<string, string> = {
  delivered: "rgba(70,254,165,0.83)",
  bounced: "#FF9592",
  complained: "#FFCA16",
  opened: "#70B8FF",
  clicked: "#A78BFA",
};

interface Props {
  startTime: string;
}

export function DeliveryOutcomesChart({ startTime }: Props) {
  const { data } = useTinybird<PivotedBucket>(
    "delivery_outcomes_pivoted",
    { start_time: startTime },
    15_000,
  );

  const rows = data?.data ?? [];
  const chartData = rows
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
  const activeStatuses = STATUS_KEYS.filter((s) =>
    rows.some((r) => r[s] > 0),
  );

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
        Delivery Outcomes (10s buckets)
      </div>
      <div className="h-[200px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                contentStyle={{
                  background: "rgba(22,23,26,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#fff",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
              />
              {activeStatuses.map((status) => (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="a"
                  fill={STATUS_COLORS[status] ?? "#888"}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-white/20">
            No delivery data yet
          </div>
        )}
      </div>
    </div>
  );
}
