import { test, expect } from '@playwright/test';

function futureDate(days = 30) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

test('light is the default theme even when the operating system prefers dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveClass(/\blight\b/);
  await expect(page.locator('.marketplace-theme')).toHaveCSS('background-color', 'rgb(245, 246, 248)');
});

test('customer can switch theme and keep the selection after reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'The header theme switch is a desktop control.');

  await page.goto('/');
  const themeToggle = page.getByRole('button', { name: 'Ganti mode terang atau gelap' });

  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('keyboard users can skip the marketplace navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Lewati ke konten utama' });
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('customer can recover from terms validation and reach payment processing', async ({ page }) => {
  await page.goto('/costumes/tari-piring');
  await page.getByLabel('Tanggal acara').fill(futureDate());
  await page.getByRole('button', { name: 'Tambah ke keranjang', exact: true }).click();
  await page.getByRole('link', { name: 'Lihat keranjang' }).click();

  await expect(page).toHaveURL(/\/cart$/, { timeout: 30_000 });
  await page.getByRole('link', { name: /^Lanjut(?: ke checkout)?$/ }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });

  const paymentButton = page.getByRole('button', { name: /^Bayar/ });
  await paymentButton.focus();
  await paymentButton.press('Enter');
  await expect(page.getByRole('checkbox', { name: /Saya memahami/ })).toBeFocused();
  await expect(page.locator('#checkout-terms-error')).toContainText('setujui ketentuan');

  await page.getByRole('checkbox', { name: /Saya memahami/ }).click();
  await paymentButton.click();
  await expect(page).toHaveURL(/\/checkout\/processing/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Pembayaran masih diproses' })).toBeVisible();
});

test('order cards expose their full perceived target', async ({ page }) => {
  await page.goto('/account/orders');
  await page.getByRole('link', { name: /Lihat detail pesanan KBR-240725-018/ }).click();

  await expect(page).toHaveURL(/\/orders\/KBR-240725-018$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Detail pesanan' })).toBeVisible();
});

test('mobile filters use draft state until the customer applies them', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile filter sheet is only rendered below the desktop breakpoint.');

  await page.goto('/catalogue');
  await page.getByRole('button', { name: 'Filter', exact: true }).click();
  await page.getByLabel('Kategori filter seluler').click();
  await page.getByRole('option', { name: 'Drama tari' }).click();

  await expect(page.getByRole('button', { name: 'Tampilkan 1 kostum' })).toBeVisible();
  await expect(page.locator('#catalogue-results')).toHaveText('4 kostum ditemukan');
  await page.getByRole('button', { name: 'Tampilkan 1 kostum' }).click();
  await expect(page.getByRole('heading', { name: '1 kostum ditemukan' })).toBeVisible();
});

test('primary routes avoid horizontal overflow at required widths', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  test.skip(testInfo.project.name !== 'desktop-chrome', 'One browser project covers the explicit responsive matrix.');

  const routes = ['/', '/catalogue', '/costumes/tari-pendet', '/cart', '/checkout', '/account/orders', '/orders/KBR-240725-018', '/masuk'];
  const widths = [320, 768, 1024, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 320 ? 800 : 900 });
    for (const route of routes) {
      await page.goto(route);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasOverflow, `${route} should not overflow at ${width}px`).toBe(false);
    }
  }
});
