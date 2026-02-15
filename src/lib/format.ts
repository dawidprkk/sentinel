
function parseTinybirdTimestamp(ts: string): Date {
  if (ts && !ts.includes("T")) {
    return new Date(ts.replace(" ", "T") + "Z");
  }
  return new Date(ts);
}

export function formatTimestamp(ts: string): string {
  const d = parseTinybirdTimestamp(ts);
  if (isNaN(d.getTime())) return ts;
  const date = d.toLocaleDateString("en-CA");
  const time = d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${date} ${time}`;
}
