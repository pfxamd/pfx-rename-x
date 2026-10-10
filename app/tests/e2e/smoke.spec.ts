import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

test("keeps one simple flow for renaming and downloading a batch", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("pfx-rename-x-theme", "dark"));
  await page.reload();

  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
  await expect(page.getByText(/^alpha 0\.1\.\d+$/)).toBeVisible();
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
  await expect(page.getByRole("button", { name: "Remove Alpha Note.TXT" })).toHaveCount(0);
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


test("renames 100 files including duplicate originals and keeps every byte", async ({ page }) => {
  await page.goto("./");
  const extensions = ["JPG", "png", "svg", "txt"];
  const batch = Array.from({ length: 100 }, (_, i) => ({
    name: "repeated." + extensions[i % extensions.length],
    mimeType: "application/octet-stream",
    buffer: Buffer.from("asset-" + String(i).padStart(3, "0")),
  }));
  await page.locator('input[type="file"]').setInputFiles(batch);
  await expect(page.getByRole("heading", { name: "Files 100" })).toBeVisible();
  await page.getByLabel("New name").fill("Portfolio");
  await expect(page.getByText("Portfolio 001.JPG")).toBeVisible();
  await expect(page.getByText("Portfolio 100.txt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download files" })).toBeEnabled();

  const nextDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download files" }).click();
  const download = await nextDownload;
  const archive = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  const names = Object.keys(archive);
  expect(names).toHaveLength(100);
  expect(names).not.toContain("pfx-rename-x-manifest.json");
  expect(strFromU8(archive["Portfolio 001.JPG"]!)).toBe("asset-000");
  expect(strFromU8(archive["Portfolio 100.txt"]!)).toBe("asset-099");
});

test("validates forbidden characters and long names without losing input", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles({
    name: "photo.SUPERLONGFORMAT",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("untouched"),
  });

  const field = page.getByLabel("New name");
  await field.fill("bad/name");
  await expect(page.getByRole("button", { name: "Download file" })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("invalid or non-portable characters");

  await field.fill("a".repeat(240));
  await expect(page.getByRole("button", { name: "Download file" })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("exceeds 255 characters");

  await field.fill("Artist");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download file" })).toBeEnabled();
  const started = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download file" }).click();
  expect((await started).suggestedFilename()).toBe("Artist.SUPERLONGFORMAT");
});

test("keeps a selected but already-matching name in the downloaded set", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "Artwork 01.jpg", mimeType: "image/jpeg", buffer: Buffer.from("original-first") },
    { name: "draft.png", mimeType: "image/png", buffer: Buffer.from("original-second") },
  ]);
  await page.getByLabel("New name").fill("Artwork");
  await expect(page.getByText("Artwork 01.jpg").last()).toBeVisible();
  await expect(page.getByText("Artwork 02.png")).toBeVisible();
  const started = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download files" }).click();
  const selectedDownload = await started;
  const selectedPath = await selectedDownload.path();
  const archive = unzipSync(new Uint8Array(await readFile(selectedPath!)));
  expect(Object.keys(archive).sort()).toEqual(["Artwork 01.jpg", "Artwork 02.png"]);
  expect(strFromU8(archive["Artwork 01.jpg"]!)).toBe("original-first");
  expect(strFromU8(archive["Artwork 02.png"]!)).toBe("original-second");
});

test("keeps the core workflow usable on narrow screens in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Drop files here or click to choose files" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "رسم نهائي.png", mimeType: "image/png", buffer: Buffer.from("art"),
  });
  await page.getByLabel("New name").fill("لوحة فنية");
  await expect(page.getByText("لوحة فنية.png")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download file" })).toBeVisible();

  for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const mode of ["light", "dark"] as const) {
      const toggle = page.getByRole("button", { name: "Switch to " + (mode === "light" ? "light" : "dark") + " mode" });
      if (await toggle.count()) await toggle.click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
      await expect(page.getByLabel("New name")).toBeVisible();
      await expect(page.getByRole("button", { name: "Download file" })).toBeVisible();
    }
  }
});


test("accepts a real browser drag-and-drop gesture", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["dropped-file"], "sketch draft.svg", { type: "image/svg+xml" }));
    const zone = document.querySelector('[aria-label="Add files"]');
    if (!zone) throw new Error("Drop area missing");
    for (const eventName of ["dragenter", "dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(eventName, { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }
  });
  await expect(page.getByText("sketch draft.svg")).toBeVisible();
  await page.getByLabel("New name").fill("Final");
  await expect(page.getByText("Final.svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download file" })).toBeEnabled();
});


test("keeps the primary download action readable in both color themes", async ({ page }) => {
  await page.goto("./");
  await page.locator('input[type="file"]').setInputFiles({
    name: "artwork.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("image"),
  });
  await page.getByLabel("New name").fill("Finished");

  const checkContrast = async () => {
    const ratio = await page.getByRole("button", { name: "Download file" }).evaluate((button) => {
      const styles = getComputedStyle(button);
      const toLinear = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (value: string) => {
        const rgb = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        return rgb.reduce((sum, channel, i) => sum + toLinear(channel) * [0.2126, 0.7152, 0.0722][i]!, 0);
      };
      const front = luminance(styles.color);
      const back = luminance(styles.backgroundColor);
      return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  };

  await page.getByRole("button", { name: "Switch to light mode" }).count().then(async (count) => {
    if (count) await page.getByRole("button", { name: "Switch to light mode" }).click();
  });
  await checkContrast();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await checkContrast();
});
