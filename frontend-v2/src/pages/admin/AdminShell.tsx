import { AlertTriangle, Bell, Clock, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import { Link, Navigate, NavLink, useLocation, useParams } from 'react-router-dom';
import { adminNav, type AdminSectionId } from '../../constants/ui';
import AdminBottomSheet from '../../components/admin/common/AdminBottomSheet';
import { AdminAlertBanner, AdminMetricStrip } from '../../components/admin/common/AdminManagement';
import { AdminNotificationList } from '../../components/admin/common/AdminNotifications';
import { LocaleButton, Metric, StatusPill } from '../../components/shared';
import { getAdminCopy, getAdminMetrics, getAdminTitle, resolveTagline } from '../../lib/rental-utils';
import CatalogueAdmin from './CatalogueAdmin';
import ClientsAdmin from './ClientsAdmin';
import RentalsAdmin from './RentalsAdmin';
import RequestsAdmin from './RequestsAdmin';
import SettingsAdmin from './SettingsAdmin';
import type { AdminPageProps } from '../../types/app';
import type { Notification, TFunction } from '../../types/domain';

type AdminMetrics = ReturnType<typeof getAdminMetrics>;

export default function AdminShell(props: AdminPageProps) {
  const { section = 'requests' } = useParams<{ section?: AdminSectionId | 'notifications' }>();
  const location = useLocation();
  const { locale, setLocale, t, settings, rentals, notifications, setStaffSession } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.remove('customer-page');
    document.body.classList.add('admin-page');
    document.title = t('document.adminTitle');
  }, [t, section]);

  const metrics = getAdminMetrics(rentals);
  const activeNotifications = notifications.filter((notification) => notification.resolved !== true);
  const unresolvedNotifications = activeNotifications.length;
  const isOperationalSection = section === 'requests' || section === 'rentals';
  const hasSelectedOrder = isOperationalSection && new URLSearchParams(location.search).has('reference');

  if (section === 'notifications') {
    return <Navigate to="/admin/requests" replace />;
  }

  return (
    <>
      <a className="skip-link" href="#admin-content">
        {t('common.skip')}
      </a>
      <div className="ops-shell">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          returnFocusRef={sidebarTriggerRef}
          locale={locale}
          setLocale={setLocale}
          settings={settings}
          setStaffSession={setStaffSession}
          t={t}
        />

        <main className={`ops-main ${hasSelectedOrder ? 'mobile-detail-active' : ''}`} id="admin-content">
          <AdminTopbar
            section={section}
            t={t}
            locale={locale}
            setLocale={setLocale}
            setStaffSession={setStaffSession}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarTriggerRef={sidebarTriggerRef}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            activeNotifications={activeNotifications}
            unresolvedNotifications={unresolvedNotifications}
          />

          <section className="mobile-page-heading" aria-label={getAdminTitle(section, t)}>
            <span className="section-kicker">{t('admin.header.kicker')}</span>
            <h1>{getAdminTitle(section, t)}</h1>
            <p>{getAdminCopy(section, t)}</p>
          </section>

          {isOperationalSection ? <SectionOperationsSummary section={section} metrics={metrics} t={t} /> : null}

          {section === 'requests' ? <RequestsAdmin {...props} /> : null}
          {section === 'rentals' ? <RentalsAdmin {...props} /> : null}
          {section === 'catalogue' ? <CatalogueAdmin {...props} /> : null}
          {section === 'clients' ? <ClientsAdmin {...props} /> : null}
          {section === 'settings' ? <SettingsAdmin {...props} /> : null}
        </main>
        <AdminMobileTabbar t={t} />
      </div>
    </>
  );
}

