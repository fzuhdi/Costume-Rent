const { BasePage } = require('./BasePage.js');

class ClientListPage extends BasePage {
  constructor(page) {
    super(page);
    this.clientTable = page.locator('[data-slot="table"]');
    this.clientRows = page.locator('[data-slot="table-row"]');
    this.addButton = page.locator('button:has-text("Add Client")');
    this.searchInput = page.locator('input[placeholder*="Search"]');
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
    await this.clientRows.filter({ hasText: name }).click();
    await this.page.waitForURL(/\/clients\/\d+/);
  }

  async clickFirstClient() {
    await this.clientRows.first().click();
    await this.page.waitForURL(/\/clients\/\d+/);
  }

  async expectClientVisible(name) {
    await expect(this.clientRows.filter({ hasText: name })).toBeVisible();
  }

  async assertTotalRentsVisible() {
    const bodyText = await this.page.locator('body').textContent();
    const hasRents = /total sewa|total rents|jumlah sewa/i.test(bodyText);
    expect(hasRents).toBe(true);
  }

  async assertActiveRentsVisible() {
    const bodyText = await this.page.locator('body').textContent();
    const hasActive = /aktif|active/i.test(bodyText);
    expect(hasActive).toBe(true);
  }

  async assertOverdueIndicator() {
    const overdueBadge = this.page.locator('[data-slot="badge"]').filter({ hasText: /terlambat|overdue/i });
    await expect(overdueBadge.first()).toBeVisible();
  }

  async deleteClient(name) {
    // Find the client row and click delete button
    const row = this.clientRows.filter({ hasText: name });
    const deleteButton = row.locator('button').filter({ hasText: /hapus|delete/i });
    await deleteButton.click();
    // Handle confirmation dialog
    this.page.once('dialog', dialog => dialog.accept());
  }
}

module.exports = { ClientListPage };
