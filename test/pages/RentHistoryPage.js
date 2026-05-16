const { BasePage } = require('./BasePage.js');

class RentHistoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.rentTable = page.locator('[role="grid"]');
    this.rentRows = page.locator('[role="row"]:has([role="rowheader"])');
    this.addButton = page.locator('button:has-text("Peminjaman Baru")');
    this.statusFilter = page.locator('button:has-text("Semua Status")');
  }

  async goto() {
    await super.goto('/rents');
  }

  async clickNewRent() {
    await this.addButton.click();
    await this.page.waitForURL(/\/rents\/new/);
  }

  async filterByStatus(status) {
    await this.statusFilter.click();
    await this.page.locator(`[role="option"]:has-text("${status}")`).click();
  }

  async clickRentOrder(orderId) {
    const row = this.rentRows.filter({ hasText: `#${orderId}` });
    await row.locator('button:has-text("Detail")').click();
    await this.page.waitForURL(new RegExp(`/rents/${orderId}`));
  }

  async clickFirstRental() {
    await this.rentRows.first().locator('button:has-text("Detail")').click();
    await this.page.waitForURL(/\/rents\/\d+/);
  }

  async expectRentVisible(orderId) {
    await expect(this.rentRows.filter({ hasText: `#${orderId}` })).toBeVisible();
  }

  async searchRental(name) {
    const searchInput = this.page.getByPlaceholder(/cari klien|cari client|search/i);
    await searchInput.fill(name);
    await this.page.waitForTimeout(500);
  }

  async findActiveRental() {
    await this.filterByStatus('Aktif');
    const firstRow = this.rentRows.first();
    const isVisible = await firstRow.isVisible().catch(() => false);
    return isVisible ? firstRow : null;
  }

  async findOverdueRental() {
    await this.filterByStatus('Terlambat');
    const firstRow = this.rentRows.first();
    const isVisible = await firstRow.isVisible().catch(() => false);
    return isVisible ? firstRow : null;
  }
}

module.exports = { RentHistoryPage };