type AdminSidebarProps = Pick<AdminPageProps, 'locale' | 'setLocale' | 'settings' | 'setStaffSession' | 't'> & {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

function AdminSidebar({ open, onClose, returnFocusRef, locale, setLocale, settings, setStaffSession, t }: AdminSidebarProps) {
  const inline = useMediaQuery('(min-width: 820px)');

  useEffect(() => {
    if (inline && open) onClose();
  }, [inline, open, onClose]);

  return (
    <AdminBottomSheet
      as="aside"
      id="admin-sidebar-menu"
      open={open}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      mountWhenClosed={inline}
      modal={!inline}
      className="ops-sidebar admin-sidebar"
      backdropClassName="sidebar-backdrop"
      ariaLabel={t('admin.sidebar.aria')}
      closeLabel={t('common.close')}
    >
      <div className="sidebar-head">
        <Link className="brand" to="/admin/requests" aria-label={t('brand.adminAria')}>
          <span className="brand-mark">CR</span>
          <span>
            <strong>{settings.brandName}</strong>
            <small>{resolveTagline(settings, 'staff', t)}</small>
          </span>
        </Link>
        <button className="sidebar-close-button" type="button" aria-label={t('common.close')} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>
      <nav className="workspace-nav">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to={item.path} key={item.id} onClick={onClose}>
              <Icon aria-hidden="true" />
              <span>{t(item.key)}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-utility-row">
        <LocaleButton locale={locale} setLocale={setLocale} t={t} />
        <button className="outline-button sidebar-logout-button" type="button" onClick={() => setStaffSession({ isAuthenticated: false, username: '' })}>
          <LogOut aria-hidden="true" />
          <span>{t('staff.logout')}</span>
        </button>
      </div>
    </AdminBottomSheet>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const syncMatches = () => setMatches(mediaQuery.matches);
    syncMatches();
    mediaQuery.addEventListener('change', syncMatches);
    return () => mediaQuery.removeEventListener('change', syncMatches);
  }, [query]);

  return matches;
}

type AdminTopbarProps = Pick<AdminPageProps, 'locale' | 'setLocale' | 'setStaffSession' | 't'> & {
  section: AdminSectionId | 'notifications' | undefined;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarTriggerRef: RefObject<HTMLButtonElement | null>;
  notificationsOpen: boolean;
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>;
  activeNotifications: Notification[];
  unresolvedNotifications: number;
};

function AdminTopbar({
  section,
  t,
  locale,
  setLocale,
  setStaffSession,
  sidebarOpen,
  setSidebarOpen,
  sidebarTriggerRef,
  notificationsOpen,
  setNotificationsOpen,
  activeNotifications,
  unresolvedNotifications,
}: AdminTopbarProps) {
  return (
    <header className="ops-header admin-topbar">
      <div className="ops-title-row">
        <div>
          <span className="section-kicker">{t('admin.header.kicker')}</span>
          <h1>{getAdminTitle(section, t)}</h1>
          <p>{getAdminCopy(section, t)}</p>
        </div>
      </div>
      <div className="ops-header-actions">
        <LocaleButton locale={locale} setLocale={setLocale} t={t} />
        <NotificationPopover
          open={notificationsOpen}
          setOpen={setNotificationsOpen}
          notifications={activeNotifications}
          unresolvedCount={unresolvedNotifications}
          t={t}
        />
        <button
          ref={sidebarTriggerRef}
          className="outline-button admin-menu-button"
          type="button"
          aria-label={t('admin.sidebar.open')}
          aria-controls="admin-sidebar-menu"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((current) => !current)}
        >
          <Menu aria-hidden="true" />
        </button>
        <button className="outline-button admin-logout-button" type="button" onClick={() => setStaffSession({ isAuthenticated: false, username: '' })}>
          <LogOut aria-hidden="true" />
          <span>{t('staff.logout')}</span>
        </button>
      </div>
    </header>
  );
}

type NotificationPopoverProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  notifications: Notification[];
  unresolvedCount: number;
  t: TFunction;
};

