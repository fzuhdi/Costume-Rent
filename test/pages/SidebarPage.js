const { BasePage } = require('./BasePage.js');

class SidebarPage extends BasePage {
  constructor(page) {
    super(page);
    this.katalogLink = page.locator('a[href="/catalogue"]');
    this.peminjamanLink = page.locator('a[href="/rents"]');
    this.klienLink = page.locator('a[href="/clients"]');
    this.pengaturanLink = page.locator('a[href="/settings"]');
    this.sidebar = page.locator('aside');
  }

  async clickKatalog() {
    await this.katalogLink.click();
    await this.page.waitForURL(/\/catalogue/);
  }

  async clickPeminjaman() {
    await this.peminjamanLink.click();
    await this.page.waitForURL(/\/rents/);
  }

  async clickKlien() {
    await this.klienLink.click();
    await this.page.waitForURL(/\/clients/);
  }

  async clickPengaturan() {
    await this.pengaturanLink.click();
    await this.page.waitForURL(/\/settings/);
  }

  async expectActiveLink(path) {
    const activeLink = this.page.locator(`a[href="${path}"]`);
    await expect(activeLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
  }
}

module.exports = { SidebarPage };
