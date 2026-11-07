import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

// Shell variables win, then local overrides, then the shared environment file.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) loadEnvFile(file);
}
