import { describe, it, expect, vi, beforeEach } from "vitest";
import { TinybirdClient } from "../client";

describe("TinybirdClient", () => {
  let client: TinybirdClient;

  beforeEach(() => {
    client = new TinybirdClient("https://api.tinybird.co", "test-token");
  });

  it("sends NDJSON to ingest endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ successful_rows: 1 }),
    });
    global.fetch = mockFetch;

    await client.ingest("send_requests", [{ eventId: "1" }]);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.tinybird.co/v0/events?name=send_requests",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/x-ndjson",
        }),
      }),
    );
  });

  it("queries pipe endpoint with params", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ count: 42 }], rows: 1 }),
    });

    const result = await client.query("requests_per_10s", { limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("requests_per_10s.json"),
      expect.any(Object),
    );
  });

  it("throws on non-OK ingest response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request"),
    });

    await expect(client.ingest("x", [{}])).rejects.toThrow(
      "Tinybird ingest failed",
    );
  });

  it("throws on non-OK query response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    await expect(client.query("missing_pipe")).rejects.toThrow(
      "Tinybird query failed",
    );
  });
});
