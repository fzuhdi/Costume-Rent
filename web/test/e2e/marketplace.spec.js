import { test, expect } from '@playwright/test';

function futureDate(days = 30) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

async function waitForMarketplaceHydration(page) {
  await expect(page.locator('[data-cart-hydrated="true"]')).toBeVisible();
}

async function seedMarketplaceCart(page) {
  await page.goto('/costumes/tari-piring');
  await waitForMarketplaceHydration(page);
  await page.getByLabel('Tanggal acara').fill(futureDate());
  await page.getByRole('button', { name: 'Tambah ke keranjang', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Lihat keranjang' })).toBeVisible();
}

test('light is the default theme even when the operating system prefers dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveClass(/\blight\b/);
  await expect(page.locator('.marketplace-theme')).toHaveCSS('background-color', 'rgb(248, 244, 236)');
});

test('customer can switch theme and keep the selection after reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'The header theme switch is a desktop control.');

  await page.goto('/');
  await waitForMarketplaceHydration(page);
  const themeToggle = page.getByRole('button', { name: 'Ganti mode terang atau gelap' });

  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);

  await page.reload();
  await waitForMarketplaceHydration(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('marketplace brand assets keep their compact, full-seal, and forced-color roles', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'One desktop project verifies exact brand asset roles.');

  await page.goto('/');
  await waitForMarketplaceHydration(page);

  const colorMark = page.locator('[data-brand-mark="color"]');
  const monochromeMark = page.locator('[data-brand-mark="monochrome"]');
  const seal = page.locator('[data-brand-seal="full"]');

  await expect(colorMark).toBeVisible();
  await expect(colorMark).toHaveAttribute('src', /bu-risna-seal\.webp/);
  await expect(colorMark).toHaveCSS('width', '48px');
  await expect(colorMark).toHaveCSS('height', '48px');
  await expect(monochromeMark).toBeHidden();

  await seal.scrollIntoViewIfNeeded();
  await expect(seal).toBeVisible();
  await expect(seal).toHaveCSS('width', '96px');
  await expect(seal).toHaveCSS('height', '96px');

  await page.getByRole('button', { name: 'Ganti mode terang atau gelap' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(colorMark).toBeVisible();
  await expect(seal).toBeVisible();

  await page.emulateMedia({ forcedColors: 'active' });
  await expect(colorMark).toBeHidden();
  await expect(monochromeMark).toBeVisible();
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
  await waitForMarketplaceHydration(page);
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
  await waitForMarketplaceHydration(page);
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
  const widths = [320, 390, 768, 1024, 1280, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 320 ? 800 : 900 });
    for (const route of routes) {
      await page.goto(route);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasOverflow, `${route} should not overflow at ${width}px`).toBe(false);
    }
  }
});

test('release evidence captures the complete marketplace journey in light and dark', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'desktop-chrome', 'One desktop project records the visual evidence set.');

  await seedMarketplaceCart(page);

  const routes = [
    ['home-and-footer', '/'],
    ['catalogue', '/catalogue'],
    ['costume-detail', '/costumes/tari-pendet'],
    ['cart', '/cart'],
    ['checkout', '/checkout'],
    ['processing', '/checkout/processing'],
    ['authentication', '/masuk'],
    ['order-history', '/account/orders'],
    ['order-detail', '/orders/KBR-240725-018'],
  ];

  for (const theme of ['light', 'dark']) {
    await page.goto('/');
    await waitForMarketplaceHydration(page);

    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Ganti mode terang atau gelap' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }

    for (const [name, route] of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await testInfo.attach(`${theme}-${name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  }
});

test('accessibility preferences and order states remain explicit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'One desktop project verifies accessibility preferences.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForMarketplaceHydration(page);

  const transitionDuration = await page.getByRole('link', { name: /KBR Costume.*beranda/ }).evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(['0.00001s', '1e-05s']).toContain(transitionDuration);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('html').evaluate((element) => {
    element.style.zoom = '2';
  });
  const zoomedOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(zoomedOverflow, 'Home should remain usable at 200% browser-equivalent zoom').toBe(false);

  await page.goto('/orders/KBR-240725-018');
  for (const [label, value] of [
    ['Status sewa', 'Sudah dipesan'],
    ['Status pembayaran', 'DP terbayar'],
    ['Status pengantaran', 'Ambil di toko'],
  ]) {
    const statusCard = page.locator('section[aria-label="Status pesanan"] > *').filter({ hasText: label });
    await expect(statusCard).toContainText(value);
  }

  await expect(page.getByRole('button', { name: /Batalkan pesanan/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Semua pesanan' })).toBeVisible();
});

test('admin dashboard keeps its established tokens, asset, and operational layout', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== 'desktop-chrome', 'One desktop project records the admin comparison.');

  await page.route('**/api/auth/me', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ id: 1, username: 'qa-admin', role: 'admin' }),
  }));
  await page.route('**/api/settings', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      app_name: 'Kostum Tari Bu Risna',
      app_tagline: 'Inventory & Rental Management',
      app_logo: '/kbr-logo.svg',
    }),
  }));
  await page.route('**/api/stats/dashboard', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        total_active_rents: 4,
        total_clients: 12,
        stock_utilization: 68.5,
        overdue_returns: [],
        upcoming_pickups: [],
        upcoming_returns: [],
        top_costumes: [],
      },
    }),
  }));
  await page.route('**/api/stats/revenue**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));
  await page.route('**/api/notifications**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));

  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Ringkasan Operasional' })).toBeVisible();
  await expect(page.locator('img[src="/kbr-logo.svg"]').first()).toBeVisible();

  const adminTokens = await page.locator('.layout-root').evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      primary: styles.getPropertyValue('--primary').trim(),
      background: styles.getPropertyValue('--background').trim(),
    };
  });
  expect(adminTokens).toEqual({ primary: '#4f46e5', background: '#f9fafb' });

  await testInfo.attach('admin-dashboard-reference', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
