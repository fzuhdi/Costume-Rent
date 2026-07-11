const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { RentHistoryPage } = require('../pages/RentHistoryPage');
const path = require('path');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';
const DUMMY_RECEIPT = path.resolve(__dirname, '../fixtures/dummy_receipt.png');

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Navigate to /pos and set the event date.
 * Assumes the user is already logged in (called after beforeEach login).
 */
async function navigatePOSAndSetDate(page, dateStr) {
  await page.goto('/pos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.waitFor({ state: 'visible', timeout: 10000 });
  await dateInput.fill(dateStr);
  await page.waitForTimeout(400);

  // Confirm/collapse the date panel if a confirmation button exists
  const continueBtn = page.getByRole('button', { name: /simpan|lanjutkan/i });
  const hasContinue = await continueBtn.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasContinue) {
    await continueBtn.click();
    await page.waitForTimeout(800);
  }
}

/** Add the first visible costume to the cart. */
async function addFirstCostume(page) {
  const card = page.locator('.grid div.cursor-pointer').first();
  await card.waitFor({ state: 'visible', timeout: 15000 });
  await card.click();
  await page.waitForTimeout(400);
}

/** Open the checkout modal via the floating pill. */
async function openCheckoutModal(page) {
  const pill = page.getByRole('button', { name: /lanjut ke pembayaran/i });
  await pill.waitFor({ state: 'visible', timeout: 12000 });
  await pill.click();
  await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 8000 });
}

