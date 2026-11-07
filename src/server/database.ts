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
    connection: { application_name: "tools-hub", statement_timeout: 10000 },
  });
  return pool.toolsHubDatabase;
}
