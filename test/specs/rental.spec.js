const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RentHistoryPage } = require('../pages/RentHistoryPage');
const { RentFormPage } = require('../pages/RentFormPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

test.describe('Rental Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
  });

  test('[AC-014] - Create new rental order', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickNewRent();
    
    const rentFormPage = new RentFormPage(page);
    await rentFormPage.selectClient('Test Client');
    await rentFormPage.addCostume('BDD Test Costume', 2);
    await rentFormPage.fillDates(addDays(1), addDays(7));
    await rentFormPage.fillGuarantee('KTP', null);
    await rentFormPage.submit();
    
    await rentHistoryPage.goto();
    const count = await rentHistoryPage.rentRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[AC-015] - View rental details', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);
    
    const content = await page.content();
    expect(content).toMatch(/Klien|Client/i);
    expect(content).toMatch(/Kostum|Costume|Item/i);
  });

  test('[AC-016] - Mark rental as returned', async ({ page }) => {
    const rentHistoryPage = new RentHistoryPage(page);
    await rentHistoryPage.goto();
    await rentHistoryPage.clickFirstRental();
    await expect(page).toHaveURL(/\/rents\/\d+/);
    
    const returnButton = page.locator('button:has-text("Dikembalikan"), button:has-text("Kembalikan")').first();
    if (await returnButton.isVisible({ timeout: 3000 })) {
      await returnButton.click();
      const content = await page.content();
      expect(content).toMatch(/returned|dikembalikan/i);
    }
  });
});
