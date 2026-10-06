import { expect, test } from "@playwright/test";

test("loads the application foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PFx Rename X" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose files" })).toBeVisible();
});
