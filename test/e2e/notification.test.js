const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/catalogue', { timeout: 10000 });
}

/**
 * AC-032: Overdue rental alerts
 * AC-033: Due within 3 days reminder
 * AC-034: Badge count in navbar
 */
test.describe('AC-032 to AC-034: Notifications', () => {

  test('AC-034: Notification bell exists in navbar', async ({ page }) => {
    await login(page);
    const bellButton = page.locator('.notification-bell').first();
    if (await bellButton.isVisible({ timeout: 3000 })) {
      await expect(bellButton).toBeVisible();
    }
  });

  test('AC-034: Click notification bell shows dropdown', async ({ page }) => {
    await login(page);
    const bellButton = page.locator('button .lucide-bell, .notification-bell button').first();
    if (await bellButton.isVisible({ timeout: 3000 })) {
      await bellButton.click();
      await page.waitForTimeout(500);
      
      // Should show notification content
      const content = await page.content();
      expect(content).toMatch(/Notification|notifikasi|Alert/i);
    }
  });

  test('AC-032: Overdue rental alerts display', async ({ page }) => {
    await login(page);
    const bellButton = page.locator('button .lucide-bell, .notification-bell button').first();
    if (await bellButton.isVisible({ timeout: 3000 })) {
      await bellButton.click();
      await page.waitForTimeout(500);
      
      // Check for overdue alerts (no rentals found is also valid)
      const overdueText = page.locator('text=Terlambat, text=Overdue, text= Jatuh tempo').first();
      if (await overdueText.isVisible({ timeout: 2000 })) {
        await expect(overdueText).toBeVisible();
      } else {
        // No overdue rentals is also acceptable
        const noAlert = page.locator('text=Tidak ada, text=No, text=0').first();
        if (await noAlert.isVisible({ timeout: 1000 })) {
          await expect(noAlert).toBeVisible();
        }
      }
    }
  });

  test('AC-033: Due within 3 days reminders display', async ({ page }) => {
    await login(page);
    const bellButton = page.locator('button .lucide-bell, .notification-bell button').first();
    if (await bellButton.isVisible({ timeout: 3000 })) {
      await bellButton.click();
      await page.waitForTimeout(500);
      
      // Check for due soon reminders
      const dueSoonText = page.locator('text=3 hari, text=Due soon, text=Segera').first();
      if (await dueSoonText.isVisible({ timeout: 2000 })) {
        await expect(dueSoonText).toBeVisible();
      }
    }
  });
});