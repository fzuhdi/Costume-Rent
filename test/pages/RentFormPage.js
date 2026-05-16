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

  async addNewClient(name, phone, address) {
    // Click the client select and choose "create new" option
    await this.clientSelect.click();
    await this.page.getByRole('option', { name: /klien baru|new client/i }).click();
    // Fill new client form
    await this.page.getByPlaceholder(/nama klien|client name/i).fill(name);
    await this.page.getByPlaceholder(/telepon|phone/i).fill(phone);
    await this.page.getByPlaceholder(/alamat|address/i).fill(address);
  }

  async assertErrorMessage(message) {
    const errorAlert = this.page.locator('[data-slot="alert"]');
    await expect(errorAlert).toBeVisible();
    if (message) {
      await expect(errorAlert).toContainText(message);
    }
  }

  async getAvailableQuantityForCostume(costumeName) {
    // Find the costume in the multi-select and read its available quantity
    const costumeItem = this.page.getByText(costumeName).locator('..').locator('..');
    const text = await costumeItem.textContent();
    const match = text.match(/tersedia[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
}

module.exports = { RentFormPage };
