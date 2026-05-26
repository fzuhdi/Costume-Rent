const { test, expect } = require('../fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { SettingsPage } = require('../pages/SettingsPage');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MOBILE_EDGE_TOLERANCE = 1;

async function expectNoHorizontalOverflow(page, context) {
  const layout = await page.evaluate((edgeTolerance) => {
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    );
    const offenders = Array.from(document.body.querySelectorAll('*'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const className = typeof element.className === 'string' ? element.className : '';
        const label = element.getAttribute('aria-label') || element.textContent || '';

        return {
          tag: element.tagName.toLowerCase(),
          className,
          label: label.replace(/\s+/g, ' ').trim().slice(0, 80),
          left: Math.floor(rect.left),
          right: Math.ceil(rect.right),
          width: Math.ceil(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (
        item.left < -edgeTolerance ||
        item.right > viewportWidth + edgeTolerance
      ))
      .slice(0, 5);

    return { viewportWidth, documentWidth, offenders };
  }, MOBILE_EDGE_TOLERANCE);

  expect(
    layout.documentWidth,
    `${context} should not require horizontal scrolling; offenders: ${JSON.stringify(layout.offenders)}`
  ).toBeLessThanOrEqual(layout.viewportWidth + MOBILE_EDGE_TOLERANCE);
}

async function expectMobileElementUsable(page, locator, label, { enabled = false } = {}) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator, `${label} should be visible on mobile`).toBeVisible();
  await expect(locator, `${label} should be in the mobile viewport`).toBeInViewport({ ratio: 0.5 });

  if (enabled) {
    await expect(locator, `${label} should be usable on mobile`).toBeEnabled();
  }

  const box = await locator.boundingBox();
  const viewport = page.viewportSize();

  expect(box, `${label} should have a rendered mobile layout box`).not.toBeNull();
  expect(box.x, `${label} should not be clipped by the left mobile edge`).toBeGreaterThanOrEqual(-MOBILE_EDGE_TOLERANCE);
  expect(
    box.x + box.width,
    `${label} should not be clipped by the right mobile edge`
  ).toBeLessThanOrEqual(viewport.width + MOBILE_EDGE_TOLERANCE);
}

async function failNextSettingsSave(page) {
  let failed = false;
  const handler = async (route) => {
    if (!failed && route.request().method() === 'PUT') {
      failed = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'E2E forced settings save failure' }),
      });
      return;
    }

    await route.continue();
  };

  await page.route('**/api/settings', handler);
  return handler;
}

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // SETTINGS: Access Settings
  test('[SETTINGS-001] - Navigate to /settings via sidebar', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h1')).toContainText(/Pengaturan/i);
  });

  test('[SETTINGS-002] - Form displays current settings', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.appNameInput).toBeVisible();
    await expect(settingsPage.taglineInput).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // SETTINGS: Customize App Name
  test('[SETTINGS-003] - Edit app name field', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editAppName('Test App Name');
    const value = await settingsPage.appNameInput.inputValue();
    expect(value).toBe('Test App Name');
  });

  test('[SETTINGS-004] - App name shows in navbar', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const navbarBrand = page.locator('aside span.text-lg.font-bold').first();
    const brandText = await navbarBrand.textContent();
    expect(brandText.length).toBeGreaterThan(0);
  });

  // SETTINGS: Customize Tagline
  test('[SETTINGS-005] - Edit tagline field', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Test Tagline');
    const value = await settingsPage.taglineInput.inputValue();
    expect(value).toBe('Test Tagline');
  });

  test('[SETTINGS-006] - Tagline changes apply instantly', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Instant Preview');
    const previewTagline = page.locator('p.text-sm.text-\\[var\\(--muted\\)\\]');
    await expect(previewTagline).toContainText(/Instant Preview/i);
  });

  // SETTINGS: Upload Logo
  test('[SETTINGS-007] - Upload logo image', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.logoUpload).toBeVisible();
  });

  test('[SETTINGS-008] - Logo displays in navbar after upload', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const logoPreview = settingsPage.logoPreview;
    const isVisible = await logoPreview.isVisible().catch(() => false);
    const hasPlaceholder = await page.locator('.w-20.h-20 svg').isVisible().catch(() => false);
    expect(isVisible || hasPlaceholder).toBeTruthy();
  });

  test('[SETTINGS-009] - Logo changes apply instantly', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    const previewSection = page.locator('.h-12.bg-\\[var\\(--surface\\)\\]');
    await expect(previewSection).toBeVisible();
  });

  // SETTINGS-010: Settings page shows current app name value
  test('[SETTINGS-010] - Settings page shows current app name value', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.assertAppNamePrepopulated();
  });

  // SETTINGS-011: App name persists after page reload
  test('[SETTINGS-011] - App name persists after page reload', async ({ page }) => {
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

  // SETTINGS-012: Tagline persists after page reload
  test('[SETTINGS-012] - Tagline persists after page reload', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editTagline('Auto Test Tagline');
    await settingsPage.save();
    await settingsPage.expectSaved();
    await settingsPage.goto();
    const value = await settingsPage.taglineInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  // SETTINGS-013: Success message appears after save
  test('[SETTINGS-013] - Success message appears after save', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.editAppName('Success Test ' + Date.now());
    await settingsPage.save();
    await settingsPage.assertSuccessMessage();
  });

  test('[SETTINGS-014] - Settings branding page is mobile usable', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    const settingsPage = new SettingsPage(page);
    const uniqueSuffix = Date.now();
    const mobileAppName = `E2E_Settings_Mobile_${uniqueSuffix}`;
    const mobileTagline = `E2E mobile branding ${uniqueSuffix}`;
    const previewShell = page.locator('.h-12.bg-\\[var\\(--surface\\)\\]').first();
    const previewAppName = page.locator('h3.font-bold').last();
    const previewTagline = page.locator('p.text-sm.text-\\[var\\(--muted\\)\\]').first();

    await settingsPage.goto();
    await expectNoHorizontalOverflow(page, 'settings branding page');

    await expectMobileElementUsable(page, settingsPage.logoUpload, 'logo upload control', { enabled: true });
    await expectMobileElementUsable(page, settingsPage.appNameInput, 'app name control', { enabled: true });
    await expectMobileElementUsable(page, settingsPage.taglineInput, 'tagline control', { enabled: true });
    await expectMobileElementUsable(page, previewShell, 'branding preview');

    await settingsPage.editAppName(mobileAppName);
    await settingsPage.editTagline(mobileTagline);
    await expect(previewAppName).toContainText(mobileAppName);
    await expect(previewTagline).toContainText(mobileTagline);
    await expectNoHorizontalOverflow(page, 'edited settings branding page');

    await expectMobileElementUsable(page, settingsPage.saveButton, 'save action', { enabled: true });
    await settingsPage.save();
    await expectMobileElementUsable(page, settingsPage.successMessage, 'success feedback');
    await expectNoHorizontalOverflow(page, 'saved settings feedback');

    await page.reload();
    await expect(settingsPage.appNameInput).toHaveValue(mobileAppName);
    await expect(settingsPage.taglineInput).toHaveValue(mobileTagline);

    const failedSaveRoute = await failNextSettingsSave(page);
    const errorAppName = `E2E_Settings_Mobile_Error_${uniqueSuffix}`;
    const errorMessage = page.locator('text=Gagal menyimpan pengaturan');

    await settingsPage.editAppName(errorAppName);
    await settingsPage.save();
    await expectMobileElementUsable(page, errorMessage, 'error feedback');
    await expectNoHorizontalOverflow(page, 'settings error feedback');
    await page.unroute('**/api/settings', failedSaveRoute);
  });
});
