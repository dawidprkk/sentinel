import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/services/db";
import { randomUUID } from "crypto";
import { z } from "zod/v4";
import { RuleConditionSchema } from "@/schemas/rule";

const CreateRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(["active", "disabled"]).default("active"),
  conditions: z.array(RuleConditionSchema).min(1),
  logic: z.enum(["AND", "OR"]).default("AND"),
  action: z.enum(["block", "flag"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

export async function GET() {
  const rows = await db.select().from(schema.rules);
  const rules = rows.map((r) => ({
    ...r,
    conditions: JSON.parse(r.conditions),
  }));
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const result = CreateRuleSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid rule", issues: result.error.issues },
        { status: 400 },
      );
    }

    const rule = {
      id: `rule_${randomUUID().slice(0, 8)}`,
      ...result.data,
      conditions: JSON.stringify(result.data.conditions),
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.rules).values(rule);

    return NextResponse.json(
      { ...rule, conditions: result.data.conditions },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create rule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
