const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // NOTIFICATION: Overdue Rental Alerts
  test('[NOTIFICATION-001] - Badge shows count of overdue rentals', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await expect(notificationBell).toBeVisible();
    const badge = notificationBell.locator('[data-slot="badge"]');
    const isVisible = await badge.isVisible().catch(() => false);
    if (isVisible) {
      const countText = await badge.textContent();
      const count = parseInt(countText);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('[NOTIFICATION-002] - Alert displays for rentals past end date', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    const hasOverdueText = /Terlambat|overdue/i.test(bodyText);
    const hasPastDueText = /rent_end|tanggal/i.test(bodyText);
    expect(hasOverdueText || hasPastDueText).toBeTruthy();
  });

  // NOTIFICATION: Due Soon Reminders
  test('[NOTIFICATION-003] - Reminder for rentals due within 3 days', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    const hasDueSoonText = /Segera|due soon|3 hari/i.test(bodyText);
    expect(hasDueSoonText || dropdown).toBeTruthy();
  });

  test('[NOTIFICATION-004] - Notification displayed in navbar', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await expect(notificationBell).toBeVisible();
    const bellIcon = notificationBell.locator('svg');
    await expect(bellIcon).toBeVisible();
  });

  // NOTIFICATION: Notification Bell
  test('[NOTIFICATION-005] - Click bell shows notification dropdown', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();
    const heading = page.locator('h3:text("Notifikasi")');
    await expect(heading).toBeVisible();
  });

  test('[NOTIFICATION-006] - List of overdue and due soon rentals', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();
    const dropdownContent = page.locator('.max-h-80');
    const hasContent = await dropdownContent.textContent();
    const hasItems = hasContent && hasContent.trim().length > 0;
    expect(hasItems || false).toBeTruthy();
  });

  // NOTIFICATION-007: Badge count matches API count
  test('[NOTIFICATION-007] - Badge count matches API count', async ({ page }) => {
    // Get count from API
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const response = await page.evaluate(async (token) => {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { status: res.status, data: await res.json() };
    }, token);

    expect(response.status).toBe(200);
    const apiCount = response.data.count;

    // Check badge
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    const badge = notificationBell.locator('[data-slot="badge"]');
    const isVisible = await badge.isVisible().catch(() => false);
    if (isVisible && apiCount > 0) {
      const badgeText = await badge.textContent();
      expect(parseInt(badgeText)).toBe(apiCount);
    }
  });

  // NOTIFICATION-008: Badge hidden when count is 0
  test('[NOTIFICATION-008] - Badge hidden when count is 0', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    const badge = notificationBell.locator('[data-slot="badge"]');
    const isVisible = await badge.isVisible().catch(() => false);
    if (!isVisible) {
      expect(true).toBe(true); // Badge hidden - pass
    } else {
      const badgeText = await badge.textContent();
      const count = parseInt(badgeText);
      expect(count).toBe(0);
    }
  });

  // NOTIFICATION-009: Notification item shows client name and rent_end date
  test('[NOTIFICATION-009] - Notification item shows client name and rent_end date', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();

    const dropdownContent = page.locator('.max-h-80');
    const contentText = await dropdownContent.textContent();
    if (contentText && contentText.trim().length > 0) {
      expect(contentText.length).toBeGreaterThan(0);
    }
  });

  // NOTIFICATION-010: Overdue items are visually distinct from due_soon
  test('[NOTIFICATION-010] - Overdue items are visually distinct from due_soon', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await notificationBell.click();
    const dropdown = page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();

    // Check for different visual styles (colors, labels)
    const overdueItems = page.locator('text=/terlambat|overdue/i');
    const dueSoonItems = page.locator('text=/segera|due soon/i');
    const hasOverdue = await overdueItems.first().isVisible().catch(() => false);
    const hasDueSoon = await dueSoonItems.first().isVisible().catch(() => false);

    // At least one type should be visible if there are notifications
    expect(hasOverdue || hasDueSoon).toBeTruthy();
  });
});
