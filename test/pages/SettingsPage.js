const { BasePage } = require('./BasePage.js');

class SettingsPage extends BasePage {
  constructor(page) {
    super(page);
    this.appNameInput = page.locator('input[placeholder="Costume Rental"]');
    this.taglineInput = page.locator('input[placeholder="Inventory & Rental Management"]');
    this.logoUpload = page.locator('input[type="file"][accept="image/*"]');
    this.logoPreview = page.locator('.w-20.h-20 img');
    this.saveButton = page.locator('button:has-text("Simpan Perubahan")');
    this.successMessage = page.locator('chip:has-text("berhasil disimpan")');
    this.previewAppName = page.locator('.h-12 span.font-bold');
  }

  async goto() {
    await super.goto('/settings');
  }

  async editAppName(name) {
    await this.appNameInput.click({ clickCount: 3 });
    await this.appNameInput.fill(name);
  }

  async editTagline(tagline) {
    await this.taglineInput.click({ clickCount: 3 });
    await this.taglineInput.fill(tagline);
  }

  async uploadLogo(filePath) {
    await this.logoUpload.setInputFiles(filePath);
  }

  async save() {
    await this.saveButton.click();
  }

  async expectSaved() {
    await expect(this.page.locator('text=Pengaturan berhasil disimpan')).toBeVisible({ timeout: 5000 });
  }

  async assertAppNamePrepopulated() {
    const value = await this.appNameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  }

  async assertSuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 5000 });
  }
}

module.exports = { SettingsPage };
