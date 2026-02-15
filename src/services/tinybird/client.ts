const TINYBIRD_API_URL =
  process.env.TINYBIRD_API_URL || "https://api.tinybird.co";
const TINYBIRD_ADMIN_TOKEN = process.env.TINYBIRD_ADMIN_TOKEN || "";

export class TinybirdClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl = TINYBIRD_API_URL, token = TINYBIRD_ADMIN_TOKEN) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async ingest(datasource: string, events: Record<string, unknown>[]) {
    const ndjson = events.map((e) => JSON.stringify(e)).join("\n");
    const res = await fetch(
      `${this.baseUrl}/v0/events?name=${datasource}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/x-ndjson",
        },
        body: ndjson,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tinybird ingest failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  async query<T = Record<string, unknown>>(
    pipeName: string,
    params: Record<string, string | number> = {},
  ): Promise<{ data: T[]; rows: number }> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }
    const url = `${this.baseUrl}/v0/pipes/${pipeName}.json?${searchParams}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tinybird query failed: ${res.status} ${text}`);
    }
    return res.json();
  }
}

export const tinybird = new TinybirdClient();
