import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config";

const migrate = async () => {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    console.log("🔄 Running database migrations...");

    // Run schema migrations
    const schemaPath = path.join(__dirname, "../db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await pool.query(schema);
    console.log("✅ Schema migrations completed");

    // Run role-based auth migrations
    const roleMigrationPath = path.join(
      __dirname,
      "../db/add-role-migration.sql",
    );
    const roleMigration = fs.readFileSync(roleMigrationPath, "utf-8");
    await pool.query(roleMigration);
    console.log("✅ Role-based auth migrations completed");

    console.log("✅ All database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
};

migrate();
