import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/find your uni/i);
    await expect(page.locator("text=Find Your Uni").first()).toBeVisible();
  });

  test("has links to login and register", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator('a[href*="/auth/login"]').first();
    await expect(loginLink).toBeVisible();
  });

  test("navigating to universities page works", async ({ page }) => {
    await page.goto("/universities");
    await expect(page.getByRole("heading", { name: /Browse Unis/i })).toBeVisible();
  });
});
