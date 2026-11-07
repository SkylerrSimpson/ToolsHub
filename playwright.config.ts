import { defineConfig, devices } from "@playwright/test";
import "./scripts/env";

const database = process.env.BROWSER_DATABASE_URL;
if (database) {
  const url = new URL(database);
  if (
    !url.pathname.endsWith("_test") ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    throw new Error(
      "BROWSER_DATABASE_URL must name a disposable loopback database ending in _test.",
    );
  }
}

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: database ?? "",
      APP_ORIGIN: "http://127.0.0.1:3101",
    },
    timeout: 90_000,
  },
});
