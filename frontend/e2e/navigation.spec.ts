import { test, expect } from "@playwright/test";

test.describe("Navigation and routing", () => {
  test("404 page handles unknown routes gracefully", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist");
    // Next.js returns 404 or shows a not-found page
    expect(res?.status()).toBe(404);
  });

  test("login picker navigates to student login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator("text=Sign in as Student").click();
    await page.waitForURL("**/auth/login/student");
    expect(page.url()).toContain("/auth/login/student");
  });

  test("login picker navigates to consultant login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator("text=Sign in as Consultant").click();
    await page.waitForURL("**/auth/login/consultant");
    expect(page.url()).toContain("/auth/login/consultant");
  });

  test("student login has register link", async ({ page }) => {
    await page.goto("/auth/login/student");
    const registerLink = page.locator('a[href*="/auth/register"]').first();
    await expect(registerLink).toBeVisible();
  });

  test("student login has forgot password link", async ({ page }) => {
    await page.goto("/auth/login/student");
    const forgotLink = page.locator('a[href*="/auth/forgot-password"]').first();
    await expect(forgotLink).toBeVisible();
  });
});
