import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/services/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { RuleConditionSchema } from "@/schemas/rule";

const UpdateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  conditions: z.array(RuleConditionSchema).min(1).optional(),
  logic: z.enum(["AND", "OR"]).optional(),
  action: z.enum(["block", "flag"]).optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
});


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const raw = await request.json();
    const result = UpdateRuleSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid update", issues: result.error.issues },
        { status: 400 },
      );
    }

    const existing = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.description !== undefined)
      updates.description = result.data.description;
    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.conditions !== undefined)
      updates.conditions = JSON.stringify(result.data.conditions);
    if (result.data.logic !== undefined) updates.logic = result.data.logic;
    if (result.data.action !== undefined) updates.action = result.data.action;
    if (result.data.severity !== undefined)
      updates.severity = result.data.severity;

    await db
      .update(schema.rules)
      .set(updates)
      .where(eq(schema.rules.id, id));

    const updated = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id));
    return NextResponse.json({
      ...updated[0],
      conditions: JSON.parse(updated[0].conditions),
    });
  } catch (error) {
    console.error("Update rule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await db
    .select()
    .from(schema.rules)
    .where(eq(schema.rules.id, id));
  if (existing.length === 0) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  await db.delete(schema.rules).where(eq(schema.rules.id, id));
  return NextResponse.json({ deleted: true });
}
