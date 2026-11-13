import { defineConfig } from "@playwright/test";

const apiUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:8000";
const webUrl = process.env.PLAYWRIGHT_WEB_URL ?? "http://127.0.0.1:3000";

function portFrom(baseUrl: string, fallback: string): string {
  try {
    const parsed = new URL(baseUrl);
    return parsed.port || fallback;
  } catch {
    return fallback;
  }
}

const apiPort = portFrom(apiUrl, "8000");
const webPort = portFrom(webUrl, "3000");

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  use: {
    baseURL: webUrl,
  },
  webServer: [
    {
      command: `E:\\PDF-Tools-Platform\\apps\\api\\.venv\\Scripts\\python.exe -m uvicorn pdf_tools_api.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: "E:\\PDF-Tools-Platform\\apps\\api",
      url: `${apiUrl}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        CORS_ORIGINS: `${webUrl},http://localhost:3000,http://127.0.0.1:3000`,
      },
    },
    {
      command: `set NEXT_PUBLIC_API_URL=${apiUrl}&& npm run dev -- -p ${webPort}`,
      cwd: "E:\\PDF-Tools-Platform\\apps\\web",
      url: webUrl,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: apiUrl,
      },
    },
  ],
});
