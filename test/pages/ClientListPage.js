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

  async expectClientVisible(name) {
    await expect(this.clientRows.filter({ hasText: name })).toBeVisible();
  }
}

module.exports = { ClientListPage };
