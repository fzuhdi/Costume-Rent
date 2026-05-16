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

  // AC-025: Sidebar Navigation
  test('[AC-025-001] - Katalog menu links to /catalogue', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await sidebarPage.clickKatalog();
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(sidebarPage.katalogLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[AC-025-002] - Peminjaman menu links to /rents', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await expect(sidebarPage.peminjamanLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[AC-025-003] - Klien menu links to /clients', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickKlien();
    await expect(page).toHaveURL(/\/clients/);
    await expect(sidebarPage.klienLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  test('[AC-025-004] - Pengaturan menu links to /settings', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPengaturan();
    await expect(page).toHaveURL(/\/settings/);
    await expect(sidebarPage.pengaturanLink).toHaveClass(/bg-\[var\(--primary\)\]\/15/);
  });

  // AC-026: Direct URL Access
  test('[AC-026-001] - All routes accessible via direct URL when authenticated', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/catalogue/);
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/rents/);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/clients/);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('[AC-026-002] - Unauthenticated access redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AC-026-003] - 404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('body')).toContainText(/404|not found|tidak ditemukan/i);
  });

  // AC-027: Responsive Design
  test('[AC-027-001] - Usable on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('aside').first()).toBeVisible();
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const layout = await page.locator('.app-layout').isVisible().catch(() => false);
    expect(layout).toBeTruthy();
  });

  test('[AC-027-002] - Usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  // AC-025-005: Active sidebar link is highlighted
  test('[AC-025-005] - Active sidebar link is highlighted', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    // Check that "Peminjaman" link has active styling
    const className = await sidebarPage.peminjamanLink.getAttribute('class');
    expect(className).toMatch(/bg-\[var\(--primary\)\]\/15/);
  });

  // AC-026-004: 404 page has link back to catalogue
  test('[AC-026-004] - 404 page has link back to catalogue', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    const catalogueLink = page.locator('a[href="/catalogue"], button:has-text("Katalog")').first();
    await expect(catalogueLink).toBeVisible();
  });

  // AC-027-003: Dark mode toggle switches theme (AC-041)
  test('[AC-027-003] - Dark mode toggle switches theme', async ({ page }) => {
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

  // AC-027-004: Dark mode preference persists on reload (AC-041)
  test('[AC-027-004] - Dark mode preference persists on reload', async ({ page }) => {
    const navbarPage = new (require('../pages/NavbarPage.js')).NavbarPage(page);
    await navbarPage.toggleTheme();
    const theme = await page.evaluate(() => localStorage.getItem('heroui-theme'));
    expect(theme).toBe('dark');
    await page.reload();
    await navbarPage.assertDarkMode(true);
  });
});
