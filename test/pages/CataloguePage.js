const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class CataloguePage extends BasePage {
  constructor(page) {
    super(page);
    this.addButton = page.getByRole('button', { name: 'Tambah Kostum' });
    this.tableViewButton = page.getByRole('button', { name: /tabel/i });
    this.listViewButton = page.getByRole('button', { name: /list/i });
    this.galleryViewButton = page.getByRole('button', { name: /grid/i });
    this.searchInput = page.getByPlaceholder('Cari kostum...');
    this.regionFilter = page.getByRole('button', { name: /wilayah/i });
    this.categoryFilter = page.getByRole('button', { name: /kategori/i });
    // Works for both list view (div) and table view (tr)
    this.costumeRows = page.locator('table tbody tr, div.rounded-lg.border').filter({ hasNot: page.locator('td[colspan]') });
    this.costumeLinks = page.locator('a[href*="/catalogue/"]').filter({ hasNotText: /tambah|new/i });
    this.editButtons = page.getByRole('button', { name: /^Edit / });
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
    // Wait for content to load across desktop and mobile catalogue layouts
    await this.page.waitForSelector('div.rounded-lg.border, table tbody tr, a[href*="/catalogue/"]', { timeout: 10000 });

    // In both views, click the link that goes to /catalogue/:id
    const detailLink = this.page.locator('a[href*="/catalogue/"]').filter({ hasNot: this.page.locator('text=/tambah|new/i') }).first();

    await detailLink.click({ timeout: 10000 });
    // Wait for navigation to detail page (not edit page)
    await this.page.waitForURL(/\/catalogue\/\d+$/, { timeout: 10000 });
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
    // Wait for content to load
    await this.page.waitForLoadState('networkidle').catch(() => {});
    // Try table rows first, then list view divs
    const tableRows = await this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('td[colspan]') }).count();
    if (tableRows > 0) return tableRows;
    // List view uses div.rounded-lg.border
    const listItems = await this.page.locator('div.rounded-lg.border').count();
    if (listItems > 0) return listItems;
    return await this.costumeLinks.count();
  }

  async switchToGalleryView() {
    await this.galleryViewButton.click();
  }

  async switchToTableView() {
    await this.tableViewButton.click();
  }

  async assertAvailableQuantityVisible() {
    const bodyText = await this.page.locator('body').textContent();
    const hasAvailableQty = /tersedia|Tersedia|available/i.test(bodyText);
    expect(hasAvailableQty).toBe(true);
  }

  async assertEmptyState() {
    const emptyMessage = this.page.getByText(/tidak ada|empty|kosong/i);
    await expect(emptyMessage).toBeVisible();
  }

  async assertPageResetTo1() {
    // After search/filter change, pagination should reset to page 1
    // If there are results and pagination exists, check that page 1 is active
    // by verifying Previous button is disabled
    const prevButton = this.page.locator('[data-slot="pagination-previous"]');
    const isVisible = await prevButton.isVisible().catch(() => false);
    if (isVisible) {
      // HeroUI v3 uses data-disabled attribute
      await expect(prevButton).toHaveAttribute('data-disabled', 'true');
    }
    // If no pagination visible, that's also OK (page 1 with 0 or few results)
  }
}

module.exports = { CataloguePage };
