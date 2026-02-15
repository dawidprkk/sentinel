"use client";

import { useTinybird } from "@/hooks/use-tinybird";
import { formatTimestamp } from "@/lib/format";
import { getRangeLabel } from "@/lib/time-range";

interface BlockedAccount {
  sender_account_id: string;
  sender_domain: string;
  block_count: number;
  triggered_rules: string[];
  last_blocked_at: string;
}

interface Props {
  startTime: string;
  timeRange: number;
}

export function TopBlockedAccounts({ startTime, timeRange }: Props) {
  const { data } = useTinybird<BlockedAccount>(
    "top_blocked_accounts",
    { start_time: startTime },
    15_000,
  );

  const accounts = data?.data ?? [];
  const rangeLabel = getRangeLabel(timeRange);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
        Top Blocked Accounts ({rangeLabel})
      </div>
      {accounts.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-[11px] uppercase">
              <th className="text-left py-1.5 font-medium">Account</th>
              <th className="text-left py-1.5 font-medium">Domain</th>
              <th className="text-right py-1.5 font-medium">Blocks</th>
              <th className="text-right py-1.5 font-medium">Last Blocked</th>
            </tr>
          </thead>
          <tbody>
            {accounts.slice(0, 10).map((a) => (
              <tr
                key={`${a.sender_account_id}:${a.sender_domain}`}
                className="border-t border-white/[0.04]"
              >
                <td className="py-2 font-mono text-xs text-white/60">
                  {a.sender_account_id}
                </td>
                <td className="py-2 text-white/60">{a.sender_domain}</td>
                <td className="py-2 text-right font-mono text-[#FF9592]">
                  {a.block_count}
                </td>
                <td className="py-2 text-right text-white/30 text-xs font-mono">
                  {formatTimestamp(a.last_blocked_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="py-6 text-center text-sm text-white/20">
          No blocked accounts
        </div>
      )}
    </div>
  );
}
