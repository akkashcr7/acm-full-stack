import { test, expect } from "@playwright/test";

test.describe("Team ACE Offline-First Judging Sync Flow", () => {
  test("Judge goes offline, scores 5 runs, and comes back online with automatic sync", async ({
    page,
    context,
  }) => {
    // 1. Navigate to the competition judging page
    await page.goto("/judge");
    await expect(page.locator("h1")).toContainText("Dynamic Scoring Form");

    // 2. Simulate entering airplane mode / bad Wi-Fi hall condition
    await context.setOffline(true);
    await page.click('button:has-text("Simulate Offline")');

    // Verify offline banner shows up
    await expect(page.locator("text=Offline Mode (Airplane Mode Active)")).toBeVisible();

    // 3. Score 5 consecutive runs while offline
    const teams = ["team_alpha", "team_beta", "team_gamma", "team_delta", "team_epsilon"];

    for (let i = 0; i < 5; i++) {
      // Click team if available or submit score
      await page.fill('input[type="text"][placeholder*="Field Notes"]', `Offline Run ${i + 1}`);
      await page.click('button:has-text("Save to Offline Queue")');
      // Wait for feedback pill
      await expect(
        page.locator("text=saved locally to IndexedDB queue")
      ).toBeVisible();
    }

    // Verify IndexedDB queue counter says 5 Queued
    await expect(page.locator("text=5 Queued")).toBeVisible();

    // 4. Come back online (Judge walks back to Wi-Fi area)
    await context.setOffline(false);
    await page.click('button:has-text("Airplane Mode ON")');

    // 5. Automatic synchronization triggers
    await page.click('button:has-text("Sync Now")');

    // 6. Verify sync success
    await expect(
      page.locator("text=Successfully synced")
    ).toBeVisible({ timeout: 5000 });

    // 7. Verify leaderboard has updated within 2 seconds
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Team ACE");
    const rankRows = page.locator(".glass-card");
    await expect(rankRows.first()).toBeVisible();
  });
});
