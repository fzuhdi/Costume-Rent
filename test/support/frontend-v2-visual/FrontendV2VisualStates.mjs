export const adminRoutes = {
  login: {
    path: '/admin/login',
    ready: '.staff-login-page',
  },
  requests: {
    path: '/admin/requests',
    ready: '.request-mobile-list, .desktop-request-queue',
    detailSelector: '.request-mobile-card .request-card-summary, .request-queue-card',
    detailReady: '.request-mobile-detail-view, .desktop-record-panel',
  },
  rentals: {
    path: '/admin/rentals',
    ready: '.rental-list-view',
    detailSelector: '.rental-record-card',
    detailReady: '.rental-detail-view',
  },
  catalogue: {
    path: '/admin/catalogue',
    ready: '.catalogue-record, .management-window',
    detailSelector: '.catalogue-record',
    detailIndex: 0,
    detailReady: '.catalogue-editor-panel',
  },
  clients: {
    path: '/admin/clients',
    ready: '.client-card, .management-window',
    detailSelector: '.client-card strong',
    detailReady: '.clients-detail-panel',
  },
  settings: {
    path: '/admin/settings',
    ready: '.settings-form',
  },
};

export const customerRoutes = {
  home: {
    path: '/',
    ready: '.customer-home-hero',
  },
  catalogue: {
    path: '/catalogue',
    ready: '.catalogue-page .product-grid, .catalogue-page .empty-state',
  },
  lookup: {
    path: '/lookup',
    ready: '.lookup-card',
  },
  checkout: {
    path: '/checkout',
    ready: '.checkout-route-page, .checkout-card',
  },
};

