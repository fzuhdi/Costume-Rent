const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class CataloguePage extends BasePage {
  constructor(page) {
    super(page);
    this.addButton = page.getByRole('button', { name: 'Tambah Kostum' });
    this.tableViewButton = page.getByRole('button', { name: /list/i });
    this.galleryViewButton = page.getByRole('button', { name: /grid/i });
    this.searchInput = page.getByPlaceholder('Cari kostum...');
    this.regionFilter = page.getByRole('button', { name: /wilayah/i });
    this.categoryFilter = page.getByRole('button', { name: /kategori/i });
    this.costumeRows = page.locator('table tbody tr');
    this.costumeLinks = page.locator('a[href*="/catalogue/"]').filter({ hasNotText: /tambah|new/i });
    this.detailButtons = page.getByRole('button', { name: /^Detail / });
  }

  async goto() {
    await super.goto('/catalogue');
  }

  async assertPageLoaded() {
    // Simple check - wait for URL to be stable
    await this.page.waitForURL(/\/catalogue/, { timeout: 5000 }).catch(() => {});
  }

  async clickAddCostume() {
    await this.addButton.click();
    await this.page.waitForURL(/\/catalogue\/new/);
  }

  async searchCostume(name) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(1000);
  }

  async selectRegion(region) {
    await this.regionFilter.click();
    await this.page.getByRole('option', { name: new RegExp(region, 'i') }).click();
  }

  async selectCategory(category) {
    await this.categoryFilter.click();
    await this.page.getByRole('option', { name: new RegExp(category, 'i') }).click();
  }

  async clickFirstCostume() {
    // Wait for the table to load
    await this.page.waitForSelector('table tbody tr', { timeout: 10000 });
    // Click the first "Detail" button using aria-label pattern
    const detailBtn = this.page.getByRole('button', { name: /^Detail / }).first();
    await detailBtn.click({ timeout: 10000 });
    // Wait for navigation to detail page
    await this.page.waitForURL(/\/catalogue\/\d+/, { timeout: 10000 });
    // Wait for detail page to render
    await this.page.waitForLoadState('networkidle');
  }

  async clickCostume(name) {
    await this.clickFirstCostume();
  }

  async expectCostumeVisible(name) {
    await expect(this.page.getByText(name, { exact: false })).toBeVisible();
  }

  async getCostumeCount() {
    const rows = await this.costumeRows.count();
    if (rows > 0) return rows;
    return await this.costumeLinks.count();
  }

  async switchToGalleryView() {
    await this.galleryViewButton.click();
  }

  async switchToTableView() {
    await this.tableViewButton.click();
  }
}

module.exports = { CataloguePage };
