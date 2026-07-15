const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const path = require('path');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';
// Creating a dummy receipt image is straightforward by using an existing fixture.
const DUMMY_RECEIPT = path.resolve(__dirname, '../fixtures/dummy_receipt.png');

test.describe('E2E POS, Rent Lifecycle, and Rollback Feature', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('should complete a full E2E flow and test Rollback functionality', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'allow-console-error', description: '401' });

    // 1. Navigate to POS
    await page.goto('/pos');
    
    // Set a date (e.g. tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.waitFor({ state: 'visible' });
    await dateInput.fill(dateStr);
    
    // Click 'Simpan & Lanjutkan' if visible
    const continueBtn = page.getByRole('button', { name: /Simpan & Lanjutkan/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }
    
    // 2. Select first costume
    const firstCostume = page.locator('.grid div.cursor-pointer').first();
    await firstCostume.waitFor({ state: 'visible' });
    await firstCostume.click();
    
    // 3. Checkout and Select Client
    const checkoutBtn = page.getByRole('button', { name: /Checkout|Lanjut ke Pembayaran/i });
    await checkoutBtn.waitFor({ state: 'visible' });
    await checkoutBtn.click();
    
    // Select Client 'Budi'
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    const clientInput = modal.locator('input[placeholder*="klien" i], [aria-label*="klien" i]').first();
    await clientInput.waitFor({ state: 'visible' });
    await clientInput.fill('Budi');
    // Wait for dropdown to show
    await page.waitForTimeout(1000);
    const firstOption = page.locator('[role="option"]').first();
    const optionVisible = await firstOption.isVisible({ timeout: 5000 }).catch(() => false);
    if (optionVisible) {
      await firstOption.click();
    } else {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // 4. Create Rent Order (Draft)
    const saveOrderBtn = page.getByRole('button', { name: /Simpan Transaksi/i });
    await saveOrderBtn.click();
    
    // Wait for navigation to /rents/:id
    await page.waitForURL(/\/rents\/\d+/);
    
    // Assert status is Draft
    await expect(page.locator('[data-slot="chip"]:has-text("Draft")')).toBeVisible({ timeout: 10000 });

    // 5. Upgrade to Booked
    const upgradeBookedBtn = page.getByRole('button', { name: 'Ubah Status ke Booked' });
    await upgradeBookedBtn.click();
    
    const downpaymentInput = page.getByRole('spinbutton', { name: 'Downpayment' });
    await downpaymentInput.waitFor({ state: 'visible' });
    // Fill file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(DUMMY_RECEIPT);
    
    const confirmBookedBtn = page.getByRole('button', { name: 'Konfirmasi Booked' });
    await expect(confirmBookedBtn).toBeEnabled({ timeout: 15000 });
    await confirmBookedBtn.click();
    
    // Verify status is Booked
    await expect(page.locator('[data-slot="chip"]:has-text("Dipesan")')).toBeVisible({ timeout: 10000 });

    // 6. Pickup (Mark Rented)
    const pickupBtn = page.getByRole('button', { name: 'Pickup (Mark Rented)' });
    await pickupBtn.click();
    
    const markRentedConfirmBtn = page.getByRole('button', { name: /^Disewakan$/ });
    await markRentedConfirmBtn.waitFor({ state: 'visible' });
    await markRentedConfirmBtn.click();
    
    // Verify status is Rented
    await expect(page.locator('[data-slot="chip"]:has-text("Disewa")')).toBeVisible({ timeout: 10000 });

    // 7. Test Rollback to Booked
    const rollbackBtn = page.getByRole('button', { name: 'Batalkan Status' });
    await rollbackBtn.click();
    
    const confirmRollbackBtn = page.getByRole('button', { name: 'Ya, Batalkan Status' });
    await confirmRollbackBtn.waitFor({ state: 'visible' });
    await confirmRollbackBtn.click();
    
    // Verify status is Booked again
    await expect(page.locator('[data-slot="chip"]:has-text("Dipesan")')).toBeVisible({ timeout: 10000 });

    // 8. Pickup again
    await pickupBtn.click();
    await markRentedConfirmBtn.waitFor({ state: 'visible' });
    await markRentedConfirmBtn.click();
    await expect(page.locator('[data-slot="chip"]:has-text("Disewa")')).toBeVisible({ timeout: 10000 });

    // 9. Return (Pelunasan & Pengembalian)
    const returnBtn = page.getByRole('button', { name: 'Pelunasan & Pengembalian' });
    await returnBtn.click();
    
    // Assume there is a security item returned checkbox
    const idCardCheckbox = page.locator('label').filter({ hasText: /Kartu Identitas/i });
    if (await idCardCheckbox.isVisible()) {
      await idCardCheckbox.click();
    }
    
    const confirmReturnBtn = page.getByRole('button', { name: 'Selesaikan Pengembalian' });
    await confirmReturnBtn.waitFor({ state: 'visible' });
    await confirmReturnBtn.click();
    
    // Verify status is Returned
    await expect(page.locator('[data-slot="chip"]:has-text("Dikembalikan")')).toBeVisible({ timeout: 10000 });
  });
});
