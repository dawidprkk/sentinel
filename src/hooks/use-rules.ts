import useSWR from "swr";
import type { Rule } from "@/schemas/rule";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRules() {
  return useSWR<Rule[]>("/api/rules", fetcher);
}

export async function createRule(
  data: Omit<Rule, "id" | "createdAt">,
): Promise<Rule> {
  const res = await fetch("/api/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create rule");
  return res.json();
}

export async function updateRule(
  id: string,
  data: Partial<Omit<Rule, "id" | "createdAt">>,
): Promise<Rule> {
  const res = await fetch(`/api/rules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update rule");
  return res.json();
}

export async function deleteRule(id: string): Promise<void> {
  const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete rule");
}
