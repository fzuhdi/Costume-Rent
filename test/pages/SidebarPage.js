const { BasePage } = require('./BasePage.js');

class SidebarPage extends BasePage {
  constructor(page) {
    super(page);
    this.katalogLink = page.locator('aside a[href="/catalogue"]').first();
    this.peminjamanLink = page.locator('aside a[href="/rents"]').first();
    this.klienLink = page.locator('aside a[href="/clients"]').first();
    this.pengaturanLink = page.locator('aside a[href="/settings"]').first();
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
    const activeLink = this.page.locator(`aside a[href="${path}"]`).first();
    await expect(activeLink).toHaveClass(/bg-\[var\(--primary\)\]\/20/);
  }
}

module.exports = { SidebarPage };
