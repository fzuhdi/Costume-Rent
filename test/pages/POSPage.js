const { BasePage } = require('./BasePage.js');
const path = require('path');

/**
 * POSPage - Page Object Model for the POS (Point of Sale) checkout flow.
 * Covers: date selection, catalogue browsing, cart, and checkout modal.
 */
class POSPage extends BasePage {
  constructor(page) {
    super(page);
    // Date panel
    this.eventDateInput = page.locator('input[type="date"]').first();
    this.continueBtn = page.getByRole('button', { name: /simpan & lanjutkan|lanjutkan/i });

    // Cart pill / checkout trigger
    this.checkoutPill = page.locator('button[aria-label="Lanjut ke Pembayaran"]');

    // Checkout modal elements
    this.dpCheckbox = page.locator('input[type="checkbox"]').first();
    this.proofFileInput = page.locator('input[type="file"]').first();
    this.submitBtn = page.locator('button[aria-label="Simpan Transaksi"]');
    this.cancelBtn = page.locator('button[aria-label="Batal"]');
  }

  async goto() {
    await super.goto('/pos');
  }

  /** Set the event date and collapse the date panel. */
  async setEventDate(dateStr) {
    await this.eventDateInput.fill(dateStr);
    // Click Simpan & Lanjutkan to confirm date
    const continueBtn = this.page.getByRole('button', { name: /simpan|lanjutkan/i });
    const btnVisible = await continueBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (btnVisible) {
      await continueBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /** Add the first available costume to the cart. */
  async addFirstCostumeToCart() {
    const addBtn = this.page
      .locator('button[aria-label^="Tambah"]')
      .first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    await this.page.waitForTimeout(300);
  }

  /** Open the checkout modal via the floating cart pill. */
  async openCheckoutModal() {
    await this.checkoutPill.waitFor({ state: 'visible', timeout: 10000 });
    await this.checkoutPill.click();
    // Wait for modal to appear
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Select an existing client or type a new client name in the combobox.
   */
  async selectClient(name) {
    const combobox = this.page.locator('[aria-label*="Klien"], input[placeholder*="klien"]').first();
    await combobox.fill(name);
    await this.page.waitForTimeout(800);
    const option = this.page.locator(`[role="option"]:has-text("${name}")`).first();
    const optionVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);
    if (optionVisible) {
      await option.click();
    }
  }

  /** Check/uncheck the DP checkbox by the label text. */
  async toggleDpCheckbox(check = true) {
    const dpLabel = this.page.locator('label:has-text("DP Sudah Dibayar")');
    const checkbox = dpLabel.locator('input[type="checkbox"]');
    const current = await checkbox.isChecked();
    if (current !== check) await checkbox.click();
  }

  /** Upload a proof file. Requires an absolute file path. */
  async uploadProofFile(absolutePath) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(absolutePath);
    // Wait for upload spinner to disappear or success indicator
    await this.page.waitForTimeout(1500);
  }

  /**
   * Submit the checkout modal.
   * Returns the new order ID parsed from the resulting URL, or null.
   */
  async submitCheckout() {
    await this.submitBtn.click();
    // Wait for navigation to rent detail page
    await this.page.waitForURL(/\/rents\/\d+/, { timeout: 15000 });
    const url = this.page.url();
    const match = url.match(/\/rents\/(\d+)/);
    return match ? match[1] : null;
  }

  /** Check if the ID card checkbox is visible in the modal. */
  async idCardCheckboxVisible() {
    const checkbox = this.page.locator('label:has-text("ID Card")');
    return checkbox.isVisible({ timeout: 2000 }).catch(() => false);
  }
}

module.exports = { POSPage };
