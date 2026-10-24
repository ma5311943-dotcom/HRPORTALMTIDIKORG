import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

type DatabaseClient = ReturnType<typeof createDatabase>["db"];

const globalForDb = globalThis as unknown as {
  hrPool?: mysql.Pool;
  hrDb?: DatabaseClient;
};

function getSslConfig() {
  if (process.env.DATABASE_SSL === "false") return undefined;

  const inlineCa = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  const caPath =
    process.env.DATABASE_SSL_CA_PATH ??
    path.join(process.cwd(), "certs", "aiven-project-ca.pem");
  const ca =
    inlineCa ??
    (fs.existsSync(/* turbopackIgnore: true */ caPath)
      ? fs.readFileSync(/* turbopackIgnore: true */ caPath, "utf8")
      : undefined);

  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    ...(ca ? { ca } : {}),
  };
}

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Add the Aiven MySQL connection string to .env."
    );
  }

  const url = new URL(connectionString);
  const database = url.pathname.replace(/^\//, "") || undefined;

  const pool = mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    connectTimeout: 15000,
    ssl: getSslConfig(),
  });

  const db = drizzle(pool, { schema, mode: "default" });
  return { db, pool };
}

function ensureDatabase() {
  if (!globalForDb.hrDb || !globalForDb.hrPool) {
    const created = createDatabase();
    globalForDb.hrDb = created.db;
    globalForDb.hrPool = created.pool;
  }
  return { db: globalForDb.hrDb, pool: globalForDb.hrPool };
}

export function getDb(): DatabaseClient {
  return ensureDatabase().db;
}

export function getPool(): mysql.Pool {
  return ensureDatabase().pool;
}

export { schema };
