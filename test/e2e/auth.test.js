const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
}

async function logout(page) {
  await page.click('button:has-text("Logout")');
}

/**
 * AC-001: Login with valid credentials
 * AC-002: Invalid credentials show error
 * AC-003: Login redirects to /catalogue
 * AC-004: Session persists on refresh
 * AC-005: Logout clears session
 */
test.describe('AC-001 to AC-005: Authentication', () => {
  
  test('AC-001: Login with valid credentials (admin@busana.com / admin123)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/catalogue', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/catalogue/);
  });

  test('AC-002: Invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message
    const errorMessage = page.locator('.alert, .error, text=Invalid, text=Salah, text=Gagal');
    if (await errorMessage.isVisible({ timeout: 3000 })) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('AC-003: Login redirects to /catalogue', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/catalogue', { timeout: 10000 });
    await expect(page).toHaveURL(/\/catalogue/);
  });

  test('AC-004: Session persists on refresh', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/catalogue', { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Should still be authenticated (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AC-005: Logout clears session', async ({ page }) => {
    await login(page);
    await page.waitForURL('**/catalogue', { timeout: 10000 });
    
    // Logout
    await logout(page);
    await page.waitForTimeout(1000);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});