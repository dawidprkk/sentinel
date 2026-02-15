export const DASHBOARD_TIME_RANGES = [
  { label: "15 min", minutes: 15 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "All time", minutes: 0 },
] as const;

const RANGE_LABELS: Record<number, string> = {
  15: "15 min",
  60: "1 hour",
  180: "3 hours",
  0: "all time",
};

export function getRangeLabel(timeRange: number): string {
  return RANGE_LABELS[timeRange] ?? `${timeRange} min`;
}

export function getRangeStartTime(timeRange: number): string {
  if (timeRange === 0) return new Date(0).toISOString();
  return new Date(Date.now() - timeRange * 60_000).toISOString();
}
