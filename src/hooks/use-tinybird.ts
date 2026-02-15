import useSWR from "swr";
import { useAutoRefresh } from "./use-autorefresh";

interface TinybirdResponse<T> {
  data: T[];
  rows: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
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

  return useSWR<TinybirdResponse<T>>(url, fetcher, {
    refreshInterval: autoRefresh ? refreshInterval : 0,
    revalidateOnFocus: false,
  });
}
