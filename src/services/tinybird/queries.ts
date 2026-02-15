import { tinybird } from "./client";
export function getAccountEventCount(
  accountId: string,
  windowSeconds: number,
) {
  return tinybird.query<{ event_count: number }>("account_event_count", {
    account_id: accountId,
    window_seconds: windowSeconds,
  });
}
