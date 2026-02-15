"use client";

import { useTinybird } from "@/hooks/use-tinybird";
import { formatTimestamp } from "@/lib/format";
import { getRangeLabel } from "@/lib/time-range";

interface Threat {
  rule_name: string;
  block_count: number;
  last_blocked_at: string;
}

interface Props {
  startTime: string;
  timeRange: number;
}

export function ActiveThreatsTable({ startTime, timeRange }: Props) {
  const { data } = useTinybird<Threat>(
    "active_threats",
    { start_time: startTime },
    15_000,
  );

  const threats = data?.data ?? [];
  const rangeLabel = getRangeLabel(timeRange);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          Active Threats ({rangeLabel})
        </div>
        <div
          className="group relative"
        >
          <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center cursor-help text-[9px] text-white/30">
            ?
          </div>
          <div className="hidden group-hover:block absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 px-3 py-2 rounded-md bg-[rgba(22,23,26,0.98)] border border-white/[0.1] text-[11px] text-white/60 leading-relaxed shadow-lg">
            Rules that have blocked at least one event in the last {rangeLabel}. Shows how many events each rule blocked and when the last block occurred.
          </div>
        </div>
      </div>
      {threats.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-[11px] uppercase">
              <th className="text-left py-1.5 font-medium">Rule</th>
              <th className="text-right py-1.5 font-medium">Blocks</th>
              <th className="text-right py-1.5 font-medium">Last Blocked</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((t) => (
              <tr
                key={t.rule_name}
                className="border-t border-white/[0.04]"
              >
                <td className="py-2 text-white/80">{t.rule_name}</td>
                <td className="py-2 text-right font-mono text-[#FF9592]">
                  {t.block_count}
                </td>
                <td className="py-2 text-right text-white/30 text-xs font-mono">
                  {formatTimestamp(t.last_blocked_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="py-6 text-center text-sm text-white/20">
          No active threats
        </div>
      )}
    </div>
  );
}
