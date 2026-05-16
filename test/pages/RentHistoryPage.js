const { BasePage } = require('./BasePage.js');

class RentHistoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.rentTable = page.locator('[data-slot="table"]');
    this.rentRows = page.locator('[data-slot="table-row"]');
    this.addButton = page.locator('button:has-text("New Rent")');
    this.statusFilter = page.locator('[data-slot="select-trigger"]').first();
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
    await this.page.locator(`[data-slot="select-item"]:has-text("${status}")`).click();
  }

  async clickRentOrder(orderId) {
    await this.rentRows.filter({ hasText: `#${orderId}` }).click();
    await this.page.waitForURL(new RegExp(`/rents/${orderId}`));
  }

  async clickFirstRental() {
    await this.rentRows.first().click();
    await this.page.waitForURL(/\/rents\/\d+/);
  }

  async expectRentVisible(orderId) {
    await expect(this.rentRows.filter({ hasText: `#${orderId}` })).toBeVisible();
  }

  async searchRental(name) {
    const searchInput = this.page.getByPlaceholder(/cari client|search/i);
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
