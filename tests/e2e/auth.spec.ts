import { test, expect } from "@playwright/test";

test.describe("RRCE ERP Portal Navigation", () => {
  test("should display login portal selection screen", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/RRCE|Login/i);
    await expect(page.locator("body")).toContainText("RajaRajeswari College of Engineering");
  });
});
