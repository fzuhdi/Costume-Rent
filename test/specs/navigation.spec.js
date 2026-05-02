const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { SidebarPage } = require('../pages/SidebarPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Navigation & UI', () => {
  test.beforeEach(async ({ page }) => {
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
    await expect(sidebarPage.katalogLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
  });

  test('[AC-025-002] - Peminjaman menu links to /rents', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPeminjaman();
    await expect(page).toHaveURL(/\/rents/);
    await expect(sidebarPage.peminjamanLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
  });

  test('[AC-025-003] - Klien menu links to /clients', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickKlien();
    await expect(page).toHaveURL(/\/clients/);
    await expect(sidebarPage.klienLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
  });

  test('[AC-025-004] - Pengaturan menu links to /settings', async ({ page }) => {
    const sidebarPage = new SidebarPage(page);
    await sidebarPage.clickPengaturan();
    await expect(page).toHaveURL(/\/settings/);
    await expect(sidebarPage.pengaturanLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
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
    await expect(page.locator('h1')).toContainText(/404/i);
    await expect(page.locator('text=Halaman Tidak Ditemukan')).toBeVisible();
  });

  // AC-027: Responsive Design
  test('[AC-027-001] - Usable on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('aside')).toBeVisible();
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
});
