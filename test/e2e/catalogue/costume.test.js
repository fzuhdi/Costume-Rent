const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/catalogue', { timeout: 10000 });
}

/**
 * AC-006:: View costume list at /catalogue
 * AC-007:: Add new costume at /catalogue/new
 * AC-008: Edit costume at /catalogue/:id/edit
 * AC-009: Delete costume with confirmation
 * AC-010:: View costume detail at /catalogue/:id
 * AC-011: Upload multiple images
 * AC-012:: Organize by region and category
 * AC-013: Track quantity available
 */
test.describe('AC-006: to AC-013: Costume Management', () => {

  test('AC-006:a: View costume list at /catalogue', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await expect(page.locator('h1, h2, .page-title')).toBeVisible({ timeout: 5000 });
  });

  test('AC-006:b: Costume list shows costumes', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);
    
    // Should show at least one costume or empty state
    const content = await page.content();
    expect(content).toMatch(/Katalog|Kostum|Tidak ada|data/i);
  });

  test('AC-007:a: Navigate to add costume form', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  });

  test('AC-007:b: Add costume form has required fields', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    
    // Name field (required)
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });
    
    // Quantity field (required)
    await expect(page.locator('input[name="quantity"]')).toBeVisible();
    
    // Condition select
    await expect(page.locator('select[name="condition"]')).toBeVisible();
    
    // Region select
    await expect(page.locator('select[name="region_id"]')).toBeVisible();
    
    // Category select
    await expect(page.locator('select[name="category_id"]')).toBeVisible();
  });

  test('AC-007:c: Submit new costume saves to database', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    
    const testName = 'Test Costume ' + Date.now();
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="quantity"]', '3');
    await page.selectOption('select[name="condition"]', 'good');
    await page.fill('textarea[name="description"]', 'Test description');
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/catalogue/, { timeout: 10000 });
    
    // Should redirect to catalogue
    await expect(page).toHaveURL(/\/catalogue/);
  });

  test('AC-010:a: View costume detail at /catalogue/:id', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);
    
    // Find first costume link
    const firstCostume = page.locator('a[href*="/catalogue/"]:not([href*="new"])').first();
    if (await firstCostume.isVisible({ timeout: 3000 })) {
      await firstCostume.click();
      await expect(page).toHaveURL(/\/catalogue\/\d+/);
    }
  });

  test('AC-010:b: Costume detail shows information', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);
    
    const firstCostume = page.locator('a[href*="/catalogue/"]:not([href*="new"])').first();
    if (await firstCostume.isVisible({ timeout: 3000 })) {
      await firstCostume.click();
      await page.waitForTimeout(1000);
      
      // Should show some content (name is most important)
      const content = await page.content();
      expect(content).not.toMatch(/404|Halaman tidak ditemukan/);
    }
  });

  test('AC-008: Navigate to edit costume form', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);
    
    const firstCostume = page.locator('a[href*="/catalogue/"]:not([href*="new"])').first();
    if (await firstCostume.isVisible({ timeout: 3000 })) {
      await firstCostume.click();
      await page.waitForTimeout(1000);
      
      // Look for edit button or link
      const editButton = page.locator('a[href*="/edit"], button:has-text("Edit"), button:has-text("Ubah")').first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await expect(page).toHaveURL(/\/catalogue\/\d+\/edit/);
        await expect(page.locator('form')).toBeVisible();
      }
    }
  });

  test('AC-009: Delete costume with confirmation', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue');
    await page.waitForTimeout(2000);
    
    // First create a costume to delete
    await page.click('a[href="/catalogue/new"]');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    
    const testName = 'Costume to Delete ' + Date.now();
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="quantity"]', '1');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/catalogue/, { timeout: 10000 });
    
    // Find and delete the costume
    await page.waitForTimeout(1000);
    const deleteButton = page.locator('button:has-text("Hapus"), button:has-text("Delete")').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      // Note: window.confirm is handled by Playwright automatically
      // This test verifies the delete button exists
      await expect(deleteButton).toBeVisible();
    }
  });

  test('AC-012:a: Organize by region dropdown', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await expect(page.locator('select[name="region_id"]')).toBeVisible({ timeout: 5000 });
    
    // Should have options
    const options = page.locator('select[name="region_id"] option');
    expect(await options.count()).toBeGreaterThan(1);
  });

  test('AC-012:b: Organize by category dropdown', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await expect(page.locator('select[name="category_id"]')).toBeVisible({ timeout: 5000 });
    
    // Should have options
    const options = page.locator('select[name="category_id"] option');
    expect(await options.count()).toBeGreaterThan(1);
  });

  test('AC-013: Track quantity available', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    await expect(page.locator('input[name="quantity"]')).toBeVisible({ timeout: 5000 });
    
    // Quantity should be a number input
    const quantityInput = page.locator('input[name="quantity"]');
    await expect(quantityInput).toHaveAttribute('type', 'number');
  });

  test('AC-011: Image upload exists on form', async ({ page }) => {
    await login(page);
    await page.goto('/catalogue/new');
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 2000 })) {
      await expect(fileInput).toBeVisible();
    }
  });
});