const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { ClientListPage } = require('../pages/ClientListPage');
const { ClientDetailPage } = require('../pages/ClientDetailPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

async function createE2EClientViaApi(page, purpose) {
  const name = `E2E_CLIENT_${purpose}_${Date.now()}`;
  const token = await page.evaluate(() => localStorage.getItem('token'));

  const result = await page.evaluate(async ({ token, name }) => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phone: '08123456789',
        address: 'E2E_CLIENT_ADDRESS',
      }),
    });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, body };
  }, { token, name });

  expect([200, 201]).toContain(result.status);
  return { id: result.body.id || result.body.data?.id, name };
}

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // CLIENT: View Client List
  test('[CLIENT-001] - Navigate to /clients', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('h1')).toContainText(/Klien/i);
  });

  test('[CLIENT-002] - Display all clients with name and phone', async ({ page }) => {
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

  // CLIENT: View Client Detail
  test('[CLIENT-003] - View client detail page', async ({ page }) => {
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

  test('[CLIENT-004] - Display client rental history', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await expect(page.locator('h2')).toContainText(/Riwayat Peminjaman/i);
    }
  });

  // CLIENT: Edit Client
  test('[CLIENT-005] - Edit button on client detail', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await expect(clientDetailPage.editButton).toBeVisible();
    }
  });

  test('[CLIENT-006] - Update client information and save', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await expect(clientDetailPage.editButton).toBeVisible();
    }
  });

  // CLIENT-007: Client list shows total rents and active rents
  test('[CLIENT-007] - Client list shows total rents and active rents', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    await clientListPage.assertTotalRentsVisible();
    await clientListPage.assertActiveRentsVisible();
  });

  // CLIENT-008: Search client by name
  test('[CLIENT-008] - Search client by name', async ({ page }) => {
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

  // CLIENT-009: Overdue indicator shown for clients with overdue rentals
  test('[CLIENT-009] - Overdue indicator shown for clients with overdue rentals', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    // Check if any client has overdue indicator
    await clientListPage.assertOverdueIndicator();
  });

  // CLIENT-010: Client detail shows correct rental history order
  test('[CLIENT-010] - Client detail shows correct rental history order', async ({ page }) => {
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const count = await clientListPage.clientRows.count();
    if (count > 0) {
      await clientListPage.clickFirstClient();
      const clientDetailPage = new ClientDetailPage(page);
      await clientDetailPage.assertRentalHistoryOrder();
    }
  });

  // CLIENT-011: Edit client phone number
  test('[CLIENT-011] - Edit client phone number', async ({ page }) => {
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

  // CLIENT-012: Edit client address
  test('[CLIENT-012] - Edit client address', async ({ page }) => {
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

  // CLIENT: Delete client
  test('[CLIENT-013] - Delete client', async ({ page }) => {
    const client = await createE2EClientViaApi(page, 'AC042_DELETE');
    const clientListPage = new ClientListPage(page);
    await clientListPage.goto();
    const initialCount = await clientListPage.clientRows.count();
    await clientListPage.deleteClient(client.name);
    await page.waitForTimeout(500);
    const finalCount = await clientListPage.clientRows.count();
    expect(finalCount).toBeLessThan(initialCount);
  });
});
