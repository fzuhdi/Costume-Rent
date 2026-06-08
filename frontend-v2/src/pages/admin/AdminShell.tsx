import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Bell, ChevronRight, Clock, Info, LogOut, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useLocation, useParams } from 'react-router-dom';
import { adminNav, type AdminSectionId } from '../../constants/ui';
import AdminBottomSheet from '../../components/admin/common/AdminBottomSheet';
import { LocaleButton, Metric, NotificationRow, StatusPill } from '../../components/shared';
import { getAdminCopy, getAdminMetrics, getAdminTitle, localizedData, resolveTagline } from '../../lib/rental-utils';
import CatalogueAdmin from './CatalogueAdmin';
import ClientsAdmin from './ClientsAdmin';
import RentalsAdmin from './RentalsAdmin';
import RequestsAdmin from './RequestsAdmin';
import SettingsAdmin from './SettingsAdmin';
import type { AdminPageProps } from '../../types/app';
import type { Notification, Tone, TFunction } from '../../types/domain';

type AdminMetrics = ReturnType<typeof getAdminMetrics>;

export default function AdminShell(props: AdminPageProps) {
  const { section = 'requests' } = useParams<{ section?: AdminSectionId | 'notifications' }>();
  const location = useLocation();
  const { locale, setLocale, t, settings, rentals, notifications, setStaffSession } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
        <AdminBottomSheet
          as="aside"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          mountWhenClosed
          modal={false}
          className="ops-sidebar"
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
            <button className="sidebar-close-button" type="button" aria-label={t('common.close')} onClick={() => setSidebarOpen(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
          <nav className="workspace-nav">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to={item.path} key={item.id} onClick={() => setSidebarOpen(false)}>
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

        <main className={`ops-main ${hasSelectedOrder ? 'mobile-detail-active' : ''}`} id="admin-content">
          <header className="ops-header">
            <div className="ops-title-row">
              <div>
                <span className="section-kicker">{t('admin.header.kicker')}</span>
                <h1>{getAdminTitle(section, t)}</h1>
                <p>{getAdminCopy(section, t)}</p>
              </div>
            </div>
            <div className="ops-header-actions">
              <LocaleButton locale={locale} setLocale={setLocale} t={t} />
              <div className="notification-popover">
                <button
                  className={`notification-nav-button ${notificationsOpen ? 'active' : ''}`}
                  type="button"
                  aria-expanded={notificationsOpen}
                  aria-label={t('admin.notifications.headerAria', { count: unresolvedNotifications })}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <span className="notification-nav-button-icon-stack" aria-hidden="true">
                    <Bell className="notification-nav-button-icon bell" />
                    <X className="notification-nav-button-icon close" />
                  </span>
                  {unresolvedNotifications > 0 ? <b>{unresolvedNotifications}</b> : null}
                </button>
                <AdminBottomSheet
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  role="dialog"
                  className="notification-popover-panel"
                  backdropClassName="notification-popover-scrim"
                  ariaLabel={t('admin.notifications.open')}
                  closeLabel={t('common.close')}
                >
                    <div className="notification-popover-head">
                      <strong>{t('admin.notifications.short')}</strong>
                      <span>{t('admin.notifications.unresolvedCount', { count: unresolvedNotifications })}</span>
                      <button className="icon-button notification-popover-close" type="button" aria-label={t('common.close')} onClick={() => setNotificationsOpen(false)}>
                        <X aria-hidden="true" />
                      </button>
                    </div>
                    {activeNotifications.length === 0 ? (
                      <p className="notification-empty">{t('admin.notifications.empty')}</p>
                    ) : (
                      activeNotifications.map((notification) => {
                        const Icon = notificationToneIcon(notification.tone);
                        return (
                          <NotificationRow
                            as={Link}
                            className="notification-popover-item"
                            to={notificationTarget(notification)}
                            key={notification.id}
                            onClick={() => setNotificationsOpen(false)}
                            tone={notification.tone}
                            severityLabel={t(`admin.notifications.tone.${notification.tone}`)}
                            severityIcon={Icon}
                            title={localizedData(notification, 'title', t)}
                            copy={localizedData(notification, 'copy', t)}
                          >
                            <span className="notification-context">
                              {t('admin.notifications.context')}
                              <ChevronRight aria-hidden="true" />
                            </span>
                          </NotificationRow>
                        );
                      })
                    )}
                </AdminBottomSheet>
              </div>
              <button className="outline-button admin-logout-button" type="button" onClick={() => setStaffSession({ isAuthenticated: false, username: '' })}>
                <LogOut aria-hidden="true" />
                <span>{t('staff.logout')}</span>
              </button>
            </div>
          </header>

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
        <nav className="mobile-admin-tabbar" aria-label={t('nav.adminAria')}>
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
      </div>
    </>
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
        <div className="ops-alert-banner">
          <StatusPill value={t('admin.requests.summaryBadge')} t={t} tone="warning" icon={Clock} />
          <p>{t('admin.requests.summaryCopy')}</p>
        </div>
        <div className="ops-metrics">
          <Metric tone="neutral" value={metrics.requested} title={t('admin.metrics.new')} copy={t('admin.metrics.newCopy')} to="/admin/requests?tab=all&sort=stale" />
          <Metric tone="warning" value={metrics.staleRequests} title={t('admin.metrics.stale')} copy={t('admin.metrics.staleCopy')} to="/admin/requests?tab=stale&sort=stale" />
          <Metric tone="success" value={metrics.deliveryRequests} title={t('admin.metrics.delivery')} copy={t('admin.metrics.deliveryCopy')} to="/admin/requests?tab=delivery&sort=stale" />
        </div>
      </section>
    );
  }

  return (
    <section className="ops-operations-summary lifecycle-summary" data-section="rentals" aria-label={t('admin.metrics.aria')}>
      <div className="ops-alert-banner">
        <StatusPill value={t('admin.rentals.summaryBadge')} t={t} tone="warning" icon={AlertTriangle} />
        <p>{t('admin.rentals.summaryCopy')}</p>
      </div>
      <div className="ops-metrics">
        <Metric tone="success" value={metrics.ready} title={t('admin.metrics.pickup')} copy={t('admin.metrics.pickupCopy')} to="/admin/rentals?status=ready" />
        <Metric tone="neutral" value={metrics.outWithCustomer} title={t('admin.metrics.overdue')} copy={t('admin.metrics.overdueCopy')} to="/admin/rentals?status=on_rent" />
        <Metric tone="warning" value={metrics.returnedOpen} title={t('admin.metrics.returned')} copy={t('admin.metrics.returnedCopy')} to="/admin/rentals?status=returned" />
        <Metric tone="success" value={metrics.completed} title={t('admin.metrics.completed')} copy={t('admin.metrics.completedCopy')} to="/admin/rentals?status=completed" />
      </div>
    </section>
  );
}

function notificationToneIcon(tone: Tone): LucideIcon {
  if (tone === 'danger') return AlertTriangle;
  if (tone === 'warning') return Clock;
  return Info;
}

function notificationTarget(notification: Notification): string {
  if (notification.targetRoute) return notification.targetRoute;
  const text = `${notification.titleId ?? ''} ${notification.copyId ?? ''} ${notification.titleEn ?? ''} ${notification.copyEn ?? ''}`;
  const reference = text.match(/CR-\d+/i)?.[0];
  if (reference) return `/admin/rentals?reference=${reference.toUpperCase()}`;
  if (notification.tone === 'warning') return '/admin/requests';
  return '/admin/rentals';
}
