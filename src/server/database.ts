import postgres, { type Sql } from "postgres";

const pool = globalThis as typeof globalThis & { toolsHubDatabase?: Sql };

export function getDatabase(): Sql {
  if (pool.toolsHubDatabase) return pool.toolsHubDatabase;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured.");
  pool.toolsHubDatabase = postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
    // Set statement_timeout on the database role; poolers reject it in startup packets.
    connection: { application_name: "tools-hub" },
  });
  return pool.toolsHubDatabase;
}
