import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as pgSchema from "./schema.pg";
import * as sqliteSchema from "./schema.sqlite";

export type DbDialect = "pg" | "sqlite";

export function getDbDialect(): DbDialect {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return url.startsWith("postgres://") || url.startsWith("postgresql://") ? "pg" : "sqlite";
}

type DbHandle =
  | {
      dialect: "pg";
      db: NodePgDatabase<typeof pgSchema>;
      pool: Pool;
      schema: typeof pgSchema;
    }
  | {
      dialect: "sqlite";
      db: LibSQLDatabase<typeof sqliteSchema>;
      client: Client;
      schema: typeof sqliteSchema;
    };

let cachedHandle: DbHandle | null = null;

export function getDbHandle(): DbHandle {
  if (cachedHandle) {
    return cachedHandle;
  }

  const dialect = getDbDialect();
  if (dialect === "pg") {
    const connectionString =
      process.env.DATABASE_URL_POOLED?.trim() || process.env.DATABASE_URL?.trim() || "";
    const pool = new Pool({ connectionString });
    attachDatabasePool(pool);
    const db = drizzlePg(pool, { schema: pgSchema });
    cachedHandle = { dialect: "pg", db, pool, schema: pgSchema };
    return cachedHandle;
  }

  const rawUrl = process.env.DATABASE_URL?.trim() || "file:./data/meucupom.db";
  if (rawUrl === "file:./data/meucupom.db") {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  const client = createClient({
    url: rawUrl,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  });
  const db = drizzleLibsql(client, { schema: sqliteSchema });
  cachedHandle = { dialect: "sqlite", db, client, schema: sqliteSchema };
  return cachedHandle;
}
