import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test("full-stack JPG to PDF download", async ({ page }) => {
  const fixture = path.join(
    process.cwd(),
    "..",
    "..",
    "tests",
    "fixtures",
    "e2e-sample.jpg",
  );
  if (!fs.existsSync(fixture)) {
    test.skip(true, "e2e-sample.jpg fixture missing");
  }

  await page.goto("/jpg-to-pdf");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("JPG to PDF");

  const input = page.locator('input[type="file"]');
  await input.setInputFiles(fixture);

  await page.getByRole("button", { name: "Convert to PDF" }).click();
  await expect(page.getByText("Conversion complete", { exact: false })).toBeVisible({
    timeout: 60_000,
  });

  const downloadLink = page.getByRole("link", { name: "Download PDF" });
  await expect(downloadLink).toBeVisible();
  const href = await downloadLink.getAttribute("href");
  expect(href).toBeTruthy();
});
