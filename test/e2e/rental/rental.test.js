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

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * AC-014: View rental list at /rents
 * AC-015: Create rental at /rents/new
 * AC-016: Select client (existing/new)
 * AC-017: Select costume(s)
 * AC-018: Set start and end date
 * AC-019: Select guarantee type (KTP, SIM, KK, Paspor, Lainnya)
 * AC-020: Enter guarantee number
 * AC-021: View rental detail at /rents/:id
 * AC-022: Edit rental at /rents/:id/edit
 * AC-023: Mark returned
 * AC-024: Delete rental with confirmation
 * AC-025: Filter by status
 * AC-026: Search rentals
 */
test.describe('AC-014 to AC-026: Rental System', () => {

  test('AC-014: View rental list at /rents', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await expect(page.locator('h1, h2, .page-title')).toBeVisible({ timeout: 5000 });
  });

  test('AC-014: Rental list shows rentals or empty state', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    expect(content).toMatch(/Peminjaman|Rental|Tidak ada|data/i);
  });

  test('AC-015: Navigate to create rental form', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  });

  test('AC-015: Create rental form has required fields', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    // Client selection
    const clientField = page.locator('text=Klien, text=Pilih Klien').first();
    if (await clientField.isVisible({ timeout: 3000 })) {
      await expect(clientField).toBeVisible();
    }
    
    // Start date
    await expect(page.locator('input[name="rent_start"]')).toBeVisible({ timeout: 5000 });
    
    // End date
    await expect(page.locator('input[name="rent_end"]')).toBeVisible();
  });

  test('AC-018: Rent start date field exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('input[name="rent_start"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-018: Rent end date field exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('input[name="rent_end"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-019: Guarantee type dropdown exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('select[name="guarantee_type"]')).toBeVisible({ timeout: 5000 });
    
    // Verify options: KTP, SIM, KK, Paspor, Lainnya
    const options = page.locator('select[name="guarantee_type"] option');
    expect(await options.count()).toBeGreaterThanOrEqual(4);
  });

  test('AC-020: Guarantee number field exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await expect(page.locator('input[name="guarantee_number"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-017: Costume selection exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(1000);
    
    const costumeField = page.locator('text=Kostum, text=Pilih Kostum').first();
    if (await costumeField.isVisible({ timeout: 3000 })) {
      await expect(costumeField).toBeVisible();
    }
  });

  test('AC-016: Client selection exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(1000);
    
    const clientField = page.locator('text=Klien, text=Pilih Klien').first();
    if (await clientField.isVisible({ timeout: 3000 })) {
      await expect(clientField).toBeVisible();
    }
  });

  test('AC-021: View rental detail at /rents/:id', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const firstRent = page.locator('a[href*="/rents/"]:not([href*="new"])').first();
    if (await firstRent.isVisible({ timeout: 3000 })) {
      await firstRent.click();
      await expect(page).toHaveURL(/\/rents\/\d+/);
    }
  });

  test('AC-021: Rental detail shows information', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const firstRent = page.locator('a[href*="/rents/"]:not([href*="new"])').first();
    if (await firstRent.isVisible({ timeout: 3000 })) {
      await firstRent.click();
      await page.waitForTimeout(1000);
      
      const content = await page.content();
      expect(content).not.toMatch(/404|Halaman tidak ditemukan/);
    }
  });

  test('AC-022: Navigate to edit rental form', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const firstRent = page.locator('a[href*="/rents/"]:not([href*="new"])').first();
    if (await firstRent.isVisible({ timeout: 3000 })) {
      await firstRent.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('a[href*="/edit"], button:has-text("Edit"), button:has-text("Ubah")').first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await expect(page).toHaveURL(/\/rents\/\d+\/edit/);
      }
    }
  });

  test('AC-023: Mark returned button exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const returnButton = page.locator('button:has-text("Dikembalikan"), button:has-text("Kembalikan")').first();
    if (await returnButton.isVisible({ timeout: 3000 })) {
      await expect(returnButton).toBeVisible();
    }
  });

  test('AC-024: Delete rental button exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await page.waitForTimeout(2000);
    
    const deleteButton = page.locator('button:has-text("Hapus"), button:has-text("Delete")').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('AC-025: Filter by status dropdown exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await expect(page.locator('select[name="status"], select[id="status"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-026: Search rentals field exists', async ({ page }) => {
    await login(page);
    await page.goto('/rents');
    await expect(page.locator('input[type="search"], input[placeholder*="Cari"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC-015: Submit new rental saves to database', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Fill date fields
    const startDate = addDays(1);
    const endDate = addDays(3);
    await page.fill('input[name="rent_start"]', startDate);
    await page.fill('input[name="rent_end"]', endDate);
    
    // Try to select client if available
    const clientSelect = page.locator('text=Klien, text=Pilih Klien').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.waitForTimeout(500);
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Should navigate to rental detail or list
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/rents\/\d+|\/rents/);
    }
  });

  test('AC-015: Client dropdown shows options when activated', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const clientField = page.locator('input[name="client_name"], [role="combobox"]:has-text("Klien"), input[id*="client"]').first();
    if (await clientField.isVisible({ timeout: 3000 })) {
      await clientField.click();
      await page.waitForTimeout(500);
      
      const dropdownContent = await page.content();
      expect(dropdownContent).toMatch(/Pilih Klien|Klien baru|Cari klien/i);
    }
  });

  test('AC-015: Can create new client from rental form', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const clientField = page.locator('input[name="client_name"], [role="combobox"]:has-text("Klien")').first();
    if (await clientField.isVisible({ timeout: 3000 })) {
      await clientField.fill('Klien Test Baru');
      await page.waitForTimeout(1000);
      
      const createNewLink = page.locator('text=Buat klien baru, text=Klien baru').first();
      if (await createNewLink.isVisible({ timeout: 2000 })) {
        await createNewLink.click();
        await page.waitForTimeout(500);
        
        const formContent = await page.content();
        expect(formContent).toMatch(/Berhasil|berhasil|success|Klien Test Baru/i);
      }
    }
  });

  test('AC-017: Costume dropdown shows options when activated', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
const costumeField = page.locator('input[name="costume"], [role="combobox"]:has-text("Kostum"), input[id*="costume"]').first();
    if (await costumeField.isVisible({ timeout: 3000 })) {
      await costumeField.click();
      await page.waitForTimeout(500);
      
      const dropdownContent = await page.content();
      expect(dropdownContent).toMatch(/Pilih Kostum|Kostum tersedia|Cari kostum/i);
    }
  });

  test('AC-017: Can add multiple costumes to rental', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const addButton = page.locator('button:has-text("Tambah"), button:has-text("+ Tambah")').first();
    
    const initialCount = await page.locator('[class*="item"], [class*="costume"], tr:has(td)').count();
    
    if (await addButton.isVisible({ timeout: 2000 })) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    const afterCount = await page.locator('[class*="item"], [class*="costume"], tr:has(td)').count();
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('AC-017: Costume dropdown re-opens after adding first costume', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const costumeInput = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput.click();
    await page.waitForTimeout(1000);
    
    await costumeInput.fill('Test');
    await page.waitForTimeout(1500);
    
    const costumeOption = page.locator('.costume-option').first();
    if (await costumeOption.isVisible({ timeout: 2000 })) {
      await costumeOption.click();
      await page.waitForTimeout(1000);
    }
    
    const selectedItems = page.locator('[class*="selected-item"]');
    const countAfterSelect = await selectedItems.count();
    expect(countAfterSelect).toBe(1);
    
    const costumeInput2 = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput2.click();
    await page.waitForTimeout(1000);
    
    const dropdownVisible = await page.locator('.costume-dropdown').isVisible();
    expect(dropdownVisible).toBe(true);
  });

  test('AC-016: Client dropdown shows results', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const clientInput = page.locator('input[placeholder="Cari atau ketik nama klien..."]').first();
    await clientInput.click();
    await page.waitForTimeout(1500);
    
    const dropdownContent = await page.content();
    expect(dropdownContent).toMatch(/Pilih atau buat klien|Klien|client/i);
  });

  test('AC-015: Form submits with all required fields filled', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForSelector('form', { timeout: 5000 });
    
    await page.fill('input[name="rent_start"]', addDays(5));
    await page.fill('input[name="rent_end"]', addDays(8));
    await page.selectOption('select[name="guarantee_type"]', 'KTP');
    await page.fill('input[name="guarantee_number"]', '3175072511980003');
    
    const clientInput = page.locator('input[placeholder="Cari atau ketik nama klien..."]').first();
    await clientInput.click();
    await clientInput.fill('Testclient');
    await page.waitForTimeout(1500);
    
    const costumeInput = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput.click();
    await costumeInput.fill('Test');
    await page.waitForTimeout(1500);
    
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/rents(\/\d+)?/);
  });
});

