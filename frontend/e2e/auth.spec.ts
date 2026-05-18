import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("login page shows student and consultant options", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("text=Welcome back")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Student" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Consultant" })).toBeVisible();
  });

  test("student login form has email and password fields", async ({ page }) => {
    await page.goto("/auth/login/student");
    await expect(page.locator("text=Sign in to your student account")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("student login validates empty submission", async ({ page }) => {
    await page.goto("/auth/login/student");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Invalid email")).toBeVisible();
  });

  test("register page shows multi-step form", async ({ page }) => {
    await page.goto("/auth/register/student");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByText("Account", { exact: true })).toBeVisible();
  });

  test("register validates email format", async ({ page }) => {
    await page.goto("/auth/register/student");
    await page.locator('input[type="email"]').fill("not-an-email");
    await page.locator('input[type="password"]').first().fill("short");
    await page.locator('button:has-text("Next"), button[type="submit"]').first().click();
    await expect(
      page.getByText("Invalid email").or(page.getByText("Valid email"))
    ).toBeVisible();
  });

  test("forgot password page accessible", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/student/dashboard");
    await page.waitForURL("**/auth/login**");
    expect(page.url()).toContain("/auth/login");
  });

  test("consultant protected routes redirect to login", async ({ page }) => {
    await page.goto("/consultant/dashboard");
    await page.waitForURL("**/auth/login**");
    expect(page.url()).toContain("/auth/login");
  });

  test("admin protected routes redirect to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForURL("**/auth/login**");
    expect(page.url()).toContain("/auth/login");
  });
});
