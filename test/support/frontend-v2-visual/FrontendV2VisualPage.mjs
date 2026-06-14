export const viewportProfiles = [
  {
    name: 'mobile',
    filePrefix: '',
    contextOptions: {
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
  },
  {
    name: 'tablet',
    filePrefix: 'tablet',
    contextOptions: {
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
  },
  {
    name: 'desktop',
    filePrefix: 'desktop',
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
];

export async function seedStorage(context) {
  await context.addInitScript(() => {
    const fixedNow = new Date('2026-06-08T09:00:00.000Z').valueOf();
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length > 0 ? args : [fixedNow]));
      }

      static now() {
        return fixedNow;
      }
    }
    FixedDate.UTC = RealDate.UTC;
    FixedDate.parse = RealDate.parse;
    window.Date = FixedDate;

    const realSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (handler, timeout, ...args) => realSetTimeout(handler, timeout === 250 ? 1200 : timeout, ...args);

    window.localStorage.setItem('cr-locale', 'id');
    window.localStorage.setItem('cr-v2-staff-session', JSON.stringify({ isAuthenticated: true, username: 'visual-audit' }));
  });
}

export class FrontendV2VisualPage {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.admin = new AdminVisualPage(this);
    this.customer = new CustomerVisualPage(this);
  }

  async goto(targetPath, readySelector) {
    await this.page.goto(new URL(targetPath, this.baseUrl).toString());
    await this.settle(readySelector);
    await this.disableAnimations();
  }

  async settle(selector) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForUi(selector, 10000);
    await this.page.waitForTimeout(350);
  }

  async waitForUi(selector, timeout = 7000) {
    await this.visibleLocator(selector, selector, timeout);
    await this.page.waitForTimeout(250);
  }

  async disableAnimations() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    }).catch(() => {});
  }

  async click(targets, label, options = {}) {
    const locator = await this.visibleLocator(targets, label);
    await locator.click(options);
  }

  async fill(targets, value, label) {
    const locator = await this.visibleLocator(targets, label);
    await locator.fill(value);
  }

  async fillNth(selector, index, value, label) {
    const locator = this.page.locator(selector).nth(index);
    if (!(await locator.count())) throw new Error(`${label}: selector not found (${selector})`);
    await locator.fill(value);
  }

  async visibleLocator(targets, label, timeout = 2500) {
    const selectors = Array.isArray(targets) ? targets : [targets];
    const start = Date.now();

    do {
      for (const selector of selectors) {
        const locator = this.page.locator(selector);
        const count = await locator.count();
        for (let index = 0; index < count; index += 1) {
          const candidate = locator.nth(index);
          if (await candidate.isVisible().catch(() => false)) return candidate;
        }
      }

      await this.page.waitForTimeout(100);
    } while (Date.now() - start < timeout);

    throw new Error(`${label}: visible selector not found (${selectors.join(' | ')})`);
  }

  async scrollLast(selector, label) {
    const locator = this.page.locator(selector);
    const count = await locator.count();
    if (!count) throw new Error(`${label}: selector not found (${selector})`);
    await locator.nth(count - 1).scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(250);
  }
}

class AdminVisualPage {
  constructor(app) {
    this.app = app;
  }

  async openNotifications() {
    await this.app.click('.notification-nav-button', 'admin notifications');
    await this.app.waitForUi('.notification-popover-panel');
  }

  async openDetail(route, label) {
    const targets = Array.isArray(route.detailSelector) ? route.detailSelector : [route.detailSelector];
    const countSelector = targets.join(', ');
    if (!(await this.app.page.locator(countSelector).count())) {
      throw new Error(`${label}: no detail target found (${countSelector})`);
    }

    const visibleTargets = [];
    for (const selector of targets) {
      const locator = this.app.page.locator(selector);
      const count = await locator.count();
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (await candidate.isVisible().catch(() => false)) visibleTargets.push(candidate);
      }
    }

