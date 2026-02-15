"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useAutoRefresh } from "@/hooks/use-autorefresh";
import { AutoRefreshToggle } from "@/components/auto-refresh-toggle";
import { formatTimestamp } from "@/lib/format";
import {
  DASHBOARD_TIME_RANGES,
  getRangeStartTime,
} from "@/lib/time-range";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventRow {
  event_id: string;
  timestamp: string;
  sender_account_id: string;
  sender_email: string;
  sender_domain: string;
  recipient_email: string;
  content_subject: string;
  content_link_count: number;
  decision: string | null;
  rule_name: string | null;
  reason: string | null;
  delivery_status: string | null;
  delivery_detail: string | null;
}

const PAGE_SIZE = 50;

const TIME_RANGES = DASHBOARD_TIME_RANGES.map((range) => ({
  minutes: range.minutes,
  label: range.minutes === 0 ? "All time" : `Last ${range.label}`,
}));

const decisionColor: Record<string, string> = {
  block: "bg-[rgba(255,23,63,0.18)] text-[#FF9592]",
  flag: "bg-[rgba(250,130,0,0.13)] text-[#FFCA16]",
  allow: "bg-[rgba(34,255,153,0.12)] text-[rgba(70,254,165,0.83)]",
};

const deliveryColor: Record<string, string> = {
  delivered: "text-[rgba(70,254,165,0.83)]",
  bounced: "text-[#FF9592]",
  complained: "text-[#FFCA16]",
  opened: "text-[#70B8FF]",
  clicked: "text-[#A78BFA]",
};

