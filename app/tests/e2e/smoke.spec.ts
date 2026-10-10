import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

test("keeps one simple flow for renaming and downloading a batch", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("pfx-rename-x-theme", "dark"));
  await page.reload();

  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drop files here or click to choose files" })).toBeVisible();
  await expect(page.getByLabel("New name")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.locator('input[type="file"]').setInputFiles([
    { name: "Alpha Note.TXT", mimeType: "text/plain", buffer: Buffer.from("alpha-content") },
    { name: "Beta File.txt", mimeType: "text/plain", buffer: Buffer.from("beta-content") },
  ]);
  await expect(page.getByLabel("New name")).toBeFocused();
  await expect(page.getByRole("button", { name: "Download files" })).toBeDisabled();
  await page.getByLabel("New name").fill("Holiday");

  await expect(page.getByText("Holiday 01.TXT")).toBeVisible();
  await expect(page.getByText("Holiday 02.txt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download files" })).toBeEnabled();

  const started = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download files" }).click();
  const download = await started;
  expect(download.suggestedFilename()).toBe("renamed-files.zip");
  const bytes = await readFile((await download.path())!);
  const archive = unzipSync(new Uint8Array(bytes));
  expect(strFromU8(archive["Holiday 01.TXT"]!)).toBe("alpha-content");
  expect(strFromU8(archive["Holiday 02.txt"]!)).toBe("beta-content");
  expect(Object.keys(archive).sort()).toEqual(["Holiday 01.TXT", "Holiday 02.txt"]);
  await expect(page.getByText("Files downloaded.")).toBeVisible();

  await page.getByRole("button", { name: "Remove Alpha Note.TXT" }).click();
  await expect(page.getByText("Holiday.TXT")).toHaveCount(0);
  await expect(page.getByText("Holiday.txt")).toBeVisible();
  const single = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download file" }).click();
  expect((await single).suggestedFilename()).toBe("Holiday.txt");

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("button", { name: "Drop files here or click to choose files" })).toBeVisible();
  await expect(page.getByLabel("New name")).toHaveCount(0);
});

test("downloads one file directly without adding a sequence number", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles({
    name: "sketch.png", mimeType: "image/png", buffer: Buffer.from("drawing"),
  });
  await page.getByLabel("New name").fill("Finished artwork");
  await expect(page.getByText("Finished artwork.png")).toBeVisible();

  const started = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download file" }).click();
  expect((await started).suggestedFilename()).toBe("Finished artwork.png");
});
