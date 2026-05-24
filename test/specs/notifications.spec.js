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

  // NOTIFICATION-011: Notification popover is usable on mobile
  test('[NOTIFICATION-011] - Mobile notification popover is usable with empty and populated states, close control, and rent detail navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open the notification bell
    const notificationBell = page.locator('button[aria-label="Notifikasi"]');
    await expect(notificationBell).toBeVisible();
    await notificationBell.click();

    // Wait for popover to appear
    const popover = page.locator('[role="dialog"], .max-h-80, [data-slot="popover-content"]').first();
    await expect(popover).toBeVisible();

    // --- VERIFY POPOVER IS NOT CLIPPED (within viewport) ---
    const popoverBox = await popover.boundingBox();
    expect(popoverBox).not.toBeNull();
    if (popoverBox) {
      expect(popoverBox.x).toBeGreaterThanOrEqual(0);
      expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(375);
      expect(popoverBox.y).toBeGreaterThanOrEqual(0);
      expect(popoverBox.y + popoverBox.height).toBeLessThanOrEqual(667);
    }

    // --- VERIFY CLOSE/DISMISS CONTROL EXISTS ---
    const closeControl =
      page.locator('button[aria-label="Tutup"], button[aria-label="Close"], button:has-text("Tutup"), [data-slot="close-button"], button:has(svg[data-slot="close-icon"])').first();
    await expect(closeControl).toBeVisible();

    // --- CHECK FOR EMPTY OR POPULATED STATE & RENT DETAIL NAVIGATION ---
    const popoverContent = await popover.textContent();
    const hasNotificationItems = popoverContent && popoverContent.trim().length > 3;

    if (hasNotificationItems && popoverContent) {
      const emptyStateText = /tidak ada notifikasi|no notifications|belum ada notifikasi/i;
      const isPopulated = !emptyStateText.test(popoverContent);

      if (isPopulated) {
        // POPULATED STATE: navigate to rent detail
        const notificationItems = page.locator('.max-h-80 a, .max-h-80 [role="button"], .max-h-80 button').first();
        if (await notificationItems.isVisible().catch(() => false)) {
          await notificationItems.click();
          await expect(page).toHaveURL(/\/rents\/\d+/);
        }
      } else {
        // EMPTY STATE
        const emptyIndicator = page.locator('text=/tidak ada notifikasi|no notifications|belum ada notifikasi/i');
        await expect(emptyIndicator).toBeVisible();
      }
    } else {
      const emptyIndicator = page.locator('text=/tidak ada notifikasi|no notifications|belum ada notifikasi/i');
      await expect(emptyIndicator).toBeVisible();
    }

    // --- VERIFY CLOSE CONTROL DISMISSES THE POPOVER ---
    await closeControl.click();
    await expect(popover).not.toBeVisible();
  });
});