function NotificationPopover({ open, setOpen, notifications, unresolvedCount, t }: NotificationPopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  return (
    <div className="notification-popover admin-notification-popover">
      <button
        ref={triggerRef}
        className={`notification-nav-button ${open ? 'active' : ''}`}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('admin.notifications.headerAria', { count: unresolvedCount })}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="notification-nav-button-icon-stack" aria-hidden="true">
          <Bell className="notification-nav-button-icon bell" />
          <X className="notification-nav-button-icon close" />
        </span>
        {unresolvedCount > 0 ? <b>{unresolvedCount}</b> : null}
      </button>
      <AdminBottomSheet
        id={panelId}
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
        role="dialog"
        className="notification-popover-panel"
        backdropClassName="notification-popover-scrim"
        ariaLabel={t('admin.notifications.open')}
        closeLabel={t('common.close')}
      >
        <div className="notification-list">
          <div className="notification-popover-head">
            <strong>{t('admin.notifications.short')}</strong>
            <span>{t('admin.notifications.unresolvedCount', { count: unresolvedCount })}</span>
            <button className="icon-button notification-popover-close" type="button" aria-label={t('common.close')} onClick={() => setOpen(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
          <AdminNotificationList notifications={notifications} t={t} onSelect={() => setOpen(false)} />
        </div>
      </AdminBottomSheet>
    </div>
  );
}

function AdminMobileTabbar({ t }: { t: TFunction }) {
  return (
    <nav className="mobile-admin-tabbar admin-mobile-tabbar" aria-label={t('nav.adminAria')}>
      {adminNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink to={item.path} key={item.id}>
            <Icon aria-hidden="true" />
            <span>{t(item.mobileKey ?? item.key)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

type SectionOperationsSummaryProps = {
  section: AdminSectionId;
  metrics: AdminMetrics;
  t: TFunction;
};

function SectionOperationsSummary({ section, metrics, t }: SectionOperationsSummaryProps) {
  if (section === 'requests') {
    return (
      <section className="ops-operations-summary intake-summary" data-section="requests" aria-label={t('admin.metrics.aria')}>
        <AdminAlertBanner>
          <StatusPill value={t('admin.requests.summaryBadge')} t={t} tone="warning" icon={Clock} />
          <p>{t('admin.requests.summaryCopy')}</p>
        </AdminAlertBanner>
        <AdminMetricStrip>
          <Metric tone="neutral" value={metrics.requested} title={t('admin.metrics.new')} copy={t('admin.metrics.newCopy')} to="/admin/requests?tab=all&sort=stale" />
          <Metric tone="warning" value={metrics.staleRequests} title={t('admin.metrics.stale')} copy={t('admin.metrics.staleCopy')} to="/admin/requests?tab=stale&sort=stale" />
          <Metric tone="success" value={metrics.deliveryRequests} title={t('admin.metrics.delivery')} copy={t('admin.metrics.deliveryCopy')} to="/admin/requests?tab=delivery&sort=stale" />
        </AdminMetricStrip>
      </section>
    );
  }

  return (
    <section className="ops-operations-summary lifecycle-summary" data-section="rentals" aria-label={t('admin.metrics.aria')}>
      <AdminAlertBanner>
        <StatusPill value={t('admin.rentals.summaryBadge')} t={t} tone="warning" icon={AlertTriangle} />
        <p>{t('admin.rentals.summaryCopy')}</p>
      </AdminAlertBanner>
      <AdminMetricStrip>
        <Metric tone="success" value={metrics.ready} title={t('admin.metrics.pickup')} copy={t('admin.metrics.pickupCopy')} to="/admin/rentals?status=ready" />
        <Metric tone="neutral" value={metrics.outWithCustomer} title={t('admin.metrics.overdue')} copy={t('admin.metrics.overdueCopy')} to="/admin/rentals?status=on_rent" />
        <Metric tone="warning" value={metrics.returnedOpen} title={t('admin.metrics.returned')} copy={t('admin.metrics.returnedCopy')} to="/admin/rentals?status=returned" />
        <Metric tone="success" value={metrics.completed} title={t('admin.metrics.completed')} copy={t('admin.metrics.completedCopy')} to="/admin/rentals?status=completed" />
      </AdminMetricStrip>
    </section>
  );
}
