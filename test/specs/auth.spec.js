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

  // AUTH-014: Login Uses Theme-Aware Mobile Layout
  test('[AUTH-014] - Login uses theme-aware mobile layout', async ({ page }) => {
    // Set mobile viewport (iPhone 6/7/8)
    await page.setViewportSize({ width: 375, height: 667 });

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // 1. VERIFY MOBILE USABILITY: form elements are visible at mobile viewport
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // 2. VERIFY THEME AWARENESS:
    // Capture the computed background color in light mode
    const lightBg = await page.evaluate(() => {
      const container = document.querySelector('[aria-label="Login page"]');
      return window.getComputedStyle(container).backgroundColor;
    });

    // Switch to dark mode via media query emulation
    await page.emulateMedia({ colorScheme: 'dark' });

    const darkBg = await page.evaluate(() => {
      const container = document.querySelector('[aria-label="Login page"]');
      return window.getComputedStyle(container).backgroundColor;
    });

    // Theme-aware: background color MUST change between light and dark mode
    // bg-gray-50 = rgb(249, 250, 251) is a hardcoded light-only color
    // If the page still uses bg-gray-50 in dark mode, this assertion will FAIL
    expect(darkBg).not.toBe(lightBg);

    // 3. VERIFY VALID CREDENTIALS at mobile viewport
    await page.emulateMedia({ colorScheme: 'no-preference' });
    await page.goto('/login');
    await loginPage.expectOnLoginPage();
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/catalogue/);

    // 4. VERIFY INVALID CREDENTIALS at mobile viewport
    await page.goto('/login');
    await loginPage.expectOnLoginPage();
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 5000 });

    // 5. VERIFY EMPTY FORM at mobile viewport
    await page.goto('/login');
    await loginPage.expectOnLoginPage();
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});