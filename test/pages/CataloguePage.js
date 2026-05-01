const { BasePage } = require('./BasePage.js');

class CataloguePage extends BasePage {
  constructor(page) {
    super(page);
    this.addButton = page.locator('button:has-text("Add Costume")');
    this.tableViewButton = page.locator('button[aria-label="Table View"]');
    this.galleryViewButton = page.locator('button[aria-label="Gallery View"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.regionFilter = page.locator('[data-slot="select-trigger"]').first();
    this.categoryFilter = page.locator('[data-slot="select-trigger"]').nth(1);
    this.costumeCards = page.locator('[data-slot="card-root"]');
    this.costumeTable = page.locator('[data-slot="table"]');
  }

  async goto() {
    await super.goto('/catalogue');
  }

  async clickAddCostume() {
    await this.addButton.click();
    await this.page.waitForURL(/\/catalogue\/new/);
  }

  async searchCostume(name) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(500); // Debounce
  }

  async selectRegion(region) {
    await this.regionFilter.click();
    await this.page.locator(`[data-slot="select-item"]:has-text("${region}")`).click();
  }

  async selectCategory(category) {
    await this.categoryFilter.click();
    await this.page.locator(`[data-slot="select-item"]:has-text("${category}")`).click();
  }

  async clickCostume(name) {
    await this.costumeCards.filter({ hasText: name }).click();
    await this.page.waitForURL(/\/catalogue\/\d+/);
  }

  async expectCostumeVisible(name) {
    await expect(this.costumeCards.filter({ hasText: name })).toBeVisible();
  }

  async switchToGalleryView() {
    await this.galleryViewButton.click();
  }

  async switchToTableView() {
    await this.tableViewButton.click();
  }
}

module.exports = { CataloguePage };
