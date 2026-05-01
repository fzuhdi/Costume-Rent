const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { CataloguePage } = require('../pages/CataloguePage');
const { CatalogueFormPage } = require('../pages/CatalogueFormPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Catalogue Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
  });

  test('[AC-010] - Add new costume with valid data', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickAddCostume();
    
    const formPage = new CatalogueFormPage(page);
    await formPage.fillForm({
      name: 'BDD Test Costume',
      description: 'A costume for BDD',
      region: 'Bali',
      category: 'Baju Adat',
      condition: 'good',
      quantity: '5'
    });
    await formPage.submit();
    await expect(page).toHaveURL(/\/catalogue/);
    
    await cataloguePage.expectCostumeVisible('BDD Test Costume');
  });

  test('[AC-011] - Search costume by name', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.searchCostume('BDD Test Costume');
    await cataloguePage.expectCostumeVisible('BDD Test Costume');
  });

  test('[AC-012] - Filter by region', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.selectRegion('Bali');
    const visibleCards = await cataloguePage.costumeCards.count();
    expect(visibleCards).toBeGreaterThan(0);
  });

  test('[AC-013] - View costume details', async ({ page }) => {
    const cataloguePage = new CataloguePage(page);
    await cataloguePage.goto();
    await cataloguePage.clickCostume('BDD Test Costume');
    await expect(page).toHaveURL(/\/catalogue\/\d+/);
    await expect(page.locator('h1, h2').first()).toContainText('BDD Test Costume');
  });
});
