import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  retries: 2,
  use: {
    baseURL: "https://pfxamd.github.io/pfx-rename-x/",
    trace: "on-first-retry",
  },
});
