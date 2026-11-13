import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function listZipJpegs(zipPath: string): string[] {
  const py = path.join(process.cwd(), "..", "api", ".venv", "Scripts", "python.exe");
  const script = `
import json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
    names = sorted(n for n in z.namelist() if n.lower().endswith(".jpg"))
    print(json.dumps(names))
`;
  const stdout = execFileSync(py, ["-c", script, zipPath], { encoding: "utf8" });
  return JSON.parse(stdout) as string[];
}

test("full-stack PDF to JPG ZIP download", async ({ page }) => {
  const fixture = path.join(process.cwd(), "..", "..", "tests", "fixtures", "e2e-sample-3page.pdf");
  if (!fs.existsSync(fixture)) {
    test.skip(true, "e2e-sample-3page.pdf fixture missing");
  }

  test.setTimeout(180_000);

  await page.goto("/pdf-to-jpg");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PDF to JPG");

  await page.locator('input[type="file"]').setInputFiles(fixture);
  await expect(page.getByText("3 pages detected")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("radio", { name: "Custom pages" }).check();
  await page.getByPlaceholder("e.g. 1-3, 5, 8").fill("1, 3");
  await page.getByLabel("Resolution").selectOption("150");
  await page.getByLabel("JPEG quality").selectOption("high");

  await page.getByRole("button", { name: "Convert to JPG" }).click();
  await expect(page.getByText("Conversion complete", { exact: false })).toBeVisible({
    timeout: 120_000,
  });

  const downloadLink = page.getByRole("link", { name: /Download ZIP/i });
  await expect(downloadLink).toBeVisible();
  const bytes = await downloadLink.evaluate(async (el: HTMLAnchorElement) => {
    const response = await fetch(el.href);
    const buffer = await response.arrayBuffer();
    return [...new Uint8Array(buffer)];
  });

  const outPath = path.join(process.cwd(), "test-results", `pdf-to-jpg-${Date.now()}.zip`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(bytes));

  const names = listZipJpegs(outPath);
  expect(names.length).toBe(2);
  expect(names[0]).toMatch(/document-page-001\.jpg$/);
  expect(names[1]).toMatch(/document-page-003\.jpg$/);
});
