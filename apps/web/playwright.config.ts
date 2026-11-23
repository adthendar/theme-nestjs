import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
config({ path: "../../.env", quiet: true });
const web = "http://localhost:3400";
const api = "http://127.0.0.1:3401";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60_000,
  use: { baseURL: web, trace: "retain-on-failure" },
  webServer: [
    {
      command: "pnpm --filter @starter/api dev",
      cwd: "../..",
      url: api + "/health",
      env: { PORT: "3401", WEB_ORIGIN: web },
      timeout: 120_000,
    },
    {
      command: "pnpm dev --port 3400",
      url: web + "/login",
      env: { API_INTERNAL_URL: api, WEB_DIST_DIR: ".next-e2e" },
      timeout: 120_000,
    },
  ],
});
