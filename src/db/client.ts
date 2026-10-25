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

const DEFAULT_AIVEN_CA = `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUXulKLwU7S3Misezv3LdhM1Z/go4wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvODNiNmIyMjktYTFmZi00ZjUzLWI3MTEtYjQzZjc2ZGEy
ZjBmIFByb2plY3QgQ0EwHhcNMjYwODA3MDUwMzI0WhcNMzYwODA0MDUwMzI0WjA6
MTgwNgYDVQQDDC84M2I2YjIyOS1hMWZmLTRmNTMtYjcxMS1iNDNmNzZkYTJmMGYg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAMEiLoeM
o+dCmjrrJyBXmWvIbVG3HXm7m6zcEvqwtCPpOFYW21ddZ+vA2pqRgMZuuoDmG425
Daz2l2zIvKK7LqVSQQvwrIF1xClWSgTe046ba7Ul+FCcPga0/zBBgdrKRRM2Xb+C
XI42pznxI13Tu/0jMj1cYu4A/OaFzMZIA4qhVBHHczjJU3I5UpjeMWTALvFUOAtD
lbQ7Fa++ZE39hqkxaKYlW2L9Cc0JOWgsSZEwWExEhRuxIqiKhMUU9vjH138sUB25
8QQpW4yX6odsNsXS47Y6jzGvPX0WrSGO19u/XFB9o4pXxGyilkZEAWHavw0mmoVC
etonuFebt+V4H502U3sb6k7Uopupr2KV+/fhQtE+yGwT+ZCj66qxnc6nQ6ao3v3u
8v7KEnxQgRPebWplAkEUd/JNEISuG+USVdfmbdIULzuioj/L1XeGqYLQ8vfDg04o
ou83NMlHofF/qULoH0fMsmkQODq6GSxjk2VzYb/+1e44jqYD9urYCGzv8QIDAQAB
o0IwQDAdBgNVHQ4EFgQU8nNXnO9q3wm1W3SoT/TTt94m87kwEgYDVR0TAQH/BAgw
BgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAL9fwnXqzP7b
i033nXtu9DN3+PdK80F2JTq7AnpUfEsaEkjLuYHIpgJYH30FZRn4S0GK2KJ3fW1z
n84fp70HdpoHRHmwcc2WlUYcHvX+MvVSHI9BQcvVF/cfynEt10MXdv5xnvATGYAp
qrm3ekl4ueuq8+02arHeASEfJDHNpyMjbHfjbL7PlxHtvsCNx6npOkl+3yRdJdLq
lJ08wJBlKExIWZku8YzOq7wjNRihcetVRgEsP3/FFwtnD/U81vvcY69Kf9Lu0El0
E7pMgm71ewXdMaD3DGqySTfu3aGoqcDK/U4q/WD3zUv4aqSXeVkBOTqa8KFR8jGP
/PCk+d4aItaNH0zIfHyYBmJOqQxZf5EV08Afs2WE9CHJIL0OlnbFVGiQk+Q6RwZP
NrMbfk6X97wAoNG2iXL58NvaGFBb6FTMCu2oy5qdofSiomUeWjNoVGeDS2cVu6/a
Mc/6uclDjEnRPi89SILhJEF7QrWBEd8T5QP/V1Bskah1Mg0guzpTgg==
-----END CERTIFICATE-----`;

function getSslConfig() {
  if (process.env.DATABASE_SSL === "false") return undefined;

  const inlineCa = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  const caPath =
    process.env.DATABASE_SSL_CA_PATH ??
    path.join(process.cwd(), "certs", "aiven-project-ca.pem");
  const fileCa = fs.existsSync(/* turbopackIgnore: true */ caPath)
    ? fs.readFileSync(/* turbopackIgnore: true */ caPath, "utf8")
    : undefined;

  const ca = inlineCa ?? fileCa ?? DEFAULT_AIVEN_CA;

  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== undefined
      ? process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false"
      : Boolean(ca);

  return {
    rejectUnauthorized,
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
