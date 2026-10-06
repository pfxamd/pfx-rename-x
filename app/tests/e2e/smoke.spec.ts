import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

test("renames real browser files and downloads a verified ZIP", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
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

  await expect(page.getByText("2 files · 0 issues")).toBeVisible();

  const ruleType = page.getByLabel("Rule type");

  await ruleType.selectOption("slugify");
  await page.getByRole("button", { name: "Add rule" }).click();

  await expect(page.getByRole("cell", { name: "alpha-note.TXT" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "beta-file.txt" })).toBeVisible();

  await ruleType.selectOption("prefix");
  await page.getByRole("button", { name: "Add rule" }).click();

  const prefixCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Prefix" }),
  });
  await prefixCard.getByLabel("Value").fill("batch-");

  await expect(page.getByRole("cell", { name: "batch-alpha-note.TXT" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "batch-beta-file.txt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download ZIP" })).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("pfx-rename-x-renamed.zip");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const bytes = await readFile(downloadPath!);
  const archive = unzipSync(new Uint8Array(bytes));

  expect(strFromU8(archive["batch-alpha-note.TXT"]!)).toBe("alpha-content");
  expect(strFromU8(archive["batch-beta-file.txt"]!)).toBe("beta-content");

  const manifest = JSON.parse(
    strFromU8(archive["pfx-rename-x-manifest.json"]!),
  ) as {
    entries: Array<{ from: string; to: string }>;
  };

  expect(manifest.entries.map(({ from, to }) => ({ from, to }))).toEqual([
    { from: "Alpha Note.TXT", to: "batch-alpha-note.TXT" },
    { from: "Beta File.txt", to: "batch-beta-file.txt" },
  ]);

  await expect(
    page.getByText("ZIP ready with 2 renamed files and the manifest."),
  ).toBeVisible();
});