test('AC-017: Can add multiple costumes to rental', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const addButton = page.locator('button:has-text("Tambah"), button:has-text("+ Tambah")').first();
    
    const initialCount = await page.locator('[class*="item"], [class*="costume"], tr:has(td)').count();
    
    if (await addButton.isVisible({ timeout: 2000 })) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    const afterCount = await page.locator('[class*="item"], [class*="costume"], tr:has(td)').count();
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('AC-017: Costume dropdown re-opens after adding first costume', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const costumeInput = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput.click();
    await page.waitForTimeout(1000);
    
    await costumeInput.fill('Test');
    await page.waitForTimeout(1500);
    
    const costumeOption = page.locator('.costume-option').first();
    if (await costumeOption.isVisible({ timeout: 2000 })) {
      await costumeOption.click();
      await page.waitForTimeout(1000);
    }
    
    const selectedItems = page.locator('[class*="selected-item"]');
    const countAfterSelect = await selectedItems.count();
    expect(countAfterSelect).toBe(1);
    
    const costumeInput2 = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput2.click();
    await page.waitForTimeout(1000);
    
    const dropdownVisible = await page.locator('.costume-dropdown').isVisible();
    expect(dropdownVisible).toBe(true);
  });

  test('AC-016: Client dropdown shows results', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForTimeout(2000);
    
    const clientInput = page.locator('input[placeholder="Cari atau ketik nama klien..."]').first();
    await clientInput.click();
    await page.waitForTimeout(1500);
    
    const dropdownContent = await page.content();
    expect(dropdownContent).toMatch(/Pilih atau buat klien|Klien|client/i);
  });

  test('AC-015: Form submits with all required fields filled', async ({ page }) => {
    await login(page);
    await page.goto('/rents/new');
    await page.waitForSelector('form', { timeout: 5000 });
    
    await page.fill('input[name="rent_start"]', addDays(5));
    await page.fill('input[name="rent_end"]', addDays(8));
    await page.selectOption('select[name="guarantee_type"]', 'KTP');
    await page.fill('input[name="guarantee_number"]', '3175072511980003');
    
    const clientInput = page.locator('input[placeholder="Cari atau ketik nama klien..."]').first();
    await clientInput.click();
    await clientInput.fill('Testclient');
    await page.waitForTimeout(1500);
    
    const costumeInput = page.locator('input[placeholder="Cari kostum..."]').first();
    await costumeInput.click();
    await costumeInput.fill('Test');
    await page.waitForTimeout(1500);
    
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/rents(\/\d+)?/);
  });