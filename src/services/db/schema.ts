import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rules = sqliteTable("rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["active", "disabled"] })
    .notNull()
    .default("active"),
  conditions: text("conditions").notNull(),
  logic: text("logic", { enum: ["AND", "OR"] }).notNull().default("AND"),
  action: text("action", { enum: ["block", "flag"] }).notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] })
    .notNull(),
  createdAt: text("created_at").notNull(),
});

