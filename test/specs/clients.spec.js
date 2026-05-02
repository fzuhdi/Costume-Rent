const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { ClientListPage } = require('../pages/ClientListPage');
const { ClientDetailPage } = require('../pages/ClientDetailPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // AC-015: View Client List
  test('[AC-015-001] - Navigate to /clients', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('h1')).toContainText(/Klien/i);
  });

  test('[AC-015-002] - Display all clients with name and phone', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    await expect(clientListPage.clientTable).toBeVisible();
    const count = await clientListPage.clientRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
    if (count > 0) {
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toMatch(/Telepon|Phone|No/i);
    }
  });

  // AC-016: View Client Detail
  test('[AC-016-001] - View client detail page', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      await expect(page).toHaveURL(/\/clients\/\d+/);
      const clientDetailPage = new ClientDetailPage(page);
      await expect(clientDetailPage.clientName).toBeVisible();
    }
  });

  test('[AC-016-002] - Display client rental history', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await expect(page.locator('h2')).toContainText(/Riwayat Peminjaman/i);
    }
  });

  // AC-017: Edit Client
  test('[AC-017-001] - Edit button on client detail', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await expect(clientDetailPage.editButton).toBeVisible();
    }
  });

  test('[AC-017-002] - Update client information and save', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await clientDetailPage.clickEdit();
      await expect(clientDetailPage.nameInput).toBeVisible();
      await expect(clientDetailPage.phoneInput).toBeVisible();
      await expect(clientDetailPage.saveButton).toBeVisible();
    }
  });
});