    if (!visibleTargets.length) throw new Error(`${label}: no visible detail target found (${countSelector})`);
    const detailIndex = Math.min(route.detailIndex ?? 0, Math.max(0, visibleTargets.length - 1));
    await visibleTargets[detailIndex].click();
    await this.app.waitForUi(route.detailReady);
  }

  async openRequestFilters() {
    await this.app.click('.view-tools button', 'request filter and sort');
    await this.app.waitForUi('.request-filter-sheet');
  }

  async openRequestAddPanel() {
    await this.app.click(['.mobile-fab', '.desktop-create-action'], 'request add panel');
    await this.app.waitForUi('#request-add-panel');
  }

  async openRequestEditDialog(route) {
    await this.openDetail(route, 'request edit dialog detail');
    await this.app.click([
      '.request-detail-actionbar button:has-text("Ubah")',
      '.request-detail-actionbar button:has-text("Edit")',
      '.desktop-record-panel .record-actions button:has-text("Ubah")',
      '.desktop-record-panel .record-actions button:has-text("Edit")',
    ], 'request edit dialog');
    await this.app.waitForUi('.dialog-content');
  }

  async openRequestRejectDialog(route) {
    await this.openDetail(route, 'request reject dialog detail');
    await this.app.click([
      '.request-detail-actionbar .danger-action',
      '.desktop-record-panel .record-actions .danger-action',
    ], 'request reject dialog');
    await this.app.waitForUi('.dialog-content');
  }

  async showRentalPaymentPanel(route) {
    await this.openDetail(route, 'rental payment panel detail');
    await this.app.scrollLast('.content-panel.compact-panel', 'rental payment panel');
  }

  async openRentalOverrideDialog(route) {
    await this.openDetail(route, 'rental override dialog detail');
    await this.app.click([
      '.ghost-button:has-text("Override")',
      '.ghost-button:has-text("Override admin")',
    ], 'rental override dialog');
    await this.app.waitForUi('.dialog-content');
  }

  async openCatalogueCreatePanel() {
    await this.app.click(['.mobile-fab', '.desktop-create-action'], 'catalogue create panel');
    await this.app.waitForUi('#catalogue-create-panel');
  }

  async openCatalogueTab(route, tab) {
    await this.openDetail(route, `catalogue ${tab} tab detail`);
    await this.clickCatalogueTab(tab, `catalogue ${tab} tab`);
  }

  async openCatalogueMaintenanceForm(route) {
    await this.openCatalogueTab(route, 'maintenance');
    await this.app.click(activeCatalogueChildSelector([
      '.outline-button:has-text("Tambah blok")',
      '.outline-button:has-text("Add block")',
    ]), 'catalogue maintenance add');
    await this.app.waitForUi('.maintenance-form');
  }

  async openCatalogueUnsavedSwitchDialog(route) {
    await this.openCatalogueTab(route, 'details');
    await this.app.fill(activeCatalogueChildSelector(['input']), 'Visual audit draft', 'catalogue product name');
    await this.app.click('.catalogue-editor-close', 'catalogue editor close');
    const switchTargets = this.app.page.locator('.catalogue-record');
    if ((await switchTargets.count()) > 1) {
      await switchTargets.nth(1).click();
    } else {
      await this.app.click('.catalogue-record', 'catalogue switch target');
    }
    await this.app.waitForUi('.dialog-content');
  }

  async clickCatalogueTab(tab, label) {
    const tabOrder = {
      details: 0,
      variants: 1,
      media: 2,
      maintenance: 3,
    };
    const tabIndex = tabOrder[tab];
    const tabTargets = this.app.page.locator('.catalogue-tab-trigger');
    const tabCount = await tabTargets.count();
    if (tabIndex === undefined || tabCount <= tabIndex) throw new Error(`${label}: tab not found (${tab})`);
    await tabTargets.nth(tabIndex).click();
    await this.app.page.waitForTimeout(250);
  }

  async openClientAddPanel() {
    await this.app.click(['.mobile-fab', '.desktop-create-action'], 'client add panel');
    await this.app.waitForUi('#client-add-panel');
  }

  async openClientDetail(route) {
    await this.openDetail(route, 'client detail');
  }

  async openClientEditPanel(route) {
    await this.openClientDetail(route);
    const editButton = await this.app.visibleLocator([
      '.clients-detail-panel .outline-button:has-text("Ubah")',
      '.clients-detail-panel .outline-button:has-text("Edit")',
    ], 'client edit panel');
    await editButton.evaluate((button) => button.click());
    await this.app.waitForUi('.clients-detail-panel .content-panel');
  }

  async activateSettingsSavebar() {
    await this.app.fill('#settings-brand-name', 'Costume Rental Visual', 'settings brand name');
    await this.app.waitForUi('.settings-savebar.is-active');
  }

  async openStaffLogin(route) {
    const topbarLogout = this.app.page.locator('.admin-logout-button').first();
    if (await topbarLogout.isVisible().catch(() => false)) {
      await topbarLogout.click();
    } else {
      await this.app.click('.admin-menu-button', 'staff menu');
      await this.app.waitForUi('#admin-sidebar-menu.open, .ops-sidebar.open');
      await this.app.click('.sidebar-logout-button', 'staff logout');
    }
    await this.app.waitForUi(route.ready);
  }
}

class CustomerVisualPage {
  constructor(app) {
    this.app = app;
  }

  async openCatalogueRegionFilter() {
    await this.app.click('[data-filter-key="region"]', 'customer catalogue region filter');
    await this.app.waitForUi('.catalogue-filter-panel');
    await this.app.click('.catalogue-filter-panel button:has-text("Bali")', 'customer catalogue Bali filter');
    await this.app.waitForUi('.product-grid, .empty-state');
  }

