import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import type { Sql } from "postgres";

export async function runMigrations(sql: Sql) {
  const directory = new URL("../../migrations/", import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(748035066)`;
    await tx`
      CREATE TABLE IF NOT EXISTS tools_hub_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    for (const name of files) {
      const source = await readFile(new URL(name, directory), "utf8");
      const checksum = createHash("sha256").update(source).digest("hex");
      const existing = await tx<
        { checksum: string }[]
      >`SELECT checksum FROM tools_hub_migrations WHERE name = ${name}`;
      if (existing.length) {
        if (existing[0].checksum !== checksum)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await tx.unsafe(source);
      await tx`INSERT INTO tools_hub_migrations (name, checksum) VALUES (${name}, ${checksum})`;
    }
  });
}
