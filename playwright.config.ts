import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de punta a punta. Levantan el backend simulado (`mocks/backend.mjs`)
 * y la app compilada en producción, así no dependen de Railway ni de su key.
 */
const APP_PORT = 3100;
const MOCK_PORT = 4010;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node mocks/backend.mjs",
      url: `http://localhost:${MOCK_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_PORT: String(MOCK_PORT), MOCK_API_KEY: "e2e-key" },
    },
    {
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        API_BASE_URL: `http://localhost:${MOCK_PORT}`,
        API_KEY: "e2e-key",
        // Solo para las pruebas: no es un secreto real.
        SESSION_SECRET: "e2e-session-secret-solo-para-pruebas-0123456789",
      },
    },
  ],
});
