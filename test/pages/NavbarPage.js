const { BasePage } = require('./BasePage.js');

class NavbarPage extends BasePage {
  constructor(page) {
    super(page);
    this.brand = page.locator('[data-slot="navbar-brand"]');
    this.notificationBell = page.locator('[data-slot="button"]').filter({ has: page.locator('svg[aria-label="Notifications"]') });
    this.notificationBadge = this.notificationBell.locator('[data-slot="badge"]');
    this.userMenu = page.locator('[data-slot="navbar-content"]').locator('button[aria-label*="User"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
  }

  async goto() {
    await super.goto('/catalogue');
  }

  async clickNotificationBell() {
    await this.notificationBell.click();
  }

  async expectNotificationCount(count) {
    await expect(this.notificationBadge).toContainText(count.toString());
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }
}

module.exports = { NavbarPage };
