import { test, expect, type Page } from "@playwright/test";

/**
 * Authenticated student flow tests.
 * These require E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD env vars.
 * Skip gracefully if credentials aren't available.
 */

const email = process.env.E2E_STUDENT_EMAIL;
const password = process.env.E2E_STUDENT_PASSWORD;

async function loginAsStudent(page: Page) {
  await page.goto("/auth/login/student");
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/student/**", { timeout: 15_000 });
}

test.describe("Student authenticated flows", () => {
  test.skip(!email || !password, "E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD not set");

  test("login and reach dashboard", async ({ page }) => {
    await loginAsStudent(page);
    expect(page.url()).toContain("/student/dashboard");
    await expect(page.locator("text=Welcome").or(page.locator("text=Dashboard"))).toBeVisible();
  });

  test("navigate to shortlist", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/shortlist");
    await expect(
      page.locator("text=My Shortlist").or(page.locator("text=Shortlist"))
    ).toBeVisible();
  });

  test("navigate to applications", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/applications");
    await page.waitForTimeout(2000);
    // Should show applications list or empty state
    await expect(
      page.locator("text=Application").first().or(page.locator("text=No applications"))
    ).toBeVisible();
  });

  test("navigate to documents", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/documents");
    await expect(
      page.locator("text=Document").first().or(page.locator("text=Upload"))
    ).toBeVisible();
  });

  test("navigate to profile", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/profile");
    await expect(page.locator("text=Profile").first()).toBeVisible();
  });

  test("compare page requires 2+ shortlisted unis", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/compare");
    await expect(
      page.locator("text=Compare").first().or(page.locator("text=Select universities"))
    ).toBeVisible();
  });

  test("match flow is accessible", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/match");
    await page.waitForTimeout(2000);
    await expect(
      page.locator("text=Match").first()
        .or(page.locator("text=results"))
        .or(page.locator("text=Run"))
    ).toBeVisible();
  });
});