  async showDateSyncPrompt() {
    await this.addProductToCart();
    await this.app.click('.request-sheet-content .sheet-header .icon-button', 'close cart before date sync');
    await this.app.goto('/catalogue', '.catalogue-page');
    await this.app.fillNth('.search-field input[type="date"]', 0, '2026-06-13', 'customer start date');
    await this.app.fillNth('.search-field input[type="date"]', 1, '2026-06-16', 'customer end date');
    await this.app.click('.search-panel .primary-button', 'customer date apply');
    await this.app.waitForUi('.inline-alert.warning');
  }

  async showCatalogueDateError() {
    await this.app.fillNth('.search-field input[type="date"]', 0, '2026-06-18', 'customer invalid start date');
    await this.app.fillNth('.search-field input[type="date"]', 1, '2026-06-12', 'customer invalid end date');
    await this.app.click('.search-panel .primary-button', 'customer invalid date apply');
    await this.app.waitForUi('.validation-message');
  }

  async openCartSheet() {
    await this.app.click('.cart-button', 'customer cart sheet');
    await this.app.waitForUi('.request-sheet-content');
  }

  async openFirstProduct() {
    await this.app.click('.product-card-link', 'customer product detail');
    await this.app.waitForUi('.product-detail');
  }

  async showFavoriteFeedback() {
    await this.openFirstProduct();
    await this.app.click('.favorite-button', 'customer favorite');
    await this.app.waitForUi('.favorite-feedback');
  }

  async addProductToCart() {
    await this.openFirstProduct();
    await this.app.click([
      '.detail-cta-bar .secondary-button:not([disabled])',
      '.product-detail-mobile-bar .secondary-button:not([disabled])',
    ], 'customer add to cart');
    await this.app.waitForUi('.request-sheet-content');
  }

  async openCheckoutModal() {
    await this.addProductToCart();
    await this.app.click('.request-sheet-content .sheet-actions .primary-button', 'customer checkout modal');
    await this.app.waitForUi('.request-sheet-content.checkout-active .checkout-card');
  }

  async showCheckoutContactErrors() {
    await this.openCheckoutModal();
    await this.app.click([
      '.request-sheet-content.checkout-active .checkout-submit-inline .primary-button',
      '.request-sheet-content.checkout-active .checkout-mobile-submitbar .primary-button',
    ], 'checkout contact validation');
    await this.app.waitForUi('.request-sheet-content.checkout-active .validation-message');
  }

  async showCheckoutSubmitLoading() {
    await this.openCheckoutModal();
    await this.app.fill('.request-sheet-content.checkout-active input[autocomplete="name"]', 'Visual Customer', 'checkout customer name');
    await this.app.fill('.request-sheet-content.checkout-active input[autocomplete="tel"]', '+62 812 0000 0999', 'checkout customer phone');
    await this.app.click([
      '.request-sheet-content.checkout-active .checkout-submit-inline .primary-button',
      '.request-sheet-content.checkout-active .checkout-mobile-submitbar .primary-button',
    ], 'checkout next fulfillment');
    await this.app.waitForUi('.request-sheet-content.checkout-active .radio-card');
    await this.app.click([
      '.request-sheet-content.checkout-active .checkout-submit-inline .primary-button',
      '.request-sheet-content.checkout-active .checkout-mobile-submitbar .primary-button',
    ], 'checkout next review');
    await this.app.waitForUi('.request-sheet-content.checkout-active .checkout-review-grid');
    await this.app.click([
      '.request-sheet-content.checkout-active .checkout-submit-inline .primary-button',
      '.request-sheet-content.checkout-active .checkout-mobile-submitbar .primary-button',
    ], 'checkout submit loading');
    await this.app.waitForUi('.request-sheet-content.checkout-active button:has-text("Memuat"), .request-sheet-content.checkout-active button:has-text("Loading")', 2000);
  }

  async submitLookup() {
    await this.app.click('.lookup-fields .secondary-button', 'customer lookup submit');
    await this.app.waitForUi('.lookup-feedback-region');
  }

  async openLookupRecovery() {
    await this.app.click('.lookup-recovery .text-button', 'customer lookup recovery');
    await this.app.waitForUi('.recovery-fields');
  }

  async openLookupChangeSelect() {
    await this.submitLookup();
    await this.app.click('.change-request-form .select-trigger', 'customer change select');
    await this.app.waitForUi('.select-content');
  }
}

function activeCatalogueChildSelector(selectors) {
  return selectors
    .flatMap((selector) => [
      `.catalogue-tab-panel[data-state="active"] ${selector}`,
      `.catalogue-tab-panel:not([hidden]) ${selector}`,
    ])
    .join(', ');
}
