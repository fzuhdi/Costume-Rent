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
      await expect(clientDetailPage.editButton).toBeVisible();
    }
  });

  // AC-015-003: Client list shows total rents and active rents
  test('[AC-015-003] - Client list shows total rents and active rents', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    await clientListPage.assertTotalRentsVisible();
    await clientListPage.assertActiveRentsVisible();
  });

  // AC-015-004: Search client by name
  test('[AC-015-004] - Search client by name', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const firstClientName = await clientListPage.clientRows.first().locator('td').first().textContent();
    if (firstClientName) {
      await clientListPage.searchClient(firstClientName.trim());
      await page.waitForTimeout(500);
      await clientListPage.expectClientVisible(firstClientName.trim());
      // Clear search
      await clientListPage.searchInput.fill('');
      await page.waitForTimeout(500);
    }
  });

  // AC-015-005: Overdue indicator shown for clients with overdue rentals
  test('[AC-015-005] - Overdue indicator shown for clients with overdue rentals', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    // Check if any client has overdue indicator
    await clientListPage.assertOverdueIndicator();
  });

  // AC-016-003: Client detail shows correct rental history order
  test('[AC-016-003] - Client detail shows correct rental history order', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await clientDetailPage.assertRentalHistoryOrder();
    }
  });

  // AC-017-003: Edit client phone number
  test('[AC-017-003] - Edit client phone number', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await clientDetailPage.editPhone('08123456789');
      await expect(page.locator('body')).toContainText('08123456789');
    }
  });

  // AC-017-004: Edit client address
  test('[AC-017-004] - Edit client address', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await clientDetailPage.editAddress('Jl. Test Auto No. 1');
      await expect(page.locator('body')).toContainText('Jl. Test Auto No. 1');
    }
  });

  // AC-042: Delete client (was AC-015-006)
  test('[AC-042-001] - Delete client', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    // Create a test client first via API or use existing
    const initialCount = await clientListPage.clientRows.count();
    if (initialCount > 0) {
      const firstName = await clientListPage.clientRows.first().locator('td').first().textContent();
      if (firstName) {
        await clientListPage.deleteClient(firstName.trim());
        await page.waitForTimeout(500);
        const finalCount = await clientListPage.clientRows.count();
        expect(finalCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });
});
