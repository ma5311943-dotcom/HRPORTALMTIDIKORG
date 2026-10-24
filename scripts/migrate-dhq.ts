import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const cols = [
    { table: "candidates", col: "father_cnic", type: "varchar(15)" },
    { table: "candidates", col: "reference_code", type: "varchar(64)" },
    { table: "candidates", col: "applied_role", type: "varchar(64)" },
    { table: "candidates", col: "appointment_order_no", type: "varchar(100)" },
    { table: "candidates", col: "joining_order_no", type: "varchar(100)" },
    { table: "candidates", col: "cnic_front_url", type: "longtext" },
    { table: "candidates", col: "cnic_back_url", type: "longtext" },
    { table: "allocations", col: "joining_order_no", type: "varchar(100)" },
  ];

  for (const { table, col, type } of cols) {
    try {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      console.log(`Added ${col} to ${table}`);
    } catch (e: any) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log(`Column ${col} already exists on ${table}`);
      } else {
        console.log(`Note for ${col}:`, e.message);
      }
    }
  }

  await connection.end();
  console.log("Migration complete!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
