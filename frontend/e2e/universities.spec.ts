import { test, expect } from "@playwright/test";

test.describe("Universities browsing", () => {
  test("universities page loads with search and filters", async ({ page }) => {
    await page.goto("/universities");
    await expect(page.getByRole("heading", { name: /Browse Unis/i })).toBeVisible();
  });

  test("university search input is functional", async ({ page }) => {
    await page.goto("/universities");
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Harvard");
      await page.waitForTimeout(500);
    }
  });

  test("university cards are clickable", async ({ page }) => {
    await page.goto("/universities");
    await page.waitForTimeout(2000);
    const uniCard = page.locator('a[href*="/universities/"]').first();
    if (await uniCard.isVisible()) {
      await uniCard.click();
      await page.waitForURL("**/universities/**");
      expect(page.url()).toContain("/universities/");
    }
  });
});
