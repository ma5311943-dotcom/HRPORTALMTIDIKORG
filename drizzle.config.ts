import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Add the Aiven MySQL connection string to .env.");
}

const url = new URL(databaseUrl);
const caPath =
  process.env.DATABASE_SSL_CA_PATH ??
  path.join(process.cwd(), "certs", "aiven-project-ca.pem");
const ca =
  process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n") ??
  (fs.existsSync(caPath) ? fs.readFileSync(caPath, "utf8") : undefined);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl:
      process.env.DATABASE_SSL === "false"
        ? undefined
        : {
            ca,
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          },
  },
  verbose: true,
  strict: true,
});
