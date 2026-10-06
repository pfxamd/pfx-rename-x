import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

test("renames real browser files with the simple rename flow", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pfx-rename-x-theme", "dark");
  });
  await page.goto("./");

  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download ZIP" })).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "Alpha Note.TXT",
      mimeType: "text/plain",
      buffer: Buffer.from("alpha-content"),
    },
    {
      name: "Beta File.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("beta-content"),
    },
  ]);

  await expect(
    page.getByLabel("Preview summary: 2 files, 0 changed, 0 issues"),
  ).toBeVisible();

  await page.getByLabel("New name").fill("Holiday");

  await expect(page.getByRole("cell", { name: "Holiday 01.TXT" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Holiday 02.txt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download ZIP" })).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("pfx-rename-x-renamed.zip");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const bytes = await readFile(downloadPath!);
  const archive = unzipSync(new Uint8Array(bytes));

  expect(strFromU8(archive["Holiday 01.TXT"]!)).toBe("alpha-content");
  expect(strFromU8(archive["Holiday 02.txt"]!)).toBe("beta-content");

  await expect(
    page.getByText("ZIP ready with 2 renamed files and the manifest."),
  ).toBeVisible();
});
