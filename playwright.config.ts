import { defineConfig, devices } from "@playwright/test";

/**
 * The e2e suite drives the real app against the real backend — no mocks.
 * Playwright starts both servers itself, so `npm run test:e2e` is a single
 * command locally and in CI.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"]
    ? "list"
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev -w backend",
      url: "http://localhost:4000/graphql?query=%7B__typename%7D",
      reuseExistingServer: !process.env["CI"],
      timeout: 60_000,
    },
    {
      command: "npm run dev -w frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env["CI"],
      timeout: 60_000,
    },
  ],
});
