const { BasePage } = require('./BasePage.js');

class CatalogueFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.nameInput = page.locator('[data-slot="input"]').filter({ has: page.locator('input[name="name"]') });
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.regionSelect = page.locator('[data-slot="select-trigger"]').first();
    this.categorySelect = page.locator('[data-slot="select-trigger"]').nth(1);
    this.conditionSelect = page.locator('[data-slot="select-trigger"]').nth(2);
    this.quantityInput = page.locator('[data-slot="input"]').filter({ has: page.locator('input[name="quantity"]') });
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto(costumeId = null) {
    const path = costumeId ? `/catalogue/${costumeId}/edit` : '/catalogue/new';
    await super.goto(path);
  }

  async fillForm({ name, description, region, category, condition, quantity }) {
    if (name) await this.nameInput.fill(name);
    if (description) await this.descriptionInput.fill(description);
    if (region) {
      await this.regionSelect.click();
      await this.page.locator(`[data-slot="select-item"]:has-text("${region}")`).click();
    }
    if (category) {
      await this.categorySelect.click();
      await this.page.locator(`[data-slot="select-item"]:has-text("${category}")`).click();
    }
    if (condition) {
      await this.conditionSelect.click();
      await this.page.locator(`[data-slot="select-item"]:has-text("${condition}")`).click();
    }
    if (quantity) await this.quantityInput.fill(quantity.toString());
  }

  async submit() {
    await this.submitButton.click();
  }
}

module.exports = { CatalogueFormPage };
