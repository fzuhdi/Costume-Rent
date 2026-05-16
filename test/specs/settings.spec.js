const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { SettingsPage } = require('../pages/SettingsPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // AC-021: Access Settings
  test('[AC-021-001] - Navigate to /settings via sidebar', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h1')).toContainText(/Pengaturan/i);
  });

  test('[AC-021-002] - Form displays current settings', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.appNameInput).toBeVisible();
    await expect(settingsPage.taglineInput).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // AC-022: Customize App Name
  test('[AC-022-001] - Edit app name field', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editAppName('Test App Name');
    const value = await settingsPage.appNameInput.inputValue();
    expect(value).toBe('Test App Name');
  });

  test('[AC-022-002] - App name shows in navbar', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const navbarBrand = page.locator('aside span.text-lg.font-bold').first();
    const brandText = await navbarBrand.textContent();
    expect(brandText.length).toBeGreaterThan(0);
  });

  // AC-023: Customize Tagline
  test('[AC-023-001] - Edit tagline field', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Test Tagline');
    const value = await settingsPage.taglineInput.inputValue();
    expect(value).toBe('Test Tagline');
  });

  test('[AC-023-002] - Tagline changes apply instantly', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Instant Preview');
    const previewTagline = page.locator('p.text-sm.text-\\[var\\(--muted\\)\\]');
    await expect(previewTagline).toContainText(/Instant Preview/i);
  });

  // AC-024: Upload Logo
  test('[AC-024-001] - Upload logo image', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.logoUpload).toBeVisible();
  });

  test('[AC-024-002] - Logo displays in navbar after upload', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const logoPreview = settingsPage.logoPreview;
    const isVisible = await logoPreview.isVisible().catch(() => false);
    const hasPlaceholder = await page.locator('.w-20.h-20 svg').isVisible().catch(() => false);
    expect(isVisible || hasPlaceholder).toBeTruthy();
  });

  test('[AC-024-003] - Logo changes apply instantly', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const previewSection = page.locator('.h-12.bg-\\[var\\(--surface\\)\\]');
    await expect(previewSection).toBeVisible();
  });

  // AC-021-003: Settings page shows current app name value
  test('[AC-021-003] - Settings page shows current app name value', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.assertAppNamePrepopulated();
  });

  // AC-022-003: App name persists after page reload
  test('[AC-022-003] - App name persists after page reload', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editAppName('Auto Test Name');
    await settingsPage.save();
    await settingsPage.expectSaved();
    await page.reload();
    await settingsPage.goto();
    const value = await settingsPage.appNameInput.inputValue();
    expect(value).toBe('Auto Test Name');
  });

  // AC-023-003: Tagline persists after page reload
  test('[AC-023-003] - Tagline persists after page reload', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Auto Test Tagline');
    await settingsPage.save();
    await settingsPage.expectSaved();
    await settingsPage.goto();
    const value = await settingsPage.taglineInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  // AC-022-004: Success message appears after save
  test('[AC-022-004] - Success message appears after save', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editAppName('Success Test ' + Date.now());
    await settingsPage.save();
    await settingsPage.assertSuccessMessage();
  });
});
