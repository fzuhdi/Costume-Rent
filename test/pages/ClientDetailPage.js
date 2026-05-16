const { BasePage } = require('./BasePage.js');

class ClientDetailPage extends BasePage {
  constructor(page) {
    super(page);
    this.clientName = page.locator('p.font-medium').first();
    this.clientPhone = page.locator('p.font-medium').nth(1);
    this.clientAddress = page.locator('p.font-medium').nth(2);
    this.editButton = page.locator('button:has-text("Edit")').first();
    this.rentHistoryTable = page.locator('[aria-label="Client rent history"]');
    this.rentHistoryRows = this.rentHistoryTable.locator('[data-slot="table-row"]');
    this.nameInput = page.locator('input[name="name"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.addressInput = page.locator('textarea[name="address"]');
    this.saveButton = page.locator('button:has-text("Simpan")');
    this.cancelButton = page.locator('button:has-text("Batal")');
  }

  async goto(clientId) {
    await super.goto(`/clients/${clientId}`);
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async fillEditForm(data) {
    if (data.name) await this.nameInput.fill(data.name);
    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.address) await this.addressInput.fill(data.address);
  }

  async save() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async expectRentHistoryVisible() {
    await expect(this.rentHistoryTable).toBeVisible();
  }

  async getRentHistoryCount() {
    return await this.rentHistoryRows.count();
  }

  async assertRentalHistoryOrder() {
    const rows = await this.rentHistoryRows.all();
    if (rows.length < 2) return; // Need at least 2 to check order
    // Get dates from each row and verify they're in descending order
    const dates = [];
    for (const row of rows) {
      const text = await row.textContent();
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) dates.push(new Date(dateMatch[1]));
    }
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i-1].getTime());
    }
  }

  async editPhone(newPhone) {
    await this.clickEdit();
    await this.phoneInput.fill(newPhone);
    await this.save();
  }

  async editAddress(newAddress) {
    await this.clickEdit();
    await this.addressInput.fill(newAddress);
    await this.save();
  }
}

module.exports = { ClientDetailPage };
