import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  // Own a production server by default; never accidentally test a stale dev server.
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "npm run start -w apps/web -- --hostname 0.0.0.0 --port 3100",
        url: "http://127.0.0.1:3100/api/health",
        reuseExistingServer: false,
        timeout: 60000,
      },
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? {
          executablePath: process.env.CHROMIUM_PATH,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--use-gl=angle",
            "--use-angle=swiftshader",
          ],
        }
      : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
