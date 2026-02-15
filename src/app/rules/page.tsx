"use client";

import { useState } from "react";
import { useRules, createRule, updateRule, deleteRule } from "@/hooks/use-rules";
import { RuleForm } from "@/components/rule-form";
import type { Rule, RuleCondition } from "@/schemas/rule";

const severityColor: Record<string, string> = {
  critical: "bg-[rgba(255,23,63,0.18)] text-[#FF9592]",
  high: "bg-[rgba(250,130,0,0.13)] text-[#FFCA16]",
  medium: "bg-[rgba(0,119,255,0.23)] text-[#70B8FF]",
  low: "bg-white/[0.06] text-white/50",
};

const actionColor: Record<string, string> = {
  block: "bg-[rgba(255,23,63,0.18)] text-[#FF9592]",
  flag: "bg-[rgba(250,130,0,0.13)] text-[#FFCA16]",
};

export default function RulesPage() {
  const { data: rules, mutate } = useRules();
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const handleCreate = async (data: Omit<Rule, "id" | "createdAt">) => {
    await createRule(data);
    mutate();
    setShowCreate(false);
  };

  const handleUpdate = async (data: Omit<Rule, "id" | "createdAt">) => {
    if (!editingRule) return;
    await updateRule(editingRule.id, data);
    mutate();
    setEditingRule(null);
  };

  const handleToggle = async (rule: Rule) => {
    await updateRule(rule.id, {
      status: rule.status === "active" ? "disabled" : "active",
    });
    mutate();
  };

  const handleDelete = async (id: string) => {
    await deleteRule(id);
    mutate();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Rules</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded text-xs font-medium bg-white/10 hover:bg-white/15"
        >
          + Create Rule
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
          <div className="text-sm font-medium mb-3">New Rule</div>
          <RuleForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {editingRule && (
        <div className="rounded-lg border border-[rgba(0,119,255,0.23)] bg-white/[0.04] p-4">
          <div className="text-sm font-medium mb-3">
            Edit: {editingRule.name}
          </div>
          <RuleForm
            onSubmit={handleUpdate}
            onCancel={() => setEditingRule(null)}
            initial={{
              name: editingRule.name,
              description: editingRule.description,
              status: editingRule.status,
              conditions: editingRule.conditions,
              logic: editingRule.logic,
              action: editingRule.action,
              severity: editingRule.severity,
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {(rules ?? []).map((rule) => (
          <div
            key={rule.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{rule.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${actionColor[rule.action] ?? ""}`}
                  >
                    {rule.action}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${severityColor[rule.severity] ?? ""}`}
                  >
                    {rule.severity}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      rule.status === "active"
                        ? "bg-[rgba(34,255,153,0.12)] text-[rgba(70,254,165,0.83)]"
                        : "bg-white/[0.06] text-white/30"
                    }`}
                  >
                    {rule.status}
                  </span>
                </div>
                {rule.description && (
                  <div className="text-xs text-white/40 mb-2">
                    {rule.description}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {rule.conditions.map((c: RuleCondition, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono bg-white/[0.06] rounded px-2 py-1 text-white/50"
                    >
                      {c.field} {c.operator} &quot;{String(c.value)}&quot;
                      {c.window ? ` (${c.window})` : ""}
                    </span>
                  ))}
                  {rule.conditions.length > 1 && (
                    <span className="text-[11px] text-white/30 self-center">
                      ({rule.logic})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => handleToggle(rule)}
                  className="text-xs px-2 py-1 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                >
                  {rule.status === "active" ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => setEditingRule(rule)}
                  className="text-xs px-2 py-1 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-xs px-2 py-1 rounded text-white/40 hover:text-[#FF9592] hover:bg-[rgba(255,23,63,0.08)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {rules?.length === 0 && (
          <div className="text-center py-12 text-sm text-white/20">
            No rules configured. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
