import useSWR from "swr";
import { useAutoRefresh } from "./use-autorefresh";
import { setRateLimited } from "@/components/rate-limit-banner";

interface TinybirdResponse<T> {
  data: T[];
  rows: number;
}

class TinybirdError extends Error {
  status: number;
  constructor(status: number) {
    super(`Failed to fetch: ${status}`);
    this.status = status;
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new TinybirdError(res.status);
  setRateLimited(false);
  return res.json();
};

export function useTinybird<T = Record<string, unknown>>(
  pipe: string,
  params?: Record<string, string | number>,
  refreshInterval = 15_000,
) {
  const { enabled: autoRefresh } = useAutoRefresh();

  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  const url = `/api/tinybird/${pipe}${query ? `?${query}` : ""}`;

  const result = useSWR<TinybirdResponse<T>>(url, fetcher, {
    refreshInterval: autoRefresh ? refreshInterval : 0,
    revalidateOnFocus: false,
    onError: (err) => {
      if (err instanceof TinybirdError && err.status === 429) {
        setRateLimited(true);
      }
    },
  });

  const isRateLimited =
    result.error instanceof TinybirdError && result.error.status === 429;

  return { ...result, isRateLimited };
}
