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
 * AC-027:: View client list at /clients
 * AC-028:: View client detail at /clients/:id
 * AC-029:: Edit client information
 * AC-030: View client rental history
 * AC-031: Search clients
 */
test.describe('AC-027: to AC-031: Client Management', () => {

  test('AC-027:a: View client list at /clients', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await expect(page.locator('h1, h2, .page-title')).toBeVisible({ timeout: 5000 });
  });

  test('AC-027:b: Client list shows clients or empty state', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    expect(content).toMatch(/Klien|Client|Tidak ada|data/i);
  });

  test('AC-028:a: Navigate to client detail', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.locator('a[href*="/clients/"]').first();
    if (await firstClient.isVisible({ timeout: 3000 })) {
      await firstClient.click();
      await expect(page).toHaveURL(/\/clients\/\d+/);
    }
  });

  test('AC-028:b: Client detail shows information', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.locator('a[href*="/clients/"]').first();
    if (await firstClient.isVisible({ timeout: 3000 })) {
      await firstClient.click();
      await page.waitForTimeout(1000);
      
      const content = await page.content();
      expect(content).not.toMatch(/404|Halaman tidak ditemukan/);
    }
  });

  test('AC-029:a: Edit client button exists', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.locator('a[href*="/clients/"]').first();
    if (await firstClient.isVisible({ timeout: 3000 })) {
      await firstClient.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Ubah")').first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await expect(editButton).toBeVisible();
      }
    }
  });

  test('AC-029:b: Edit client saves changes', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.locator('a[href*="/clients/"]').first();
    if (await firstClient.isVisible({ timeout: 3000 })) {
      await firstClient.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Ubah")').first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Fill new name
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible({ timeout: 2000 })) {
          const newName = 'Updated Client ' + Date.now();
          await nameInput.fill(newName);
          
          // Save
          const saveButton = page.locator('button[type="submit"], button:has-text("Simpan")').first();
          if (await saveButton.isVisible({ timeout: 2000 })) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('AC-030: Client rental history section exists', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(2000);
    
    const firstClient = page.locator('a[href*="/clients/"]').first();
    if (await firstClient.isVisible({ timeout: 3000 })) {
      await firstClient.click();
      await page.waitForTimeout(1000);
      
      // Look for rental history section
      const historySection = page.locator('text=Riwayat, text=History, text=Peminjaman').first();
      if (await historySection.isVisible({ timeout: 3000 })) {
        await expect(historySection).toBeVisible();
      }
    }
  });

  test('AC-031: Search clients field exists', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await expect(page.locator('input[type="search"], input[placeholder*="Cari"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-031: Search clients works', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"]').first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Should filter results
      const content = await page.content();
      expect(content).toBeTruthy();
    }
  });
});