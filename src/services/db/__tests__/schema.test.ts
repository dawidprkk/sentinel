import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { rules } from "../schema";

describe("Database schema", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(":memory:");
    db = drizzle(sqlite);
    migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterAll(() => {
    sqlite.close();
  });

  it("can insert and query a rule", () => {
    db.insert(rules)
      .values({
        id: "rule_1",
        name: "Test rule",
        description: "A test",
        status: "active",
        conditions: JSON.stringify([
          { field: "content.subject", operator: "contains", value: "test" },
        ]),
        logic: "AND",
        action: "block",
        severity: "high",
        createdAt: new Date().toISOString(),
      })
      .run();
    const result = db.select().from(rules).all();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test rule");
  });
});
