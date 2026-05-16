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
  test('[AC-001-001] - Login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('[AC-002-001] - Invalid credentials show error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 3000 });
  });

  test('[AC-004-001] - Session persists on refresh', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('[AC-005-001] - Logout clears session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  // AC-001-002: Login redirects to /catalogue
  test('[AC-001-002] - Login redirects to /catalogue', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL('http://localhost:5173/catalogue');
  });

  // AC-001-003: Auth token stored after login
  test('[AC-001-003] - Auth token stored after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.assertTokenInLocalStorage();
  });

  // AC-002-002: Wrong email shows error
  test('[AC-002-002] - Wrong email shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.fill('input[type="email"]', 'nobody@example.com');
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toBeVisible();
  });

  // AC-002-003: Empty form does not submit
  test('[AC-002-003] - Empty form does not submit', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/login/);
    // No network request to /api/auth/login should be made
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  // AC-003: Route Protection (unauthenticated access)
  test('[AC-003-001] - Unauthenticated /catalogue redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/catalogue');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AC-003-002] - Unauthenticated /rents redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/rents');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AC-003-003] - Unauthenticated /clients redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[AC-003-004] - Unauthenticated /settings redirects to login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  // AC-005-002: Token removed after logout
  test('[AC-005-002] - Token removed from localStorage after logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.logout();
    await loginPage.assertNoTokenInLocalStorage();
  });
});
