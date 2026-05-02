const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage.js');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[data-slot="alert"]');
    this.title = page.locator('h1, h2').first();
  }

  async goto() {
    await super.goto('/login');
  }

  async login(email, password) {
    await super.login(email, password);
  }

  async expectError(message) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.title).toBeVisible();
  }
}

module.exports = { LoginPage };
