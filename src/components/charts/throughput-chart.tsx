"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTinybird } from "@/hooks/use-tinybird";
import { formatTimestamp } from "@/lib/format";

interface Bucket {
  bucket: string;
  request_count: number;
}

interface Props {
  startTime: string;
}

export function ThroughputChart({ startTime }: Props) {
  const { data } = useTinybird<Bucket>(
    "requests_per_10s",
    { start_time: startTime },
    15_000,
  );

  const chartData = (data?.data ?? [])
    .slice()
    .reverse()
    .map((d) => ({
      time: formatTimestamp(d.bucket),
      count: d.request_count,
    }));

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
        Request Throughput (10s buckets)
      </div>
      <div className="h-[200px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#70B8FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#70B8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="count"
                stroke="#70B8FF"
                fill="url(#colorCount)"
                strokeWidth={1.5}
              />
            </AreaChart>
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
