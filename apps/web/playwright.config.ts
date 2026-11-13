import { defineConfig } from "@playwright/test";

const webUrl = process.env.PLAYWRIGHT_WEB_URL ?? "http://localhost:3000";
const apiUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  use: {
    baseURL: webUrl,
  },
  webServer: [
    {
      command:
        "E:\\PDF-Tools-Platform\\apps\\api\\.venv\\Scripts\\python.exe -m uvicorn pdf_tools_api.main:app --host 127.0.0.1 --port 8000",
      cwd: "E:\\PDF-Tools-Platform\\apps\\api",
      url: `${apiUrl}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      cwd: "E:\\PDF-Tools-Platform\\apps\\web",
      url: webUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
