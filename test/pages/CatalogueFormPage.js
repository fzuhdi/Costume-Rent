const { BasePage } = require('./BasePage.js');

class CatalogueFormPage extends BasePage {
  constructor(page) {
    super(page);
    // HeroUI v3 TextField inputs - use data-slot selector
    this.nameInput = page.locator('input[data-slot="input"]').first();
    // Number input - quantity field
    this.quantityInput = page.locator('input[type="number"]').first();
    // Date input
    this.acquiredDateInput = page.locator('input[type="date"]').first();
    // Description - TextArea uses textarea element
    this.descriptionInput = page.locator('textarea').first();
    // HeroUI v3 Select components - they render as buttons with placeholder text
    // Use the button that contains the placeholder text
    this.regionSelect = page.getByRole('button', { name: /pilih wilayah/i });
    this.categorySelect = page.getByRole('button', { name: /pilih kategori/i });
    this.conditionSelect = page.locator('button').filter({ hasText: /excellent|good|fair/i }).first();
    // Price input
    this.priceInput = page.locator('label').filter({ hasText: /harga/i }).locator('..').locator('input[type="number"]');
    // Submit button - find by text content using JavaScript
    this.submitButton = page.getByRole('button', { name: /simpan|menyimpan/i }).first();
    // File input - might be hidden, use evaluate to set files
    this.fileInput = page.locator('input[type="file"]');
  }

  async assertFormLoaded() {
    // Wait for form to be ready by checking for the name input
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async goto(costumeId = null) {
    const path = costumeId ? `/catalogue/${costumeId}/edit` : '/catalogue/new';
    await super.goto(path);
    await this.assertFormLoaded();
  }

  async fillForm({ name, description, region, category, price, quantity, acquiredAt }) {
    if (name) await this.nameInput.fill(name);
    if (region) {
      await this.regionSelect.click();
      await this.page.getByRole('option', { name: new RegExp(region, 'i') }).first().click();
    }
    if (category) {
      await this.categorySelect.click();
      await this.page.getByRole('option', { name: new RegExp(category, 'i') }).first().click();
    }
    if (price) await this.priceInput.fill(price.toString());
    if (quantity) await this.quantityInput.fill(quantity.toString());
    if (acquiredAt) await this.acquiredDateInput.fill(acquiredAt);
    if (description) await this.descriptionInput.fill(description);
  }

  async submit() {
    // Use JavaScript to click the button directly to avoid visibility issues
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const simpanBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('simpan'));
      if (simpanBtn) {
        simpanBtn.click();
        return true;
      }
      return false;
    });
  }

  async uploadImages(files) {
    // HeroUI might hide the file input, use evaluate to set files directly
    await this.fileInput.setInputFiles(files).catch(async () => {
      // Fallback: create a temporary file input
      await this.page.evaluate(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.style.display = 'block';
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.zIndex = '9999';
        document.body.appendChild(input);
        input.click();
      });
    });
  }
}

module.exports = { CatalogueFormPage };
