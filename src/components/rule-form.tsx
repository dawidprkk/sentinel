"use client";

import { useState } from "react";
import type { RuleCondition } from "@/schemas/rule";

interface RuleFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    status: "active" | "disabled";
    conditions: RuleCondition[];
    logic: "AND" | "OR";
    action: "block" | "flag";
    severity: "critical" | "high" | "medium" | "low";
  }) => void;
  onCancel: () => void;
  initial?: {
    name: string;
    description: string;
    status: "active" | "disabled";
    conditions: RuleCondition[];
    logic: "AND" | "OR";
    action: "block" | "flag";
    severity: "critical" | "high" | "medium" | "low";
  };
}

const OPERATORS = [
  "eq",
  "neq",
  "gt",
  "lt",
  "contains",
  "matches",
  "rate_exceeds",
] as const;
const RATE_WINDOWS = ["10s", "30s", "1m", "5m", "15m", "1h"] as const;
const FIELDS = [
  "sender.accountId",
  "sender.email",
  "sender.domain",
  "sender.ip",
  "recipient.email",
  "recipient.domain",
  "content.subject",
  "content.hasLinks",
  "content.linkCount",
  "content.hasAttachments",
  "content.bodyLengthBytes",
  "content.suspiciousKeywords",
  "metadata.region",
] as const;

function emptyCondition(): RuleCondition {
  return { field: "sender.domain", operator: "eq", value: "" };
}

function isNumericOperator(operator: RuleCondition["operator"]): boolean {
  return operator === "gt" || operator === "lt" || operator === "rate_exceeds";
}

export function RuleForm({ onSubmit, onCancel, initial }: RuleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<"active" | "disabled">(
    initial?.status ?? "active",
  );
  const [conditions, setConditions] = useState<RuleCondition[]>(
    initial?.conditions ?? [emptyCondition()],
  );
  const [logic, setLogic] = useState<"AND" | "OR">(initial?.logic ?? "AND");
  const [action, setAction] = useState<"block" | "flag">(
    initial?.action ?? "block",
  );
  const [severity, setSeverity] = useState<"critical" | "high" | "medium" | "low">(
    initial?.severity ?? "high",
  );

  const inputClass =
    "w-full bg-white/[0.06] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20";
  const selectClass =
    "bg-white/[0.06] border border-white/[0.08] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Name
          </label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Description
          </label>
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this rule do?"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Action
          </label>
          <select
            className={selectClass}
            value={action}
            onChange={(e) => setAction(e.target.value as "block" | "flag")}
          >
            <option value="block">Block</option>
            <option value="flag">Flag</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Severity
          </label>
          <select
            className={selectClass}
            value={severity}
            onChange={(e) =>
              setSeverity(
                e.target.value as "critical" | "high" | "medium" | "low",
              )
            }
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Logic
          </label>
          <select
            className={selectClass}
            value={logic}
            onChange={(e) => setLogic(e.target.value as "AND" | "OR")}
          >
            <option value="AND">AND (all match)</option>
            <option value="OR">OR (any match)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
            Status
          </label>
          <select
            className={selectClass}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "active" | "disabled")
            }
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] uppercase tracking-wider text-white/40">
            Conditions
          </label>
          <button
            onClick={() => setConditions([...conditions, emptyCondition()])}
            className="text-xs text-[#70B8FF] hover:text-[#70B8FF]/80"
          >
            + Add condition
          </button>
        </div>
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                className={`${selectClass} flex-1`}
                value={c.field}
                onChange={(e) => {
                  const updated = [...conditions];
                  updated[i] = { ...c, field: e.target.value };
                  setConditions(updated);
                }}
              >
                {FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                value={c.operator}
                onChange={(e) => {
                  const nextOperator = e.target.value as RuleCondition["operator"];
                  const updated = [...conditions];
                  const next: RuleCondition = {
                    ...c,
                    operator: nextOperator,
                  };
                  if (nextOperator === "rate_exceeds") {
                    next.field = "sender.accountId";
                    next.window = c.window ?? "1m";
                    next.value =
                      typeof c.value === "number" && c.value > 0 ? c.value : 1;
                  } else {
                    delete next.window;
                  }
                  updated[i] = {
                    ...next,
                  };
                  setConditions(updated);
                }}
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                className={`${inputClass} flex-1`}
                type={isNumericOperator(c.operator) ? "number" : "text"}
                min={c.operator === "rate_exceeds" ? 1 : undefined}
                step={isNumericOperator(c.operator) ? "1" : undefined}
                value={String(c.value)}
                onChange={(e) => {
                  const updated = [...conditions];
                  const val = isNumericOperator(c.operator)
                    ? Number(e.target.value)
                    : e.target.value;
                  updated[i] = { ...c, value: val };
                  setConditions(updated);
                }}
                placeholder="Value"
              />
              {c.operator === "rate_exceeds" && (
                <select
                  className={`${selectClass} w-24`}
                  value={c.window ?? "1m"}
                  onChange={(e) => {
                    const updated = [...conditions];
                    updated[i] = { ...c, window: e.target.value };
                    setConditions(updated);
                  }}
                >
                  {RATE_WINDOWS.map((window) => (
                    <option key={window} value={window}>
                      {window}
                    </option>
                  ))}
                </select>
              )}
              {conditions.length > 1 && (
                <button
                  onClick={() =>
                    setConditions(conditions.filter((_, j) => j !== i))
                  }
                  className="text-white/30 hover:text-[#FF9592] px-1 py-2 text-sm"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() =>
            onSubmit({ name, description, status, conditions, logic, action, severity })
          }
          disabled={
            !name ||
            conditions.some((c) => {
              if (!c.field || !c.operator) return true;
              if (c.operator === "rate_exceeds") {
                return (
                  typeof c.value !== "number" ||
                  !Number.isFinite(c.value) ||
                  c.value <= 0 ||
                  !/^(\d+)(s|m|h)$/.test(c.window ?? "")
                );
              }
              return !c.value && c.value !== 0;
            })
          }
          className="px-4 py-2 rounded text-sm font-medium bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save Rule
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded text-sm text-white/50 hover:text-white/80"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
