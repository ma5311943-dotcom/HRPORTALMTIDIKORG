const mysql = require('mysql2/promise');
(async () => {
  const u = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '') || undefined,
    ssl: { rejectUnauthorized: true },
    connectTimeout: 15000,
  });
  const [rows] = await conn.query('SELECT DATABASE() AS db, VERSION() AS version, 1 AS ok');
  console.log(JSON.stringify(rows[0]));
  await conn.end();
})().catch((e) => { console.error('DB_ERROR:', e.code || e.message); process.exit(1); });
