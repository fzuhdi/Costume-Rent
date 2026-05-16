const { BasePage } = require('./BasePage.js');

class RentFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.clientSelect = page.getByRole('combobox', { name: /klien/i });
    this.clientSuggestionsButton = page.locator('button[aria-label="Show suggestions"]');
    this.guaranteeTypeSelect = page.locator('button:has-text("KTP")');
    this.guaranteeNumberInput = page.locator('input').nth(2);
    this.rentStartInput = page.locator('input[type="date"]').first();
    this.rentEndInput = page.locator('input[type="date"]').nth(1);
    this.costumeSearchInput = page.getByPlaceholder(/cari kostum/i);
    this.notesInput = page.locator('textarea');
    this.submitButton = page.locator('button:has-text("Simpan")');
    this.cancelButton = page.locator('button:has-text("Batal")');
  }

  async goto(rentId = null) {
    const path = rentId ? `/rents/${rentId}/edit` : '/rents/new';
    await super.goto(path);
  }

  async selectClient(clientName) {
    await this.clientSelect.fill(clientName);
    await this.page.getByRole('option', { name: new RegExp(clientName, 'i') }).click();
  }

  async fillGuarantee(type, number) {
    if (type) {
      await this.guaranteeTypeSelect.click();
      await this.page.locator(`[role="option"]:has-text("${type}")`).click();
    }
    if (number) await this.guaranteeNumberInput.fill(number);
  }

  async fillDates(start, end) {
    if (start) await this.rentStartInput.fill(start);
    if (end) await this.rentEndInput.fill(end);
  }

  async addCostume(costumeName, quantity = 1) {
    await this.costumeSearchInput.fill(costumeName);
    await this.page.getByRole('option', { name: new RegExp(costumeName, 'i') }).click();
    if (quantity > 1) {
      const qtyInput = this.page.locator('input[type="number"]').last();
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
    await this.clientSelect.fill(name);
    await this.page.getByRole('option', { name: /buat|tambah|new|create/i }).click();
    await this.page.getByPlaceholder(/nama klien|client name/i).fill(name);
    await this.page.getByPlaceholder(/telepon|phone/i).fill(phone);
    await this.page.getByPlaceholder(/alamat|address/i).fill(address);
  }

  async assertErrorMessage(message) {
    const errorAlert = this.page.locator('.alert, [role="alert"]').first();
    await expect(errorAlert).toBeVisible();
    if (message) {
      await expect(errorAlert).toContainText(message);
    }
  }

  async getAvailableQuantityForCostume(costumeName) {
    const costumeItem = this.page.getByText(costumeName).locator('..').locator('..');
    const text = await costumeItem.textContent();
    const match = text.match(/tersedia[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
}

module.exports = { RentFormPage };