export default function EventsPage() {
  const { enabled: autoRefresh } = useAutoRefresh();
  const [accountId, setAccountId] = useState("");
  const [domain, setDomain] = useState("");
  const [decision, setDecision] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [timeRange, setTimeRange] = useState(60);
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [appliedAccountId, setAppliedAccountId] = useState("");
  const [appliedDomain, setAppliedDomain] = useState("");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedAccountId) params.set("account_id", appliedAccountId);
    if (appliedDomain) params.set("domain", appliedDomain);
    if (decision) params.set("decision_filter", decision);
    if (deliveryStatus) params.set("delivery_status", deliveryStatus);
    if (timeRange > 0) {
      const start = getRangeStartTime(timeRange);
      params.set("start_time", start);
    }
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    return `/api/tinybird/event_explorer?${params}`;
  }, [appliedAccountId, appliedDomain, decision, deliveryStatus, timeRange, page]);

  const { data } = useSWR<{ data: EventRow[] }>(url, fetcher, {
    refreshInterval: autoRefresh ? 15_000 : 0,
  });

  const events = data?.data ?? [];

  const applyFilters = () => {
    setAppliedAccountId(accountId);
    setAppliedDomain(domain);
    setPage(0);
  };

  const clearFilters = () => {
    setAccountId("");
    setDomain("");
    setDecision("");
    setDeliveryStatus("");
    setAppliedAccountId("");
    setAppliedDomain("");
    setPage(0);
  };

  const inputClass =
    "bg-white/[0.06] border border-white/[0.08] rounded px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Events</h1>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-white/30 font-mono">
            Page {page + 1} - {events.length} results
          </div>
          <AutoRefreshToggle />
        </div>
      </div>

      
      <div className="flex gap-3 items-center flex-wrap">
        <input
          className={inputClass}
          placeholder="Account ID"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <input
          className={inputClass}
          placeholder="Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <select
          className={inputClass}
          value={decision}
          onChange={(e) => {
            setDecision(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All decisions</option>
          <option value="block">Blocked</option>
          <option value="flag">Flagged</option>
          <option value="allow">Allowed</option>
        </select>
        <select
          className={inputClass}
          value={deliveryStatus}
          onChange={(e) => {
            setDeliveryStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All delivery statuses</option>
          <option value="delivered">Delivered</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
          <option value="opened">Opened</option>
          <option value="clicked">Clicked</option>
        </select>
        <select
          className={inputClass}
          value={timeRange}
          onChange={(e) => {
            setTimeRange(Number(e.target.value));
            setPage(0);
          }}
        >
          {TIME_RANGES.map((r) => (
            <option key={r.minutes} value={r.minutes}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          className="px-3 py-1.5 rounded text-xs font-medium bg-white/10 hover:bg-white/15"
        >
          Search
        </button>
        <button
          onClick={clearFilters}
          className="text-xs text-white/40 hover:text-white/80"
        >
          Clear
        </button>
      </div>

      
      <div className="rounded-lg border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04]">
            <tr className="text-white/30 text-[11px] uppercase">
              <th className="text-left py-2 px-3 font-medium">Time</th>
              <th className="text-left py-2 px-3 font-medium">Account ID</th>
              <th className="text-left py-2 px-3 font-medium">Domain</th>
              <th className="text-left py-2 px-3 font-medium">Subject</th>
              <th className="text-left py-2 px-3 font-medium">Decision</th>
              <th className="text-left py-2 px-3 font-medium">Rule</th>
              <th className="text-left py-2 px-3 font-medium">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, index) => (
              <tr
                key={`${e.event_id}:${e.delivery_status ?? "none"}:${e.delivery_detail ?? "none"}:${index}`}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setSelectedEvent(e)}
              >
                <td className="py-2 px-3 font-mono text-xs text-white/50 whitespace-nowrap">
                  {formatTimestamp(e.timestamp)}
                </td>
                <td className="py-2 px-3 font-mono text-xs text-white/60 max-w-[120px] truncate">
                  {e.sender_account_id}
                </td>
                <td className="py-2 px-3 text-xs text-white/60">
                  {e.sender_domain}
                </td>
                <td className="py-2 px-3 text-xs text-white/80 max-w-[200px] truncate">
                  {e.content_subject}
                </td>
                <td className="py-2 px-3">
                  {e.decision && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${decisionColor[e.decision] ?? ""}`}
                    >
                      {e.decision}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-xs text-white/40">
                  {e.rule_name ?? "-"}
                </td>
                <td className="py-2 px-3">
                  {e.delivery_status ? (
                    <span
                      className={`text-xs font-mono ${deliveryColor[e.delivery_status] ?? "text-white/40"}`}
                    >
                      {e.delivery_status}
                    </span>
                  ) : (
                    <span className="text-xs text-white/20">-</span>
                  )}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-sm text-white/20"
                >
                  No events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 rounded text-xs font-medium bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-xs text-white/30 font-mono">
          Showing {page * PAGE_SIZE + 1}-{page * PAGE_SIZE + events.length}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={events.length < PAGE_SIZE}
          className="px-3 py-1.5 rounded text-xs font-medium bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[rgba(22,23,26,0.98)] border border-white/[0.08] rounded-lg w-[600px] max-h-[80vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Event Detail</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/40 hover:text-white"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              
              <div className="space-y-3">
                <div className="text-[11px] uppercase tracking-wider text-white/40">
                  Lifecycle
                </div>

                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#70B8FF] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium">Request Received</div>
                    <div className="text-[11px] text-white/40 font-mono">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </div>
                    <div className="text-[11px] text-white/30 mt-0.5">
                      From {selectedEvent.sender_email} to{" "}
                      {selectedEvent.recipient_email}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      selectedEvent.decision === "block"
                        ? "bg-[#FF9592]"
                        : selectedEvent.decision === "flag"
                          ? "bg-[#FFCA16]"
                          : "bg-[rgba(70,254,165,0.83)]"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-medium">
                      Decision:{" "}
                      <span
                        className={
                          selectedEvent.decision === "block"
                            ? "text-[#FF9592]"
                            : selectedEvent.decision === "flag"
                              ? "text-[#FFCA16]"
                              : "text-[rgba(70,254,165,0.83)]"
                        }
                      >
                        {selectedEvent.decision?.toUpperCase()}
                      </span>
                    </div>
                    {selectedEvent.rule_name && (
                      <div className="text-[11px] text-white/40">
                        Rule: {selectedEvent.rule_name}
                      </div>
                    )}
                    {selectedEvent.reason && (
                      <div className="text-[11px] text-white/30 mt-0.5 font-mono">
                        {selectedEvent.reason}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEvent.delivery_status && (
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        selectedEvent.delivery_status === "delivered"
                          ? "bg-[rgba(70,254,165,0.83)]"
                          : selectedEvent.delivery_status === "bounced"
                            ? "bg-[#FF9592]"
                            : selectedEvent.delivery_status === "complained"
                              ? "bg-[#FFCA16]"
                              : "bg-[#70B8FF]"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-medium">
                        Delivery:{" "}
                        <span
                          className={
                            deliveryColor[selectedEvent.delivery_status] ??
                            "text-white/40"
                          }
                        >
                          {selectedEvent.delivery_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/30">
                        {selectedEvent.delivery_detail}
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.decision !== "block" &&
                  !selectedEvent.delivery_status && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 flex-shrink-0" />
                      <div className="text-xs text-white/20">
                        Awaiting delivery feedback...
                      </div>
                    </div>
                  )}
              </div>

              
              <div className="border-t border-white/[0.06] pt-3">
                <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
                  Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-white/30">Event ID:</span>{" "}
                    <span className="font-mono text-white/50">
                      {selectedEvent.event_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/30">Account:</span>{" "}
                    <span className="font-mono text-white/50">
                      {selectedEvent.sender_account_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/30">Subject:</span>{" "}
                    <span className="text-white/60">
                      {selectedEvent.content_subject}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/30">Links:</span>{" "}
                    <span className="font-mono text-white/50">
                      {selectedEvent.content_link_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
