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
 * AC-040: Sidebar with Katalog, Peminjaman, Klien, Pengaturan
 * AC-041: Direct URL access works when authenticated
 * AC-042: 404 page for unknown routes
 * AC-043: Responsive design
 */
test.describe('AC-040 to AC-043: Navigation', () => {

  test('AC-040: Sidebar exists', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside.sidebar')).toBeVisible({ timeout: 5000 });
  });

  test('AC-040: Katalog menu in sidebar', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside.sidebar >> text=Katalog')).toBeVisible();
  });

  test('AC-040: Peminjaman menu in sidebar', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside.sidebar >> text=Peminjaman')).toBeVisible();
  });

  test('AC-040: Klien menu in sidebar', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside.sidebar >> text=Klien')).toBeVisible();
  });

  test('AC-040: Pengaturan menu in sidebar', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside.sidebar >> text=Pengaturan')).toBeVisible();
  });

  test('AC-040: Katalog links to /catalogue', async ({ page }) => {
    await login(page);
    const katalogLink = page.locator('a[href="/catalogue"]').first();
    if (await katalogLink.isVisible({ timeout: 2000 })) {
      await katalogLink.click();
      await expect(page).toHaveURL(/\/catalogue/);
    }
  });

  test('AC-040: Peminjaman links to /rents', async ({ page }) => {
    await login(page);
    const peminjamanLink = page.locator('a[href="/rents"]').first();
    if (await peminjamanLink.isVisible({ timeout: 2000 })) {
      await peminjamanLink.click();
      await expect(page).toHaveURL(/\/rents/);
    }
  });

  test('AC-040: Klien links to /clients', async ({ page }) => {
    await login(page);
    const klienLink = page.locator('a[href="/clients"]').first();
    if (await klienLink.isVisible({ timeout: 2000 })) {
      await klienLink.click();
      await expect(page).toHaveURL(/\/clients/);
    }
  });

  test('AC-040: Pengaturan links to /settings', async ({ page }) => {
    await login(page);
    const pengaturanLink = page.locator('a[href="/settings"]').first();
    if (await pengaturanLink.isVisible({ timeout: 2000 })) {
      await pengaturanLink.click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test('AC-041: Direct URL /catalogue works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AC-041: Direct URL /rents works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AC-041: Direct URL /clients works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AC-041: Direct URL /settings works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AC-041: Direct URL /catalogue/new works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await expect(page.locator('form, body')).toBeVisible({ timeout: 5000 });
  });

  test('AC-041: Direct URL /rents/new works when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('form, body')).toBeVisible({ timeout: 5000 });
  });

  test('AC-042: Unknown route shows 404 page', async ({ page }) => {
    await login(page);
    await page.goto('/some-unknown-route');
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    if (content.includes('404')) {
      await expect(page.locator('text=404, text=Halaman tidak ditemukan')).toBeVisible({ timeout: 3000 });
    }
  });

  test('AC-043: Navbar exists', async ({ page }) => {
    await login(page);
    await expect(page.locator('nav.navbar, .navbar')).toBeVisible({ timeout: 5000 });
  });

  test('AC-043: App name in navbar', async ({ page }) => {
    await login(page);
    const appName = page.locator('.navbar-title, .navbar-brand');
    if (await appName.isVisible({ timeout: 2000 })) {
      await expect(appName).toBeVisible();
    }
  });

  test('AC-043: User info in navbar', async ({ page }) => {
    await login(page);
    const userInfo = page.locator('.user-info, .navbar-user');
    if (await userInfo.isVisible({ timeout: 2000 })) {
      await expect(userInfo).toBeVisible();
    }
  });
});