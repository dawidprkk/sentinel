import { NextRequest, NextResponse } from "next/server";
import { tinybird } from "@/services/tinybird/client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

function toTinybirdDateTime(isoString: string): string {
  return dayjs.utc(isoString).format("YYYY-MM-DD HH:mm:ss.SSS");
}
const DATETIME_PARAMS = new Set(["start_time", "end_time"]);

const ALLOWED_PIPES = new Set([
  "requests_per_10s",
  "blocks_per_10s",
  "active_threats",
  "top_blocked_accounts",
  "quality_summary",
  "problem_accounts_top",
  "event_explorer",
  "account_event_count",
  "overview_summary",
  "delivery_outcomes_pivoted",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipe: string }> },
) {
  const { pipe } = await params;

  if (!ALLOWED_PIPES.has(pipe)) {
    return NextResponse.json({ error: "Unknown pipe" }, { status: 404 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const queryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (DATETIME_PARAMS.has(key) && value) {
      queryParams[key] = toTinybirdDateTime(value);
    } else {
      queryParams[key] = value;
    }
  }

  try {
    const result = await tinybird.query(pipe, queryParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Tinybird query error [${pipe}]:`, error);
    const message =
      error instanceof Error ? error.message : "Tinybird query failed";
    const isRateLimit = message.includes("daily request limit exceeded");
    return NextResponse.json(
      { error: isRateLimit ? "rate_limit" : "Tinybird query failed" },
      { status: isRateLimit ? 429 : 502 },
    );
  }
}
