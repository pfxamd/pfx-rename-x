import { expect, test } from "@playwright/test";

test("loads the complete rename workflow shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose files" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add rule" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Execute" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download ZIP" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download separately" })).toBeDisabled();
});
