import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [["list"]],
    use: {
        baseURL: "http://localhost:4000",
        viewport: { width: 1280, height: 900 },
        screenshot: "only-on-failure",
        trace: "off",
        video: "off"
    },
    projects: [
        {
            name: "chrome",
            use: { ...devices["Desktop Chrome"], channel: "chrome", headless: true }
        }
    ]
});
