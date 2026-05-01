const { BasePage } = require('./BasePage.js');

class RentFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.clientSelect = page.locator('[data-slot="select-trigger"]').first();
    this.guaranteeTypeSelect = page.locator('[data-slot="select-trigger"]').nth(1);
    this.guaranteeNumberInput = page.locator('[data-slot="input"]').filter({ has: page.locator('input[name="guarantee_number"]') });
    this.rentStartInput = page.locator('input[name="rent_start"]');
    this.rentEndInput = page.locator('input[name="rent_end"]');
    this.costumeSelect = page.locator('[data-slot="select-trigger"]').nth(2);
    this.notesInput = page.locator('textarea[name="notes"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto(rentId = null) {
    const path = rentId ? `/rents/${rentId}/edit` : '/rents/new';
    await super.goto(path);
  }

  async selectClient(clientName) {
    await this.clientSelect.click();
    await this.page.locator(`[data-slot="select-item"]:has-text("${clientName}")`).click();
  }

  async fillGuarantee(type, number) {
    if (type) {
      await this.guaranteeTypeSelect.click();
      await this.page.locator(`[data-slot="select-item"]:has-text("${type}")`).click();
    }
    if (number) await this.guaranteeNumberInput.fill(number);
  }

  async fillDates(start, end) {
    if (start) await this.rentStartInput.fill(start);
    if (end) await this.rentEndInput.fill(end);
  }

  async addCostume(costumeName, quantity = 1) {
    await this.costumeSelect.click();
    await this.page.locator(`[data-slot="select-item"]:has-text("${costumeName}")`).click();
    if (quantity > 1) {
      const qtyInput = this.page.locator('input[name="quantity"]').last();
      await qtyInput.fill(quantity.toString());
    }
  }

  async fillNotes(notes) {
    if (notes) await this.notesInput.fill(notes);
  }

  async submit() {
    await this.submitButton.click();
  }
}

module.exports = { RentFormPage };
