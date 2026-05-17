const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { CataloguePage } = require('../pages/CataloguePage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  // Assert login page is not blank
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  
});
test.describe('Authentication', () => {
  test('[AUTH-001] - Login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('[AUTH-002] - Invalid credentials show error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 3000 });
  });

  test('[AUTH-003] - Session persists on refresh', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('[AUTH-004] - Logout clears session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH-005: Login redirects to /catalogue
  test('[AUTH-005] - Login redirects to /catalogue', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL('http://localhost:5173/catalogue');
  });

  // AUTH-006: Auth token stored after login
  test('[AUTH-006] - Auth token stored after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.assertTokenInLocalStorage();
  });

  // AUTH-007: Wrong email shows error
  test('[AUTH-007] - Wrong email shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.fill('input[type="email"]', 'nobody@example.com');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toBeVisible();
  });

  // AUTH-008: Empty form does not submit
  test('[AUTH-008] - Empty form does not submit', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/login/);
    // No network request to /api/auth/login should be made
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  // AUTH: Route Protection (unauthenticated access)
  test('[AUTH-009] - Unauthenticated /catalogue redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AUTH-010] - Unauthenticated /rents redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AUTH-011] - Unauthenticated /clients redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AUTH-012] - Unauthenticated /settings redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH-013: Token removed after logout
  test('[AUTH-013] - Token removed from localStorage after logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.logout();
    await loginPage.assertNoTokenInLocalStorage();
  });
});
