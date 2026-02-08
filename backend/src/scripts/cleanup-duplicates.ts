import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

async function runCleanup() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/symptomdetect",
  });

  try {
    console.log("🔄 Running duplicate cleanup migration...");

    // Read the cleanup SQL file
    const cleanupSQL = fs.readFileSync(
      path.join(process.cwd(), "src/db/cleanup-duplicates.sql"),
      "utf-8",
    );

    // Execute the cleanup
    await pool.query(cleanupSQL);

    console.log("✅ Cleanup migration completed successfully!");
    console.log("\n📊 Checking for remaining duplicates...");

    // Check doctors
    const doctorCheck = await pool.query(
      `SELECT full_name, specialty, COUNT(*) as count 
       FROM public.doctors 
       GROUP BY full_name, specialty 
       HAVING COUNT(*) > 1`,
    );

    if (doctorCheck.rows.length === 0) {
      console.log("✅ No duplicate doctors found");
    } else {
      console.log("⚠️  Duplicate doctors still exist:", doctorCheck.rows);
    }

    // Check medicines
    const medicineCheck = await pool.query(
      `SELECT name, manufacturer, COUNT(*) as count 
       FROM public.medicines 
       GROUP BY name, manufacturer 
       HAVING COUNT(*) > 1`,
    );

    if (medicineCheck.rows.length === 0) {
      console.log("✅ No duplicate medicines found");
    } else {
      console.log("⚠️  Duplicate medicines still exist:", medicineCheck.rows);
    }
  } catch (error) {
    console.error("❌ Error running cleanup migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runCleanup();
