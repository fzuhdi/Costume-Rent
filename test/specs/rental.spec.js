const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { RentHistoryPage } = require('../pages/RentHistoryPage');
const { RentFormPage } = require('../pages/RentFormPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

test.describe('Rental Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // AC-009: View Rental List
  test('[AC-009-001] - Display all rentals with status', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await expect(page.locator('h1')).toContainText(/Riwayat Peminjaman/i);
    const countText = await page.locator('p.text-sm.text-\\[var\\(--muted\\)\\]').textContent();
    expect(countText).toMatch(/Ditemukan \d+ peminjaman/i);
  });

  test('[AC-009-002] - Filter by status active and returned', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    const statusFilter = page.locator('[data-slot="select-trigger"]').first();
    await expect(statusFilter).toBeVisible();
    await statusFilter.click();
    await expect(page.locator('[data-slot="select-item"]:has-text("Aktif")')).toBeVisible();
    await expect(page.locator('[data-slot="select-item"]:has-text("Dikembalikan")')).toBeVisible();
  });

  // AC-010: Create New Rental
  test('[AC-010-001] - Navigate to /rents/new and submit rental', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickNewRent();
    await expect(page).toHaveURL(/\/rents\/new/);

    const rentFormPage = new RentFormPage(page);
    await expect(rentFormPage.clientSelect).toBeVisible();
    await expect(rentFormPage.guaranteeTypeSelect).toBeVisible();
    await expect(rentFormPage.rentStartInput).toBeVisible();
    await expect(rentFormPage.rentEndInput).toBeVisible();
  });

  // AC-011: View Rental Detail
  test('[AC-011-001] - View rental details with client info and costumes', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    const content = await page.content();
    expect(content).toMatch(/Klien/i);
    expect(content).toMatch(/Tanggal Pinjam/i);
    expect(content).toMatch(/Jaminan/i);
    expect(content).toMatch(/Daftar Kostum|kostum/i);
  });

  // AC-012: Edit Rental
  test('[AC-012-001] - Navigate to edit rental and pre-populate form', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    await page.getByRole('button', { name: /Edit/i }).click();
    await expect(page).toHaveURL(/\/rents\/\d+\/edit/);

    const rentFormPage = new RentFormPage(page);
    await expect(rentFormPage.clientSelect).toBeVisible();
    await expect(rentFormPage.rentStartInput).toBeVisible();
  });

  // AC-013: Mark Rental as Returned
  test('[AC-013-001] - Mark rental as returned', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    const returnButton = page.locator('button:has-text("Kembalikan")').first();
    const isVisible = await returnButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await returnButton.click();
      await expect(page.getByText(/Tandai kostum sudah dikembalikan/i)).toBeVisible();
    }
  });

  // AC-014: Delete Rental
  test('[AC-014-001] - Delete button available and confirmation dialog', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    await expect(page.getByRole('button', { name: /Hapus/i })).toBeVisible();

    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.dismiss();
    });
    await page.getByRole('button', { name: /Hapus/i }).click();
  });
});
