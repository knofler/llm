import { defineConfig, devices } from "@playwright/test";

// Smoke tests for both tracks. Run in Docker, never on the host:
//   docker compose --profile e2e run --rm e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // Default is half the CPU cores (9 on an 18-core Mac). That many Chromiums
  // inside the 1 GB e2e container crash with "Page crashed"; 2 is stable.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    // Safari's engine on an iPhone screen, for the pinned top bar only. Docker
    // only: the Playwright image ships WebKit, the CI runner image does not.
    ...(process.env.CI ? [] : [{ name: "iphone", use: { ...devices["iPhone 13"] }, testMatch: /top-bar\.spec\.ts/ }]),
  ],
});
