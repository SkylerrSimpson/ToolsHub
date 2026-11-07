import "./env";
import { getDatabase } from "../src/server/database";
import { runMigrations } from "../src/server/migrate";

async function main() {
  const sql = getDatabase();
  try {
    await runMigrations(sql);
    console.log("Database migrations are up to date.");
  } finally {
    await sql.end();
  }
}

main().catch(() => {
  console.error("Migration failed. Check database access and migration history.");
  process.exitCode = 1;
});
