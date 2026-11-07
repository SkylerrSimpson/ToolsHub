import "./env";
import { getDatabase } from "../src/server/database";

async function main() {
  const sql = getDatabase();
  try {
    // Expired sessions cannot be used by the API. Their tool records cascade with them.
    const expired = await sql`DELETE FROM browser_sessions WHERE expires_at <= now() RETURNING id`;
    console.log(`Removed ${expired.length} expired browser sessions and their saved items.`);
  } finally {
    await sql.end();
  }
}

main().catch(() => {
  console.error("Session cleanup failed. Check database access.");
  process.exitCode = 1;
});
