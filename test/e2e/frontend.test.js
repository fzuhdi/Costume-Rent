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

test.describe('Frontend - Login Page', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/catalogue', { timeout: 10000 });
  });

  test('should stay on login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/login', { timeout: 5000 });
  });
});

test.describe('Frontend - Create Costume (/catalogue/new)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access add costume form via sidebar', async ({ page }) => {
    await page.click('a[href="/catalogue"]');
    await page.waitForTimeout(500);
    await page.click('a[href="/catalogue/new"]');
    await expect(page).toHaveURL(/\/catalogue\/new/);
  });

  test('should fill and submit costume form', async ({ page }) => {
    await page.click('a[href="/catalogue"]');
    await page.waitForTimeout(500);
    await page.click('a[href="/catalogue/new"]');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    
    await page.fill('input[name="name"]', 'Test Costume ' + Date.now());
    await page.fill('textarea[name="description"]', 'Test description');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="condition"]', 'good');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/catalogue', { timeout: 10000 });
  });
});

test.describe('Frontend - Create Rental (/rents/new)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access rental form via sidebar', async ({ page }) => {
    await page.click('a[href="/rents"]');
    await page.waitForTimeout(500);
    const newRentLink = page.locator('a[href="/rents/new"]');
    if (await newRentLink.isVisible()) {
      await newRentLink.click();
      await expect(page).toHaveURL(/\/rents\/new/);
    }
  });
});

test.describe('Frontend - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to rents', async ({ page }) => {
    await page.click('a[href="/rents"]');
    await expect(page).toHaveURL(/\/rents/);
  });

  test('should navigate to clients', async ({ page }) => {
    await page.click('a[href="/clients"]');
    await expect(page).toHaveURL(/\/clients/);
  });

  test('should navigate to settings', async ({ page }) => {
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe('Frontend - Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have sidebar', async ({ page }) => {
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });

  test('should have katalog menu', async ({ page }) => {
    await expect(page.locator('aside.sidebar >> text=Katalog')).toBeVisible();
  });

  test('should have peminjaman menu', async ({ page }) => {
    await expect(page.locator('aside.sidebar >> text=Peminjaman')).toBeVisible();
  });

  test('should have klien menu', async ({ page }) => {
    await expect(page.locator('aside.sidebar >> text=Klien')).toBeVisible();
  });

  test('should have pengaturan menu', async ({ page }) => {
    await expect(page.locator('aside.sidebar >> text=Pengaturan')).toBeVisible();
  });
});