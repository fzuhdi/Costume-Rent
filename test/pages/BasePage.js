const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async login(email = 'admin@busana.com', password = 'admin123') {
    await this.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/catalogue/, { timeout: 10000 });
  }

  async logout() {
    await this.page.click('button[aria-label="Logout"]');
    await this.page.waitForURL(/\/login/);
  }

  async expectNotification(message) {
    const alert = this.page.locator('[data-slot="alert"]');
    await expect(alert).toContainText(message);
  }

  async waitForNavigation(pathPattern) {
    await this.page.waitForURL(new RegExp(pathPattern), { timeout: 10000 });
  }
}

module.exports = { BasePage };