/** Try to pick the first autocomplete option when typing in the client field. */
async function selectFirstAvailableClient(page) {
  const modal = page.locator('[role="dialog"]');
  const clientInput = modal
    .locator('input[placeholder*="klien" i], [aria-label*="klien" i]')
    .first();

  const hasInput = await clientInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (!hasInput) return;

  await clientInput.fill('a');
  await page.waitForTimeout(800);
  const firstOption = page.locator('[role="option"]').first();
  const optionVisible = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
  if (optionVisible) {
    await firstOption.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('POS & Enhanced Rent Flow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
  });

  // ── POS-001: basic load ──────────────────────────────────────────────────

  test('[POS-001] - POS page loads with date selector', async ({ page }) => {
    await page.goto('/pos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  // ── POS-002: catalogue after date ───────────────────────────────────────

  test('[POS-002] - Catalogue cards appear after date is entered', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(10));
    const cards = page.locator('.grid div.cursor-pointer');
    await cards.first().waitFor({ state: 'visible', timeout: 15000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  // ── POS-003: floating pill ───────────────────────────────────────────────

  test('[POS-003] - Adding a costume shows the floating checkout pill', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(10));
    await addFirstCostume(page);
    await expect(page.getByRole('button', { name: /lanjut ke pembayaran/i })).toBeVisible({ timeout: 8000 });
  });

  // ── POS-004: checkout modal has no ID card checkbox ──────────────────────

  test('[POS-004] - Checkout modal does NOT have ID card checkbox', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(10));
    await addFirstCostume(page);
    await openCheckoutModal(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal.locator('label:has-text("DP Sudah Dibayar")')).toBeVisible();

    const idCardLabel = modal.locator('label:has-text("ID Card")');
    expect(await idCardLabel.isVisible({ timeout: 2000 }).catch(() => false)).toBe(false);
  });

  // ── POS-005: DP uploader expands ────────────────────────────────────────

  test('[POS-005] - DP proof uploader appears when DP checkbox is checked', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(10));
    await addFirstCostume(page);
    await openCheckoutModal(page);

    const modal = page.locator('[role="dialog"]');
    const dpCb = modal.locator('label:has-text("DP Sudah Dibayar") input[type="checkbox"]');
    await dpCb.check();
    await page.waitForTimeout(400);

    // Either a file input is attached or an upload zone prompt is visible
    const fileInput = modal.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 5000 });
    await expect(modal.locator('text=/klik untuk pilih|klik atau seret/i')).toBeVisible({ timeout: 3000 });
  });

  // ── POS-006: checkout without DP → Draft ────────────────────────────────

  test('[POS-006] - Checkout without DP creates a Draft order', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(12));
    await addFirstCostume(page);
    await openCheckoutModal(page);
    await selectFirstAvailableClient(page);

    const modal = page.locator('[role="dialog"]');
    const dpCb = modal.locator('label:has-text("DP Sudah Dibayar") input[type="checkbox"]');
    if (await dpCb.isChecked()) await dpCb.uncheck();

    await page.locator('button[aria-label="Simpan Transaksi"]').click();
    await expect(page).toHaveURL(/\/rents\/\d+/, { timeout: 20000 });
    await expect(page.locator('[data-slot="chip"]:has-text("Draft")')).toBeVisible({ timeout: 10000 });
  });

  // ── POS-007: draft detail has Upgrade button ─────────────────────────────

  test('[POS-007] - Draft order shows "Upgrade ke Dipesan" action button', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(14));
    await addFirstCostume(page);
    await openCheckoutModal(page);
    await selectFirstAvailableClient(page);

    const modal = page.locator('[role="dialog"]');
    const dpCb = modal.locator('label:has-text("DP Sudah Dibayar") input[type="checkbox"]');
    if (await dpCb.isChecked()) await dpCb.uncheck();

    await page.locator('button[aria-label="Simpan Transaksi"]').click();
    await expect(page).toHaveURL(/\/rents\/\d+/, { timeout: 20000 });
    await expect(page.getByRole('button', { name: /upgrade ke dipesan/i })).toBeVisible({ timeout: 10000 });
  });

  // ── POS-008: Upgrade modal has DP amount + proof fields ──────────────────

  test('[POS-008] - Upgrade to Booked modal has DP and proof fields', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(16));
    await addFirstCostume(page);
    await openCheckoutModal(page);
    await selectFirstAvailableClient(page);

    const modal = page.locator('[role="dialog"]');
    const dpCb = modal.locator('label:has-text("DP Sudah Dibayar") input[type="checkbox"]');
    if (await dpCb.isChecked()) await dpCb.uncheck();

    await page.locator('button[aria-label="Simpan Transaksi"]').click();
    await expect(page).toHaveURL(/\/rents\/\d+/, { timeout: 20000 });

    await page.getByRole('button', { name: /upgrade ke dipesan/i }).click();
    const upgradeModal = page.locator('[role="dialog"]');
    await expect(upgradeModal).toBeVisible({ timeout: 5000 });

    // DP number input should be pre-filled > 0
    const dpInput = upgradeModal.locator('input[type="number"]');
    await expect(dpInput).toBeVisible();
    expect(Number(await dpInput.inputValue())).toBeGreaterThan(0);

    // File upload zone must be present
    await expect(upgradeModal.locator('input[type="file"]')).toBeAttached();
  });

  // ── POS-009: Konfirmasi Booked disabled until proof uploaded ─────────────

  test('[POS-009] - Upgrade to Booked button disabled without proof', async ({ page }) => {
    await navigatePOSAndSetDate(page, addDays(18));
    await addFirstCostume(page);
    await openCheckoutModal(page);
    await selectFirstAvailableClient(page);

    const modal = page.locator('[role="dialog"]');
    const dpCb = modal.locator('label:has-text("DP Sudah Dibayar") input[type="checkbox"]');
    if (await dpCb.isChecked()) await dpCb.uncheck();

    await page.locator('button[aria-label="Simpan Transaksi"]').click();
    await expect(page).toHaveURL(/\/rents\/\d+/, { timeout: 20000 });

    await page.getByRole('button', { name: /upgrade ke dipesan/i }).click();
    const upgradeModal = page.locator('[role="dialog"]');
    await expect(upgradeModal).toBeVisible({ timeout: 5000 });

    // Before uploading, the confirm button is disabled
    await expect(upgradeModal.getByRole('button', { name: /konfirmasi booked/i })).toBeDisabled();
  });

  // ── POS-010: Disewakan modal – ID Card mandatory ─────────────────────────

  test('[POS-010] - Disewakan modal has mandatory ID Card checkbox and shows balance', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    // "Dipesan" is the label for booked orders in the filter
    await rentHistoryPage.filterByStatus('Dipesan');
    await page.waitForTimeout(1000);

    const rows = await rentHistoryPage.rentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }

    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    await expect(page.getByRole('button', { name: /disewakan/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /disewakan/i }).click();

    const rentModal = page.locator('[role="dialog"]');
    await expect(rentModal).toBeVisible({ timeout: 5000 });

    // ID Card checkbox visible and checked by default
    const idCb = rentModal.locator('input[type="checkbox"]');
    await expect(idCb).toBeVisible();
    await expect(idCb).toBeChecked();

    // Balance section visible
    await expect(rentModal.getByText(/Sisa Pembayaran/i)).toBeVisible();

    // Button enabled when checkbox is checked
    await expect(rentModal.getByRole('button', { name: /^disewakan$/i })).toBeEnabled();
  });

  // ── POS-011: Disewakan disabled when ID Card unchecked ───────────────────

  test('[POS-011] - Disewakan button disabled when ID Card unchecked', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.filterByStatus('Dipesan');
    await page.waitForTimeout(1000);

    const rows = await rentHistoryPage.rentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }

    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);

    await page.getByRole('button', { name: /disewakan/i }).click();
    const rentModal = page.locator('[role="dialog"]');
    await expect(rentModal).toBeVisible({ timeout: 5000 });

    const idCb = rentModal.locator('input[type="checkbox"]');
    await idCb.uncheck();
    await expect(rentModal.getByRole('button', { name: /^disewakan$/i })).toBeDisabled();
  });

  // ── POS-012: Draft chip visible in list ──────────────────────────────────

  test('[POS-012] - Draft status chip visible in rental list', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.filterByStatus('Draft');
    await page.waitForTimeout(1000);

    const rows = await rentHistoryPage.rentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }

    const firstChip = rentHistoryPage.rentRows.first().locator('[data-slot="chip"]');
    await expect(firstChip).toBeVisible();
    await expect(firstChip).toContainText(/draft/i);
  });

  // ── POS-013: Rincian Pembayaran shown on booked detail ───────────────────

  test('[POS-013] - Rincian Pembayaran section shown on rental detail', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.filterByStatus('Dipesan');
    await page.waitForTimeout(1500);

    const rows = await rentHistoryPage.rentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }

    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText(/Rincian Pembayaran/i)).toBeVisible({ timeout: 8000 });
  });
});
