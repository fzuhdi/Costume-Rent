class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    await this.page.goto(path);
    // Wait for page to load - use networkidle for SPA
    await this.page.waitForLoadState('networkidle').catch(() => {});
    // Extra wait for React to mount
    await this.page.waitForTimeout(1000);
  }

  async login(email = 'admin@busana.com', password = 'admin123') {
    await this.goto('/login');
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/catalogue/, { timeout: 10000 });
  }

  async logout() {
    await this.page.click('button[aria-label*="Profil"]');
    await this.page.locator('button:has-text("Logout")').click();
    await this.page.waitForURL(/\/login/);
  }

  async expectNotification(message) {
    const alert = this.page.locator('[data-slot="alert-root"]');
    await alert.toContainText(message);
  }

  async waitForNavigation(pathPattern) {
    await this.page.waitForURL(new RegExp(pathPattern), { timeout: 10000 });
  }
}

module.exports = { BasePage };
