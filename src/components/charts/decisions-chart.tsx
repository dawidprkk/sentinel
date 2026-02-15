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

interface Bucket {
  bucket: string;
  total_decisions: number;
  block_count: number;
  flag_count: number;
  allow_count: number;
}

interface Props {
  startTime: string;
}

export function DecisionsChart({ startTime }: Props) {
  const { data } = useTinybird<Bucket>(
    "blocks_per_10s",
    { start_time: startTime },
    15_000,
  );

  const chartData = (data?.data ?? [])
    .slice()
    .reverse()
    .map((d) => ({
      time: formatTimestamp(d.bucket),
      block: d.block_count,
      flag: d.flag_count,
      allow: d.allow_count,
    }));

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
        Decisions (10s buckets)
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
              <Bar
                dataKey="block"
                stackId="a"
                fill="#FF9592"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="flag"
                stackId="a"
                fill="#FFCA16"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="allow"
                stackId="a"
                fill="rgba(70,254,165,0.83)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-white/20">
            No data yet - start the simulator
          </div>
        )}
      </div>
    </div>
  );
}
