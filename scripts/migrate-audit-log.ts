import "dotenv/config";
import { getPool } from "../src/db/client";

async function main() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id VARCHAR(64) PRIMARY KEY,
      actor_id VARCHAR(64) NOT NULL,
      actor_name VARCHAR(191) NOT NULL,
      actor_role VARCHAR(128) NOT NULL,
      actor_district VARCHAR(100),
      action VARCHAR(64) NOT NULL,
      entity_type VARCHAR(32) NOT NULL,
      entity_id VARCHAR(64),
      detail VARCHAR(500),
      created_at VARCHAR(30) NOT NULL,
      INDEX audit_log_created_idx (created_at),
      INDEX audit_log_action_idx (action),
      INDEX audit_log_district_idx (actor_district)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("audit_log table ready");
  await pool.end().catch(() => undefined);
}

main().catch((error) => {
  console.error("MIGRATION FAILED:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
