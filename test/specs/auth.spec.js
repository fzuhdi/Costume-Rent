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
    await loginPage.login('wrong@test.com', 'wrongpass');
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
});
