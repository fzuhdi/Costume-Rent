const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { SidebarPage } = require('../pages/SidebarPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Navigation & UI', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await context.clearPermissions(); // optional
    await context.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // NAVIGATION: Sidebar Navigation
  test('[NAVIGATION-001] - Katalog menu links to /catalogue', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await sidebarPage.clickKatalog();
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(sidebarPage.katalogLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[NAVIGATION-002] - Peminjaman menu links to /rents', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await expect(sidebarPage.peminjamanLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[NAVIGATION-003] - Klien menu links to /clients', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickKlien();
    await expect(page).toHaveURL(/\/clients/);
    await expect(sidebarPage.klienLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[NAVIGATION-004] - Pengaturan menu links to /settings', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPengaturan();
    await expect(page).toHaveURL(/\/settings/);
    await expect(sidebarPage.pengaturanLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  // NAVIGATION: Direct URL Access
  test('[NAVIGATION-005] - All routes accessible via direct URL when authenticated', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/catalogue/);
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/rents/);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/clients/);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('[NAVIGATION-006] - Unauthenticated access redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[NAVIGATION-007] - 404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('body')).toContainText(/404|not found|tidak ditemukan/i);
  });

  // NAVIGATION: Responsive Design
  test('[NAVIGATION-008] - Usable on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('aside').first()).toBeVisible();
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const layout = await page.locator('.app-layout').isVisible().catch(() => false);
    expect(layout).toBeTruthy();
  });

  test('[NAVIGATION-009] - Usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  // NAVIGATION-010: Active sidebar link is highlighted
  test('[NAVIGATION-010] - Active sidebar link is highlighted', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    // Check that "Peminjaman" link has active styling
    const className = await sidebarPage.peminjamanLink.getAttribute('class');
    expect(className).toMatch(/bg-\[var\(--primary\)\]\/15/);
  });

  // NAVIGATION-011: 404 page has link back to catalogue
  test('[NAVIGATION-011] - 404 page has link back to catalogue', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    const catalogueLink = page.locator('a[href="/catalogue"], button:has-text("Katalog")').first();
    await expect(catalogueLink).toBeVisible();
  });

  // NAVIGATION-012: Dark mode toggle switches theme (NAVIGATION)
  test('[NAVIGATION-012] - Dark mode toggle switches theme', async ({ page }) => {
    const navbarPage = new (require('../pages/NavbarPage.js')).NavbarPage(page);
    // Click theme toggle
    await navbarPage.toggleTheme();
    await page.waitForTimeout(500);
    // Check html has 'dark' class
    await navbarPage.assertDarkMode(true);
    // Click again to switch back
    await navbarPage.toggleTheme();
    await page.waitForTimeout(500);
    await navbarPage.assertDarkMode(false);
  });

  // NAVIGATION-013: Dark mode preference persists on reload (NAVIGATION)
  test('[NAVIGATION-013] - Dark mode preference persists on reload', async ({ page }) => {
    const navbarPage = new (require('../pages/NavbarPage.js')).NavbarPage(page);
    await navbarPage.toggleTheme();
    const theme = await page.evaluate(() => localStorage.getItem('heroui-theme'));
    expect(theme).toBe('dark');
    await page.reload();
    await navbarPage.assertDarkMode(true);
  });

  // NAVIGATION-014: Mobile Bottom Tabs Provide Core Admin Navigation
  test('[NAVIGATION-014] - Mobile Bottom Tabs Provide Core Admin Navigation', async ({ page }) => {
    const { BottomTabPage } = require('../pages/BottomTabPage.js');
    const { SidebarPage } = require('../pages/SidebarPage.js');

    await page.setViewportSize({ width: 375, height: 667 });

    const bottomTabPage = new BottomTabPage(page);
    await bottomTabPage.expectTabsVisible();

    await bottomTabPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await bottomTabPage.expectActiveTab('/rents');

    await bottomTabPage.clickKlien();
    await expect(page).toHaveURL(/\/clients/);
    await bottomTabPage.expectActiveTab('/clients');

    await bottomTabPage.clickKatalog();
    await expect(page).toHaveURL(/\/catalogue/);
    await bottomTabPage.expectActiveTab('/catalogue');

    await page.setViewportSize({ width: 1280, height: 720 });
    const sidebarPage = new SidebarPage(page);
    await expect(sidebarPage.sidebar).toBeVisible();
    await expect(sidebarPage.katalogLink).toBeVisible();
    await expect(sidebarPage.peminjamanLink).toBeVisible();
    await expect(sidebarPage.klienLink).toBeVisible();
  });

  // NAVIGATION-015: Responsive Admin Shell Has No Horizontal Body Scroll
  test('[NAVIGATION-015] - Responsive Admin Shell Has No Horizontal Body Scroll', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of viewports) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);

      const body = page.locator('body');
      const scrollWidth = await body.evaluate(el => el.scrollWidth);
      const clientWidth = await body.evaluate(el => el.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      expect(scrollWidth).toBeLessThanOrEqual(width + 1);
    }
  });
});
