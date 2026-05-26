const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class BottomTabPage extends BasePage {
  constructor(page) {
    super(page);
    this.tabBar = page.locator('[data-slot="bottom-tabs"]');
    this.katalogTab = page.locator('[data-slot="bottom-tabs"] a[href="/catalogue"], [data-slot="bottom-tabs"] button:has-text("Katalog")').first();
    this.peminjamanTab = page.locator('[data-slot="bottom-tabs"] a[href="/rents"], [data-slot="bottom-tabs"] button:has-text("Peminjaman")').first();
    this.klienTab = page.locator('[data-slot="bottom-tabs"] a[href="/clients"], [data-slot="bottom-tabs"] button:has-text("Klien")').first();
  }

  async expectTabsVisible() {
    await expect(this.tabBar).toBeVisible();
    await expect(this.katalogTab).toBeVisible();
    await expect(this.peminjamanTab).toBeVisible();
    await expect(this.klienTab).toBeVisible();
  }

  async clickKatalog() {
    await this.katalogTab.click();
    await this.page.waitForURL(/\/catalogue/);
  }

  async clickPeminjaman() {
    await this.peminjamanTab.click();
    await this.page.waitForURL(/\/rents/);
  }

  async clickKlien() {
    await this.klienTab.click();
    await this.page.waitForURL(/\/clients/);
  }

  async expectActiveTab(href) {
    const tab = this.page.locator(`[data-slot="bottom-tabs"] a[href="${href}"]`).first();
    await expect(tab).toHaveClass(/active|selected|bg-\[var\(--primary\)\]/);
  }
}

module.exports = { BottomTabPage };
