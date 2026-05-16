const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class ClientListPage extends BasePage {
  constructor(page) {
    super(page);
    this.clientRows = page.locator('[role="row"]:has([role="rowheader"])');
    this.addButton = page.locator('button:has-text("Tambah Klien")');
    this.searchInput = page.getByPlaceholder(/cari nama klien/i);
  }

  async goto() {
    await super.goto('/clients');
  }

  async clickAddClient() {
    await this.addButton.click();
    await this.page.waitForURL(/\/clients\/new/);
  }

  async searchClient(name) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(500);
  }

  async clickClient(name) {
    const link = this.clientRows.filter({ hasText: name }).locator('a').first();
    await link.click();
    await this.page.waitForURL(/\/clients\/\d+/);
  }

  async clickFirstClient() {
    const link = this.clientRows.first().locator('a').first();
    await link.click();
    await this.page.waitForURL(/\/clients\/\d+/);
  }

  async expectClientVisible(name) {
    await expect(this.clientRows.filter({ hasText: name })).toBeVisible();
  }

  async assertTotalRentsVisible() {
    await expect(this.page.locator('[role="grid"]')).toContainText(/total pinjaman|total sewa|jumlah sewa/i);
  }

  async assertActiveRentsVisible() {
    await expect(this.page.locator('body')).toContainText(/aktif|active/i);
  }

  async assertOverdueIndicator() {
    const overdueBadge = this.page.locator('body').filter({ hasText: /terlambat|overdue/i });
    await expect(overdueBadge).toBeVisible();
  }

  async deleteClient(name) {
    const row = this.clientRows.filter({ hasText: name });
    const deleteButton = row.locator('button').filter({ hasText: /hapus|delete/i });
    await deleteButton.click();
    this.page.once('dialog', dialog => dialog.accept());
  }
}

module.exports = { ClientListPage };