export function frontendV2VisualStates() {
  return [
    {
      name: 'customer-home',
      path: customerRoutes.home.path,
      ready: customerRoutes.home.ready,
    },
    {
      name: 'requests-list',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
    },
    {
      name: 'requests-notifications-open',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openNotifications(),
    },
    {
      name: 'requests-filters-open',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openRequestFilters(),
    },
    {
      name: 'requests-add-panel',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openRequestAddPanel(),
    },
    {
      name: 'requests-edit-dialog',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openRequestEditDialog(adminRoutes.requests),
    },
    {
      name: 'requests-reject-dialog',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openRequestRejectDialog(adminRoutes.requests),
    },
    {
      name: 'rentals-list',
      path: adminRoutes.rentals.path,
      ready: adminRoutes.rentals.ready,
    },
    {
      name: 'rentals-detail',
      path: adminRoutes.rentals.path,
      ready: adminRoutes.rentals.ready,
      action: async (app) => app.admin.openDetail(adminRoutes.rentals, 'rental detail'),
    },
    {
      name: 'rentals-payment-panel',
      path: adminRoutes.rentals.path,
      ready: adminRoutes.rentals.ready,
      action: async (app) => app.admin.showRentalPaymentPanel(adminRoutes.rentals),
    },
    {
      name: 'rentals-override-dialog',
      path: '/admin/rentals?status=completed',
      ready: adminRoutes.rentals.ready,
      action: async (app) => app.admin.openRentalOverrideDialog(adminRoutes.rentals),
    },
    {
      name: 'catalogue-list',
      path: adminRoutes.catalogue.path,
      ready: adminRoutes.catalogue.ready,
    },
    {
      name: 'catalogue-create-panel',
      path: adminRoutes.catalogue.path,
      ready: adminRoutes.catalogue.ready,
      action: async (app) => app.admin.openCatalogueCreatePanel(),
    },
    ...['details', 'variants', 'media', 'maintenance'].map((tab) => ({
      name: `catalogue-editor-${tab}-tab`,
      path: adminRoutes.catalogue.path,
      ready: adminRoutes.catalogue.ready,
      action: async (app) => app.admin.openCatalogueTab(adminRoutes.catalogue, tab),
    })),
    {
      name: 'catalogue-maintenance-add-panel',
      path: adminRoutes.catalogue.path,
      ready: adminRoutes.catalogue.ready,
      action: async (app) => app.admin.openCatalogueMaintenanceForm(adminRoutes.catalogue),
    },
    {
      name: 'catalogue-unsaved-switch-dialog',
      path: adminRoutes.catalogue.path,
      ready: adminRoutes.catalogue.ready,
      action: async (app) => app.admin.openCatalogueUnsavedSwitchDialog(adminRoutes.catalogue),
    },
    {
      name: 'clients-list',
      path: adminRoutes.clients.path,
      ready: adminRoutes.clients.ready,
    },
    {
      name: 'clients-add-panel',
      path: adminRoutes.clients.path,
      ready: adminRoutes.clients.ready,
      action: async (app) => app.admin.openClientAddPanel(),
    },
    {
      name: 'clients-detail-bottomsheet',
      path: adminRoutes.clients.path,
      ready: adminRoutes.clients.ready,
      action: async (app) => app.admin.openClientDetail(adminRoutes.clients),
    },
    {
      name: 'clients-edit-panel',
      path: adminRoutes.clients.path,
      ready: adminRoutes.clients.ready,
      action: async (app) => app.admin.openClientEditPanel(adminRoutes.clients),
    },
    {
      name: 'settings-savebar-active',
      path: adminRoutes.settings.path,
      ready: adminRoutes.settings.ready,
      action: async (app) => app.admin.activateSettingsSavebar(),
    },
    {
      name: 'staff-login',
      path: adminRoutes.requests.path,
      ready: adminRoutes.requests.ready,
      action: async (app) => app.admin.openStaffLogin(adminRoutes.login),
    },
    {
      name: 'customer-catalogue-list',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
    },
    {
      name: 'customer-catalogue-region-filter',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.openCatalogueRegionFilter(),
    },
    {
      name: 'customer-catalogue-more-filter',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => {
        await app.click('[data-filter-key="more"]', 'customer catalogue more filter');
        await app.waitForUi('.catalogue-filter-panel');
      },
    },
    {
      name: 'customer-catalogue-date-error',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.showCatalogueDateError(),
    },
    {
      name: 'customer-catalogue-date-sync-prompt',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.showDateSyncPrompt(),
    },
    {
      name: 'customer-cart-sheet',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.openCartSheet(),
    },
    {
      name: 'customer-product-detail',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.openFirstProduct(),
    },
    {
      name: 'customer-product-favorite-feedback',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.showFavoriteFeedback(),
    },
    {
      name: 'customer-product-cart-sheet',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.addProductToCart(),
    },
    {
      name: 'customer-checkout-modal',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.openCheckoutModal(),
    },
    {
      name: 'customer-checkout-form-errors',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.showCheckoutContactErrors(),
    },
    {
      name: 'customer-checkout-submit-loading',
      path: customerRoutes.catalogue.path,
      ready: customerRoutes.catalogue.ready,
      action: async (app) => app.customer.showCheckoutSubmitLoading(),
    },
    {
      name: 'customer-lookup-form',
      path: customerRoutes.lookup.path,
      ready: customerRoutes.lookup.ready,
    },
    {
      name: 'customer-checkout-route',
      path: customerRoutes.checkout.path,
      ready: customerRoutes.checkout.ready,
    },
    {
      name: 'customer-lookup-result',
      path: customerRoutes.lookup.path,
      ready: customerRoutes.lookup.ready,
      action: async (app) => app.customer.submitLookup(),
    },
    {
      name: 'customer-lookup-recovery-open',
      path: customerRoutes.lookup.path,
      ready: customerRoutes.lookup.ready,
      action: async (app) => app.customer.openLookupRecovery(),
    },
    {
      name: 'customer-lookup-change-select-open',
      path: customerRoutes.lookup.path,
      ready: customerRoutes.lookup.ready,
      action: async (app) => app.customer.openLookupChangeSelect(),
    },
  ];
}
