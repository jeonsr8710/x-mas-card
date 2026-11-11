import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return "";
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

const dbUrl = readEnvDatabaseUrl();
const isPostgres =
  process.env.VERCEL === "1" ||
  dbUrl.startsWith("postgres://") ||
  dbUrl.startsWith("postgresql://");

const srcSchema = path.join(
  root,
  "prisma",
  isPostgres ? "schema.postgres.prisma" : "schema.sqlite.prisma"
);
const destSchema = path.join(root, "prisma", "schema.prisma");

fs.copyFileSync(srcSchema, destSchema);
console.log(
  `[prepare-prisma] Using ${isPostgres ? "PostgreSQL" : "SQLite"} schema -> prisma/schema.prisma`
);
