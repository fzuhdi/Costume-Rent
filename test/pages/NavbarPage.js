const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class NavbarPage extends BasePage {
  constructor(page) {
    super(page);
    this.brand = page.locator('[data-slot="navbar-brand"]');
    this.notificationBell = page.locator('button[aria-label="Notifikasi"]');
    this.notificationBadge = this.page.locator('[data-slot="badge"]').first();
    this.userMenu = page.locator('button[aria-label*="Profil"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
  }

  async goto() {
    await super.goto('/catalogue');
  }

  async clickNotificationBell() {
    await this.notificationBell.click();
    await this.page.waitForTimeout(500);
  }

  async expectNotificationCount(count) {
    await expect(this.notificationBadge).toContainText(count.toString());
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async toggleTheme() {
    const themeToggle = this.page.locator('button[aria-label="Beralih ke mode gelap"], button[aria-label="Beralih ke mode terang"]').first();
    await themeToggle.click();
  }

  async assertDarkMode(enabled) {
    const htmlClass = await this.page.evaluate(() => document.documentElement.className);
    if (enabled) {
      expect(htmlClass).toContain('dark');
    } else {
      expect(htmlClass).not.toContain('dark');
    }
  }

  async assertNotificationBadgeCount(expectedCount) {
    const countText = await this.notificationBadge.textContent();
    const count = parseInt(countText) || 0;
    expect(count).toBe(expectedCount);
  }

  async clickNotificationBell() {
    await this.notificationBell.click();
    const dropdown = this.page.locator('.max-h-80');
    await expect(dropdown).toBeVisible();
  }
}

module.exports = { NavbarPage };
