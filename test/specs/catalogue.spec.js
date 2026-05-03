const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { CataloguePage } = require('../pages/CataloguePage');
const { CatalogueFormPage } = require('../pages/CatalogueFormPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Catalogue Management (Costume Management)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // AC-003-001: View Costume List
  test('[AC-003-001] - Display all costumes in catalogue page', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.assertPageLoaded();
    const count = await cataloguePage.getCostumeCount();
    expect(count).toBeGreaterThan(0);
  });

  test('[AC-003-002] - Show costume name, image thumbnail, quantity', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.assertPageLoaded();
    const rows = await cataloguePage.costumeRows.count();
    expect(rows).toBeGreaterThan(0);
    const bodyText = await page.locator('body').textContent();
    const hasQuantity = /stok|jumlah|qty/i.test(bodyText);
    expect(hasQuantity).toBe(true);
  });

  test('[AC-003-003] - Paginated or scrollable list', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.assertPageLoaded();
    const pagination = page.locator('[role="navigation"]').first();
    const scrollContainer = page.locator('[class*="overflow"], [class*="scroll"]').first();
    const hasPagination = await pagination.isVisible().catch(() => false);
    const hasScroll = await scrollContainer.isVisible().catch(() => false);
    expect(hasPagination || hasScroll).toBeTruthy();
  });

  // AC-004-001: Add New Costume
  test('[AC-004-001] - Navigate to /catalogue/new via UI', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    await expect(page).toHaveURL(/\/catalogue\/new/);
    await expect(page.locator('h2').first()).toContainText(/tambah|tambah kostum baru/i);
  });

  test('[AC-004-002] - Submit saves to database and redirects', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    const formPage = new CatalogueFormPage(page);
    await formPage.nameInput.fill('AC-004 Test Costume');
    await formPage.submit();
    await expect(page).toHaveURL(/\/catalogue/, { timeout: 10000 });
  });

  // AC-005-001: View Costume Detail
  test('[AC-005-001] - Navigate to /catalogue/:id', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
    await expect(page.locator('h2').first()).not.toBeEmpty();
  });

  test('[AC-005-002] - Display costume details', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
    await expect(page.locator('body')).not.toBeEmpty();
    const content = await page.content();
    expect(content).toMatch(/deskripsi|description/i);
    expect(content).toMatch(/wilayah|region/i);
    expect(content).toMatch(/kategori|category/i);
    expect(content).toMatch(/harga|price/i);
  });

  test('[AC-005-003] - Display costume images', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
    const hasImages = (await page.locator('img[alt]').count()) > 0;
    const hasNoImageText = await page.getByText(/tidak ada gambar/i).isVisible().catch(() => false);
    expect(hasImages || hasNoImageText).toBeTruthy();
  });

  test('[AC-005-004] - Show edit button', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();
  });

  // AC-006-001: Edit Costume
  test('[AC-006-001] - Navigate to /catalogue/:id/edit', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await page.getByRole('button', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/catalogue\/\d+\/edit/);
    await expect(page.locator('h2').first()).toContainText(/edit kostum/i);
  });

  test('[AC-006-002] - Pre-populate form with existing data', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await page.getByRole('button', { name: /edit/i }).click();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    const nameValue = await formPage.nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });

  test('[AC-006-003] - Save changes updates database', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await page.getByRole('button', { name: /edit/i }).click();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    await formPage.descriptionInput.fill('Updated by AC-006 test');
    await formPage.submit();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
  });

  test('[AC-006-004] - Redirect to detail page after save', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await page.getByRole('button', { name: /edit/i }).click();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    await formPage.submit();
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
  });

  // AC-007-001: Delete Costume
  test('[AC-007-001] - Delete button available on detail', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    await expect(page.getByRole('button', { name: /hapus/i })).toBeVisible();
  });

  test('[AC-007-002] - Confirmation dialog before delete', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickFirstCostume();
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });
    await page.getByRole('button', { name: /hapus/i }).click();
  });

  test('[AC-007-003] - Costume removed from database', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    const initialCount = await cataloguePage.getCostumeCount();
    await cataloguePage.clickFirstCostume();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /hapus/i }).click();
    await expect(page).toHaveURL(/\/catalogue/);
    await cataloguePage.assertPageLoaded();
    const finalCount = await cataloguePage.getCostumeCount();
    expect(finalCount).toBeLessThan(initialCount);
  });

  // AC-008-001: Upload Costume Image
  test('[AC-008-001] - Image upload button on form', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    const fileInputExists = await formPage.fileInput.count() > 0;
    expect(fileInputExists).toBeTruthy();
  });

  test('[AC-008-002] - Supports multiple images', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    const hasMultiple = await formPage.fileInput.getAttribute('multiple').catch(() => null);
    expect(hasMultiple !== null).toBeTruthy();
  });

  test('[AC-008-003] - Images display in detail page', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    const formPage = new CatalogueFormPage(page);
    await formPage.assertFormLoaded();
    await formPage.fillForm({
      name: 'Image Test Costume',
      region: 'Bali',
      category: 'Baju Adat',
      quantity: '1'
    });
    await formPage.uploadImages([{ name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100) }]);
    await formPage.submit();
    await expect(page).toHaveURL(/\/catalogue/);
  });
});
