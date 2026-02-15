import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { rules } from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "./sentinel.db");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });

const defaultRules = [
  {
    id: "rule_phishing",
    name: "Phishing detection",
    description:
      "Blocks emails with phishing signals - subject contains verification language",
    status: "active" as const,
    conditions: JSON.stringify([
      {
        field: "content.subject",
        operator: "contains",
        value: "verify your account",
      },
    ]),
    logic: "AND" as const,
    action: "block" as const,
    severity: "critical" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rule_volume_spike",
    name: "Volume spike",
    description:
      "Blocks high-volume senders except known high-throughput domains",
    status: "active" as const,
    conditions: JSON.stringify([
      {
        field: "sender.accountId",
        operator: "rate_exceeds",
        value: 2,
        window: "1m",
      },
      {
        field: "sender.domain",
        operator: "neq",
        value: "promo.bigstore.com",
      },
      {
        field: "sender.domain",
        operator: "neq",
        value: "launch.techstartup.io",
      },
    ]),
    logic: "AND" as const,
    action: "block" as const,
    severity: "high" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rule_domain_spoofing",
    name: "Domain spoofing",
    description: "Blocks emails from domains that mimic well-known brands",
    status: "active" as const,
    conditions: JSON.stringify([
      {
        field: "sender.domain",
        operator: "matches",
        value: "(paypa[l1]|arnazon|g00gle|micr0soft)",
      },
    ]),
    logic: "AND" as const,
    action: "block" as const,
    severity: "critical" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rule_suspicious_links",
    name: "Suspicious links",
    description: "Flags emails with many links but very short body content",
    status: "active" as const,
    conditions: JSON.stringify([
      { field: "content.linkCount", operator: "gt", value: 5 },
      { field: "content.bodyLengthBytes", operator: "lt", value: 500 },
    ]),
    logic: "AND" as const,
    action: "flag" as const,
    severity: "medium" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rule_credential_harvesting",
    name: "Credential harvesting",
    description: "Blocks emails with credential harvesting signals",
    status: "active" as const,
    conditions: JSON.stringify([
      { field: "content.subject", operator: "contains", value: "login" },
      {
        field: "content.suspiciousKeywords",
        operator: "contains",
        value: "credential",
      },
    ]),
    logic: "OR" as const,
    action: "block" as const,
    severity: "high" as const,
    createdAt: new Date().toISOString(),
  },
];

for (const rule of defaultRules) {
  db.insert(rules).values(rule).onConflictDoNothing().run();
}
console.log(`Seeded ${defaultRules.length} default rules`);

sqlite.close();
